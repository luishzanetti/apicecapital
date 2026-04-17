import type { SliceCreator, LearnSlice } from '../types';
import { defaultLearnProgress } from '../defaults';

export const createLearnSlice: SliceCreator<LearnSlice> = (set) => ({
  learnProgress: defaultLearnProgress,

  completeLesson: (lessonId) =>
    set((state) => {
      const today = new Date().toDateString();
      const lastDate = state.learnProgress.lastLessonDate;
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      let newStreak = state.learnProgress.currentStreak;
      if (lastDate === yesterday) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      return {
        learnProgress: {
          ...state.learnProgress,
          completedLessons: [
            ...new Set([...state.learnProgress.completedLessons, lessonId]),
          ],
          currentStreak: newStreak,
          lastLessonDate: today,
        },
      };
    }),

  unlockTrack: (trackId) =>
    set((state) => ({
      learnProgress: {
        ...state.learnProgress,
        unlockedTracks: [...new Set([...state.learnProgress.unlockedTracks, trackId])],
      },
    })),

  // Resets the local gamified learning state — clears completed lessons,
  // streak, and earned-badge cache. Remote (server-side) XP/streaks managed
  // by the education-progress edge function are NOT reset here; that requires
  // a dedicated admin action.
  resetLearnProgress: () =>
    set(() => ({
      learnProgress: { ...defaultLearnProgress },
      completedLessons: [],
      lessonScores: {},
      earnedBadges: [],
      totalXP: 0,
      level: 1,
      levelTitle: 'Novice',
      nextLevelThreshold: 300,
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    })),
});
