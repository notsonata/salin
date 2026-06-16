export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-6 py-10">
      <section className="grid gap-4 rounded-xl border border-line/80 bg-panel px-6 py-8 shadow-panel sm:px-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Not found
        </p>
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">
            This page does not exist in the review console.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Return to the dashboard or open the preview workspace to keep reviewing the
            rebuilt shell.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <a className="text-accent" href="/dashboard">
            Open dashboard
          </a>
          <a className="text-ink" href="/preview/recording">
            Preview workspace
          </a>
        </div>
      </section>
    </main>
  );
}
