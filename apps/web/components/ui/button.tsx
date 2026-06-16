import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent"
  | "review"
  | "notes";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-panel hover:bg-[#25211d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  secondary:
    "bg-panel text-ink border border-line hover:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  ghost:
    "bg-transparent text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  danger:
    "bg-danger text-panel hover:bg-[#7b3121] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger",
  accent:
    "bg-accent text-panel hover:bg-[#22564f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  review:
    "bg-review text-panel hover:bg-[#285181] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-review",
  notes:
    "bg-notes text-panel hover:bg-[#5b3d79] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-notes",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
