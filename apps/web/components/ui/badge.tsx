import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-[#f2ede5] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
