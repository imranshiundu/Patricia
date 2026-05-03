import { NextRequest, NextResponse } from "next/server";
import { researchEastAfricanLaw } from "@/lib/patricia-research";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = String(body.query || "").trim();

    if (!query) {
      return NextResponse.json({ error: "Search query is required." }, { status: 400 });
    }

    const results = await researchEastAfricanLaw(query, 20);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Unable to complete legal research search." }, { status: 500 });
  }
}
