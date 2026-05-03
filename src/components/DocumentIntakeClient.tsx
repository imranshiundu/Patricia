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
      setStatus("Paste real judgment text or upload a readable text/markdown file first.");
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
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
              <FileText className="text-blue-500" />
              Add a real case
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Paste judgment text or upload a readable `.txt` / `.md` file. PDF extraction is intentionally not shown here until the parser is implemented.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Input mode</p>
            <p className="text-sm font-bold text-slate-900">Paste / text file only</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
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
              placeholder="Paste the real judgment, ruling, statute extract, or case law text here..."
              className="min-h-[430px] w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                <input className="hidden" type="file" accept=".txt,.md,.csv" onChange={(event) => readFile(event.target.files?.[0])} />
                <ArrowUp size={16} />
                Upload readable text
              </label>

              <button
                onClick={saveCase}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
              >
                <Save size={16} />
                Save and queue case
              </button>
            </div>

            {status && <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{status}</p>}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
              <h2 className="mb-3 font-bold">Processing estimate</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p><span className="font-bold text-white">{wordCount}</span> words</p>
                <p><span className="font-bold text-white">{chunks.length}</span> AI chunk{chunks.length === 1 ? "" : "s"}</p>
                <p><span className="font-bold text-white">~{estimatedMinutes}</span> narration minute{estimatedMinutes === 1 ? "" : "s"}</p>
                <p className="leading-relaxed">Long judgments are broken into chunks so Patricia can work safely with small Groq models and browser storage.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500 shadow-sm">
              <h3 className="mb-2 font-bold text-slate-900">What is real here</h3>
              <p>Saved cases are stored in this browser using localStorage. Queue jobs are created immediately from the saved text. Nothing is shown as uploaded unless your browser actually stored it.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
