import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  FileAudio,
  NotebookPen,
  RefreshCw,
} from "lucide-react";

import type { RecordingDetailResponse } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";

function stageCopy(stage: RecordingDetailResponse["job"]["stage"]) {
  switch (stage) {
    case "uploaded":
      return "Queued for processing";
    case "preprocessing":
      return "Normalizing audio";
    case "transcribing":
      return "Building timestamped transcript";
    case "diarizing":
      return "Transcript ready, estimating speakers";
    case "completed":
      return "Transcript ready";
    case "failed":
      return "Processing failed";
  }
}

function stageClass(stage: RecordingDetailResponse["job"]["stage"]) {
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

function notesClass(status: RecordingDetailResponse["notes"]["status"]) {
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

export function RecordingDetailHeader({
  data,
  retrying,
  onRetry,
}: {
  data: RecordingDetailResponse;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid gap-3">
          <Link
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-accentSoft bg-accentFaint px-3 text-sm font-medium text-accent transition-colors hover:bg-accentSoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 text-muted" />
            Back to dashboard
          </Link>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <FileAudio aria-hidden="true" className="h-5 w-5 text-review" />
              <h2 className="max-w-4xl break-words text-2xl font-semibold text-ink">
                {data.recording.filename}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={stageClass(data.job.stage)}>
                {stageCopy(data.job.stage)}
              </Badge>
              <Badge className={notesClass(data.notes.status)}>
                <NotebookPen aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                Notes {data.notes.status}
              </Badge>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Transcript review stays available as soon as transcript blocks exist.
            Speaker labels are automatically estimated and can be edited.
          </p>
        </div>

        {data.job.stage === "failed" && data.job.retryable ? (
          <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {retrying ? "Retrying..." : "Retry processing"}
          </Button>
        ) : null}
      </div>

      {data.job.stage !== "failed" && data.job.error_message ? (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-md border border-attentionSoft bg-attentionFaint px-4 py-3 text-sm leading-6 text-muted">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-attention" />
          <p>
            <span className="font-medium text-ink">Processing note: </span>
            {data.job.error_message}
          </p>
        </div>
      ) : null}

      <dl className="grid gap-0 border-t border-line bg-field text-sm sm:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-1 border-b border-line bg-accentFaint px-5 py-3 sm:border-r xl:border-b-0">
          <dt className="font-mono text-[11px] uppercase text-muted">
            Language
          </dt>
          <dd className="font-medium text-ink">{data.recording.language}</dd>
        </div>
        <div className="grid gap-1 border-b border-line bg-reviewFaint px-5 py-3 xl:border-b-0 xl:border-r">
          <dt className="font-mono text-[11px] uppercase text-muted">
            Mode
          </dt>
          <dd className="font-medium text-ink">{data.recording.processing_mode}</dd>
        </div>
        <div className="grid gap-1 border-b border-line bg-notesFaint px-5 py-3 sm:border-r xl:border-b-0">
          <dt className="font-mono text-[11px] uppercase text-muted">
            Size
          </dt>
          <dd className="font-medium text-ink">{formatBytes(data.recording.file_size)}</dd>
        </div>
        <div className="grid gap-1 border-b border-line bg-attentionFaint px-5 py-3 xl:border-b-0 xl:border-r">
          <dt className="font-mono text-[11px] uppercase text-muted">
            Provider
          </dt>
          <dd className="font-medium text-ink">{data.job.last_provider ?? "pending"}</dd>
        </div>
        <div className="grid gap-1 bg-panel px-5 py-3">
          <dt className="font-mono text-[11px] uppercase text-muted">
            Stage
          </dt>
          <dd className="font-medium text-ink">{data.job.stage}</dd>
        </div>
      </dl>
    </Card>
  );
}
