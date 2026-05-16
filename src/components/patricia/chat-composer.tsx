"use client";

import { ArrowUp, FileText, Loader2, MessageSquare, Paperclip, Server } from "lucide-react";
import Link from "next/link";
import { FormEvent } from "react";
import { PatriciaCaseRecord } from "@/lib/patricia-storage";
import { PATRICIA_LEGAL_COMMANDS } from "@/lib/patricia-skills/registry";

export function PatriciaChatComposer({
  input,
  setInput,
  selectedCommand,
  setSelectedCommand,
  cases,
  selectedCaseId,
  setSelectedCaseId,
  isSending,
  error,
  onSubmit,
}: {
  input: string;
  setInput: (value: string) => void;
  selectedCommand: string;
  setSelectedCommand: (value: string) => void;
  cases: PatriciaCaseRecord[];
  selectedCaseId: string;
  setSelectedCaseId: (value: string) => void;
  isSending: boolean;
  error: string;
  onSubmit: (event?: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-[1.4rem] border border-border bg-panel p-2 shadow-sm">
      <div className="border-b border-border px-4 py-2.5 text-xs text-foreground-muted">
        <label className="flex items-center gap-3">
          <FileText size={14} className="text-foreground-muted" />
          <span className="shrink-0 font-semibold text-foreground">Active Case File</span>
          {cases.length > 0 ? (
            <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="min-w-0 flex-1 truncate rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-foreground">
              <option value="">no document selected</option>
              {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          ) : (
            <span className="truncate text-foreground-muted">no saved case file available</span>
          )}
        </label>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          rows={1}
          placeholder="Ask Patricia anything—legal analysis, accounting, student help, or paste any data..."
          className="max-h-96 min-h-[58px] flex-1 resize-none bg-transparent px-4 py-4 text-[15px] font-light leading-6 text-foreground outline-none placeholder:text-foreground-muted/60"
        />
        <Link href="/cases" className="mb-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted transition hover:bg-panel-elevated hover:text-foreground" aria-label="Add document">
          <Paperclip size={18} />
        </Link>
        <button type="submit" disabled={!input.trim() || isSending} className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-2 text-[11px] font-light text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
        <Link href="/cases" className="flex items-center gap-1 transition hover:text-foreground"><FileText size={13} /> Add case text</Link>
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </form>
  );
}
