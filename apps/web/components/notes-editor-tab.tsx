"use client";

import { WarningCircle, Notepad, ArrowsClockwise, FloppyDisk } from "@phosphor-icons/react";

import type { NotesStatus, NotesUpdateRequest, RecordingDetailResponse } from "@salin/shared";

import { NotesExportLinks, type ExportUrls, type NotesExportContent } from "@/components/export-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/markdown-editor";

function statusCopy(status: NotesStatus, canGenerate: boolean) {
  switch (status) {
    case "idle":
      return canGenerate ? "Ready to generate" : "Waiting for transcript";
    case "queued":
      return "Queued";
    case "generating":
      return "Generating";
    case "completed":
      return "Ready";
    case "failed":
      return "Needs retry";
  }
}

function statusTone(status: NotesStatus) {
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

export function NotesEditorTab({
  canGenerate,
  dirty,
  draft,
  error,
  exportUrls,
  exportContent,
  notes,
  notesBusy,
  saveBusy,
  saveMessage,
  onDraftChange,
  onGenerate,
  onSave,
}: {
  canGenerate: boolean;
  dirty: boolean;
  draft: NotesUpdateRequest | null;
  error: string | null;
  exportUrls: { notesUrls: ExportUrls; combinedUrls: ExportUrls };
  exportContent: NotesExportContent;
  notes: RecordingDetailResponse["notes"];
  notesBusy: boolean;
  saveBusy: boolean;
  saveMessage: string | null;
  onDraftChange: (nextDraft: NotesUpdateRequest) => void;
  onGenerate: () => void;
  onSave: () => void;
}) {
  const buttonLabel = notes.status === "idle" ? "Generate notes" : "Regenerate notes";
  const showEmptyState = notes.status === "idle" && !draft?.content;

  return (
    <section className="grid gap-4" data-testid="notes-dock">
      <Card className="overflow-hidden">
        <div className="grid gap-4 border-b border-line/80 bg-panel px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Notepad weight="bold" className="h-4 w-4 text-accent" />
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                  Notes dock
                </h2>
                <Badge tone={statusTone(notes.status)}>{statusCopy(notes.status, canGenerate)}</Badge>
                {dirty ? <Badge tone="attention">Dirty draft</Badge> : null}
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Generated notes behave like a working document beside the transcript,
                not a final export preview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!canGenerate || notesBusy}
                type="button"
                variant="accent"
                onClick={onGenerate}
              >
                <ArrowsClockwise weight="bold" className="h-4 w-4" />
                {notesBusy ? "Generating notes..." : buttonLabel}
              </Button>
              <Button
                disabled={!dirty || saveBusy}
                type="button"
                variant="secondary"
                onClick={onSave}
              >
                <FloppyDisk weight="bold" className="h-4 w-4" />
                {saveBusy ? "Saving..." : "Save edits"}
              </Button>
              {notes.status === "completed" ? (
                <NotesExportLinks
                  combinedUrls={exportUrls.combinedUrls}
                  content={exportContent}
                  label="Export notes"
                  notesUrls={exportUrls.notesUrls}
                />
              ) : null}
            </div>
          </div>

          {(error || (notes.status === "failed" && notes.error_message) || saveMessage) ? (
            <div className="grid gap-2 rounded-xl border border-line/80 bg-canvas px-4 py-3">
              {error ? (
                <div className="flex items-start gap-2 text-sm text-danger">
                  <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
              {notes.status === "failed" && notes.error_message ? (
                <div className="flex items-start gap-2 text-sm text-danger">
                  <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{notes.error_message}</span>
                </div>
              ) : null}
              {saveMessage ? <p className="text-sm text-success">{saveMessage}</p> : null}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="rounded-xl border border-dashed border-line bg-canvas px-4 py-4">
              <p className="text-sm font-medium text-ink">Nothing generated yet.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Review the transcript, then generate notes into this dock.
              </p>
            </div>
          ) : null}
        </div>

        <div className="bg-panel px-5 py-5 min-h-[500px]" data-color-mode="light">
          <MarkdownEditor
            key={notes.updated_at ?? "editor"}
            markdown={draft?.content ?? ""}
            onChange={(val) => onDraftChange({ ...(draft ?? {}), content: val || "" } as NotesUpdateRequest)}
          />
        </div>
      </Card>
    </section>
  );
}
