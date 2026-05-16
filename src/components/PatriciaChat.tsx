"use client";

import { FileText, Loader2, Plus, Server, Trash2, Settings, AlertTriangle, PanelRight } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PatriciaChatComposer } from "@/components/patricia/chat-composer";
import { PatriciaChatMessageCard } from "@/components/patricia/chat-message";
import { BrainCommandPanel } from "@/components/patricia/brain-command-panel";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";
import { PATRICIA_LEGAL_COMMANDS } from "@/lib/patricia-skills/registry";
import { cleanVisibleAnswer } from "@/lib/patricia-output";
import { createChatSession, deleteChatSession, getOrCreateActiveSession, makePatriciaId, PatriciaChatMessage, PatriciaChatSession, titleFromQuestion, upsertChatSession } from "@/lib/patricia-chat-sessions";

const MAX_CONTEXT_CHARS = 400000;
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
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
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

  useEffect(() => {
    fetch("/api/patricia/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setIsConfigured(Boolean(data?.ai?.providers?.groq || data?.ai?.providers?.openai || data?.ai?.providers?.anthropic || data?.ai?.apiKeyConfigured)))
      .catch(() => setIsConfigured(false));
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

  function clearCurrentChat() { if (!session) return; deleteChatSession(session.id); setSession(createChatSession()); setError(""); }
  function startNewChat() { setSession(createChatSession()); setInput(""); setError(""); }

  function handleCommandSelect(command: string) {
    setSelectedCommand(command);
    if (window.innerWidth < 1024) setShowContextPanel(false);
  }

  return (
    <div className="flex h-full min-h-0 bg-background overflow-hidden">
      <main className="mx-auto flex w-full max-w-4xl min-h-0 flex-1 flex-col overflow-hidden px-4 sm:px-6">
        
        {/* Simplified Header */}
        <div className="flex shrink-0 items-center justify-between py-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{session?.title || "New workflow"}</h1>
            <p className="mt-1 flex items-center gap-2 text-xs text-foreground-muted">
              <Server size={12} className="text-accent" /> Server-backed session
            </p>
          </div>
          
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={startNewChat} className="flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-panel px-4 text-xs font-medium text-foreground transition-colors hover:bg-panel-elevated"><Plus size={14} /> <span className="hidden sm:inline">New Chat</span></button>
            <button type="button" onClick={clearCurrentChat} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel text-foreground-muted transition-colors hover:bg-panel-elevated hover:text-foreground"><Trash2 size={14} /></button>
            <button type="button" onClick={() => setShowContextPanel(!showContextPanel)} className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors ${showContextPanel ? 'bg-foreground text-background' : 'bg-panel text-foreground-muted hover:bg-panel-elevated hover:text-foreground'}`}><PanelRight size={14} /></button>
          </div>
        </div>

        {/* Persistent Warning Banner */}
        {isConfigured === false && (
          <div className="shrink-0 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <AlertTriangle size={16} className="shrink-0" />
              <span>No server LLM provider configured. Patricia cannot run workflows.</span>
            </div>
            <Link href="/settings" className="shrink-0 text-sm font-semibold text-red-500 hover:text-red-600 transition flex items-center gap-1">
              Configure now <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-1 py-4">
          {messages.length === 0 ? (
            <EmptyState isConfigured={isConfigured} />
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((message) => <PatriciaChatMessageCard key={message.id} message={message} onUpdate={updateMessageContent} />)}
              {isSending && (
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
                    <Loader2 size={15} className="animate-spin" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">Patricia is executing workflow...</p>
                    <p className="text-xs text-foreground-muted">{researchStage || "Preparing response..."}</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 pb-6 pt-2">
          <PatriciaChatComposer 
            input={input} 
            setInput={setInput} 
            selectedCommand={selectedCommand} 
            setSelectedCommand={setSelectedCommand} 
            cases={cases} 
            selectedCaseId={selectedCaseId} 
            setSelectedCaseId={setSelectedCaseId} 
            isSending={isSending} 
            error={error} 
            onSubmit={submitMessage} 
          />
        </div>
      </main>

      {showContextPanel && (
        <aside className="w-80 shrink-0 border-l border-border bg-background p-4 flex flex-col min-h-0 hidden lg:flex">
          <BrainCommandPanel selectedCommand={selectedCommand} onSelect={handleCommandSelect} />
        </aside>
      )}
    </div>
  );
}

function EmptyState({ isConfigured }: { isConfigured: boolean | null }) {
  if (isConfigured === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-red-500 shadow-sm border border-red-500/20">
          <AlertTriangle size={24} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">LLM Not Configured</h2>
        <p className="max-w-md text-sm text-foreground-muted leading-relaxed mb-6">
          Patricia needs an active LLM provider to execute legal workflows. 
          Configure your server API keys in the environment to get started.
        </p>
        <Link href="/settings" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-md transition hover:opacity-90">
          <Settings size={16} /> Check System Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-foreground-muted shadow-sm border border-border">
        <FileText size={24} />
      </div>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">Patricia AI Assistant</h2>
      <p className="max-w-md text-sm text-foreground-muted leading-relaxed">
        Ask Patricia anything or provide a document. Patricia automatically routes your query and can assist with legal tasks, data analysis, accounting, or studying.
      </p>
    </div>
  );
}
