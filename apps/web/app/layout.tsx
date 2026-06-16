import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { SalinLogo } from "@/components/salin-logo";
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
        <div className="min-h-screen">
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <Link
                className="inline-flex items-center gap-3 rounded-lg px-1 text-ink"
                href="/"
              >
                <SalinLogo className="shrink-0 shadow-panel" />
                <span className="grid gap-0.5">
                  <span className="text-base font-semibold leading-5">
                    Salin
                  </span>
                  <span className="hidden text-xs text-muted sm:inline">
                    Recording review workspace
                  </span>
                </span>
              </Link>
              <AppNav />
            </div>
          </header>
          <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
