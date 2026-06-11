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
      <body className="bg-canvas text-ink">
        <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <div className="grid gap-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Salin
              </p>
              <h1 className="text-lg font-semibold text-ink">
                Uploaded recording workspace
              </h1>
            </div>
            <p className="text-sm text-muted">Groq transcript pipeline, local single-user mode</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
