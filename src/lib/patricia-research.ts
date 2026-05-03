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
    searchUrls: [
      "https://ulii.org/search?search={query}",
      "https://ulii.org/judgments?search={query}",
    ],
    priority: 3,
  },
  {
    id: "tanzlii",
    name: "Tanzania Legal Information Institute",
    country: "Tanzania",
    kind: "case-law",
    authority: "legal-index",
    baseUrl: "https://tanzlii.org",
    searchUrls: [
      "https://tanzlii.org/search?search={query}",
      "https://tanzlii.org/judgments?search={query}",
    ],
    priority: 4,
  },
  {
    id: "zanzibarlii",
    name: "Zanzibar Legal Information Institute",
    country: "Zanzibar",
    kind: "case-law",
    authority: "legal-index",
    baseUrl: "https://zanzibarlii.org",
    searchUrls: [
      "https://zanzibarlii.org/search?search={query}",
    ],
    priority: 5,
  },
  {
    id: "eacj",
    name: "East African Court of Justice",
    country: "East Africa",
    kind: "regional-court",
    authority: "official",
    baseUrl: "https://www.eacj.org",
    searchUrls: [
      "https://www.eacj.org/?s={query}",
    ],
    priority: 6,
  },
  {
    id: "africanlii",
    name: "African Legal Information Institute",
    country: "Africa",
    kind: "general-law",
    authority: "legal-index",
    baseUrl: "https://africanlii.org",
    searchUrls: [
      "https://africanlii.org/search?search={query}",
    ],
    priority: 7,
  },
  {
    id: "citizen-digital",
    name: "Citizen Digital",
    country: "Kenya",
    kind: "news",
    authority: "news-context",
    baseUrl: "https://www.citizen.digital",
    searchUrls: [
      "https://www.citizen.digital/search?q={query}",
    ],
    priority: 20,
  },
  {
    id: "standard-media",
    name: "The Standard Kenya",
    country: "Kenya",
    kind: "news",
    authority: "news-context",
    baseUrl: "https://www.standardmedia.co.ke",
    searchUrls: [
      "https://www.standardmedia.co.ke/search?q={query}",
    ],
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

function parseAnchors(html: string, source: PatriciaResearchSource, query: string): PatriciaResearchResult[] {
  const results: PatriciaResearchResult[] = [];
  const seen = new Set<string>();
  const queryTerms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const anchorPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const title = cleanText(match[2]);
    const url = absoluteUrl(href, source.baseUrl);

    if (!url || !title || title.length < 4 || title.length > 260) continue;
    if (seen.has(url)) continue;
    if (url.includes("#") || url.includes("javascript:")) continue;

    const lowerTitle = title.toLowerCase();
    const lowerUrl = url.toLowerCase();
    const hasQuerySignal = queryTerms.length === 0 || queryTerms.some((term) => lowerTitle.includes(term) || lowerUrl.includes(term));
    const legalSignal = /judgment|judgments|akn|case|court|law|constitution|act|appeal|petition|cause|republic|v\b|versus/i.test(`${title} ${url}`);

    if (!hasQuerySignal && !legalSignal) continue;

    seen.add(url);
    results.push({
      sourceId: source.id,
      sourceName: source.name,
      country: source.country,
      kind: source.kind,
      authority: source.authority,
      title,
      url,
    });

    if (results.length >= 8) break;
  }

  return results;
}

async function fetchWithTimeout(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PatriciaLegalResearchBot/0.1 (+https://github.com/imranshiundu/Patricia)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function researchEastAfricanLaw(query: string, maxResults = 12) {
  const safeQuery = query.trim().slice(0, 180);
  if (!safeQuery) return [];

  const encoded = encodeURIComponent(safeQuery);
  const results: PatriciaResearchResult[] = [];
  const seen = new Set<string>();

  for (const source of [...PATRICIA_SOURCES].sort((a, b) => a.priority - b.priority)) {
    for (const template of source.searchUrls) {
      if (results.length >= maxResults) break;

      const url = template.replace("{query}", encoded);
      const html = await fetchWithTimeout(url);
      if (!html) continue;

      const parsed = parseAnchors(html, source, safeQuery);
      for (const item of parsed) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        results.push(item);
        if (results.length >= maxResults) break;
      }
    }

    if (results.length >= maxResults) break;
  }

  return results;
}

export function sourcesAsPrompt(results: PatriciaResearchResult[]) {
  if (results.length === 0) return "No external legal research results were found.";

  return results
    .map((result, index) => `${index + 1}. ${result.title}\nSource: ${result.sourceName} (${result.country})\nAuthority: ${result.authority}\nType: ${result.kind}\nURL: ${result.url}`)
    .join("\n\n");
}
