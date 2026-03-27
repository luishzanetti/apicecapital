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
});
