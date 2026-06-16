"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioVisualizer({
  audioRef,
  url,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  url: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeUrl, setActiveUrl] = useState(url);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const currentBase = activeUrl.split("?")[0];
    const newBase = url.split("?")[0];
    if (currentBase !== newBase) {
      setActiveUrl(url);
    }
  }, [url, activeUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(activeUrl)}`;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "oklch(0.7 0.1 250)",
      progressColor: "oklch(0.5 0.2 250)",
      cursorColor: "oklch(0.3 0.2 250)",
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 48,
      normalize: true,
      url: proxyUrl,
    });

    wavesurferRef.current = ws;

    // Bind the generated audio element to the parent's ref for seeking support
    if (audioRef) {
      (audioRef as any).current = ws.getMediaElement();
    }

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));
    ws.on("ready", (dur) => setDuration(dur));
    
    // Fallback if ready doesn't fire but decode does
    ws.on("decode", (dur) => {
      if (dur) setDuration(dur);
    });

    ws.on("error", (err) => {
      console.error("WaveSurfer error:", err);
    });

    return () => {
      ws.destroy();
    };
  }, [activeUrl, audioRef]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-4 rounded-xl border border-line/80 bg-canvas px-4 py-3 shadow-sm">
      <Button
        variant="secondary"
        size="icon"
        onClick={togglePlay}
        className="h-10 w-10 shrink-0 rounded-full"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="w-full" />
      </div>
      <div className="shrink-0 font-mono text-sm text-muted">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
