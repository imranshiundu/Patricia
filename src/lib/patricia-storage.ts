export type PatriciaAudioChunk = {
  id: string;
  caseId: string;
  index: number;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
  createdAt: string;
};

export type PatriciaCaseRecord = {
  id: string;
  title: string;
  citation?: string;
  area?: string;
  sourceType: "paste" | "file" | "url";
  textPreview: string;
  fullText?: string;
  summary?: string;
  audioUrl?: string;
  durationSeconds?: number;
  chunks?: PatriciaAudioChunk[];
  createdAt: string;
  updatedAt: string;
};

const CASES_KEY = "patricia:cases";
const AUDIO_KEY = "patricia:audio-chunks";
const MAX_CASES = 50;
const MAX_AUDIO_CHUNKS = 100;
const MAX_LOCAL_CASE_TEXT_CHARS = 250_000;

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getPatriciaCases(): PatriciaCaseRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePatriciaCase(record: PatriciaCaseRecord) {
  if (typeof window === "undefined") return false;

  const normalized: PatriciaCaseRecord = {
    ...record,
    textPreview: record.textPreview.slice(0, 1500),
    fullText: record.fullText?.slice(0, MAX_LOCAL_CASE_TEXT_CHARS),
  };

  const records = getPatriciaCases();
  const next = [normalized, ...records.filter((item) => item.id !== normalized.id)].slice(0, MAX_CASES);
  const saved = safeLocalStorageSet(CASES_KEY, JSON.stringify(next));

  if (saved) {
    window.dispatchEvent(new CustomEvent("patricia:cases-updated", { detail: normalized }));
  }

  return saved;
}

export function getPatriciaAudioChunks(): PatriciaAudioChunk[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(AUDIO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePatriciaAudioChunk(chunk: PatriciaAudioChunk) {
  if (typeof window === "undefined") return false;

  const chunks = getPatriciaAudioChunks();
  const next = [chunk, ...chunks.filter((item) => item.id !== chunk.id)].slice(0, MAX_AUDIO_CHUNKS);
  const saved = safeLocalStorageSet(AUDIO_KEY, JSON.stringify(next));

  if (saved) {
    window.dispatchEvent(new CustomEvent("patricia:audio-updated", { detail: chunk }));
  }

  return saved;
}

export function clearPatriciaChat() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("patricia:chat");
  window.dispatchEvent(new Event("patricia:chat-cleared"));
}

export function revokeObjectUrl(url?: string) {
  if (!url || typeof URL === "undefined") return;
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
