import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-ink bg-ink text-panel shadow-panel hover:bg-brandDeep hover:border-brandDeep",
        secondary:
          "border-line bg-panel text-ink shadow-panel hover:bg-hover",
        ghost: "border-transparent bg-transparent text-ink hover:bg-hover",
        outline: "border-line bg-transparent text-ink hover:bg-panel",
        danger: "border-danger bg-danger text-panel hover:opacity-95",
        accent: "border-accent bg-accent text-panel shadow-panel hover:opacity-95",
        review: "border-review bg-review text-panel shadow-panel hover:opacity-95",
        notes: "border-review/25 bg-panel text-ink hover:border-reviewSoft hover:bg-reviewFaint",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-[13px]",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
