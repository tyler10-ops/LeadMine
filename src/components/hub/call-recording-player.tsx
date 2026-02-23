"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2 } from "lucide-react";

interface CallRecordingPlayerProps {
  duration: number; // seconds
  recordingUrl?: string | null;
}

export function CallRecordingPlayer({ duration, recordingUrl }: CallRecordingPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  // Mock waveform bars
  const bars = 40;
  const waveform = Array.from({ length: bars }, (_, i) => {
    const x = i / bars;
    return 0.2 + 0.8 * Math.abs(Math.sin(x * Math.PI * 3 + i * 0.3)) * (0.4 + 0.6 * Math.random());
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleBarClick = (index: number) => {
    setPosition((index / bars) * 100);
  };

  return (
    <div className="bg-[#0d0d0d] border border-neutral-800/30 rounded-lg p-4">
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={() => setPlaying(!playing)}
          className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
        >
          {playing ? (
            <Pause className="w-3.5 h-3.5 text-neutral-300" />
          ) : (
            <Play className="w-3.5 h-3.5 text-neutral-300 ml-0.5" />
          )}
        </button>

        {/* Waveform */}
        <div className="flex-1 flex items-end gap-px h-8">
          {waveform.map((height, i) => {
            const percent = (i / bars) * 100;
            const isPast = percent <= position;
            return (
              <button
                key={i}
                onClick={() => handleBarClick(i)}
                className={cn(
                  "flex-1 rounded-full transition-colors cursor-pointer hover:opacity-80",
                  isPast ? "bg-blue-500" : "bg-neutral-700"
                )}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono">
            {formatTime((position / 100) * duration)} / {formatTime(duration)}
          </span>
          <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
        </div>
      </div>

      {!recordingUrl && (
        <p className="text-[10px] text-neutral-700 mt-2 text-center">
          Mock player — real recordings will be available with Twilio integration
        </p>
      )}
    </div>
  );
}
