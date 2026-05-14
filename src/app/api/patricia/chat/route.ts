import { NextRequest, NextResponse } from "next/server";
import { buildEffectiveLegalQuestion } from "@/lib/patricia-case-resolver";
import { buildPatriciaSkillRunPlan } from "@/lib/patricia-skills/registry";
import {
  PatriciaCaseExtraction,
  PatriciaDocumentExtraction,
  PatriciaEvidenceItem,
  PatriciaRouteDecision,
  PatriciaSource,
  buildCaseExtractionPrompt,
  buildDocumentExtractionPrompt,
  buildExtractionLedger,
  buildFinalLegalAnswerPrompt,
  buildPatriciaAnswerContract,
  buildVerificationPrompt,
  computeTrustScore,
  confidenceFromTrustScore,
  evidenceLedgerAsPrompt,
  makeEvidenceId,
  makeLocalDocumentSource,
  normalizeSources,
  parseLooseJson,
  routePatriciaTask,
  shouldAbstain,
} from "@/lib/patricia-legal-briefing";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_CONTEXT_CHARS = 60_000;

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };
type GroqSuccess = { content: string };
type GroqFailure = { error: string; detail?: string; status: number };

function chunkText(input: string, maxChars = 9000) {
  const normalized = input.replace(/\s+/g, " ").trim().slice(0, MAX_CONTEXT_CHARS);
  const chunks: string[] = [];
  for (let index = 0; index < normalized.length; index += maxChars) chunks.push(normalized.slice(index, index + maxChars));
  return chunks;
}

function wantsDeepAnswer(question: string) {
  return /full|detailed|comprehensive|brief|report|memo|explain|decode|tell me about|what happened|reasoning|orders|facts|issues|review|draft|triage|assessment/i.test(question);
}

function shouldExtractCase(question: string, route: PatriciaRouteDecision, localText: string, command: string) {
  if (command === "/law-student:case-brief") return true;
  if (route.documentType === "case-law" || route.task === "case-brief") return true;
  if (localText.trim().length > 500 && /court|judgment|ruling|appeal|petition|plaintiff|defendant|appellant|respondent/i.test(localText)) return true;
  return /case name|case number|citation|neutral citation|criminal appeal|civil appeal|petition|judgment|ruling|case brief|brief|holding|reasoning|orders|issues|full/i.test(question);
}

function shouldExtractDocument(command: string, localText: string) {
  if (!localText.trim()) return false;
  return !["/law-student:case-brief"].includes(command);
}

function buildCaseHeader(args: { caseTitle?: string; citation?: string; sourceUrl?: string }) {
  return [
    args.caseTitle ? `Title: ${args.caseTitle}` : "",
    args.citation ? `Citation: ${args.citation}` : "",
    args.sourceUrl ? `Source: ${args.sourceUrl}` : "",
  ].filter(Boolean).join("\n");
}

function buildDocumentLedger(extraction: PatriciaDocumentExtraction | null): PatriciaEvidenceItem[] {
  if (!extraction) return [];
  const items: PatriciaEvidenceItem[] = [];
  const metadata = extraction.document_metadata || {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" && value.trim()) {
      items.push({
        id: makeEvidenceId(items.length),
        claim: `${key.replace(/_/g, " ")}: ${value}`,
        support: "Extracted from the supplied legal/workflow document text.",
        source: "local document text",
        confidence: "high",
        kind: "document-fact",
        authority: "user-provided",
        risk: "low",
      });
    }
  }

  if (extraction.plain_summary?.trim()) {
    items.push({ id: makeEvidenceId(items.length), claim: "Plain summary", support: extraction.plain_summary, source: "local document text", confidence: "high", kind: "document-fact", authority: "user-provided", risk: "medium" });
  }

  const arrays: Array<[keyof PatriciaDocumentExtraction, string, PatriciaEvidenceItem["kind"], PatriciaEvidenceItem["risk"]]> = [
    ["key_points", "Key point", "document-fact", "medium"],
    ["rights", "Right", "statutory-text", "high"],
    ["obligations", "Obligation", "statutory-text", "high"],
    ["penalties", "Penalty", "statutory-text", "high"],
    ["deadlines", "Deadline", "document-fact", "high"],
    ["fees_or_costs", "Fee or cost", "document-fact", "high"],
    ["affected_groups", "Affected group", "policy-text", "medium"],
    ["unclear_or_missing_information", "Unclear or missing information", "unsupported", "medium"],
  ];

  for (const [key, label, kind, risk] of arrays) {
    const value = extraction[key];
    if (Array.isArray(value)) {
      for (const entry of value.filter(Boolean).slice(0, 12)) {
        items.push({ id: makeEvidenceId(items.length), claim: label, support: String(entry), source: "local document text", confidence: kind === "unsupported" ? "low" : "high", kind, authority: "user-provided", risk });
      }
    }
  }

  return items;
}

async function callGroq(messages: GroqMessage[], model: string, options?: { maxTokens?: number; jsonMode?: boolean }): Promise<GroqSuccess | GroqFailure> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: "Missing GROQ_API_KEY. Add it in Vercel Project Settings > Environment Variables.", status: 500 };

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.05,
      max_tokens: options?.maxTokens ?? 2400,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) return { error: "Groq request failed", detail: await response.text(), status: response.status };
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "" };
}

function systemPrompt(route: PatriciaRouteDecision, skillSystemAddendum: string) {
  return [
    "You are Patricia running a Claude-for-legal style workflow inside Patricia.",
    "The selected legal skill controls the workflow. Do not use old generic Patricia legal command behavior.",
    "Every output is a draft for attorney review, not legal advice or a legal conclusion.",
    "Use only supplied facts, supplied documents, and clearly labeled assumptions. Do not invent authorities or citations.",
    "When facts, documents, practice profile, or connector results are missing, continue with an intake-quality output and clearly list the missing inputs.",
    `Legacy compatibility route: ${route.task}. Document type: ${route.documentType}. Output mode: ${route.outputMode}.`,
    skillSystemAddendum,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const originalQuestion = String(body.question || "").trim();
    const previousMessages = Array.isArray(body.previousMessages) ? body.previousMessages : [];
    const suppliedDocumentText = String(body.caseText || body.documentText || body.localDocument || "").trim();
    const suppliedCaseTitle = String(body.caseTitle || body.documentTitle || "").trim();
    const suppliedCitation = String(body.citation || "").trim();
    const selectedCommand = String(body.command || body.selectedCommand || "").trim();
    const practiceProfile = String(body.practiceProfile || "").trim();
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!originalQuestion) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const effectiveQuestion = buildEffectiveLegalQuestion(originalQuestion, previousMessages);
    const skillPlan = buildPatriciaSkillRunPlan({
      command: selectedCommand,
      question: effectiveQuestion,
      documentText: suppliedDocumentText,
      documentTitle: suppliedCaseTitle,
      citation: suppliedCitation,
      practiceProfile,
      previousMessages,
    });

    const localText = suppliedDocumentText;
    const hasLocalText = localText.trim().length > 500;
    const caseHeader = buildCaseHeader({ caseTitle: suppliedCaseTitle, citation: suppliedCitation });
    const route = routePatriciaTask(`${skillPlan.normalizedQuestion}\n${caseHeader}\n${localText.slice(0, 6000)}`, hasLocalText);
    const chunks = chunkText(localText);
    const context = chunks.length > 1 ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n") : localText.slice(0, MAX_CONTEXT_CHARS);

    let extraction: PatriciaCaseExtraction | PatriciaDocumentExtraction | null = null;
    let extractionKind: "case" | "document" | "none" = "none";

    if (shouldExtractCase(effectiveQuestion, route, localText || caseHeader, skillPlan.selectedCommand.command)) {
      const extractInput = [caseHeader, context].filter(Boolean).join("\n\n");
      if (extractInput.trim()) {
        const extracted = await callGroq([
          { role: "system", content: systemPrompt(route, skillPlan.systemAddendum) },
          { role: "user", content: buildCaseExtractionPrompt(extractInput, route) },
        ], model, { maxTokens: 2400, jsonMode: true });

        if (!("error" in extracted)) {
          extraction = parseLooseJson<PatriciaCaseExtraction>(extracted.content);
          extractionKind = extraction ? "case" : "none";
        }
      }
    } else if (shouldExtractDocument(skillPlan.selectedCommand.command, localText)) {
      const extracted = await callGroq([
        { role: "system", content: systemPrompt(route, skillPlan.systemAddendum) },
        { role: "user", content: buildDocumentExtractionPrompt(context, route) },
      ], model, { maxTokens: 2400, jsonMode: true });

      if (!("error" in extracted)) {
        extraction = parseLooseJson<PatriciaDocumentExtraction>(extracted.content);
        extractionKind = extraction ? "document" : "none";
      }
    }

    const sources: PatriciaSource[] = normalizeSources(hasLocalText ? [makeLocalDocumentSource(localText, suppliedCaseTitle || "User-provided legal/workflow material")] : []);
    const ledgerItems: PatriciaEvidenceItem[] = [
      ...(extractionKind === "case" ? buildExtractionLedger(extraction as PatriciaCaseExtraction) : []),
      ...(extractionKind === "document" ? buildDocumentLedger(extraction as PatriciaDocumentExtraction) : []),
    ];

    for (const missing of skillPlan.missingInputs) {
      ledgerItems.push({
        id: makeEvidenceId(ledgerItems.length),
        claim: `Missing input: ${missing}`,
        support: "The selected Claude-for-legal style skill requires this before Patricia can produce a complete legal workflow output.",
        source: "workflow intake",
        confidence: "high",
        kind: "unsupported",
        authority: "workflow",
        risk: "high",
      });
    }

    const evidenceLedger = evidenceLedgerAsPrompt(ledgerItems);
    const preAnswerTrustScore = computeTrustScore(ledgerItems, sources);
    const preAnswerConfidence = confidenceFromTrustScore(preAnswerTrustScore);
    const planText = JSON.stringify({ selectedSkill: skillPlan.selectedCommand, intakeChecklist: skillPlan.intakeChecklist, missingInputs: skillPlan.missingInputs }, null, 2);
    const externalResearch = "No external legal research connector is connected in this Patricia build. Do not invent legal authorities. Mark any authority-dependent statement as requiring lawyer/source verification.";
    const sourceQuality = hasLocalText ? "user-provided-source-only" : "no-source-document-provided";

    const draft = await callGroq([
      { role: "system", content: systemPrompt(route, skillPlan.systemAddendum) },
      {
        role: "user",
        content: buildFinalLegalAnswerPrompt({
          question: `${skillPlan.normalizedQuestion}\n\n${skillPlan.userPromptAddendum}\n\nPRE_ANSWER_TRUST_SCORE: ${preAnswerTrustScore}\nPRE_ANSWER_CONFIDENCE: ${preAnswerConfidence}`,
          caseHeader,
          planText,
          sourceQuality,
          extraction,
          evidenceLedger,
          externalResearch,
        }),
      },
    ], model, { maxTokens: wantsDeepAnswer(effectiveQuestion) || hasLocalText ? 5200 : 3400 });

    if ("error" in draft) return NextResponse.json(draft, { status: draft.status || 500 });

    const verified = await callGroq([
      { role: "system", content: systemPrompt(route, skillPlan.systemAddendum) },
      { role: "user", content: buildVerificationPrompt(draft.content, `${skillPlan.userPromptAddendum}\n\nTRUST SCORE: ${preAnswerTrustScore}\nCONFIDENCE: ${preAnswerConfidence}\n\n${evidenceLedger}`) },
    ], model, { maxTokens: wantsDeepAnswer(effectiveQuestion) || hasLocalText ? 4200 : 2800 });

    const content = "error" in verified ? draft.content : verified.content;
    const contract = buildPatriciaAnswerContract({ route, answer: content, evidenceLedger: ledgerItems, sources, unsupportedClaims: [] });

    return NextResponse.json({
      content,
      route,
      skill: {
        command: skillPlan.selectedCommand.command,
        plugin: skillPlan.selectedCommand.plugin,
        agent: skillPlan.selectedCommand.agent,
        stage: skillPlan.selectedCommand.stage,
        risk: skillPlan.selectedCommand.risk,
        missingInputs: skillPlan.missingInputs,
        intakeChecklist: skillPlan.intakeChecklist,
      },
      answerMode: skillPlan.selectedCommand.command,
      sourceQuality,
      trustScore: contract.trustScore,
      confidence: contract.confidence,
      releaseSafe: contract.releaseSafe,
      shouldAbstain: shouldAbstain(contract),
      researchPlan: { selectedSkill: skillPlan.selectedCommand.command, missingInputs: skillPlan.missingInputs },
      extractionKind,
      extraction,
      evidenceLedger: ledgerItems,
      sources: sources.map((source) => ({ title: source.title, url: source.url, authority: source.authority, sourceName: source.sourceName, documentType: source.documentType, jurisdiction: source.jurisdiction })),
    });
  } catch (error) {
    console.error("Patricia chat route failed", error);
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
