"use client";

import { Search } from "lucide-react";
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
    <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setSelectedPlugin("all")} className={chip(selectedPlugin === "all")}>All</button>
        {PATRICIA_PLUGIN_GROUPS.map((plugin) => (
          <button key={plugin} type="button" onClick={() => setSelectedPlugin(plugin)} className={chip(selectedPlugin === plugin)}>
            {plugin}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <Search size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Claude-for-legal workflows..." className="w-full bg-transparent outline-none placeholder:text-slate-400" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {commands.slice(0, 30).map((command) => (
          <button key={command.command} type="button" onClick={() => onSelect(command.command, command.promptFrame)} className={pill(selectedCommand === command.command)} title={command.sourcePath}>
            {command.userButton}
          </button>
        ))}
      </div>
    </section>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1.5 text-[11px] font-medium ${active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`;
}

function pill(active: boolean) {
  return `flex-shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`;
}
