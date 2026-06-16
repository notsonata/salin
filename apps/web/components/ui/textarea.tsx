import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-md border border-line bg-field px-3 py-3 text-sm leading-6 text-ink shadow-sm shadow-transparent transition-colors placeholder:text-muted focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
