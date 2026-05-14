import { NextResponse } from "next/server";

export const runtime = "nodejs";

function providerStatus() {
  const configured = Boolean(
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.OLLAMA_BASE_URL ||
    process.env.OPENAI_COMPATIBLE_BASE_URL,
  );

  return {
    configured,
    provider: process.env.LEGAL_LLM_PROVIDER || process.env.PATRICIA_LLM_PROVIDER || (configured ? "auto" : "none"),
    model: process.env.LEGAL_LLM_MODEL || process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || process.env.GROQ_MODEL || process.env.OPENROUTER_MODEL || process.env.GEMINI_MODEL || process.env.OLLAMA_MODEL || process.env.OPENAI_COMPATIBLE_MODEL || "not configured",
  };
}

export async function GET() {
  const llm = providerStatus();
  return NextResponse.json({
    ok: true,
    app: "Patricia",
    backendMode: "server-ready",
    runtime: "nodejs",
    workflowBrain: "anthropics/claude-for-legal",
    orchestration: "patricia-server",
    llm,
    releaseReady: llm.configured,
    timestamp: new Date().toISOString(),
  });
}
