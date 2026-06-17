"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, FileAudio2, Link2, Loader2, Sparkles, UploadCloud } from "lucide-react";

import type { LanguageOption, ProcessingMode, SpeakerCount } from "@salin/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();
const supportedFormats = [".mp3", ".wav", ".m4a", ".aac", ".mp4", ".mov", ".webm"];
type RecordingSource = "file" | "youtube";

function SelectField({
  ariaLabel,
  children,
  label,
  value,
  onValueChange,
}: {
  ariaLabel: string;
  children: ReactNode;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </label>
  );
}

export function DashboardUploadComposer() {
  const [source, setSource] = useState<RecordingSource>("file");
  const [language, setLanguage] = useState<LanguageOption>("auto");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("accurate");
  const [speakerCount, setSpeakerCount] = useState<SpeakerCount>("auto");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedCopy = useMemo(() => supportedFormats.join(", "), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (source === "file" && !file) {
      setError("Choose a recording before starting processing.");
      return;
    }
    if (source === "youtube" && !youtubeUrl.trim()) {
      setError("Paste a YouTube video link before importing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response =
        source === "youtube"
          ? await apiClient.importYouTubeRecording({
              url: youtubeUrl.trim(),
              language,
              processing_mode: processingMode,
              speaker_count: speakerCount,
            })
          : await apiClient.createRecording({
              file: file as File,
              language,
              processing_mode: processingMode,
              speaker_count: speakerCount,
            });
      window.location.assign(`/workspace/${response.recording.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Upload failed.",
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4" id="new-recording">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Upload deck
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            New recording
          </h2>
        </div>

      </div>

      <Card className="overflow-hidden" data-testid="dashboard-command-deck">
        <form className="grid gap-0" onSubmit={onSubmit}>
          <div className="grid gap-6 border-b border-line/80 px-5 py-5 lg:px-6">
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-accentSoft bg-accentFaint text-accent">
                  {source === "youtube" ? (
                    <Link2 className="h-5 w-5" />
                  ) : (
                    <UploadCloud className="h-5 w-5" />
                  )}
                </span>
                <div className="grid gap-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                    Choose your recording source
                  </h3>
                  <p className="max-w-2xl text-sm leading-6 text-muted">
                    Upload a local recording or import audio from a public YouTube video. Both paths open the same transcript and notes workspace.
                  </p>
                </div>
              </div>

              <Tabs
                className="grid gap-4"
                value={source}
                onValueChange={(value) => {
                  setSource(value as RecordingSource);
                  setError(null);
                }}
              >
                <TabsList aria-label="Recording source" className="w-fit">
                  <TabsTrigger value="file">
                    <FileAudio2 className="h-4 w-4" />
                    File upload
                  </TabsTrigger>
                  <TabsTrigger value="youtube">
                    <Link2 className="h-4 w-4" />
                    YouTube URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent className="mt-0" value="file">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-ink">Recording</span>
                    <Input
                      accept={supportedFormats.join(",")}
                      aria-label="Recording"
                      className="h-auto min-h-12 px-3 py-2 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-panel file:hover:opacity-95"
                      data-testid="upload-file-field"
                      type="file"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-sm text-muted">Supported formats: {supportedCopy}</p>
                  </label>
                </TabsContent>

                <TabsContent className="mt-0" value="youtube">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-ink">YouTube video link</span>
                    <Input
                      aria-label="YouTube video link"
                      data-testid="youtube-url-field"
                      inputMode="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      type="url"
                      value={youtubeUrl}
                      onChange={(event) => setYoutubeUrl(event.target.value)}
                    />
                    <p className="text-sm text-muted">
                      Public single-video links only. Salin imports the audio, then processes it like an uploaded recording.
                    </p>
                  </label>
                </TabsContent>
              </Tabs>
            </div>


          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end lg:px-6">
            <SelectField
              ariaLabel="Language"
              label="Language"
              value={language}
              onValueChange={(value) => setLanguage(value as LanguageOption)}
            >
              <SelectItem value="auto">Auto detect</SelectItem>
              <SelectItem value="tl">Tagalog</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectField>

            <SelectField
              ariaLabel="Processing mode"
              label="Processing mode"
              value={processingMode}
              onValueChange={(value) => setProcessingMode(value as ProcessingMode)}
            >
              <SelectItem value="accurate">Accurate</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
            </SelectField>

            <SelectField
              ariaLabel="Speaker count"
              label="Speaker count"
              value={speakerCount}
              onValueChange={(value) => setSpeakerCount(value as SpeakerCount)}
            >
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5_plus">5+</SelectItem>
            </SelectField>

            <Button className="lg:min-w-[11rem]" disabled={submitting} type="submit" variant="accent">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  {source === "youtube" ? (
                    <Link2 className="h-4 w-4" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {source === "youtube" ? "Import link" : "Start processing"}
                </>
              )}
            </Button>
          </div>

          {error ? (
            <div className="px-5 pb-5 lg:px-6">
              <div className="flex items-start gap-3 rounded-xl border border-dangerSoft bg-dangerFaint px-4 py-3 text-sm text-danger">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="px-5 pb-5 lg:px-6">
            <Separator />
          </div>

          <div className="flex flex-col gap-3 px-5 pb-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-start gap-3 rounded-xl border border-line/80 bg-canvas px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-accent" />
              <p className="max-w-2xl text-sm leading-6 text-muted">
                {source === "youtube"
                  ? "Great for presentation clips and public recordings. The worker downloads audio first, then the review desk opens as usual."
                  : "Best with one clean source file. The review desk opens as soon as the transcript becomes usable."}
              </p>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
