"use client";

import {
  Search,
  Book,
  Sparkles,
  Settings,
  LayoutDashboard,
  ListChecks,
  FileText,
  Scale,
  MessageSquare,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createChatSession,
  getActiveChatSessionId,
  getChatSessions,
  PatriciaChatSession,
  setActiveChatSessionId,
} from "@/lib/patricia-chat-sessions";

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
  const [sessions, setSessions] = useState<PatriciaChatSession[]>([]);
  const [activeSessionId, setActiveSession] = useState("");

  useEffect(() => {
    const syncCases = () => setRecentCases(readStoredCases().slice(0, 5));
    const syncSessions = () => {
      setSessions(getChatSessions().slice(0, 8));
      setActiveSession(getActiveChatSessionId());
    };
    syncCases();
    syncSessions();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("patricia:chat-sessions-updated", syncSessions);
    window.addEventListener("patricia:active-chat-session-updated", syncSessions);
    window.addEventListener("storage", syncCases);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("patricia:chat-sessions-updated", syncSessions);
      window.removeEventListener("patricia:active-chat-session-updated", syncSessions);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  function newChat() {
    createChatSession();
  }

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col justify-between py-6 px-4 bg-white border-r border-slate-100 shadow-sm z-10 m-2 rounded-3xl h-[calc(100vh-16px)]">
      <div className="min-h-0 flex-1">
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

        <div className="relative mb-5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your saved cases..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            onChange={(event) => window.dispatchEvent(new CustomEvent("patricia:search", { detail: event.target.value }))}
          />
        </div>

        <nav className="space-y-1 mb-5">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Chat" active={pathname === "/"} />
          <NavItem href="/research" icon={<Scale size={18} />} label="Research" active={pathname === "/research"} />
          <NavItem href="/documents" icon={<FileText size={18} />} label="Documents" active={pathname === "/documents"} />
          <NavItem href="/library" icon={<Book size={18} />} label="Library" active={pathname === "/library"} />
          <NavItem href="/queue" icon={<ListChecks size={18} />} label="Queue" active={pathname === "/queue"} />
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto -mx-2 px-2 pb-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chats</h3>
            <button type="button" onClick={newChat} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="New chat">
              <Plus size={14} />
            </button>
          </div>
          <div className="mb-5 space-y-0.5">
            {sessions.length > 0 ? (
              sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveChatSessionId(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
                    activeSessionId === item.id && pathname === "/"
                      ? "bg-slate-100 text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <MessageSquare size={13} className="flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-[12px] leading-relaxed text-slate-400">No saved chats yet.</p>
            )}
          </div>

          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Cases</h3>
          </div>
          <div className="space-y-0.5">
            {recentCases.length > 0 ? (
              recentCases.map((item) => <CaseLink key={item.id} title={item.title} />)
            ) : (
              <p className="px-3 py-2 text-[12px] leading-relaxed text-slate-400">
                No saved cases yet. Upload, paste, or import a judgment.
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
          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm transition-colors">P</div>
          <div className="flex flex-col flex-1 truncate">
            <span className="text-sm font-semibold truncate text-slate-800">Local session</span>
            <span className="text-xs text-slate-500 truncate">Browser storage only</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${active ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
    </Link>
  );
}

function CaseLink({ title }: { title: string }) {
  return <div className="block truncate rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500">{title}</div>;
}
