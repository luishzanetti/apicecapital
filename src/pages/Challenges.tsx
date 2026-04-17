import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Flame,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StreakFlame } from '@/components/academy/StreakFlame';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────

type ChallengeType = 'daily' | 'weekly' | 'evergreen';

interface ChallengeItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ChallengeType;
  rewardXp: number;
  reward?: string;
  progress: { current: number; target: number };
  endsAt?: string;
  illustration: string; // emoji as world-themed glyph
  theme: 'learn' | 'dca' | 'streak' | 'elite';
}

// ─── Hardcoded challenges (V2 spec) ────────────────────────────

function buildChallenges(
  completedLessonsToday: boolean,
  completedThisWeek: number,
  currentStreak: number
): ChallengeItem[] {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date();
  const daysUntilSunday = (7 - endOfWeek.getDay()) % 7 || 7;
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  return [
    {
      id: 'daily-learn',
      slug: 'daily-learn',
      title: 'Daily Learner',
      description: 'Complete 1 lesson today to keep your streak alive.',
      type: 'daily',
      rewardXp: 75,
      progress: { current: completedLessonsToday ? 1 : 0, target: 1 },
      endsAt: endOfToday.toISOString(),
      illustration: '📘',
      theme: 'learn',
    },
    {
      id: 'weekly-marathon',
      slug: 'weekly-marathon',
      title: 'Knowledge Marathon',
      description: 'Complete 5 lessons this week and stack deep XP.',
      type: 'weekly',
      rewardXp: 500,
      progress: { current: Math.min(5, completedThisWeek), target: 5 },
      endsAt: endOfWeek.toISOString(),
      illustration: '🏃',
      theme: 'learn',
    },
    {
      id: 'streak-7',
      slug: 'streak-7',
      title: 'Week Warrior',
      description: 'Stay active 7 days in a row. The flame turns hot.',
      type: 'evergreen',
      rewardXp: 300,
      progress: { current: Math.min(7, currentStreak), target: 7 },
      illustration: '🔥',
      theme: 'streak',
    },
    {
      id: 'dca-discipline',
      slug: 'dca-discipline',
      title: 'DCA Discipline Week',
      description: 'Execute 3 DCA buys in 7 days. Discipline over drama.',
      type: 'weekly',
      rewardXp: 500,
      progress: { current: 0, target: 3 },
      endsAt: endOfWeek.toISOString(),
      illustration: '💎',
      theme: 'dca',
    },
    {
      id: 'elite-30-day-pledge',
      slug: 'elite-30-day-pledge',
      title: '30-Day Pledge',
      description: '30 consecutive active days. Elite unlocks a perma-perk.',
      type: 'evergreen',
      rewardXp: 2000,
      reward: '25% Pro discount for life',
      progress: { current: Math.min(30, currentStreak), target: 30 },
      illustration: '👑',
      theme: 'elite',
    },
  ];
}

// ─── Countdown ─────────────────────────────────────────────────

function formatCountdown(endsAt?: string): string {
  if (!endsAt) return '';
  const target = new Date(endsAt).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    return `${days}d ${remH}h`;
  }
  return `${hours}h ${minutes}m`;
}

function useCountdown(endsAt?: string): string {
  const [label, setLabel] = useState(() => formatCountdown(endsAt));
  useEffect(() => {
    if (!endsAt) return;
    setLabel(formatCountdown(endsAt));
    const id = window.setInterval(() => setLabel(formatCountdown(endsAt)), 60_000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return label;
}

// ─── Theme map ─────────────────────────────────────────────────

const THEME_STYLES: Record<
  ChallengeItem['theme'],
  { bg: string; ring: string; text: string; icon: string }
> = {
  learn: {
    bg: 'hsl(var(--world-foundation) / 0.15)',
    ring: 'hsl(var(--world-foundation) / 0.35)',
    text: 'hsl(var(--world-foundation))',
    icon: 'hsl(var(--world-foundation))',
  },
  dca: {
    bg: 'hsl(var(--world-portfolio) / 0.15)',
    ring: 'hsl(var(--world-portfolio) / 0.35)',
    text: 'hsl(var(--world-portfolio))',
    icon: 'hsl(var(--world-portfolio))',
  },
  streak: {
    bg: 'hsl(var(--flame-hot) / 0.15)',
    ring: 'hsl(var(--flame-hot) / 0.4)',
    text: 'hsl(var(--flame-hot))',
    icon: 'hsl(var(--flame-hot))',
  },
  elite: {
    bg: 'hsl(var(--apice-gold) / 0.15)',
    ring: 'hsl(var(--apice-gold) / 0.4)',
    text: 'hsl(var(--apice-gold))',
    icon: 'hsl(var(--apice-gold))',
  },
};

// ─── Page ──────────────────────────────────────────────────────

/**
 * Challenges — Duolingo-style mission center.
 *
 * Displays a big "Today's Focus" card (the daily challenge) plus a tabbed
 * grid of daily / weekly / evergreen missions. Progress values are derived
 * from the user's learnProgress — future work can plug real DCA / streak
 * sources without changing this page's shape.
 */
export default function Challenges() {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);
  const [tab, setTab] = useState<ChallengeType>('daily');

  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return learnProgress.lastLessonDate === today;
  }, [learnProgress.lastLessonDate]);

  // Rough weekly count = lessons completed in the last 7 days.
  // Without per-lesson timestamps we approximate via the full count capped at 5.
  const completedThisWeek = Math.min(
    5,
    learnProgress.completedLessons.length
  );

  const challenges = useMemo(
    () =>
      buildChallenges(
        completedToday,
        completedThisWeek,
        learnProgress.currentStreak
      ),
    [completedToday, completedThisWeek, learnProgress.currentStreak]
  );

  const todaysFocus = challenges[0]!; // daily
  const filtered = challenges.filter((c) => c.type === tab);

  async function handleShare(c: ChallengeItem) {
    const text = `I'm tackling "${c.title}" on Apice Capital. ${c.illustration}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Apice Challenge', text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }
    } catch {
      // silent
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
              'radial-gradient(circle at 10% 20%, hsl(var(--flame-hot) / 0.18) 0%, transparent 55%), radial-gradient(circle at 90% 80%, hsl(var(--world-portfolio) / 0.12) 0%, transparent 55%)',
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
                <Trophy className="w-5 h-5 text-primary" aria-hidden="true" />
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Challenges
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Daily, weekly, evergreen. Stack XP. Keep the flame alive.
              </p>
            </div>
            <StreakFlame streak={learnProgress.currentStreak} size={36} />
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Today's Focus — big full-width card */}
        <TodaysFocusCard
          challenge={todaysFocus}
          onShare={() => handleShare(todaysFocus)}
          onContinue={() => navigate('/learn')}
        />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Challenge period"
          className="flex items-center gap-1.5 p-1 rounded-xl border border-border/50 bg-card/60 backdrop-blur"
        >
          {(
            [
              { key: 'daily' as ChallengeType, label: 'Daily', icon: Target },
              { key: 'weekly' as ChallengeType, label: 'Weekly', icon: CalendarDays },
              { key: 'evergreen' as ChallengeType, label: 'Seasonal', icon: Sparkles },
            ]
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <t.icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Grid of challenges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onShare={() => handleShare(c)}
              onContinue={() =>
                navigate(c.theme === 'dca' ? '/dca-planner' : '/learn')
              }
            />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl p-8 border border-dashed border-border/50 text-center">
              <Flame className="w-6 h-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold">No challenges here yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                New missions drop every cycle. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Today's Focus Card ────────────────────────────────────────

interface TodaysFocusCardProps {
  challenge: ChallengeItem;
  onShare: () => void;
  onContinue: () => void;
}

function TodaysFocusCard({ challenge, onShare, onContinue }: TodaysFocusCardProps) {
  const pct = Math.min(
    100,
    Math.round((challenge.progress.current / challenge.progress.target) * 100)
  );
  const countdown = useCountdown(challenge.endsAt);
  const theme = THEME_STYLES[challenge.theme];
  const done = challenge.progress.current >= challenge.progress.target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl p-5 border overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.bg}, transparent 120%)`,
        borderColor: theme.ring,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
          style={{ background: theme.bg }}
          aria-hidden="true"
        >
          {challenge.illustration}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: theme.text }}>
            Today's Focus
          </p>
          <p className="font-display text-lg font-bold leading-tight">
            {challenge.title}
          </p>
        </div>
        {countdown && (
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
            Resets in {countdown}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {challenge.description}
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Progress
          </span>
          <span className="text-[11px] font-bold tabular-nums">
            {challenge.progress.current}/{challenge.progress.target}
          </span>
        </div>
        <div className="h-2 rounded-full bg-background/70 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: theme.icon }}
          />
        </div>
      </div>

      {/* Reward + CTAs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border/50">
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400/30" aria-hidden="true" />
          <span className="text-xs font-bold tabular-nums">
            +{challenge.rewardXp} XP
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShare}
            className="h-9 px-3"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            Share
          </Button>
          <Button
            type="button"
            variant="premium"
            size="sm"
            onClick={onContinue}
            className="h-9"
            disabled={done}
          >
            {done ? 'Completed' : 'Continue'}
            {!done && <ChevronRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Challenge Card (grid tile) ────────────────────────────────

interface ChallengeCardProps {
  challenge: ChallengeItem;
  onShare: () => void;
  onContinue: () => void;
}

function ChallengeCard({ challenge, onShare, onContinue }: ChallengeCardProps) {
  const pct = Math.min(
    100,
    Math.round((challenge.progress.current / challenge.progress.target) * 100)
  );
  const countdown = useCountdown(challenge.endsAt);
  const theme = THEME_STYLES[challenge.theme];
  const done = challenge.progress.current >= challenge.progress.target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 border bg-card/80 backdrop-blur overflow-hidden"
      style={{ borderColor: theme.ring }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: theme.bg }}
          aria-hidden="true"
        >
          {challenge.illustration}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[9px] uppercase tracking-[0.16em] font-bold"
              style={{ color: theme.text }}
            >
              {challenge.type === 'evergreen' ? 'Seasonal' : challenge.type}
            </span>
            {countdown && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                · {countdown}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm leading-tight line-clamp-2">
            {challenge.title}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-snug mb-3 line-clamp-2">
        {challenge.description}
      </p>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Progress
          </span>
          <span className="text-[11px] font-bold tabular-nums">
            {challenge.progress.current}/{challenge.progress.target}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-background/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: theme.icon }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400/30" aria-hidden="true" />
            <span className="text-xs font-bold tabular-nums">
              +{challenge.rewardXp} XP
            </span>
          </div>
          {challenge.reward && (
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              + {challenge.reward}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onShare}
            className="w-8 h-8 rounded-lg bg-secondary/30 hover:bg-secondary/50 flex items-center justify-center transition-colors"
            aria-label={`Share ${challenge.title}`}
          >
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={done}
            className={cn(
              'h-8 px-3 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1',
              done
                ? 'bg-secondary/30 text-muted-foreground cursor-default'
                : 'bg-primary/90 hover:bg-primary text-primary-foreground'
            )}
          >
            {done ? 'Done' : 'Go'}
            {!done && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
