"use client";

import { BookOpen, Search, ListFilter, Play, Clock, Download, Archive } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";
import { exportCaseAsMarkdown, exportCasesJson } from "@/lib/patricia-export";

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

    return cases.filter((item) =>
      [item.title, item.citation, item.area, item.summary]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [cases, query]);

  const activeCase = filteredCases.find((item) => item.id === activeCaseId) ?? filteredCases[0];

  return (
    <div className="flex h-full w-full max-w-7xl mx-auto px-4 pb-12 pt-4 gap-8">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
              <BookOpen className="text-blue-500" size={32} />
              Case Law Library
            </h1>
            <p className="text-slate-500">Real cases saved in this browser. Export important work before clearing browser data.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
              <ListFilter size={16} className="text-slate-400" />
              Filters
            </button>
            <button
              type="button"
              onClick={() => exportCasesJson(cases)}
              disabled={cases.length === 0}
              className="flex items-center gap-2 bg-slate-900 text-white border border-slate-900 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Archive size={16} />
              Export all
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your saved cases..."
            className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
             <div className="flex-1">Title & Citation</div>
             <div className="w-32 hidden md:block">Source</div>
             <div className="w-32 hidden lg:block">Topic</div>
             <div className="w-24 flex items-center gap-1 justify-end"><Clock size={14} /> Duration</div>
             <div className="w-20"></div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredCases.length > 0 ? (
              filteredCases.map((item) => (
                <LibraryItem
                  key={item.id}
                  item={item}
                  duration={formatDuration(item.durationSeconds)}
                  active={item.id === activeCase?.id}
                  onSelect={() => setActiveCaseId(item.id)}
                />
              ))
            ) : (
              <div className="p-8 text-sm leading-relaxed text-slate-500">
                {cases.length === 0
                  ? "Your library is empty. Add a real judgment from the document intake or research page."
                  : "No saved case matches that search."}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[380px] hidden xl:block flex-shrink-0 pt-[90px]">
         <div className="sticky top-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Now Playing</h3>
            </div>
            <AudioPlayer track={activeCase} />

            <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="font-bold text-slate-900">Transcript & Notes</h4>
                {activeCase && (
                  <button
                    type="button"
                    onClick={() => exportCaseAsMarkdown(activeCase)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    <Download size={12} /> Export
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-6">
                {activeCase?.summary || activeCase?.textPreview || "Select or create a case to see Patricia's notes here."}
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function LibraryItem({ item, duration, active, onSelect }: { item: PatriciaCaseRecord; duration: string; active: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect} className={`px-6 py-4 flex items-center hover:bg-slate-50 transition-colors group cursor-pointer ${active ? "bg-blue-50/30" : ""}`}>
      <div className="w-10 flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${active ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white"}`}>
          <Play size={14} className="ml-0.5 fill-current" />
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
        <h3 className={`font-bold text-[14px] truncate transition-colors ${active ? "text-blue-700" : "text-slate-800 group-hover:text-blue-600"}`}>
          {item.title} <span className="text-slate-400 font-normal ml-2">{item.citation || "Saved locally"}</span>
        </h3>
      </div>

      <div className="w-32 hidden md:block text-xs font-medium text-slate-500 truncate pr-4 capitalize">
        {item.sourceType}
      </div>

      <div className="w-32 hidden lg:block pr-4">
        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600">
          {item.area || "Case"}
        </span>
      </div>

      <div className="w-24 text-right text-xs font-mono font-medium text-slate-500">
        {duration}
      </div>

      <div className="w-20 flex justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            exportCaseAsMarkdown(item);
          }}
          className="text-slate-300 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Export case"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
