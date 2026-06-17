"use client";

import { useRef, useState } from "react";
import { CloudArrowUp, Books } from "@phosphor-icons/react";

import type { RecordingDetailResponse, RecordingListItemSummary, TranscriptSegment } from "@salin/shared";

import { DashboardUploadComposer } from "@/components/dashboard-upload-composer";
import { RecordingDetailHeader } from "@/components/recording-detail-header";
import { RecordingsTable } from "@/components/recordings-table";
import { TranscriptPanel } from "@/components/transcript-panel";

const mockData: RecordingDetailResponse = {
  recording: {
    id: "preview-1",
    filename: "Review: Q3 Planning Call",
    content_type: "audio/mp3",
    file_size: 1024 * 1024 * 5,
    language: "auto",
    processing_mode: "fast",
    speaker_count: "auto",
    created_at: "2024-06-17T10:00:00.000Z",
    updated_at: "2024-06-17T10:00:00.000Z",
  },
  job: {
    id: "job-1",
    recording_id: "preview-1",
    last_provider: "groq",
    stage: "completed",
    retryable: false,
    retry_count: 0,
    created_at: "2024-06-17T10:00:00.000Z",
    updated_at: "2024-06-17T10:05:00.000Z",
    started_at: "2024-06-17T10:01:00.000Z",
    completed_at: "2024-06-17T10:05:00.000Z",
    error_message: null,
  },
  notes: {
    status: "idle",
    content: null,
    error_message: null,
    source_provider: null,
    generation_count: 0,
    started_at: null,
    completed_at: null,
    updated_at: null,
  },
  transcript_segments: [
    {
      id: "seg-1",
      recording_id: "preview-1",
      index: 0,
      start_ms: 5000,
      end_ms: 15000,
      speaker_label: "Speaker 1",
      speaker_estimated: true,
      source_provider: "groq",
      text: "Kailangan natin i-review yung second answer before notes.",
    },
    {
      id: "seg-2",
      recording_id: "preview-1",
      index: 1,
      start_ms: 18000,
      end_ms: 25000,
      speaker_label: "Speaker 2",
      speaker_estimated: true,
      source_provider: "groq",
      text: "Yes, keep the Taglish example tied to the timestamp.",
    },
    {
      id: "seg-3",
      recording_id: "preview-1",
      index: 2,
      start_ms: 34000,
      end_ms: 42000,
      speaker_label: "Teacher",
      speaker_estimated: true,
      source_provider: "groq",
      text: "Mark this part for the summary and export later.",
    },
  ],
};

const mockList: RecordingListItemSummary[] = [
  {
    recording: {
      id: "preview-1",
      filename: "Review: Q3 Planning Call",
      content_type: "audio/mp3",
      file_size: 1024 * 1024 * 5,
      language: "auto",
      processing_mode: "fast",
      speaker_count: "auto",
      created_at: "2024-06-17T10:00:00.000Z",
      updated_at: "2024-06-17T10:00:00.000Z",
    },
    job: {
      id: "job-1",
      recording_id: "preview-1",
      stage: "completed",
      retryable: false,
      retry_count: 0,
      error_message: null,
      last_provider: "groq",
      created_at: "2024-06-17T10:00:00.000Z",
      updated_at: "2024-06-17T10:05:00.000Z",
      started_at: "2024-06-17T10:01:00.000Z",
      completed_at: "2024-06-17T10:05:00.000Z",
    },
    notes: {
      status: "completed",
      content: null,
      error_message: null,
      source_provider: null,
      generation_count: 1,
      started_at: null,
      completed_at: null,
      updated_at: null,
    },
  },
  {
    recording: {
      id: "preview-2",
      filename: "User Interview - Alex",
      content_type: "audio/mp3",
      file_size: 1024 * 1024 * 5,
      language: "auto",
      processing_mode: "fast",
      speaker_count: "auto",
      created_at: "2024-06-17T09:00:00.000Z",
      updated_at: "2024-06-17T09:00:00.000Z",
    },
    job: {
      id: "job-2",
      recording_id: "preview-2",
      stage: "transcribing",
      retryable: false,
      retry_count: 0,
      error_message: null,
      last_provider: "groq",
      created_at: "2024-06-17T09:00:00.000Z",
      updated_at: "2024-06-17T09:05:00.000Z",
      started_at: "2024-06-17T09:01:00.000Z",
      completed_at: null,
    },
    notes: {
      status: "idle",
      content: null,
      error_message: null,
      source_provider: null,
      generation_count: 0,
      started_at: null,
      completed_at: null,
      updated_at: null,
    },
  },
];

export function LandingPreview() {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "workspace">("workspace");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="mt-16 md:mt-24 max-w-6xl mx-auto relative perspective-1000 w-full mb-12 md:mb-24 px-4 sm:px-6 lg:px-8">
      <div className="relative group">
        <div className="rounded-2xl md:rounded-[2rem] border border-stone-200 bg-white/50 backdrop-blur-xl shadow-2xl p-2 md:p-3 transform transition duration-1000 hover:scale-[1.01]">
          <div className="bg-white rounded-xl overflow-hidden shadow-inner border border-stone-100 relative">
            {/* Browser Bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/80">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
              </div>
              <div className="mx-auto hidden sm:block bg-white border border-stone-200 rounded px-3 text-[10px] text-stone-400 py-1 w-64 text-center font-sans font-medium">
                salin.app/workspace
              </div>
            </div>

            {/* App Shell Mockup */}
            <div className="flex h-[500px] md:h-[650px] w-full bg-canvas bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] relative">
              {/* Sidebar */}
              <div className="hidden md:flex w-[15.5rem] shrink-0 border-r border-line bg-panel flex-col shadow-sm z-10">
                <div className="border-b border-line px-5 py-5">
                  <div className="inline-flex items-center gap-3 group">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-900 shadow-sm transition-transform group-hover:scale-105">
                      <span className="font-serif text-xl font-bold">S</span>
                    </span>
                    <span className="grid gap-0.5">
                      <span className="font-serif text-2xl text-ink tracking-tight pt-1">
                        Salin
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="grid gap-8 px-4 py-5">
                    <div className="grid gap-3">
                      <p className="px-3 font-sans font-semibold text-[10px] uppercase tracking-[0.18em] text-muted">
                        Dashboard
                      </p>
                      <nav aria-label="Primary" className="grid gap-1">
                        <div 
                          className={`flex items-center h-10 justify-start gap-3 px-3 transition-all rounded-md text-sm cursor-pointer ${activeView === "dashboard" ? "bg-accent text-panel" : "border-transparent bg-transparent text-muted hover:bg-stone-100 hover:text-ink"}`}
                          onClick={() => setActiveView("dashboard")}
                        >
                          <CloudArrowUp weight={activeView === "dashboard" ? "fill" : "bold"} className="h-4 w-4" />
                          <span className="font-medium">Upload</span>
                        </div>
                        <div 
                          className={`flex items-center h-10 justify-start gap-3 px-3 transition-all rounded-md text-sm cursor-pointer ${activeView === "workspace" ? "bg-accent text-panel" : "border-transparent bg-transparent text-muted hover:bg-stone-100 hover:text-ink"}`}
                          onClick={() => setActiveView("workspace")}
                        >
                          <Books weight={activeView === "workspace" ? "fill" : "bold"} className="h-4 w-4" />
                          <span className="font-medium">Workspace</span>
                        </div>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 bg-panel flex flex-col h-full overflow-hidden">
                <div className="h-full overflow-hidden p-4 md:p-8 flex flex-col gap-6 pointer-events-none md:pointer-events-auto">
                  {activeView === "dashboard" ? (
                    <div className="grid gap-8 pb-10 max-w-4xl">
                      <div className="pointer-events-none">
                        <DashboardUploadComposer />
                      </div>
                    </div>
                  ) : (
                    <div onClickCapture={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('a')) {
                        e.preventDefault();
                      }
                    }}>
                      <div className="flex flex-col gap-6">
                        <RecordingDetailHeader
                        data={mockData}
                        renaming={false}
                        retrying={false}
                        allowRename={false}
                        onRename={() => Promise.resolve()}
                        onRetry={() => {}}
                      />
                      
                      <TranscriptPanel
                        activeSegmentId={activeSegmentId}
                        audioRef={audioRef}
                        canSeek={false}
                        exportLinks={[]}
                        filteredSegments={mockData.transcript_segments}
                        matchCount={0}
                        query=""
                        speakerLabels={["Speaker 1", "Speaker 2", "Teacher"]}
                        speakerMessage={null}
                        speakerSavingTarget={null}
                        onQueryChange={() => {}}
                        onRenameSpeaker={() => Promise.resolve()}
                        onSeek={(segment) => setActiveSegmentId(segment.id)}
                        onUpdateSegment={() => Promise.resolve()}
                      />
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
