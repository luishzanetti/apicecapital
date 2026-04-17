import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface AcademyBadgeCardProps {
  /** Emoji or unicode glyph representing the badge art */
  icon: string;
  /** Display name */
  name: string;
  /** Short description (used as secondary line / tooltip) */
  description?: string;
  /** Rarity tier — drives frame color, glow, and shimmer */
  rarity: BadgeRarity;
  /** Whether the user has earned this badge yet */
  unlocked: boolean;
  /** Optional size in pixels (defaults to 96) */
  size?: number;
  /** Optional wrapper classes */
  className?: string;
}

const rarityConfig: Record<
  BadgeRarity,
  {
    label: string;
    frame: string;
    glow: string;
    gradient: string;
  }
> = {
  common: {
    label: 'Common',
    frame: 'border-[hsl(var(--rarity-common))]/40',
    glow: '',
    gradient:
      'bg-[radial-gradient(circle_at_50%_30%,hsl(var(--rarity-common)/0.18),transparent_70%)]',
  },
  rare: {
    label: 'Rare',
    frame: 'border-[hsl(var(--rarity-rare))]/50',
    glow: 'shadow-[0_0_24px_-4px_hsl(var(--rarity-rare)/0.55)]',
    gradient:
      'bg-[radial-gradient(circle_at_50%_30%,hsl(var(--rarity-rare)/0.25),transparent_70%)]',
  },
  epic: {
    label: 'Epic',
    frame: 'border-[hsl(var(--rarity-epic))]/55',
    glow: 'shadow-[0_0_28px_-4px_hsl(var(--rarity-epic)/0.6)]',
    gradient:
      'bg-[radial-gradient(circle_at_50%_30%,hsl(var(--rarity-epic)/0.3),transparent_70%)]',
  },
  legendary: {
    label: 'Legendary',
    frame: 'border-[hsl(var(--rarity-legendary))]/60',
    glow: 'shadow-[0_0_32px_-4px_hsl(var(--rarity-legendary)/0.65)]',
    gradient:
      'bg-[radial-gradient(circle_at_50%_30%,hsl(var(--rarity-legendary)/0.35),transparent_70%)]',
  },
  mythic: {
    label: 'Mythic',
    frame: 'border-transparent',
    glow: 'shadow-[0_0_36px_-4px_hsl(var(--rarity-mythic)/0.7)]',
    gradient:
      'bg-[conic-gradient(from_0deg,hsl(38_92%_62%/0.45),hsl(348_90%_65%/0.45),hsl(265_90%_72%/0.45),hsl(212_100%_68%/0.45),hsl(152_72%_58%/0.45),hsl(38_92%_62%/0.45))]',
  },
};

/**
 * AcademyBadgeCard — 3D-style badge render with rarity frame.
 *
 * Visually distinguishes common / rare / epic / legendary / mythic badges
 * through border color, shadow glow, and center gradient. When `unlocked`
 * is false, the badge is dimmed to 30% opacity with a Lock overlay.
 */
export function AcademyBadgeCard({
  icon,
  name,
  description,
  rarity,
  unlocked,
  size = 96,
  className,
}: AcademyBadgeCardProps) {
  const cfg = rarityConfig[rarity];

  return (
    <div
      className={cn(
        'relative flex flex-col items-center text-center',
        className
      )}
      role="group"
      aria-label={`${name} — ${cfg.label} ${unlocked ? 'unlocked' : 'locked'}`}
    >
      <motion.div
        whileHover={unlocked ? { scale: 1.05, rotate: -2 } : undefined}
        whileTap={unlocked ? { scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'relative flex items-center justify-center rounded-2xl border-2 overflow-hidden',
          cfg.frame,
          unlocked && cfg.glow,
          !unlocked && 'opacity-30 grayscale'
        )}
        style={{ width: size, height: size }}
      >
        {/* Mythic rainbow frame */}
        {rarity === 'mythic' && unlocked && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl animate-[gradient-shift_4s_ease_infinite]"
            style={{
              padding: 2,
              background:
                'conic-gradient(from 0deg, hsl(38 92% 62%), hsl(348 90% 65%), hsl(265 90% 72%), hsl(212 100% 68%), hsl(152 72% 58%), hsl(38 92% 62%))',
              backgroundSize: '200% 200%',
              WebkitMask:
                'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        )}

        {/* Legendary shimmer overlay */}
        {rarity === 'legendary' && unlocked && (
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-60 animate-shimmer"
            style={{
              background:
                'linear-gradient(120deg, transparent 30%, hsl(var(--apice-gold) / 0.3) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
            }}
          />
        )}

        <div className={cn('absolute inset-0 rounded-2xl', cfg.gradient)} />

        <span
          className="relative z-10 select-none"
          style={{ fontSize: size * 0.45 }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px] z-20 rounded-2xl">
            <Lock className="w-5 h-5 text-foreground/80" aria-hidden="true" />
          </div>
        )}
      </motion.div>

      <p className={cn('mt-2 text-xs font-semibold leading-tight line-clamp-2', !unlocked && 'text-muted-foreground')}>
        {name}
      </p>
      {description && (
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {description}
        </p>
      )}
      <span
        className={cn(
          'mt-1 text-[10px] font-bold uppercase tracking-wider',
          rarity === 'common' && 'text-[hsl(var(--rarity-common))]',
          rarity === 'rare' && 'text-[hsl(var(--rarity-rare))]',
          rarity === 'epic' && 'text-[hsl(var(--rarity-epic))]',
          rarity === 'legendary' && 'text-[hsl(var(--rarity-legendary))]',
          rarity === 'mythic' && 'text-[hsl(var(--rarity-mythic))]',
          !unlocked && 'opacity-60'
        )}
      >
        {cfg.label}
      </span>
    </div>
  );
}

export default AcademyBadgeCard;
