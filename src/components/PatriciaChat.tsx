"use client";

import { ArrowUp, Check, Copy, Edit3, FileText, Loader2, MessageSquare, Paperclip, Plus, Share2, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";
import {
  createChatSession,
  deleteChatSession,
  getOrCreateActiveSession,
  makePatriciaId,
  PatriciaChatMessage,
  PatriciaChatSession,
  titleFromQuestion,
  upsertChatSession,
} from "@/lib/patricia-chat-sessions";

const MAX_CONTEXT_CHARS = 60_000;

function cleanVisibleAnswer(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^Sources returned[\s\S]*$/im, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function PatriciaChat() {
  const [session, setSession] = useState<PatriciaChatSession | null>(null);
  const [input, setInput] = useState("");
  const [cases, setCases] = useState<PatriciaCaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [researchStage, setResearchStage] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messages = session?.messages || [];

  useEffect(() => {
    const active = getOrCreateActiveSession();
    setSession(active);

    const syncCases = () => {
      const records = getPatriciaCases();
      setCases(records);
      setSelectedCaseId((current) => current || active.selectedCaseId || records[0]?.id || "");
    };

    const syncSession = () => setSession(getOrCreateActiveSession());

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedCaseId), [cases, selectedCaseId]);
  const selectedCaseText = useMemo(() => (selectedCase?.fullText || selectedCase?.textPreview || "").slice(0, MAX_CONTEXT_CHARS), [selectedCase]);

  function persistSession(nextMessages: PatriciaChatMessage[], title?: string) {
    const base = session || createChatSession(title || "New legal research chat");
    const updated = upsertChatSession({ ...base, title: title || base.title, selectedCaseId, messages: nextMessages });
    setSession(updated);
    return updated;
  }

  function updateMessageContent(id: string, content: string) {
    if (!session) return;
    const next = messages.map((message) => (message.id === id ? { ...message, content } : message));
    persistSession(next, session.title);
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
    setResearchStage("Planning research...");

    try {
      setResearchStage("Checking local case context and trusted legal sources...");
      const response = await fetch("/api/patricia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, caseText: selectedCaseText, caseTitle: selectedCase?.title || "", citation: selectedCase?.citation || "", previousMessages: withUser.slice(-8) }),
      });

      setResearchStage("Studying the material and verifying the answer...");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Patricia could not answer right now.");

      const assistantMessage: PatriciaChatMessage = {
        id: makePatriciaId("assistant"),
        role: "assistant",
        content: cleanVisibleAnswer(data.content || "I could not produce an answer from the available context."),
        createdAt: new Date().toISOString(),
        sources: data.sources || [],
      };

      persistSession([...withUser, assistantMessage], title);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Patricia could not answer right now.";
      setError(message);
      persistSession([...withUser, { id: makePatriciaId("assistant-error"), role: "assistant", content: `I could not complete that request. ${message}`, createdAt: new Date().toISOString() }], title);
    } finally {
      setIsSending(false);
      setResearchStage("");
    }
  }

  function usePrompt(prompt: string) {
    setInput(prompt);
  }

  function clearCurrentChat() {
    if (!session) return;
    deleteChatSession(session.id);
    const next = createChatSession();
    setSession(next);
    setError("");
  }

  function startNewChat() {
    const next = createChatSession();
    setSession(next);
    setInput("");
    setError("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 pt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Current chat</p>
            <h1 className="truncate text-lg font-semibold text-slate-900">{session?.title || "New legal research chat"}</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={startNewChat} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus size={14} /> New chat</button>
            <button type="button" onClick={clearCurrentChat} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"><Trash2 size={14} /> Delete chat</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-4">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"><Sparkles size={24} className="text-slate-900" /></div>
              <h2 className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900">Chat with Patricia</h2>
              <p className="mx-auto mb-8 max-w-2xl text-sm leading-6 text-slate-500">Ask a legal question. Patricia will think privately, verify what it can, then show only the clean answer.</p>
              <div className="grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
                <SuggestionCard title="Brief a case" sub="Facts, issues, holding, orders" onClick={() => usePrompt("Brief me on this case carefully. Only state verified facts. ")} />
                <SuggestionCard title="Research a case" sub="Find source before answering" onClick={() => usePrompt("Research this case carefully and tell me what is verified and what still needs checking: ")} />
                <SuggestionCard title="Explain for students" sub="Plain English legal brief" onClick={() => usePrompt("Explain this legal issue for a law student in clear, simple language.")} />
                <SuggestionCard title="Prepare notes" sub="Readable study notes" onClick={() => usePrompt("Prepare clean study notes from the selected case.")} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((message) => <MessageBubble key={message.id} message={message} onUpdate={updateMessageContent} />)}
              {isSending && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"><Loader2 size={15} className="animate-spin" /></div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <p className="font-medium text-slate-700">Patricia is researching and verifying...</p>
                    <p className="mt-1 text-xs">{researchStage || "Preparing answer..."}</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-shrink-0 px-4 pb-5 pt-2">
        <form onSubmit={submitMessage} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
            <MessageSquare size={14} />
            <span>Context:</span>
            {cases.length > 0 ? (
              <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="max-w-[420px] truncate rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none">
                <option value="">general legal research</option>
                {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            ) : <span className="text-slate-400">general legal research; no saved case selected</span>}
            {selectedCaseText && <span className="ml-auto hidden text-slate-400 sm:inline">{selectedCaseText.length.toLocaleString()} chars ready</span>}
          </div>

          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage(); } }} rows={1} placeholder="Message Patricia..." className="max-h-40 min-h-[54px] flex-1 resize-none bg-transparent px-4 py-4 text-base font-light outline-none placeholder:text-slate-400" />
            <Link href="/documents" className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Add case"><Paperclip size={18} /></Link>
            <button type="submit" disabled={!input.trim() || isSending} className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">{isSending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}</button>
          </div>

          <div className="flex items-center justify-between px-4 pb-2 text-[11px] font-light text-slate-400">
            <Link href="/documents" className="flex items-center gap-1 hover:text-slate-700"><FileText size={13} /> Add case text</Link>
            <span>{error || "Verified answers only. Patricia’s reasoning stays in the background."}</span>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message, onUpdate }: { message: PatriciaChatMessage; onUpdate: (id: string, content: string) => void }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  async function copyText() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function shareText() {
    if (navigator.share) {
      await navigator.share({ title: "Patricia legal answer", text: message.content });
    } else {
      await copyText();
    }
  }

  function saveEdit() {
    onUpdate(message.id, draft.trim() || message.content);
    setIsEditing(false);
  }

  return (
    <div className={`group flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><Sparkles size={15} /></div>}
      <article className={`max-w-[min(860px,88%)] rounded-2xl px-5 py-4 text-[15px] font-light leading-7 shadow-sm ${isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
        {isEditing ? (
          <div className="space-y-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[160px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900" />
            <div className="flex justify-end gap-2"><button onClick={() => setIsEditing(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">Cancel</button><button onClick={saveEdit} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">Save</button></div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{cleanVisibleAnswer(message.content)}</div>
        )}
        <div className={`mt-3 flex items-center gap-1 border-t pt-2 ${isUser ? "border-white/10" : "border-slate-100"}`}>
          <button type="button" onClick={copyText} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isUser ? "text-white/70 hover:bg-white/10" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}</button>
          <button type="button" onClick={() => setIsEditing(true)} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isUser ? "text-white/70 hover:bg-white/10" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}><Edit3 size={12} /> Edit</button>
          <button type="button" onClick={shareText} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isUser ? "text-white/70 hover:bg-white/10" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}><Share2 size={12} /> Share</button>
        </div>
      </article>
    </div>
  );
}

function SuggestionCard({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"><h4 className="mb-1 text-[13px] font-medium text-slate-800">{title}</h4><p className="truncate text-[12px] font-light text-slate-500">{sub}</p></button>;
}
