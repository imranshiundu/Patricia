"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PATRICIA_PLUGIN_GROUPS, PATRICIA_VISIBLE_COMMANDS } from "@/lib/patricia-skills/registry";

export function ClaudeCommandPanel({
  selectedCommand,
  onSelect,
}: {
  selectedCommand: string;
  onSelect: (command: string, prompt: string) => void;
}) {
  const [selectedPlugin, setSelectedPlugin] = useState("all");
  const [query, setQuery] = useState("");

  const commands = useMemo(() => {
    const q = query.toLowerCase().trim();
    return PATRICIA_VISIBLE_COMMANDS.filter((command) => {
      const matchesPlugin = selectedPlugin === "all" || command.plugin === selectedPlugin;
      const haystack = `${command.command} ${command.agent} ${command.userButton} ${command.stage}`.toLowerCase();
      return matchesPlugin && (!q || haystack.includes(q));
    });
  }, [query, selectedPlugin]);

  return (
    <section className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-medium text-white">
            <ShieldCheck size={13} /> Claude-for-legal command center
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Choose the legal workflow before Patricia answers.</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">This is no longer the old Patricia legal brain. The UI selects a Claude-for-legal source path, then the server runner executes that workflow through the configured LLM.</p>
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:w-[360px]">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflows, agents, practice areas..." className="w-full bg-transparent outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setSelectedPlugin("all")} className={chip(selectedPlugin === "all")}>All workflows</button>
        {PATRICIA_PLUGIN_GROUPS.map((plugin) => (
          <button key={plugin} type="button" onClick={() => setSelectedPlugin(plugin)} className={chip(selectedPlugin === plugin)}>
            {plugin}
          </button>
        ))}
      </div>

      <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        {commands.slice(0, 45).map((command) => (
          <button key={command.command} type="button" onClick={() => onSelect(command.command, command.promptFrame)} className={card(selectedCommand === command.command)}>
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-slate-900">{command.userButton}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{command.plugin}</span>
            </span>
            <span className="mt-1 line-clamp-2 text-left text-[11px] font-light leading-4 text-slate-500">{command.shortDescription}</span>
            <span className="mt-2 block truncate text-left text-[10px] text-slate-400">{command.command}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function chip(active: boolean) {
  return `shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium ${active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`;
}

function card(active: boolean) {
  return `rounded-2xl border p-3 text-left transition ${active ? "border-slate-900 bg-slate-950 text-white shadow-sm [&_*]:text-white" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`;
}
