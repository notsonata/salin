"use client";

import { useState } from "react";
import { Download, FileDown, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Generic ExportLinks (used for transcript downloads)
// ---------------------------------------------------------------------------

export interface ExportLinkItem {
  ariaLabel: string;
  href: string;
  label: string;
}

export function ExportLinks({
  items,
  label,
}: {
  items: ExportLinkItem[];
  label: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={label} size="sm" variant="secondary">
          <Download className="text-review" />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Available exports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem asChild key={item.href}>
            <a aria-label={item.ariaLabel} href={item.href}>
              {item.label.includes("PDF") ? (
                <FileDown className="text-attention" />
              ) : (
                <FileText className="text-review" />
              )}
              <span>{item.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// NotesExportLinks — Markdown→HTML→PDF via /api/export/pdf
// ---------------------------------------------------------------------------

export interface ExportUrls {
  /** URL for the .md flat-file download (served by FastAPI) */
  md: string;
  /** URL for the .txt flat-file download (served by FastAPI) */
  txt: string;
}

export interface NotesExportContent {
  /** Current markdown from the editor (may be unsaved draft) */
  notesMarkdown: string;
  /** Transcript already formatted as markdown lines */
  transcriptMarkdown: string;
  /** Recording title — used as PDF document title and filename stem */
  recordingName: string;
}

async function triggerPdfDownload(
  markdown: string,
  title: string,
  filename: string,
) {
  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown, title, filename }),
  });

  if (!response.ok) {
    throw new Error("PDF generation failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function NotesExportLinks({
  notesUrls,
  combinedUrls,
  content,
  label,
}: {
  notesUrls: ExportUrls;
  combinedUrls: ExportUrls;
  content: NotesExportContent;
  label: string;
}) {
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const urls = includeTranscript ? combinedUrls : notesUrls;

  async function handlePdfExport() {
    setPdfError(null);
    setPdfLoading(true);
    try {
      const markdown = includeTranscript
        ? `${content.notesMarkdown}\n\n---\n\n## Transcript\n\n${content.transcriptMarkdown}`
        : content.notesMarkdown;
      const suffix = includeTranscript ? "combined" : "notes";
      const stem = content.recordingName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
      const filename = `${stem}-${suffix}.pdf`;
      await triggerPdfDownload(markdown, content.recordingName, filename);
    } catch {
      setPdfError("PDF export failed. Try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={label} size="sm" variant="notes">
          <Download className="text-accent" />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Export notes</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a aria-label="Export to Markdown" href={urls.md} download>
            <FileText className="text-accent" />
            <span>Export to Markdown</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a aria-label="Export to Text" href={urls.txt} download>
            <FileText className="text-accent" />
            <span>Export to Text</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem
          aria-label="Export to PDF"
          disabled={pdfLoading}
          onSelect={(e) => {
            e.preventDefault();
            void handlePdfExport();
          }}
        >
          {pdfLoading ? (
            <Loader2 className="animate-spin text-attention" />
          ) : (
            <FileDown className="text-attention" />
          )}
          <span>{pdfLoading ? "Generating PDF…" : "Export to PDF"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={includeTranscript}
          onCheckedChange={setIncludeTranscript}
          onSelect={(e) => e.preventDefault()}
        >
          Export Transcript
        </DropdownMenuCheckboxItem>

        {pdfError ? (
          <p className="px-2 py-1 text-xs text-danger">{pdfError}</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
