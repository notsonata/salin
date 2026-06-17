"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  GridFour,
  Stack,
  Tag,
  List,
  X,
  Note,
  Calendar,
  Brain,
  ArrowRight,
  PlayCircle,
  Tray,
  CalendarBlank,
  Star,
  PlusCircle,
  Bell,
  ClockCounterClockwise,
  FileText,
  CaretRight,
  Kanban,
  Table,
  DotsThree,
  Fire,
  MagicWand,
  TextAa,
  Images,
  Code,
  ArrowLeft,
  SquaresFour,
  Briefcase,
  Plant,
  CloudArrowUp,
  Notepad,
  FileArrowDown,
  ShieldCheck,
  Translate,
  FilePdf,
} from "@phosphor-icons/react";
import { LandingPreview } from "@/components/landing-preview";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="bg-[#FAFAF9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] text-stone-900 font-sans antialiased overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900 min-h-screen">
      {/* Desktop Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] group/header hidden lg:block w-full max-w-5xl px-6">
        <div className="flex flex-col gap-3">
          <nav className="h-20 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-4 shadow-2xl transition-all duration-500 group-hover/header:-translate-y-1">
            <div className="flex items-center gap-4">
              <Link href="/" className="relative group/logo">
                <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-lg group-hover/logo:rotate-[360deg] transition-transform duration-1000">
                  <Image src="/icon/Salin.png" alt="Salin" width={48} height={48} className="object-cover" />
                </div>
              </Link>
              <div className="h-8 w-px bg-white/10 mx-2"></div>
              <div className="flex items-center gap-6">
                <a
                  href="#features"
                  className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <GridFour weight="bold" />
                  Product
                </a>
                <a
                  href="#workflow"
                  className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <Stack weight="bold" />
                  Workflow
                </a>

              </div>
            </div>

            <div className="flex items-center gap-3">

              <Link
                href="/dashboard"
                className="bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-white hover:text-emerald-600 transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] active:scale-95"
              >
                Get Salin
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <nav className="lg:hidden fixed top-6 left-6 right-6 z-[100] h-16 bg-stone-950/90 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-6 shadow-2xl">
        <Link href="/">
          <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center">
            <Image src="/icon/Salin.png" alt="Salin" width={32} height={32} className="object-cover" />
          </div>
        </Link>
        <div className="flex gap-6 text-stone-400">
          <Link href="#features">
            <GridFour className="text-xl hover:text-white transition" />
          </Link>
          <Link href="#workflow">
            <Stack className="text-xl hover:text-white transition" />
          </Link>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white"
        >
          <List weight="bold" className="text-lg" />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-4 bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 z-[110] p-8 flex flex-col transition-all duration-500 ease-out md:hidden">
          <div className="flex justify-between items-center mb-12">
            <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center">
              <Image src="/icon/Salin.png" alt="Salin" width={40} height={40} className="object-cover" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-900"
            >
              <X weight="bold" className="text-xl" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-4xl font-serif text-stone-950 hover:italic"
            >
              Product
            </a>
            <a
              href="#workflow"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-4xl font-serif text-stone-950 hover:italic"
            >
              Workflow
            </a>
          </div>

          <div className="mt-auto space-y-4">
            <Link href="/dashboard" className="w-full bg-stone-950 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center">
              Get Salin
            </Link>
          </div>
        </div>
      )}

      <main>
        {/* HERO SECTION */}
        <section className="min-h-[90vh] flex flex-col justify-center pt-32 pb-12 px-6 lg:pt-40 relative overflow-hidden bg-transparent">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-200/20 blur-[120px] rounded-full -z-10 animate-float pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center z-10 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 shadow-sm mb-8 hover:border-emerald-200 transition duration-300 cursor-default">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-stone-600">
                Tagalog, English & Taglish Support
              </span>
            </div>

            <h1 className="font-serif text-6xl md:text-8xl text-stone-900 leading-[0.9] md:leading-[1.1] mb-8">
              From raw recording <br className="hidden md:block" />
              to <span className="italic text-stone-500">reviewed</span> notes.
            </h1>

            <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Salin turns audio into timestamped transcripts, editable speaker
              labels, structured notes, and clean exports without the noise of a
              live meeting bot.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="bg-stone-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-stone-800 transition shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300 flex items-center gap-2 group"
              >
                Open workspace
                <ArrowRight
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

          {/* Hero Mockup */}
          <LandingPreview />
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 px-6 overflow-hidden bg-transparent">
          <div className="max-w-7xl mx-auto rounded-3xl bg-stone-50 border border-stone-200 p-8 md:p-16 relative overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                <div className="absolute top-4 left-4 w-full h-full bg-emerald-100/50 rounded-2xl transform rotate-3 -z-10 transition group-hover:rotate-6"></div>
                <div className="rounded-2xl shadow-xl border border-stone-200 bg-white w-full h-[450px] overflow-hidden p-8 relative transform -rotate-1 group-hover:rotate-0 transition duration-500">
                  <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold text-stone-900">
                      Export Notes
                    </h2>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 uppercase">
                      Action
                    </span>
                  </div>

                  <div className="space-y-6">
                    <p className="text-sm text-stone-600 leading-relaxed">
                      Download your reviewed insights directly to your knowledge base.
                    </p>

                    <ul className="space-y-3">
                      <li className="flex items-center justify-between p-3 border border-stone-100 rounded-lg hover:bg-stone-50 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FileText weight="fill" className="text-blue-500 text-xl" />
                          <span className="text-sm font-medium text-stone-700">
                            Transcript Text
                          </span>
                        </div>
                        <FileArrowDown weight="bold" className="text-stone-400" />
                      </li>
                      <li className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Notepad weight="fill" className="text-emerald-500 text-xl" />
                          <span className="text-sm font-bold text-emerald-900">
                            Structured Notes
                          </span>
                        </div>
                        <FileArrowDown weight="bold" className="text-emerald-600" />
                      </li>
                      <li className="flex items-center justify-between p-3 border border-stone-100 rounded-lg hover:bg-stone-50 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FilePdf weight="fill" className="text-rose-500 text-xl" />
                          <span className="text-sm font-medium text-stone-700">
                            Combined Handoff
                          </span>
                        </div>
                        <FileArrowDown weight="bold" className="text-stone-400" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-2 block">
                  Truth in Transcription
                </span>
                <h2 className="font-serif text-5xl mb-6 text-stone-900 leading-tight">
                  Ground every insight in the original audio.
                </h2>
                <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                  Salin treats your transcript as the ultimate source of truth. Your structured notes are generated directly from the reviewed transcript—not the raw audio—ensuring every detail remains completely verifiable.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MagnifyingGlass
                      weight="fill"
                      className="text-xl text-stone-400 mt-1"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Instant playback
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Click any timestamp to jump straight to that exact moment in the recording.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      weight="fill"
                      className="text-xl text-stone-400 mt-1"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Smart speaker tracking
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Get a helpful head start with automatically estimated speaker labels that are easy to adjust.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Translate
                      weight="fill"
                      className="text-xl text-stone-400 mt-1"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        Built for Taglish
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Seamlessly transcribe Tagalog, English, and natural conversational Taglish.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-24 px-6 bg-transparent">
          <div className="max-w-7xl mx-auto rounded-3xl p-4 md:p-0 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4 flex flex-col justify-center order-2 lg:order-1">
                <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-2 block">
                  How it works
                </span>
                <h2 className="font-serif text-5xl mb-4 text-stone-900 leading-tight">
                  A simpler path to perfect notes.
                </h2>
                <p className="text-stone-600 mb-8 leading-relaxed">
                  The best tools get out of your way. Salin keeps your workflow entirely focused and friction-free across four clear steps: upload, review, generate, and export.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-stone-900 font-bold border-b-2 border-stone-900 hover:text-emerald-600 hover:border-emerald-600 transition pb-1 w-fit"
                >
                  Start uploading <ArrowRight weight="bold" />
                </Link>
              </div>

              {/* Bento Grid */}
              <div className="lg:col-span-8 grid grid-cols-2 gap-4 order-1 lg:order-2">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 col-span-2 md:col-span-1 hover:shadow-lg transition duration-300">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                    <CloudArrowUp weight="fill" className="text-2xl" />
                  </div>
                  <h4 className="font-bold text-lg text-stone-900 mb-2">Upload</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Send one supported audio or video file into the processing queue.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 col-span-2 md:col-span-1 hover:shadow-lg transition duration-300">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                    <FileText weight="fill" className="text-2xl" />
                  </div>
                  <h4 className="font-bold text-lg text-stone-900 mb-2">Review</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Search timestamped transcript blocks and click back into the audio.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 col-span-2 md:col-span-1 hover:shadow-lg transition duration-300">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                    <Notepad weight="fill" className="text-2xl" />
                  </div>
                  <h4 className="font-bold text-lg text-stone-900 mb-2">Notes</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Generate structured notes natively from your saved transcript data.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 col-span-2 md:col-span-1 hover:shadow-lg transition duration-300">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-6">
                    <FileArrowDown weight="fill" className="text-2xl" />
                  </div>
                  <h4 className="font-bold text-lg text-stone-900 mb-2">Export</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Download transcript, notes, or a combined handoff packet securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Salin.</p>
          <p>App Dev 2026</p>
        </div>
      </footer>
    </div>
  );
}
