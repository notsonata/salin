"use client";

import type { GeneratedNotesSummary } from "@salin/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NotesSectionKey =
  | "summary"
  | "key_points"
  | "decisions"
  | "action_items"
  | "questions";

const sectionOrder: Array<{
  key: NotesSectionKey;
  title: string;
  placeholder: string;
}> = [
  {
    key: "summary",
    title: "Summary",
    placeholder: "The short recap lands here after notes generation completes.",
  },
  {
    key: "key_points",
    title: "Key points",
    placeholder: "Important ideas, repeated themes, and points worth revisiting.",
  },
  {
    key: "decisions",
    title: "Decisions",
    placeholder: "Concrete decisions and resolved choices appear here.",
  },
  {
    key: "action_items",
    title: "Action items",
    placeholder: "Follow-up work, owners, and next steps appear here.",
  },
  {
    key: "questions",
    title: "Questions",
    placeholder: "Open questions and unresolved threads stay visible here.",
  },
];

function hasNotesContent(notes: GeneratedNotesSummary) {
  return Boolean(
    notes.summary ||
      notes.key_points.length ||
      notes.decisions.length ||
      notes.action_items.length ||
      notes.questions.length,
  );
}

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

function sectionContent(notes: GeneratedNotesSummary, key: NotesSectionKey) {
  if (key === "summary") {
    return notes.summary ? [notes.summary] : [];
  }

  return notes[key];
}

function SectionBody({
  items,
  notes,
  placeholder,
}: {
  items: string[];
  notes: GeneratedNotesSummary;
  placeholder: string;
}) {
  if (items.length) {
    if (items.length === 1 && notes.summary === items[0]) {
      return <p className="text-sm leading-6 text-ink">{items[0]}</p>;
    }

    return (
      <ul className="grid gap-2 text-sm leading-6 text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (notes.status === "queued" || notes.status === "generating") {
    return <p className="text-sm text-muted">Generating this section...</p>;
  }

  if (notes.status === "failed") {
    return <p className="text-sm text-muted">No saved content for this section yet.</p>;
  }

  return <p className="text-sm text-muted">{placeholder}</p>;
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
  const contentVisible = hasNotesContent(notes);

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
                Use the transcript below, then generate summary, key points,
                decisions, action items, and questions into this column.
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
          <p className="text-sm font-medium text-ink">Generated sections</p>
          <p className="mt-1 text-sm text-muted">
            Notes appear here section by section and remain visible during regeneration.
          </p>
        </div>

        <div className="divide-y divide-line">
          {sectionOrder.map((section) => {
            const items = sectionContent(notes, section.key);
            return (
              <section className="grid gap-3 px-5 py-4" key={section.key}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-ink">{section.title}</h3>
                  {items.length ? (
                    <span
                      className={cn(
                        "text-xs text-muted",
                        section.key === "summary" ? "hidden" : "inline",
                      )}
                    >
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <SectionBody items={items} notes={notes} placeholder={section.placeholder} />
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
