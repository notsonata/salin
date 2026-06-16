"use client";

import { Download, FileDown, FileText, Layers2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const notesExport = items.some(
    (item) => item.label.includes("Notes") || item.label.includes("Combined"),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={label} size="sm" variant={notesExport ? "notes" : "secondary"}>
          <Download
            className={notesExport ? "text-accent" : "text-review"}
          />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Available exports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem asChild key={item.href}>
            <a aria-label={item.ariaLabel} href={item.href}>
              {item.label.includes("Combined") ? (
                <Layers2 className="text-accent" />
              ) : item.label.includes("PDF") ? (
                <FileDown className="text-attention" />
              ) : (
                <FileText className={notesExport ? "text-accent" : "text-review"} />
              )}
              <span>{item.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
