"use client";

import { ArrowUp, FileText, Loader2, MessageSquare, Paperclip, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getPatriciaCases, PatriciaCaseRecord } from "@/lib/patricia-storage";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const CHAT_KEY = "patricia:chat";

function makeId(prefix = "msg") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChat(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-80)));
}

export function PatriciaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [cases, setCases] = useState<PatriciaCaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(readChat());

    const syncCases = () => {
      const records = getPatriciaCases();
      setCases(records);
      setSelectedCaseId((current) => current || records[0]?.id || "");
    };

    syncCases();
    window.addEventListener("patricia:cases-updated", syncCases);
    window.addEventListener("storage", syncCases);

    return () => {
      window.removeEventListener("patricia:cases-updated", syncCases);
      window.removeEventListener("storage", syncCases);
    };
  }, []);

  useEffect(() => {
    saveChat(messages);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: makeId("user"),
      role: "user",
      content: question,
      createdAt: now,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/patricia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          caseText: selectedCase?.textPreview || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Patricia could not answer right now.");
      }

      const assistantMessage: ChatMessage = {
        id: makeId("assistant"),
        role: "assistant",
        content: data.content || "I could not produce an answer from the available context.",
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Patricia could not answer right now.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant-error"),
          role: "assistant",
          content: `I could not complete that request. ${message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function usePrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-180px)] flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-36 pt-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Sparkles size={28} className="text-slate-900" />
            </div>
            <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Chat with Patricia
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-slate-500">
              Ask a normal question. Patricia will answer directly, and when you save real case text, she can use that case as context.
            </p>

            <div className="grid w-full max-w-[680px] grid-cols-1 gap-3 sm:grid-cols-2">
              <SuggestionCard title="Summarise the selected case" sub="Facts, issues, holding, orders" onClick={() => usePrompt("Summarise the selected case into facts, issues, holding, reasoning, and orders.")} />
              <SuggestionCard title="Explain in plain English" sub="Make the legal principle simple" onClick={() => usePrompt("Explain the main legal principle in plain English.")} />
              <SuggestionCard title="Find weak points" sub="What needs verification?" onClick={() => usePrompt("What parts of this case need verification from the original judgment?")} />
              <SuggestionCard title="Prepare audio script" sub="For narration later" onClick={() => usePrompt("Create a clear audio narration script from the selected case summary.")} />
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isSending && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                  <Loader2 size={15} className="animate-spin" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Patricia is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={submitMessage} className="absolute bottom-10 left-0 right-0 z-20 flex justify-center px-8">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
            <MessageSquare size={14} />
            <span>Context:</span>
            {cases.length > 0 ? (
              <select
                value={selectedCaseId}
                onChange={(event) => setSelectedCaseId(event.target.value)}
                className="max-w-[420px] truncate rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none"
              >
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400">general chat; no saved case selected</span>
            )}
          </div>

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
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
                className="max-h-40 min-h-[54px] w-full resize-none bg-transparent px-4 py-4 text-base outline-none placeholder:text-slate-400"
              />
            </div>

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
            <Link href="/documents" className="flex items-center gap-1 hover:text-slate-700">
              <FileText size={13} /> Add case text
            </Link>
            <span>{error || "Patricia can answer generally, but legal answers are strongest with real case context."}</span>
          </div>
        </div>
      </form>

      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="text-[11px] font-medium text-slate-400">
          Patricia may be wrong. Always verify against the original judgment and applicable law.
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <Sparkles size={15} />
        </div>
      )}
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-slate-900 text-white"
            : "border border-slate-200 bg-white text-slate-700"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function SuggestionCard({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 active:scale-[0.99]"
    >
      <h4 className="mb-1 text-[13px] font-bold text-slate-800 transition-colors">{title}</h4>
      <p className="truncate text-[12px] text-slate-500">{sub}</p>
    </button>
  );
}
