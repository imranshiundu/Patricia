export type PatriciaLegalPlugin =
  | "commercial-legal"
  | "corporate-legal"
  | "employment-legal"
  | "privacy-legal"
  | "product-legal"
  | "regulatory-legal"
  | "ai-governance-legal"
  | "ip-legal"
  | "litigation-legal"
  | "legal-clinic"
  | "law-student"
  | "legal-builder-hub";

export type PatriciaSkillStage =
  | "setup"
  | "intake"
  | "review"
  | "draft"
  | "research"
  | "triage"
  | "monitor"
  | "scheduled"
  | "learning"
  | "governance"
  | "trust-gate";

export type PatriciaSkillSourceType = "skill" | "agent" | "managed-agent";
export type PatriciaSkillRisk = "low" | "medium" | "high" | "review-required";

export type PatriciaSkillCommand = {
  plugin: PatriciaLegalPlugin;
  slug: string;
  command: string;
  agent: string;
  stage: PatriciaSkillStage;
  sourceType?: PatriciaSkillSourceType;
  sourcePath?: string;
  shortDescription: string;
  userButton: string;
  requiresDocument: boolean;
  requiresPracticeProfile: boolean;
  requiresConnector?: boolean;
  risk: PatriciaSkillRisk;
  promptFrame: string;
  expectedInputs: string[];
  outputChecklist: string[];
  reviewGate: string;
};

export type PatriciaSkillRunContext = {
  command?: string;
  question: string;
  documentText?: string;
  documentTitle?: string;
  citation?: string;
  practiceProfile?: string;
  previousMessages?: unknown[];
};

export type PatriciaSkillRunPlan = {
  selectedCommand: PatriciaSkillCommand;
  normalizedQuestion: string;
  intakeChecklist: string[];
  missingInputs: string[];
  systemAddendum: string;
  userPromptAddendum: string;
  shouldAskForDocument: boolean;
  shouldAskForPracticeProfile: boolean;
};

export const WORKFLOW_REVIEW_WARNING =
  "Every output is a draft for review. Patricia manages the shell; Claude-for-legal provides the workflow source.";
