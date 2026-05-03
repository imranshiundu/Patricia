import {
  MessageSquare,
  Sparkles,
  Paperclip as FileUploadIcon,
  ArrowUp as ArrowUpIcon
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full pb-32">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-slate-900" />
          </div>
          <h1 className="text-4xl leading-tight font-bold text-slate-900 mb-3 tracking-tight">
            How can Patricia help with your case law today?
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Add real judgment text, ask questions, then turn the useful parts into chunked audio notes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[640px] px-4">
          <SuggestionCard title="Summarize a ruling" sub="Paste real judgment text first" />
          <SuggestionCard title="Question a case" sub="Ask from the provided record only" />
          <SuggestionCard title="Prepare audio notes" sub="Chunk long judgments safely" />
          <SuggestionCard title="Build your library" sub="Save cases in this browser" />
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center px-8 z-20">
        <div className="w-full max-w-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl border border-slate-200 p-2 flex items-end">
          <div className="relative flex-1">
            <div className="px-4 py-3 min-h-[50px] flex items-center w-full focus-within:ring-0">
              <input
                type="text"
                placeholder="Ask Patricia after saving a real case..."
                className="w-full text-base outline-none bg-transparent placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-3">
                <Link href="/documents" className="flex items-center gap-2 hover:text-slate-800 transition-colors px-2 py-1 rounded hover:bg-slate-100">
                  <FileUploadIcon size={16} /> <span className="hidden sm:inline">Upload or paste case</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300">real input only</span>
                <Link href="/documents" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 text-white transition-transform active:scale-95 shadow-md" aria-label="Add case">
                   <ArrowUpIcon size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-[11px] text-slate-400 font-medium">Patricia may be wrong. Always verify against the original judgment and applicable law.</span>
      </div>
    </>
  );
}

function SuggestionCard({ title, sub }: { title: string, sub: string }) {
  return (
    <div className="border border-slate-200 bg-white p-4 rounded-2xl cursor-default hover:bg-slate-50 transition-colors active:scale-[0.99] text-left group">
      <h4 className="text-[13px] font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-[12px] text-slate-500 truncate">{sub}</p>
    </div>
  );
}
