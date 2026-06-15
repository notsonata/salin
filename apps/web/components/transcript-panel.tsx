"use client";

import { type FormEvent, useEffect, useState } from "react";

import type { TranscriptSegment } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExportLinks, type ExportLinkItem } from "@/components/export-links";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TranscriptPanel({
  activeSegmentId,
  canSeek,
  exportLinks,
  filteredSegments,
  matchCount,
  onQueryChange,
  onRenameSpeaker,
  onSeek,
  onUpdateSegmentSpeaker,
  query,
  speakerLabels,
  speakerMessage,
  speakerSavingTarget,
}: {
  activeSegmentId: string | null;
  canSeek: boolean;
  exportLinks: ExportLinkItem[];
  filteredSegments: TranscriptSegment[];
  matchCount: number;
  speakerLabels: string[];
  speakerMessage: string | null;
  speakerSavingTarget: string | null;
  onQueryChange: (value: string) => void;
  onRenameSpeaker: (fromLabel: string, toLabel: string) => Promise<void>;
  onSeek: (segment: TranscriptSegment) => void;
  onUpdateSegmentSpeaker: (segmentId: string, speakerLabel: string) => Promise<void>;
  query: string;
}) {
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [segmentDrafts, setSegmentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!speakerLabels.length) {
      setRenameFrom("");
      return;
    }

    setRenameFrom((current) =>
      current && speakerLabels.includes(current) ? current : speakerLabels[0],
    );
  }, [speakerLabels]);

  useEffect(() => {
    setSegmentDrafts((current) => {
      const nextDrafts = { ...current };
      for (const segment of filteredSegments) {
        nextDrafts[segment.id] = segment.speaker_label;
      }
      return nextDrafts;
    });
  }, [filteredSegments]);

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLabel = renameTo.trim();
    if (!renameFrom || !nextLabel || nextLabel === renameFrom) {
      return;
    }

    void onRenameSpeaker(renameFrom, nextLabel).then(() => setRenameTo(""));
  }

  function handleSegmentSubmit(
    event: FormEvent<HTMLFormElement>,
    segment: TranscriptSegment,
  ) {
    event.preventDefault();
    const nextLabel = (segmentDrafts[segment.id] ?? "").trim();
    if (!nextLabel || nextLabel === segment.speaker_label) {
      return;
    }

    void onUpdateSegmentSpeaker(segment.id, nextLabel);
  }

  const speakerBusy = speakerSavingTarget !== null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 border-b border-line px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-lg tracking-[-0.04em] text-ink">
              Transcript
            </h2>
            <Badge>{matchCount} visible</Badge>
          </div>
          <p className="text-sm leading-6 text-muted">
            Search the transcript, then jump into the recording from any timestamp.
            Speaker labels are automatically estimated and can be edited.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <input
            className="h-10 min-w-[16rem] rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
            id="transcript-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search transcript"
            value={query}
          />
          <ExportLinks items={exportLinks} label="Exports" />
        </div>
      </div>

      {speakerLabels.length ? (
        <form
          className="grid gap-3 border-b border-line bg-[#fbf8f3] px-5 py-4 lg:grid-cols-[minmax(11rem,14rem)_minmax(12rem,1fr)_auto] lg:items-end"
          onSubmit={handleRenameSubmit}
        >
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted" htmlFor="speaker-rename-from">
              Speaker to rename
            </label>
            <select
              className="h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink"
              disabled={speakerBusy}
              id="speaker-rename-from"
              value={renameFrom}
              onChange={(event) => setRenameFrom(event.target.value)}
            >
              {speakerLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted" htmlFor="speaker-rename-to">
              Corrected speaker name
            </label>
            <input
              className="h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink"
              disabled={speakerBusy}
              id="speaker-rename-to"
              maxLength={255}
              placeholder="Teacher, Student, Interviewer"
              value={renameTo}
              onChange={(event) => setRenameTo(event.target.value)}
            />
          </div>
          <div className="lg:self-end">
            <Button
              disabled={
                speakerBusy || !renameFrom || !renameTo.trim() || renameTo.trim() === renameFrom
              }
              type="submit"
              variant="secondary"
            >
              {speakerSavingTarget === "rename" ? "Saving..." : "Rename speaker"}
            </Button>
          </div>
          {speakerMessage ? (
            <p className="text-sm font-medium text-accent lg:col-span-3">{speakerMessage}</p>
          ) : null}
        </form>
      ) : null}

      {filteredSegments.length ? (
        <div className="divide-y divide-line">
          {filteredSegments.map((segment) => {
            const isActive = activeSegmentId === segment.id;
            const draftLabel = segmentDrafts[segment.id] ?? segment.speaker_label;
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
                    <Badge className={segment.speaker_estimated ? "" : "bg-accentSoft text-ink"}>
                      {segment.speaker_estimated ? "Estimated" : "Edited"}
                    </Badge>
                    <span className="text-xs text-muted">{segment.source_provider}</span>
                    {isActive ? <Badge className="bg-accentSoft text-ink">Active</Badge> : null}
                  </div>
                  <form
                    className="grid gap-2 sm:max-w-xl sm:grid-cols-[minmax(10rem,1fr)_auto] sm:items-end"
                    onSubmit={(event) => handleSegmentSubmit(event, segment)}
                  >
                    <label className="grid gap-1.5 text-xs font-medium text-muted">
                      <span>Speaker label for {formatTimestamp(segment.start_ms)}</span>
                      <input
                        className="h-10 rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
                        disabled={speakerBusy}
                        maxLength={255}
                        value={draftLabel}
                        onChange={(event) =>
                          setSegmentDrafts((current) => ({
                            ...current,
                            [segment.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <Button
                      className="sm:mb-0"
                      disabled={
                        speakerBusy ||
                        !draftLabel.trim() ||
                        draftLabel.trim() === segment.speaker_label
                      }
                      type="submit"
                      variant="ghost"
                    >
                      {speakerSavingTarget === segment.id ? "Saving..." : "Apply speaker"}
                    </Button>
                  </form>
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
