import Link from "next/link";
import {
  ArrowUpRight,
  CircleAlert,
  Clock3,
  FileText,
  History,
  Loader2,
} from "lucide-react";

import type { RecordingListItemSummary } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
      return "Ready";
    case "failed":
      return "Failed";
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

function statusClass(stage: RecordingListItemSummary["job"]["stage"]) {
  switch (stage) {
    case "completed":
      return "border-successSoft bg-successSoft text-success";
    case "failed":
      return "border-dangerSoft bg-dangerFaint text-danger";
    case "uploaded":
      return "border-attentionSoft bg-attentionSoft text-attention";
    case "preprocessing":
      return "border-accentSoft bg-accentFaint text-accent";
    case "transcribing":
      return "border-reviewSoft bg-reviewSoft text-review";
    case "diarizing":
      return "border-notesSoft bg-notesSoft text-notes";
  }
}

function notesStatusClass(status: RecordingListItemSummary["notes"]["status"]) {
  switch (status) {
    case "completed":
      return "border-notesSoft bg-notesSoft text-notes";
    case "failed":
      return "border-dangerSoft bg-dangerFaint text-danger";
    case "queued":
    case "generating":
      return "border-attentionSoft bg-attentionSoft text-attention";
    case "idle":
      return "border-line bg-field text-muted";
  }
}

function stageIcon(stage: RecordingListItemSummary["job"]["stage"]) {
  switch (stage) {
    case "completed":
      return <FileText aria-hidden="true" className="h-3.5 w-3.5" />;
    case "failed":
      return <CircleAlert aria-hidden="true" className="h-3.5 w-3.5" />;
    case "uploaded":
      return <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />;
    case "preprocessing":
    case "transcribing":
    case "diarizing":
      return <Loader2 aria-hidden="true" className="h-3.5 w-3.5" />;
  }
}

export function RecordingsTable({
  error,
  loading,
  rows,
}: {
  error: string | null;
  loading: boolean;
  rows: RecordingListItemSummary[];
}) {
  return (
    <section className="grid gap-3">
      <Card className="overflow-hidden border-reviewSoft p-0">
        <div className="grid gap-4 border-b border-reviewSoft bg-panel px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-reviewSoft text-review">
              <History aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="grid gap-1">
              <p className="font-mono text-[11px] uppercase text-review">
                Library
              </p>
              <h2 className="text-xl font-semibold text-ink">Recent recordings</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted">
                Reopen in-flight or completed work quickly from the same surface.
              </p>
            </div>
          </div>
          <div className="rounded-md border border-reviewSoft bg-reviewFaint px-3 py-2 text-xs leading-5 text-review">
            Transcript, notes, and export state stay attached to each recording.
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <Loader2 aria-hidden="true" className="h-4 w-4 text-review" />
            <p className="text-sm font-medium text-ink">Loading recent recordings...</p>
          </div>
        ) : error ? (
          <div className="grid gap-4 bg-dangerFaint px-5 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CircleAlert aria-hidden="true" className="h-4 w-4 text-danger" />
                <p className="text-sm font-medium text-ink">Backend is offline.</p>
              </div>
              <p className="text-sm leading-6 text-muted">
                Start the API to load real recordings, or open the UI preview to
                inspect the transcript and notes workspace.
              </p>
              <p className="text-xs text-muted">{error}</p>
            </div>
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-reviewSoft bg-panel px-3 text-sm font-medium text-review transition-colors hover:bg-reviewFaint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review"
              href="/preview/recording"
            >
              Preview workspace
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
            </Link>
          </div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-reviewFaint text-left">
                <tr className="border-b border-line font-mono text-[11px] uppercase text-muted">
                  <th className="px-5 py-3 font-medium">Filename</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">Language</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className="border-b border-line transition-colors last:border-b-0 hover:bg-reviewFaint"
                    key={row.recording.id}
                  >
                    <td className="max-w-[22rem] px-5 py-4">
                      <p className="truncate font-medium text-ink">
                        {row.recording.filename}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {row.recording.processing_mode}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={statusClass(row.job.stage)}>
                        <span className="mr-1.5 inline-flex">
                          {stageIcon(row.job.stage)}
                        </span>
                        {stageCopy(row.job.stage)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={notesStatusClass(row.notes.status)}>
                        {row.notes.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-muted">{row.recording.language}</td>
                    <td className="px-5 py-4 text-muted">
                      <time dateTime={row.recording.updated_at}>
                        {formatUpdatedAt(row.recording.updated_at)}
                      </time>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-reviewSoft bg-panel px-3 text-sm font-medium text-review transition-colors hover:bg-reviewFaint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review"
                        href={`/recordings/${row.recording.id}`}
                      >
                        Open
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 bg-reviewFaint px-5 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-panel text-review">
                <FileText aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
              <p className="text-sm font-medium text-ink">No recordings yet.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Your completed, in-flight, and failed recordings will appear
                here after the first upload.
              </p>
              </div>
            </div>
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-reviewSoft bg-panel px-3 text-sm font-medium text-review transition-colors hover:bg-reviewSoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review"
              href="/preview/recording"
            >
              Preview workspace
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
            </Link>
          </div>
        )}
      </Card>
    </section>
  );
}
