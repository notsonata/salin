"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import type { GeneratedNotesSummary } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function statusCopy(status: GeneratedNotesSummary["status"]) {
  switch (status) {
    case "idle":
      return "Ready to generate";
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

export function NotesPanel({
  canGenerate,
  notes,
  notesBusy,
  onGenerate,
}: {
  canGenerate: boolean;
  notes: GeneratedNotesSummary;
  notesBusy: boolean;
  onGenerate: () => void;
}) {
  const buttonLabel = notes.status === "idle" ? "Generate notes" : "Regenerate notes";
  const contentVisible = Boolean(notes.content);

  return (
    <div className="grid gap-4">
      <Card className="border-notesSoft bg-notesFaint p-5">
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-2">
              <h2 className="text-lg font-semibold text-ink">
                Notes
              </h2>
              <p className="text-sm leading-6 text-muted">
                Generated notes stay downstream of the transcript. The recording
                remains reviewable even when notes are empty, generating, or failed.
              </p>
            </div>
            <Badge className="border-notesSoft bg-notesSoft text-notes">
              {statusCopy(notes.status)}
            </Badge>
          </div>

          {notes.status === "failed" && notes.error_message ? (
            <div className="rounded-md border border-dangerSoft bg-dangerFaint px-3 py-3 text-sm text-danger">
              {notes.error_message}
            </div>
          ) : null}

          {!contentVisible && notes.status === "idle" ? (
            <div className="rounded-md border border-dashed border-notesSoft bg-panel px-4 py-4">
              <p className="text-sm font-medium text-ink">Nothing generated yet.</p>
              <p className="mt-1 text-sm text-muted">
                Use the transcript below, then generate notes into this column.
              </p>
            </div>
          ) : null}

          {(notes.status === "queued" || notes.status === "generating") && !contentVisible ? (
            <div className="rounded-md border border-attentionSoft bg-attentionFaint px-4 py-4">
              <p className="text-sm font-medium text-ink">Notes generation is in progress.</p>
              <p className="mt-1 text-sm text-muted">
                This column updates as soon as the generated sections are saved.
              </p>
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={!canGenerate || notesBusy}
            type="button"
            variant="notes"
            onClick={onGenerate}
          >
            {notesBusy ? "Generating notes..." : buttonLabel}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-medium text-ink">Generated document</p>
          <p className="mt-1 text-sm text-muted">
            Notes appear here and remain visible during regeneration.
          </p>
        </div>

        <div className="p-5 prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:p-0">
            {notes.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {notes.content}
                </ReactMarkdown>
            ) : (
                <p className="text-sm text-muted">No content available.</p>
            )}
        </div>
      </Card>
    </div>
  );
}
