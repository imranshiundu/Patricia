import { buildPatriciaSkillRunPlan } from "@/lib/patricia-skills/registry";
import { buildPatriciaBrainRuntimePrompt, patriciaBrainSkillPath, loadPatriciaBrainSkill } from "@/lib/patricia-brain-adapter";
import { callPatriciaLLM } from "@/server/patricia/llm";

const MAX_CONTEXT_CHARS = 400_000;

type LegalSource = {
  title: string;
  url?: string;
  authority?: string;
  sourceName?: string;
  documentType?: string;
};

export type PatriciaLegalWorkflowRequest = {
  question?: string;
  command?: string;
  selectedCommand?: string;
  caseText?: string;
  documentText?: string;
  localDocument?: string;
  caseTitle?: string;
  documentTitle?: string;
  citation?: string;
  practiceProfile?: string;
  previousMessages?: unknown[];
  model?: string;
};

function compactText(input: string, max = MAX_CONTEXT_CHARS) {
  return input.replace(/\s+/g, " ").trim().slice(0, max);
}

function buildSystemPrompt(args: { sourcePath: string; providerInstruction: string }) {
  return [
    "Patricia is a server-backed intelligent assistant.",
    "Patricia manages product shell, chat UI, document intake, storage, provider routing, and orchestration.",
    "Patricia Brain source files provide the workflow intelligence.",
    "All LLM/API calls happen on the Patricia backend/server layer only.",
    "The browser must never own provider API keys or call LLM vendors directly.",
    "Follow the loaded Patricia Brain source file carefully. However, you are flexible and can handle general questions, data analysis, accounting, or student queries. Do not restrict yourself purely to rigid legal constraints if the user asks for something else.",
    "Do not claim to have used external connectors or third-party systems unless connector output is explicitly provided in the request.",
    "If the workflow needs an unavailable connector, say exactly what connector/input is missing.",
    `Loaded Patricia Brain source path: ${args.sourcePath}.`,
    args.providerInstruction,
  ].join("\n");
}

function buildSources(args: { documentTitle?: string; documentText?: string; sourcePath: string; command: string; sourceType?: string }): LegalSource[] {
  const sources: LegalSource[] = [
    {
      title: `Patricia Brain ${args.command} ${args.sourceType || "source"}`,
      authority: "workflow-source",
      sourceName: "Patricia Brain",
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

export async function runPatriciaLegalWorkflow(body: PatriciaLegalWorkflowRequest) {
  const originalQuestion = String(body.question || "").trim();
  const previousMessages = Array.isArray(body.previousMessages) ? body.previousMessages : [];
  const suppliedDocumentText = compactText(String(body.caseText || body.documentText || body.localDocument || ""));
  const suppliedDocumentTitle = String(body.caseTitle || body.documentTitle || "").trim();
  const suppliedCitation = String(body.citation || "").trim();
  const selectedCommand = String(body.command || body.selectedCommand || "").trim();
  const practiceProfile = String(body.practiceProfile || "").trim();
  const model = String(body.model || process.env.LEGAL_LLM_MODEL || "").trim() || undefined;

  if (!originalQuestion) throw new Error("Question is required.");

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

  const sourceText = await loadPatriciaBrainSkill(skillPlan.selectedCommand);
  const sourcePath = patriciaBrainSkillPath(skillPlan.selectedCommand);
  const hasLoadedSource = !sourceText.includes("Brain resource missing at");
  const hasDocument = Boolean(suppliedDocumentText.trim());
  const sources = buildSources({ documentTitle: suppliedDocumentTitle, documentText: suppliedDocumentText, sourcePath, command: skillPlan.selectedCommand.command, sourceType: skillPlan.selectedCommand.sourceType });
  const trustScore = scoreRun({ hasSource: hasLoadedSource, hasDocument, missingInputs: skillPlan.missingInputs, requiresDocument: skillPlan.selectedCommand.requiresDocument });
  const confidence = confidenceFromScore(trustScore);

  const runtimePrompt = buildPatriciaBrainRuntimePrompt({
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
  ], { model, maxTokens: 8192, temperature: 0.1 });

  const verification = await callPatriciaLLM([
    { role: "system", content: "You are a workflow QA checker. Do not add new facts. Clean the answer, preserve the workflow, flag unsupported claims. You are flexible and can process any text length or domain." },
    { role: "user", content: `COMMAND: ${skillPlan.selectedCommand.command}\nSOURCE PATH: ${sourcePath}\nTRUST SCORE: ${trustScore}\nMISSING INPUTS: ${skillPlan.missingInputs.join(", ") || "none"}\n\nDRAFT:\n${draft.content}` },
  ], { model, maxTokens: 8192, temperature: 0.1 });

  return {
    content: verification.content || draft.content,
    route: {
      task: skillPlan.selectedCommand.command,
      documentType: skillPlan.selectedCommand.plugin,
      outputMode: "patricia-brain-source",
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
      serverOnly: true,
    },
    backend: {
      mode: "server-ready",
      runtime: "nodejs",
      orchestration: "patricia-server",
      workflowBrain: "Patricia Brain",
      llmCalls: "server-only",
    },
    answerMode: "patricia-brain",
    sourceQuality: hasDocument ? "patricia-brain-source-plus-user-document" : "patricia-brain-source-only",
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
    extractionKind: "patricia-brain-source",
    extraction: null,
    evidenceLedger: skillPlan.missingInputs.map((missing, index) => ({
      id: `missing-${index + 1}`,
      claim: `Missing input: ${missing}`,
      support: "Required by the selected Patricia Brain workflow before full completion.",
      source: "workflow intake",
      confidence: "high",
      kind: "workflow-gap",
      authority: "Patricia Brain source",
      risk: "high",
    })),
    sources,
  };
}

