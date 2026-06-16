"use client";

import { type FormEvent, type RefObject, useEffect, useState } from "react";
import {
  AudioLines,
  ExternalLink,
  Pencil,
  Search,
  UserRound,
} from "lucide-react";

import type { TranscriptSegment } from "@salin/shared";

import { ExportLinks, type ExportLinkItem } from "@/components/export-links";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TranscriptPanel({
  activeSegmentId,
  audioRef,
  canSeek,
  exportLinks,
  filteredSegments,
  matchCount,
  normalizedUrl,
  onQueryChange,
  onRenameSpeaker,
  onSeek,
  onUpdateSegment,
  originalUrl,
  query,
  speakerLabels,
  speakerMessage,
  speakerSavingTarget,
}: {
  activeSegmentId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  canSeek: boolean;
  exportLinks: ExportLinkItem[];
  filteredSegments: TranscriptSegment[];
  matchCount: number;
  normalizedUrl?: string;
  originalUrl?: string;
  query: string;
  speakerLabels: string[];
  speakerMessage: string | null;
  speakerSavingTarget: string | null;
  onQueryChange: (value: string) => void;
  onRenameSpeaker: (fromLabel: string, toLabel: string) => Promise<void>;
  onSeek: (segment: TranscriptSegment) => void;
  onUpdateSegment: (segmentId: string, speakerLabel: string, text: string) => Promise<void>;
}) {
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [speakerDrafts, setSpeakerDrafts] = useState<Record<string, string>>({});
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(null);
  const [speakerToolsOpen, setSpeakerToolsOpen] = useState(false);

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
    setSpeakerDrafts((current) => {
      const nextDrafts = { ...current };
      for (const segment of filteredSegments) {
        nextDrafts[segment.id] = segment.speaker_label;
      }
      return nextDrafts;
    });
    setTextDrafts((current) => {
      const nextDrafts = { ...current };
      for (const segment of filteredSegments) {
        nextDrafts[segment.id] = segment.text;
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
    const nextSpeaker = (speakerDrafts[segment.id] ?? "").trim();
    const nextText = (textDrafts[segment.id] ?? "").trim();
    if (!nextSpeaker || !nextText || (nextSpeaker === segment.speaker_label && nextText === segment.text)) {
      return;
    }

    void onUpdateSegment(segment.id, nextSpeaker, nextText);
  }

  const speakerBusy = speakerSavingTarget !== null;

  return (
    <Card>
      <div
        className="border-b border-line/80 bg-panel"
        data-testid="transcript-toolbar"
      >
        <div className="grid gap-4 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <AudioLines className="h-4 w-4 text-review" />
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                  Transcript review
                </h2>
                <Badge tone="review">{matchCount} visible</Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Read first, skim by timestamp, then correct only the labels that need
                human cleanup.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {originalUrl ? (
                <Button asChild size="sm" variant="secondary">
                  <a href={originalUrl} rel="noreferrer" target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Original upload
                  </a>
                </Button>
              ) : null}
              <ExportLinks items={exportLinks} label="Export transcript" />
            </div>
          </div>

          <div className="grid gap-4">
            {normalizedUrl ? (
              <AudioVisualizer audioRef={audioRef} url={normalizedUrl} />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-canvas px-4 py-3 text-sm text-muted">
                Normalized review audio unavailable.
              </div>
            )}

            <div className="flex">
              <label className="relative block flex-1" htmlFor="transcript-search">
                <span className="sr-only">Search transcript</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="transcript-search"
                  className="pl-9"
                  placeholder="Search transcript"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-line/80 bg-canvas/70 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Speaker utility
            </p>
            <p className="text-sm leading-6 text-muted">
              Rename one label globally, then make compact row-level corrections where
              the estimate drifts.
            </p>
          </div>
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => setSpeakerToolsOpen((current) => !current)}
          >
            <Pencil className="h-4 w-4" />
            Rename speakers
          </Button>
        </div>

        {speakerToolsOpen && speakerLabels.length ? (
          <form
            className="mt-4 grid gap-3 rounded-xl border border-line/80 bg-panel px-4 py-4 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(14rem,1fr)_auto] lg:items-end"
            onSubmit={handleRenameSubmit}
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium text-ink">Speaker to rename</span>
              <Select
                value={renameFrom}
                onValueChange={(value) => setRenameFrom(value)}
              >
                <SelectTrigger aria-label="Speaker to rename">
                  <SelectValue placeholder="Speaker to rename" />
                </SelectTrigger>
                <SelectContent>
                  {speakerLabels.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2" htmlFor="speaker-rename-to">
              <span className="text-sm font-medium text-ink">Corrected speaker name</span>
              <Input
                disabled={speakerBusy}
                id="speaker-rename-to"
                maxLength={255}
                placeholder="Teacher, Interviewer, Resident"
                value={renameTo}
                onChange={(event) => setRenameTo(event.target.value)}
              />
            </label>

            <Button
              disabled={
                speakerBusy || !renameFrom || !renameTo.trim() || renameTo.trim() === renameFrom
              }
              type="submit"
              variant="accent"
            >
              {speakerSavingTarget === "rename" ? "Saving..." : "Rename speaker"}
            </Button>
          </form>
        ) : null}

        {speakerMessage ? (
          <p className="mt-3 text-sm font-medium text-success">{speakerMessage}</p>
        ) : null}
      </div>

      {filteredSegments.length ? (
        <TooltipProvider delayDuration={150}>
          <div>
            <div className="divide-y divide-line/80 bg-panel">
              {filteredSegments.map((segment) => {
                const isActive = activeSegmentId === segment.id;
                const draftSpeaker = speakerDrafts[segment.id] ?? segment.speaker_label;
                const draftText = textDrafts[segment.id] ?? segment.text;
                const timestamp = formatTimestamp(segment.start_ms);
                const expanded = expandedSegmentId === segment.id;

                return (
                  <article
                    className={cn(
                      "grid gap-4 px-4 py-4 transition-colors sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:px-5",
                      isActive ? "bg-reviewFaint" : "hover:bg-hover/50",
                    )}
                    key={segment.id}
                  >
                    <div className="grid content-start gap-2">
                      <button
                        aria-pressed={isActive}
                        className={cn(
                          "inline-flex h-11 items-center justify-center rounded-md border font-mono text-sm transition-colors",
                          canSeek
                            ? "border-reviewSoft bg-panel text-review hover:bg-reviewFaint"
                            : "border-line bg-field text-muted",
                          isActive && "border-review bg-review text-panel hover:bg-review",
                        )}
                        disabled={!canSeek}
                        type="button"
                        onClick={() => onSeek(segment)}
                      >
                        {timestamp}
                      </button>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        {formatTimestamp(segment.end_ms - segment.start_ms)} span
                      </span>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                          <UserRound className="h-4 w-4 text-muted" />
                          {segment.speaker_label}
                        </span>
                      </div>

                      <p className="max-w-[80ch] text-[15px] leading-7 text-ink">
                        {segment.text}
                      </p>

                      {expanded ? (
                        <form
                          className="grid gap-4 rounded-xl border border-line/80 bg-canvas px-4 py-4 sm:max-w-3xl"
                          onSubmit={(event) => handleSegmentSubmit(event, segment)}
                        >
                          <div className="grid gap-4">
                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-ink">
                                Speaker label for {timestamp}
                              </span>
                              <Input
                                aria-label={`Speaker label for ${timestamp}`}
                                disabled={speakerBusy}
                                maxLength={255}
                                value={draftSpeaker}
                                onChange={(event) =>
                                  setSpeakerDrafts((current) => ({
                                    ...current,
                                    [segment.id]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-ink">
                                Segment text
                              </span>
                              <Textarea
                                aria-label={`Segment text for ${timestamp}`}
                                className="min-h-[100px]"
                                disabled={speakerBusy}
                                value={draftText}
                                onChange={(event) =>
                                  setTextDrafts((current) => ({
                                    ...current,
                                    [segment.id]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              disabled={
                                speakerBusy ||
                                !draftSpeaker.trim() ||
                                !draftText.trim() ||
                                (draftSpeaker.trim() === segment.speaker_label && draftText.trim() === segment.text)
                              }
                              type="submit"
                              variant="secondary"
                            >
                              {speakerSavingTarget === segment.id ? "Saving..." : "Apply edits"}
                            </Button>
                          </div>
                        </form>
                      ) : null}
                    </div>

                    <div className="justify-self-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label={`Edit segment at ${timestamp}`}
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setExpandedSegmentId((current) =>
                                current === segment.id ? null : segment.id,
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit segment at {timestamp}</TooltipContent>
                      </Tooltip>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      ) : (
        <div className="px-5 py-8">
          <p className="text-sm font-medium text-ink">No transcript rows match the search.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Clear the search input to restore the full transcript.
          </p>
        </div>
      )}
    </Card>
  );
}
