"use client";

import { CircleAlert, NotebookPen, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

import type { GeneratedNotesSummary, NotesUpdateRequest } from "@salin/shared";

import { ExportLinks, type ExportTargetLinks } from "@/components/export-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ListSectionKey = "key_points" | "decisions" | "action_items" | "questions";

const listSectionCopy: Array<{
  key: ListSectionKey;
  title: string;
  placeholder: string;
  addLabel: string;
}> = [
  {
    key: "key_points",
    title: "Key points",
    placeholder: "Important ideas, repeated themes, and points worth revisiting.",
    addLabel: "Add key point",
  },
  {
    key: "decisions",
    title: "Decisions",
    placeholder: "Concrete decisions and resolved choices appear here.",
    addLabel: "Add decision",
  },
  {
    key: "action_items",
    title: "Action items",
    placeholder: "Follow-up work, owners, and next steps appear here.",
    addLabel: "Add action item",
  },
  {
    key: "questions",
    title: "Questions",
    placeholder: "Open questions and unresolved threads stay visible here.",
    addLabel: "Add question",
  },
];

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

export function NotesEditorTab({
  canGenerate,
  dirty,
  draft,
  error,
  exportTarget,
  includeTranscriptExportTarget,
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
  draft: NotesUpdateRequest;
  error: string | null;
  exportTarget: ExportTargetLinks;
  includeTranscriptExportTarget: ExportTargetLinks;
  notes: GeneratedNotesSummary;
  notesBusy: boolean;
  saveBusy: boolean;
  saveMessage: string | null;
  onDraftChange: (nextDraft: NotesUpdateRequest) => void;
  onGenerate: () => void;
  onSave: () => void;
}) {
  function updateSummary(value: string) {
    onDraftChange({
      ...draft,
      summary: value,
    });
  }

  function updateListItem(key: ListSectionKey, index: number, value: string) {
    const nextItems = [...draft[key]];
    nextItems[index] = value;
    onDraftChange({
      ...draft,
      [key]: nextItems,
    });
  }

  function addListItem(key: ListSectionKey) {
    onDraftChange({
      ...draft,
      [key]: [...draft[key], ""],
    });
  }

  function removeListItem(key: ListSectionKey, index: number) {
    onDraftChange({
      ...draft,
      [key]: draft[key].filter((_, currentIndex) => currentIndex !== index),
    });
  }

  const buttonLabel = notes.status === "idle" ? "Generate notes" : "Regenerate notes";

  return (
    <section
      aria-labelledby="notes-tab"
      className="grid gap-4"
      id="notes-panel"
      role="tabpanel"
    >
      <Card className="overflow-hidden border-notesSoft p-0">
        <div className="grid gap-4 bg-notesFaint px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <NotebookPen aria-hidden="true" className="h-4 w-4 text-notes" />
              <h2 className="text-lg font-semibold text-ink">Notes</h2>
              <Badge className="border-notesSoft bg-notesSoft text-notes">
                {statusCopy(notes.status)}
              </Badge>
              {dirty ? (
                <Badge className="border-attentionSoft bg-attentionSoft text-attention">
                  Unsaved changes
                </Badge>
              ) : null}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted">
              Notes are generated from stored transcript data, then edited as a
              structured working document.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              disabled={!canGenerate || notesBusy}
              type="button"
              variant="notes"
              onClick={onGenerate}
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              {notesBusy ? "Generating notes..." : buttonLabel}
            </Button>
            <Button
              disabled={!dirty || saveBusy}
              type="button"
              variant="secondary"
              onClick={onSave}
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {saveBusy ? "Saving..." : "Save edits"}
            </Button>
          </div>
        </div>

        {(error || (notes.status === "failed" && notes.error_message) || saveMessage) ? (
          <div className="grid gap-2 border-t border-line bg-field px-5 py-3">
            {error ? (
              <div className="flex items-start gap-2 text-sm text-danger">
                <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            {notes.status === "failed" && notes.error_message ? (
              <div className="flex items-start gap-2 text-sm text-danger">
                <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{notes.error_message}</span>
              </div>
            ) : null}
            {saveMessage ? <p className="text-sm text-success">{saveMessage}</p> : null}
          </div>
        ) : null}

        {notes.status === "completed" ? (
          <div className="border-t border-line bg-panel px-5 py-4">
            <ExportLinks
              includeTranscriptTarget={includeTranscriptExportTarget}
              label="Exports"
              target={exportTarget}
              tone="notes"
            />
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-5 p-5">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="notes-summary">
            Summary
          </label>
          <textarea
            aria-label="Summary"
            className="min-h-36 rounded-md border border-line bg-field px-3 py-3 text-sm leading-6 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-notes"
            id="notes-summary"
            placeholder="The short recap lands here after notes generation completes."
            value={draft.summary ?? ""}
            onChange={(event) => updateSummary(event.target.value)}
          />
        </div>

        {listSectionCopy.map((section) => (
          <div className="grid gap-3 border-t border-line pt-4" key={section.key}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
                <p className="text-sm text-muted">{section.placeholder}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => addListItem(section.key)}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                {section.addLabel}
              </Button>
            </div>

            {draft[section.key].length ? (
              <div className="grid gap-3">
                {draft[section.key].map((item, index) => (
                  <div
                    className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={`${section.key}-${index}`}
                  >
                    <input
                      aria-label={`${section.title} ${index + 1}`}
                      className="h-10 min-w-0 rounded-md border border-line bg-field px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-notes"
                      placeholder={section.placeholder}
                      value={item}
                      onChange={(event) =>
                        updateListItem(section.key, index, event.target.value)
                      }
                    />
                    <Button
                      className="justify-self-start"
                      type="button"
                      variant="ghost"
                      onClick={() => removeListItem(section.key, index)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-notesSoft bg-notesFaint px-3 py-3 text-sm text-muted">
                No items yet.
              </p>
            )}
          </div>
        ))}
      </Card>
    </section>
  );
}
