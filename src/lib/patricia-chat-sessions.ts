export type PatriciaChatRole = "user" | "assistant" | "system";

export type PatriciaChatMessage = {
  id: string;
  role: PatriciaChatRole;
  content: string;
  createdAt: string;
  sources?: Array<{
    title: string;
    url: string;
    authority?: string;
    sourceName?: string;
  }>;
};

export type PatriciaChatSession = {
  id: string;
  title: string;
  messages: PatriciaChatMessage[];
  selectedCaseId?: string;
  createdAt: string;
  updatedAt: string;
};

const SESSIONS_KEY = "patricia:chat-sessions";
const ACTIVE_SESSION_KEY = "patricia:active-chat-session";
const MAX_SESSIONS = 30;
const MAX_MESSAGES_PER_SESSION = 120;

export function makePatriciaId(prefix = "patricia") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getChatSessions(): PatriciaChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatSessions(sessions: PatriciaChatSession[]) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
    window.dispatchEvent(new CustomEvent("patricia:chat-sessions-updated"));
    return true;
  } catch {
    return false;
  }
}

export function getActiveChatSessionId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACTIVE_SESSION_KEY) || "";
}

export function setActiveChatSessionId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_SESSION_KEY, id);
  window.dispatchEvent(new CustomEvent("patricia:active-chat-session-updated", { detail: id }));
}

export function createChatSession(title = "New legal research chat") {
  const now = new Date().toISOString();
  const session: PatriciaChatSession = {
    id: makePatriciaId("chat"),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const sessions = [session, ...getChatSessions()].slice(0, MAX_SESSIONS);
  saveChatSessions(sessions);
  setActiveChatSessionId(session.id);
  return session;
}

export function getOrCreateActiveSession() {
  const sessions = getChatSessions();
  const activeId = getActiveChatSessionId();
  const active = sessions.find((session) => session.id === activeId) || sessions[0];
  if (active) {
    setActiveChatSessionId(active.id);
    return active;
  }
  return createChatSession();
}

export function upsertChatSession(session: PatriciaChatSession) {
  const normalized: PatriciaChatSession = {
    ...session,
    messages: session.messages.slice(-MAX_MESSAGES_PER_SESSION),
    updatedAt: new Date().toISOString(),
  };
  const sessions = [normalized, ...getChatSessions().filter((item) => item.id !== normalized.id)].slice(0, MAX_SESSIONS);
  saveChatSessions(sessions);
  setActiveChatSessionId(normalized.id);
  return normalized;
}

export function deleteChatSession(id: string) {
  const next = getChatSessions().filter((session) => session.id !== id);
  saveChatSessions(next);
  if (getActiveChatSessionId() === id) {
    if (next[0]) setActiveChatSessionId(next[0].id);
    else window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
  return next;
}

export function titleFromQuestion(question: string) {
  const clean = question.replace(/\s+/g, " ").trim();
  if (!clean) return "New legal research chat";
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}
