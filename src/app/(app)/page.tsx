import {
  MessageSquare,
  Sparkles,
  Paperclip as FileUploadIcon,
  ArrowUp as ArrowUpIcon
} from "lucide-react";
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full pb-32">
        {/* Welcome Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} className="text-slate-900" />
          </div>
          <h1 className="text-4xl leading-tight font-bold text-slate-900 mb-3 tracking-tight">
            How can I help you research today?
          </h1>
        </div>

        {/* Empty State / Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[640px] px-4">
          <SuggestionCard title="Summarize a ruling" sub="E.g. Maina Kiai constitutional case" />
          <SuggestionCard title="Find precedents" sub="Cases regarding Finance Act 2023" />
          <SuggestionCard title="Analyze principles" sub="Explain the concept of physical space in BBI" />
          <SuggestionCard title="Upload a PDF" sub="Let Patricia extract the core rulings" />
        </div>
      </div>

      {/* Global Search Bar Anchored at Bottom */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center px-8 z-20">
        <div className="w-full max-w-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl border border-slate-200 p-2 flex items-end">
          <div className="relative flex-1">
            <div className="px-4 py-3 min-h-[50px] flex items-center w-full focus-within:ring-0">
              <input 
                type="text" 
                placeholder="Summarize the latest constitutional rulings on..." 
                className="w-full text-base outline-none bg-transparent placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 hover:text-slate-800 transition-colors px-2 py-1 rounded hover:bg-slate-100">
                  <FileUploadIcon size={16} /> <span className="hidden sm:inline">Upload Case PDF</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300">0 / 3,000</span>
                <button className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 text-white transition-transform active:scale-95 shadow-md">
                   <ArrowUpIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-[11px] text-slate-400 font-medium">Patricia may generate inaccurate information about case laws or facts. Model: Patricia AI v1.3</span>
      </div>
    </>
  );
}

// Subcomponents
function SuggestionCard({ title, sub }: { title: string, sub: string }) {
  return (
    <div className="border border-slate-200 bg-white p-4 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors active:scale-[0.99] text-left group">
      <h4 className="text-[13px] font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-[12px] text-slate-500 truncate">{sub}</p>
    </div>
  );
}
