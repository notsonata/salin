import { UploadForm } from "@/components/upload-form";

export default function HomePage() {
  return (
    <main className="grid gap-6">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Upload
        </p>
        <p className="max-w-3xl text-sm text-muted">
          Upload one Tagalog, English, or Taglish recording, persist the job,
          and open the transcript workspace as soon as the background pipeline
          finishes.
        </p>
      </div>
      <UploadForm />
    </main>
  );
}
