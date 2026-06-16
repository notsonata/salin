"use client";

import { useEffect, useState } from "react";

import type { RecordingListItemSummary } from "@salin/shared";

import { AppShell } from "@/components/app-shell";
import { RecordingsTable } from "@/components/recordings-table";
import { createBrowserClient } from "@/lib/api";

const apiClient = createBrowserClient();

export default function LibraryPage() {
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
    <AppShell>
      <div className="grid gap-8 pb-10">
        <RecordingsTable error={error} loading={loading} rows={rows} />
      </div>
    </AppShell>
  );
}
