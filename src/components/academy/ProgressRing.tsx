import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AcademyProgressRingProps {
  /** Diameter in pixels */
  size?: number;
  /** Stroke width in pixels */
  stroke?: number;
  /** Progress as a number between 0 and 100 */
  progress: number;
  /**
   * CSS color string for the active stroke.
   * Accepts any valid CSS color (e.g. `hsl(var(--primary))`, `#fff`, `red`).
   * Defaults to `hsl(var(--primary))`.
   */
  color?: string;
  /** Background track color (defaults to `hsl(var(--secondary))`) */
  trackColor?: string;
  /** Show the numeric percentage in the center when no children are provided */
  showPercentage?: boolean;
  /** Content rendered inside the ring (overrides `showPercentage`) */
  children?: ReactNode;
  /** Optional extra classes applied to the outer wrapper */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * AcademyProgressRing — reusable SVG progress ring.
 *
 * Supports any size/stroke, an arbitrary color, and an optional child
 * rendered at the center (e.g. icon, number, avatar). When no child is
 * provided and `showPercentage` is true, it renders the integer percentage.
 */
export function AcademyProgressRing({
  size = 80,
  stroke = 6,
  progress,
  color = 'hsl(var(--primary))',
  trackColor = 'hsl(var(--secondary))',
  showPercentage = false,
  children,
  className,
  ariaLabel,
}: AcademyProgressRingProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `Progress ${Math.round(safeProgress)}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          opacity={0.5}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            strokeDasharray: circumference,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          showPercentage ? (
            <span className="text-sm font-semibold tabular-nums">
              {Math.round(safeProgress)}%
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

export default AcademyProgressRing;
