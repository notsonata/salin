import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  FileDown,
  FileText,
  Languages,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { HomeScrollReveal } from "@/components/home-scroll-reveal";
import { Button } from "@/components/ui/button";

const workflowSteps = [
  {
    icon: UploadCloud,
    title: "Upload",
    copy: "Send one supported audio or video file into the processing queue.",
  },
  {
    icon: FileText,
    title: "Review",
    copy: "Search timestamped transcript blocks and click back into the audio.",
  },
  {
    icon: NotebookPen,
    title: "Notes",
    copy: "Generate structured notes from saved transcript data.",
  },
  {
    icon: FileDown,
    title: "Export",
    copy: "Download transcript, notes, or a combined handoff packet.",
  },
];

const specimenRows = [
  {
    time: "00:00:05",
    speaker: "Speaker 1",
    text: "Kailangan natin i-review yung second answer before notes.",
  },
  {
    time: "00:00:18",
    speaker: "Speaker 2",
    text: "Yes, keep the Taglish example tied to the timestamp.",
  },
  {
    time: "00:00:34",
    speaker: "Teacher",
    text: "Mark this part for the summary and export later.",
  },
];

const proofPoints = [
  {
    icon: Search,
    title: "Evidence stays one click away",
    copy: "Clickable timestamps keep the transcript tied to the original recording.",
  },
  {
    icon: ShieldCheck,
    title: "Estimates stay honest",
    copy: "Speaker labels are useful starting points, and the UI keeps them editable.",
  },
  {
    icon: NotebookPen,
    title: "Notes stay grounded",
    copy: "Structured notes are generated from saved transcript blocks, not loose audio guesses.",
  },
];

const useCases = [
  "Lectures and class discussions",
  "Research interviews",
  "Client calls and planning sessions",
  "Podcasts and long-form conversations",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <HomeScrollReveal />
      <header className="home-nav sticky top-0 z-50 text-ink backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/">
            <span className="inline-flex size-9 items-center justify-center rounded-md border border-accentSoft bg-accentFaint text-accent">
              <AudioLines aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="grid gap-0.5">
              <span className="text-base font-semibold">Salin</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
                Transcript console
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild className="home-nav-action" variant="secondary">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section
          className="relative overflow-hidden border-b border-brandLine bg-brandDeep bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(20, 34, 47, 0.72) 0%, rgba(20, 34, 47, 0.62) 48%, rgba(20, 34, 47, 0.88) 100%), linear-gradient(90deg, rgba(20, 34, 47, 0.92) 0%, rgba(20, 34, 47, 0.78) 46%, rgba(20, 34, 47, 0.34) 100%), url('/salin-review-console.png')",
          }}
        >
          <div className="home-hero-inner mx-auto grid max-w-7xl place-items-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-center text-panel">
              <p className="mb-5 inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 font-mono text-xs uppercase text-brandMuted">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-attention" />
                Uploaded recording review
              </p>
              <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
                From raw recording to reviewed notes.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-brandMuted">
                Salin turns Tagalog, English, and Taglish recordings into timestamped
                transcripts, editable speaker labels, structured notes, and clean exports.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  className="hero-primary-cta h-12 border-accent bg-accent px-5 text-panel hover:bg-accent/95"
                  variant="accent"
                >
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mx-auto mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
                {[
                  ["Upload first", "No live meeting bot"],
                  ["Timestamped", "Click back to audio"],
                  ["Editable", "Speaker labels stay estimated"],
                ].map(([label, value]) => (
                  <div className="border-l border-white/20 pl-4" key={label}>
                    <p className="font-mono text-xs uppercase text-brandMuted">{label}</p>
                    <p className="mt-1 text-sm font-medium text-panel">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-panel py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div
              className="reveal-on-scroll overflow-hidden rounded-lg border border-line bg-panel shadow-lift"
              data-testid="home-workspace-specimen"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-field px-5 py-4">
                <div>
                  <p className="font-mono text-xs uppercase text-muted">Transcript specimen</p>
                  <h2 className="mt-1 text-2xl font-semibold">Review across languages.</h2>
                </div>
                <span className="rounded-md border border-attentionSoft bg-attentionFaint px-3 py-2 text-sm font-medium text-attention">
                  Speaker labels estimated
                </span>
              </div>
              <div className="grid divide-y divide-line">
                {specimenRows.map((row) => (
                  <article className="grid gap-4 px-5 py-5 sm:grid-cols-[7rem_1fr]" key={row.time}>
                    <div className="flex items-start">
                      <span className="rounded-md bg-brandDeep px-3 py-2 font-mono text-sm text-panel">
                        {row.time}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.speaker}</p>
                        <span className="rounded-md border border-attentionSoft bg-attentionFaint px-2 py-1 text-xs font-medium text-attention">
                          Estimated
                        </span>
                      </div>
                      <p className="mt-2 text-base leading-7 text-muted">{row.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div
              className="reveal-on-scroll reveal-delay-1 rounded-lg border border-line bg-field p-5 shadow-panel"
              data-testid="home-proof-panel"
            >
              <div>
                <p className="font-mono text-xs uppercase text-muted">Review promise</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  No dashboard noise. Just a path to verified notes.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  The homepage should sell the workflow, then let the app surface handle
                  uploads, progress, and session history.
                </p>
              </div>
              <div className="mt-5 grid gap-3">
                {proofPoints.map((point) => (
                  <div className="rounded-md border border-line bg-panel px-4 py-4" key={point.title}>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-accentSoft bg-accentFaint text-accent">
                        <point.icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">{point.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{point.copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-canvas py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase text-muted">Workflow proof</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                A cleaner path from upload to usable notes.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted">
                Editorial transcription tools are strong because the workflow is obvious.
                Salin keeps that same clarity for uploaded recordings: process, review,
                generate, export.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <div
                  className={`reveal-on-scroll rounded-lg border border-line bg-panel p-5 shadow-panel ${
                    index === 1 ? "reveal-delay-1" : index === 2 ? "reveal-delay-2" : ""
                  }`}
                  key={step.title}
                >
                  <step.icon aria-hidden="true" className="h-5 w-5 text-accent" />
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-panel py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="reveal-on-scroll">
              <p className="font-mono text-xs uppercase text-muted">Built for review</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Bilingual audio stays anchored to evidence.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted">
                The transcript remains the source of truth. Notes come from saved transcript
                blocks, and exports stay downstream from review.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border border-accentSoft bg-accentFaint px-3 py-2 text-sm font-medium text-accent">
                  <Languages aria-hidden="true" className="h-4 w-4" />
                  Tagalog, English, Taglish
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-reviewSoft bg-reviewFaint px-3 py-2 text-sm font-medium text-review">
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Searchable transcript
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-line bg-field px-3 py-2 text-sm font-medium text-ink">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4 text-success" />
                  Editable estimates
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((useCase, index) => (
                <div
                  className={`reveal-on-scroll rounded-lg border border-line bg-field p-5 ${
                    index % 2 === 1 ? "reveal-delay-1" : ""
                  }`}
                  key={useCase}
                >
                  <p className="text-base font-semibold">{useCase}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Review timestamps, speakers, notes, and exports in one workspace.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-canvas py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Salin. Uploaded recording review for transcript-first notes.</p>
          <p>Speaker labels are automatically estimated and can be edited.</p>
        </div>
      </footer>
    </div>
  );
}
