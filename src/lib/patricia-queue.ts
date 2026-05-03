import { splitForGroq } from "@/lib/patricia-processing";
import { PatriciaCaseRecord } from "@/lib/patricia-storage";

export type PatriciaJobKind = "summary" | "audio-script" | "audio";
export type PatriciaJobStatus = "queued" | "running" | "done" | "failed" | "paused";

export type PatriciaQueueJob = {
  id: string;
  caseId: string;
  caseTitle: string;
  kind: PatriciaJobKind;
  chunkIndex: number;
  chunkTitle: string;
  estimatedMinutes?: number;
  status: PatriciaJobStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const QUEUE_KEY = "patricia:queue";

function makeJobId(caseId: string, kind: PatriciaJobKind, chunkIndex: number) {
  return `${caseId}:${kind}:${chunkIndex}`;
}

export function getPatriciaQueue(): PatriciaQueueJob[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePatriciaQueue(jobs: PatriciaQueueJob[]) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs.slice(0, 300)));
    window.dispatchEvent(new CustomEvent("patricia:queue-updated", { detail: jobs }));
    return true;
  } catch {
    return false;
  }
}

export function enqueueCaseSummary(caseRecord: PatriciaCaseRecord) {
  const text = caseRecord.fullText || caseRecord.textPreview;
  const chunks = splitForGroq(text);
  const now = new Date().toISOString();
  const existing = getPatriciaQueue();

  const newJobs = chunks.map((chunk) => ({
    id: makeJobId(caseRecord.id, "summary", chunk.index),
    caseId: caseRecord.id,
    caseTitle: caseRecord.title,
    kind: "summary" as const,
    chunkIndex: chunk.index,
    chunkTitle: chunk.title,
    estimatedMinutes: chunk.estimatedMinutes,
    status: "queued" as const,
    createdAt: now,
    updatedAt: now,
  }));

  const merged = [
    ...existing.filter((job) => !newJobs.some((nextJob) => nextJob.id === job.id)),
    ...newJobs,
  ];

  savePatriciaQueue(merged);
  return newJobs;
}

export function updateQueueJob(jobId: string, patch: Partial<PatriciaQueueJob>) {
  const now = new Date().toISOString();
  const next = getPatriciaQueue().map((job) =>
    job.id === jobId ? { ...job, ...patch, updatedAt: now } : job
  );
  savePatriciaQueue(next);
  return next;
}

export function clearPatriciaQueue() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new Event("patricia:queue-updated"));
}
