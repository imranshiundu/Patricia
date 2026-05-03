import { NextRequest, NextResponse } from "next/server";
import { PatriciaResearchResult, researchEastAfricanLaw, sourcesAsPrompt } from "@/lib/patricia-research";

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
  return /fetch|find|search|look up|lookup|case|law|constitution|act|section|article|judgment|ruling|news|latest|kenya|uganda|tanzania|rwanda|burundi|eacj/i.test(question);
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
    body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 2200 }),
  });

  if (!response.ok) return { error: "Groq request failed", detail: await response.text(), status: response.status };
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? "" };
}

function buildProfessionalPrompt({
  question,
  context,
  caseHeader,
  externalResearch,
  quality,
}: {
  question: string;
  context: string;
  caseHeader: string;
  externalResearch: string;
  quality: string;
}) {
  return `${caseHeader ? `${caseHeader}\n\n` : ""}LOCAL CASE TEXT:\n${context || "No local case text was provided."}\n\nEXTERNAL EAST AFRICAN LEGAL RESEARCH LEADS:\n${externalResearch}\n\nSOURCE QUALITY: ${quality}\n\nUSER QUESTION:\n${question}\n\nRESPONSE RULES:\n1. Do not write phrases like "I will try", "I can search", or "after searching the provided links". Either state what is supported by the available evidence or state that the source is not verified.\n2. Separate verified information from leads.\n3. Never invent case details, parties, courts, legal holdings, statutes, citations, or dates.\n4. If sources are weak, say exactly what is weak.\n5. Use professional legal-research style.\n6. End with one concise follow-up question asking whether the user wants deeper research, import of source documents, or a student-friendly brief.\n\nUse this exact answer structure:\n\n## Answer\nGive the most useful direct answer in 2-5 paragraphs.\n\n## What is verified\nList only facts supported by local case text or strong source titles/URLs. If none, say "No verified case details yet."\n\n## Research leads\nList relevant source leads with authority labels. Explain whether they are official, legal-index, or news-context.\n\n## What still needs checking\nList what Patricia must still verify from original judgments, PDF documents, statutes, or official pages.\n\n## Next step\nAsk whether the user wants a deeper source import/research brief/audio brief.`;
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

    const chunks = chunkText(caseText);
    const context = chunks.length > 1 ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n") : caseText.slice(0, MAX_CONTEXT_CHARS);
    const researchResults = shouldUseResearch(question, caseText) ? await researchEastAfricanLaw(question, 14) : [];
    const quality = sourceQuality(researchResults);
    const caseHeader = [caseTitle ? `Title: ${caseTitle}` : "", citation ? `Citation: ${citation}` : ""].filter(Boolean).join("\n");
    const externalResearch = sourcesAsPrompt(researchResults);

    const groq = await callGroq(
      [
        {
          role: "system",
          content:
            "You are Patricia, a careful East African legal research assistant for students, lawyers, and researchers. You are not a lawyer. Your job is to produce source-grounded legal research notes. Work like a disciplined legal researcher, not a casual chatbot. Prefer short, verified statements over impressive speculation. Never invent legal facts.",
        },
        {
          role: "user",
          content: buildProfessionalPrompt({ question, context, caseHeader, externalResearch, quality }),
        },
      ],
      model
    );

    if ("error" in groq) return NextResponse.json(groq, { status: groq.status || 500 });

    return NextResponse.json({
      content: groq.content,
      sourceQuality: quality,
      sources: researchResults.map((source) => ({
        title: source.title,
        url: source.url,
        authority: source.authority,
        sourceName: source.sourceName,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
