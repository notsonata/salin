"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState, type FormEvent } from "react";

import type { LanguageOption, ProcessingMode, SpeakerCount } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();

const supportedFormats = [".mp3", ".wav", ".m4a", ".aac", ".mp4", ".mov", ".webm"];

export function UploadForm() {
  const router = useRouter();
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
      startTransition(() => {
        router.push(`/recordings/${response.recording.id}`);
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Upload failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.2fr)_18rem] lg:p-8">
      <form className="grid gap-6" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="recording-file">
            Recording
          </label>
          <input
            id="recording-file"
            className="block w-full rounded-md border border-line bg-[#fbf8f3] px-3 py-3 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-medium file:text-panel"
            type="file"
            accept={supportedFormats.join(",")}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-sm text-muted">Supported formats: {supportedCopy}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <fieldset className="grid gap-2">
            <label className="text-sm font-medium text-ink" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              className="h-10 rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
              value={language}
              onChange={(event) => setLanguage(event.target.value as LanguageOption)}
            >
              <option value="auto">Auto detect</option>
              <option value="tl">Tagalog</option>
              <option value="en">English</option>
            </select>
          </fieldset>

          <fieldset className="grid gap-2">
            <label className="text-sm font-medium text-ink" htmlFor="processing-mode">
              Processing mode
            </label>
            <select
              id="processing-mode"
              className="h-10 rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
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
            <label className="text-sm font-medium text-ink" htmlFor="speaker-count">
              Speaker count
            </label>
            <select
              id="speaker-count"
              className="h-10 rounded-md border border-line bg-[#fbf8f3] px-3 text-sm text-ink"
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

        {error ? (
          <div className="rounded-md border border-[#d8b3ab] bg-[#f7ebe8] px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <p className="text-sm text-muted">
            Upload one recording, queue the background job, and review the
            transcript as soon as it is ready.
          </p>
          <Button disabled={submitting} type="submit">
            {submitting ? "Starting..." : "Start processing"}
          </Button>
        </div>
      </form>

      <aside className="grid content-start gap-4 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Processing notes
          </p>
          <p className="text-sm text-ink">
            Accurate mode uses the highest-quality Groq Whisper path. Fast mode
            favors lower latency and lower cost.
          </p>
        </div>
        <div className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Recording quality
          </p>
          <ul className="grid gap-2 text-sm text-muted">
            <li>Keep the source recording under 30 minutes for this milestone.</li>
            <li>Use a clean single file rather than split uploads.</li>
            <li>Speaker labels are estimated and arrive in a later milestone.</li>
          </ul>
        </div>
      </aside>
    </Card>
  );
}
