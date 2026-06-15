import { Download } from "lucide-react";

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

  return (
    <div
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <span className="text-sm font-medium text-muted">{label}</span>
      {items.map((item) => (
        <a
          aria-label={item.ariaLabel}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-medium text-ink transition-colors hover:bg-[#fbf8f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          href={item.href}
          key={item.href}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}
