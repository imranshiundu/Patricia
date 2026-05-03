export type PatriciaJurisdiction = "Kenya" | "Uganda" | "Tanzania" | "Rwanda" | "Burundi" | "East Africa" | "Unknown";
export type PatriciaResearchIntent = "case-law" | "legislation" | "person" | "news-context" | "general-legal";

export type PatriciaResearchPlan = {
  originalQuery: string;
  normalizedQuery: string;
  jurisdiction: PatriciaJurisdiction;
  intent: PatriciaResearchIntent;
  queryVariants: string[];
  sourceOrder: string[];
  answerMode: "short" | "brief" | "report";
  warnings: string[];
};

const KENYA_SIGNALS = /kenya|kenyan|eklr|kenya law|supreme court of kenya|court of appeal of kenya|high court of kenya|muruatetu|karioko|ojwang|odpp|dpp|republic v|constitution of kenya/i;
const UGANDA_SIGNALS = /uganda|ugandan|ulii|kampala|museveni|supreme court of uganda|court of appeal of uganda/i;
const TANZANIA_SIGNALS = /tanzania|tanzanian|tanzlii|nyerere|dar es salaam|tanganyika|zanzibar/i;
const RWANDA_SIGNALS = /rwanda|rwandan|kigali/i;
const BURUNDI_SIGNALS = /burundi|burundian|bujumbura/i;
const EAC_SIGNALS = /east african court|eacj|east african community|treaty for the establishment of the east african community/i;

function normalize(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectJurisdiction(query: string): PatriciaJurisdiction {
  if (KENYA_SIGNALS.test(query)) return "Kenya";
  if (UGANDA_SIGNALS.test(query)) return "Uganda";
  if (TANZANIA_SIGNALS.test(query)) return "Tanzania";
  if (RWANDA_SIGNALS.test(query)) return "Rwanda";
  if (BURUNDI_SIGNALS.test(query)) return "Burundi";
  if (EAC_SIGNALS.test(query)) return "East Africa";
  return "Unknown";
}

export function detectIntent(query: string): PatriciaResearchIntent {
  if (/\bv\.?\b|versus|republic|petition|appeal|case|judgment|ruling|citation|eklr|eKLR/i.test(query)) return "case-law";
  if (/constitution|article|section|act|statute|regulation|subsidiary legislation|law of/i.test(query)) return "legislation";
  if (/who is|profile|biography|person|judge|lawyer|advocate|professor|president|lumumba|nyerere/i.test(query)) return "person";
  if (/latest|news|incident|reported|today|yesterday|media/i.test(query)) return "news-context";
  return "general-legal";
}

export function makeQueryVariants(query: string, jurisdiction: PatriciaJurisdiction, intent: PatriciaResearchIntent) {
  const base = normalize(query);
  const stripped = base.replace(/brief me on:?|create a report on:?|explain|tell me about|case law and explanation of/gi, "").trim();
  const variants = new Set<string>([base, stripped || base]);

  if (jurisdiction === "Kenya") {
    variants.add(`${stripped || base} Kenya Law`);
    variants.add(`${stripped || base} eKLR`);
    variants.add(`site:new.kenyalaw.org ${stripped || base}`);
    variants.add(`site:kenyalaw.org ${stripped || base}`);
  }

  if (jurisdiction === "Uganda") variants.add(`${stripped || base} Uganda Ulii`);
  if (jurisdiction === "Tanzania") variants.add(`${stripped || base} TanzLII`);
  if (jurisdiction === "East Africa") variants.add(`${stripped || base} EACJ`);

  if (intent === "legislation") variants.add(`${stripped || base} legislation law statute`);
  if (intent === "person") variants.add(`${stripped || base} profile legal context`);
  if (intent === "news-context") variants.add(`${stripped || base} news legal context`);

  return [...variants].filter(Boolean).slice(0, 8);
}

export function sourceOrderFor(jurisdiction: PatriciaJurisdiction) {
  if (jurisdiction === "Kenya") return ["kenya-law-caselaw", "kenya-law-legislation", "laws-africa-content", "laws-africa-ai", "judiciary-ke", "citizen-digital", "standard-media", "nation-africa", "the-star-kenya", "africanlii", "eacj"];
  if (jurisdiction === "Uganda") return ["ugandalii", "laws-africa-content", "laws-africa-ai", "africanlii", "eacj"];
  if (jurisdiction === "Tanzania") return ["tanzlii", "zanzibarlii", "laws-africa-content", "laws-africa-ai", "africanlii", "eacj"];
  if (jurisdiction === "East Africa") return ["eacj", "africanlii", "laws-africa-content", "laws-africa-ai", "kenya-law-caselaw", "ugandalii", "tanzlii"];
  return ["kenya-law-caselaw", "kenya-law-legislation", "laws-africa-content", "laws-africa-ai", "africanlii", "eacj", "ugandalii", "tanzlii", "zanzibarlii", "citizen-digital", "standard-media"];
}

export function answerModeFor(query: string): PatriciaResearchPlan["answerMode"] {
  if (/report|memo|full|detailed|comprehensive/i.test(query)) return "report";
  if (/brief|explain|case law|summary|student/i.test(query)) return "brief";
  return "short";
}

export function buildResearchPlan(query: string): PatriciaResearchPlan {
  const normalizedQuery = normalize(query);
  const jurisdiction = detectJurisdiction(normalizedQuery);
  const intent = detectIntent(normalizedQuery);
  const warnings: string[] = [];

  if (jurisdiction === "Unknown") {
    warnings.push("Jurisdiction is not obvious. Search official Kenyan sources first if the query resembles a Kenyan name or eKLR-style case; otherwise broaden to East Africa.");
  }

  return {
    originalQuery: query,
    normalizedQuery,
    jurisdiction,
    intent,
    queryVariants: makeQueryVariants(normalizedQuery, jurisdiction, intent),
    sourceOrder: sourceOrderFor(jurisdiction),
    answerMode: answerModeFor(normalizedQuery),
    warnings,
  };
}
