"use client";

import { Play, Pause, SkipBack, SkipForward, Volume2, List } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AudioTrack = {
  id?: string;
  title?: string;
  citation?: string;
  area?: string;
  audioUrl?: string;
  durationSeconds?: number;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function AudioPlayer({ track }: { track?: AudioTrack }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track?.durationSeconds ?? 0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(track?.durationSeconds ?? 0);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [track?.id, track?.audioUrl, track?.durationSeconds]);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const togglePlayback = async () => {
    if (!audioRef.current || !track?.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration || 0, audioRef.current.currentTime + seconds));
  };

  const title = track?.title || "No case audio loaded";
  const subtitle = track?.citation || track?.area || "Upload a real case and generate audio";

  return (
    <div className="bg-slate-900 rounded-[24px] p-5 mb-5 overflow-hidden relative group">
      <audio
        ref={audioRef}
        src={track?.audioUrl}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || track?.durationSeconds || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[60px] opacity-25 group-hover:opacity-35 transition-opacity" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-600 rounded-full blur-[50px] opacity-15" />

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
          <p className="text-[13px] font-bold text-white truncate leading-tight">{title}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide truncate">{subtitle}</p>
        </div>
      </div>

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
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => seekBy(-15)} className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all" aria-label="Back 15 seconds">
            <SkipBack size={16} fill="currentColor" />
          </button>
          <button
            onClick={togglePlayback}
            disabled={!track?.audioUrl}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg mx-1 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying
              ? <Pause size={18} className="text-slate-900 fill-current" />
              : <Play size={18} className="text-slate-900 fill-current ml-0.5" />
            }
          </button>
          <button onClick={() => seekBy(15)} className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all" aria-label="Forward 15 seconds">
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all" aria-label="Volume">
            <Volume2 size={15} />
          </button>
          <button className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center justify-center transition-all" aria-label="Audio queue">
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
