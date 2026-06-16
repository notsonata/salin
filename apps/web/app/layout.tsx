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
      <body className="page-shell text-ink antialiased">{children}</body>
    </html>
  );
}
