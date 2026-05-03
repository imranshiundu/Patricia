"use client";

import { ArrowUp, FileText, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { extractCaseTitle, makeCaseId, splitForGroq } from "@/lib/patricia-processing";
import { savePatriciaCase, PatriciaCaseRecord } from "@/lib/patricia-storage";
import { enqueueCaseSummary } from "@/lib/patricia-queue";

export function DocumentIntakeClient() {
  const [caseText, setCaseText] = useState("");
  const [title, setTitle] = useState("");
  const [citation, setCitation] = useState("");
  const [status, setStatus] = useState("");

  const chunks = useMemo(() => splitForGroq(caseText), [caseText]);
  const estimatedMinutes = chunks.reduce((total, chunk) => total + chunk.estimatedMinutes, 0);
  const wordCount = useMemo(() => caseText.trim().split(/\s+/).filter(Boolean).length, [caseText]);

  const saveCase = () => {
    const cleanText = caseText.trim();
    if (!cleanText) {
      setStatus("Paste or upload real case text first.");
      return;
    }

    const now = new Date().toISOString();
    const record: PatriciaCaseRecord = {
      id: makeCaseId(),
      title: title.trim() || extractCaseTitle(cleanText),
      citation: citation.trim() || undefined,
      sourceType: "paste",
      textPreview: cleanText.slice(0, 1500),
      fullText: cleanText,
      durationSeconds: estimatedMinutes * 60,
      createdAt: now,
      updatedAt: now,
    };

    const saved = savePatriciaCase(record);

    if (!saved) {
      setStatus("This browser could not save the case. The text may be too large for localStorage. Try a shorter extract first.");
      return;
    }

    const jobs = enqueueCaseSummary(record);
    setStatus(`Case saved locally and ${jobs.length} summary job${jobs.length === 1 ? "" : "s"} added to the queue.`);
    setCaseText("");
    setTitle("");
    setCitation("");
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setCaseText(text);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <FileText className="text-blue-500" />
          Add a real case
        </h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Paste judgment text or upload a plain text file. Patricia saves the record in this browser and queues it for safe chunk processing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Case title, optional"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={citation}
              onChange={(event) => setCitation(event.target.value)}
              placeholder="Citation, optional"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <textarea
            value={caseText}
            onChange={(event) => setCaseText(event.target.value)}
            placeholder="Paste the real judgment or case law text here..."
            className="min-h-[360px] w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <input className="hidden" type="file" accept=".txt,.md,.csv" onChange={(event) => readFile(event.target.files?.[0])} />
              <ArrowUp size={16} />
              Upload text file
            </label>

            <button
              onClick={saveCase}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <Save size={16} />
              Save and queue case
            </button>
          </div>

          {status && <p className="mt-4 text-sm font-medium text-blue-600">{status}</p>}
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-5 h-fit shadow-sm">
          <h2 className="font-bold mb-3">Processing estimate</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p><span className="text-white font-bold">{wordCount}</span> words</p>
            <p><span className="text-white font-bold">{chunks.length}</span> AI chunk{chunks.length === 1 ? "" : "s"}</p>
            <p><span className="text-white font-bold">~{estimatedMinutes}</span> narration minute{estimatedMinutes === 1 ? "" : "s"}</p>
            <p className="leading-relaxed">Long case laws should be processed in chunks. Do not send one or two hours of text/audio as a single API job.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
