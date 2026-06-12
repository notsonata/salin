import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Salin",
  description: "Recording-to-notes workspace for uploaded recordings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#ece4d8] text-ink antialiased">
        <div className="mx-auto min-h-screen max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 grid gap-4 border-b border-[#d7ccbb] pb-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div className="grid gap-2">
              <div className="flex items-center gap-3 text-sm text-muted">
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink">
                  Salin
                </span>
                <span>Uploaded recordings</span>
              </div>
              <h1 className="font-mono text-xl tracking-[-0.04em] text-ink sm:text-2xl">
                Review the transcript, verify timestamps, and turn the recording into notes.
              </h1>
            </div>
            <p className="text-sm leading-6 text-muted">
              Groq-first transcription, normalized audio review, and manual notes generation from stored transcript data.
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
