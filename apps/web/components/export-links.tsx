import { Download, FileDown, FileText, Layers2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ExportLinkItem {
  ariaLabel: string;
  href: string;
  label: string;
}

export function ExportLinks({
  className,
  items,
  label,
}: {
  className?: string;
  items: ExportLinkItem[];
  label: string;
}) {
  if (!items.length) {
    return null;
  }

  const notesExport = items.some(
    (item) => item.label.includes("Notes") || item.label.includes("Combined"),
  );

  return (
    <div
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
        notesExport ? "border-notesSoft bg-notesFaint" : "border-reviewSoft bg-reviewFaint",
        className,
      )}
    >
      <span className="inline-flex h-9 items-center gap-2 px-2 font-mono text-[11px] uppercase text-muted">
        <Download
          aria-hidden="true"
          className={cn("h-4 w-4", notesExport ? "text-notes" : "text-review")}
        />
        {label}
      </span>
      {items.map((item) => (
        <a
          aria-label={item.ariaLabel}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent bg-panel px-3 text-sm font-medium text-ink transition-colors hover:border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            notesExport
              ? "hover:bg-notesSoft focus-visible:outline-notes"
              : "hover:bg-reviewSoft focus-visible:outline-review",
          )}
          href={item.href}
          key={item.href}
        >
          {item.label.includes("Combined") ? (
            <Layers2 aria-hidden="true" className="h-4 w-4 text-notes" />
          ) : item.label.includes("PDF") ? (
            <FileDown aria-hidden="true" className="h-4 w-4 text-attention" />
          ) : (
            <FileText
              aria-hidden="true"
              className={cn("h-4 w-4", notesExport ? "text-notes" : "text-review")}
            />
          )}
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}
