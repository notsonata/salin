"use client";

import type { TranscriptSegment } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TranscriptPanel({
  activeSegmentId,
  canSeek,
  filteredSegments,
  matchCount,
  onExport,
  onQueryChange,
  onSeek,
  query,
}: {
  activeSegmentId: string | null;
  canSeek: boolean;
  filteredSegments: TranscriptSegment[];
  matchCount: number;
  onExport: () => void;
  onQueryChange: (value: string) => void;
  onSeek: (segment: TranscriptSegment) => void;
  query: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 border-b border-line px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
              Transcript
            </h2>
            <Badge>{matchCount} visible</Badge>
          </div>
          <p className="text-sm leading-6 text-muted">
            Search the transcript, then jump into the recording from any timestamp.
            Speaker labels are estimated and can be corrected in a later milestone.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="h-10 min-w-[16rem] rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
            id="transcript-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search transcript"
            value={query}
          />
          <Button type="button" variant="secondary" onClick={onExport}>
            Export transcript TXT
          </Button>
        </div>
      </div>

      {filteredSegments.length ? (
        <div className="divide-y divide-line">
          {filteredSegments.map((segment) => {
            const isActive = activeSegmentId === segment.id;
            return (
              <article
                className={cn(
                  "grid gap-4 px-5 py-4 transition-colors sm:grid-cols-[6.5rem_minmax(0,1fr)]",
                  isActive ? "bg-[#f3ede2]" : "bg-panel",
                )}
                key={segment.id}
              >
                <div className="grid content-start gap-2">
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
                      canSeek
                        ? "border-line bg-[#faf5eb] text-ink hover:bg-[#efe7d8]"
                        : "border-line bg-[#f3eee5] text-muted",
                      isActive ? "border-accent bg-accent text-panel hover:bg-[#254b44]" : "",
                    )}
                    disabled={!canSeek}
                    type="button"
                    onClick={() => onSeek(segment)}
                  >
                    {formatTimestamp(segment.start_ms)}
                  </button>
                  <span className="text-xs text-muted">
                    {canSeek ? "Jump to audio" : "Audio unavailable"}
                  </span>
                </div>

                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {segment.speaker_label}
                    </span>
                    <span className="text-xs text-muted">{segment.source_provider}</span>
                    {isActive ? <Badge className="bg-accentSoft text-ink">Active</Badge> : null}
                  </div>
                  <p className="text-[15px] leading-7 text-ink">{segment.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-8">
          <p className="text-sm font-medium text-ink">No transcript matches</p>
          <p className="mt-2 text-sm text-muted">
            Try a different speaker label, phrase, or spelling.
          </p>
        </div>
      )}
    </Card>
  );
}
