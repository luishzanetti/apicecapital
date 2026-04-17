// Education slice — gamified learning scaffold (Week 3)
// Backed by edge functions: education-progress, challenge-engine
// Current implementation returns placeholder values; real logic lands in Week 3.

import type { SliceCreator, EducationSlice, Badge } from '../types';

export const createEducationSlice: SliceCreator<EducationSlice> = (set, _get) => ({
  tracks: [],
  lessonsByTrack: {},
  badges: [],
  completedLessons: [],
  lessonScores: {},
  totalXP: 0,
  level: 1,
  levelTitle: 'Novice',
  nextLevelThreshold: 300,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  earnedBadges: [],
  activeChallenges: [],
  lastCelebration: null,

  hydrateEducation: async () => {
    // TODO: Week 3 — call education-progress with action='summary' and populate slice state.
    // - Fetch tracks, lessonsByTrack, badges (catalog)
    // - Fetch user aggregates: totalXP, level, levelTitle, nextLevelThreshold, streak, earnedBadges, activeChallenges
    // - Fetch completedLessons + lessonScores maps
    return;
  },

  completeLesson_v2: async (_lessonId, _score, _timeSpentSec) => {
    // TODO: Week 3 — call education-progress with action='complete'
    // On success:
    //   - merge completedLessons, update lessonScores, add XP, maybe level up
    //   - append unlocked badges to earnedBadges + set lastCelebration
    //   - invoke challenge-engine with trigger='lesson_completed'
    const badgesUnlocked: Badge[] = [];
    return { leveledUp: false, badgesUnlocked };
  },

  recordLessonView: async (_lessonId, _timeSpentSec) => {
    // TODO: Week 3 — call education-progress with action='view'. Fire-and-forget telemetry.
    return;
  },

  acknowledgeCelebration: () => set({ lastCelebration: null }),
});
