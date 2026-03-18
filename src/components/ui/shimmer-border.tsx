import { cn } from "@/lib/utils";

interface ShimmerBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius class */
  rounded?: string;
}

/**
 * Wraps children with a shimmer-animated gradient border.
 * Premium visual effect for highlighted cards/CTAs.
 */
export function ShimmerBorder({ children, className, rounded = "rounded-2xl" }: ShimmerBorderProps) {
  return (
    <div className={cn("relative p-[1px] overflow-hidden", rounded, className)}>
      {/* Animated gradient border */}
      <div
        className={cn("absolute inset-0 animate-gradient", rounded)}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--apice-gold)), hsl(var(--primary)), hsl(var(--apice-gradient-end)))",
          backgroundSize: "300% 300%",
        }}
      />
      {/* Content */}
      <div className={cn("relative bg-card", rounded)}>{children}</div>
    </div>
  );
}
