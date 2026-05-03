import { NextRequest, NextResponse } from "next/server";
import { PatriciaResearchResult, researchEastAfricanLaw, sourcesAsPrompt } from "@/lib/patricia-research";
import { buildResearchPlan } from "@/lib/patricia-legal-router";
import { buildEffectiveLegalQuestion, resolveKnownCaseFromQuestion } from "@/lib/patricia-case-resolver";
import {
  PatriciaCaseExtraction,
  buildCaseExtractionPrompt,
  buildExtractionLedger,
  buildFinalLegalAnswerPrompt,
  buildSourceLedger,
  buildVerificationPrompt,
  evidenceLedgerAsPrompt,
  parseLooseJson,
} from "@/lib/patricia-legal-briefing";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_CONTEXT_CHARS = 60_000;

function chunkText(input: string, maxChars = 9000) {
  const normalized = input.replace(/\s+/g, " ").trim().slice(0, MAX_CONTEXT_CHARS);
  const chunks: string[] = [];
  for (let index = 0; index < normalized.length; index += maxChars) chunks.push(normalized.slice(index, index + maxChars));
  return chunks;
}

function shouldUseResearch(question: string, caseText: string) {
  if (caseText.trim().length > 500) return false;
  return /fetch|find|search|look up|lookup|case|law|constitution|act|section|article|judgment|ruling|news|latest|kenya|uganda|tanzania|rwanda|burundi|eacj|brief|report|explain|full/i.test(question);
}

function shouldExtractCase(question: string, caseText: string) {
  if (caseText.trim().length > 500) return true;
  return /case name|case number|citation|neutral citation|criminal appeal|civil appeal|petition|judgment|ruling|case brief|brief|holding|reasoning|orders|issues|full/i.test(question);
}

function sourceQuality(results: PatriciaResearchResult[]) {
  if (results.some((item) => item.authority === "official")) return "official-source-leads-found";
  if (results.some((item) => item.authority === "legal-index")) return "legal-index-leads-found";
  if (results.some((item) => item.authority === "news-context")) return "news-context-only";
  return "no-external-source-leads";
}

async function callGroq(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model: string,
  options?: { maxTokens?: number; jsonMode?: boolean }
) {
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

function systemPrompt() {
  return [
    "You are Patricia, a careful East African legal research assistant.",
    "You behave like a disciplined legal researcher: jurisdiction first, source quality second, evidence third, answer last.",
    "You do not hallucinate, and you do not give final legal advice.",
    "You help students, lawyers, and researchers understand and verify legal material.",
    "Every important claim must be supported by local legal text, trusted source leads, or clearly marked inference.",
  ].join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const originalQuestion = String(body.question || "").trim();
    const previousMessages = Array.isArray(body.previousMessages) ? body.previousMessages : [];
    const question = buildEffectiveLegalQuestion(originalQuestion, previousMessages);
    const suppliedCaseText = String(body.caseText || "").trim();
    const suppliedCaseTitle = String(body.caseTitle || "").trim();
    const suppliedCitation = String(body.citation || "").trim();
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!originalQuestion) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const resolvedCase = suppliedCaseText.length > 500 ? null : await resolveKnownCaseFromQuestion(question);
    const caseText = resolvedCase?.text || suppliedCaseText;
    const caseTitle = suppliedCaseTitle || resolvedCase?.title || "";
    const citation = suppliedCitation || resolvedCase?.citation || resolvedCase?.neutralCitation || "";

    const plan = buildResearchPlan(question);
    const chunks = chunkText(caseText);
    const context = chunks.length > 1 ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n") : caseText.slice(0, MAX_CONTEXT_CHARS);
    const researchResults = resolvedCase ? [{
      sourceId: "kenya-law-known-case",
      sourceName: "Kenya Law",
      country: "Kenya",
      kind: "case-law" as const,
      authority: "official" as const,
      title: resolvedCase.citation || resolvedCase.title,
      url: resolvedCase.sourceUrl,
      snippet: "Official Kenya Law judgment resolved by Patricia.",
    }] : shouldUseResearch(question, caseText) ? await researchEastAfricanLaw(question, 8) : [];
    const quality = sourceQuality(researchResults);
    const caseHeader = [caseTitle ? `Title: ${caseTitle}` : "", citation ? `Citation: ${citation}` : "", resolvedCase?.caseNumber ? `Case Number: ${resolvedCase.caseNumber}` : "", resolvedCase?.court ? `Court: ${resolvedCase.court}` : "", resolvedCase?.judge ? `Judge: ${resolvedCase.judge}` : "", resolvedCase?.date ? `Date: ${resolvedCase.date}` : "", resolvedCase?.sourceUrl ? `Source: ${resolvedCase.sourceUrl}` : ""].filter(Boolean).join("\n");
    const externalResearch = sourcesAsPrompt(researchResults);
    const planText = JSON.stringify(plan, null, 2);

    let extraction: PatriciaCaseExtraction | null = null;

    if (shouldExtractCase(question, caseText || caseHeader)) {
      const extractInput = [caseHeader, context].filter(Boolean).join("\n\n");
      const extracted = await callGroq(
        [
          { role: "system", content: systemPrompt() },
          { role: "user", content: buildCaseExtractionPrompt(extractInput, question) },
        ],
        model,
        { maxTokens: 1800, jsonMode: true }
      );

      if (!("error" in extracted)) {
        extraction = parseLooseJson<PatriciaCaseExtraction>(extracted.content);
      }
    }

    const ledgerItems = [...buildExtractionLedger(extraction), ...buildSourceLedger(researchResults)];
    const evidenceLedger = evidenceLedgerAsPrompt(ledgerItems);

    const draft = await callGroq(
      [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: buildFinalLegalAnswerPrompt({
            question,
            caseHeader,
            planText,
            sourceQuality: quality,
            extraction,
            evidenceLedger,
            externalResearch,
          }),
        },
      ],
      model,
      { maxTokens: 3400 }
    );

    if ("error" in draft) return NextResponse.json(draft, { status: draft.status || 500 });

    const verified = await callGroq(
      [
        { role: "system", content: systemPrompt() },
        { role: "user", content: buildVerificationPrompt(draft.content, evidenceLedger) },
      ],
      model,
      { maxTokens: 2800 }
    );

    const content = "error" in verified ? draft.content : verified.content;

    return NextResponse.json({
      content,
      sourceQuality: quality,
      resolvedCase: resolvedCase ? { title: resolvedCase.title, sourceUrl: resolvedCase.sourceUrl } : null,
      researchPlan: plan,
      extraction,
      evidenceLedger: ledgerItems,
      sources: researchResults.map((source) => ({ title: source.title, url: source.url, authority: source.authority, sourceName: source.sourceName })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
