import type { RefObject } from "react";
import { WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";

import type { RecordingDetailResponse, TranscriptSegment } from "@salin/shared";

import type { ExportLinkItem } from "@/components/export-links";
import { TranscriptPanel } from "@/components/transcript-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TranscriptWorkspaceTab({
  activeSegmentId,
  audioRef,
  data,
  error,
  exportLinks,
  filteredSegments,
  query,
  retrying,
  onQueryChange,
  onRenameSpeaker,
  onRetry,
  onSeek,
  onUpdateSegment,
  speakerLabels,
  speakerMessage,
  speakerSavingTarget,
}: {
  activeSegmentId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  data: RecordingDetailResponse;
  error: string | null;
  exportLinks: ExportLinkItem[];
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
  onUpdateSegment: (segmentId: string, speakerLabel: string, text: string) => Promise<void>;
}) {
  const transcriptAvailable = data.transcript_segments.length > 0;

  return (
    <section className="grid gap-3">
      {error ? (
        <Card className="flex items-start gap-3 border-dangerSoft bg-dangerFaint p-4 text-sm text-danger">
          <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </Card>
      ) : null}

      {!transcriptAvailable ? (
        <Card className="grid gap-4 p-5">
          <Badge className="w-fit" tone="attention">
            Transcript pending
          </Badge>
          <div className="grid gap-2">
            <p className="text-sm font-medium text-ink">
              The recording is still moving through preprocessing and transcription.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-muted">
              The transcript column appears as soon as timestamped segments are saved.
              Until then, the session strip keeps the job legible.
            </p>
          </div>
          {data.job.stage === "failed" && data.job.error_message ? (
            <p className="text-sm text-danger">{data.job.error_message}</p>
          ) : null}
          {data.job.stage === "failed" && data.job.retryable ? (
            <div>
              <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
                <ArrowsClockwise weight="bold" className="h-4 w-4" />
                {retrying ? "Retrying..." : "Retry processing"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          {data.job.stage === "diarizing" ? (
            <Card className="grid gap-2 border-accentSoft bg-accentFaint p-4">
              <p className="text-sm font-medium text-ink">
                Transcript is ready while speaker estimation continues.
              </p>
              <p className="text-sm leading-6 text-muted">
                Search, review, export, and notes generation remain available now.
              </p>
            </Card>
          ) : null}

          {data.job.stage === "failed" && data.job.error_message ? (
            <Card className="grid gap-3 border-dangerSoft bg-dangerFaint p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-danger">
                <WarningCircle weight="bold" className="h-4 w-4" />
                Processing stopped.
              </p>
              <p className="text-sm leading-6 text-danger">{data.job.error_message}</p>
              {data.job.retryable ? (
                <div>
                  <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
                    <ArrowsClockwise weight="bold" className="h-4 w-4" />
                    {retrying ? "Retrying..." : "Retry processing"}
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : null}

          <TranscriptPanel
            activeSegmentId={activeSegmentId}
            audioRef={audioRef}
            canSeek={Boolean(data.artifact_urls?.normalized)}
            exportLinks={exportLinks}
            filteredSegments={filteredSegments}
            matchCount={filteredSegments.length}
            normalizedUrl={data.artifact_urls?.normalized ?? undefined}
            originalUrl={data.artifact_urls?.original ?? undefined}
            query={query}
            speakerLabels={speakerLabels}
            speakerMessage={speakerMessage}
            speakerSavingTarget={speakerSavingTarget}
            onQueryChange={onQueryChange}
            onRenameSpeaker={onRenameSpeaker}
            onSeek={onSeek}
            onUpdateSegment={onUpdateSegment}
          />
        </>
      )}
    </section>
  );
}
