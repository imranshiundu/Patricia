"use client";

import { FileText, Loader2, Mic, Plus, Server, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PatriciaChatComposer } from "@/components/patricia/chat-composer";
import { PatriciaChatMessageCard } from "@/components/patricia/chat-message";
import { ClaudeCommandPanel } from "@/components/patricia/claude-command-panel";
import { PatriciaSystemStatusStrip } from "@/components/patricia/system-status-strip";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";
import { PATRICIA_LEGAL_COMMANDS } from "@/lib/patricia-skills/registry";
import { cleanVisibleAnswer } from "@/lib/patricia-output";
import { createChatSession, deleteChatSession, getOrCreateActiveSession, makePatriciaId, PatriciaChatMessage, PatriciaChatSession, titleFromQuestion, upsertChatSession } from "@/lib/patricia-chat-sessions";

const MAX_CONTEXT_CHARS = 60000;
const QUICK_COMMANDS = PATRICIA_LEGAL_COMMANDS.slice(0, 6);

export function PatriciaChat() {
  const [session, setSession] = useState<PatriciaChatSession | null>(null);
  const [input, setInput] = useState("");
  const [cases, setCases] = useState<PatriciaCaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedCommand, setSelectedCommand] = useState(QUICK_COMMANDS[0]?.command || "");
  const [isSending, setIsSending] = useState(false);
  const [researchStage, setResearchStage] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messages = session?.messages || [];
  const activeCommand = useMemo(() => PATRICIA_LEGAL_COMMANDS.find((item) => item.command === selectedCommand) || QUICK_COMMANDS[0], [selectedCommand]);

  useEffect(() => {
    const active = getOrCreateActiveSession();
    setSession(active);
    setSelectedCommand(active.selectedCommand || QUICK_COMMANDS[0]?.command || "");
    const syncCases = () => {
      const records = getPatriciaCases();
      setCases(records);
      setSelectedCaseId((current) => current || active.selectedCaseId || records[0]?.id || "");
    };
    const syncSession = () => {
      const next = getOrCreateActiveSession();
      setSession(next);
      if (next.selectedCommand) setSelectedCommand(next.selectedCommand);
    };
    syncCases();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("patricia:chat-sessions-updated", syncSession);
    window.addEventListener("patricia:active-chat-session-updated", syncSession);
    window.addEventListener("storage", syncCases);
    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("patricia:chat-sessions-updated", syncSession);
      window.removeEventListener("patricia:active-chat-session-updated", syncSession);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, isSending]);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedCaseId), [cases, selectedCaseId]);
  const selectedCaseText = useMemo(() => (selectedCase?.fullText || selectedCase?.textPreview || "").slice(0, MAX_CONTEXT_CHARS), [selectedCase]);

  function persistSession(nextMessages: PatriciaChatMessage[], title?: string) {
    const base = session || createChatSession(title || "New workflow");
    const updated = upsertChatSession({ ...base, title: title || base.title, selectedCaseId, selectedCommand, messages: nextMessages });
    setSession(updated);
    return updated;
  }

  function updateMessageContent(id: string, content: string) {
    if (!session) return;
    persistSession(messages.map((message) => (message.id === id ? { ...message, content } : message)), session.title);
  }

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;
    const userMessage: PatriciaChatMessage = { id: makePatriciaId("user"), role: "user", content: question, createdAt: new Date().toISOString() };
    const title = messages.length === 0 ? titleFromQuestion(question) : session?.title;
    const withUser = [...messages, userMessage];
    persistSession(withUser, title);
    setInput("");
    setError("");
    setIsSending(true);
    setResearchStage("Loading source workflow...");
    try {
      setResearchStage(`${activeCommand?.agent || "Workflow agent"} is checking inputs...`);
      const response = await fetch("/api/patricia/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, command: selectedCommand, caseText: selectedCaseText, caseTitle: selectedCase?.title || "", citation: selectedCase?.citation || "", previousMessages: withUser.slice(-8) }) });
      setResearchStage("Drafting and checking output...");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Patricia could not answer right now.");
      const assistantMessage: PatriciaChatMessage = { id: makePatriciaId("assistant"), role: "assistant", content: cleanVisibleAnswer(data.content || "No answer was produced from the available context."), createdAt: new Date().toISOString(), sources: data.sources || [], skill: { command: data.skill?.command, plugin: data.skill?.plugin, agent: data.skill?.agent, stage: data.skill?.stage, sourceQuality: data.sourceQuality, trustScore: data.trustScore, confidence: data.confidence, releaseSafe: data.releaseSafe, shouldAbstain: data.shouldAbstain, missingInputs: data.skill?.missingInputs || [] } };
      persistSession([...withUser, assistantMessage], title);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Patricia could not answer right now.";
      setError(message);
      persistSession([...withUser, { id: makePatriciaId("assistant-error"), role: "assistant", content: `Could not complete the request. ${message}`, createdAt: new Date().toISOString() }], title);
    } finally {
      setIsSending(false);
      setResearchStage("");
    }
  }

  function useCommand(command: string, prompt: string) { setSelectedCommand(command); setInput(prompt); if (session) upsertChatSession({ ...session, selectedCommand: command }); }
  function clearCurrentChat() { if (!session) return; deleteChatSession(session.id); setSession(createChatSession()); setError(""); }
  function startNewChat() { setSession(createChatSession()); setInput(""); setError(""); }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-950">
      <div className="border-b border-slate-100 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Patricia server-backed legal OS</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{session?.title || "New workflow"}</h1>
            {activeCommand && <p className="mt-1 truncate text-xs text-slate-500">{activeCommand.command} · {activeCommand.agent}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white"><Server size={14} /> Server-ready</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><Mic size={14} /> Audio next</button>
            <button type="button" onClick={startNewChat} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus size={14} /> New chat</button>
            <button type="button" onClick={clearCurrentChat} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </div>

      <PatriciaSystemStatusStrip />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-4 xl:grid-cols-[420px_1fr]">
        <aside className="min-h-0 overflow-y-auto">
          <ClaudeCommandPanel selectedCommand={selectedCommand} onSelect={useCommand} />
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-[1.7rem] border border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            <span className="truncate">Selected source: {activeCommand?.sourcePath || "none"}</span>
            <span className="shrink-0">{messages.length} messages</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {messages.length === 0 ? <EmptyState onSelect={useCommand} /> : <div className="space-y-6 pb-4">{messages.map((message) => <PatriciaChatMessageCard key={message.id} message={message} onUpdate={updateMessageContent} />)}{isSending && <div className="flex items-start gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"><Loader2 size={15} className="animate-spin" /></div><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"><p className="font-medium text-slate-700">Server runner is executing the selected workflow...</p><p className="mt-1 text-xs">{researchStage || "Preparing answer..."}</p></div></div>}<div ref={bottomRef} /></div>}
          </div>
          <div className="border-t border-slate-200 bg-white p-3">
            <PatriciaChatComposer input={input} setInput={setInput} selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} cases={cases} selectedCaseId={selectedCaseId} setSelectedCaseId={setSelectedCaseId} isSending={isSending} error={error} onSubmit={submitMessage} />
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (command: string, prompt: string) => void }) {
  return <div className="flex min-h-full flex-col items-center justify-center rounded-[1.4rem] bg-white px-6 py-10 text-center"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"><FileText size={24} className="text-slate-900" /></div><h2 className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900">Run legal work through Claude-for-legal.</h2><p className="mx-auto mb-8 max-w-2xl text-sm leading-6 text-slate-500">Patricia is now the server-backed product shell. The old Patricia legal logic is retired. Pick a workflow, attach facts or a document, then let the backend runner execute the selected Claude-for-legal source.</p><div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{QUICK_COMMANDS.map((command) => <SuggestionCard key={command.command} title={command.userButton} sub={command.shortDescription} onClick={() => onSelect(command.command, command.promptFrame)} />)}</div></div>;
}

function SuggestionCard({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"><h4 className="mb-1 text-[13px] font-medium text-slate-800">{title}</h4><p className="line-clamp-2 text-[12px] font-light text-slate-500">{sub}</p></button>;
}
