"use client";

import type { RefObject } from "react";
import { ArrowSquareOut, Headphones } from "@phosphor-icons/react";

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
    <Card className="grid gap-4 border-reviewSoft p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Headphones weight="bold" aria-hidden="true" className="h-4 w-4 text-review" />
            <h2 className="text-lg font-semibold text-ink">Audio review</h2>
          </div>
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
              <ArrowSquareOut weight="bold" aria-hidden="true" className="h-4 w-4" />
              Open original upload
            </Button>
          </a>
        ) : null}
      </div>

      {normalizedUrl ? (
        <div className="rounded-md border border-reviewSoft bg-reviewFaint px-3 py-3">
          <audio
            ref={audioRef as RefObject<HTMLAudioElement>}
            aria-label={`Normalized review audio for ${filename}`}
            className="w-full"
            controls
            preload="metadata"
            src={normalizedUrl}
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-reviewSoft bg-reviewFaint px-4 py-4">
          <p className="text-sm font-medium text-ink">Normalized audio unavailable.</p>
          <p className="mt-1 text-sm text-muted">
            The transcript is ready, but the review track has not been attached yet.
          </p>
        </div>
      )}
    </Card>
  );
}
