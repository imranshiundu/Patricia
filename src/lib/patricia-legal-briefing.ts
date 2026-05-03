import { PatriciaResearchResult } from "@/lib/patricia-research";

export type PatriciaEvidenceItem = {
  claim: string;
  support: string;
  source: string;
  confidence: "high" | "medium" | "low";
  kind: "local-text" | "source-lead" | "model-extraction" | "inference";
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

export function parseLooseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      try {
        return JSON.parse(fenced) as T;
      } catch {
        return null;
      }
    }

    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}

export function buildCaseExtractionPrompt(context: string, question: string) {
  return `You are Patricia's private legal extraction worker. Use ONLY the provided legal text. Do not infer missing details. Return valid JSON only.\n\nUSER QUESTION:\n${question}\n\nLEGAL TEXT:\n${context || "No local legal text provided."}\n\nReturn this JSON shape exactly:\n{\n  "case_metadata": {\n    "case_name": "",\n    "citation": "",\n    "neutral_citation": "",\n    "case_number": "",\n    "court": "",\n    "judge": "",\n    "date": "",\n    "origin": ""\n  },\n  "procedural_history": "",\n  "material_facts": [],\n  "issues": [],\n  "applicable_law": [],\n  "holding": "",\n  "reasoning": [],\n  "orders": [],\n  "legal_principles": [],\n  "missing_information": []\n}\n\nRules:\n- Empty string or empty array if unsupported.\n- Do not invent statutes, dates, judges, holdings, or orders.\n- Keep each field concise and factual.\n- This is private extraction, not the final user answer.`;
}

export function buildSourceLedger(results: PatriciaResearchResult[]): PatriciaEvidenceItem[] {
  return results.map((result) => ({
    claim: `Research lead found: ${result.title}`,
    support: `${result.sourceName} (${result.country}); authority=${result.authority}; type=${result.kind}; url=${result.url}`,
    source: result.url,
    confidence: result.authority === "official" ? "high" : result.authority === "legal-index" ? "medium" : "low",
    kind: "source-lead",
  }));
}

export function buildExtractionLedger(extraction: PatriciaCaseExtraction | null): PatriciaEvidenceItem[] {
  if (!extraction) return [];
  const items: PatriciaEvidenceItem[] = [];
  const metadata = extraction.case_metadata || {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value) {
      items.push({ claim: `${key.replace(/_/g, " ")}: ${value}`, support: "Extracted from local legal text supplied/imported into Patricia.", source: "local legal text", confidence: "high", kind: "model-extraction" });
    }
  }

  const sections: Array<[keyof PatriciaCaseExtraction, string]> = [["procedural_history", "Procedural history"], ["holding", "Holding"]];
  for (const [key, label] of sections) {
    const value = extraction[key];
    if (typeof value === "string" && value.trim()) items.push({ claim: label, support: value, source: "local legal text", confidence: "high", kind: "model-extraction" });
  }

  const arraySections: Array<[keyof PatriciaCaseExtraction, string]> = [["material_facts", "Material fact"], ["issues", "Issue"], ["applicable_law", "Applicable law"], ["reasoning", "Reasoning"], ["orders", "Order"], ["legal_principles", "Legal principle"]];
  for (const [key, label] of arraySections) {
    const value = extraction[key];
    if (Array.isArray(value)) {
      for (const entry of value.filter(Boolean).slice(0, 12)) items.push({ claim: label, support: String(entry), source: "local legal text", confidence: "high", kind: "model-extraction" });
    }
  }

  return items;
}

export function evidenceLedgerAsPrompt(items: PatriciaEvidenceItem[]) {
  if (items.length === 0) return "No verified evidence ledger items are available yet.";
  return items.map((item, index) => `${index + 1}. Claim: ${item.claim}\nSupport: ${item.support}\nSource: ${item.source}\nConfidence: ${item.confidence}\nKind: ${item.kind}`).join("\n\n");
}

export function buildFinalLegalAnswerPrompt(args: { question: string; caseHeader: string; planText: string; sourceQuality: string; extraction: PatriciaCaseExtraction | null; evidenceLedger: string; externalResearch: string }) {
  return `${args.caseHeader ? `${args.caseHeader}\n\n` : ""}You are Patricia, an East African legal research assistant. Your private research process is complete. Now write the answer the user should see.\n\nUSER QUESTION:\n${args.question}\n\nPRIVATE RESEARCH PLAN:\n${args.planText}\n\nSOURCE QUALITY:\n${args.sourceQuality}\n\nPRIVATE STRUCTURED EXTRACTION:\n${JSON.stringify(args.extraction || {}, null, 2)}\n\nPRIVATE EVIDENCE LEDGER:\n${args.evidenceLedger}\n\nPRIVATE EXTERNAL RESEARCH LEADS:\n${args.externalResearch}\n\nPublic answer rules:\n1. Do not reveal internal labels such as evidence ledger, research plan, extraction worker, source quality, or verifier.\n2. Do not use markdown heading markers like ## or ###.\n3. Do not output a generic template. Write a natural professional answer.\n4. Give verified answers, not fast answers.\n5. If the judgment text is available in the private extraction, produce a complete case brief with: case, court/date/judge, background, facts, issues, holding, reasoning, orders, and legal significance.\n6. If only case metadata is available, say the full judgment text is needed. Do not say that if the extraction contains facts, issues, holding, reasoning, or orders.\n7. Do not list irrelevant external source leads. Only mention a source if it directly supports the case or law being discussed.\n8. Do not invent facts, statutes, judge names, holdings, reasons, or final orders.\n9. Use simple labelled lines, not markdown headings. Good labels: Case, Court, Background, Facts, Issues, Holding, Reasoning, Orders, Legal significance, Source.\n10. End with one useful next action, not a menu of many options.`;
}

export function buildVerificationPrompt(draft: string, evidenceLedger: string) {
  return `You are Patricia's private verification worker. Check the draft against the evidence ledger. Return the corrected public answer only.\n\nPRIVATE EVIDENCE LEDGER:\n${evidenceLedger}\n\nDRAFT ANSWER:\n${draft}\n\nVerification rules:\n- Remove unsupported facts.\n- Remove markdown heading markers such as ## and ###.\n- Remove internal process labels: evidence ledger, extraction worker, research plan, verifier, source quality.\n- Remove irrelevant source lists.\n- Downgrade uncertain claims.\n- Do not add new legal facts.\n- If the draft says a full brief requires judgment text, keep that only when the evidence ledger lacks facts, issues, holding, reasoning, and orders.\n- Keep it professional, simple, and user-facing.`;
}
