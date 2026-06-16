import Link from "next/link";
import { ArrowRight, AudioLines, FileText, Globe, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-line/80 bg-panel/96 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-8 items-center justify-center rounded-lg border border-accentSoft bg-accentFaint text-accent">
              <AudioLines className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-[-0.03em] text-ink">
              Salin
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Button asChild className="text-muted hover:text-ink" variant="ghost">
              <Link href="/preview/recording">Preview</Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-6xl text-balance">
              Turn recordings into structured notes.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              Salin is a recording-to-notes workspace built for Tagalog, English, and Taglish. 
              Upload your meetings, lectures, or interviews, and get a highly accurate transcript 
              and generated notes without the clutter.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild className="h-12 px-6" variant="accent">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-line/80 bg-panel py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
                A serious workspace for bilingual review
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted text-balance">
                Everything you need to study, audit, and extract usable content from mixed-language audio.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-accentSoft bg-accentFaint">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">Bilingual-native</h3>
                  <p className="mt-2 flex-auto text-base leading-7 text-muted">
                    Built natively for Taglish. No more fighting with transcription engines that can only handle one language at a time.
                  </p>
                </div>
                
                <div className="flex flex-col">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-line/80 bg-canvas">
                    <FileText className="h-5 w-5 text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">Transcript-first workflow</h3>
                  <p className="mt-2 flex-auto text-base leading-7 text-muted">
                    The transcript is the primary artifact. Read, skim, search, and correct without opening a separate player.
                  </p>
                </div>

                <div className="flex flex-col">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-line/80 bg-canvas">
                    <NotebookPen className="h-5 w-5 text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">Generated notes</h3>
                  <p className="mt-2 flex-auto text-base leading-7 text-muted">
                    Summaries, action items, and key points are generated directly from the transcript, keeping them accurate and anchored to the text.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/80 bg-canvas py-10 text-center">
        <p className="text-sm text-muted">
          Salin &copy; {new Date().getFullYear()}. Transcript console.
        </p>
      </footer>
    </div>
  );
}
