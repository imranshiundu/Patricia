"use client";

import { ArrowUp, FileText, Loader2, MessageSquare, Paperclip, Plus, Sparkles, Trash2 } from "lucide-react";
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

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  const selectedCaseText = useMemo(() => {
    const text = selectedCase?.fullText || selectedCase?.textPreview || "";
    return text.slice(0, MAX_CONTEXT_CHARS);
  }, [selectedCase]);

  function persistSession(nextMessages: PatriciaChatMessage[], title?: string) {
    const base = session || createChatSession(title || "New legal research chat");
    const updated = upsertChatSession({
      ...base,
      title: title || base.title,
      selectedCaseId,
      messages: nextMessages,
    });
    setSession(updated);
    return updated;
  }

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: PatriciaChatMessage = {
      id: makePatriciaId("user"),
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };

    const title = messages.length === 0 ? titleFromQuestion(question) : session?.title;
    const withUser = [...messages, userMessage];
    persistSession(withUser, title);
    setInput("");
    setError("");
    setIsSending(true);
    setResearchStage("Planning research...");

    try {
      setResearchStage("Checking local case context and East African legal sources...");
      const response = await fetch("/api/patricia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          caseText: selectedCaseText,
          caseTitle: selectedCase?.title || "",
          citation: selectedCase?.citation || "",
          previousMessages: withUser.slice(-8),
        }),
      });

      setResearchStage("Studying sources and preparing a professional answer...");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Patricia could not answer right now.");
      }

      const assistantMessage: PatriciaChatMessage = {
        id: makePatriciaId("assistant"),
        role: "assistant",
        content: data.content || "I could not produce an answer from the available context.",
        createdAt: new Date().toISOString(),
        sources: data.sources || [],
      };

      persistSession([...withUser, assistantMessage], title);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Patricia could not answer right now.";
      setError(message);
      persistSession([
        ...withUser,
        {
          id: makePatriciaId("assistant-error"),
          role: "assistant",
          content: `I could not complete that request. ${message}`,
          createdAt: new Date().toISOString(),
        },
      ], title);
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
    <div className="relative flex h-[calc(100vh-32px)] min-h-[720px] flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current chat</p>
            <h1 className="truncate text-lg font-bold text-slate-900">{session?.title || "New legal research chat"}</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <Plus size={14} /> New chat
            </button>
            <button
              type="button"
              onClick={clearCurrentChat}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              <Trash2 size={14} /> Delete chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50/40 px-4 py-5">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                <Sparkles size={28} className="text-slate-900" />
              </div>
              <h2 className="mb-3 text-4xl font-bold leading-tight tracking-tight text-slate-900">Chat with Patricia</h2>
              <p className="mx-auto mb-8 max-w-2xl text-slate-500">
                Ask a legal question. Patricia will first check local case text, then search trusted East African legal sources when needed.
              </p>
              <div className="grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
                <SuggestionCard title="Research a case" sub="Find sources before answering" onClick={() => usePrompt("Research this case carefully and tell me what is verified, what is only a lead, and what still needs checking: ")} />
                <SuggestionCard title="Summarise selected case" sub="Facts, issues, holding, orders" onClick={() => usePrompt("Summarise the selected case into facts, issues, holding, reasoning, orders, and verification gaps.")} />
                <SuggestionCard title="Explain for students" sub="Plain English legal brief" onClick={() => usePrompt("Explain this legal issue for a law student in clear, simple language, with sources and verification notes.")} />
                <SuggestionCard title="Audio script" sub="Readable narration chunks" onClick={() => usePrompt("Prepare a professional audio narration script from the selected case, divided into short sections.")} />
              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isSending && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Loader2 size={15} className="animate-spin" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <p className="font-semibold text-slate-700">Patricia is researching...</p>
                    <p className="mt-1 text-xs">{researchStage || "Preparing answer..."}</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-shrink-0 px-4 pb-6 pt-3">
        <form onSubmit={submitMessage} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
            <MessageSquare size={14} />
            <span>Context:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(event) => setSelectedCaseId(event.target.value)}
                className="max-w-[420px] truncate rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none"
              >
                <option value="">general legal research</option>
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400">general legal research; no saved case selected</span>
            )}
            {selectedCaseText && <span className="ml-auto hidden text-slate-400 sm:inline">{selectedCaseText.length.toLocaleString()} chars ready</span>}
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              rows={1}
              placeholder="Message Patricia..."
              className="max-h-40 min-h-[54px] flex-1 resize-none bg-transparent px-4 py-4 text-base outline-none placeholder:text-slate-400"
            />
            <Link href="/documents" className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Add case">
              <Paperclip size={18} />
            </Link>
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between px-4 pb-2 text-[11px] font-medium text-slate-400">
            <Link href="/documents" className="flex items-center gap-1 hover:text-slate-700"><FileText size={13} /> Add case text</Link>
            <span>{error || "Legal answers should be verified against original judgments and statutes."}</span>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: PatriciaChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><Sparkles size={15} /></div>}
      <article className={`max-w-[min(850px,86%)] whitespace-pre-wrap rounded-2xl px-5 py-4 text-sm leading-7 shadow-sm ${isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
        {message.content}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Sources returned</p>
            <div className="space-y-1">
              {message.sources.slice(0, 6).map((source, index) => (
                <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer" className="block truncate text-xs font-medium text-blue-600 hover:text-blue-800">
                  {index + 1}. {source.title} — {source.sourceName || source.authority || "source"}
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function SuggestionCard({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]">
      <h4 className="mb-1 text-[13px] font-bold text-slate-800 transition-colors">{title}</h4>
      <p className="truncate text-[12px] text-slate-500">{sub}</p>
    </button>
  );
}
