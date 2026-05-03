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
  summary?: string;
  audioUrl?: string;
  durationSeconds?: number;
  chunks?: PatriciaAudioChunk[];
  createdAt: string;
  updatedAt: string;
};

const CASES_KEY = "patricia:cases";
const AUDIO_KEY = "patricia:audio-chunks";

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
  if (typeof window === "undefined") return;

  const records = getPatriciaCases();
  const next = [record, ...records.filter((item) => item.id !== record.id)].slice(0, 50);
  window.localStorage.setItem(CASES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("patricia:cases-updated", { detail: record }));
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
  if (typeof window === "undefined") return;

  const chunks = getPatriciaAudioChunks();
  const next = [chunk, ...chunks.filter((item) => item.id !== chunk.id)].slice(0, 100);
  window.localStorage.setItem(AUDIO_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("patricia:audio-updated", { detail: chunk }));
}

export function revokeObjectUrl(url?: string) {
  if (!url || typeof URL === "undefined") return;
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
