import { cn } from '@/lib/utils';

/**
 * ALTIS Icon — advanced AI trading mark.
 *
 * Concept: a composed geometric mark that reads as "AI intelligence in motion":
 *   · Center diamond = precision / trading setup geometry
 *   · 3 orbital nodes = neural connections / decision points
 *   · Ascending tick marks = compounding / upward inference
 *   · Emerald core pulse = active brain state
 *
 * NOT the generic `Bot` icon from lucide. Owns its own aesthetic:
 * modern · geometric · quietly animated via CSS · instantly legible as "AI".
 *
 * Usage:
 *   <AltisIcon className="h-5 w-5" />
 *   <AltisIcon active />      // active state pulses the core
 *   <AltisIcon size={24} />
 */

export interface AltisIconProps {
  size?: number;
  className?: string;
  /** When true, core node pulses via CSS animation. */
  active?: boolean;
  'aria-label'?: string;
}

export function AltisIcon({
  size = 20,
  className,
  active = false,
  'aria-label': ariaLabel = 'ALTIS Trading',
}: AltisIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('inline-block', className)}
      role="img"
      aria-label={ariaLabel}
      fill="none"
    >
      <title>{ariaLabel}</title>

      {/* Outer orbital ring — faint, represents AI's field of awareness */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.25"
        strokeDasharray="1.5 2.5"
      />

      {/* 3 orbital nodes — neural decision points */}
      <circle cx="12" cy="3" r="1.4" fill="currentColor" fillOpacity="0.65" />
      <circle cx="20.36" cy="16.5" r="1.4" fill="currentColor" fillOpacity="0.65" />
      <circle cx="3.64" cy="16.5" r="1.4" fill="currentColor" fillOpacity="0.65" />

      {/* Inner diamond — trading geometry · precision */}
      <path
        d="M 12 6.5 L 16.5 12 L 12 17.5 L 7.5 12 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Ascending ticks on right edge of diamond — compounding / upward AI inference */}
      <path
        d="M 13.5 10.2 L 14.8 10.2 M 13.8 11.5 L 15.2 11.5 M 14.1 12.8 L 15.6 12.8"
        stroke="#16A661"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Core brain node — emerald · pulses when active */}
      <circle
        cx="12"
        cy="12"
        r={active ? '1.8' : '1.6'}
        fill="#16A661"
        className={active ? 'animate-pulse' : undefined}
      />
    </svg>
  );
}
