"use client";

import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TranscriptPlayer({
  audioRef,
  filename,
  normalizedUrl,
  originalUrl,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  filename: string;
  normalizedUrl?: string;
  originalUrl?: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid gap-2">
          <h2 className="font-mono text-lg tracking-[-0.04em] text-ink">
            Audio review
          </h2>
          <p className="text-sm leading-6 text-muted">
            Playback uses the normalized review track so timestamp seeking stays
            consistent across the transcript.
          </p>
        </div>

        {originalUrl ? (
          <a
            className="inline-flex"
            href={originalUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Button type="button" variant="ghost">
              Open original upload
            </Button>
          </a>
        ) : null}
      </div>

      {normalizedUrl ? (
        <audio
          ref={audioRef as RefObject<HTMLAudioElement>}
          aria-label={`Normalized review audio for ${filename}`}
          className="w-full"
          controls
          preload="metadata"
          src={normalizedUrl}
        />
      ) : (
        <div className="rounded-md border border-dashed border-line bg-[#faf6ee] px-4 py-4">
          <p className="text-sm font-medium text-ink">Normalized audio unavailable.</p>
          <p className="mt-1 text-sm text-muted">
            The transcript is ready, but the review track has not been attached yet.
          </p>
        </div>
      )}
    </Card>
  );
}
