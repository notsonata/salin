"use client";

import { type FormEvent, useEffect, useState } from "react";
import { FileText, Pencil, Play, Save, Search, UserRound } from "lucide-react";

import type { TranscriptSegment } from "@salin/shared";

import { ExportLinks, type ExportTargetLinks } from "@/components/export-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TranscriptPanel({
  activeSegmentId,
  canSeek,
  exportTarget,
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
  exportTarget: ExportTargetLinks;
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
    <Card className="overflow-hidden border-reviewSoft p-0">
      <div className="grid gap-4 border-b border-reviewSoft bg-reviewFaint px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <FileText aria-hidden="true" className="h-4 w-4 text-review" />
            <h2 className="text-lg font-semibold text-ink">Transcript</h2>
            <Badge className="border-reviewSoft bg-panel text-review">{matchCount} visible</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Search the transcript, jump into the recording from any timestamp,
            and correct estimated speaker labels without leaving the review flow.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <label className="relative block min-w-0 sm:min-w-[17rem]" htmlFor="transcript-search">
            <span className="sr-only">Search transcript</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-review"
            />
            <input
              className="h-10 w-full rounded-md border border-reviewSoft bg-panel pl-9 pr-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review"
              id="transcript-search"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search transcript"
              value={query}
            />
          </label>
          <ExportLinks label="Exports" target={exportTarget} />
        </div>
      </div>

      {speakerLabels.length ? (
        <form
          className="grid gap-3 border-b border-accentSoft bg-accentFaint px-4 py-4 sm:px-5 lg:grid-cols-[minmax(10rem,14rem)_minmax(12rem,1fr)_auto] lg:items-end"
          onSubmit={handleRenameSubmit}
        >
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted" htmlFor="speaker-rename-from">
              Speaker to rename
            </label>
            <select
              className="h-10 rounded-md border border-accentSoft bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
              className="h-10 rounded-md border border-accentSoft bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
              <Pencil aria-hidden="true" className="h-4 w-4" />
              {speakerSavingTarget === "rename" ? "Saving..." : "Rename speaker"}
            </Button>
          </div>
          {speakerMessage ? (
            <p className="text-sm font-medium text-success lg:col-span-3">{speakerMessage}</p>
          ) : null}
        </form>
      ) : null}

      {filteredSegments.length ? (
        <div className="divide-y divide-line bg-panel">
          {filteredSegments.map((segment) => {
            const isActive = activeSegmentId === segment.id;
            const draftLabel = segmentDrafts[segment.id] ?? segment.speaker_label;
            return (
              <article
                className={cn(
                  "grid gap-4 border-l-4 px-4 py-4 transition-colors sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:px-5",
                  isActive
                    ? "border-review bg-reviewFaint"
                    : "border-transparent hover:bg-field",
                )}
                key={segment.id}
              >
                <div className="grid content-start gap-2">
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review",
                      canSeek
                        ? "border-reviewSoft bg-reviewFaint text-review hover:bg-reviewSoft"
                        : "border-line bg-field text-muted",
                      isActive ? "border-review bg-review text-panel hover:bg-[#285181]" : "",
                    )}
                    disabled={!canSeek}
                    type="button"
                    onClick={() => onSeek(segment)}
                  >
                    <Play aria-hidden="true" className="h-3.5 w-3.5" />
                    {formatTimestamp(segment.start_ms)}
                  </button>
                  <span className="text-xs text-muted">
                    {canSeek ? "Jump to audio" : "Audio unavailable"}
                  </span>
                </div>

                <div className="grid min-w-0 gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                      <UserRound aria-hidden="true" className="h-4 w-4 text-muted" />
                      {segment.speaker_label}
                    </span>
                    <Badge
                      className={
                        segment.speaker_estimated
                          ? "border-attentionSoft bg-attentionSoft text-attention"
                          : "border-accentSoft bg-accentSoft text-accent"
                      }
                    >
                      {segment.speaker_estimated ? "Estimated" : "Edited"}
                    </Badge>
                    <span className="font-mono text-[11px] uppercase text-muted">
                      {segment.source_provider}
                    </span>
                    {isActive ? (
                      <Badge className="border-reviewSoft bg-reviewSoft text-review">
                        Active
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-[15px] leading-7 text-ink">{segment.text}</p>

                  <form
                    className="grid gap-2 rounded-md border border-line bg-field p-3 sm:max-w-2xl sm:grid-cols-[minmax(10rem,1fr)_auto] sm:items-end"
                    onSubmit={(event) => handleSegmentSubmit(event, segment)}
                  >
                    <label className="grid gap-1.5 text-xs font-medium text-muted">
                      <span>Speaker label for {formatTimestamp(segment.start_ms)}</span>
                      <input
                        className="h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                      disabled={
                        speakerBusy ||
                        !draftLabel.trim() ||
                        draftLabel.trim() === segment.speaker_label
                      }
                      type="submit"
                      variant="ghost"
                    >
                      <Save aria-hidden="true" className="h-4 w-4" />
                      {speakerSavingTarget === segment.id ? "Saving..." : "Apply speaker"}
                    </Button>
                  </form>
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
