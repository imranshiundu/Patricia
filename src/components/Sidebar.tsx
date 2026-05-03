"use client";

import {
  Book,
  Database,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plus,
  Scale,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  createChatSession,
  getActiveChatSessionId,
  getChatSessions,
  PatriciaChatSession,
  setActiveChatSessionId,
} from "@/lib/patricia-chat-sessions";
import { getPatriciaQueue } from "@/lib/patricia-queue";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";

function storageBytes() {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index) || "";
    const value = window.localStorage.getItem(key) || "";
    if (key.startsWith("patricia:")) total += key.length + value.length;
  }
  return total * 2;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [recentCases, setRecentCases] = useState<PatriciaCaseRecord[]>([]);
  const [sessions, setSessions] = useState<PatriciaChatSession[]>([]);
  const [activeSessionId, setActiveSession] = useState("");
  const [queueCount, setQueueCount] = useState(0);
  const [bytes, setBytes] = useState(0);

  useEffect(() => {
    const syncAll = () => {
      setRecentCases(getPatriciaCases().slice(0, 5));
      setSessions(getChatSessions().slice(0, 7));
      setActiveSession(getActiveChatSessionId());
      setQueueCount(getPatriciaQueue().length);
      setBytes(storageBytes());
    };

    syncAll();
    window.addEventListener("patricia:cases-updated", syncAll);
    window.addEventListener("patricia:chat-sessions-updated", syncAll);
    window.addEventListener("patricia:active-chat-session-updated", syncAll);
    window.addEventListener("patricia:queue-updated", syncAll);
    window.addEventListener("storage", syncAll);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncAll);
      window.removeEventListener("patricia:chat-sessions-updated", syncAll);
      window.removeEventListener("patricia:active-chat-session-updated", syncAll);
      window.removeEventListener("patricia:queue-updated", syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, []);

  function newChat() {
    createChatSession();
    router.push("/");
  }

  function openChat(id: string) {
    setActiveChatSessionId(id);
    router.push("/");
  }

  return (
    <aside className="m-2 flex h-[calc(100vh-16px)] w-[288px] flex-shrink-0 flex-col rounded-3xl border border-slate-100 bg-white px-4 py-5 shadow-sm">
      <Link href="/" className="mb-5 flex items-center gap-3 rounded-2xl px-2 py-2 transition-opacity hover:opacity-80">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black tracking-tight text-slate-900">Patricia</p>
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">legal research assistant</p>
        </div>
      </Link>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search saved cases..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={(event) => window.dispatchEvent(new CustomEvent("patricia:search", { detail: event.target.value }))}
        />
      </div>

      <nav className="mb-4 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Chat" active={pathname === "/"} count={sessions.length} />
        <NavItem href="/research" icon={<Scale size={18} />} label="Research" active={pathname === "/research"} />
        <NavItem href="/documents" icon={<FileText size={18} />} label="Documents" active={pathname === "/documents"} />
        <NavItem href="/library" icon={<Book size={18} />} label="Library" active={pathname === "/library"} count={recentCases.length} />
        <NavItem href="/queue" icon={<ListChecks size={18} />} label="Queue" active={pathname === "/queue"} count={queueCount} />
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SectionTitle label="Chats" action={<button type="button" onClick={newChat} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="New chat"><Plus size={14} /></button>} />
        <div className="mb-5 space-y-1">
          {sessions.length > 0 ? (
            sessions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openChat(item.id)}
                className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] font-semibold transition-all active:scale-[0.98] ${
                  activeSessionId === item.id && pathname === "/"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <MessageSquare size={13} className="flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            ))
          ) : (
            <EmptyLine text="No saved chats yet." />
          )}
        </div>

        <SectionTitle label="Recent cases" />
        <div className="space-y-1">
          {recentCases.length > 0 ? (
            recentCases.map((item) => <CaseLink key={item.id} title={item.title} citation={item.citation} />)
          ) : (
            <EmptyLine text="No saved cases. Add or import a judgment." />
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-3 rounded-2xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Database size={13} /> Real local data
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Cases" value={recentCases.length} />
            <MiniStat label="Chats" value={sessions.length} />
            <MiniStat label="Jobs" value={queueCount} />
          </div>
          <p className="mt-2 truncate text-center text-[11px] font-medium text-slate-400">{formatBytes(bytes)} used on this browser</p>
        </div>
        <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" active={pathname === "/settings"} />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, count }: { href: string; icon: ReactNode; label: string; active: boolean; count?: number }) {
  return (
    <Link href={href} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${active ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
      {typeof count === "number" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600">{count}</span>}
    </Link>
  );
}

function SectionTitle({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</h3>
      {action}
    </div>
  );
}

function CaseLink({ title, citation }: { title: string; citation?: string }) {
  return (
    <Link href="/library" className="block rounded-2xl px-3 py-2 transition hover:bg-slate-50">
      <p className="truncate text-[13px] font-bold text-slate-700">{title}</p>
      <p className="truncate text-[11px] font-medium text-slate-400">{citation || "Saved locally"}</p>
    </Link>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-2xl px-3 py-2 text-[12px] leading-relaxed text-slate-400">{text}</p>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2">
      <p className="text-sm font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
