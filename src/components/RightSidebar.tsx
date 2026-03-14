"use client";

import { MoreHorizontal, UploadCloud, Headphones, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";
import { AudioPlayer } from "./AudioPlayer";

const recentCases = [
  {
    id: 1,
    title: "Independent Electoral Commission v Maina Kiai",
    sub: "Constitutional Law • Elections",
    tag: "Constitutional",
    duration: "45 min",
    active: true,
  },
  {
    id: 2,
    title: "Okiya Omtatah vs Attorney General",
    sub: "Finance Act 2023 • Tax Law",
    tag: "Finance",
    duration: "1h 10min",
  },
  {
    id: 3,
    title: "Republic vs. Wafula Buke",
    sub: "Criminal Law • Prosecution",
    tag: "Criminal",
    duration: "28 min",
  },
  {
    id: 4,
    title: "Murzat Ali vs Republic",
    sub: "Appeals • High Court",
    tag: "Appeals",
    duration: "34 min",
  },
  {
    id: 5,
    title: "Building Bridges Initiative (BBI)",
    sub: "Constitutional Law • Referendum",
    tag: "Constitutional",
    duration: "1h 20min",
  },
];

const tagColors: Record<string, string> = {
  Constitutional: "bg-blue-50 text-blue-700",
  Finance: "bg-amber-50 text-amber-700",
  Criminal: "bg-rose-50 text-rose-700",
  Appeals: "bg-violet-50 text-violet-700",
};

export function RightSidebar() {
  return (
    <aside className="w-[360px] flex-shrink-0 flex flex-col bg-slate-50/70 border-l border-slate-100 z-10 m-2 rounded-[32px] h-[calc(100vh-16px)] overflow-hidden">
      {/* Top Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        
        {/* Now Playing Card */}
        <AudioPlayer />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Headphones size={14} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Recent Cases</h3>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">7</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-white rounded-full transition-colors">
            <MoreHorizontal size={15} />
          </button>
        </div>

        {/* Cases List */}
        <div className="space-y-2">
          {recentCases.map((c) => (
            <CaseCard key={c.id} {...c} />
          ))}
        </div>
      </div>

      {/* Bottom Action Footer */}
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
            <span className="text-[11px] text-slate-400 font-medium">Add PDFs to your library</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function CaseCard({ title, sub, tag, duration, active }: any) {
  const tagClass = tagColors[tag] ?? "bg-slate-100 text-slate-600";
  return (
    <div
      className={`group flex items-stretch gap-3 p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${
        active
          ? "bg-white shadow-sm border border-blue-100 ring-1 ring-blue-50"
          : "bg-white/0 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      {/* Left Accent */}
      <div className={`w-1 flex-shrink-0 rounded-full ${active ? "bg-blue-500" : "bg-slate-200 group-hover:bg-slate-300"} transition-colors`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagClass}`}>{tag}</span>
        </div>
        <h4 className={`text-[13px] font-semibold leading-snug line-clamp-2 mb-1 ${active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"} transition-colors`}>
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium truncate">{sub}</p>
      </div>

      {/* Right Meta */}
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
