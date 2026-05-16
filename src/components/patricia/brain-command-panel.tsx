"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PATRICIA_PLUGIN_GROUPS, PATRICIA_VISIBLE_COMMANDS } from "@/lib/patricia-skills/registry";

export function BrainCommandPanel({
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
    <section className="flex h-full flex-col">
      <div className="mb-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-panel-elevated px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          <ShieldCheck size={12} /> Command Center
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Select Workflow</h2>
        <p className="mt-1 text-xs text-foreground-muted">Choose the brain source to execute.</p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground-muted">
        <Search size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflows..." className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground-muted/50" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setSelectedPlugin("all")} className={chip(selectedPlugin === "all")}>All</button>
        {PATRICIA_PLUGIN_GROUPS.map((plugin) => (
          <button key={plugin} type="button" onClick={() => setSelectedPlugin(plugin)} className={chip(selectedPlugin === plugin)}>
            {plugin.replace("-legal", "")}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {commands.slice(0, 45).map((command) => (
          <button key={command.command} type="button" onClick={() => onSelect(command.command, command.promptFrame)} className={card(selectedCommand === command.command)}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{command.userButton}</span>
            </div>
            <span className="mt-1 line-clamp-2 text-left text-xs text-foreground-muted">{command.shortDescription}</span>
            <span className="mt-2 block truncate text-left text-[10px] font-mono text-foreground-muted/70">{command.command}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function chip(active: boolean) {
  return `shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-medium transition-colors ${active ? "bg-foreground text-background" : "bg-panel text-foreground hover:bg-panel-elevated"}`;
}

function card(active: boolean) {
  return `w-full rounded-2xl border p-3 text-left transition-all ${active ? "border-foreground bg-panel-elevated text-foreground shadow-sm" : "border-border bg-panel text-foreground hover:border-foreground-muted hover:bg-panel-elevated"}`;
}
