import { NextRequest, NextResponse } from "next/server";
import { PatriciaResearchResult, researchEastAfricanLaw, sourcesAsPrompt } from "@/lib/patricia-research";
import { buildResearchPlan } from "@/lib/patricia-legal-router";

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
  return /fetch|find|search|look up|lookup|case|law|constitution|act|section|article|judgment|ruling|news|latest|kenya|uganda|tanzania|rwanda|burundi|eacj|brief|report|explain/i.test(question);
}

function sourceQuality(results: PatriciaResearchResult[]) {
  if (results.some((item) => item.authority === "official")) return "official-source-leads-found";
  if (results.some((item) => item.authority === "legal-index")) return "legal-index-leads-found";
  if (results.some((item) => item.authority === "news-context")) return "news-context-only";
  return "no-external-source-leads";
}

async function callGroq(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, model: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: "Missing GROQ_API_KEY. Add it in Vercel Project Settings > Environment Variables.", status: 500 };

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.08, max_tokens: 2400 }),
  });

  if (!response.ok) return { error: "Groq request failed", detail: await response.text(), status: response.status };
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "" };
}

function buildProfessionalPrompt(args: {
  question: string;
  context: string;
  caseHeader: string;
  externalResearch: string;
  quality: string;
  planText: string;
}) {
  return `${args.caseHeader ? `${args.caseHeader}\n\n` : ""}RESEARCH PLAN:\n${args.planText}\n\nLOCAL CASE TEXT:\n${args.context || "No local case text was provided."}\n\nEXTERNAL EAST AFRICAN LEGAL RESEARCH LEADS:\n${args.externalResearch}\n\nSOURCE QUALITY: ${args.quality}\n\nUSER QUESTION:\n${args.question}\n\nRESPONSE RULES:\n1. Do not say "I will try" or "I can search" in the final answer.\n2. If the plan says Kenya, do not lead with Uganda or Tanzania unless no Kenyan source exists.\n3. Separate verified facts from research leads.\n4. Never invent case details, parties, courts, legal holdings, statutes, citations, or dates.\n5. If the source lead is generic, say it is generic and not enough.\n6. If asked for a brief/report, explain the legal principle, procedural history, issue, holding, reasoning, importance, and limits, but only where supported.\n7. End by asking whether the user wants more depth.\n\nUse this exact answer structure:\n\n## Answer\nDirect professional answer.\n\n## Case or subject identified\nJurisdiction, likely court/source path, and why.\n\n## Explanation\nPlain-English explanation of the issue, holding/principle, and why it matters. If not verified, explain what is missing.\n\n## Verified facts\nOnly facts supported by local text or strong source leads.\n\n## Sources and confidence\nList source leads with authority and confidence.\n\n## What Patricia should check next\nList documents/PDFs/statutes/source pages to import next.\n\n## Want more?\nAsk if the user wants the full brief, student notes, counsel-style memo, or audio.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body.question || "").trim();
    const caseText = String(body.caseText || "").trim();
    const caseTitle = String(body.caseTitle || "").trim();
    const citation = String(body.citation || "").trim();
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!question) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const plan = buildResearchPlan(question);
    const chunks = chunkText(caseText);
    const context = chunks.length > 1 ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n") : caseText.slice(0, MAX_CONTEXT_CHARS);
    const researchResults = shouldUseResearch(question, caseText) ? await researchEastAfricanLaw(question, 14) : [];
    const quality = sourceQuality(researchResults);
    const caseHeader = [caseTitle ? `Title: ${caseTitle}` : "", citation ? `Citation: ${citation}` : ""].filter(Boolean).join("\n");
    const externalResearch = sourcesAsPrompt(researchResults);
    const planText = JSON.stringify(plan, null, 2);

    const groq = await callGroq(
      [
        {
          role: "system",
          content:
            "You are Patricia, a careful East African legal research assistant. Behave like a disciplined legal researcher: jurisdiction first, source quality second, answer third. Do not hallucinate. You are not a lawyer and you do not give final legal advice. You help students, lawyers, and researchers understand and verify legal material.",
        },
        { role: "user", content: buildProfessionalPrompt({ question, context, caseHeader, externalResearch, quality, planText }) },
      ],
      model
    );

    if ("error" in groq) return NextResponse.json(groq, { status: groq.status || 500 });

    return NextResponse.json({
      content: groq.content,
      sourceQuality: quality,
      researchPlan: plan,
      sources: researchResults.map((source) => ({ title: source.title, url: source.url, authority: source.authority, sourceName: source.sourceName })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
