import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-line bg-field px-3 text-sm text-ink shadow-sm shadow-transparent transition-colors placeholder:text-muted focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
