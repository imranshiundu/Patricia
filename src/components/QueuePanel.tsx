"use client";

import { Clock, ListChecks, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clearPatriciaQueue, getPatriciaQueue, PatriciaQueueJob } from "@/lib/patricia-queue";

const statusClasses: Record<string, string> = {
  queued: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  paused: "bg-amber-100 text-amber-700",
};

export function QueuePanel() {
  const [jobs, setJobs] = useState<PatriciaQueueJob[]>([]);

  useEffect(() => {
    const syncQueue = () => setJobs(getPatriciaQueue());
    syncQueue();
    window.addEventListener("patricia:queue-updated", syncQueue);
    window.addEventListener("storage", syncQueue);
    return () => {
      window.removeEventListener("patricia:queue-updated", syncQueue);
      window.removeEventListener("storage", syncQueue);
    };
  }, []);

  const grouped = useMemo(() => {
    return jobs.reduce<Record<string, PatriciaQueueJob[]>>((accumulator, job) => {
      accumulator[job.caseTitle] ||= [];
      accumulator[job.caseTitle].push(job);
      return accumulator;
    }, {});
  }, [jobs]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
            <ListChecks className="text-blue-500" /> Patricia Queue
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Long judgments and many uploaded cases should be handled as small queued jobs, not one huge API request.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearPatriciaQueue();
            setJobs([]);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        >
          <Trash2 size={15} /> Clear queue
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm leading-relaxed text-slate-500 shadow-sm">
          No jobs queued yet. Add a case and queue it for summary/audio preparation. This page is the foundation for safe long-case processing.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([caseTitle, caseJobs]) => (
            <div key={caseTitle} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <h2 className="font-bold text-slate-900">{caseTitle}</h2>
                <p className="text-xs text-slate-500">{caseJobs.length} queued chunk{caseJobs.length === 1 ? "" : "s"}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {caseJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-4 text-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{job.chunkTitle}</p>
                      <p className="text-xs text-slate-500">{job.kind} • approx. {job.estimatedMinutes || 1} min narration</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusClasses[job.status] || statusClasses.queued}`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
