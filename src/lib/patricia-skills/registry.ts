import { ATTORNEY_REVIEW_WARNING, PatriciaSkillCommand, PatriciaSkillRunContext, PatriciaSkillRunPlan } from "./types";

export const PATRICIA_LEGAL_COMMANDS: PatriciaSkillCommand[] = [
  {
    plugin: "commercial-legal",
    slug: "review",
    command: "/commercial-legal:review",
    agent: "Vendor Agreement Reviewer / NDA Triager",
    stage: "review",
    shortDescription: "Review a vendor agreement, NDA, SaaS subscription, MSA, order form, or amendment against a playbook.",
    userButton: "Review contract",
    requiresDocument: true,
    requiresPracticeProfile: true,
    requiresConnector: false,
    risk: "attorney-review-required",
    promptFrame: "Act as a commercial legal review workflow. Identify document type, parties, deal context, key business terms, non-standard clauses, missing terms, risks, negotiation positions, and escalation items. Produce a draft review memo, not legal advice.",
    expectedInputs: ["contract or NDA text", "party names", "business context", "fallback position or playbook if available"],
    outputChecklist: ["document summary", "business terms", "key risks", "red/yellow/green triage", "negotiation comments", "escalations", "attorney review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "commercial-legal",
    slug: "amendment-history",
    command: "/commercial-legal:amendment-history",
    agent: "Amendment Tracer",
    stage: "review",
    shortDescription: "Trace how an agreement changed across a base contract and amendments.",
    userButton: "Trace amendments",
    requiresDocument: true,
    requiresPracticeProfile: false,
    risk: "high",
    promptFrame: "Trace amendments against the base agreement. Separate unchanged, added, deleted, superseded, conflicting, and unclear provisions. Cite the source text for each change.",
    expectedInputs: ["base agreement text", "amendment text", "dates or execution order"],
    outputChecklist: ["timeline", "changed clauses", "conflicts", "current operative position", "missing documents", "review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "privacy-legal",
    slug: "dsar-response",
    command: "/privacy-legal:dsar-response",
    agent: "DSAR Responder",
    stage: "draft",
    shortDescription: "Draft DSAR acknowledgement, tracking plan, and response structure.",
    userButton: "DSAR response",
    requiresDocument: false,
    requiresPracticeProfile: true,
    requiresConnector: false,
    risk: "attorney-review-required",
    promptFrame: "Run a privacy request workflow. Identify request type, requester identity checks, deadline assumptions, data locations, exemptions to verify, response steps, and draft user-facing correspondence.",
    expectedInputs: ["request text", "date received", "jurisdiction", "identity status", "systems to search"],
    outputChecklist: ["classification", "deadline", "identity checks", "search plan", "draft acknowledgement", "draft response", "lawyer review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "privacy-legal",
    slug: "pia-generation",
    command: "/privacy-legal:pia-generation",
    agent: "PIA Generator",
    stage: "governance",
    shortDescription: "Generate a privacy impact assessment for a product, feature, vendor, or processing activity.",
    userButton: "Privacy impact",
    requiresDocument: false,
    requiresPracticeProfile: true,
    risk: "high",
    promptFrame: "Create a privacy impact assessment. Identify data types, subjects, purpose, lawful basis to verify, retention, transfers, security controls, vendor exposure, user rights impact, and unresolved legal questions.",
    expectedInputs: ["feature or activity description", "data categories", "users affected", "vendors", "jurisdictions"],
    outputChecklist: ["processing summary", "data map", "risk analysis", "mitigations", "open questions", "review gate"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "product-legal",
    slug: "launch-review",
    command: "/product-legal:launch-review",
    agent: "Launch Reviewer",
    stage: "triage",
    shortDescription: "Review a product launch, feature, marketing flow, or public claim for legal risk.",
    userButton: "Launch review",
    requiresDocument: false,
    requiresPracticeProfile: true,
    risk: "high",
    promptFrame: "Run a product legal launch review. Map claims, user impact, privacy, consumer protection, safety, competition, IP, regulatory, and contract risks. Give a risk-calibrated launch decision draft.",
    expectedInputs: ["feature description", "market", "user group", "claims/copy", "launch date"],
    outputChecklist: ["launch summary", "risk map", "blockers", "mitigations", "approval path", "attorney review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "employment-legal",
    slug: "termination-review",
    command: "/employment-legal:termination-review",
    agent: "Termination Reviewer",
    stage: "review",
    shortDescription: "Review proposed termination facts and flag employment risk before action.",
    userButton: "Termination risk",
    requiresDocument: false,
    requiresPracticeProfile: true,
    risk: "attorney-review-required",
    promptFrame: "Run an employment termination review. Identify employee status, protected activity, documentation, timing, jurisdiction, notice/severance assumptions, discrimination/retaliation risk, and final approval gates.",
    expectedInputs: ["jurisdiction", "employee role", "facts", "performance record", "proposed date", "prior complaints or leave"],
    outputChecklist: ["fact timeline", "risk flags", "missing documents", "process checklist", "communication draft", "attorney review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "regulatory-legal",
    slug: "policy-diff",
    command: "/regulatory-legal:policy-diff",
    agent: "Policy Diff",
    stage: "review",
    shortDescription: "Compare a regulation, policy, or public document against an existing policy or practice.",
    userButton: "Policy diff",
    requiresDocument: true,
    requiresPracticeProfile: false,
    requiresConnector: false,
    risk: "high",
    promptFrame: "Run a regulatory policy diff. Separate what changed, what stayed the same, what creates a gap, what needs owner review, and what cannot be verified from the supplied documents.",
    expectedInputs: ["old policy", "new policy/regulation", "business practice if available"],
    outputChecklist: ["added requirements", "removed requirements", "changed requirements", "gaps", "owners", "deadlines", "review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "ai-governance-legal",
    slug: "use-case-triage",
    command: "/ai-governance-legal:use-case-triage",
    agent: "AI Use Case Triager",
    stage: "governance",
    shortDescription: "Classify an AI system or AI feature for governance, privacy, safety, and regulatory risk.",
    userButton: "AI use case",
    requiresDocument: false,
    requiresPracticeProfile: true,
    risk: "high",
    promptFrame: "Run AI governance triage. Identify AI purpose, users affected, data inputs, automation level, human oversight, model supplier, risk category, notices, testing, documentation, and approval gates.",
    expectedInputs: ["AI system description", "users affected", "data used", "model/vendor", "jurisdictions", "deployment stage"],
    outputChecklist: ["classification", "risk level", "documentation required", "controls", "open legal questions", "approval gate"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "ip-legal",
    slug: "oss-review",
    command: "/ip-legal:oss-review",
    agent: "OSS Compliance Checker",
    stage: "review",
    shortDescription: "Review open-source licenses against a product deployment model.",
    userButton: "OSS review",
    requiresDocument: false,
    requiresPracticeProfile: false,
    risk: "high",
    promptFrame: "Run OSS compliance review. Identify license, dependency role, distribution model, obligations, copyleft exposure, notice requirements, source disclosure risk, and legal review items.",
    expectedInputs: ["dependency list", "licenses", "usage", "distribution model", "product type"],
    outputChecklist: ["license table", "obligations", "risk flags", "remediation", "unknowns", "attorney review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "litigation-legal",
    slug: "chronology",
    command: "/litigation-legal:chronology",
    agent: "Chronology Builder",
    stage: "research",
    shortDescription: "Build a cited timeline from pleadings, correspondence, notes, or uploaded documents.",
    userButton: "Build chronology",
    requiresDocument: true,
    requiresPracticeProfile: false,
    risk: "high",
    promptFrame: "Build or update a litigation chronology. Extract dated facts, source references, actor, event, legal significance, disputed status, and missing records. Do not invent dates.",
    expectedInputs: ["source documents", "matter name", "date range", "issue focus"],
    outputChecklist: ["timeline", "source per entry", "disputed facts", "missing evidence", "next document requests", "review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "litigation-legal",
    slug: "brief-section-drafter",
    command: "/litigation-legal:brief-section-drafter",
    agent: "Brief Section Drafter",
    stage: "draft",
    shortDescription: "Draft a litigation brief section from supplied facts, authorities, and theory.",
    userButton: "Draft brief section",
    requiresDocument: true,
    requiresPracticeProfile: true,
    risk: "attorney-review-required",
    promptFrame: "Draft a brief section using only supplied facts and authorities. Separate argument, record cites to verify, authority cites to verify, weaknesses, and lawyer review notes.",
    expectedInputs: ["issue", "facts", "authorities", "desired position", "court or forum"],
    outputChecklist: ["draft section", "authority table", "record cites", "weaknesses", "verification list", "attorney review note"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "legal-clinic",
    slug: "client-intake",
    command: "/legal-clinic:client-intake",
    agent: "Clinic Intake",
    stage: "intake",
    shortDescription: "Run structured client intake with issue spotting, conflict flags, and missing documents.",
    userButton: "Client intake",
    requiresDocument: false,
    requiresPracticeProfile: false,
    risk: "attorney-review-required",
    promptFrame: "Run legal clinic intake. Collect parties, timeline, issue categories, urgent deadlines, documents, goals, risk flags, conflict concerns, and supervisor handoff notes. Do not give legal advice.",
    expectedInputs: ["client story", "parties", "dates", "documents", "goals"],
    outputChecklist: ["intake summary", "issue map", "deadlines", "documents needed", "conflict flags", "supervisor handoff"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "law-student",
    slug: "case-brief",
    command: "/law-student:case-brief",
    agent: "Case Briefer",
    stage: "learning",
    shortDescription: "Brief a case for learning with facts, issue, rule, reasoning, holding, and class notes.",
    userButton: "Case brief",
    requiresDocument: true,
    requiresPracticeProfile: false,
    risk: "medium",
    promptFrame: "Brief a case for learning. Use source text only. Extract facts, procedural history, issue, rule, reasoning, holding, disposition, and exam relevance. Do not invent missing facts.",
    expectedInputs: ["case text", "class topic if any", "preferred brief format"],
    outputChecklist: ["facts", "procedural history", "issue", "rule", "holding", "reasoning", "exam note", "unknowns"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
  {
    plugin: "law-student",
    slug: "irac-practice",
    command: "/law-student:irac-practice",
    agent: "IRAC Grader",
    stage: "learning",
    shortDescription: "Grade or improve an IRAC answer without replacing student learning.",
    userButton: "IRAC grader",
    requiresDocument: false,
    requiresPracticeProfile: false,
    risk: "low",
    promptFrame: "Act as an IRAC writing coach. Grade issue spotting, rule accuracy, application, conclusion, structure, and missing facts. Give feedback and a rewrite plan, not a hidden answer dump.",
    expectedInputs: ["student answer", "fact pattern", "rubric if available"],
    outputChecklist: ["scorecard", "missed issues", "rule feedback", "analysis feedback", "revision plan", "practice prompt"],
    attorneyReviewGate: ATTORNEY_REVIEW_WARNING,
  },
];

const DEFAULT_COMMAND = PATRICIA_LEGAL_COMMANDS.find((command) => command.command === "/legal-clinic:client-intake") || PATRICIA_LEGAL_COMMANDS[0];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getPatriciaLegalCommand(command?: string) {
  if (!command) return null;
  return PATRICIA_LEGAL_COMMANDS.find((item) => item.command === command || item.slug === command || `${item.plugin}:${item.slug}` === command) || null;
}

export function inferPatriciaLegalCommand(question: string) {
  const text = normalize(question);
  const explicit = text.match(/\/[a-z-]+:[a-z-]+/i)?.[0];
  if (explicit) return getPatriciaLegalCommand(explicit) || DEFAULT_COMMAND;

  if (/(nda|msa|vendor agreement|saas|order form|contract review|commercial agreement)/.test(text)) return getPatriciaLegalCommand("/commercial-legal:review") || DEFAULT_COMMAND;
  if (/(amendment|changed from the original|base agreement|supersede)/.test(text)) return getPatriciaLegalCommand("/commercial-legal:amendment-history") || DEFAULT_COMMAND;
  if (/(dsar|data subject|access request|delete my data|privacy request)/.test(text)) return getPatriciaLegalCommand("/privacy-legal:dsar-response") || DEFAULT_COMMAND;
  if (/(pia|dpia|privacy impact|processing activity|personal data)/.test(text)) return getPatriciaLegalCommand("/privacy-legal:pia-generation") || DEFAULT_COMMAND;
  if (/(launch|feature|marketing claim|copy review|product risk)/.test(text)) return getPatriciaLegalCommand("/product-legal:launch-review") || DEFAULT_COMMAND;
  if (/(terminate|termination|fire employee|dismiss employee|redundancy)/.test(text)) return getPatriciaLegalCommand("/employment-legal:termination-review") || DEFAULT_COMMAND;
  if (/(policy diff|regulatory change|gap analysis|changed regulation|new regulation)/.test(text)) return getPatriciaLegalCommand("/regulatory-legal:policy-diff") || DEFAULT_COMMAND;
  if (/(ai use case|ai governance|model risk|automated decision|vendor ai)/.test(text)) return getPatriciaLegalCommand("/ai-governance-legal:use-case-triage") || DEFAULT_COMMAND;
  if (/(open source|oss|license compliance|gpl|mit license|apache license)/.test(text)) return getPatriciaLegalCommand("/ip-legal:oss-review") || DEFAULT_COMMAND;
  if (/(chronology|timeline|dated facts|litigation timeline)/.test(text)) return getPatriciaLegalCommand("/litigation-legal:chronology") || DEFAULT_COMMAND;
  if (/(brief section|draft argument|motion section|legal argument)/.test(text)) return getPatriciaLegalCommand("/litigation-legal:brief-section-drafter") || DEFAULT_COMMAND;
  if (/(case brief|brief this case|holding|procedural history)/.test(text)) return getPatriciaLegalCommand("/law-student:case-brief") || DEFAULT_COMMAND;
  if (/(irac|essay|grade my answer|law exam)/.test(text)) return getPatriciaLegalCommand("/law-student:irac-practice") || DEFAULT_COMMAND;
  return DEFAULT_COMMAND;
}

export function buildPatriciaSkillRunPlan(context: PatriciaSkillRunContext): PatriciaSkillRunPlan {
  const selectedCommand = getPatriciaLegalCommand(context.command) || inferPatriciaLegalCommand(context.question);
  const hasDocument = Boolean(context.documentText?.trim());
  const hasPracticeProfile = Boolean(context.practiceProfile?.trim());
  const missingInputs: string[] = [];

  if (selectedCommand.requiresDocument && !hasDocument) missingInputs.push("source document or facts");
  if (selectedCommand.requiresPracticeProfile && !hasPracticeProfile) missingInputs.push("practice profile or playbook assumptions");

  const intakeChecklist = selectedCommand.expectedInputs.map((input) => `${hasDocument || !/document|contract|agreement|case text|source/i.test(input) ? "check" : "missing"}: ${input}`);
  const normalizedQuestion = context.question.includes(selectedCommand.command) ? context.question : `${selectedCommand.command}\n${context.question}`;

  const systemAddendum = [
    "Claude-for-legal inspired workflow mode is active.",
    `Selected legal plugin: ${selectedCommand.plugin}.`,
    `Selected command: ${selectedCommand.command}.`,
    `Agent: ${selectedCommand.agent}.`,
    `Workflow stage: ${selectedCommand.stage}.`,
    selectedCommand.promptFrame,
    selectedCommand.attorneyReviewGate,
    "Do not use old generic Patricia legal commands. This selected skill controls the legal workflow.",
    "If required inputs are missing, provide a useful intake checklist and clearly mark what cannot be completed yet.",
  ].join("\n");

  const userPromptAddendum = [
    `Run command: ${selectedCommand.command}`,
    `Agent: ${selectedCommand.agent}`,
    `Task: ${selectedCommand.shortDescription}`,
    `Expected output checklist: ${selectedCommand.outputChecklist.join("; ")}`,
    missingInputs.length ? `Missing inputs to flag: ${missingInputs.join(", ")}` : "All minimum local inputs appear present.",
    "End with attorney-review warning in plain language.",
  ].join("\n");

  return {
    selectedCommand,
    normalizedQuestion,
    intakeChecklist,
    missingInputs,
    systemAddendum,
    userPromptAddendum,
    shouldAskForDocument: selectedCommand.requiresDocument && !hasDocument,
    shouldAskForPracticeProfile: selectedCommand.requiresPracticeProfile && !hasPracticeProfile,
  };
}
