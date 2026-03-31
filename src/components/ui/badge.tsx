import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
        // Risk levels
        low: "bg-apice-success/10 text-apice-success",
        medium: "bg-apice-warning/10 text-apice-warning",
        high: "bg-destructive/10 text-destructive",
        // Status badges
        locked: "bg-muted text-muted-foreground",
        unlocked: "bg-primary/10 text-primary",
        premium: "apice-gradient-gold text-accent-foreground",
        recommended: "bg-primary text-primary-foreground",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[11px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
