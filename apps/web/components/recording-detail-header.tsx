import Link from "next/link";

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
    case "completed":
      return "Transcript ready";
    case "failed":
      return "Processing failed";
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
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <Link
            className="inline-flex w-fit text-sm font-medium text-muted underline decoration-line underline-offset-4 hover:text-ink"
            href="/"
          >
            Back to dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-2xl tracking-[-0.05em] text-ink">
              {data.recording.filename}
            </h2>
            <Badge className="bg-[#ebe2d3] text-ink">{stageCopy(data.job.stage)}</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Transcript review and notes work now live inside one recording detail
            page, with the dashboard still one step away.
          </p>
        </div>

        {data.job.stage === "failed" && data.job.retryable ? (
          <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
            {retrying ? "Retrying..." : "Retry processing"}
          </Button>
        ) : null}
      </div>

      <dl className="grid gap-3 rounded-lg border border-line bg-[#faf6ee] px-4 py-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-1">
          <dt className="text-muted">Language</dt>
          <dd className="font-medium text-ink">{data.recording.language}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted">Mode</dt>
          <dd className="font-medium text-ink">{data.recording.processing_mode}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted">Size</dt>
          <dd className="font-medium text-ink">{formatBytes(data.recording.file_size)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted">Provider</dt>
          <dd className="font-medium text-ink">{data.job.last_provider ?? "pending"}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-muted">Notes</dt>
          <dd className="font-medium text-ink">{data.notes.status}</dd>
        </div>
      </dl>
    </Card>
  );
}
