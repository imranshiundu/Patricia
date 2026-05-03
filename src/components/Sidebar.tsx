"use client";

import {
  Search,
  Book,
  Sparkles,
  Settings,
  LayoutDashboard,
  ListChecks,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PatriciaCase = {
  id: string;
  title: string;
  citation?: string;
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

export function Sidebar() {
  const pathname = usePathname();
  const [recentCases, setRecentCases] = useState<PatriciaCase[]>([]);

  useEffect(() => {
    const syncCases = () => setRecentCases(readStoredCases().slice(0, 8));
    syncCases();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("storage", syncCases);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col justify-between py-6 px-4 bg-white border-r border-slate-100 shadow-sm z-10 m-2 rounded-3xl h-[calc(100vh-16px)]">
      <div>
        <Link href="/" className="flex items-center gap-2 px-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Patricia</span>
          <div className="ml-auto flex gap-[2px]">
            <div className="w-[4px] h-[16px] bg-slate-300 rounded-full" />
            <div className="w-[4px] h-[16px] bg-slate-300 rounded-full" />
          </div>
        </Link>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your saved cases..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            onChange={(event) => {
              window.dispatchEvent(
                new CustomEvent("patricia:search", { detail: event.target.value })
              );
            }}
          />
          <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span className="border border-slate-200 rounded px-1 min-w-[16px] text-center">⌘</span>
            <span className="border border-slate-200 rounded px-1">K</span>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Chat" active={pathname === "/"} />
          <NavItem href="/documents" icon={<FileText size={18} />} label="Documents" active={pathname === "/documents"} />
          <NavItem href="/library" icon={<Book size={18} />} label="Library" active={pathname === "/library"} />
          <NavItem href="/queue" icon={<ListChecks size={18} />} label="Queue" active={pathname === "/queue"} />
        </nav>

        <div className="flex-1 overflow-y-auto min-h-[150px] -mx-2 px-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Cases</h3>
          </div>
          <div className="space-y-0.5">
            {recentCases.length > 0 ? (
              recentCases.map((item) => (
                <ChatLink key={item.id} id={item.id} title={item.title} active={pathname === `/chat/${item.id}`} />
              ))
            ) : (
              <p className="px-3 py-2 text-[12px] leading-relaxed text-slate-400">
                No saved cases yet. Upload or paste a judgment to create Patricia&apos;s first real case record.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <nav className="space-y-1 mb-6">
          <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" active={pathname === "/settings"} />
        </nav>

        <Link href="/documents" className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-50 group rounded-xl transition-colors active:scale-95">
          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm transition-colors">
            P
          </div>
          <div className="flex flex-col flex-1 truncate">
            <span className="text-sm font-semibold truncate text-slate-800">Local session</span>
            <span className="text-xs text-slate-500 truncate">Browser storage only</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, badge, action }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
        active
          ? "bg-slate-100 text-slate-900 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {(badge || action) && (
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-bold tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {action && (
            <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200" onClick={(e) => e.preventDefault()}>
              {action}
            </button>
          )}
        </div>
      )}
    </Link>
  );
}

function ChatLink({ id, title, active }: { id: string; title: string; active?: boolean }) {
  return (
    <Link
      href={`/?case=${id}`}
      className={`block px-3 py-2 rounded-xl text-[13px] font-medium transition-all truncate active:scale-[0.98] ${
        active
          ? "bg-slate-100 text-slate-900 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {title}
    </Link>
  );
}
