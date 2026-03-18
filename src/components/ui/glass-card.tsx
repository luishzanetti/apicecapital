import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

const glassCardVariants = cva(
  "rounded-2xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass-card",
        elevated: "glass-card apice-shadow-elevated hover:border-primary/20",
        subtle: "bg-card/40 backdrop-blur-sm border-border/30",
        glow: "glass-card glow-primary",
        gold: "glass-card border-apice-gold/20 apice-shadow-gold",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface GlassCardProps
  extends Omit<HTMLMotionProps<"div">, "children">,
    VariantProps<typeof glassCardVariants> {
  children: React.ReactNode;
  /** Animate entrance with fade-up */
  animate?: boolean;
  /** Stagger delay in seconds */
  delay?: number;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, animate = true, delay = 0, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(glassCardVariants({ variant, padding, className }))}
        {...(animate
          ? {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              transition: {
                delay,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              },
            }
          : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
