import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Share2,
  Lock,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { learnBadges, learningTracks, type LearnBadge } from '@/data/sampleData';
import { AcademyBadgeCard, type BadgeRarity } from '@/components/academy/BadgeCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────

type FilterTab = 'all' | 'unlocked' | 'locked' | 'rarity';

interface GalleryBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  rarity: BadgeRarity;
  unlocked: boolean;
  earnedAt?: string;
  progress?: { current: number; target: number };
}

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Map a learn badge's unlock condition to a rarity tier.
 * - Track completions are legendary (big achievements)
 * - Longer streaks/higher milestones are epic/rare
 * - First steps are common
 */
function inferRarity(b: LearnBadge): BadgeRarity {
  if (b.unlockCondition.type === 'tracks' && b.unlockCondition.count >= 2) return 'mythic';
  if (b.unlockCondition.type === 'tracks') return 'legendary';
  if (b.unlockCondition.type === 'streak' && b.unlockCondition.count >= 7) return 'epic';
  if (b.unlockCondition.type === 'streak') return 'rare';
  if (b.unlockCondition.type === 'lessons' && b.unlockCondition.count >= 15) return 'legendary';
  if (b.unlockCondition.type === 'lessons' && b.unlockCondition.count >= 10) return 'epic';
  if (b.unlockCondition.type === 'lessons' && b.unlockCondition.count >= 5) return 'rare';
  return 'common';
}

const RARITY_ORDER: BadgeRarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

const RARITY_LABEL: Record<BadgeRarity, string> = {
  mythic: 'Mythic',
  legendary: 'Legendary',
  epic: 'Epic',
  rare: 'Rare',
  common: 'Common',
};

// ─── Page ──────────────────────────────────────────────────────

/**
 * Badges — "trophy room" showcase of every achievement the user can earn.
 *
 * Merges the `learnBadges` catalog with the user's earned set from the store
 * to compute unlock state + progress toward locked badges. Grouped by rarity,
 * filterable, with a modal for unlock conditions / share actions.
 */
export default function Badges() {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);
  const earnedBadgesState = useAppStore((s) => s.earnedBadges);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<GalleryBadge | null>(null);

  const completedCount = learnProgress.completedLessons.length;
  const completedTracks = learningTracks.filter((t) =>
    t.lessons.every((l) => learnProgress.completedLessons.includes(l.id))
  ).length;

  const earnedSlugs = useMemo(() => {
    // Support both the new `earnedBadges` (slug-keyed) and legacy id-matching
    return new Set(
      earnedBadgesState
        .map((b) => b.slug ?? b.id)
        .filter(Boolean)
    );
  }, [earnedBadgesState]);

  const allBadges: GalleryBadge[] = useMemo(() => {
    return learnBadges.map((b) => {
      const rarity = inferRarity(b);

      // Determine unlocked state + progress
      let current = 0;
      let target = b.unlockCondition.count;
      if (b.unlockCondition.type === 'lessons') current = completedCount;
      else if (b.unlockCondition.type === 'streak') current = learnProgress.currentStreak;
      else if (b.unlockCondition.type === 'tracks') current = completedTracks;

      const unlockedByProgress = current >= target;
      const unlockedByStore = earnedSlugs.has(b.id);
      const unlocked = unlockedByProgress || unlockedByStore;

      // Pull earnedAt from the store if we have it
      const storeMatch = earnedBadgesState.find(
        (eb) => (eb.slug ?? eb.id) === b.id
      );

      return {
        id: b.id,
        name: b.name,
        icon: b.icon,
        description: b.description,
        requirement: b.requirement,
        rarity,
        unlocked,
        earnedAt: storeMatch?.earnedAt,
        progress: { current: Math.min(current, target), target },
      };
    });
  }, [completedCount, completedTracks, learnProgress.currentStreak, earnedSlugs, earnedBadgesState]);

  const unlockedCount = allBadges.filter((b) => b.unlocked).length;
  const totalCount = allBadges.length;

  const filtered = useMemo(() => {
    if (filter === 'unlocked') return allBadges.filter((b) => b.unlocked);
    if (filter === 'locked') return allBadges.filter((b) => !b.unlocked);
    return allBadges;
  }, [allBadges, filter]);

  const grouped = useMemo(() => {
    const groups: Record<BadgeRarity, GalleryBadge[]> = {
      mythic: [],
      legendary: [],
      epic: [],
      rare: [],
      common: [],
    };
    for (const b of filtered) groups[b.rarity].push(b);
    return groups;
  }, [filtered]);

  async function handleShare(badge: GalleryBadge) {
    const text = `I just unlocked the "${badge.name}" badge on Apice Capital! ${badge.icon}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Apice Capital — Achievement', text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      // User cancelled share or clipboard failed — silent no-op
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative px-5 pt-7 pb-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 10% 20%, hsl(var(--apice-gold) / 0.18) 0%, transparent 55%), radial-gradient(circle at 90% 80%, hsl(var(--primary) / 0.12) 0%, transparent 55%)',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            aria-label="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back
          </button>

          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Achievements
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Every milestone, medalled. Show the world what you've mastered.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-2xl font-bold tabular-nums">
                {unlockedCount}
                <span className="text-muted-foreground text-base">/{totalCount}</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Unlocked
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur backdrop-blur overflow-x-auto"
            role="tablist"
            aria-label="Badge filter"
          >
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'unlocked', label: 'Unlocked' },
                { key: 'locked', label: 'Locked' },
                { key: 'rarity', label: 'By Rarity' },
              ] as { key: FilterTab; label: string }[]
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex-1 min-w-[72px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 space-y-8">
        {filtered.length === 0 && (
          <div className="rounded-3xl p-8 border border-dashed border-white/10 text-center">
            <Award className="w-6 h-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold">Nothing here yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'unlocked'
                ? 'Complete lessons to start earning badges.'
                : 'Every badge on the list has been unlocked. Keep going.'}
            </p>
          </div>
        )}

        {RARITY_ORDER.map((rarity) => {
          const list = grouped[rarity];
          if (list.length === 0) return null;

          return (
            <section key={rarity} aria-labelledby={`rarity-${rarity}`}>
              <header className="flex items-center gap-2 mb-3">
                <Sparkles
                  className={cn(
                    'w-4 h-4',
                    rarity === 'mythic' && 'text-[hsl(var(--rarity-mythic))]',
                    rarity === 'legendary' && 'text-[hsl(var(--rarity-legendary))]',
                    rarity === 'epic' && 'text-[hsl(var(--rarity-epic))]',
                    rarity === 'rare' && 'text-[hsl(var(--rarity-rare))]',
                    rarity === 'common' && 'text-[hsl(var(--rarity-common))]'
                  )}
                  aria-hidden="true"
                />
                <h2
                  id={`rarity-${rarity}`}
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {RARITY_LABEL[rarity]} — {list.length}
                </h2>
              </header>

              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {list.map((badge) => (
                  <motion.button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelected(badge)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="text-left rounded-2xl p-2 hover:bg-white/[0.02] backdrop-blur transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label={`${badge.name} — ${badge.unlocked ? 'Unlocked' : 'Locked'}`}
                  >
                    <AcademyBadgeCard
                      icon={badge.icon}
                      name={badge.name}
                      description={badge.description}
                      rarity={badge.rarity}
                      unlocked={badge.unlocked}
                      size={88}
                    />
                  </motion.button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <BadgeDetailModal
            badge={selected}
            onClose={() => setSelected(null)}
            onShare={() => handleShare(selected)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────

interface BadgeDetailModalProps {
  badge: GalleryBadge;
  onClose: () => void;
  onShare: () => void;
}

function BadgeDetailModal({ badge, onClose, onShare }: BadgeDetailModalProps) {
  const progressPct = badge.progress
    ? Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100))
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-detail-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.05] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center">
          <AcademyBadgeCard
            icon={badge.icon}
            name={badge.name}
            rarity={badge.rarity}
            unlocked={badge.unlocked}
            size={120}
          />

          <h3
            id="badge-detail-title"
            className="font-display text-xl font-bold mt-4"
          >
            {badge.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {badge.description}
          </p>

          {badge.unlocked ? (
            <div className="mt-5 w-full space-y-3">
              {badge.earnedAt && (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              )}
              <Button
                type="button"
                variant="premium"
                size="sm"
                className="w-full"
                onClick={onShare}
              >
                <Share2 className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                Share achievement
              </Button>
            </div>
          ) : (
            <div className="mt-5 w-full space-y-3">
              <div className="rounded-2xl bg-white/[0.05] p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Unlock condition
                  </p>
                </div>
                <p className="text-sm font-semibold mb-3">{badge.requirement}</p>

                {badge.progress && (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums">
                        {badge.progress.current}/{badge.progress.target}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onClose}
              >
                Keep learning
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
