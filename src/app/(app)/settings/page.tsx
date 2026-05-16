"use client";

import { Archive, Bell, CheckCircle2, Database, Download, Loader2, RefreshCw, Settings, ShieldCheck, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getChatSessions } from "@/lib/patricia-chat-sessions";
import { exportCasesJson } from "@/lib/patricia-export";
import { getPatriciaQueue } from "@/lib/patricia-queue";
import { getPatriciaCases } from "@/lib/patricia-storage";

type PatriciaStatus = {
  ok: boolean;
  ai: {
    provider?: string;
    model?: string;
    apiKeyConfigured?: boolean;
    providers?: Record<string, boolean>;
    models?: Record<string, string | null>;
  };
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
  const [tempApiKey, setTempApiKey] = useState("");

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
    <div className="h-full overflow-y-auto px-6 py-6 bg-background">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
              <Settings className="text-foreground-muted" size={24} />
              System Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              Configure your AI provider, manage local storage, and review trusted research sources.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshLocalSnapshot();
              loadStatus();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-panel-elevated"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        {notice && <div className="mb-6 rounded-2xl border border-border bg-panel-elevated px-4 py-3 text-sm font-medium text-foreground">{notice}</div>}

        {status && !status.ok && (
          <div className="mb-8 rounded-3xl bg-red-500/10 border border-red-500/20 p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                <AlertTriangle size={20} /> Missing API Key
              </h2>
              <p className="text-sm text-foreground-muted mt-1 max-w-md">
                Patricia requires an active LLM provider to function. Provide your API key to activate the legal runner.
              </p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <input 
                type="password" 
                placeholder="sk-..." 
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="flex-1 md:w-64 rounded-xl border border-red-500/30 bg-panel px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500" 
              />
              <button className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition shrink-0">
                Save Key
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-panel p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="font-semibold text-foreground text-lg">AI Provider</h2>
              <p className="text-sm text-foreground-muted">Manage your active language model connection.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2 block">Active Provider</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none rounded-xl border border-border bg-panel-elevated px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    value={status?.ai.provider || "not-configured"}
                    disabled
                  >
                    <option value="not-configured">Not configured</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI</option>
                    <option value="groq">Groq</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 text-foreground-muted pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2 block">Default Model</label>
                <input 
                  type="text" 
                  value={status?.ai.model || "Checking..."} 
                  disabled 
                  className="w-full rounded-xl border border-border bg-panel-elevated px-4 py-3 text-sm text-foreground opacity-80" 
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-panel p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Download className="text-foreground-muted" />
              <div>
                <h2 className="font-semibold text-foreground text-lg">Trusted Source Connectors</h2>
                <p className="text-sm text-foreground-muted">Verified official legal registries ({officialSources} official sources).</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {status?.research.trustedSources.map((source) => (
                <a key={source.id} href={source.baseUrl} target="_blank" rel="noreferrer" className="flex flex-col justify-center rounded-2xl border border-border p-4 transition hover:bg-panel-elevated">
                  <p className="truncate text-sm font-medium text-foreground">{source.name}</p>
                  <p className="mt-1 text-[11px] font-medium tracking-wide text-foreground-muted uppercase">
                    {source.country} · {source.kind} · {source.authority}
                  </p>
                </a>
              )) || <p className="text-sm text-foreground-muted p-4">Loading source registry...</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-panel p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="text-foreground-muted" />
              <div>
                <h2 className="font-semibold text-foreground text-lg">Answer Behaviour</h2>
                <p className="text-sm text-foreground-muted">Local browser preferences.</p>
              </div>
            </div>
            <div className="space-y-3">
              <ToggleRow label="Show verification notes" description="Keep Patricia explicit about verified facts, source leads, and gaps." active={settings.showVerificationNotes} onClick={() => updateSetting("showVerificationNotes")} />
              <ToggleRow label="Compact answers" description="Prefer shorter first replies before asking for deeper memos." active={settings.compactAnswers} onClick={() => updateSetting("compactAnswers")} />
              <ToggleRow label="Auto-queue saved cases" description="When a case is saved, prepare chunk jobs for long-case processing." active={settings.autoQueueCases} onClick={() => updateSetting("autoQueueCases")} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-panel p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Database className="text-foreground-muted" />
              <div>
                <h2 className="font-semibold text-foreground text-lg">Local Storage</h2>
                <p className="text-sm text-foreground-muted">Manage data saved on this specific device ({formatBytes(snapshot.bytes)} used).</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
              <Metric label="Saved cases" value={snapshot.cases} />
              <Metric label="Chat sessions" value={snapshot.chats} />
              <Metric label="Queue jobs" value={snapshot.jobs} />
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <button onClick={exportLibrary} disabled={snapshot.cases === 0} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                <Archive size={16} /> Export library
              </button>
              <button onClick={clearLocalData} className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10">
                <Trash2 size={16} /> Clear local data
              </button>
            </div>
          </section>

          <details className="group rounded-3xl border border-border bg-panel shadow-sm [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-foreground">
              <div className="flex items-center gap-3">
                <Settings className="text-foreground-muted" size={20} />
                Advanced / Debug Info
              </div>
              <span className="transition group-open:rotate-180">
                <ChevronDown size={20} className="text-foreground-muted" />
              </span>
            </summary>
            <div className="border-t border-border p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-foreground-muted">System Status</span>
                {status?.ok ? <span className="flex items-center gap-1 text-green-500"><CheckCircle2 size={14} /> OK</span> : <span className="text-red-500">Degraded</span>}
              </div>
              <InfoRow label="Storage Tier" value={status?.runtime.storage || "—"} />
              <InfoRow label="Database Connection" value={status?.runtime.database || "—"} />
              <InfoRow label="Permanent Files" value={status?.runtime.permanentFileServer ? "Enabled" : "Disabled"} />
              <InfoRow label="Server Time" value={status?.runtime.serverTime ? new Date(status.runtime.serverTime).toLocaleString() : "—"} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-panel p-4 text-left transition hover:bg-panel-elevated">
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      </div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? "bg-accent" : "bg-panel-elevated border border-border"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-all ${active ? "bg-accent-foreground left-[22px]" : "bg-foreground-muted left-0.5"}`} />
      </span>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-foreground-muted font-medium">{label}</span>
      <span className="max-w-[200px] truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
