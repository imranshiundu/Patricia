"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2, List } from "lucide-react";
import { useState } from "react";

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(32);

  return (
    <div className="bg-slate-900 rounded-[24px] p-5 mb-5 overflow-hidden relative group">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[60px] opacity-25 group-hover:opacity-35 transition-opacity" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-600 rounded-full blur-[50px] opacity-15" />

      {/* Track Info */}
      <div className="relative z-10 flex items-center gap-3 mb-5">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Play size={18} className="text-white fill-white ml-0.5" />
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white truncate leading-tight">Independent Electoral Commission</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Constitutional Law · 2017</p>
        </div>
      </div>

      {/* Progress */}
      <div className="relative z-10 mb-5">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2 cursor-pointer group/bar">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>14:32</span>
          <span>45:00</span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <SkipBack size={16} fill="currentColor" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg mx-1"
          >
            {isPlaying
              ? <Pause size={18} className="text-slate-900 fill-current" />
              : <Play size={18} className="text-slate-900 fill-current ml-0.5" />
            }
          </button>
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <Volume2 size={15} />
          </button>
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
