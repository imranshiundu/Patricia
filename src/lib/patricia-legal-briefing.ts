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
  return `You are Patricia's legal extraction worker. Use ONLY the provided legal text. Do not infer missing details. Return valid JSON only.\n\nUSER QUESTION:\n${question}\n\nLEGAL TEXT:\n${context || "No local legal text provided."}\n\nReturn this JSON shape exactly:\n{\n  "case_metadata": {\n    "case_name": "",\n    "citation": "",\n    "neutral_citation": "",\n    "case_number": "",\n    "court": "",\n    "judge": "",\n    "date": "",\n    "origin": ""\n  },\n  "procedural_history": "",\n  "material_facts": [],\n  "issues": [],\n  "applicable_law": [],\n  "holding": "",\n  "reasoning": [],\n  "orders": [],\n  "legal_principles": [],\n  "missing_information": []\n}\n\nRules:\n- Empty string or empty array if unsupported.\n- Do not invent statutes, dates, judges, holdings, or orders.\n- Keep each field concise and factual.\n- This is extraction, not legal advice.`;
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
      items.push({
        claim: `${key.replace(/_/g, " ")}: ${value}`,
        support: "Extracted from local legal text supplied/imported into Patricia.",
        source: "local legal text",
        confidence: "high",
        kind: "model-extraction",
      });
    }
  }

  const sections: Array<[keyof PatriciaCaseExtraction, string]> = [
    ["procedural_history", "Procedural history"],
    ["holding", "Holding"],
  ];

  for (const [key, label] of sections) {
    const value = extraction[key];
    if (typeof value === "string" && value.trim()) {
      items.push({ claim: label, support: value, source: "local legal text", confidence: "high", kind: "model-extraction" });
    }
  }

  const arraySections: Array<[keyof PatriciaCaseExtraction, string]> = [
    ["material_facts", "Material fact"],
    ["issues", "Issue"],
    ["applicable_law", "Applicable law"],
    ["reasoning", "Reasoning"],
    ["orders", "Order"],
    ["legal_principles", "Legal principle"],
  ];

  for (const [key, label] of arraySections) {
    const value = extraction[key];
    if (Array.isArray(value)) {
      for (const entry of value.filter(Boolean).slice(0, 12)) {
        items.push({ claim: label, support: String(entry), source: "local legal text", confidence: "high", kind: "model-extraction" });
      }
    }
  }

  return items;
}

export function evidenceLedgerAsPrompt(items: PatriciaEvidenceItem[]) {
  if (items.length === 0) return "No verified evidence ledger items are available yet.";
  return items
    .map((item, index) => `${index + 1}. Claim: ${item.claim}\nSupport: ${item.support}\nSource: ${item.source}\nConfidence: ${item.confidence}\nKind: ${item.kind}`)
    .join("\n\n");
}

export function buildFinalLegalAnswerPrompt(args: {
  question: string;
  caseHeader: string;
  planText: string;
  sourceQuality: string;
  extraction: PatriciaCaseExtraction | null;
  evidenceLedger: string;
  externalResearch: string;
}) {
  return `${args.caseHeader ? `${args.caseHeader}\n\n` : ""}You are Patricia, an East African legal research assistant. Write a dependable legal answer using the evidence ledger below.\n\nUSER QUESTION:\n${args.question}\n\nRESEARCH PLAN:\n${args.planText}\n\nSOURCE QUALITY:\n${args.sourceQuality}\n\nSTRUCTURED CASE EXTRACTION:\n${JSON.stringify(args.extraction || {}, null, 2)}\n\nEVIDENCE LEDGER:\n${args.evidenceLedger}\n\nEXTERNAL RESEARCH LEADS:\n${args.externalResearch}\n\nWriting rules:\n1. Use the evidence ledger as the source of truth.\n2. Do not invent case details, statutes, judge names, dates, orders, holdings, or citations.\n3. If a fact is only a source lead, call it a research lead, not a verified holding.\n4. Separate verified facts from legal inference.\n5. Explain like a serious legal researcher: clear, structured, professional, not casual.\n6. End by asking whether the user wants a deeper brief, memo, student notes, or audio.\n\nUse this exact structure:\n\n## Answer\n\n## How Patricia built the answer\n\n## Case or subject identified\n\n## Explanation\n\n## Verified facts\n\n## Legal significance\n\n## Sources and confidence\n\n## What Patricia should check next\n\n## Want more?`;
}

export function buildVerificationPrompt(draft: string, evidenceLedger: string) {
  return `You are Patricia's verification worker. Check the draft against the evidence ledger. Return the corrected final answer only.\n\nEVIDENCE LEDGER:\n${evidenceLedger}\n\nDRAFT ANSWER:\n${draft}\n\nVerification rules:\n- Remove unsupported facts.\n- Downgrade uncertain claims.\n- Keep citations/source leads where available.\n- Do not add new legal facts.\n- Keep the structure professional.\n- If the draft overstates legal advice, soften it into research assistance.`;
}
