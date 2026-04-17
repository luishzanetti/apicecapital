import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Share2, Sparkles, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { AcademyBadgeCard, type BadgeRarity } from '@/components/academy/BadgeCard';

// ─── Types ─────────────────────────────────────────────────────

interface BadgePayload {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: BadgeRarity;
  unlockCondition?: string;
}

// ─── Constants ─────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5_000;

// ─── Component ─────────────────────────────────────────────────

/**
 * BadgeEarnedModal — global, compact celebration for badge unlocks.
 *
 * Listens to `lastCelebration`; activates only when `type === 'badge'`.
 * Renders the badge with a tilt-on-hover 3D feel, a rarity-aware shimmer,
 * the unlock condition, share + "display on profile" (Pro) controls,
 * and auto-dismisses after 5s.
 */
export function BadgeEarnedModal() {
  const celebration = useAppStore((s) => s.lastCelebration);
  const acknowledge = useAppStore((s) => s.acknowledgeCelebration);

  const isBadge = celebration?.type === 'badge';
  const badge = useMemo<BadgePayload | null>(() => {
    if (!isBadge) return null;
    const raw = celebration?.payload;
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Partial<BadgePayload>;
    if (!p.name || !p.rarity) return null;
    return {
      id: p.id ?? p.slug ?? p.name,
      slug: p.slug,
      name: p.name,
      description: p.description,
      icon: p.icon ?? '⭐',
      rarity: p.rarity as BadgeRarity,
      unlockCondition: p.unlockCondition,
    };
  }, [celebration, isBadge]);

  const [displayOnProfile, setDisplayOnProfile] = useState(false);
  const autoDismissRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current !== null) {
      window.clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    acknowledge();
  }, [acknowledge]);

  // Haptic + auto-dismiss timer
  useEffect(() => {
    if (!badge) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([8, 30, 16]);
      } catch {
        // ignore
      }
    }

    autoDismissRef.current = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (autoDismissRef.current !== null) {
        window.clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [badge, dismiss]);

  // 3D tilt via mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }
  function resetTilt() {
    mouseX.set(0);
    mouseY.set(0);
  }

  async function handleShare() {
    if (!badge) return;
    const text = `I just unlocked the "${badge.name}" badge on Apice Capital! ${badge.icon ?? '⭐'}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Apice Achievement', text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      // silent
    }
  }

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-earned-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl border border-border/50 bg-card/90 backdrop-blur-xl p-6 text-center"
            style={{ perspective: 1000 }}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-secondary/30 hover:bg-secondary/50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <p
              className="text-[10px] uppercase tracking-[0.24em] font-bold mb-2"
              style={{
                background:
                  'linear-gradient(90deg, hsl(var(--apice-gold)), hsl(38 100% 75%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Badge Unlocked
            </p>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
              <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />
              New achievement
            </div>

            {/* 3D tilt wrapper */}
            <motion.div
              onPointerMove={handlePointerMove}
              onPointerLeave={resetTilt}
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              className="inline-block mb-5"
            >
              <AcademyBadgeCard
                icon={badge.icon ?? '⭐'}
                name={badge.name}
                rarity={badge.rarity}
                unlocked={true}
                size={136}
              />
            </motion.div>

            <h3 id="badge-earned-title" className="font-display text-xl font-bold">
              {badge.name}
            </h3>
            {badge.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {badge.description}
              </p>
            )}

            {badge.unlockCondition && (
              <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                Earned by: {badge.unlockCondition}
              </p>
            )}

            {/* Display on profile (Pro) */}
            <label className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-left">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Display on profile</p>
                <p className="text-[10px] text-muted-foreground">
                  Pro feature — pinned at the top of your badges grid
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={displayOnProfile}
                aria-label="Display on profile"
                onClick={() => setDisplayOnProfile((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  displayOnProfile ? 'bg-primary' : 'bg-secondary/60'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    displayOnProfile ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </label>

            <div className="mt-5 flex items-center gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-9 px-4"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Share
              </Button>
              <Button
                type="button"
                variant="premium"
                size="sm"
                onClick={dismiss}
                className="h-9 px-5"
              >
                Nice
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BadgeEarnedModal;
