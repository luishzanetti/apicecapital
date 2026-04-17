import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, GraduationCap, Zap } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import { AcademyProgressRing } from '@/components/academy/ProgressRing';
import { StreakFlame } from '@/components/academy/StreakFlame';

const XP_PER_LESSON = 50;
const LEVEL_THRESHOLDS = [0, 150, 350, 600, 1000, 1500, 2200];

interface ContinueTarget {
  lessonId: string;
  lessonTitle: string;
  trackName: string;
}

function computeLevel(xp: number): {
  level: number;
  progress: number;
  xpToNext: number;
} {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= (LEVEL_THRESHOLDS[i] ?? 0)) level = i + 1;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 700;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const progress = Math.min(100, Math.max(0, ((xp - currentThreshold) / span) * 100));
  return {
    level,
    progress,
    xpToNext: Math.max(0, nextThreshold - xp),
  };
}

/**
 * AcademyHomeWidget — compact Academy preview for the Home page.
 *
 * Shows current level + progress ring, streak flame, and a "Continue lesson"
 * CTA pointing at the next unfinished lesson in the first track with
 * remaining work. Falls back to "View Academy" when everything is complete.
 *
 * Read-only of the Zustand store — no network calls. Safe to render before
 * hydrateEducation() has resolved (it will show zeros until data arrives).
 */
export function AcademyHomeWidget() {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);

  const completedCount = learnProgress.completedLessons.length;
  const totalXP = completedCount * XP_PER_LESSON;
  const { level, progress, xpToNext } = computeLevel(totalXP);

  const continueTarget: ContinueTarget | null = useMemo(() => {
    for (const track of learningTracks) {
      for (const lesson of track.lessons) {
        if (!learnProgress.completedLessons.includes(lesson.id)) {
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            trackName: track.name,
          };
        }
      }
    }
    return null;
  }, [learnProgress.completedLessons]);

  return (
    <motion.button
      type="button"
      onClick={() =>
        continueTarget
          ? navigate(`/learn/lesson/${continueTarget.lessonId}`)
          : navigate('/learn')
      }
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden rounded-3xl glass-card p-5 text-left hover:bg-white/[0.04] transition-all press-scale group"
      aria-label={
        continueTarget
          ? `Continue lesson: ${continueTarget.lessonTitle}`
          : 'Open Apice Academy'
      }
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 15% 30%, hsl(var(--world-foundation) / 0.18) 0%, transparent 55%), radial-gradient(circle at 85% 70%, hsl(var(--world-portfolio) / 0.12) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4">
        <AcademyProgressRing
          size={64}
          stroke={6}
          progress={progress}
          color="hsl(var(--apice-emerald))"
        >
          <div className="text-center leading-none">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
              LVL
            </p>
            <p className="font-display font-mono text-lg font-semibold tabular-nums text-white">{level}</p>
          </div>
        </AcademyProgressRing>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))]" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--apice-emerald))]">
              Apice Academy
            </p>
          </div>

          {continueTarget ? (
            <>
              <p className="text-[15px] font-semibold text-white leading-tight truncate">
                Continue: {continueTarget.lessonTitle}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/55">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Zap className="w-3 h-3 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
                  {totalXP} XP
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {xpToNext > 0
                    ? `${xpToNext} XP to level ${level + 1}`
                    : 'Max level'}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-white leading-tight">
                All caught up — keep the streak alive
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/55">
                <BookOpen className="w-3 h-3" aria-hidden="true" />
                <span className="font-mono tabular-nums">{completedCount} lessons complete</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StreakFlame streak={learnProgress.currentStreak} size={30} />
          <ChevronRight
            className="w-4 h-4 text-white/35 group-hover:text-[hsl(var(--apice-emerald))] transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>
    </motion.button>
  );
}
