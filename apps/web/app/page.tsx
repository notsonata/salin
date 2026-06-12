"use client";

import { useEffect, useState } from "react";

import type { RecordingListItemSummary } from "@salin/shared";

import { DashboardUploadComposer } from "@/components/dashboard-upload-composer";
import { RecordingsTable } from "@/components/recordings-table";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();

export default function HomePage() {
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
    <main className="grid gap-8">
      <section className="grid gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Dashboard
        </p>
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <h1 className="max-w-4xl font-mono text-3xl tracking-[-0.05em] text-ink">
            Start a new recording, then reopen every transcript and notes session
            from one home surface.
          </h1>
          <p className="max-w-[24rem] text-sm leading-6 text-muted">
            Upload remains first. Recent recordings stay close enough to reopen,
            monitor, or resume without getting trapped in a one-off page.
          </p>
        </div>
      </section>

      <DashboardUploadComposer />
      <RecordingsTable error={error} loading={loading} rows={rows} />
    </main>
  );
}
