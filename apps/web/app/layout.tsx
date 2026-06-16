import type { Metadata } from "next";
import Link from "next/link";
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
      <body className="bg-canvas text-ink antialiased">
        <div className="mx-auto min-h-screen max-w-[1240px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <Link
              className="inline-flex h-9 items-center rounded-md px-1 text-lg font-semibold text-ink"
              href="/"
            >
              Salin
            </Link>
            <nav
              aria-label="Primary"
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <Link
                className="inline-flex h-9 items-center rounded-md px-3 font-medium text-muted transition-colors hover:bg-accentFaint hover:text-accent"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-reviewSoft bg-reviewFaint px-3 font-medium text-review transition-colors hover:bg-reviewSoft"
                href="/preview/recording"
              >
                Preview workspace
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
