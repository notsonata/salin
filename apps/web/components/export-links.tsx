"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Download, FileDown, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ExportTargetLinks {
  pdfHref: string;
  txtHref: string;
}

export function ExportLinks({
  className,
  includeTranscriptTarget,
  label,
  target,
  tone = "review",
}: {
  className?: string;
  includeTranscriptTarget?: ExportTargetLinks;
  label: string;
  target: ExportTargetLinks;
  tone?: "notes" | "review";
}) {
  const accent = tone === "notes" ? "notes" : "review";

  return (
    <ExportLinksContent
      accent={accent}
      className={className}
      includeTranscriptTarget={includeTranscriptTarget}
      label={label}
      target={target}
    />
  );
}

function ExportLinksContent({
  accent,
  className,
  includeTranscriptTarget,
  label,
  target,
}: {
  accent: "notes" | "review";
  className?: string;
  includeTranscriptTarget?: ExportTargetLinks;
  label: string;
  target: ExportTargetLinks;
}) {
  const [includeTranscript, setIncludeTranscript] = useOptionalTranscriptState(
    Boolean(includeTranscriptTarget),
  );
  const resolvedTarget =
    includeTranscript && includeTranscriptTarget ? includeTranscriptTarget : target;
  const accentClasses =
    accent === "notes"
      ? {
          border: "border-notesSoft",
          faint: "bg-notesFaint",
          focus: "focus-visible:outline-notes",
          hover: "hover:bg-notesSoft",
          text: "text-notes",
        }
      : {
          border: "border-reviewSoft",
          faint: "bg-reviewFaint",
          focus: "focus-visible:outline-review",
          hover: "hover:bg-reviewSoft",
          text: "text-review",
        };

  return (
    <div
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        accentClasses.border,
        accentClasses.faint,
        className,
      )}
    >
      <span className="inline-flex h-9 items-center gap-2 px-2 font-mono text-[11px] uppercase text-muted">
        <Download aria-hidden="true" className={cn("h-4 w-4", accentClasses.text)} />
        {label}
      </span>
      {includeTranscriptTarget ? (
        <label
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-transparent bg-panel px-3 text-sm font-medium text-ink transition-colors hover:border-line focus-within:outline focus-within:outline-2 focus-within:outline-offset-2",
            accentClasses.focus,
            accentClasses.hover,
          )}
        >
          <input
            checked={includeTranscript}
            className={cn(
              "h-4 w-4 rounded border-line",
              accent === "notes" ? "accent-notes" : "accent-review",
            )}
            type="checkbox"
            onChange={(event) => setIncludeTranscript(event.target.checked)}
          />
          <span>Export Transcript</span>
        </label>
      ) : null}
      <ExportButton
        accentClasses={accentClasses}
        href={resolvedTarget.txtHref}
        icon={<FileText aria-hidden="true" className={cn("h-4 w-4", accentClasses.text)} />}
        label="Export to .txt"
      />
      <ExportButton
        accentClasses={accentClasses}
        href={resolvedTarget.pdfHref}
        icon={<FileDown aria-hidden="true" className="h-4 w-4 text-attention" />}
        label="Export to .pdf"
      />
    </div>
  );
}

function useOptionalTranscriptState(enabled: boolean) {
  const [includeTranscript, setIncludeTranscript] = useState(false);

  return [enabled ? includeTranscript : false, setIncludeTranscript] as const;
}

function ExportButton({
  accentClasses,
  href,
  icon,
  label,
}: {
  accentClasses: {
    focus: string;
    hover: string;
  };
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent bg-panel px-3 text-sm font-medium text-ink transition-colors hover:border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        accentClasses.focus,
        accentClasses.hover,
      )}
      href={href}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
