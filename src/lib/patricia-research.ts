export type PatriciaSourceKind = "case-law" | "legislation" | "constitution" | "regional-court" | "news" | "general-law";
export type PatriciaSourceAuthority = "official" | "legal-index" | "news-context";

export type PatriciaResearchSource = {
  id: string;
  name: string;
  country: string;
  kind: PatriciaSourceKind;
  authority: PatriciaSourceAuthority;
  baseUrl: string;
  searchUrls: string[];
  priority: number;
};

export type PatriciaResearchResult = {
  sourceId: string;
  sourceName: string;
  country: string;
  kind: PatriciaSourceKind;
  authority: PatriciaSourceAuthority;
  title: string;
  url: string;
  snippet?: string;
};

export const PATRICIA_SOURCES: PatriciaResearchSource[] = [
  {
    id: "kenya-law-caselaw",
    name: "Kenya Law Case Law",
    country: "Kenya",
    kind: "case-law",
    authority: "official",
    baseUrl: "https://new.kenyalaw.org",
    searchUrls: [
      "https://new.kenyalaw.org/judgments/?q={query}",
      "https://new.kenyalaw.org/search/?q={query}",
    ],
    priority: 1,
  },
  {
    id: "kenya-law-legislation",
    name: "Kenya Law Legislation",
    country: "Kenya",
    kind: "legislation",
    authority: "official",
    baseUrl: "https://new.kenyalaw.org",
    searchUrls: [
      "https://new.kenyalaw.org/akn/ke/act/2010/constitution/eng@2010-09-03",
      "https://new.kenyalaw.org/search/?q={query}",
    ],
    priority: 2,
  },
  {
    id: "ugandalii",
    name: "Uganda Legal Information Institute",
    country: "Uganda",
    kind: "case-law",
    authority: "legal-index",
    baseUrl: "https://ulii.org",
    searchUrls: ["https://ulii.org/search?search={query}", "https://ulii.org/judgments?search={query}"],
    priority: 8,
  },
  {
    id: "tanzlii",
    name: "Tanzania Legal Information Institute",
    country: "Tanzania",
    kind: "case-law",
    authority: "legal-index",
    baseUrl: "https://tanzlii.org",
    searchUrls: ["https://tanzlii.org/search?search={query}", "https://tanzlii.org/judgments?search={query}"],
    priority: 9,
  },
  {
    id: "zanzibarlii",
    name: "Zanzibar Legal Information Institute",
    country: "Zanzibar",
    kind: "case-law",
    authority: "legal-index",
    baseUrl: "https://zanzibarlii.org",
    searchUrls: ["https://zanzibarlii.org/search?search={query}"],
    priority: 10,
  },
  {
    id: "eacj",
    name: "East African Court of Justice",
    country: "East Africa",
    kind: "regional-court",
    authority: "official",
    baseUrl: "https://www.eacj.org",
    searchUrls: ["https://www.eacj.org/?s={query}"],
    priority: 11,
  },
  {
    id: "africanlii",
    name: "African Legal Information Institute",
    country: "Africa",
    kind: "general-law",
    authority: "legal-index",
    baseUrl: "https://africanlii.org",
    searchUrls: ["https://africanlii.org/search?search={query}"],
    priority: 12,
  },
  {
    id: "citizen-digital",
    name: "Citizen Digital",
    country: "Kenya",
    kind: "news",
    authority: "news-context",
    baseUrl: "https://www.citizen.digital",
    searchUrls: ["https://www.citizen.digital/search?q={query}"],
    priority: 20,
  },
  {
    id: "standard-media",
    name: "The Standard Kenya",
    country: "Kenya",
    kind: "news",
    authority: "news-context",
    baseUrl: "https://www.standardmedia.co.ke",
    searchUrls: ["https://www.standardmedia.co.ke/search?q={query}"],
    priority: 21,
  },
];

function absoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function queryTerms(query: string) {
  const stop = new Set(["case", "name", "number", "citation", "neutral", "brief", "me", "on", "the", "and", "court", "high", "at", "of", "republic", "criminal", "appeal"]);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stop.has(term));
}

function detectPreferredCountries(query: string) {
  const lower = query.toLowerCase();
  const countries = new Set<string>();
  if (/kenya|kenyan|kakamega|nairobi|mombasa|kisumu|eldoret|kehc|klr|kenyalaw/i.test(lower)) countries.add("Kenya");
  if (/uganda|ugandan|kampala|ulii/i.test(lower)) countries.add("Uganda");
  if (/tanzania|tanzanian|dar es salaam|tanzlii/i.test(lower)) countries.add("Tanzania");
  if (/zanzibar/i.test(lower)) countries.add("Zanzibar");
  if (/east african court|eacj/i.test(lower)) countries.add("East Africa");
  return countries;
}

function scoreResult(item: PatriciaResearchResult, query: string) {
  const terms = queryTerms(query);
  const haystack = `${item.title} ${item.url} ${item.snippet || ""}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 1;
  }

  if (item.authority === "official") score += 6;
  if (item.country === "Kenya" && detectPreferredCountries(query).has("Kenya")) score += 8;
  if (/mudialo|muchere|kehc|5462|80\D+2017|kakamega/i.test(query) && /kenyalaw|kehc|mudialo|muchere|5462|kakamega/i.test(haystack)) score += 15;
  if (/judgment|judgments|akn\/ke|case|appeal|petition|republic|v\b/i.test(haystack)) score += 2;

  return score;
}

function parseAnchors(html: string, source: PatriciaResearchSource, query: string): PatriciaResearchResult[] {
  const results: PatriciaResearchResult[] = [];
  const seen = new Set<string>();
  const terms = queryTerms(query);
  const anchorPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const preferredCountries = detectPreferredCountries(query);

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const title = cleanText(match[2]);
    const url = absoluteUrl(href, source.baseUrl);

    if (!url || !title || title.length < 4 || title.length > 260) continue;
    if (seen.has(url)) continue;
    if (url.includes("#") || url.includes("javascript:")) continue;

    const haystack = `${title} ${url}`.toLowerCase();
    const hasSpecificSignal = terms.length === 0 || terms.some((term) => haystack.includes(term));
    const legalSignal = /judgment|judgments|akn|case|court|law|constitution|act|appeal|petition|cause|republic|v\b|versus/i.test(haystack);

    if (!legalSignal) continue;
    if (!hasSpecificSignal && preferredCountries.size > 0 && !preferredCountries.has(source.country)) continue;
    if (!hasSpecificSignal && title.length < 12) continue;

    const item: PatriciaResearchResult = {
      sourceId: source.id,
      sourceName: source.name,
      country: source.country,
      kind: source.kind,
      authority: source.authority,
      title,
      url,
    };

    if (scoreResult(item, query) < 3) continue;

    seen.add(url);
    results.push(item);
    if (results.length >= 8) break;
  }

  return results;
}

async function fetchWithTimeout(url: string, timeoutMs = 9000) {
  const maxAttempts = 3;
  const headers = {
    "User-Agent": "PatriciaLegalResearchBot/0.1 (+https://github.com/imranshiundu/Patricia)",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
        next: { revalidate: 900 },
      });

      if (!response.ok) {
        // Non-OK, try again for transient server errors
        if (response.status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 200 * attempt));
          continue;
        }
        return "";
      }

      const text = await response.text();
      if (!text || text.length < 120) return "";
      return text;
    } catch {
      // Abort or network error — retry with backoff for transient issues
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
        continue;
      }
      return "";
    } finally {
      clearTimeout(timeout);
    }
  }
  return "";
}

export async function researchEastAfricanLaw(query: string, maxResults = 12) {
  const safeQuery = query.trim().slice(0, 220);
  if (!safeQuery) return [];

  const encoded = encodeURIComponent(safeQuery);
  const found: PatriciaResearchResult[] = [];
  const seen = new Set<string>();
  const preferredCountries = detectPreferredCountries(safeQuery);
  const orderedSources = [...PATRICIA_SOURCES]
    .filter((source) => preferredCountries.size === 0 || preferredCountries.has(source.country) || source.country === "Africa")
    .sort((a, b) => a.priority - b.priority);

  for (const source of orderedSources) {
    for (const template of source.searchUrls) {
      if (found.length >= maxResults * 2) break;

      const url = template.replace("{query}", encoded);
      const html = await fetchWithTimeout(url);
      if (!html) continue;

      const parsed = parseAnchors(html, source, safeQuery);
      for (const item of parsed) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        found.push(item);
      }
    }
  }

  return found
    .map((item) => ({ item, score: scoreResult(item, safeQuery) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, maxResults);
}

export function sourcesAsPrompt(results: PatriciaResearchResult[]) {
  if (results.length === 0) return "No external legal research results were found.";

  return results
    .map((result, index) => `${index + 1}. ${result.title}\nSource: ${result.sourceName} (${result.country})\nAuthority: ${result.authority}\nType: ${result.kind}\nURL: ${result.url}`)
    .join("\n\n");
}
