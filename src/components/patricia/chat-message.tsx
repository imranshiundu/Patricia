"use client";

import { Check, Copy, Edit3, Share2, Sparkles } from "lucide-react";
import { ReactNode, useState } from "react";
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
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
          <Sparkles size={15} />
        </div>
      )}

      <article className={`max-w-[min(900px,88%)] rounded-2xl px-5 py-4 text-[15px] font-light leading-7 shadow-sm ${isUser ? "bg-accent text-accent-foreground" : "border border-border bg-panel text-foreground"}`}>
        {!isUser && message.skill && <SkillMeta message={message} />}

        {isEditing ? (
          <div className="space-y-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[160px] w-full resize-y rounded-xl border border-border bg-panel-elevated p-3 text-sm leading-6 text-foreground outline-none focus:ring-1 focus:ring-foreground" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-panel-elevated">Cancel</button>
              <button type="button" onClick={saveEdit} className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90">Save</button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{cleanVisibleAnswer(message.content)}</div>
        )}

        {!isUser && Boolean(message.skill?.missingInputs?.length) && (
          <div className="mt-3 rounded-xl border border-border bg-panel-elevated p-3 text-xs text-foreground-muted">
            <strong className="text-foreground">Missing inputs:</strong> {message.skill?.missingInputs?.join(", ")}
          </div>
        )}

        {!isUser && Boolean(message.sources?.length) && (
          <div className="mt-3 rounded-xl border border-border bg-panel-elevated p-3 text-xs text-foreground-muted">
            <strong className="text-foreground">Sources:</strong> {message.sources?.map((source) => source.title).join("; ")}
          </div>
        )}

        <div className={`mt-3 flex items-center gap-1 border-t pt-2 ${isUser ? "border-accent-foreground/10" : "border-border"}`}>
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
    <div className="mb-3 flex flex-wrap gap-2 border-b border-border pb-3 text-[11px] font-medium text-foreground-muted">
      {message.skill?.command && <span className="rounded-full border border-border bg-panel-elevated px-2 py-1">{message.skill.command}</span>}
      {message.skill?.confidence && <span className="rounded-full border border-border bg-panel-elevated px-2 py-1">confidence: {message.skill.confidence}</span>}
      {typeof message.skill?.trustScore === "number" && <span className="rounded-full border border-border bg-panel-elevated px-2 py-1">trust: {message.skill.trustScore}</span>}
      {message.skill?.releaseSafe === false && <span className="rounded-full bg-red-950 px-2 py-1 text-red-200 border border-red-900">review required</span>}
    </div>
  );
}

function ActionButton({ children, isUser, onClick }: { children: ReactNode; isUser: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${isUser ? "text-accent-foreground/70 hover:bg-accent-foreground/10 hover:text-accent-foreground" : "text-foreground-muted hover:bg-panel-elevated hover:text-foreground"}`}>
      {children}
    </button>
  );
}
