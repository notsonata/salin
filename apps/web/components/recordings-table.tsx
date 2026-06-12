import Link from "next/link";

import type { RecordingListItemSummary } from "@salin/shared";

import { Card } from "@/components/ui/card";

function stageCopy(stage: RecordingListItemSummary["job"]["stage"]) {
  switch (stage) {
    case "uploaded":
      return "Queued";
    case "preprocessing":
      return "Preprocessing";
    case "transcribing":
      return "Transcribing";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function formatUpdatedAt(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecordingsTable({
  error,
  loading,
  rows,
}: {
  error: string | null;
  loading: boolean;
  rows: RecordingListItemSummary[];
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="font-mono text-xl tracking-[-0.04em] text-ink">
          Recent recordings
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Reopen in-flight or completed work quickly. The dashboard stays useful
          after the first upload instead of disappearing behind one detail page.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="px-5 py-8">
            <p className="text-sm font-medium text-ink">Loading recent recordings...</p>
          </div>
        ) : error ? (
          <div className="px-5 py-8">
            <p className="text-sm font-medium text-ink">Could not load recent recordings.</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        ) : rows.length ? (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#f7f2ea] text-left">
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 font-medium">Filename</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Language</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-line last:border-b-0" key={row.recording.id}>
                  <td className="px-5 py-4 font-medium text-ink">{row.recording.filename}</td>
                  <td className="px-5 py-4 text-muted">{stageCopy(row.job.stage)}</td>
                  <td className="px-5 py-4 text-muted">{row.recording.language}</td>
                  <td className="px-5 py-4 text-muted">
                    <time dateTime={row.recording.updated_at}>
                      {formatUpdatedAt(row.recording.updated_at)}
                    </time>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
                      href={`/recordings/${row.recording.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-8">
            <p className="text-sm font-medium text-ink">No recordings yet.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Your completed, in-flight, and failed recordings will appear here
              after the first upload.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
