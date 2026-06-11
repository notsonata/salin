import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-panel hover:bg-[#25211d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  secondary:
    "bg-panel text-ink border border-line hover:bg-[#fbf8f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  ghost:
    "bg-transparent text-ink hover:bg-[#efe9df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  danger:
    "bg-danger text-panel hover:bg-[#7b3121] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger",
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
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
