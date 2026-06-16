import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  NotebookPen,
  Play,
  UploadCloud,
  UserRound,
} from "lucide-react";

const workflow = [
  {
    title: "Upload",
    copy: "Add one lecture, interview, podcast, or discussion recording.",
    icon: UploadCloud,
    cardClass: "border-accentSoft bg-accentFaint",
    chipClass: "bg-accentSoft text-accent",
  },
  {
    title: "Review",
    copy: "Read timestamped transcript blocks and jump back to the audio.",
    icon: FileText,
    cardClass: "border-reviewSoft bg-reviewFaint",
    chipClass: "bg-reviewSoft text-review",
  },
  {
    title: "Shape notes",
    copy: "Generate summaries, decisions, action items, and questions.",
    icon: NotebookPen,
    cardClass: "border-notesSoft bg-notesFaint",
    chipClass: "bg-notesSoft text-notes",
  },
  {
    title: "Export",
    copy: "Download transcript, notes, or a combined file after review.",
    icon: Download,
    cardClass: "border-attentionSoft bg-attentionFaint",
    chipClass: "bg-attentionSoft text-attention",
  },
];

const transcriptPreview = [
  {
    time: "00:00",
    speaker: "Speaker 1",
    text: "Good morning everyone, today pag-uusapan natin yung structure ng research interview.",
  },
  {
    time: "00:05",
    speaker: "Speaker 2",
    text: "Sir, kailangan po ba exact yung questions or pwede siyang conversational?",
  },
  {
    time: "00:11",
    speaker: "Speaker 1",
    text: "Conversational is okay, basta consistent yung goal and easy to verify later.",
  },
];

export default function HomePage() {
  return (
    <main className="grid gap-6">
      <section className="overflow-hidden rounded-lg bg-brandDeep text-panel shadow-panel">
        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_29rem] lg:items-center lg:p-8">
          <div className="grid gap-5">
            <div className="grid gap-3">
              <p className="font-mono text-[11px] uppercase text-accentSoft">
                Uploaded recording workspace
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Review recordings faster without losing the original audio.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-brandMuted">
                Salin turns uploaded Tagalog, English, and Taglish recordings
                into timestamped transcripts, editable speaker labels,
                structured notes, and clean exports.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accentSoft px-4 text-sm font-medium text-brandDeep transition-colors hover:bg-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentSoft"
                href="/dashboard"
              >
                Open dashboard
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-brandLine px-4 text-sm font-medium text-panel transition-colors hover:bg-brandPanel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentSoft"
                href="/preview/recording"
              >
                Preview workspace
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-brandLine bg-brandPanel p-3">
            <div className="rounded-md border border-accentSoft bg-panel p-4 text-ink">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    taglish-lecture-preview.mp3
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Transcript ready - speaker labels estimated
                  </p>
                </div>
                <span className="inline-flex h-8 items-center gap-2 rounded-md bg-reviewSoft px-3 text-xs font-medium text-review">
                  <Play aria-hidden="true" className="h-3.5 w-3.5" />
                  24:18
                </span>
              </div>
              <div className="grid gap-3 pt-3">
                {transcriptPreview.map((segment) => (
                  <div
                    className="grid gap-3 rounded-md border border-line bg-field p-3 sm:grid-cols-[4rem_minmax(0,1fr)]"
                    key={segment.time}
                  >
                    <span className="font-mono text-xs text-review">
                      {segment.time}
                    </span>
                    <div className="grid gap-1">
                      <p className="text-xs font-medium text-muted">
                        {segment.speaker} - estimated
                      </p>
                      <p className="text-sm leading-6 text-ink">{segment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {workflow.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              className={`rounded-lg border p-4 shadow-panel ${step.cardClass}`}
              key={step.title}
            >
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${step.chipClass}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
              </div>
              <p className="mt-4 font-mono text-xs text-muted">
                {(index + 1).toString().padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-base font-semibold text-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.copy}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 rounded-lg border border-reviewSoft bg-reviewFaint p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold text-ink">
            Built for review, not live meetings.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Upload a finished recording, wait for processing, then work through
            transcript, audio verification, notes, speaker correction, and export
            in a focused workspace.
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-panel px-3 py-2">
            <FileText aria-hidden="true" className="h-4 w-4 text-review" />
            Timestamped transcript
          </div>
          <div className="flex items-center gap-2 rounded-md bg-panel px-3 py-2">
            <UserRound aria-hidden="true" className="h-4 w-4 text-accent" />
            Editable estimated speakers
          </div>
          <div className="flex items-center gap-2 rounded-md bg-panel px-3 py-2">
            <NotebookPen aria-hidden="true" className="h-4 w-4 text-notes" />
            Notes from saved transcript data
          </div>
          <div className="flex items-center gap-2 rounded-md bg-panel px-3 py-2">
            <Download aria-hidden="true" className="h-4 w-4 text-attention" />
            Transcript and notes exports
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">Ready to try the workflow?</p>
          <p className="mt-1 text-sm text-muted">
            Open the dashboard to upload a recording, or use the preview while
            the backend is offline.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-panel transition-colors hover:bg-[#22564f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          href="/dashboard"
        >
          Go to dashboard
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
