import { PatriciaSkillCommand, PatriciaSkillRunContext, PatriciaSkillRunPlan, WORKFLOW_REVIEW_WARNING } from "./types";

const RAW_COMMANDS = `
commercial-legal|review|Vendor Agreement Reviewer|Review contract|review|1|1|0
commercial-legal|amendment-history|Amendment Tracer|Trace amendments|review|1|0|0
commercial-legal|escalation-flagger|Escalation Router|Route escalation|triage|1|1|0
commercial-legal|renewal-watcher|Renewal Watcher|Renewal watcher|scheduled|0|1|1
corporate-legal|tabular-review|Tabular Diligence Review|Diligence table|review|1|1|1
corporate-legal|diligence-issue-extraction|Issue Extractor|Extract issues|review|1|1|1
corporate-legal|written-consent|Board Consent Drafter|Draft consent|draft|1|1|1
corporate-legal|material-contract-schedule|Material Contracts Schedule Builder|Build schedule|draft|1|1|1
corporate-legal|entity-compliance|Entity Compliance Tracker|Entity compliance|monitor|0|1|1
corporate-legal|closing-checklist|Closing Checklist Driver|Closing checklist|monitor|1|1|1
corporate-legal|integration-management|Integration Runbook|Integration plan|draft|1|1|1
corporate-legal|data-room-watcher|Data Room Watcher|Data room watcher|scheduled|0|1|1
employment-legal|termination-review|Termination Reviewer|Termination risk|review|0|1|0
employment-legal|hiring-review|Hire Reviewer|Hire review|review|1|1|0
employment-legal|worker-classification|Worker Classification Screener|Classify worker|triage|0|1|0
employment-legal|investigation-open|Investigation Lead|Open investigation|intake|0|1|0
employment-legal|policy-drafting|Policy Drafter|Draft policy|draft|0|1|0
employment-legal|expansion-kickoff|International Expansion Planner|Expansion plan|draft|0|1|0
employment-legal|wage-hour-qa|Wage & Hour Q&A|Wage Q&A|triage|0|1|0
employment-legal|leave-tracker|Leave Tracker|Leave tracker|scheduled|0|1|1
privacy-legal|dsar-response|DSAR Responder|DSAR response|draft|0|1|0
privacy-legal|dpa-review|DPA Reviewer|DPA review|review|1|1|0
privacy-legal|pia-generation|PIA Generator|Privacy impact|governance|0|1|0
privacy-legal|use-case-triage|Privacy Triager|Privacy triage|triage|0|1|0
privacy-legal|reg-gap-analysis|Privacy Reg Gap Checker|Privacy gap|review|1|1|1
privacy-legal|policy-monitor|Privacy Policy Monitor|Privacy monitor|monitor|0|1|1
product-legal|launch-review|Launch Reviewer|Launch review|triage|0|1|0
product-legal|marketing-claims-review|Marketing Claims Checker|Claims check|review|1|1|0
product-legal|is-this-a-problem|Is this a problem? Triage|Quick triage|triage|0|1|0
product-legal|launch-watcher|Launch Watcher|Launch watcher|scheduled|0|1|1
regulatory-legal|reg-feed-watcher|On-demand Reg Check|Reg feed check|monitor|0|1|1
regulatory-legal|policy-diff|Policy Diff|Policy diff|review|1|1|0
regulatory-legal|gaps|Gap Tracker|Gap tracker|monitor|0|1|1
regulatory-legal|policy-redraft|Policy Redrafter|Policy redraft|draft|1|1|0
regulatory-legal|comments|NPRM Comment Tracker|Comment tracker|monitor|0|1|1
ai-governance-legal|use-case-triage|AI Use Case Triager|AI use case|governance|0|1|0
ai-governance-legal|aia-generation|AI Impact Assessor|AI impact|governance|0|1|0
ai-governance-legal|vendor-ai-review|Vendor AI Reviewer|Vendor AI|review|1|1|0
ai-governance-legal|reg-gap-analysis|AI Reg Gap Checker|AI reg gap|review|1|1|1
ai-governance-legal|policy-monitor|AI Policy Monitor|AI monitor|monitor|0|1|1
ip-legal|clearance|Trademark Clearance Screener|TM clearance|research|0|1|1
ip-legal|cease-desist|Cease & Desist Drafter|C&D draft|draft|1|1|0
ip-legal|takedown|DMCA Takedown|Takedown|draft|1|1|0
ip-legal|oss-review|OSS Compliance Checker|OSS review|review|0|0|0
ip-legal|fto-triage|FTO Triager|FTO triage|triage|1|1|1
ip-legal|infringement-triage|Infringement Triager|Infringement|triage|1|1|1
ip-legal|ip-clause-review|IP Clause Reviewer|IP clause|review|1|1|0
ip-legal|portfolio|IP Portfolio Tracker|IP portfolio|monitor|0|1|1
ip-legal|renewal-watcher|IP Renewal Watcher|IP renewals|scheduled|0|1|1
litigation-legal|claim-chart|Claim Chart Builder|Claim chart|draft|1|1|0
litigation-legal|demand-draft|Demand Letter Drafter|Demand draft|draft|1|1|0
litigation-legal|demand-intake|Demand Intake|Demand intake|intake|0|1|0
litigation-legal|demand-received|Demand Received Triage|Demand triage|triage|1|1|0
litigation-legal|subpoena-triage|Subpoena Triage|Subpoena|triage|1|1|0
litigation-legal|chronology|Chronology Builder|Chronology|research|1|0|0
litigation-legal|deposition-prep|Deposition Prep|Depo prep|draft|1|1|0
litigation-legal|brief-section-drafter|Brief Section Drafter|Brief draft|draft|1|1|0
litigation-legal|privilege-log-review|Privilege Log Reviewer|Privilege log|review|1|1|0
litigation-legal|legal-hold|Legal Hold|Legal hold|monitor|0|1|1
litigation-legal|matter-intake|Matter Intake|Matter intake|intake|0|1|0
litigation-legal|matter-briefing|Matter Briefing|Matter brief|draft|1|1|0
litigation-legal|portfolio-status|Portfolio Status|Portfolio|monitor|0|1|1
litigation-legal|oc-status|Outside Counsel Status|OC status|draft|0|1|1
litigation-legal|docket-watcher|Docket Watcher|Docket watcher|scheduled|0|1|1
legal-clinic|client-intake|Clinic Intake|Client intake|intake|0|0|0
legal-clinic|memo|Case Memo Scaffold|Memo scaffold|draft|1|0|0
legal-clinic|research-start|Research Roadmap|Research roadmap|research|0|0|0
legal-clinic|deadlines|Clinic Deadline Tracker|Deadlines|monitor|0|0|0
legal-clinic|status|Case Status Summarizer|Case status|draft|1|0|0
legal-clinic|client-letter|Client Letter Drafter|Client letter|draft|0|0|0
legal-clinic|ramp|Student Ramp|Student ramp|learning|0|0|0
legal-clinic|semester-handoff|Semester Handoff|Handoff|draft|1|0|0
legal-clinic|supervisor-review-queue|Supervisor Review Queue|Review queue|monitor|0|0|1
law-student|bar-prep-questions|Bar Prep Coach|Bar prep|learning|0|0|0
law-student|socratic-drill|Socratic Drill Sergeant|Socratic drill|learning|0|0|0
law-student|irac-practice|IRAC Grader|IRAC grader|learning|0|0|0
law-student|case-brief|Case Briefer|Case brief|learning|1|0|0
law-student|outline-builder|Outline Builder|Outline|learning|1|0|0
law-student|cold-call-prep|Cold Call Prep|Cold call|learning|1|0|0
law-student|exam-forecast|Exam Forecaster|Exam forecast|learning|1|0|0
law-student|legal-writing|Legal Writing Critic|Writing critic|learning|1|0|0
law-student|flashcards|Flashcards|Flashcards|learning|0|0|0
law-student|study-plan|Study Planner|Study plan|learning|0|0|0
legal-builder-hub|registry-browser|Skill Registry Browser|Registry|trust-gate|0|0|1
legal-builder-hub|skill-installer|Skill Installer|Install skill|trust-gate|0|0|1
legal-builder-hub|skills-qa|Skill QA|Skill QA|trust-gate|1|0|0
legal-builder-hub|related-skills-surfacer|Community Skill Recommender|Recommend skills|trust-gate|0|0|1
legal-builder-hub|auto-updater|Community Skill Updater|Update skills|scheduled|0|0|1
`;

function makeCommand(row: string): PatriciaSkillCommand {
  const [plugin, slug, agent, userButton, stage, needsDocument, needsProfile, needsConnector] = row.split("|");
  const isAgent = stage === "scheduled";
  return {
    plugin: plugin as PatriciaSkillCommand["plugin"],
    slug,
    command: `/${plugin}:${slug}`,
    agent,
    stage: stage as PatriciaSkillCommand["stage"],
    sourceType: isAgent ? "agent" : "skill",
    sourcePath: isAgent ? `${plugin}/agents/${slug}.md` : `${plugin}/skills/${slug}/SKILL.md`,
    shortDescription: `${agent} workflow from claude-for-legal.`,
    userButton,
    requiresDocument: needsDocument === "1",
    requiresPracticeProfile: needsProfile === "1",
    requiresConnector: needsConnector === "1",
    risk: stage === "learning" ? "medium" : "review-required",
    promptFrame: `Run the Claude-for-legal ${agent} workflow from its source file.`,
    expectedInputs: ["task description", "facts", "source document where applicable", "practice profile where applicable", "connector output where applicable"],
    outputChecklist: ["workflow used", "facts reviewed", "analysis or draft", "missing inputs", "review gate", "next actions"],
    reviewGate: WORKFLOW_REVIEW_WARNING,
  };
}

export const PATRICIA_LEGAL_COMMANDS: PatriciaSkillCommand[] = RAW_COMMANDS.trim().split("\n").map(makeCommand);
export const PATRICIA_VISIBLE_COMMANDS = PATRICIA_LEGAL_COMMANDS.filter((command) => command.stage !== "scheduled");
export const PATRICIA_SCHEDULED_COMMANDS = PATRICIA_LEGAL_COMMANDS.filter((command) => command.stage === "scheduled");
export const PATRICIA_PLUGIN_GROUPS = Array.from(new Set(PATRICIA_LEGAL_COMMANDS.map((command) => command.plugin)));

const DEFAULT_COMMAND = PATRICIA_LEGAL_COMMANDS.find((command) => command.command === "/commercial-legal:review") || PATRICIA_LEGAL_COMMANDS[0];

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
  const hit = PATRICIA_LEGAL_COMMANDS.find((item) => text.includes(item.slug.replace(/-/g, " ")) || text.includes(item.agent.toLowerCase().split(" ")[0]));
  return hit || DEFAULT_COMMAND;
}

export function buildPatriciaSkillRunPlan(context: PatriciaSkillRunContext): PatriciaSkillRunPlan {
  const selectedCommand = getPatriciaLegalCommand(context.command) || inferPatriciaLegalCommand(context.question);
  const hasDocument = Boolean(context.documentText?.trim());
  const hasPracticeProfile = Boolean(context.practiceProfile?.trim());
  const missingInputs: string[] = [];

  if (selectedCommand.requiresDocument && !hasDocument) missingInputs.push("source document or facts");
  if (selectedCommand.requiresPracticeProfile && !hasPracticeProfile) missingInputs.push("practice profile or playbook");
  if (selectedCommand.requiresConnector) missingInputs.push("connector output if this workflow depends on external systems");

  const intakeChecklist = selectedCommand.expectedInputs.map((input) => `${hasDocument || !/document|contract|agreement|case text|source/i.test(input) ? "check" : "missing"}: ${input}`);
  const normalizedQuestion = context.question.includes(selectedCommand.command) ? context.question : `${selectedCommand.command}\n${context.question}`;

  return {
    selectedCommand,
    normalizedQuestion,
    intakeChecklist,
    missingInputs,
    systemAddendum: `Claude-for-legal source mode: ${selectedCommand.sourcePath}`,
    userPromptAddendum: `Run ${selectedCommand.command}. Outputs: ${selectedCommand.outputChecklist.join("; ")}`,
    shouldAskForDocument: selectedCommand.requiresDocument && !hasDocument,
    shouldAskForPracticeProfile: selectedCommand.requiresPracticeProfile && !hasPracticeProfile,
  };
}
