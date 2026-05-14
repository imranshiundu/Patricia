import { NextRequest, NextResponse } from "next/server";
import { PatriciaResearchResult, researchEastAfricanLaw, sourcesAsPrompt } from "@/lib/patricia-research";
import { buildResearchPlan } from "@/lib/patricia-legal-router";
import { buildEffectiveLegalQuestion, resolveKnownCaseFromQuestion } from "@/lib/patricia-case-resolver";
import {
  PatriciaCaseExtraction,
  PatriciaDocumentExtraction,
  PatriciaDocumentType,
  PatriciaEvidenceItem,
  PatriciaJurisdiction,
  PatriciaRouteDecision,
  PatriciaSource,
  buildCaseExtractionPrompt,
  buildDocumentExtractionPrompt,
  buildExtractionLedger,
  buildFinalLegalAnswerPrompt,
  buildPatriciaAnswerContract,
  buildSourceLedger,
  buildVerificationPrompt,
  computeTrustScore,
  confidenceFromTrustScore,
  evidenceLedgerAsPrompt,
  makeEvidenceId,
  makeLocalDocumentSource,
  normalizeSources,
  parseLooseJson,
  rankSourceAuthority,
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

function countryToJurisdiction(country: string): PatriciaJurisdiction {
  const value = country.toLowerCase();
  if (value.includes("kenya")) return "kenya";
  if (value.includes("uganda")) return "uganda";
  if (value.includes("tanzania")) return "tanzania";
  if (value.includes("zanzibar")) return "zanzibar";
  if (value.includes("rwanda")) return "rwanda";
  if (value.includes("burundi")) return "burundi";
  if (value.includes("east africa")) return "eac";
  return "unknown";
}

function researchKindToDocumentType(kind: PatriciaResearchResult["kind"]): PatriciaDocumentType {
  if (kind === "case-law" || kind === "regional-court") return "case-law";
  if (kind === "legislation") return "statute";
  if (kind === "constitution") return "constitution";
  if (kind === "news") return "news-context";
  return "unknown";
}

function researchResultsToSources(results: PatriciaResearchResult[]): PatriciaSource[] {
  return results.map((result, index) => ({
    id: result.sourceId || `research-source-${index + 1}`,
    title: result.title,
    url: result.url,
    sourceName: result.sourceName,
    jurisdiction: countryToJurisdiction(result.country),
    documentType: researchKindToDocumentType(result.kind),
    authority: rankSourceAuthority(result),
    excerpt: result.snippet,
    retrievedAt: new Date().toISOString(),
  }));
}

function sourceQuality(results: PatriciaResearchResult[]) {
  if (results.some((item) => item.authority === "official")) return "official-source-leads-found";
  if (results.some((item) => item.authority === "legal-index")) return "legal-index-leads-found";
  if (results.some((item) => item.authority === "news-context")) return "news-context-only";
  return "no-external-source-leads";
}

function wantsDeepAnswer(question: string) {
  return /full|detailed|comprehensive|brief|report|memo|explain|decode|tell me about|what happened|reasoning|orders|facts|issues/i.test(question);
}

function shouldUseResearch(question: string, route: PatriciaRouteDecision, localText: string) {
  if (route.task === "compare-documents") return false;
  if (route.task === "legal-research" || route.task === "journalist-brief" || route.task === "business-risk") return true;
  if (localText.trim().length > 500 && !/latest|current|update|news|verify|source|citation|authority/i.test(question)) return false;
  return /fetch|find|search|look up|lookup|case|law|constitution|act|section|article|judgment|ruling|news|latest|kenya|uganda|tanzania|rwanda|burundi|eacj|brief|report|explain|full|policy|bill|notice|gazette/i.test(question);
}

function shouldExtractCase(question: string, route: PatriciaRouteDecision, localText: string) {
  if (route.documentType === "case-law" || route.task === "case-brief") return true;
  if (localText.trim().length > 500 && /court|judgment|ruling|appeal|petition|plaintiff|defendant|appellant|respondent/i.test(localText)) return true;
  return /case name|case number|citation|neutral citation|criminal appeal|civil appeal|petition|judgment|ruling|case brief|brief|holding|reasoning|orders|issues|full/i.test(question);
}

function shouldExtractPublicDocument(route: PatriciaRouteDecision, localText: string) {
  if (!localText.trim()) return false;
  if (shouldExtractCase("", route, localText)) return false;
  return ["policy-decoder", "citizen-impact", "document-summary", "clause-lookup", "business-risk", "journalist-brief", "student-notes", "memo-draft", "general-chat"].includes(route.task);
}

function answerModeInstruction(question: string, route: PatriciaRouteDecision, hasLocalText: boolean) {
  const mode = wantsDeepAnswer(question) ? "DEEP" : "NORMAL";
  if (route.task === "case-brief" && hasLocalText) {
    return [
      "ANSWER MODE: FULL_CASE_BRIEF.",
      "Write a careful user-facing case brief unless the verified material is too thin.",
      "Explain the story of the case, the legal questions, the reasoning, the decision, and why it matters.",
      "Use plain language unless the route asks for professional legal language.",
    ].join("\n");
  }

  if (route.task === "case-brief" && !hasLocalText) {
    return [
      "ANSWER MODE: CASE_METADATA_OR_RESEARCH_ONLY.",
      "Explain only what Patricia can verify from resolved metadata or source leads.",
      "Say that a full brief requires the full judgment text or a successful official import.",
    ].join("\n");
  }

  if (["policy-decoder", "citizen-impact", "document-summary", "clause-lookup", "business-risk", "journalist-brief"].includes(route.task)) {
    return [
      `ANSWER MODE: ${mode}_PUBLIC_DOCUMENT_DECODER.`,
      "Explain meaning, affected people, duties, risks, deadlines, and next action only when supported by source text or trusted leads.",
      "Do not turn news into law. Treat news as context only.",
    ].join("\n");
  }

  return [
    `ANSWER MODE: ${mode}_LEGAL_EXPLANATION.`,
    "Answer clearly and with source discipline. Do not overclaim when support is thin.",
  ].join("\n");
}

function buildCaseHeader(args: {
  caseTitle?: string;
  citation?: string;
  caseNumber?: string;
  court?: string;
  judge?: string;
  date?: string;
  sourceUrl?: string;
}) {
  return [
    args.caseTitle ? `Title: ${args.caseTitle}` : "",
    args.citation ? `Citation: ${args.citation}` : "",
    args.caseNumber ? `Case Number: ${args.caseNumber}` : "",
    args.court ? `Court: ${args.court}` : "",
    args.judge ? `Judge: ${args.judge}` : "",
    args.date ? `Date: ${args.date}` : "",
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
        support: "Extracted from the supplied public/legal document text.",
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

function systemPrompt(route: PatriciaRouteDecision) {
  return [
    "You are Patricia, a careful East African legal and public-document research assistant.",
    "Work in this order: jurisdiction, document type, source quality, evidence, answer, verification.",
    "Do not give final legal advice and do not invent missing material.",
    `Current task: ${route.task}. Jurisdiction: ${route.jurisdiction}. Document type: ${route.documentType}. Output mode: ${route.outputMode}.`,
  ].join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const originalQuestion = String(body.question || "").trim();
    const previousMessages = Array.isArray(body.previousMessages) ? body.previousMessages : [];
    const suppliedDocumentText = String(body.caseText || body.documentText || body.localDocument || "").trim();
    const suppliedCaseTitle = String(body.caseTitle || body.documentTitle || "").trim();
    const suppliedCitation = String(body.citation || "").trim();
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!originalQuestion) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const question = buildEffectiveLegalQuestion(originalQuestion, previousMessages);
    const resolvedCase = suppliedDocumentText.length > 500 ? null : await resolveKnownCaseFromQuestion(question);
    const localText = resolvedCase?.text || suppliedDocumentText;
    const hasLocalText = localText.trim().length > 500;
    const preliminaryHeader = buildCaseHeader({ caseTitle: suppliedCaseTitle || resolvedCase?.title, citation: suppliedCitation || resolvedCase?.citation || resolvedCase?.neutralCitation, caseNumber: resolvedCase?.caseNumber, court: resolvedCase?.court, judge: resolvedCase?.judge, date: resolvedCase?.date, sourceUrl: resolvedCase?.sourceUrl });
    const route = routePatriciaTask(`${question}\n${preliminaryHeader}\n${localText.slice(0, 6000)}`, hasLocalText);
    const answerMode = answerModeInstruction(question, route, hasLocalText);
    const plan = buildResearchPlan(question);

    const chunks = chunkText(localText);
    const context = chunks.length > 1 ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n") : localText.slice(0, MAX_CONTEXT_CHARS);

    const researchResults = resolvedCase
      ? [{
          sourceId: "kenya-law-known-case",
          sourceName: "Kenya Law",
          country: "Kenya",
          kind: "case-law" as const,
          authority: "official" as const,
          title: resolvedCase.citation || resolvedCase.title,
          url: resolvedCase.sourceUrl,
          snippet: "Official Kenya Law judgment resolved by Patricia.",
        }]
      : shouldUseResearch(question, route, localText)
        ? await researchEastAfricanLaw(question, 8)
        : [];

    const caseHeader = buildCaseHeader({
      caseTitle: suppliedCaseTitle || resolvedCase?.title,
      citation: suppliedCitation || resolvedCase?.citation || resolvedCase?.neutralCitation,
      caseNumber: resolvedCase?.caseNumber,
      court: resolvedCase?.court,
      judge: resolvedCase?.judge,
      date: resolvedCase?.date,
      sourceUrl: resolvedCase?.sourceUrl,
    });

    const externalResearch = sourcesAsPrompt(researchResults);
    const quality = sourceQuality(researchResults);
    const planText = JSON.stringify(plan, null, 2);

    let extraction: PatriciaCaseExtraction | PatriciaDocumentExtraction | null = null;
    let extractionKind: "case" | "document" | "none" = "none";

    if (shouldExtractCase(question, route, localText || caseHeader)) {
      const extractInput = [caseHeader, context].filter(Boolean).join("\n\n");
      const extracted = await callGroq([
        { role: "system", content: systemPrompt(route) },
        { role: "user", content: buildCaseExtractionPrompt(extractInput, route) },
      ], model, { maxTokens: 2400, jsonMode: true });

      if (!("error" in extracted)) {
        extraction = parseLooseJson<PatriciaCaseExtraction>(extracted.content);
        extractionKind = extraction ? "case" : "none";
      }
    } else if (shouldExtractPublicDocument(route, localText)) {
      const extracted = await callGroq([
        { role: "system", content: systemPrompt(route) },
        { role: "user", content: buildDocumentExtractionPrompt(context, route) },
      ], model, { maxTokens: 2400, jsonMode: true });

      if (!("error" in extracted)) {
        extraction = parseLooseJson<PatriciaDocumentExtraction>(extracted.content);
        extractionKind = extraction ? "document" : "none";
      }
    }

    const researchSources = researchResultsToSources(researchResults);
    const localSources = hasLocalText ? [makeLocalDocumentSource(localText, suppliedCaseTitle || resolvedCase?.title || "User-provided source text")] : [];
    const sources = normalizeSources([...localSources, ...researchSources]);
    const ledgerItems: PatriciaEvidenceItem[] = [
      ...(extractionKind === "case" ? buildExtractionLedger(extraction as PatriciaCaseExtraction) : []),
      ...(extractionKind === "document" ? buildDocumentLedger(extraction as PatriciaDocumentExtraction) : []),
      ...buildSourceLedger(researchResults),
    ];

    const evidenceLedger = evidenceLedgerAsPrompt(ledgerItems);
    const preAnswerTrustScore = computeTrustScore(ledgerItems, sources);
    const preAnswerConfidence = confidenceFromTrustScore(preAnswerTrustScore);

    const draft = await callGroq([
      { role: "system", content: systemPrompt(route) },
      {
        role: "user",
        content: buildFinalLegalAnswerPrompt({
          question: `${question}\n\n${answerMode}\n\nPRE_ANSWER_TRUST_SCORE: ${preAnswerTrustScore}\nPRE_ANSWER_CONFIDENCE: ${preAnswerConfidence}`,
          caseHeader,
          planText,
          sourceQuality: quality,
          extraction,
          evidenceLedger,
          externalResearch,
        }),
      },
    ], model, { maxTokens: wantsDeepAnswer(question) && hasLocalText ? 5200 : 3400 });

    if ("error" in draft) return NextResponse.json(draft, { status: draft.status || 500 });

    const verified = await callGroq([
      { role: "system", content: systemPrompt(route) },
      { role: "user", content: buildVerificationPrompt(draft.content, `${answerMode}\n\nTRUST SCORE: ${preAnswerTrustScore}\nCONFIDENCE: ${preAnswerConfidence}\n\n${evidenceLedger}`) },
    ], model, { maxTokens: wantsDeepAnswer(question) && hasLocalText ? 4200 : 2800 });

    const content = "error" in verified ? draft.content : verified.content;
    const contract = buildPatriciaAnswerContract({ route, answer: content, evidenceLedger: ledgerItems, sources, unsupportedClaims: [] });

    return NextResponse.json({
      content,
      route,
      answerMode: route.task,
      sourceQuality: quality,
      trustScore: contract.trustScore,
      confidence: contract.confidence,
      releaseSafe: contract.releaseSafe,
      shouldAbstain: shouldAbstain(contract),
      resolvedCase: resolvedCase ? { title: resolvedCase.title, sourceUrl: resolvedCase.sourceUrl } : null,
      researchPlan: plan,
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
