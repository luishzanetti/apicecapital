import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * BrandMark — canonical Apice triangle per brand/BRAND-BOOK.md v2.0.
 *
 * Three variants:
 * - `outline`  → standalone triangle (light or inline contexts, inherits color)
 * - `circle`   → triangle inside translucent circle with blue glow (dark heros)
 * - `lockup`   → triangle + wordmark "Apice"
 *
 * Never rotate, never fill, never recolor the inner path beyond brand spec.
 */

interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  variant?: "outline" | "circle";
  size?: number;
}

export function TriangleMark({
  variant = "outline",
  size = 32,
  className,
  ...props
}: BrandMarkProps) {
  if (variant === "circle") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 88 88"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Apice"
        className={className}
        {...props}
      >
        <defs>
          <radialGradient id="apice-brand-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#528FFF" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#528FFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#528FFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="apice-brand-circle-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
          </radialGradient>
        </defs>
        <circle cx="44" cy="44" r="44" fill="url(#apice-brand-glow)" />
        <circle
          cx="44"
          cy="44"
          r="30"
          fill="url(#apice-brand-circle-fill)"
          stroke="#FFFFFF"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <path
          d="M 44 30 L 60 58 L 28 58 Z"
          stroke="#F7F3ED"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  // Outline standalone — inherits text color
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Apice"
      className={cn("text-current", className)}
      {...props}
    >
      <path
        d="M 32 6 L 58 56 L 6 56 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 32 18 L 50 52 L 14 52 Z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

/**
 * BrandLockup — triangle + wordmark "Apice" with optional subtitle.
 * Use in Landing hero, nav, headers. Subtitle only in Landing hero.
 */
export function BrandLockup({
  variant = "outline",
  subtitle,
  size = 32,
  className,
  wordmarkClassName,
}: {
  variant?: "outline" | "circle";
  subtitle?: string;
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TriangleMark variant={variant} size={size} aria-hidden="true" />
      <div>
        <p className={cn("font-display text-base font-semibold tracking-tight", wordmarkClassName)}>
          Apice<span className="text-[hsl(var(--apice-emerald))]">.</span>
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
