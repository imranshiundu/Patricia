"use client";

import { Archive, BookOpen, Clock, Download, Play, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { exportCaseAsMarkdown, exportCasesJson } from "@/lib/patricia-export";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function LibraryClient() {
  const [cases, setCases] = useState<PatriciaCaseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [activeCaseId, setActiveCaseId] = useState("");

  useEffect(() => {
    const syncCases = () => {
      const records = getPatriciaCases();
      setCases(records);
      setActiveCaseId((current) => current || records[0]?.id || "");
    };
    syncCases();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("storage", syncCases);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cases;
    return cases.filter((item) => [item.title, item.citation, item.area, item.summary].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)));
  }, [cases, query]);

  const activeCase = filteredCases.find((item) => item.id === activeCaseId) ?? filteredCases[0];

  return (
    <div className="min-h-full bg-white px-6 py-7">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_360px]">
        <main className="min-w-0">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-900"><BookOpen className="text-slate-900" size={30} /> Library</h1>
              <p className="mt-2 text-sm font-light leading-6 text-slate-500">Real cases saved in this browser. Export important work before clearing browser data.</p>
            </div>
            <button type="button" onClick={() => exportCasesJson(cases)} disabled={cases.length === 0} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Archive size={15} /> Export all</button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved cases..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base font-light outline-none focus:ring-2 focus:ring-slate-900" />
          </div>

          <div className="border-t border-slate-100">
            <div className="grid grid-cols-[1fr_120px_100px] gap-4 border-b border-slate-100 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <span>Title & citation</span><span className="hidden md:block">Source</span><span className="flex items-center justify-end gap-1"><Clock size={13} /> Duration</span>
            </div>
            {filteredCases.length > 0 ? filteredCases.map((item) => <LibraryItem key={item.id} item={item} duration={formatDuration(item.durationSeconds)} active={item.id === activeCase?.id} onSelect={() => setActiveCaseId(item.id)} />) : (
              <div className="py-8 text-sm font-light leading-relaxed text-slate-500">{cases.length === 0 ? "Your library is empty. Add a real judgment from Documents or import a readable result from Research." : "No saved case matches that search."}</div>
            )}
          </div>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-5">
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">Audio</p>
              <AudioPlayer track={activeCase} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="font-medium text-slate-900">Notes</h4>
                {activeCase && <button type="button" onClick={() => exportCaseAsMarkdown(activeCase)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"><Download size={12} /> Export</button>}
              </div>
              <p className="text-sm font-light leading-6 text-slate-500">{activeCase?.summary || activeCase?.textPreview || "No case selected. Audio appears only when real audio is available for a saved case."}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LibraryItem({ item, duration, active, onSelect }: { item: PatriciaCaseRecord; duration: string; active: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect} className={`grid cursor-pointer grid-cols-[1fr_120px_100px] items-center gap-4 border-b border-slate-100 py-4 transition hover:bg-slate-50 ${active ? "bg-slate-50" : ""}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}><Play size={13} className="ml-0.5 fill-current" /></div>
        <div className="min-w-0"><h3 className="truncate text-sm font-medium text-slate-900">{item.title}</h3><p className="truncate text-xs font-light text-slate-400">{item.citation || "Saved locally"}</p></div>
      </div>
      <div className="hidden text-xs font-light capitalize text-slate-500 md:block">{item.sourceType}</div>
      <div className="flex items-center justify-end gap-2 text-xs font-light text-slate-500"><span>{duration}</span><button type="button" onClick={(event) => { event.stopPropagation(); exportCaseAsMarkdown(item); }} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700" aria-label="Export case"><Download size={15} /></button></div>
    </div>
  );
}
