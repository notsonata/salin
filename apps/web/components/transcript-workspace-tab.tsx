import type { RefObject } from "react";
import { CircleAlert, Loader2, RefreshCw } from "lucide-react";

import type { RecordingDetailResponse, TranscriptSegment } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExportTargetLinks } from "@/components/export-links";
import { TranscriptPlayer } from "@/components/transcript-player";
import { TranscriptPanel } from "@/components/transcript-panel";

function stageCopy(stage: RecordingDetailResponse["job"]["stage"]) {
  switch (stage) {
    case "uploaded":
      return "Queued for processing";
    case "preprocessing":
      return "Normalizing audio";
    case "transcribing":
      return "Building timestamped transcript";
    case "diarizing":
      return "Estimating speaker labels";
    case "completed":
      return "Transcript ready";
    case "failed":
      return "Processing failed";
  }
}

const stageSteps: Array<{
  id: RecordingDetailResponse["job"]["stage"];
  label: string;
}> = [
  { id: "uploaded", label: "Upload" },
  { id: "preprocessing", label: "Normalize" },
  { id: "transcribing", label: "Transcribe" },
  { id: "diarizing", label: "Diarize" },
  { id: "completed", label: "Review" },
];

function stageIndex(stage: RecordingDetailResponse["job"]["stage"]) {
  if (stage === "failed") {
    return -1;
  }

  return stageSteps.findIndex((step) => step.id === stage);
}

function stageStepClass(index: number, currentStageIndex: number) {
  if (index < currentStageIndex) {
    return "border-successSoft bg-successSoft";
  }

  if (index === currentStageIndex) {
    return "border-reviewSoft bg-reviewFaint";
  }

  return "border-line bg-field";
}

export function TranscriptWorkspaceTab({
  activeSegmentId,
  audioRef,
  data,
  error,
  exportTarget,
  filteredSegments,
  query,
  retrying,
  onQueryChange,
  onRenameSpeaker,
  onRetry,
  onSeek,
  onUpdateSegmentSpeaker,
  speakerLabels,
  speakerMessage,
  speakerSavingTarget,
}: {
  activeSegmentId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  data: RecordingDetailResponse;
  error: string | null;
  exportTarget: ExportTargetLinks;
  filteredSegments: TranscriptSegment[];
  query: string;
  retrying: boolean;
  speakerLabels: string[];
  speakerMessage: string | null;
  speakerSavingTarget: string | null;
  onQueryChange: (value: string) => void;
  onRenameSpeaker: (fromLabel: string, toLabel: string) => Promise<void>;
  onRetry: () => void;
  onSeek: (segment: TranscriptSegment) => void;
  onUpdateSegmentSpeaker: (segmentId: string, speakerLabel: string) => Promise<void>;
}) {
  const transcriptAvailable = data.transcript_segments.length > 0;
  const currentStageIndex = stageIndex(data.job.stage);

  return (
    <section
      aria-labelledby="transcript-tab"
      className="grid gap-4"
      id="transcript-panel"
      role="tabpanel"
    >
      {error ? (
        <Card className="flex items-start gap-3 border-dangerSoft bg-dangerFaint p-4 text-sm text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </Card>
      ) : null}

      {!transcriptAvailable ? (
        <Card className="grid gap-5 p-5">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              {data.job.stage === "failed" ? (
                <CircleAlert aria-hidden="true" className="h-4 w-4 text-danger" />
              ) : (
                <Loader2 aria-hidden="true" className="h-4 w-4 text-review" />
              )}
              <p className="font-medium text-ink">{stageCopy(data.job.stage)}</p>
            </div>
            <p className="text-sm leading-6 text-muted">
              This recording is moving through the processing pipeline. The
              transcript panel appears as soon as transcript blocks are saved.
            </p>
          </div>
          {data.job.stage !== "failed" ? (
            <div className="grid gap-2 sm:grid-cols-5">
              {stageSteps.map((step, index) => (
                <div
                  className={`rounded-md border px-3 py-3 ${stageStepClass(index, currentStageIndex)}`}
                  key={step.id}
                >
                  <p className="font-mono text-[11px] uppercase text-muted">
                    {step.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {index < currentStageIndex
                      ? "Done"
                      : index === currentStageIndex
                        ? "Now"
                        : "Pending"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {data.job.stage === "failed" && data.job.error_message ? (
            <p className="text-sm text-danger">{data.job.error_message}</p>
          ) : null}
          {data.job.stage === "failed" && data.job.retryable ? (
            <div>
              <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                {retrying ? "Retrying..." : "Retry processing"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          {data.job.stage === "diarizing" ? (
            <Card className="grid gap-2 border-notesSoft bg-notesFaint p-4">
              <p className="text-sm font-medium text-ink">Transcript is ready.</p>
              <p className="text-sm leading-6 text-muted">
                Speaker labels are still being estimated. You can review, search,
                and export the transcript while that finishes.
              </p>
            </Card>
          ) : null}
          {data.job.stage === "failed" && data.job.error_message ? (
            <Card className="grid gap-3 border-dangerSoft bg-dangerFaint p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-danger">
                <CircleAlert aria-hidden="true" className="h-4 w-4" />
                Processing stopped.
              </p>
              <p className="text-sm leading-6 text-danger">{data.job.error_message}</p>
              {data.job.retryable ? (
                <div>
                  <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    {retrying ? "Retrying..." : "Retry processing"}
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : null}
          <TranscriptPlayer
            audioRef={audioRef}
            filename={data.recording.filename}
            normalizedUrl={data.artifact_urls?.normalized ?? undefined}
            originalUrl={data.artifact_urls?.original ?? undefined}
          />
          <TranscriptPanel
            activeSegmentId={activeSegmentId}
            canSeek={Boolean(data.artifact_urls?.normalized)}
            exportTarget={exportTarget}
            filteredSegments={filteredSegments}
            matchCount={filteredSegments.length}
            query={query}
            speakerLabels={speakerLabels}
            speakerMessage={speakerMessage}
            speakerSavingTarget={speakerSavingTarget}
            onQueryChange={onQueryChange}
            onRenameSpeaker={onRenameSpeaker}
            onSeek={onSeek}
            onUpdateSegmentSpeaker={onUpdateSegmentSpeaker}
          />
        </>
      )}
    </section>
  );
}
