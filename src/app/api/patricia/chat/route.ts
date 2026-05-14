import { NextRequest, NextResponse } from "next/server";
import { buildPatriciaSkillRunPlan } from "@/lib/patricia-skills/registry";
import { buildClaudeForLegalRuntimePrompt, claudeForLegalSkillPath, loadClaudeForLegalSkill } from "@/lib/claude-for-legal-adapter";
import { callPatriciaLLM } from "@/lib/patricia-llm";

const MAX_CONTEXT_CHARS = 80_000;

type LegalSource = {
  title: string;
  url?: string;
  authority?: string;
  sourceName?: string;
  documentType?: string;
};

function wantsDeepAnswer(question: string) {
  return /full|detailed|comprehensive|brief|report|memo|explain|decode|reasoning|orders|facts|issues|review|draft|triage|assessment|contract|agreement|policy/i.test(question);
}

function compactText(input: string, max = MAX_CONTEXT_CHARS) {
  return input.replace(/\s+/g, " ").trim().slice(0, max);
}

function buildSystemPrompt(args: { sourcePath: string; providerInstruction: string }) {
  return [
    "Patricia manages product shell, chat UI, document intake, storage, provider routing, and orchestration.",
    "Claude-for-legal source files provide the legal workflow brain.",
    "Follow the loaded claude-for-legal source file carefully.",
    "Do not claim to have used external connectors or third-party systems unless connector output is explicitly provided in the request.",
    "If the workflow needs an unavailable connector, say exactly what connector/input is missing and continue only as a safe draft/intake workflow.",
    "Every output is a draft for qualified review.",
    `Loaded claude-for-legal source path: ${args.sourcePath}.`,
    args.providerInstruction,
  ].join("\n");
}

function buildSources(args: { documentTitle?: string; documentText?: string; sourcePath: string; command: string; sourceType?: string }): LegalSource[] {
  const sources: LegalSource[] = [
    {
      title: `claude-for-legal ${args.command} ${args.sourceType || "source"}`,
      url: `https://github.com/anthropics/claude-for-legal/blob/main/${args.sourcePath}`,
      authority: "workflow-source",
      sourceName: "anthropics/claude-for-legal",
      documentType: args.sourceType || "workflow-source",
    },
  ];

  if (args.documentText?.trim()) {
    sources.push({
      title: args.documentTitle || "User-provided document/facts",
      authority: "user-provided",
      sourceName: "Patricia document intake",
      documentType: "local-document",
    });
  }

  return sources;
}

function scoreRun(args: { hasSource: boolean; hasDocument: boolean; missingInputs: string[]; requiresDocument: boolean }) {
  let score = 55;
  if (args.hasSource) score += 20;
  if (args.hasDocument) score += 15;
  if (!args.requiresDocument) score += 5;
  score -= args.missingInputs.length * 8;
  return Math.max(10, Math.min(95, score));
}

function confidenceFromScore(score: number) {
  if (score >= 82) return "high";
  if (score >= 62) return "medium";
  return "low";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const originalQuestion = String(body.question || "").trim();
    const previousMessages = Array.isArray(body.previousMessages) ? body.previousMessages : [];
    const suppliedDocumentText = compactText(String(body.caseText || body.documentText || body.localDocument || ""));
    const suppliedDocumentTitle = String(body.caseTitle || body.documentTitle || "").trim();
    const suppliedCitation = String(body.citation || "").trim();
    const selectedCommand = String(body.command || body.selectedCommand || "").trim();
    const practiceProfile = String(body.practiceProfile || "").trim();
    const model = String(body.model || process.env.LEGAL_LLM_MODEL || "").trim() || undefined;

    if (!originalQuestion) return NextResponse.json({ error: "Question is required." }, { status: 400 });

    const effectiveQuestion = previousMessages.length ? `${originalQuestion}\n\nRecent context is supplied separately in previousMessages for continuity.` : originalQuestion;
    const skillPlan = buildPatriciaSkillRunPlan({
      command: selectedCommand,
      question: effectiveQuestion,
      documentText: suppliedDocumentText,
      documentTitle: suppliedDocumentTitle,
      citation: suppliedCitation,
      practiceProfile,
      previousMessages,
    });

    const sourceText = await loadClaudeForLegalSkill(skillPlan.selectedCommand);
    const sourcePath = claudeForLegalSkillPath(skillPlan.selectedCommand);
    const hasLoadedSource = !sourceText.includes("Source file missing at");
    const hasDocument = Boolean(suppliedDocumentText.trim());
    const sources = buildSources({ documentTitle: suppliedDocumentTitle, documentText: suppliedDocumentText, sourcePath, command: skillPlan.selectedCommand.command, sourceType: skillPlan.selectedCommand.sourceType });
    const trustScore = scoreRun({ hasSource: hasLoadedSource, hasDocument, missingInputs: skillPlan.missingInputs, requiresDocument: skillPlan.selectedCommand.requiresDocument });
    const confidence = confidenceFromScore(trustScore);

    const runtimePrompt = buildClaudeForLegalRuntimePrompt({
      command: skillPlan.selectedCommand,
      skillMarkdown: sourceText,
      practiceProfile,
      documentTitle: suppliedDocumentTitle || suppliedCitation,
      documentText: suppliedDocumentText,
      userQuestion: [
        originalQuestion,
        suppliedCitation ? `Citation/reference: ${suppliedCitation}` : "",
        previousMessages.length ? `Recent conversation context: ${JSON.stringify(previousMessages.slice(-8)).slice(0, 12000)}` : "",
        skillPlan.missingInputs.length ? `Missing inputs Patricia already detected: ${skillPlan.missingInputs.join(", ")}` : "",
      ].filter(Boolean).join("\n"),
    });

    const providerInstruction = [
      `Trust score before drafting: ${trustScore}. Confidence: ${confidence}.`,
      "Return a clean workflow deliverable, not JSON.",
      "Include: workflow used, intake/routing, facts/documents reviewed, analysis/draft, missing inputs/connectors, review gate, and next actions.",
      "If required inputs are missing, do not fake completion. Produce an intake checklist and partial safe draft only.",
    ].join("\n");

    const draft = await callPatriciaLLM([
      { role: "system", content: buildSystemPrompt({ sourcePath, providerInstruction }) },
      { role: "user", content: runtimePrompt },
    ], { model, maxTokens: wantsDeepAnswer(originalQuestion) || hasDocument ? 6200 : 3600, temperature: 0.05 });

    const verification = await callPatriciaLLM([
      { role: "system", content: "You are a workflow QA checker. Do not add new facts. Clean the answer, preserve the claude-for-legal workflow, flag unsupported claims, and keep the qualified-review warning." },
      { role: "user", content: `COMMAND: ${skillPlan.selectedCommand.command}\nSOURCE PATH: ${sourcePath}\nTRUST SCORE: ${trustScore}\nMISSING INPUTS: ${skillPlan.missingInputs.join(", ") || "none"}\n\nDRAFT:\n${draft.content}` },
    ], { model, maxTokens: wantsDeepAnswer(originalQuestion) || hasDocument ? 4200 : 2600, temperature: 0.02 });

    return NextResponse.json({
      content: verification.content || draft.content,
      route: {
        task: skillPlan.selectedCommand.command,
        documentType: skillPlan.selectedCommand.plugin,
        outputMode: "claude-for-legal-source",
        needsResearch: skillPlan.selectedCommand.requiresConnector || false,
        needsLocalDocument: skillPlan.selectedCommand.requiresDocument,
      },
      skill: {
        command: skillPlan.selectedCommand.command,
        plugin: skillPlan.selectedCommand.plugin,
        agent: skillPlan.selectedCommand.agent,
        stage: skillPlan.selectedCommand.stage,
        risk: skillPlan.selectedCommand.risk,
        sourceType: skillPlan.selectedCommand.sourceType,
        missingInputs: skillPlan.missingInputs,
        intakeChecklist: skillPlan.intakeChecklist,
        skillPath: sourcePath,
        sourceLoaded: hasLoadedSource,
      },
      llm: {
        provider: draft.provider,
        model: draft.model,
      },
      answerMode: "claude-for-legal",
      sourceQuality: hasDocument ? "claude-for-legal-source-plus-user-document" : "claude-for-legal-source-only",
      trustScore,
      confidence,
      releaseSafe: trustScore >= 82 && skillPlan.missingInputs.length === 0,
      shouldAbstain: trustScore < 45,
      researchPlan: {
        selectedSkill: skillPlan.selectedCommand.command,
        sourcePath,
        missingInputs: skillPlan.missingInputs,
        missingConnectors: skillPlan.selectedCommand.requiresConnector ? ["required connector output not supplied"] : [],
      },
      extractionKind: "claude-for-legal-source",
      extraction: null,
      evidenceLedger: skillPlan.missingInputs.map((missing, index) => ({
        id: `missing-${index + 1}`,
        claim: `Missing input: ${missing}`,
        support: "Required by the selected claude-for-legal workflow before full completion.",
        source: "workflow intake",
        confidence: "high",
        kind: "workflow-gap",
        authority: "claude-for-legal source",
        risk: "high",
      })),
      sources,
    });
  } catch (error) {
    console.error("Patricia claude-for-legal route failed", error);
    const message = error instanceof Error ? error.message : "Unable to process Patricia request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
