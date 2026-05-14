import { NextRequest, NextResponse } from "next/server";
import { buildEffectiveLegalQuestion } from "@/lib/patricia-case-resolver";
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
  jurisdiction?: string;
};

function wantsDeepAnswer(question: string) {
  return /full|detailed|comprehensive|brief|report|memo|explain|decode|tell me about|what happened|reasoning|orders|facts|issues|review|draft|triage|assessment|contract|agreement|policy/i.test(question);
}

function compactText(input: string, max = MAX_CONTEXT_CHARS) {
  return input.replace(/\s+/g, " ").trim().slice(0, max);
}

function buildSystemPrompt(args: { skillPath: string; providerInstruction: string }) {
  return [
    "You are running the legal brain for Patricia using claude-for-legal workflow source files.",
    "Patricia is only the product shell, chat UI, document intake, and orchestration layer.",
    "The selected claude-for-legal SKILL.md is the controlling legal workflow. Follow it carefully.",
    "Do not use old Patricia legal behavior, old Patricia legal assumptions, or generic legal-chat behavior.",
    "Do not claim to have used external connectors, Google Drive, CLM, DMS, CourtListener, Trellis, Westlaw, Slack, Box, Ironclad, DocuSign, iManage, Everlaw, or any other tool unless connector output is explicitly provided in the request.",
    "If the workflow needs an unavailable connector, say exactly what connector/input is missing and continue only as a safe draft/intake workflow.",
    "Every output is a draft for qualified review. It is not legal advice, not a legal conclusion, and not a substitute for a lawyer.",
    `Loaded claude-for-legal source path: ${args.skillPath}.`,
    args.providerInstruction,
  ].join("\n");
}

function buildSources(args: { documentTitle?: string; documentText?: string; skillPath: string; command: string }): LegalSource[] {
  const sources: LegalSource[] = [
    {
      title: `claude-for-legal ${args.command} skill`,
      url: `https://github.com/anthropics/claude-for-legal/blob/main/${args.skillPath}`,
      authority: "workflow-source",
      sourceName: "anthropics/claude-for-legal",
      documentType: "skill",
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

function scoreRun(args: { hasSkill: boolean; hasDocument: boolean; missingInputs: string[]; requiresDocument: boolean }) {
  let score = 55;
  if (args.hasSkill) score += 20;
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

    const effectiveQuestion = buildEffectiveLegalQuestion(originalQuestion, previousMessages);
    const skillPlan = buildPatriciaSkillRunPlan({
      command: selectedCommand,
      question: effectiveQuestion,
      documentText: suppliedDocumentText,
      documentTitle: suppliedDocumentTitle,
      citation: suppliedCitation,
      practiceProfile,
      previousMessages,
    });

    const skillMarkdown = await loadClaudeForLegalSkill(skillPlan.selectedCommand);
    const skillPath = claudeForLegalSkillPath(skillPlan.selectedCommand);
    const hasLoadedSkill = !skillMarkdown.includes("Source skill missing at");
    const hasDocument = Boolean(suppliedDocumentText.trim());
    const sources = buildSources({ documentTitle: suppliedDocumentTitle, documentText: suppliedDocumentText, skillPath, command: skillPlan.selectedCommand.command });
    const trustScore = scoreRun({ hasSkill: hasLoadedSkill, hasDocument, missingInputs: skillPlan.missingInputs, requiresDocument: skillPlan.selectedCommand.requiresDocument });
    const confidence = confidenceFromScore(trustScore);

    const runtimePrompt = buildClaudeForLegalRuntimePrompt({
      command: skillPlan.selectedCommand,
      skillMarkdown,
      practiceProfile,
      documentTitle: suppliedDocumentTitle || suppliedCitation,
      documentText: suppliedDocumentText,
      userQuestion: [
        effectiveQuestion,
        suppliedCitation ? `Citation/reference: ${suppliedCitation}` : "",
        skillPlan.missingInputs.length ? `Missing inputs Patricia already detected: ${skillPlan.missingInputs.join(", ")}` : "",
      ].filter(Boolean).join("\n"),
    });

    const providerInstruction = [
      `Trust score before drafting: ${trustScore}. Confidence: ${confidence}.`,
      "Return a clean legal-workflow deliverable, not JSON.",
      "Include: workflow used, intake/routing, facts/documents reviewed, analysis/draft, missing inputs/connectors, review gate, and next actions.",
      "If required inputs are missing, do not fake completion. Produce an intake checklist and partial safe draft only.",
    ].join("\n");

    const draft = await callPatriciaLLM([
      { role: "system", content: buildSystemPrompt({ skillPath, providerInstruction }) },
      { role: "user", content: runtimePrompt },
    ], { model, maxTokens: wantsDeepAnswer(effectiveQuestion) || hasDocument ? 6200 : 3600, temperature: 0.05 });

    const verification = await callPatriciaLLM([
      { role: "system", content: "You are a legal workflow QA checker. Do not add new facts. Clean the answer, preserve the claude-for-legal workflow, flag unsupported claims, and ensure the attorney-review warning remains." },
      { role: "user", content: `COMMAND: ${skillPlan.selectedCommand.command}\nSKILL PATH: ${skillPath}\nTRUST SCORE: ${trustScore}\nMISSING INPUTS: ${skillPlan.missingInputs.join(", ") || "none"}\n\nDRAFT:\n${draft.content}` },
    ], { model, maxTokens: wantsDeepAnswer(effectiveQuestion) || hasDocument ? 4200 : 2600, temperature: 0.02 });

    return NextResponse.json({
      content: verification.content || draft.content,
      route: {
        task: skillPlan.selectedCommand.command,
        documentType: skillPlan.selectedCommand.plugin,
        outputMode: "claude-for-legal-skill",
        needsResearch: skillPlan.selectedCommand.requiresConnector || false,
        needsLocalDocument: skillPlan.selectedCommand.requiresDocument,
      },
      skill: {
        command: skillPlan.selectedCommand.command,
        plugin: skillPlan.selectedCommand.plugin,
        agent: skillPlan.selectedCommand.agent,
        stage: skillPlan.selectedCommand.stage,
        risk: skillPlan.selectedCommand.risk,
        missingInputs: skillPlan.missingInputs,
        intakeChecklist: skillPlan.intakeChecklist,
        skillPath,
        sourceLoaded: hasLoadedSkill,
      },
      llm: {
        provider: draft.provider,
        model: draft.model,
      },
      answerMode: "claude-for-legal",
      sourceQuality: hasDocument ? "claude-for-legal-skill-plus-user-document" : "claude-for-legal-skill-only",
      trustScore,
      confidence,
      releaseSafe: trustScore >= 82 && skillPlan.missingInputs.length === 0,
      shouldAbstain: trustScore < 45,
      researchPlan: {
        selectedSkill: skillPlan.selectedCommand.command,
        sourcePath: skillPath,
        missingInputs: skillPlan.missingInputs,
        missingConnectors: skillPlan.selectedCommand.requiresConnector ? ["required connector output not supplied"] : [],
      },
      extractionKind: "claude-for-legal-skill",
      extraction: null,
      evidenceLedger: skillPlan.missingInputs.map((missing, index) => ({
        id: `missing-${index + 1}`,
        claim: `Missing input: ${missing}`,
        support: "Required by the selected claude-for-legal workflow before full completion.",
        source: "workflow intake",
        confidence: "high",
        kind: "workflow-gap",
        authority: "claude-for-legal skill",
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
