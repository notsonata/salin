"use client";

import { useEffect, useState } from "react";

import type { RecordingListItemSummary } from "@salin/shared";

import { DashboardUploadComposer } from "@/components/dashboard-upload-composer";
import { RecordingsTable } from "@/components/recordings-table";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();

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
    <main className="grid gap-5">
      <section className="grid gap-2 border-l-4 border-accent px-4">
        <p className="font-mono text-[11px] uppercase text-accent">Dashboard</p>
        <h1 className="text-2xl font-semibold text-ink">Upload and review recordings</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Start a processing job, reopen existing recordings, and continue
          transcript or notes review from one working surface.
        </p>
      </section>
      <DashboardUploadComposer />
      <RecordingsTable error={error} loading={loading} rows={rows} />
    </main>
  );
}
