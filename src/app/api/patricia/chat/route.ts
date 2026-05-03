import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function chunkText(input: string, maxChars = 9000) {
  const normalized = input.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];

  for (let index = 0; index < normalized.length; index += maxChars) {
    chunks.push(normalized.slice(index, index + maxChars));
  }

  return chunks;
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
      max_tokens: 1200,
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
    const model = String(body.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant");

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const chunks = chunkText(caseText);
    const context = chunks.length > 1
      ? chunks.map((chunk, index) => `[Part ${index + 1}/${chunks.length}] ${chunk}`).join("\n\n")
      : caseText;

    return callGroq(
      [
        {
          role: "system",
          content:
            "You are Patricia, a careful legal research assistant for East African case law. Answer from the provided text when available. Be clear, concise, and never invent citations, holdings, parties, or statutes. If the text is insufficient, say what is missing.",
        },
        {
          role: "user",
          content: `Case text:\n${context || "No case text was provided."}\n\nUser question:\n${question}`,
        },
      ],
      model
    );
  } catch (error) {
    return NextResponse.json({ error: "Unable to process Patricia request." }, { status: 500 });
  }
}
