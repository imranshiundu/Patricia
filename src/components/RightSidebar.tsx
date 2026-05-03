"use client";

import { MoreHorizontal, UploadCloud, Headphones, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";

type PatriciaCase = {
  id: string;
  title: string;
  citation?: string;
  area?: string;
  durationSeconds?: number;
  audioUrl?: string;
  createdAt?: string;
};

const CASES_KEY = "patricia:cases";

function readStoredCases(): PatriciaCase[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds < 1) return "not narrated";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

export function RightSidebar() {
  const [cases, setCases] = useState<PatriciaCase[]>([]);

  useEffect(() => {
    const syncCases = () => setCases(readStoredCases().slice(0, 8));
    syncCases();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("storage", syncCases);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  const activeCase = useMemo(() => cases.find((item) => item.audioUrl) ?? cases[0], [cases]);

  return (
    <aside className="w-[360px] flex-shrink-0 flex flex-col bg-slate-50/70 border-l border-slate-100 z-10 m-2 rounded-[32px] h-[calc(100vh-16px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <AudioPlayer track={activeCase} />

        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Headphones size={14} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Your Cases</h3>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">{cases.length}</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-white rounded-full transition-colors" aria-label="More case actions">
            <MoreHorizontal size={15} />
          </button>
        </div>

        <div className="space-y-2">
          {cases.length > 0 ? (
            cases.map((caseItem, index) => (
              <CaseCard
                key={caseItem.id}
                title={caseItem.title}
                sub={caseItem.citation || "Saved in this browser"}
                tag={caseItem.area || "Case"}
                duration={formatDuration(caseItem.durationSeconds)}
                active={caseItem.id === activeCase?.id || index === 0}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-500">
              Patricia is empty because mock cases were removed. Upload, paste, or import a real judgment and it will appear here from browser storage.
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 pt-4 border-t border-slate-200/70 bg-white/60 backdrop-blur-sm rounded-b-[32px]">
        <Link
          href="/documents"
          className="flex items-center gap-3 w-full bg-slate-900 text-white px-5 py-3.5 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <UploadCloud size={16} className="text-white group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none mb-0.5">Upload a Document</span>
            <span className="text-[11px] text-slate-400 font-medium">PDF, text, or pasted judgment</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function CaseCard({ title, sub, tag, duration, active }: any) {
  return (
    <div
      className={`group flex items-stretch gap-3 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${
        active
          ? "bg-white shadow-sm border border-blue-100 ring-1 ring-blue-50"
          : "bg-white/0 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className={`w-1 flex-shrink-0 rounded-full ${active ? "bg-blue-500" : "bg-slate-200 group-hover:bg-slate-300"} transition-colors`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{tag}</span>
        </div>
        <h4 className={`text-[13px] font-semibold leading-snug line-clamp-2 mb-1 ${active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"} transition-colors`}>
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium truncate">{sub}</p>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${active ? "bg-blue-500 shadow-sm shadow-blue-200" : "bg-slate-100 group-hover:bg-slate-200"}`}>
          <PlayCircle size={14} className={active ? "text-white fill-white" : "text-slate-500"} />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Clock size={9} />
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
}
