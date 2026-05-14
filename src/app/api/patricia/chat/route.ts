import { NextRequest, NextResponse } from "next/server";
import { runPatriciaLegalWorkflow } from "@/server/patricia/legal-workflow-runner";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const result = await runPatriciaLegalWorkflow(await request.json());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Patricia claude-for-legal route failed", error);
    const message = error instanceof Error ? error.message : "Unable to process Patricia request.";
    const status = message === "Question is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
