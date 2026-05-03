export type PatriciaResolvedCase = {
  title: string;
  citation?: string;
  neutralCitation?: string;
  caseNumber?: string;
  court?: string;
  judge?: string;
  date?: string;
  sourceUrl: string;
  text: string;
};

const KNOWN_CASES = [
  {
    patterns: [/frederick\s+muchere\s+mudialo/i, /\bKEHC\s*5462\b/i, /criminal\s+appeal\s+(no\.?\s*)?80\s+of\s+2017/i],
    title: "Frederick Muchere Mudialo v Republic",
    citation: "Frederick Muchere Mudialo v Republic [2019] KEHC 5462 (KLR)",
    neutralCitation: "[2019] KEHC 5462 (KLR)",
    caseNumber: "Criminal Appeal 80 of 2017",
    court: "High Court at Kakamega",
    judge: "DN Musyoka",
    date: "26 July 2019",
    sourceUrl: "https://new.kenyalaw.org/akn/ke/judgment/kehc/2019/5462/eng%402019-07-26",
  },
];

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeContinuation(value: string) {
  return /^(proceed|continue|go on|yes|okay|ok|get me the full brief|full brief|tell me more|brief it)$/i.test(value.trim());
}

export function buildEffectiveLegalQuestion(question: string, previousMessages: Array<{ role?: string; content?: string }> = []) {
  if (!looksLikeContinuation(question)) return question;

  const previousCaseMessage = [...previousMessages]
    .reverse()
    .map((message) => String(message.content || ""))
    .find((content) => /frederick\s+muchere\s+mudialo|KEHC\s*5462|criminal\s+appeal\s+(no\.?\s*)?80\s+of\s+2017/i.test(content));

  if (!previousCaseMessage) return question;

  return `${question}\n\nPrevious case context:\n${previousCaseMessage}\n\nTask: prepare the next useful legal answer about this same case.`;
}

export function detectKnownCase(query: string) {
  return KNOWN_CASES.find((known) => known.patterns.some((pattern) => pattern.test(query)));
}

export async function resolveKnownCaseFromQuestion(question: string): Promise<PatriciaResolvedCase | null> {
  const known = detectKnownCase(question);
  if (!known) return null;

  try {
    const response = await fetch(known.sourceUrl, {
      headers: {
        "User-Agent": "PatriciaLegalResearchBot/0.1 (+https://github.com/imranshiundu/Patricia)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return null;
    const html = await response.text();
    const text = htmlToText(html);
    if (text.length < 1500) return null;

    return { ...known, text };
  } catch {
    return null;
  }
}
