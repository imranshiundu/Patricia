import { NextRequest, NextResponse } from "next/server";
import { researchEastAfricanLaw, sourcesAsPrompt } from "@/lib/patricia-research";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_CONTEXT_CHARS = 60_000;

function chunkText(input: string, maxChars = 9000) {
  const normalized = input.replace(/\s+/g, " ").trim().slice(0, MAX_CONTEXT_CHARS);
  const chunks: string[] = [];

  for (let index = 0; index < normalized.length; index += maxChars) {
    chunks.push(normalized.slice(index, index + maxChars));
  }

  return chunks;
}

function shouldUseResearch(question: string, caseText: string) {
  if (caseText.trim().length > 500) return false;
  return /fetch|find|search|look up|lookup|case|law|constitution|act|section|article|judgment|ruling|news|kenya|uganda|tanzania|rwanda|burundi|eacj/i.test(question);
}

async function callGroq(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, model: string) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY. Add it in Vercel Project Settings > Environment Variables." },
      { status: 500 }
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1400,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "Groq request failed", detail }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? "" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body.question || "").trim();
    const caseText = String(body.caseText || "").trim();
    const caseTitle = String(body.caseTitle || "").trim();
    const citation = String(body.citation || "").trim();
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const chunks = chunkText(caseText);
    const context = chunks.length > 1
      ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n")
      : caseText.slice(0, MAX_CONTEXT_CHARS);

    const researchResults = shouldUseResearch(question, caseText)
      ? await researchEastAfricanLaw(question, 12)
      : [];

    const caseHeader = [
      caseTitle ? `Title: ${caseTitle}` : "",
      citation ? `Citation: ${citation}` : "",
    ].filter(Boolean).join("\n");

    const externalResearch = sourcesAsPrompt(researchResults);

    return callGroq(
      [
        {
          role: "system",
          content:
            "You are Patricia, a careful legal research assistant for East African case law. Use simple, direct language. Use provided case text first. Use external legal research results only as source leads unless the result title and URL clearly support the answer. Never invent citations, holdings, parties, laws, dates, courts, or statutes. When you use external research leads, include the source name and URL. If a source is only a lead, say it needs verification.",
        },
        {
          role: "user",
          content: `${caseHeader ? `${caseHeader}\n\n` : ""}Local case text:\n${context || "No local case text was provided."}\n\nExternal East African legal research leads:\n${externalResearch}\n\nUser question:\n${question}`,
        },
      ],
      model
    );
  } catch {
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
