import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, NotebookPen, Pencil, RefreshCw, X } from "lucide-react";

import type { RecordingDetailResponse } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format";

function stageCopy(stage: RecordingDetailResponse["job"]["stage"]) {
  switch (stage) {
    case "uploaded":
      return "Queued";
    case "preprocessing":
      return "Normalizing audio";
    case "transcribing":
      return "Building transcript";
    case "diarizing":
      return "Speaker estimation in progress";
    case "completed":
      return "Transcript ready";
    case "failed":
      return "Processing failed";
  }
}

function stageTone(stage: RecordingDetailResponse["job"]["stage"]) {
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

function notesTone(status: RecordingDetailResponse["notes"]["status"]) {
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

function notesCopy(status: RecordingDetailResponse["notes"]["status"]) {
  switch (status) {
    case "idle":
      return "Notes idle";
    case "queued":
      return "Notes queued";
    case "generating":
      return "Notes generating";
    case "completed":
      return "Notes ready";
    case "failed":
      return "Notes failed";
  }
}

function languageCopy(language: RecordingDetailResponse["recording"]["language"]) {
  switch (language) {
    case "auto":
      return "Auto";
    case "tl":
      return "Tagalog";
    case "en":
      return "English";
  }
}

function processingModeCopy(mode: RecordingDetailResponse["recording"]["processing_mode"]) {
  switch (mode) {
    case "accurate":
      return "Accurate";
    case "fast":
      return "Fast";
  }
}

function speakerCountCopy(count: RecordingDetailResponse["recording"]["speaker_count"]) {
  switch (count) {
    case "auto":
      return "Auto";
    case "5_plus":
      return "5+";
    default:
      return count;
  }
}

export function RecordingDetailHeader({
  data,
  renaming,
  retrying,
  onRename,
  onRetry,
}: {
  data: RecordingDetailResponse;
  renaming: boolean;
  retrying: boolean;
  onRename: (newName: string) => Promise<void>;
  onRetry: () => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(data.recording.filename);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) {
      setRenameDraft(data.recording.filename);
    }
  }, [data.recording.filename, isRenaming]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      const lastDotIndex = renameDraft.lastIndexOf(".");
      if (lastDotIndex > 0) {
        inputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [isRenaming]); // Intentionally omitting renameDraft to run only when isRenaming changes

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renameDraft.trim() || renameDraft === data.recording.filename) {
      setIsRenaming(false);
      setRenameDraft(data.recording.filename);
      return;
    }
    await onRename(renameDraft);
    setIsRenaming(false);
  }

  return (
    <header
      className="rounded-[1.2rem] border border-line/80 bg-panel shadow-panel"
      data-testid="workspace-top-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm" variant="ghost" className="gap-2 -ml-2 text-muted hover:text-ink">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <Badge tone={stageTone(data.job.stage)}>{stageCopy(data.job.stage)}</Badge>
            <Badge tone={notesTone(data.notes.status)}>
              <NotebookPen className="mr-1.5 h-3.5 w-3.5" />
              {notesCopy(data.notes.status)}
            </Badge>
          </div>

          <div className="min-w-0">
            {isRenaming ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => void handleRenameSubmit(e)}
              >
                <Input
                  ref={inputRef}
                  disabled={renaming}
                  maxLength={1024}
                  value={renameDraft}
                  className="h-9 w-full max-w-[400px] text-lg font-medium"
                  onChange={(e) => setRenameDraft(e.target.value)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  type="submit"
                  disabled={renaming}
                  className="h-9 w-9 text-ink hover:bg-line/50"
                  aria-label="Save filename"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  disabled={renaming}
                  className="h-9 w-9 text-muted hover:bg-line/50 hover:text-ink"
                  onClick={() => {
                    setIsRenaming(false);
                    setRenameDraft(data.recording.filename);
                  }}
                  aria-label="Cancel renaming"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="group flex items-center gap-3">
                <h1 className="truncate text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">
                  {data.recording.filename}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted opacity-0 hover:bg-line/50 hover:text-ink group-hover:opacity-100"
                  aria-label="Rename recording"
                  disabled={renaming}
                  onClick={() => setIsRenaming(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="mt-1 text-sm leading-6 text-muted">
              Speaker labels are automatically estimated and can be edited.
            </p>
          </div>
        </div>

        {data.job.stage === "failed" && data.job.retryable ? (
          <Button disabled={retrying} type="button" variant="secondary" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            {retrying ? "Retrying..." : "Retry processing"}
          </Button>
        ) : null}
      </div>

      <div className="border-t border-line/80 px-4 py-3 sm:px-5">
        <dl className="grid gap-x-5 gap-y-2 text-sm text-muted sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em]">Language</dt>
            <dd className="text-ink">{languageCopy(data.recording.language)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em]">Mode</dt>
            <dd className="text-ink">{processingModeCopy(data.recording.processing_mode)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em]">Size</dt>
            <dd className="text-ink">{formatBytes(data.recording.file_size)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em]">Speakers</dt>
            <dd className="text-ink">{speakerCountCopy(data.recording.speaker_count)}</dd>
          </div>
        </dl>
      </div>

      {data.job.stage !== "failed" && data.job.error_message ? (
        <div className="border-t border-line/80 bg-attentionFaint px-4 py-3 sm:px-5">
          <p className="flex items-start gap-2 text-sm leading-6 text-muted">
            <CircleAlert className="mt-1 h-4 w-4 shrink-0 text-attention" />
            <span>
              <span className="font-medium text-ink">Processing note:</span>{" "}
              {data.job.error_message}
            </span>
          </p>
        </div>
      ) : null}
    </header>
  );
}
