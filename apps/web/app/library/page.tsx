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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null);

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

  async function deleteRecording(recordingId: string, filename: string) {
    const confirmed = window.confirm(
      `Delete ${filename}? This removes the session from your library.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingRecordingId(recordingId);
    setDeleteError(null);
    try {
      await apiClient.deleteRecording(recordingId);
      setRows((currentRows) =>
        currentRows.filter((row) => row.recording.id !== recordingId),
      );
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Could not delete recording.",
      );
    } finally {
      setDeletingRecordingId(null);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-8 pb-10">
        <RecordingsTable
          deleteError={deleteError}
          deletingRecordingId={deletingRecordingId}
          error={error}
          loading={loading}
          rows={rows}
          onDeleteRecording={deleteRecording}
        />
      </div>
    </AppShell>
  );
}
