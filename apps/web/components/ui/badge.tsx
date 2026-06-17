import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone =
  | "default"
  | "accent"
  | "review"
  | "attention"
  | "danger"
  | "success"
  | "quiet";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-line bg-field text-muted",
  accent: "border-accentSoft bg-accentFaint text-accent",
  review: "border-reviewSoft bg-reviewFaint text-review",
  attention: "border-attentionSoft bg-attentionFaint text-attention",
  danger: "border-dangerSoft bg-dangerFaint text-danger",
  success: "border-successSoft bg-successSoft text-success",
  quiet: "border-line bg-panel text-muted",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 font-sans font-semibold text-[10px] uppercase tracking-[0.18em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
