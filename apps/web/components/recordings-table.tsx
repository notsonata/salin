"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  WarningCircle,
  FileText,
  CircleNotch,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";

import type { RecordingListItemSummary } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function stageCopy(stage: RecordingListItemSummary["job"]["stage"]) {
  switch (stage) {
    case "uploaded":
      return "Queued";
    case "preprocessing":
      return "Preprocessing";
    case "transcribing":
      return "Transcribing";
    case "diarizing":
      return "Estimating speakers";
    case "completed":
      return "Transcript ready";
    case "failed":
      return "Failed";
  }
}

function stageTone(stage: RecordingListItemSummary["job"]["stage"]) {
  switch (stage) {
    case "completed":
      return "review";
    case "failed":
      return "danger";
    case "uploaded":
      return "attention";
    case "preprocessing":
      return "attention";
    case "transcribing":
      return "review";
    case "diarizing":
      return "accent";
  }
}

function notesTone(status: RecordingListItemSummary["notes"]["status"]) {
  switch (status) {
    case "completed":
      return "accent";
    case "failed":
      return "danger";
    case "queued":
    case "generating":
      return "attention";
    case "idle":
      return "quiet";
  }
}

function formatUpdatedAt(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function speakerCountCopy(count: RecordingListItemSummary["recording"]["speaker_count"]) {
  switch (count) {
    case "auto":
      return "Auto";
    case "5_plus":
      return "5+";
    default:
      return count;
  }
}

export function RecordingsTable({
  deleteError,
  deletingRecordingId,
  error,
  loading,
  onDeleteRecording,
  rows,
}: {
  deleteError?: string | null;
  deletingRecordingId?: string | null;
  error: string | null;
  loading: boolean;
  onDeleteRecording?: (recordingId: string, filename: string) => void;
  rows: RecordingListItemSummary[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearchQuery) {
      return rows;
    }

    return rows.filter((row) => {
      const searchableText = [
        row.recording.filename,
        row.recording.language,
        row.recording.processing_mode,
        speakerCountCopy(row.recording.speaker_count),
        stageCopy(row.job.stage),
        row.notes.status === "completed" ? "Ready" : row.notes.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, rows]);

  return (
    <section className="grid gap-4" id="recent-sessions">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="font-serif text-4xl text-ink">
            Library
          </h2>
        </div>

      </div>

      <Card className="overflow-hidden" data-testid="recordings-library">
        <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-ink">View all your sessions at a glance.</p>
            <p className="text-sm leading-6 text-muted">
              Easily track the status of your past, ongoing, and failed uploads in one place.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Search sessions"
              className="pl-9"
              disabled={loading || Boolean(error) || rows.length === 0}
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
        {deleteError ? (
          <div className="flex items-start gap-2 border-b border-danger/20 bg-danger/5 px-5 py-3">
            <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 text-danger" />
            <div className="grid gap-1">
              <p className="text-sm font-medium text-ink">Could not delete recording.</p>
              <p className="text-sm leading-6 text-muted">{deleteError}</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-review" />
            <p className="text-sm font-medium text-ink">Loading recent recordings...</p>
          </div>
        ) : error ? (
          <div className="grid gap-4 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <WarningCircle weight="bold" className="h-4 w-4 text-danger" />
                <p className="text-sm font-medium text-ink">Backend is offline.</p>
              </div>
              <p className="text-sm leading-6 text-muted">
                Open the preview workspace to inspect the rebuilt shell while the API is
                unavailable.
              </p>
              <p className="text-xs text-muted">{error}</p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/preview/recording">
                Preview workspace
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : rows.length && filteredRows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Speakers</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const isDeleting = deletingRecordingId === row.recording.id;

                  return (
                    <TableRow key={row.recording.id}>
                      <TableCell className="min-w-[20rem]">
                        <div className="grid gap-1">
                          <p className="font-medium text-ink">{row.recording.filename}</p>
                          <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.18em] text-muted">
                            {row.recording.processing_mode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted">{row.recording.language}</TableCell>
                      <TableCell>
                        <Badge tone={stageTone(row.job.stage)}>
                          {stageCopy(row.job.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={notesTone(row.notes.status)}>
                          {row.notes.status === "completed" ? "Ready" : row.notes.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted">
                        {speakerCountCopy(row.recording.speaker_count)}
                      </TableCell>
                      <TableCell className="text-muted">
                        <time dateTime={row.recording.updated_at}>
                          {formatUpdatedAt(row.recording.updated_at)}
                        </time>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/workspace/${row.recording.id}`}>
                              <FileText weight="bold" className="h-4 w-4" />
                              Open
                            </Link>
                          </Button>
                          <Button
                            aria-label={`Delete ${row.recording.filename}`}
                            className="text-danger hover:border-danger/30 hover:bg-danger/10"
                            disabled={isDeleting || !onDeleteRecording}
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              onDeleteRecording?.(
                                row.recording.id,
                                row.recording.filename,
                              )
                            }
                          >
                            {isDeleting ? (
                              <CircleNotch
                                weight="bold"
                                className="h-4 w-4 animate-spin"
                              />
                            ) : (
                              <Trash weight="bold" className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : rows.length ? (
          <div className="grid gap-2 px-5 py-6">
            <p className="text-sm font-medium text-ink">
              No recordings match your search.
            </p>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Try a filename, language, processing mode, notes state, or stage.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium text-ink">No recordings yet.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Your completed, in-flight, and failed work appears here after the first
                upload.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/preview/recording">
                Preview workspace
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
