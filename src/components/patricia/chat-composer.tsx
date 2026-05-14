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
    <form onSubmit={onSubmit} className="rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500 lg:grid-cols-[1.1fr_0.9fr]">
        <label className="flex items-center gap-2">
          <MessageSquare size={14} />
          <span className="shrink-0">Workflow</span>
          <select value={selectedCommand} onChange={(event) => setSelectedCommand(event.target.value)} className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 outline-none">
            {PATRICIA_LEGAL_COMMANDS.map((item) => (
              <option key={item.command} value={item.command}>{item.command} — {item.agent}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <FileText size={14} />
          <span className="shrink-0">Document</span>
          {cases.length > 0 ? (
            <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 outline-none">
              <option value="">no document selected</option>
              {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          ) : (
            <span className="truncate text-slate-400">no saved document selected</span>
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
          placeholder="Send the task to the server runner: facts, contract, policy, clause, question, or draft..."
          className="max-h-44 min-h-[58px] flex-1 resize-none bg-transparent px-4 py-4 text-[15px] font-light leading-6 outline-none placeholder:text-slate-400"
        />
        <Link href="/documents" className="mb-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Add document">
          <Paperclip size={18} />
        </Link>
        <button type="submit" disabled={!input.trim() || isSending} className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-2 text-[11px] font-light text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/documents" className="flex items-center gap-1 hover:text-slate-700"><FileText size={13} /> Add document text</Link>
        <span className="flex items-center gap-1"><Server size={12} /> {error || "Server-backed workflow. Missing connectors are shown, not faked."}</span>
      </div>
    </form>
  );
}
