const TEMP_IMPORTS_KEY = "patricia:temp-imports";
const AUDIO_CHUNKS_KEY = "patricia:audio-chunks";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type PatriciaTemporaryRecord = {
  id: string;
  title: string;
  kind: "import" | "audio" | "pdf";
  createdAt: string;
  expiresAt: string;
  sizeBytes?: number;
  url?: string;
};

function readRecords(key: string): PatriciaTemporaryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(key: string, records: PatriciaTemporaryRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(records));
}

export function rememberTemporaryImport(record: Omit<PatriciaTemporaryRecord, "expiresAt"> & { expiresAt?: string }) {
  const expiresAt = record.expiresAt || new Date(Date.now() + ONE_DAY_MS).toISOString();
  const next = [{ ...record, expiresAt }, ...readRecords(TEMP_IMPORTS_KEY).filter((item) => item.id !== record.id)];
  writeRecords(TEMP_IMPORTS_KEY, next);
}

export function rememberAudioChunk(record: Omit<PatriciaTemporaryRecord, "kind" | "expiresAt"> & { expiresAt?: string }) {
  const expiresAt = record.expiresAt || new Date(Date.now() + ONE_DAY_MS).toISOString();
  const next = [{ ...record, kind: "audio" as const, expiresAt }, ...readRecords(AUDIO_CHUNKS_KEY).filter((item) => item.id !== record.id)];
  writeRecords(AUDIO_CHUNKS_KEY, next);
}

export function cleanupExpiredPatriciaRecords() {
  if (typeof window === "undefined") return { importsRemoved: 0, audioRemoved: 0 };
  const now = Date.now();
  const imports = readRecords(TEMP_IMPORTS_KEY);
  const audio = readRecords(AUDIO_CHUNKS_KEY);
  const keepImports = imports.filter((item) => new Date(item.expiresAt).getTime() > now);
  const keepAudio = audio.filter((item) => new Date(item.expiresAt).getTime() > now);

  writeRecords(TEMP_IMPORTS_KEY, keepImports);
  writeRecords(AUDIO_CHUNKS_KEY, keepAudio);

  return {
    importsRemoved: imports.length - keepImports.length,
    audioRemoved: audio.length - keepAudio.length,
  };
}

export function getPatriciaStoragePressure() {
  if (typeof window === "undefined" || !("storage" in navigator) || !navigator.storage.estimate) {
    return Promise.resolve({ usage: 0, quota: 0, percent: 0 });
  }
  return navigator.storage.estimate().then((estimate) => {
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return { usage, quota, percent: quota ? Math.round((usage / quota) * 100) : 0 };
  });
}
