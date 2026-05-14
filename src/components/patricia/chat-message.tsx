"use client";

import { Check, Copy, Edit3, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PatriciaChatMessage } from "@/lib/patricia-chat-sessions";
import { cleanVisibleAnswer } from "@/lib/patricia-output";

export function PatriciaChatMessageCard({
  message,
  onUpdate,
}: {
  message: PatriciaChatMessage;
  onUpdate: (id: string, content: string) => void;
}) {
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
    if (navigator.share) await navigator.share({ title: "Patricia answer", text: message.content });
    else await copyText();
  }

  function saveEdit() {
    onUpdate(message.id, draft.trim() || message.content);
    setIsEditing(false);
  }

  return (
    <div className={`group flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <Sparkles size={15} />
        </div>
      )}

      <article className={`max-w-[min(900px,88%)] rounded-2xl px-5 py-4 text-[15px] font-light leading-7 shadow-sm ${isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
        {!isUser && message.skill && <SkillMeta message={message} />}

        {isEditing ? (
          <div className="space-y-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[160px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">Cancel</button>
              <button type="button" onClick={saveEdit} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">Save</button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{cleanVisibleAnswer(message.content)}</div>
        )}

        {!isUser && Boolean(message.skill?.missingInputs?.length) && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <strong>Missing inputs:</strong> {message.skill?.missingInputs?.join(", ")}
          </div>
        )}

        {!isUser && Boolean(message.sources?.length) && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <strong>Sources:</strong> {message.sources?.map((source) => source.title).join("; ")}
          </div>
        )}

        <div className={`mt-3 flex items-center gap-1 border-t pt-2 ${isUser ? "border-white/10" : "border-slate-100"}`}>
          <ActionButton isUser={isUser} onClick={copyText}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}</ActionButton>
          <ActionButton isUser={isUser} onClick={() => setIsEditing(true)}><Edit3 size={12} /> Edit</ActionButton>
          <ActionButton isUser={isUser} onClick={shareText}><Share2 size={12} /> Share</ActionButton>
        </div>
      </article>
    </div>
  );
}

function SkillMeta({ message }: { message: PatriciaChatMessage }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-100 pb-3 text-[11px] font-medium text-slate-500">
      {message.skill?.command && <span className="rounded-full bg-slate-50 px-2 py-1">{message.skill.command}</span>}
      {message.skill?.confidence && <span className="rounded-full bg-slate-50 px-2 py-1">confidence: {message.skill.confidence}</span>}
      {typeof message.skill?.trustScore === "number" && <span className="rounded-full bg-slate-50 px-2 py-1">trust: {message.skill.trustScore}</span>}
      {message.skill?.releaseSafe === false && <span className="rounded-full bg-slate-900 px-2 py-1 text-white">review required</span>}
    </div>
  );
}

function ActionButton({ children, isUser, onClick }: { children: React.ReactNode; isUser: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isUser ? "text-white/70 hover:bg-white/10" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}>
      {children}
    </button>
  );
}
