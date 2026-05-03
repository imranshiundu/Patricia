"use client";

import { Archive, Bell, CheckCircle2, Database, Download, Loader2, RefreshCw, Settings, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getChatSessions } from "@/lib/patricia-chat-sessions";
import { exportCasesJson } from "@/lib/patricia-export";
import { getPatriciaQueue } from "@/lib/patricia-queue";
import { getPatriciaCases } from "@/lib/patricia-storage";

type PatriciaStatus = {
  ok: boolean;
  ai: { provider: string; model: string; apiKeyConfigured: boolean };
  runtime: { storage: string; database: string; permanentFileServer: boolean; serverTime: string };
  research: {
    sourceCount: number;
    sourcesByAuthority: Record<string, number>;
    sourcesByCountry: Record<string, number>;
    trustedSources: Array<{ id: string; name: string; country: string; kind: string; authority: string; baseUrl: string }>;
  };
};

const SETTINGS_KEY = "patricia:local-settings";

type LocalSettings = {
  compactAnswers: boolean;
  showVerificationNotes: boolean;
  autoQueueCases: boolean;
};

const defaultSettings: LocalSettings = {
  compactAnswers: false,
  showVerificationNotes: true,
  autoQueueCases: true,
};

function readLocalSettings(): LocalSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function localStorageBytes() {
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
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<PatriciaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<LocalSettings>(defaultSettings);
  const [snapshot, setSnapshot] = useState({ cases: 0, chats: 0, jobs: 0, bytes: 0 });

  const officialSources = useMemo(() => status?.research.sourcesByAuthority.official || 0, [status]);

  function refreshLocalSnapshot() {
    setSnapshot({
      cases: getPatriciaCases().length,
      chats: getChatSessions().length,
      jobs: getPatriciaQueue().length,
      bytes: localStorageBytes(),
    });
  }

  async function loadStatus() {
    setIsLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/patricia/status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status check failed.");
      setStatus(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load runtime status.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateSetting(key: keyof LocalSettings) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setNotice("Saved local preference on this browser.");
  }

  function exportLibrary() {
    exportCasesJson(getPatriciaCases());
    setNotice("Export started. Your browser will download the saved Patricia library JSON.");
  }

  function clearLocalData() {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("patricia:")) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event("patricia:cases-updated"));
    window.dispatchEvent(new Event("patricia:chat-sessions-updated"));
    window.dispatchEvent(new Event("patricia:queue-updated"));
    setSettings(defaultSettings);
    refreshLocalSnapshot();
    setNotice("Cleared Patricia local browser data on this device.");
  }

  useEffect(() => {
    setSettings(readLocalSettings());
    refreshLocalSnapshot();
    loadStatus();
  }, []);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
              <Settings className="text-blue-500" size={30} />
              Real system settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              No accounts, no fake billing, no mock profile. Patricia currently runs with server-side Groq, trusted legal source connectors, and local browser storage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshLocalSnapshot();
              loadStatus();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        {notice && <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{notice}</div>}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatusCard label="Groq API" value={status?.ai.apiKeyConfigured ? "Configured" : "Missing key"} good={Boolean(status?.ai.apiKeyConfigured)} />
          <StatusCard label="Model" value={status?.ai.model || "Checking..."} />
          <StatusCard label="Trusted sources" value={status ? `${status.research.sourceCount}` : "—"} sub={`${officialSources} official`} />
          <StatusCard label="Local data" value={formatBytes(snapshot.bytes)} sub={`${snapshot.cases} cases · ${snapshot.chats} chats`} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="text-blue-500" />
                <div>
                  <h2 className="font-bold text-slate-900">Answer behaviour</h2>
                  <p className="text-sm text-slate-500">Local preferences only. These do not create an account or send profile data anywhere.</p>
                </div>
              </div>
              <div className="space-y-3">
                <ToggleRow label="Show verification notes" description="Keep Patricia explicit about verified facts, source leads, and gaps." active={settings.showVerificationNotes} onClick={() => updateSetting("showVerificationNotes")} />
                <ToggleRow label="Compact answers" description="Prefer shorter first replies before asking for deeper memos." active={settings.compactAnswers} onClick={() => updateSetting("compactAnswers")} />
                <ToggleRow label="Auto-queue saved cases" description="When a case is saved, prepare chunk jobs for long-case processing." active={settings.autoQueueCases} onClick={() => updateSetting("autoQueueCases")} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Database className="text-blue-500" />
                <div>
                  <h2 className="font-bold text-slate-900">Local storage</h2>
                  <p className="text-sm text-slate-500">Everything listed here comes from this browser/device.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="Saved cases" value={snapshot.cases} />
                <Metric label="Chat sessions" value={snapshot.chats} />
                <Metric label="Queue jobs" value={snapshot.jobs} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={exportLibrary} disabled={snapshot.cases === 0} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Archive size={15} /> Export library
                </button>
                <button onClick={clearLocalData} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                  <Trash2 size={15} /> Clear Patricia local data
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900">Runtime truth</h2>
                {status?.ok && <CheckCircle2 className="text-emerald-500" size={18} />}
              </div>
              <div className="space-y-3 text-sm">
                <InfoRow label="AI provider" value={status?.ai.provider || "—"} />
                <InfoRow label="Storage" value={status?.runtime.storage || "—"} />
                <InfoRow label="Database" value={status?.runtime.database || "—"} />
                <InfoRow label="Permanent files" value={status?.runtime.permanentFileServer ? "enabled" : "disabled"} />
                <InfoRow label="Server time" value={status?.runtime.serverTime ? new Date(status.runtime.serverTime).toLocaleString() : "—"} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Download className="text-blue-500" />
                <h2 className="font-bold text-slate-900">Trusted source connectors</h2>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {status?.research.trustedSources.map((source) => (
                  <a key={source.id} href={source.baseUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-100 p-3 hover:bg-slate-50">
                    <p className="truncate text-sm font-bold text-slate-800">{source.name}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{source.country} · {source.kind} · {source.authority}</p>
                  </a>
                )) || <p className="text-sm text-slate-500">Loading source registry...</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Bell size={16} /> Deployment note
              </div>
              <p className="text-sm leading-6 text-slate-300">
                On Vercel, the site will use the latest pushed `main` branch after redeploy. Keep `GROQ_API_KEY` server-side only; never expose it with `NEXT_PUBLIC_`.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`truncate text-xl font-bold ${good === false ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

function ToggleRow({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50">
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span className={`relative h-7 w-12 rounded-full transition ${active ? "bg-slate-900" : "bg-slate-200"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${active ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[180px] truncate text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}
