import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PathNodeState = 'locked' | 'available' | 'in-progress' | 'completed' | 'boss';

export interface PathNodeProps {
  state: PathNodeState;
  /** Lesson title or short label (for aria-label / tooltip) */
  label: string;
  /** CSS color string for the world theme (e.g. `hsl(var(--world-foundation))`) */
  worldColor: string;
  /** Progress 0-1 for in-progress state (drives half-ring) */
  progress?: number;
  /** Number of stars earned (0-3) for completed state */
  stars?: number;
  /** Click handler — called regardless of locked state so caller can show a toast */
  onSelect?: () => void;
  /** Index or visible number on the node (for "available") */
  index?: number;
}

const STATE_SIZE: Record<PathNodeState, number> = {
  locked: 48,
  available: 64,
  'in-progress': 56,
  completed: 56,
  boss: 72,
};

/**
 * PathNode — circular (or hexagonal for bosses) step on the Learning Map.
 *
 * State-driven styling:
 *   - locked: small gray disc with lock icon
 *   - available: world-colored disc with pulsing halo
 *   - in-progress: half ring + partial halo
 *   - completed: green fill + check + up to 3 stars
 *   - boss: 72px hexagon with crown
 */
export const PathNode = forwardRef<HTMLButtonElement, PathNodeProps>(
  function PathNode(
    { state, label, worldColor, progress = 0, stars = 0, onSelect, index },
    ref
  ) {
    const size = STATE_SIZE[state];
    const isLocked = state === 'locked';

    const baseBtn = cn(
      'group relative inline-flex items-center justify-center shrink-0',
      'transition-transform duration-150 active:scale-95',
      isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
    );

    const ariaLabel = `${label} — ${state}`;

    if (state === 'boss') {
      return (
        <button
          ref={ref}
          type="button"
          onClick={onSelect}
          className={cn(baseBtn, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl')}
          aria-label={ariaLabel}
        >
          <span
            className="absolute inset-0 blur-2xl opacity-60"
            style={{ background: worldColor, width: size, height: size }}
            aria-hidden="true"
          />
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className="relative"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`boss-grad-${label}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={worldColor} stopOpacity="1" />
                <stop offset="100%" stopColor={worldColor} stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <polygon
              points="50,4 94,27 94,73 50,96 6,73 6,27"
              fill={`url(#boss-grad-${label})`}
              stroke="hsl(var(--apice-gold))"
              strokeWidth="3"
            />
          </svg>
          <Crown className="absolute text-white w-6 h-6 drop-shadow" aria-hidden="true" />
        </button>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        className={cn(baseBtn, 'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary')}
        aria-label={ariaLabel}
        style={{ width: size, height: size }}
      >
        {/* Halo for available / in-progress */}
        {(state === 'available' || state === 'in-progress') && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: worldColor, filter: 'blur(12px)', opacity: 0.4 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Body */}
        <span
          className={cn(
            'relative rounded-full flex items-center justify-center',
            state === 'completed' ? 'bg-[hsl(var(--apice-success))]' : ''
          )}
          style={{
            width: size,
            height: size,
            background:
              state === 'completed'
                ? 'hsl(var(--apice-success))'
                : state === 'locked'
                ? 'hsl(var(--secondary))'
                : `linear-gradient(135deg, ${worldColor}, ${worldColor})`,
            boxShadow:
              state === 'available'
                ? `0 8px 28px -6px ${worldColor}`
                : state === 'completed'
                ? '0 8px 24px -6px hsl(var(--apice-success) / 0.6)'
                : 'none',
          }}
        >
          {state === 'locked' && (
            <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
          {state === 'available' && (
            <span className="text-white font-bold text-lg">
              {index ?? <Star className="w-6 h-6 fill-white" aria-hidden="true" />}
            </span>
          )}
          {state === 'in-progress' && (
            <span className="text-white font-bold text-base">{index ?? '•'}</span>
          )}
          {state === 'completed' && (
            <Check className="w-6 h-6 text-white" strokeWidth={3} aria-hidden="true" />
          )}
        </span>

        {/* In-progress ring (shows progress) */}
        {state === 'in-progress' && (
          <svg
            className="absolute inset-0"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size - 4) / 2}
              fill="none"
              stroke={worldColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${Math.PI * (size - 4) * Math.min(1, Math.max(0, progress))} ${Math.PI * (size - 4)}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
        )}

        {/* Stars for completed */}
        {state === 'completed' && stars > 0 && (
          <span
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-0.5"
            aria-label={`${stars} of 3 stars`}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3 h-3',
                  i < stars
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/40'
                )}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ))}
          </span>
        )}
      </button>
    );
  }
);

export default PathNode;
