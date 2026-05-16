import { NextResponse } from "next/server";
import { getPatriciaLLMStatus } from "@/server/patricia/llm";

export const runtime = "nodejs";

export async function GET() {
  const llm = getPatriciaLLMStatus();
  return NextResponse.json({
    ok: true,
    app: "Patricia",
    backendMode: "server-ready",
    runtime: "nodejs",
    workflowBrain: "Patricia Brain",
    orchestration: "patricia-server",
    llm,
    releaseReady: llm.configured,
    security: {
      llmCalls: "server-only",
      browserKeys: false,
      note: "Frontend calls Patricia API routes only. Provider keys must stay in server environment variables.",
    },
    timestamp: new Date().toISOString(),
  });
}
