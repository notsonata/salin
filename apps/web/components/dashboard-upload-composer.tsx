"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";

import type { LanguageOption, ProcessingMode, SpeakerCount } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();
const supportedFormats = [".mp3", ".wav", ".m4a", ".aac", ".mp4", ".mov", ".webm"];

export function DashboardUploadComposer() {
  const [language, setLanguage] = useState<LanguageOption>("auto");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("accurate");
  const [speakerCount, setSpeakerCount] = useState<SpeakerCount>("auto");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedCopy = useMemo(() => supportedFormats.join(", "), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a recording before starting processing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.createRecording({
        file,
        language,
        processing_mode: processingMode,
        speaker_count: speakerCount,
      });
      window.location.assign(`/recordings/${response.recording.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Upload failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-3" id="new-recording">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <p className="font-mono text-[11px] uppercase text-accent">
            Upload
          </p>
          <h2 className="text-xl font-semibold text-ink">New recording</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted sm:text-right">
          Upload one recording, then review the transcript and notes in the
          workspace.
        </p>
      </div>

      <Card className="overflow-hidden border-accentSoft p-0">
        <form className="grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-ink"
                htmlFor="recording-file"
              >
                Recording
              </label>
              <input
                id="recording-file"
                className="block min-h-12 w-full rounded-md border border-accentSoft bg-field px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-panel hover:bg-accentFaint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                type="file"
                accept={supportedFormats.join(",")}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-sm text-muted">Supported formats: {supportedCopy}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <fieldset className="grid gap-2">
                <label
                  className="text-sm font-medium text-ink"
                  htmlFor="language"
                >
                  Language
                </label>
                <select
                  id="language"
                  className="h-10 rounded-md border border-line bg-field px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as LanguageOption)}
                >
                  <option value="auto">Auto detect</option>
                  <option value="tl">Tagalog</option>
                  <option value="en">English</option>
                </select>
              </fieldset>

              <fieldset className="grid gap-2">
                <label
                  className="text-sm font-medium text-ink"
                  htmlFor="processing-mode"
                >
                  Processing mode
                </label>
                <select
                  id="processing-mode"
                  className="h-10 rounded-md border border-line bg-field px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  value={processingMode}
                  onChange={(event) =>
                    setProcessingMode(event.target.value as ProcessingMode)
                  }
                >
                  <option value="accurate">Accurate</option>
                  <option value="fast">Fast</option>
                </select>
              </fieldset>

              <fieldset className="grid gap-2">
                <label
                  className="text-sm font-medium text-ink"
                  htmlFor="speaker-count"
                >
                  Speaker count
                </label>
                <select
                  id="speaker-count"
                  className="h-10 rounded-md border border-line bg-field px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  value={speakerCount}
                  onChange={(event) =>
                    setSpeakerCount(event.target.value as SpeakerCount)
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5_plus">5+</option>
                </select>
              </fieldset>
            </div>
          </div>

          {error ? (
            <div className="mx-5 flex items-start gap-3 rounded-md border border-dangerSoft bg-dangerFaint px-4 py-3 text-sm text-danger sm:mx-6">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-accentSoft bg-accentFaint px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Best with a clean source file. Speaker labels are estimated until
              you edit them.
            </p>
            <Button disabled={submitting} type="submit" variant="accent">
              {submitting ? "Starting..." : "Start processing"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
