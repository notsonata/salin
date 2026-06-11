"use client";

import { useEffect, useState } from "react";
import { Clock3, RefreshCcw } from "lucide-react";

import type { JobStage, RecordingDetailResponse } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/api";
import { formatBytes, formatTimestamp } from "@/lib/format";

const apiClient = createBrowserClient();
const terminalStages: JobStage[] = ["completed", "failed"];

function stageCopy(stage: JobStage) {
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

export function RecordingWorkspace({
  initialData,
  recordingId,
}: {
  initialData?: RecordingDetailResponse | null;
  recordingId: string;
}) {
  const [data, setData] = useState<RecordingDetailResponse | null>(initialData ?? null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stage = data?.job.stage;

  useEffect(() => {
    let intervalId: number | undefined;
    async function refresh() {
      try {
        const nextData = await apiClient.getRecording(recordingId);
        setData(nextData);
      } catch (pollError) {
        setError(
          pollError instanceof Error ? pollError.message : "Could not refresh status.",
        );
      }
    }

    void refresh();

    if (!stage || !terminalStages.includes(stage)) {
      intervalId = window.setInterval(() => {
        void refresh();
      }, 2000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [recordingId, stage]);

  if (!data) {
    return (
      <Card className="p-5">
        <p className="font-medium text-ink">
          {error ? "Could not load recording" : "Loading recording workspace"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {error ?? "Fetching the latest job state and transcript data."}
        </p>
      </Card>
    );
  }

  async function retryJob() {
    if (!data) {
      return;
    }

    setRetrying(true);
    setError(null);
    try {
      const response = await apiClient.retryRecording(data.recording.id);
      setData((current) => (current ? { ...current, job: response.job } : current));
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : "Retry failed.",
      );
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="grid gap-4">
        <Card className="flex items-center justify-between gap-4 p-4">
          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-ink">
                {data.recording.filename}
              </h2>
              <Badge>{stageCopy(data.job.stage)}</Badge>
            </div>
            <p className="text-sm text-muted">
              Transcript-first workspace. Timestamp seeking, notes generation,
              and speaker edits land in later milestones.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock3 className="h-4 w-4" />
            <span>{data.transcript_segments.length} segments</span>
          </div>
        </Card>

        {error ? (
          <Card className="border-[#d8b3ab] bg-[#f7ebe8] p-4 text-sm text-danger">
            {error}
          </Card>
        ) : null}

        {data.job.stage !== "completed" ? (
          <Card className="grid gap-3 p-5">
            <p className="font-medium text-ink">{stageCopy(data.job.stage)}</p>
            <p className="text-sm text-muted">
              The page polls every two seconds until the recording reaches a
              terminal state.
            </p>
            {data.job.stage === "failed" && data.job.error_message ? (
              <p className="text-sm text-danger">{data.job.error_message}</p>
            ) : null}
            {data.job.stage === "failed" && data.job.retryable ? (
              <div>
                <Button
                  className="gap-2"
                  disabled={retrying}
                  variant="secondary"
                  onClick={retryJob}
                >
                  <RefreshCcw className="h-4 w-4" />
                  {retrying ? "Retrying..." : "Retry processing"}
                </Button>
              </div>
            ) : null}
          </Card>
        ) : (
          <div className="grid gap-3">
            {data.transcript_segments.map((segment) => (
              <Card
                className="grid gap-3 p-4 sm:grid-cols-[7rem_minmax(0,1fr)]"
                key={segment.id}
              >
                <div className="grid gap-2 border-b border-line pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                  <Badge>{formatTimestamp(segment.start_ms)}</Badge>
                  <p className="text-xs text-muted">
                    Speaker labels are automatically estimated and can be edited.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {segment.speaker_label}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                      {segment.source_provider}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-ink">{segment.text}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <aside className="grid content-start gap-4">
        <Card className="grid gap-4 p-4">
          <div className="grid gap-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Recording
            </p>
            <p className="text-sm text-ink">{data.recording.filename}</p>
          </div>
          <dl className="grid gap-3 text-sm text-muted">
            <div className="flex items-center justify-between gap-3">
              <dt>Size</dt>
              <dd className="text-ink">{formatBytes(data.recording.file_size)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Language</dt>
              <dd className="text-ink">{data.recording.language}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Mode</dt>
              <dd className="text-ink">{data.recording.processing_mode}</dd>
            </div>
          </dl>
        </Card>

        <Card className="grid gap-3 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Processing
          </p>
          <p className="text-sm text-ink">{stageCopy(data.job.stage)}</p>
          <p className="text-sm text-muted">
            Provider used: {data.job.last_provider ?? "pending"}
          </p>
          {data.job.error_message ? (
            <p className="text-sm text-danger">{data.job.error_message}</p>
          ) : null}
        </Card>

        <Card className="grid gap-3 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Notes
          </p>
          <p className="text-sm text-ink">OpenRouter is reserved for the next milestone.</p>
          <p className="text-sm text-muted">
            Notes will be generated from stored transcript data, not from the
            raw audio file.
          </p>
        </Card>
      </aside>
    </div>
  );
}
