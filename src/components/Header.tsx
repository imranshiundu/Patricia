"use client";

import { Sparkles, Lock } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between py-4 min-h-[60px] w-full px-8 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-50 to-transparent">
      <div className="flex items-center text-sm font-medium text-slate-600 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 cursor-default shadow-sm hover:shadow transition-shadow">
        <Lock size={14} className="text-slate-400 mr-2" />
        patricia.io/dashboard
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.dispatchEvent(new Event('open-upgrade-modal'))}
          className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.1)] active:scale-95"
        >
          <Sparkles size={14} className="text-amber-300" />
          Upgrade
        </button>
        <div className="w-8 h-8 bg-blue-100 rounded-full relative ml-2 cursor-pointer shadow-sm hover:ring-2 hover:ring-blue-200 transition-all">
           <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    </header>
  );
}
