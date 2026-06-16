"use client";

import { useEffect, useState } from "react";
import { Download, FileText, NotebookPen, UploadCloud } from "lucide-react";

import type { RecordingListItemSummary } from "@salin/shared";

import { DashboardUploadComposer } from "@/components/dashboard-upload-composer";
import { RecordingsTable } from "@/components/recordings-table";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();

const workflowSignals = [
  {
    title: "Upload",
    copy: "Create one background job",
    icon: UploadCloud,
    className: "border-accentSoft bg-accentFaint text-accent",
  },
  {
    title: "Review",
    copy: "Open timestamped transcript",
    icon: FileText,
    className: "border-reviewSoft bg-reviewFaint text-review",
  },
  {
    title: "Notes",
    copy: "Generate from saved transcript",
    icon: NotebookPen,
    className: "border-notesSoft bg-notesFaint text-notes",
  },
  {
    title: "Export",
    copy: "Download TXT or PDF",
    icon: Download,
    className: "border-attentionSoft bg-attentionFaint text-attention",
  },
];

const checklist = [
  "Use one clean recording file.",
  "Long files process in retryable chunks.",
  "Speaker labels stay estimated until edited.",
];

export default function DashboardPage() {
  const [rows, setRows] = useState<RecordingListItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecordings() {
      try {
        const response = await apiClient.listRecordings();
        if (!cancelled) {
          setRows(response.recordings);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load recent recordings.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecordings();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2 border-l-4 border-accent pl-4">
          <p className="font-mono text-[11px] uppercase text-accent">
            Dashboard
          </p>
          <h1 className="max-w-3xl text-2xl font-semibold leading-tight">
            Upload, review, and export recordings from one workspace.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Start processing, track the result, reopen finished work, and
            continue review without hunting across pages.
          </p>
        </div>

        <div className="flex max-w-3xl flex-wrap gap-2 lg:justify-end">
          {workflowSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <div
                className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 shadow-panel ${signal.className}`}
                key={signal.title}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    {signal.title}
                  </span>
                  <span className="hidden text-xs text-muted sm:inline">
                    {signal.copy}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <DashboardUploadComposer />
        <aside className="grid gap-3">
          <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
            <p className="font-mono text-[11px] uppercase text-muted">
              Review quality
            </p>
            <ul className="mt-3 grid gap-3 text-sm leading-6 text-muted">
              {checklist.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-reviewSoft bg-reviewFaint p-4 shadow-panel">
            <p className="font-mono text-[11px] uppercase text-review">
              Transcript first
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Transcript blocks appear as soon as transcription is saved. Notes,
              speaker estimates, and exports stay downstream from that data.
            </p>
          </section>
        </aside>
      </section>

      <RecordingsTable error={error} loading={loading} rows={rows} />
    </main>
  );
}
