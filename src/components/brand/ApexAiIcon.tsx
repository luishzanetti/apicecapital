import { cn } from '@/lib/utils';

/**
 * Apex AI Icon — autonomous trading bot mark.
 *
 * Concept (distinct from ALTIS, which is diamond + orbital nodes):
 *   · Hexagonal frame   = autonomous engine / robust system
 *   · 4 cardinal nodes  = 24/7 vigilance · north/south/east/west market scan
 *   · Diagonal stroke   = upward acceleration · "apex"
 *   · Emerald core      = AI brain (Apice signature emerald #16A661)
 *
 * NOT generic Bot/CPU/Cog. Owns its own silhouette so the user can
 * recognize "Apex AI" at 16-24px from across the screen.
 *
 * Usage:
 *   <ApexAiIcon className="h-5 w-5" />
 *   <ApexAiIcon active />        // core pulses when active
 *   <ApexAiIcon size={24} />
 */

export interface ApexAiIconProps {
  size?: number;
  className?: string;
  active?: boolean;
  'aria-label'?: string;
}

export function ApexAiIcon({
  size = 20,
  className,
  active = false,
  'aria-label': ariaLabel = 'Apex AI',
}: ApexAiIconProps) {
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

      {/* Hexagon frame — autonomous engine */}
      <path
        d="M 12 2.6 L 20.5 7.3 L 20.5 16.7 L 12 21.4 L 3.5 16.7 L 3.5 7.3 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* 4 cardinal sentry nodes — N/E/S/W vigilance */}
      <circle cx="12" cy="4.2"  r="1.1" fill="currentColor" fillOpacity="0.85" />
      <circle cx="19.8" cy="12" r="1.1" fill="currentColor" fillOpacity="0.6" />
      <circle cx="12" cy="19.8" r="1.1" fill="currentColor" fillOpacity="0.6" />
      <circle cx="4.2" cy="12"  r="1.1" fill="currentColor" fillOpacity="0.6" />

      {/* Diagonal acceleration stroke — apex / climbing */}
      <path
        d="M 8.2 14.6 L 12 10.8 L 14.4 13.2 L 16.4 10.6"
        stroke="#16A661"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tip arrow */}
      <path
        d="M 14.8 10.6 L 16.4 10.6 L 16.4 12.2"
        stroke="#16A661"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Emerald core — pulses when active */}
      <circle
        cx="12"
        cy="12"
        r={active ? '1.7' : '1.5'}
        fill="#16A661"
        className={active ? 'animate-pulse' : undefined}
      />
    </svg>
  );
}
