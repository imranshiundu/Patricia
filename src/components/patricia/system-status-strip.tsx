"use client";

import { Activity, Brain, Database, Server } from "lucide-react";
import { useEffect, useState } from "react";

type HealthPayload = {
  ok?: boolean;
  backendMode?: string;
  runtime?: string;
  workflowBrain?: string;
  orchestration?: string;
  releaseReady?: boolean;
  llm?: {
    configured?: boolean;
    provider?: string;
    model?: string;
  };
};

export function PatriciaSystemStatusStrip() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/patricia/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (alive) setHealth(data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const llmConfigured = Boolean(health?.llm?.configured);

  return (
    <section className="grid gap-2 border-y border-slate-100 bg-white/90 px-4 py-3 text-[11px] text-slate-500 backdrop-blur md:grid-cols-4">
      <StatusItem icon={<Server size={14} />} label="Backend" value={failed ? "offline" : health?.backendMode || "checking"} strong={Boolean(health?.ok)} />
      <StatusItem icon={<Brain size={14} />} label="Brain" value={health?.workflowBrain || "claude-for-legal"} strong />
      <StatusItem icon={<Activity size={14} />} label="LLM" value={health?.llm ? `${health.llm.provider || "auto"} · ${health.llm.model || "model"}` : "checking"} strong={llmConfigured} />
      <StatusItem icon={<Database size={14} />} label="Storage" value="local now · server-ready next" strong />
    </section>
  );
}

function StatusItem({ icon, label, value, strong }: { icon: React.ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl bg-slate-50 px-3 py-2">
      <span className={strong ? "text-slate-900" : "text-slate-400"}>{icon}</span>
      <span className="shrink-0 font-medium text-slate-700">{label}</span>
      <span className="truncate font-light">{value}</span>
    </div>
  );
}
