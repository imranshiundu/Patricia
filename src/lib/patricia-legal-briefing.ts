import { PatriciaResearchResult } from "@/lib/patricia-research";

export type PatriciaJurisdiction = "kenya" | "uganda" | "tanzania" | "zanzibar" | "rwanda" | "burundi" | "eac" | "east-africa" | "unknown";
export type PatriciaDocumentType = "case-law" | "constitution" | "statute" | "bill" | "regulation" | "policy" | "budget" | "gazette" | "contract" | "public-notice" | "news-context" | "unknown";
export type PatriciaTask = "case-brief" | "policy-decoder" | "citizen-impact" | "legal-research" | "clause-lookup" | "document-summary" | "compare-documents" | "memo-draft" | "student-notes" | "journalist-brief" | "business-risk" | "general-chat";
export type PatriciaPersona = "citizen" | "student" | "journalist" | "lawyer" | "ngo" | "business-owner" | "county-official" | "researcher" | "general";
export type PatriciaOutputMode = "professional" | "plain-english" | "eli12" | "swahili" | "sheng-lite" | "legalese";
export type PatriciaEvidenceAuthority = "primary-official" | "official-secondary" | "legal-index" | "institutional-analysis" | "news-context" | "user-provided" | "unknown";
export type PatriciaConfidence = "high" | "medium" | "low" | "unsupported";
export type PatriciaEvidenceKind = "local-text" | "source-lead" | "model-extraction" | "inference" | "direct-quote" | "section-reference" | "case-holding" | "statutory-text" | "policy-text" | "document-fact" | "unsupported";
export type PatriciaRiskLevel = "low" | "medium" | "high" | "critical";

export type PatriciaEvidenceItem = {
  id?: string;
  claim: string;
  support: string;
  source: string;
  sourceId?: string;
  section?: string;
  page?: number;
  paragraph?: string;
  confidence: PatriciaConfidence;
  kind: PatriciaEvidenceKind;
  authority?: PatriciaEvidenceAuthority;
  risk?: PatriciaRiskLevel;
};

export type PatriciaSource = {
  id: string;
  title: string;
  url?: string;
  sourceName?: string;
  jurisdiction?: PatriciaJurisdiction;
  documentType?: PatriciaDocumentType;
  authority?: PatriciaEvidenceAuthority;
  excerpt?: string;
  section?: string;
  page?: number;
  paragraph?: string;
  retrievedAt?: string;
};

export type PatriciaRouteDecision = {
  task: PatriciaTask;
  jurisdiction: PatriciaJurisdiction;
  documentType: PatriciaDocumentType;
  persona: PatriciaPersona;
  outputMode: PatriciaOutputMode;
  needsResearch: boolean;
  needsLocalDocument: boolean;
  needsComparison: boolean;
  needsHumanReview: boolean;
  riskLevel: PatriciaRiskLevel;
  reason: string;
};

export type PatriciaCaseExtraction = {
  case_metadata?: {
    case_name?: string;
    citation?: string;
    neutral_citation?: string;
    case_number?: string;
    court?: string;
    judge?: string;
    date?: string;
    origin?: string;
    jurisdiction?: PatriciaJurisdiction;
  };
  procedural_history?: string;
  material_facts?: string[];
  issues?: string[];
  applicable_law?: string[];
  holding?: string;
  reasoning?: string[];
  orders?: string[];
  legal_principles?: string[];
  missing_information?: string[];
};

export type PatriciaDocumentExtraction = {
  document_metadata?: {
    title?: string;
    document_type?: PatriciaDocumentType;
    jurisdiction?: PatriciaJurisdiction;
    issuing_body?: string;
    date?: string;
    version?: string;
    source?: string;
  };
  plain_summary?: string;
  key_points?: string[];
  rights?: string[];
  obligations?: string[];
  penalties?: string[];
  deadlines?: string[];
  fees_or_costs?: string[];
  affected_groups?: string[];
  unclear_or_missing_information?: string[];
};

export type PatriciaAnswerContract = {
  route: PatriciaRouteDecision;
  answer: string;
  confidence: PatriciaConfidence;
  trustScore: number;
  evidenceLedger: PatriciaEvidenceItem[];
  sources: PatriciaSource[];
  unsupportedClaims: string[];
  followUpChecks: string[];
  releaseSafe: boolean;
};

export const PATRICIA_RELEASE_STANDARD = {
  minimumTrustScore: 72,
  requireCitationForLegalClaims: true,
  requireAbstentionWhenUnsupported: true,
  requirePrimarySourceForFinalLegalPosition: true,
  allowNewsOnlyAsContext: false,
  maximumUnsupportedClaims: 0,
} as const;

export const PATRICIA_SYSTEM_PRINCIPLES = [
  "Use source-grounded reasoning before final answers.",
  "Do not invent cases, statutes, sections, judges, dates, holdings, duties, deadlines, or amounts.",
  "Separate verified facts, source leads, significance, and inference.",
  "News may explain context, but it is not treated as binding source text.",
  "When support is missing, say what Patricia could not verify.",
] as const;

const AUTHORITY_SCORE: Record<PatriciaEvidenceAuthority, number> = {
  "primary-official": 1,
  "official-secondary": 0.86,
  "legal-index": 0.74,
  "institutional-analysis": 0.62,
  "user-provided": 0.58,
  "news-context": 0.34,
  unknown: 0.2,
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cleanFence(value: string) {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

export function parseLooseJson<T>(value: string): T | null {
  try {
    return JSON.parse(cleanFence(value)) as T;
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      try {
        return JSON.parse(fenced) as T;
      } catch {
        return null;
      }
    }

    const objectStart = value.indexOf("{");
    const objectEnd = value.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(value.slice(objectStart, objectEnd + 1)) as T;
      } catch {
        return null;
      }
    }

    const arrayStart = value.indexOf("[");
    const arrayEnd = value.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(value.slice(arrayStart, arrayEnd + 1)) as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}

export function safeJsonParse<T>(raw: string, fallback: T): T {
  return parseLooseJson<T>(raw) ?? fallback;
}

export function classifyJurisdiction(input: string): PatriciaJurisdiction {
  const text = normalize(input);
  if (/(kenya|kenyan|kenya law|nairobi|mombasa|kisumu)/.test(text)) return "kenya";
  if (/(uganda|ugandan|ulii|kampala)/.test(text)) return "uganda";
  if (/(tanzania|tanzanian|tanzlii|dar es salaam)/.test(text)) return "tanzania";
  if (/(zanzibar|zanzlii|zanzibarlii)/.test(text)) return "zanzibar";
  if (/(rwanda|rwandan|kigali)/.test(text)) return "rwanda";
  if (/(burundi|bujumbura)/.test(text)) return "burundi";
  if (/(east african court|eacj|east african community|eac treaty)/.test(text)) return "eac";
  if (/(east africa|east african)/.test(text)) return "east-africa";
  return "unknown";
}

export function classifyDocumentType(input: string): PatriciaDocumentType {
  const text = normalize(input);
  if (/(republic v|v republic|versus|plaintiff|defendant|appellant|respondent|judgment|ruling|holding|court)/.test(text)) return "case-law";
  if (/(constitution|article \d+|bill of rights)/.test(text)) return "constitution";
  if (/(act no|laws of kenya|section \d+|statute|cap\.? \d+)/.test(text)) return "statute";
  if (/(finance bill|bill,? \d{4}|national assembly bill)/.test(text)) return "bill";
  if (/(regulation|rules|order|statutory instrument)/.test(text)) return "regulation";
  if (/(policy|sessional paper|framework|strategy)/.test(text)) return "policy";
  if (/(budget|appropriation|estimates|finance statement)/.test(text)) return "budget";
  if (/(gazette|legal notice)/.test(text)) return "gazette";
  if (/(agreement|contract|party|termination clause)/.test(text)) return "contract";
  if (/(public notice|circular|directive|notice to)/.test(text)) return "public-notice";
  if (/(news|reported|daily nation|standard media|business daily)/.test(text)) return "news-context";
  return "unknown";
}

export function inferPersona(input: string): PatriciaPersona {
  const text = normalize(input);
  if (/(student|class|exam|assignment|eli12|explain like)/.test(text)) return "student";
  if (/(journalist|newsroom|story|article|headline|editor)/.test(text)) return "journalist";
  if (/(advocate|lawyer|counsel|legal opinion|memo|firm)/.test(text)) return "lawyer";
  if (/(ngo|civil society|community|rights group|advocacy)/.test(text)) return "ngo";
  if (/(business|company|startup|tax|compliance|license)/.test(text)) return "business-owner";
  if (/(county|ward|assembly|governor|mca|public participation)/.test(text)) return "county-official";
  if (/(research|study|paper|report)/.test(text)) return "researcher";
  if (/(citizen|normal person|ordinary|parent|tenant|farmer|employee)/.test(text)) return "citizen";
  return "general";
}

export function inferOutputMode(input: string, persona: PatriciaPersona = "general"): PatriciaOutputMode {
  const text = normalize(input);
  if (/(swahili|kiswahili)/.test(text)) return "swahili";
  if (/(sheng)/.test(text)) return "sheng-lite";
  if (/(eli12|explain like i'?m 12|child|kid)/.test(text)) return "eli12";
  if (/(plain english|simple english|normal people|easy language|simple language)/.test(text)) return "plain-english";
  if (/(legalese|verbatim|technical legal)/.test(text)) return "legalese";
  if (persona === "citizen" || persona === "student") return "plain-english";
  return "professional";
}

export function inferTask(input: string, documentType: PatriciaDocumentType): PatriciaTask {
  const text = normalize(input);
  if (/(compare|difference|old vs new|changed|amendment|previous version)/.test(text)) return "compare-documents";
  if (/(memo|legal opinion|brief for counsel|professional brief)/.test(text)) return "memo-draft";
  if (/(journalist|story|article|headline|newsroom)/.test(text)) return "journalist-brief";
  if (/(business|company|tax|compliance|license|risk)/.test(text)) return "business-risk";
  if (/(student|notes|exam|eli12|simplify)/.test(text)) return "student-notes";
  if (/(who is affected|impact|ordinary people|citizens|parents|students|tenants|farmers)/.test(text)) return "citizen-impact";
  if (/(section|article|clause|paragraph|what does section|what does article)/.test(text)) return "clause-lookup";
  if (documentType === "case-law") return "case-brief";
  if (["policy", "bill", "regulation", "gazette", "budget", "public-notice"].includes(documentType)) return "policy-decoder";
  if (/(summarize|summary|explain|decode|understand)/.test(text)) return "document-summary";
  if (/(find|search|research|look up|lookup)/.test(text)) return "legal-research";
  return "general-chat";
}

export function inferRiskLevel(input: string, task: PatriciaTask): PatriciaRiskLevel {
  const text = normalize(input);
  if (/(urgent|deadline today|court tomorrow|time sensitive)/.test(text)) return "critical";
  if (/(penalty|fine|liability|termination|custody|sentence|injunction)/.test(text)) return "high";
  if (["memo-draft", "business-risk", "legal-research", "case-brief"].includes(task)) return "medium";
  return "low";
}

export function routePatriciaTask(input: string, hasLocalDocument = false): PatriciaRouteDecision {
  const jurisdiction = classifyJurisdiction(input);
  const documentType = classifyDocumentType(input);
  const persona = inferPersona(input);
  const outputMode = inferOutputMode(input, persona);
  const task = inferTask(input, documentType);
  const riskLevel = inferRiskLevel(input, task);
  const needsComparison = task === "compare-documents";
  const needsLocalDocument = ["case-brief", "policy-decoder", "document-summary", "compare-documents", "clause-lookup"].includes(task) && !hasLocalDocument;
  const needsResearch = !hasLocalDocument || ["legal-research", "journalist-brief", "business-risk"].includes(task);
  const needsHumanReview = riskLevel === "critical" || (riskLevel === "high" && ["memo-draft", "business-risk"].includes(task));

  return { task, jurisdiction, documentType, persona, outputMode, needsResearch, needsLocalDocument, needsComparison, needsHumanReview, riskLevel, reason: `Task=${task}; jurisdiction=${jurisdiction}; document=${documentType}; persona=${persona}; mode=${outputMode}; localDocument=${hasLocalDocument}.` };
}

export function rankSourceAuthority(source: Partial<PatriciaSource> | PatriciaResearchResult): PatriciaEvidenceAuthority {
  if ("authority" in source && source.authority === "official") return "primary-official";
  if ("authority" in source && source.authority === "legal-index") return "legal-index";
  if ("authority" in source && source.authority === "news-context") return "news-context";
  const value = normalize(`${"sourceName" in source ? source.sourceName || "" : ""} ${source.title || ""} ${source.url || ""}`);
  if (/(kenya law|kenyalaw|judiciary|court|parliament|national assembly|senate|eacj|government|gazette)/.test(value)) return "primary-official";
  if (/(commission|authority|ministry|office of the)/.test(value)) return "official-secondary";
  if (/(africanlii|ulii|tanzlii|zanzlii|lii)/.test(value)) return "legal-index";
  if (/(world bank|imf|unicef|undp|oecd|policy brief)/.test(value)) return "institutional-analysis";
  if (/(daily nation|standard|business daily|the star|citizen|bbc|reuters)/.test(value)) return "news-context";
  if ("authority" in source && typeof source.authority === "string") return source.authority as PatriciaEvidenceAuthority;
  return "unknown";
}

export function makeEvidenceId(index: number) {
  return `evidence-${String(index + 1).padStart(3, "0")}`;
}

export function buildSourceLedger(results: PatriciaResearchResult[]): PatriciaEvidenceItem[] {
  return results.map((result, index) => {
    const authority = rankSourceAuthority(result);
    return {
      id: makeEvidenceId(index),
      claim: `Research lead found: ${result.title}`,
      support: `${result.sourceName} (${result.country}); authority=${result.authority}; type=${result.kind}; url=${result.url}${result.snippet ? `; snippet=${result.snippet}` : ""}`,
      source: result.url,
      sourceId: result.sourceId,
      confidence: authority === "primary-official" ? "high" : authority === "legal-index" ? "medium" : "low",
      kind: "source-lead",
      authority,
      risk: authority === "news-context" ? "medium" : "low",
    } satisfies PatriciaEvidenceItem;
  });
}

export function buildExtractionLedger(extraction: PatriciaCaseExtraction | null): PatriciaEvidenceItem[] {
  if (!extraction) return [];
  const items: PatriciaEvidenceItem[] = [];
  const metadata = extraction.case_metadata || {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" && value.trim()) items.push({ id: makeEvidenceId(items.length), claim: `${key.replace(/_/g, " ")}: ${value}`, support: "Extracted from local legal text supplied/imported into Patricia.", source: "local legal text", confidence: "high", kind: "model-extraction", authority: "user-provided", risk: "low" });
  }

  const stringSections: Array<[keyof PatriciaCaseExtraction, string]> = [["procedural_history", "Procedural history"], ["holding", "Holding"]];
  for (const [key, label] of stringSections) {
    const value = extraction[key];
    if (typeof value === "string" && value.trim()) items.push({ id: makeEvidenceId(items.length), claim: label, support: value, source: "local legal text", confidence: "high", kind: key === "holding" ? "case-holding" : "model-extraction", authority: "user-provided", risk: "medium" });
  }

  const arraySections: Array<[keyof PatriciaCaseExtraction, string]> = [["material_facts", "Material fact"], ["issues", "Issue"], ["applicable_law", "Applicable law"], ["reasoning", "Reasoning"], ["orders", "Order"], ["legal_principles", "Legal principle"]];
  for (const [key, label] of arraySections) {
    const value = extraction[key];
    if (Array.isArray(value)) {
      for (const entry of value.filter(Boolean).slice(0, 12)) items.push({ id: makeEvidenceId(items.length), claim: label, support: String(entry), source: "local legal text", confidence: "high", kind: "model-extraction", authority: "user-provided", risk: key === "orders" || key === "applicable_law" ? "medium" : "low" });
    }
  }

  return items;
}

export function evidenceLedgerAsPrompt(items: PatriciaEvidenceItem[]) {
  if (items.length === 0) return "No verified evidence ledger items are available yet. Patricia must not make document-specific claims.";
  return items.map((item, index) => {
    const location = [item.section, item.page ? `page ${item.page}` : "", item.paragraph ? `paragraph ${item.paragraph}` : ""].filter(Boolean).join(", ");
    return [`${index + 1}. Claim: ${item.claim}`, `Support: ${item.support}`, `Source: ${item.source}`, item.sourceId ? `Source ID: ${item.sourceId}` : "", location ? `Location: ${location}` : "", `Confidence: ${item.confidence}`, `Authority: ${item.authority || "unknown"}`, `Kind: ${item.kind}`, `Risk: ${item.risk || "low"}`].filter(Boolean).join("\n");
  }).join("\n\n");
}

export function scoreEvidenceItem(item: PatriciaEvidenceItem) {
  const authorityScore = AUTHORITY_SCORE[item.authority || "unknown"] ?? AUTHORITY_SCORE.unknown;
  const supportLengthScore = Math.min(1, Math.max(0.1, item.support.trim().length / 280));
  const confidenceScore = item.confidence === "high" ? 1 : item.confidence === "medium" ? 0.68 : item.confidence === "low" ? 0.38 : 0;
  const kindScore = item.kind === "unsupported" ? 0 : item.kind === "inference" ? 0.35 : item.kind === "source-lead" ? 0.5 : 0.9;
  return Math.round((authorityScore * 0.32 + supportLengthScore * 0.18 + confidenceScore * 0.3 + kindScore * 0.2) * 100);
}

export function computeTrustScore(evidenceLedger: PatriciaEvidenceItem[], sources: PatriciaSource[] = []) {
  if (evidenceLedger.length === 0) return 0;
  const evidenceScore = evidenceLedger.reduce((total, item) => total + scoreEvidenceItem(item), 0) / evidenceLedger.length;
  const unsupportedPenalty = evidenceLedger.filter((item) => item.confidence === "unsupported" || item.kind === "unsupported").length * 18;
  const primaryBonus = sources.some((source) => (source.authority || rankSourceAuthority(source)) === "primary-official") ? 8 : 0;
  const newsOnlyPenalty = sources.length > 0 && sources.every((source) => (source.authority || rankSourceAuthority(source)) === "news-context") ? 28 : 0;
  return Math.max(0, Math.min(100, Math.round(evidenceScore + primaryBonus - unsupportedPenalty - newsOnlyPenalty)));
}

export function confidenceFromTrustScore(score: number): PatriciaConfidence {
  if (score >= 82) return "high";
  if (score >= 58) return "medium";
  if (score > 0) return "low";
  return "unsupported";
}

export function outputModeInstruction(mode: PatriciaOutputMode) {
  if (mode === "plain-english") return "Use plain English. Keep sentences short. Explain technical words before using them.";
  if (mode === "eli12") return "Explain like the reader is 12 years old. Use simple examples without distorting meaning.";
  if (mode === "swahili") return "Answer in clear Kiswahili and keep important legal terms accurate.";
  if (mode === "sheng-lite") return "Use light, respectful Sheng only for explanation. Keep legal terms formal and accurate.";
  if (mode === "legalese") return "Use precise expert language and preserve technical terms.";
  return "Use professional, careful English. Be clear enough for a serious non-specialist.";
}

export function getTaskAnswerStructure(task: PatriciaTask) {
  if (task === "case-brief") return ["Case", "Court", "Background", "Facts", "Issues", "Holding", "Reasoning", "Orders", "Legal significance", "Source confidence", "Next action"];
  if (task === "policy-decoder") return ["Plain-language meaning", "Who is affected", "Rights and obligations", "Deadlines, penalties, fees", "Risks or unclear parts", "Source confidence", "Next action"];
  if (task === "citizen-impact") return ["What this means", "Affected groups", "What changes", "Risks", "Action steps", "Source confidence"];
  if (task === "business-risk") return ["Business impact", "Compliance duties", "Costs and penalties", "Operational risks", "Action checklist", "What counsel should verify"];
  if (task === "student-notes") return ["Simple explanation", "Key facts", "Key principle", "Example", "Exam note", "Source confidence"];
  if (task === "memo-draft") return ["Issue", "Brief answer", "Facts relied on", "Applicable law", "Analysis", "Risk notes", "Conclusion", "Source confidence"];
  if (task === "journalist-brief") return ["News angle", "Verified facts", "What changed", "Who is affected", "Safe wording", "Source caveats"];
  return ["Answer", "Verified facts", "Explanation", "Source confidence", "Next action"];
}

export function buildPatriciaSystemPrompt(route: PatriciaRouteDecision) {
  return [
    "You are Patricia, an East African legal and public-document intelligence assistant.",
    "You are source-first, jurisdiction-aware, and careful.",
    "Do not act as a substitute for a qualified advocate.",
    "",
    "NON-NEGOTIABLE PRINCIPLES:",
    ...PATRICIA_SYSTEM_PRINCIPLES.map((principle) => `- ${principle}`),
    "",
    "CURRENT ROUTE:",
    `- task: ${route.task}`,
    `- jurisdiction: ${route.jurisdiction}`,
    `- document_type: ${route.documentType}`,
    `- persona: ${route.persona}`,
    `- output_mode: ${route.outputMode}`,
    `- risk_level: ${route.riskLevel}`,
    "",
    "STYLE:",
    outputModeInstruction(route.outputMode),
  ].join("\n");
}

function routeFromContext(context: string, questionOrRoute?: string | PatriciaRouteDecision) {
  if (typeof questionOrRoute === "object" && questionOrRoute) return questionOrRoute;
  return routePatriciaTask(`${questionOrRoute || ""}\n${context}`, Boolean(context.trim()));
}

export function buildCaseExtractionPrompt(context: string, questionOrRoute?: string | PatriciaRouteDecision) {
  const route = routeFromContext(context, questionOrRoute);
  const question = typeof questionOrRoute === "string" ? questionOrRoute : "Extract the case-law details from the supplied text.";
  return `${buildPatriciaSystemPrompt(route)}\n\nTASK: Private case-law extraction. Use ONLY the provided source text. Return valid JSON only.\n\nUSER QUESTION:\n${question}\n\nSOURCE TEXT:\n${context || "No local source text provided."}\n\nReturn this JSON shape exactly:\n{\n  "case_metadata": {\n    "case_name": "",\n    "citation": "",\n    "neutral_citation": "",\n    "case_number": "",\n    "court": "",\n    "judge": "",\n    "date": "",\n    "origin": "",\n    "jurisdiction": "${route.jurisdiction}"\n  },\n  "procedural_history": "",\n  "material_facts": [],\n  "issues": [],\n  "applicable_law": [],\n  "holding": "",\n  "reasoning": [],\n  "orders": [],\n  "legal_principles": [],\n  "missing_information": []\n}\n\nRules:\n- Empty string or empty array if unsupported.\n- Do not invent missing details.\n- This is private extraction, not the final user answer.`;
}

export function buildDocumentExtractionPrompt(context: string, questionOrRoute?: string | PatriciaRouteDecision) {
  const route = routeFromContext(context, questionOrRoute);
  return `${buildPatriciaSystemPrompt(route)}\n\nTASK: Private public-document extraction. Use ONLY the provided source text. Return valid JSON only.\n\nSOURCE TEXT:\n${context || "No local source text provided."}\n\nReturn this JSON shape exactly:\n{\n  "document_metadata": {\n    "title": "",\n    "document_type": "${route.documentType}",\n    "jurisdiction": "${route.jurisdiction}",\n    "issuing_body": "",\n    "date": "",\n    "version": "",\n    "source": ""\n  },\n  "plain_summary": "",\n  "key_points": [],\n  "rights": [],\n  "obligations": [],\n  "penalties": [],\n  "deadlines": [],\n  "fees_or_costs": [],\n  "affected_groups": [],\n  "unclear_or_missing_information": []\n}\n\nRules:\n- Do not invent entries.\n- If the document is unclear, put that in unclear_or_missing_information.`;
}

export function buildFinalLegalAnswerPrompt(args: { question: string; caseHeader: string; planText: string; sourceQuality: string; extraction: PatriciaCaseExtraction | PatriciaDocumentExtraction | null; evidenceLedger: string; externalResearch: string }) {
  const route = routePatriciaTask(`${args.question}\n${args.caseHeader}\n${JSON.stringify(args.extraction || {})}`, Boolean(args.extraction));
  const structure = getTaskAnswerStructure(route.task).join(", ");

  return `${args.caseHeader ? `${args.caseHeader}\n\n` : ""}${buildPatriciaSystemPrompt(route)}\n\nPrivate research is complete. Write the user-facing answer.\n\nUSER QUESTION:\n${args.question}\n\nPRIVATE PLAN:\n${args.planText}\n\nSOURCE QUALITY:\n${args.sourceQuality}\n\nSTRUCTURED EXTRACTION:\n${JSON.stringify(args.extraction || {}, null, 2)}\n\nEVIDENCE LEDGER:\n${args.evidenceLedger}\n\nEXTERNAL RESEARCH LEADS:\n${args.externalResearch}\n\nRECOMMENDED STRUCTURE:\n${structure}\n\nPublic answer rules:\n1. Do not reveal internal labels such as evidence ledger, extraction worker, research plan, source quality, or verifier.\n2. Do not use markdown heading markers like ## or ###.\n3. Write a natural professional explanation, not a generic template.\n4. Give verified answers, not fast answers.\n5. Explain at the chosen persona and mode. Define technical terms when they matter.\n6. Use a calm teacher-researcher voice: precise, patient, and easy to follow.\n7. If source text supports a full case brief, produce a complete brief with case, court/date/judge, background, facts, issues, holding, reasoning, orders, and significance.\n8. For public documents, explain who is affected, rights, obligations, penalties, deadlines, risks, and the next action.\n9. If only metadata is available, say the full source text is needed. Do not fill gaps with general discussion.\n10. Mention a source only if it directly supports the case, law, policy, or public document being discussed.\n11. Do not invent facts, statutes, names, dates, orders, amounts, rights, or duties.\n12. Use simple labelled lines, not markdown headings.\n13. End with one useful next action, not a menu.`;
}

export function buildEvidenceLedgerPrompt(args: { question: string; route?: PatriciaRouteDecision; localDocument?: string; sources?: PatriciaSource[]; extraction?: unknown }) {
  const route = args.route || routePatriciaTask(`${args.question}\n${args.localDocument || ""}`, Boolean(args.localDocument));
  return `${buildPatriciaSystemPrompt(route)}\n\nTASK: Build an evidence ledger as strict JSON only. Every useful claim must have support. Unsupported ideas must be marked unsupported.\n\nReturn an array of evidence items with this shape:\n[\n  {\n    "id": "evidence-001",\n    "claim": "The claim Patricia may make.",\n    "support": "Exact quote or close paraphrase from the source.",\n    "source": "Source title or local document.",\n    "sourceId": "source-001",\n    "section": "Section/article/page if available",\n    "page": 1,\n    "paragraph": "Paragraph if available",\n    "confidence": "high",\n    "kind": "direct-quote",\n    "authority": "primary-official",\n    "risk": "${route.riskLevel}"\n  }\n]\n\nUSER QUESTION:\n${args.question}\n\nSOURCES:\n${JSON.stringify(args.sources || [], null, 2)}\n\nEXTRACTION:\n${JSON.stringify(args.extraction || {}, null, 2)}\n\nLOCAL DOCUMENT:\n${args.localDocument || "No local document text was provided."}`;
}

export function buildVerificationPrompt(draft: string, evidenceLedger: string) {
  return `Private verification. Check the draft against the evidence ledger. Return the corrected public answer only.\n\nEVIDENCE LEDGER:\n${evidenceLedger}\n\nDRAFT ANSWER:\n${draft}\n\nVerification rules:\n- Remove unsupported facts.\n- Remove markdown heading markers such as ## and ###.\n- Remove internal process labels.\n- Remove irrelevant source lists.\n- Downgrade uncertain claims.\n- Do not add new facts.\n- If source text supports a full brief, preserve enough explanation for a user to understand it.\n- If the draft says more source text is required, keep that only when the ledger lacks facts, issues, holding, reasoning, and orders.\n- News can only be described as context.\n- If the evidence is weak, say what Patricia could not verify.\n- Keep it professional, simple, and user-facing.`;
}

export function normalizeSources(sources: PatriciaSource[] = []): PatriciaSource[] {
  return sources.map((source, index) => ({ ...source, id: source.id || `source-${String(index + 1).padStart(3, "0")}`, authority: source.authority || rankSourceAuthority(source) }));
}

export function assertReleaseSafety(contract: Pick<PatriciaAnswerContract, "trustScore" | "evidenceLedger" | "sources" | "unsupportedClaims">) {
  const unsupportedEvidence = contract.evidenceLedger.filter((item) => item.kind === "unsupported" || item.confidence === "unsupported");
  const hasPrimarySource = contract.sources.some((source) => (source.authority || rankSourceAuthority(source)) === "primary-official");
  const newsOnly = contract.sources.length > 0 && contract.sources.every((source) => (source.authority || rankSourceAuthority(source)) === "news-context");
  return contract.trustScore >= PATRICIA_RELEASE_STANDARD.minimumTrustScore && unsupportedEvidence.length <= PATRICIA_RELEASE_STANDARD.maximumUnsupportedClaims && contract.unsupportedClaims.length <= PATRICIA_RELEASE_STANDARD.maximumUnsupportedClaims && !newsOnly && (hasPrimarySource || !PATRICIA_RELEASE_STANDARD.requirePrimarySourceForFinalLegalPosition);
}

export function buildPatriciaAnswerContract(args: { route: PatriciaRouteDecision; answer: string; evidenceLedger?: PatriciaEvidenceItem[]; sources?: PatriciaSource[]; unsupportedClaims?: string[]; followUpChecks?: string[] }): PatriciaAnswerContract {
  const sources = normalizeSources(args.sources);
  const evidenceLedger = args.evidenceLedger || [];
  const trustScore = computeTrustScore(evidenceLedger, sources);
  const confidence = confidenceFromTrustScore(trustScore);
  const contract = { route: args.route, answer: args.answer, confidence, trustScore, evidenceLedger, sources, unsupportedClaims: args.unsupportedClaims || [], followUpChecks: args.followUpChecks || [], releaseSafe: false } satisfies PatriciaAnswerContract;
  return { ...contract, releaseSafe: assertReleaseSafety(contract) };
}

export function makeUnsupportedEvidence(claim: string, source = "No reliable source provided"): PatriciaEvidenceItem {
  return { id: makeEvidenceId(0), claim, support: "No support found in the provided material.", source, confidence: "unsupported", kind: "unsupported", authority: "unknown", risk: "medium" };
}

export function makeLocalDocumentSource(localDocument: string, title = "User-provided document"): PatriciaSource {
  return { id: "local-document", title, sourceName: "User provided", authority: "user-provided", documentType: classifyDocumentType(localDocument), jurisdiction: classifyJurisdiction(localDocument), excerpt: localDocument.trim().slice(0, 900), retrievedAt: new Date().toISOString() };
}

export function shouldAbstain(contract: Pick<PatriciaAnswerContract, "confidence" | "trustScore" | "unsupportedClaims">) {
  return contract.confidence === "unsupported" || contract.trustScore < 35 || contract.unsupportedClaims.length > 0;
}

export const PATRICIA_PREMIUM_TASKS: Record<PatriciaTask, string> = {
  "case-brief": "Extract case metadata, facts, issues, holding, reasoning, orders, principles, and significance with source support.",
  "policy-decoder": "Turn policies, bills, notices, budgets, and rules into plain-language meaning, affected groups, duties, deadlines, penalties, and action steps.",
  "citizen-impact": "Explain what a public document changes for ordinary people and what they should watch, do, or verify.",
  "legal-research": "Find and rank trusted East African legal/public sources before answering.",
  "clause-lookup": "Answer from exact sections, articles, clauses, paragraphs, or pages where available.",
  "document-summary": "Summarize only what is in the document and flag missing context.",
  "compare-documents": "Compare versions and separate added, removed, changed, and unchanged provisions.",
  "memo-draft": "Produce a professional memo draft with clear caveats and human-review reminders.",
  "student-notes": "Create study notes without distorting the legal meaning.",
  "journalist-brief": "Produce a newsroom-safe brief with verified facts, public interest angle, and source caveats.",
  "business-risk": "Map rules to compliance duties, costs, deadlines, penalties, and operational risks.",
  "general-chat": "Answer carefully and request or search sources when the question needs legal/public-document proof.",
};

export const buildLegalResearchSystemPrompt = buildPatriciaSystemPrompt;
export const buildFinalAnswerPrompt = buildFinalLegalAnswerPrompt;
export const buildLegalVerificationPrompt = buildVerificationPrompt;
export const buildCaseBriefExtractionPrompt = buildCaseExtractionPrompt;
export const buildLegalEvidenceLedgerPrompt = buildEvidenceLedgerPrompt;
export const getPatriciaRouteDecision = routePatriciaTask;
export const calculateTrustScore = computeTrustScore;
export const getConfidenceFromTrustScore = confidenceFromTrustScore;
