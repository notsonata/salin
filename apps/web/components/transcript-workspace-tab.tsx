import type { RefObject } from "react";

import type { RecordingDetailResponse, TranscriptSegment } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export function TranscriptWorkspaceTab({
  activeSegmentId,
  audioRef,
  data,
  error,
  filteredSegments,
  query,
  retrying,
  onExport,
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
  filteredSegments: TranscriptSegment[];
  query: string;
  retrying: boolean;
  speakerLabels: string[];
  speakerMessage: string | null;
  speakerSavingTarget: string | null;
  onExport: () => void;
  onQueryChange: (value: string) => void;
  onRenameSpeaker: (fromLabel: string, toLabel: string) => Promise<void>;
  onRetry: () => void;
  onSeek: (segment: TranscriptSegment) => void;
  onUpdateSegmentSpeaker: (segmentId: string, speakerLabel: string) => Promise<void>;
}) {
  const transcriptAvailable = data.transcript_segments.length > 0;

  return (
    <section
      aria-labelledby="transcript-tab"
      className="grid gap-4"
      id="transcript-panel"
      role="tabpanel"
    >
      {error ? (
        <Card className="border-[#d8b3ab] bg-[#f7ebe8] p-4 text-sm text-danger">
          {error}
        </Card>
      ) : null}

      {!transcriptAvailable ? (
        <Card className="grid gap-3 p-5">
          <p className="font-medium text-ink">{stageCopy(data.job.stage)}</p>
          <p className="text-sm leading-6 text-muted">
            This recording is still working through the pipeline. Stay here for
            progress, then return to the transcript once processing completes.
          </p>
          {data.job.stage === "failed" && data.job.error_message ? (
            <p className="text-sm text-danger">{data.job.error_message}</p>
          ) : null}
          {data.job.stage === "failed" && data.job.retryable ? (
            <div>
              <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
                {retrying ? "Retrying..." : "Retry processing"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          {data.job.stage === "diarizing" ? (
            <Card className="grid gap-2 border-[#dfd2bd] bg-[#fbf8f3] p-4">
              <p className="text-sm font-medium text-ink">Transcript is ready.</p>
              <p className="text-sm leading-6 text-muted">
                Speaker labels are still being estimated. You can review, search,
                and export the transcript while that finishes.
              </p>
            </Card>
          ) : null}
          {data.job.stage === "failed" && data.job.error_message ? (
            <Card className="grid gap-3 border-[#d8b3ab] bg-[#f7ebe8] p-4">
              <p className="text-sm font-medium text-danger">Processing stopped.</p>
              <p className="text-sm leading-6 text-danger">{data.job.error_message}</p>
              {data.job.retryable ? (
                <div>
                  <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
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
            filteredSegments={filteredSegments}
            matchCount={filteredSegments.length}
            query={query}
            speakerLabels={speakerLabels}
            speakerMessage={speakerMessage}
            speakerSavingTarget={speakerSavingTarget}
            onExport={onExport}
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
