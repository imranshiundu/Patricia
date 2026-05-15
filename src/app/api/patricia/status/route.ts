import { NextResponse } from "next/server";
import { PATRICIA_SOURCES } from "@/lib/patricia-research";
import { availableProviders } from "@/lib/llm-client";

export async function GET() {
  const sourcesByAuthority = PATRICIA_SOURCES.reduce<Record<string, number>>((accumulator, source) => {
    accumulator[source.authority] = (accumulator[source.authority] || 0) + 1;
    return accumulator;
  }, {});

  const sourcesByCountry = PATRICIA_SOURCES.reduce<Record<string, number>>((accumulator, source) => {
    accumulator[source.country] = (accumulator[source.country] || 0) + 1;
    return accumulator;
  }, {});

  return NextResponse.json({
    ok: true,
    ai: {
      providers: availableProviders(),
      models: {
        groq: process.env.GROQ_MODEL || null,
        openai: process.env.OPENAI_MODEL || null,
        anthropic: process.env.ANTHROPIC_MODEL || null,
      },
    },
    runtime: {
      storage: "browser-localStorage",
      database: "none",
      permanentFileServer: false,
      serverTime: new Date().toISOString(),
    },
    research: {
      sourceCount: PATRICIA_SOURCES.length,
      sourcesByAuthority,
      sourcesByCountry,
      trustedSources: PATRICIA_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        country: source.country,
        kind: source.kind,
        authority: source.authority,
        baseUrl: source.baseUrl,
      })),
    },
  });
}
