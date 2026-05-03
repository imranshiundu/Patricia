import { NextRequest, NextResponse } from "next/server";

const MAX_IMPORTED_CHARS = 120_000;
const ALLOWED_HOSTS = [
  "new.kenyalaw.org",
  "kenyalaw.org",
  "ulii.org",
  "tanzlii.org",
  "zanzibarlii.org",
  "www.eacj.org",
  "eacj.org",
  "africanlii.org",
  "www.citizen.digital",
  "citizen.digital",
  "www.standardmedia.co.ke",
  "standardmedia.co.ke",
];

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string, fallbackUrl: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = cleanText(h1Match?.[1] || titleMatch?.[1] || "");
  if (title) return title.slice(0, 180);

  try {
    return new URL(fallbackUrl).pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || "Imported legal source";
  } catch {
    return "Imported legal source";
  }
}

function getMainContent(html: string) {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const judgmentMatch = html.match(/<div[^>]+class=["'][^"']*(judgment|document|content|akoma-ntoso)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  return mainMatch?.[1] || articleMatch?.[1] || judgmentMatch?.[2] || html;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = String(body.url || "").trim();

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const url = new URL(rawUrl);
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return NextResponse.json({ error: "This source is not in Patricia's trusted import list yet." }, { status: 400 });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PatriciaLegalResearchBot/0.1 (+https://github.com/imranshiundu/Patricia)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to fetch this source." }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({ error: "Patricia can only import HTML sources at this stage. PDF import comes next." }, { status: 415 });
    }

    const html = await response.text();
    const title = extractTitle(html, url.toString());
    const text = cleanText(getMainContent(html)).slice(0, MAX_IMPORTED_CHARS);

    if (text.length < 300) {
      return NextResponse.json({ error: "This page did not expose enough readable text to import safely." }, { status: 422 });
    }

    return NextResponse.json({
      title,
      url: url.toString(),
      text,
      textPreview: text.slice(0, 1500),
      importedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to import this legal source." }, { status: 500 });
  }
}
