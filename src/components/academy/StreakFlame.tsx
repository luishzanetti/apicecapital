import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StreakFlameProps {
  /** Current streak in days */
  streak: number;
  /** Size in pixels (defaults to 40) */
  size?: number;
  /** Optional extra classes */
  className?: string;
  /** Render the streak number next to the flame */
  showCount?: boolean;
}

type FlameTier = {
  key: string;
  primary: string;
  secondary: string;
  aura?: string;
  label: string;
};

function tierFor(streak: number): FlameTier {
  if (streak >= 365) {
    return {
      key: 'rainbow',
      primary: 'url(#flame-rainbow)',
      secondary: 'url(#flame-rainbow-inner)',
      aura: 'hsl(var(--flame-purple))',
      label: 'Mythic streak',
    };
  }
  if (streak >= 100) {
    return {
      key: 'purple',
      primary: 'hsl(var(--flame-purple))',
      secondary: 'hsl(265 90% 82%)',
      aura: 'hsl(var(--flame-purple))',
      label: 'Legendary streak',
    };
  }
  if (streak >= 30) {
    return {
      key: 'blue',
      primary: 'hsl(var(--flame-blue))',
      secondary: 'hsl(200 100% 85%)',
      aura: 'hsl(var(--flame-blue))',
      label: 'Epic streak',
    };
  }
  if (streak >= 7) {
    return {
      key: 'hot',
      primary: 'hsl(var(--flame-hot))',
      secondary: 'hsl(38 100% 75%)',
      aura: 'hsl(var(--flame-hot))',
      label: 'Hot streak',
    };
  }
  if (streak >= 1) {
    return {
      key: 'warm',
      primary: 'hsl(var(--flame-warm))',
      secondary: 'hsl(45 100% 78%)',
      aura: 'hsl(var(--flame-warm))',
      label: 'Active streak',
    };
  }
  return {
    key: 'cold',
    primary: 'hsl(var(--flame-cold))',
    secondary: 'hsl(210 40% 78%)',
    label: 'No streak yet',
  };
}

/**
 * StreakFlame — animated SVG flame that scales with the streak count.
 *
 * The flame gradient and aura shift through 6 tiers (cold → warm → hot →
 * blue → purple → rainbow) based on the user's active streak.
 */
export function StreakFlame({
  streak,
  size = 40,
  className,
  showCount = true,
}: StreakFlameProps) {
  const tier = tierFor(streak);
  const isCold = tier.key === 'cold';

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${tier.label} — ${streak} day${streak === 1 ? '' : 's'}`}
    >
      <span className="relative inline-block" style={{ width: size, height: size }}>
        {/* Aura */}
        {tier.aura && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full blur-xl"
            style={{ background: tier.aura, opacity: 0.35 }}
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.svg
          viewBox="0 0 40 48"
          width={size}
          height={size * 1.2}
          aria-hidden="true"
          className="relative"
          animate={isCold ? undefined : { scaleY: [1, 1.06, 0.96, 1.04, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '50% 100%' }}
        >
          <defs>
            <linearGradient id="flame-rainbow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38 92% 62%)" />
              <stop offset="40%" stopColor="hsl(348 90% 65%)" />
              <stop offset="80%" stopColor="hsl(265 90% 72%)" />
              <stop offset="100%" stopColor="hsl(212 100% 68%)" />
            </linearGradient>
            <linearGradient id="flame-rainbow-inner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(45 100% 88%)" />
              <stop offset="100%" stopColor="hsl(38 100% 70%)" />
            </linearGradient>
          </defs>

          {/* Outer flame */}
          <path
            d="M20 4c3 6 9 10 9 18a9 9 0 0 1-18 0c0-5 3-7 3-12 0 3 2 5 4 5 0-5 2-8 2-11z"
            fill={tier.primary}
          />
          {/* Inner flame */}
          <path
            d="M20 14c1.8 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4.5 2-7.5 0 1.5 1 2.5 2 2.5 0-2 1-4 1-6z"
            fill={tier.secondary}
            opacity={0.9}
          />
          {/* Core */}
          {!isCold && (
            <circle cx="20" cy="34" r="2" fill="hsl(0 0% 100%)" opacity={0.85} />
          )}
        </motion.svg>

        {/* Sparks for streak >= 7 */}
        {streak >= 7 && (
          <>
            <motion.span
              aria-hidden="true"
              className="absolute top-0 left-1 w-1 h-1 rounded-full"
              style={{ background: tier.primary }}
              animate={{ y: [0, -8, -16], opacity: [1, 0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute top-1 right-1 w-1 h-1 rounded-full"
              style={{ background: tier.primary }}
              animate={{ y: [0, -10, -18], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}
      </span>

      {showCount && (
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            isCold && 'text-muted-foreground'
          )}
          style={!isCold ? { color: tier.aura ?? tier.primary } : undefined}
        >
          {streak}d
        </span>
      )}
    </span>
  );
}

export default StreakFlame;
