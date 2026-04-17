import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Share2, Sparkles, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';

// ─── Types ─────────────────────────────────────────────────────

interface LevelUpPayload {
  level: number;
  title: string;
  totalXp: number;
  nextThreshold: number;
  unlocks?: string[];
}

// ─── Constants ─────────────────────────────────────────────────

const AUTO_DISMISS_MS = 8_000;

/**
 * Default unlocks per level — used when the payload doesn't specify any.
 * Copy is intentionally aspirational + "world" themed to match Apice tone.
 */
const DEFAULT_UNLOCKS: Record<number, string[]> = {
  2: ['DCA starter templates', 'Daily insight feed'],
  3: ['Optimized portfolios preview', 'Weekly learning report'],
  4: ['Explosive List preview', 'Custom DCA frequencies'],
  5: ['Copy portfolios', 'Community highlights'],
  6: ['Advanced risk modes', 'Early access waitlist'],
  7: ['Private strategy briefings', 'Mentor channel preview'],
};

function resolveUnlocks(payload: LevelUpPayload): string[] {
  if (payload.unlocks && payload.unlocks.length > 0) return payload.unlocks;
  return DEFAULT_UNLOCKS[payload.level] ?? ['New challenges unlocked'];
}

// ─── Component ─────────────────────────────────────────────────

/**
 * LevelUpCelebration — global, full-screen modal shown when the user levels up.
 *
 * Listens to `lastCelebration` in the store; activates only when `type === 'level'`.
 * Runs a 5-stage animation sequence (backdrop → burst → text → level → unlocks →
 * confetti → buttons), respects reduced motion, fires optional haptics, and
 * auto-dismisses after 8s of idleness.
 */
export function LevelUpCelebration() {
  const celebration = useAppStore((s) => s.lastCelebration);
  const acknowledge = useAppStore((s) => s.acknowledgeCelebration);

  const isLevel = celebration?.type === 'level';
  const payload = useMemo<LevelUpPayload | null>(() => {
    if (!isLevel) return null;
    const raw = celebration?.payload;
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Partial<LevelUpPayload>;
    if (typeof p.level !== 'number' || typeof p.title !== 'string') return null;
    return {
      level: p.level,
      title: p.title,
      totalXp: p.totalXp ?? 0,
      nextThreshold: p.nextThreshold ?? 0,
      unlocks: p.unlocks,
    };
  }, [celebration, isLevel]);

  const autoDismissRef = useRef<number | null>(null);
  const confettiFiredRef = useRef(false);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current !== null) {
      window.clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    confettiFiredRef.current = false;
    acknowledge();
  }, [acknowledge]);

  // Haptic buzz + auto-dismiss timer when the celebration opens
  useEffect(() => {
    if (!payload) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([12, 40, 20, 40, 80]);
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
  }, [payload, dismiss]);

  // Confetti burst at t=2.6s
  useEffect(() => {
    if (!payload || confettiFiredRef.current) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      confettiFiredRef.current = true;
      return;
    }

    const burstTimeout = window.setTimeout(() => {
      confettiFiredRef.current = true;
      try {
        const end = Date.now() + 900;
        const colors = ['#F4B942', '#FFD76A', '#A78BFA', '#60A5FA'];
        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            startVelocity: 55,
            origin: { x: 0, y: 0.6 },
            colors,
            zIndex: 99999,
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            startVelocity: 55,
            origin: { x: 1, y: 0.6 },
            colors,
            zIndex: 99999,
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      } catch {
        // silent — confetti is decorative
      }
    }, 2_600);

    return () => {
      window.clearTimeout(burstTimeout);
    };
  }, [payload]);

  async function handleShare() {
    if (!payload) return;
    const text = `I just reached Level ${payload.level} — "${payload.title}" — on Apice Capital.`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Level Up on Apice', text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      // silent — user cancelled share
    }
  }

  const unlocks = payload ? resolveUnlocks(payload) : [];

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Radial light burst */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] rounded-full"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--apice-gold) / 0.6) 0%, hsl(var(--apice-gold) / 0.15) 40%, transparent 70%)',
              filter: 'blur(30px)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 2.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Close (x) */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-background/60 hover:bg-background/80 backdrop-blur flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-foreground" aria-hidden="true" />
          </button>

          {/* Content stack */}
          <div className="relative w-full max-w-md text-center">
            {/* "LEVEL UP" eyebrow */}
            <motion.p
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-sm font-bold uppercase tracking-[0.28em] mb-3"
              style={{
                background:
                  'linear-gradient(90deg, hsl(var(--apice-gold)), hsl(38 100% 75%), hsl(var(--apice-gold)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Level Up
            </motion.p>

            {/* Level number crash-in */}
            <motion.div
              id="levelup-title"
              initial={{ y: -120, scale: 0.4, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 14,
                delay: 0.9,
              }}
              className="font-display text-[7rem] leading-none font-black mb-2"
              style={{ color: 'hsl(var(--apice-gold))' }}
            >
              {payload.level}
            </motion.div>

            {/* Title with underline draw */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.4 }}
              className="relative inline-block mb-6"
            >
              <p className="font-display text-2xl font-bold">{payload.title}</p>
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'left' }}
                className="absolute left-0 right-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-transparent"
              />
            </motion.div>

            {/* Unlocks */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.8 }}
              className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-4 mb-6 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Unlocked
                </p>
              </div>
              <ul className="space-y-1.5">
                {unlocks.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.9 + i * 0.12 }}
                    className="text-sm flex items-center gap-2"
                  >
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'hsl(var(--apice-gold))' }}
                    />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 3.2 }}
              className="flex items-center gap-3 justify-center"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-10 px-4"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Share
              </Button>
              <Button
                type="button"
                variant="premium"
                size="sm"
                onClick={dismiss}
                className="h-10 px-6"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUpCelebration;
