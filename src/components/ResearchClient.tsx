"use client";

import { Download, ExternalLink, Loader2, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { PatriciaResearchResult } from "@/lib/patricia-research";
import { extractCaseTitle, makeCaseId, splitForGroq } from "@/lib/patricia-processing";
import { PatriciaCaseRecord, savePatriciaCase } from "@/lib/patricia-storage";
import { enqueueCaseSummary } from "@/lib/patricia-queue";

export function ResearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatriciaResearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function search(event?: FormEvent) {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || isSearching) return;

    setIsSearching(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/patricia/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research failed.");
      setResults(data.results || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Research failed.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function importResult(result: PatriciaResearchResult) {
    if (importingUrl) return;
    setImportingUrl(result.url);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/patricia/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed.");

      const text = String(data.text || "");
      const chunks = splitForGroq(text);
      const estimatedMinutes = chunks.reduce((total, chunk) => total + chunk.estimatedMinutes, 0);
      const now = new Date().toISOString();
      const record: PatriciaCaseRecord = {
        id: makeCaseId(),
        title: String(data.title || result.title || extractCaseTitle(text)),
        citation: result.sourceName,
        area: result.kind,
        sourceType: "url",
        textPreview: String(data.textPreview || text.slice(0, 1500)),
        fullText: text,
        durationSeconds: estimatedMinutes * 60,
        createdAt: now,
        updatedAt: now,
      };

      const saved = savePatriciaCase(record);
      if (!saved) throw new Error("This browser could not save the imported source. It may be too large for localStorage.");

      const jobs = enqueueCaseSummary(record);
      setNotice(`Imported “${record.title}” and queued ${jobs.length} chunk${jobs.length === 1 ? "" : "s"}. Open Chat or Library to use it.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setImportingUrl("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
          <Search className="text-blue-500" /> Legal Research
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          Search East African legal sources. Official law/case-law sources come first; news sources are treated as context leads, not final legal authority.
        </p>
      </div>

      <form onSubmit={search} className="mb-6 flex gap-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Kenya Law, constitution, case law, EACJ, news context..."
          className="min-h-[48px] flex-1 bg-transparent px-4 text-base outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </form>

      {notice && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="space-y-3">
        {results.length === 0 && !isSearching ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm leading-relaxed text-slate-500 shadow-sm">
            No research results loaded yet. Try a case name, party name, statute, constitutional article, or court topic.
          </div>
        ) : (
          results.map((result) => (
            <div
              key={`${result.sourceId}-${result.url}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/20"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="font-bold leading-snug text-slate-900">{result.title}</h2>
                <a href={result.url} target="_blank" rel="noreferrer" className="mt-1 flex-shrink-0 text-slate-400 hover:text-slate-700" aria-label="Open source">
                  <ExternalLink size={16} />
                </a>
              </div>
              <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{result.sourceName}</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">{result.country}</span>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">{result.kind}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => importResult(result)}
                  disabled={Boolean(importingUrl)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importingUrl === result.url ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Import to Patricia
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink size={14} />
                  Open original
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
