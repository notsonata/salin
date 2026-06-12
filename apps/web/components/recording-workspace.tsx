"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock3, RefreshCcw } from "lucide-react";

import type {
  JobStage,
  NotesStatus,
  RecordingDetailResponse,
  TranscriptSegment,
} from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/api";
import { formatBytes, formatTimestamp } from "@/lib/format";
import { NotesPanel } from "@/components/notes-panel";
import { TranscriptPanel } from "@/components/transcript-panel";
import { TranscriptPlayer } from "@/components/transcript-player";

const apiClient = createBrowserClient();
const terminalStages: JobStage[] = ["completed", "failed"];
const terminalNotesStatuses: NotesStatus[] = ["idle", "completed", "failed"];

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

function notesStatusCopy(status: NotesStatus) {
  switch (status) {
    case "idle":
      return "Not generated";
    case "queued":
      return "Queued";
    case "generating":
      return "Generating";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
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
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stage = data?.job.stage;
  const notesStatus = data?.notes.status;

  const refreshWorkspace = useCallback(async () => {
    try {
      const nextData = await apiClient.getRecording(recordingId);
      setData(nextData);
    } catch (pollError) {
      setError(
        pollError instanceof Error ? pollError.message : "Could not refresh status.",
      );
    }
  }, [recordingId]);

  useEffect(() => {
    let intervalId: number | undefined;

    void refreshWorkspace();

    if (
      !stage ||
      !terminalStages.includes(stage) ||
      !notesStatus ||
      !terminalNotesStatuses.includes(notesStatus)
    ) {
      intervalId = window.setInterval(() => {
        void refreshWorkspace();
      }, 2000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [notesStatus, refreshWorkspace, stage]);

  const filteredSegments = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.transcript_segments;
    }

    return data.transcript_segments.filter((segment) => {
      const haystack = `${segment.speaker_label} ${segment.text}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [data, searchQuery]);

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

  async function generateNotes() {
    if (!data) {
      return;
    }

    setGeneratingNotes(true);
    setError(null);
    try {
      const response = await apiClient.generateNotes(recordingId);
      setData((current) =>
        current ? { ...current, notes: response.notes } : current,
      );
    } catch (notesError) {
      setError(
        notesError instanceof Error ? notesError.message : "Notes generation failed.",
      );
    } finally {
      setGeneratingNotes(false);
    }
  }

  function seekToSegment(segment: TranscriptSegment) {
    setActiveSegmentId(segment.id);
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = segment.start_ms / 1000;
    void audioRef.current.play().catch(() => undefined);
  }

  function exportTranscript() {
    if (!data) {
      return;
    }

    const content = data.transcript_segments
      .map(
        (segment) =>
          `[${formatTimestamp(segment.start_ms)}] ${segment.speaker_label}: ${segment.text}`,
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.recording.filename.replace(/\.[^.]+$/, "")}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const notesBusy =
    generatingNotes ||
    data.notes.status === "queued" ||
    data.notes.status === "generating";

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]">
      <aside className="order-1 grid content-start gap-4 xl:order-2">
        <NotesPanel
          canGenerate={data.job.stage === "completed" && data.transcript_segments.length > 0}
          notes={data.notes}
          notesBusy={notesBusy}
          onGenerate={generateNotes}
        />

        <Card className="grid gap-4 p-5">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">
              Recording details
            </h2>
            <p className="text-sm text-muted">
              The transcript stays primary. This rail keeps the working metadata compact.
            </p>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-muted">File</dt>
              <dd className="text-right font-medium text-ink">{data.recording.filename}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-muted">Language</dt>
              <dd className="font-medium text-ink">{data.recording.language}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-muted">Mode</dt>
              <dd className="font-medium text-ink">{data.recording.processing_mode}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <dt className="text-muted">Size</dt>
              <dd className="font-medium text-ink">{formatBytes(data.recording.file_size)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Provider</dt>
              <dd className="font-medium text-ink">{data.job.last_provider ?? "pending"}</dd>
            </div>
          </dl>
        </Card>
      </aside>

      <section className="order-2 grid gap-4 xl:order-1">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  {data.recording.filename}
                </h2>
                <Badge className="bg-[#ebe2d3] text-ink">{stageCopy(data.job.stage)}</Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Review the transcript against normalized playback, then generate
                structured notes into the dedicated notes column. The notes button
                stays visible even when the transcript remains the primary surface.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-line bg-[#faf6ee] px-4 py-3">
                  <p className="text-xs text-muted">Segments</p>
                  <p className="mt-1 text-base font-medium text-ink">
                    {data.transcript_segments.length}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-[#faf6ee] px-4 py-3">
                  <p className="text-xs text-muted">Notes status</p>
                  <p className="mt-1 text-base font-medium text-ink">
                    {notesStatusCopy(data.notes.status)}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-[#faf6ee] px-4 py-3">
                  <p className="text-xs text-muted">Processing</p>
                  <p className="mt-1 text-base font-medium text-ink">
                    {data.recording.processing_mode}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-md border border-line bg-[#faf6ee] px-4 py-4">
                <div className="flex items-start gap-3 text-sm text-muted">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-6">
                    {data.notes.status === "completed"
                      ? "Generated notes are already visible in the notes column."
                      : "The notes column holds the generated summary, key points, decisions, action items, and questions."}
                  </p>
                </div>
              </div>
            </div>
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
              The workspace keeps polling until the transcript and notes reach
              terminal states.
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
          <>
            <TranscriptPlayer
              audioRef={audioRef}
              filename={data.recording.filename}
              normalizedUrl={data.artifact_urls?.normalized ?? undefined}
              originalUrl={data.artifact_urls?.original ?? undefined}
            />
            <TranscriptPanel
              activeSegmentId={activeSegmentId}
              canSeek={Boolean(data.artifact_urls?.normalized)}
              filteredSegments={filteredSegments}
              matchCount={filteredSegments.length}
              query={searchQuery}
              onExport={exportTranscript}
              onQueryChange={setSearchQuery}
              onSeek={seekToSegment}
            />
          </>
        )}
      </section>
    </div>
  );
}
