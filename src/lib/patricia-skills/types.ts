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
  | "intake"
  | "review"
  | "draft"
  | "research"
  | "triage"
  | "monitor"
  | "learning"
  | "governance"
  | "trust-gate";

export type PatriciaSkillRisk = "low" | "medium" | "high" | "attorney-review-required";

export type PatriciaSkillCommand = {
  plugin: PatriciaLegalPlugin;
  slug: string;
  command: string;
  agent: string;
  stage: PatriciaSkillStage;
  shortDescription: string;
  userButton: string;
  requiresDocument: boolean;
  requiresPracticeProfile: boolean;
  requiresConnector?: boolean;
  risk: PatriciaSkillRisk;
  promptFrame: string;
  expectedInputs: string[];
  outputChecklist: string[];
  attorneyReviewGate: string;
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

export const ATTORNEY_REVIEW_WARNING =
  "Every legal output is a draft for attorney review. It is not legal advice, not a legal conclusion, and not a substitute for a qualified lawyer.";
