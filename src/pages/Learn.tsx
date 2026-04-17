import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, BookOpen, ChevronRight, GraduationCap, Target, Trophy,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { learningTracks, learnBadges } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { AcademyProgressRing } from '@/components/academy/ProgressRing';
import { StreakFlame } from '@/components/academy/StreakFlame';
import { XPCounter } from '@/components/academy/XPCounter';
import { LearningMap } from '@/components/academy/LearningMap';

const XP_PER_LESSON = 50;

const LEVEL_THRESHOLDS = [0, 150, 350, 600, 1000, 1500, 2200];
const LEVEL_TITLES = [
  'Novice',
  'Apprentice',
  'Student',
  'Specialist',
  'Expert',
  'Master',
  'Grandmaster',
];

function computeLevel(xp: number) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 700;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const progress = Math.min(100, Math.max(0, ((xp - currentThreshold) / span) * 100));
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]!,
    progress,
    xpToNext: Math.max(0, nextThreshold - xp),
  };
}

/**
 * Learn (Apice Academy) — top-level gamified learning hub.
 *
 * Replaces the old list-based layout with a hero, daily-goal card, the
 * Duolingo-style Learning Map, and quick-access panels for badges and
 * challenges. All state comes from `useAppStore` (learnProgress).
 */
export default function Learn() {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);

  const completedCount = learnProgress.completedLessons.length;
  const totalXP = completedCount * XP_PER_LESSON;
  const { level, title, progress: levelProgress, xpToNext } = computeLevel(totalXP);

  const earnedBadges = useMemo(() => {
    const completedTracks = learningTracks.filter((t) =>
      t.lessons.every((l) => learnProgress.completedLessons.includes(l.id))
    ).length;
    return learnBadges.filter((b) => {
      if (b.unlockCondition.type === 'lessons') {
        return completedCount >= b.unlockCondition.count;
      }
      if (b.unlockCondition.type === 'streak') {
        return learnProgress.currentStreak >= b.unlockCondition.count;
      }
      if (b.unlockCondition.type === 'tracks') {
        return completedTracks >= b.unlockCondition.count;
      }
      return false;
    });
  }, [completedCount, learnProgress]);

  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return learnProgress.lastLessonDate === today;
  }, [learnProgress.lastLessonDate]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero header */}
      <div className="relative px-5 pt-7 pb-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 10% 20%, hsl(var(--world-foundation) / 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, hsl(var(--world-portfolio) / 0.15) 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-primary" aria-hidden="true" />
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Apice Academy
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Master crypto. Earn XP. Build the habit.
              </p>
            </div>
            <StreakFlame streak={learnProgress.currentStreak} size={36} />
          </div>

          {/* Level card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur backdrop-blur p-5"
          >
            <div className="flex items-center gap-4">
              <AcademyProgressRing
                size={72}
                stroke={6}
                progress={levelProgress}
                color="hsl(var(--primary))"
              >
                <div className="text-center leading-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    LVL
                  </p>
                  <p className="font-display text-xl font-bold">{level}</p>
                </div>
              </AcademyProgressRing>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{title}</p>
                <div className="mt-1">
                  <XPCounter value={totalXP} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {xpToNext > 0 ? `${xpToNext} XP to level ${level + 1}` : 'Max level reached'}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="font-display text-xl font-bold">{completedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lessons
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-bold">{learnProgress.currentStreak}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Day streak
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-bold">{earnedBadges.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Badges
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Daily goal */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-4 border"
          style={{
            background: completedToday
              ? 'linear-gradient(135deg, hsl(var(--apice-success) / 0.15), transparent 120%)'
              : 'linear-gradient(135deg, hsl(var(--apice-gold) / 0.12), transparent 120%)',
            borderColor: completedToday
              ? 'hsl(var(--apice-success) / 0.3)'
              : 'hsl(var(--apice-gold) / 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: completedToday
                  ? 'hsl(var(--apice-success) / 0.2)'
                  : 'hsl(var(--apice-gold) / 0.2)',
              }}
            >
              <Target
                className="w-5 h-5"
                style={{
                  color: completedToday
                    ? 'hsl(var(--apice-success))'
                    : 'hsl(var(--apice-gold))',
                }}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">
                {completedToday ? "Today's goal — done" : "Today's goal"}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedToday
                  ? 'Daily reward collected. See you tomorrow.'
                  : 'Complete 1 lesson to keep your streak alive.'}
              </p>
            </div>
            {!completedToday && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </motion.div>

        {/* Learning map */}
        <LearningMap />

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/badges')}
            className="rounded-2xl border border-white/10 bg-card p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold">Badges</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {earnedBadges.length} of {learnBadges.length} unlocked
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/challenges')}
            className="rounded-2xl border border-white/10 bg-card p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold">Challenges</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily & weekly missions
            </p>
          </button>
        </div>

        {/* Empty state helper */}
        {completedCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 border border-primary/30 bg-primary/5 text-center"
          >
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-bold mb-1">Your journey starts here</p>
            <p className="text-xs text-muted-foreground mb-3">
              Begin with Foundations — 4 minutes to your first XP.
            </p>
            <Button
              variant="premium"
              size="sm"
              className="w-full"
              onClick={() => {
                const first = learningTracks[0]?.lessons[0];
                if (first) navigate(`/learn/lesson/${first.id}`);
              }}
            >
              Start first lesson
              <ChevronRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
