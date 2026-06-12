"use client";

import type { GeneratedNotesSummary, NotesUpdateRequest } from "@salin/shared";

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
      <Card className="border-[#cabca6] bg-[#f4ede0] p-5">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <h2 className="font-mono text-lg tracking-[-0.04em] text-ink">Notes</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted">
                Generated notes stay downstream of the transcript, but they can
                now be edited and saved section by section.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dirty ? <Badge className="bg-accentSoft text-ink">Unsaved changes</Badge> : null}
              <Badge className="bg-[#ebe2d3] text-ink">{statusCopy(notes.status)}</Badge>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-[#cfa79c] bg-[#f6e7e2] px-3 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          {notes.status === "failed" && notes.error_message ? (
            <div className="rounded-md border border-[#cfa79c] bg-[#f6e7e2] px-3 py-3 text-sm text-danger">
              {notes.error_message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              disabled={!canGenerate || notesBusy}
              type="button"
              variant="accent"
              onClick={onGenerate}
            >
              {notesBusy ? "Generating notes..." : buttonLabel}
            </Button>
            <div className="flex items-center gap-3">
              {saveMessage ? <p className="text-sm text-muted">{saveMessage}</p> : null}
              <Button
                disabled={!dirty || saveBusy}
                type="button"
                variant="secondary"
                onClick={onSave}
              >
                {saveBusy ? "Saving..." : "Save edits"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="grid gap-5 p-5">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="notes-summary">
            Summary
          </label>
          <textarea
            aria-label="Summary"
            className="min-h-32 rounded-md border border-line bg-[#fbf8f3] px-3 py-3 text-sm leading-6 text-ink"
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
                <h3 className="font-mono text-sm tracking-[-0.03em] text-ink">
                  {section.title}
                </h3>
                <p className="text-sm text-muted">{section.placeholder}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => addListItem(section.key)}>
                {section.addLabel}
              </Button>
            </div>

            {draft[section.key].length ? (
              <div className="grid gap-3">
                {draft[section.key].map((item, index) => (
                  <div className="flex items-start gap-3" key={`${section.key}-${index}`}>
                    <input
                      aria-label={`${section.title} ${index + 1}`}
                      className="h-10 flex-1 rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
                      placeholder={section.placeholder}
                      value={item}
                      onChange={(event) =>
                        updateListItem(section.key, index, event.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeListItem(section.key, index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No items yet.</p>
            )}
          </div>
        ))}
      </Card>
    </section>
  );
}
