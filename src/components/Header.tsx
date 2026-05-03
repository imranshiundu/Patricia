"use client";

import { FileText, Lock, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Chat",
    subtitle: "Ask Patricia using saved cases, imported sources, and live legal research leads.",
  },
  "/research": {
    title: "Research",
    subtitle: "Search trusted East African legal sources and import readable results.",
  },
  "/documents": {
    title: "Documents",
    subtitle: "Add real case text from paste or text files into local browser storage.",
  },
  "/library": {
    title: "Library",
    subtitle: "Review and export real cases saved on this device.",
  },
  "/queue": {
    title: "Queue",
    subtitle: "Track long-case chunk jobs created from imported or pasted cases.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Inspect real runtime status, storage, exports, and local cleanup controls.",
  },
};

export function Header() {
  const pathname = usePathname();
  const current = titles[pathname] || titles["/"];

  return (
    <header className="absolute left-0 right-0 top-0 z-10 flex min-h-[76px] items-center justify-between border-b border-slate-100 bg-slate-50/90 px-8 backdrop-blur-xl">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          <Lock size={13} />
          local browser session
        </div>
        <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{current.title}</h1>
        <p className="hidden max-w-2xl truncate text-xs font-medium text-slate-500 lg:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/research"
          className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 md:inline-flex"
        >
          <Search size={14} />
          Research
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-800 active:scale-95"
        >
          <FileText size={14} className="text-slate-200" />
          Add case
        </Link>
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Open settings"
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  );
}
