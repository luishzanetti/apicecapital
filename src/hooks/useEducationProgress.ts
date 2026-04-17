// useEducationProgress — thin selector hook over educationSlice.
// Exposes the pieces of gamification state most components need and derives
// a `progressToNext` percentage against the current level's next threshold.

import { useAppStore } from '@/store/appStore';
import type { Badge } from '@/store/types';

export interface UseEducationProgressResult {
  totalXP: number;
  level: number;
  levelTitle: string;
  progressToNext: number;
  streak: number;
  longestStreak: number;
  badges: Badge[];
  completedLessons: string[];
  completeLesson: (
    lessonId: string,
    score: number,
    timeSpentSec: number
  ) => Promise<{ leveledUp: boolean; badgesUnlocked: Badge[] }>;
  recordLessonView: (lessonId: string, timeSpentSec: number) => Promise<void>;
  hydrate: () => Promise<void>;
}

export function useEducationProgress(): UseEducationProgressResult {
  const totalXP = useAppStore((s) => s.totalXP);
  const level = useAppStore((s) => s.level);
  const levelTitle = useAppStore((s) => s.levelTitle);
  const nextLevelThreshold = useAppStore((s) => s.nextLevelThreshold);
  const streak = useAppStore((s) => s.streak);
  const longestStreak = useAppStore((s) => s.longestStreak);
  const badges = useAppStore((s) => s.earnedBadges);
  const completedLessons = useAppStore((s) => s.completedLessons);
  const completeLesson = useAppStore((s) => s.completeLesson_v2);
  const recordLessonView = useAppStore((s) => s.recordLessonView);
  const hydrate = useAppStore((s) => s.hydrateEducation);

  const safeThreshold = nextLevelThreshold > 0 ? nextLevelThreshold : 1;
  const progressToNext = Math.min(100, Math.max(0, ((totalXP % safeThreshold) / safeThreshold) * 100));

  return {
    totalXP,
    level,
    levelTitle,
    progressToNext,
    streak,
    longestStreak,
    badges,
    completedLessons,
    completeLesson,
    recordLessonView,
    hydrate,
  };
}
