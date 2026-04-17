// Education slice — gamified learning (Week 3)
// Backed by edge function: education-progress
//
// Actions supported by the edge function:
//   - { action: 'complete', lessonId, score, timeSpentSec }
//   - { action: 'view', lessonId, timeSpentSec }
//   - { action: 'quiz_attempt', lessonId, score, passed }
//   - { action: 'summary' }
//
// Tracks + lessons are read directly from Supabase (RLS-scoped to published rows);
// only user-private gamification state rides through the edge function with service role.

import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { supabase } from '@/integrations/supabase/client';
import type {
  SliceCreator,
  EducationSlice,
  Badge,
  Challenge,
  Lesson,
  Track,
} from '../types';

interface SummaryResponse {
  totalXp: number;
  level: number;
  title: string;
  nextThreshold: number;
  streak: number;
  longestStreak: number;
  lessonsCompleted: number;
  tracksCompleted: number;
  lastActiveDate: string | null;
  badges: Badge[];
  activeChallenges: Challenge[];
}

interface CompleteResponse {
  xpAwarded: number;
  totalXp: number;
  level: number;
  title: string;
  nextThreshold: number;
  leveledUp: boolean;
  streak: number;
  longestStreak: number;
  lessonsCompleted: number;
  tracksCompleted: number;
  badgesUnlocked: Badge[];
}

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tier: 'free' | 'pro' | 'club';
  order: number;
  icon: string | null;
  color_theme: string | null;
  lesson_count: number | null;
  xp_total: number | null;
}

interface LessonRow {
  id: string;
  track_id: string;
  slug: string;
  title: string;
  summary: string | null;
  video_url: string | null;
  video_duration_sec: number | null;
  duration_min: number | null;
  xp: number;
  order: number;
  required_tier: 'free' | 'pro' | 'club';
  quiz: unknown;
  challenge: unknown;
}

interface LessonProgressRow {
  lesson_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  score: number | null;
}

function mapTrack(row: TrackRow): Track {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    tier: row.tier,
    order: row.order,
    icon: row.icon ?? undefined,
    colorTheme: row.color_theme ?? undefined,
    lessonCount: row.lesson_count ?? 0,
    xpTotal: row.xp_total ?? 0,
  };
}

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    trackId: row.track_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? undefined,
    videoUrl: row.video_url ?? undefined,
    videoDurationSec: row.video_duration_sec ?? undefined,
    durationMin: row.duration_min ?? 4,
    xp: row.xp,
    order: row.order,
    requiredTier: row.required_tier,
    quiz: Array.isArray(row.quiz) ? (row.quiz as unknown[]) : undefined,
    challenge: row.challenge ?? undefined,
  };
}

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
    try {
      // 1. Catalog from public tables (RLS restricts to published rows)
      const [tracksRes, lessonsRes, badgesRes, progressRes] = await Promise.all([
        supabase
          .from('learning_tracks')
          .select('id, slug, title, description, tier, order, icon, color_theme, lesson_count, xp_total')
          .eq('is_active', true)
          .order('order', { ascending: true }),
        supabase
          .from('lessons')
          .select('id, track_id, slug, title, summary, video_url, video_duration_sec, duration_min, xp, order, required_tier, quiz, challenge')
          .eq('is_published', true)
          .order('order', { ascending: true }),
        supabase
          .from('badges')
          .select('id, slug, name, description, icon, rarity'),
        supabase
          .from('lesson_progress')
          .select('lesson_id, status, score'),
      ]);

      const tracks: Track[] = ((tracksRes.data ?? []) as TrackRow[]).map(mapTrack);
      const lessons: Lesson[] = ((lessonsRes.data ?? []) as LessonRow[]).map(mapLesson);
      const lessonsByTrack: Record<string, Lesson[]> = {};
      for (const lesson of lessons) {
        if (!lessonsByTrack[lesson.trackId]) lessonsByTrack[lesson.trackId] = [];
        lessonsByTrack[lesson.trackId].push(lesson);
      }

      const badges: Badge[] = (badgesRes.data ?? []).map((row: any) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description ?? undefined,
        icon: row.icon ?? undefined,
        rarity: row.rarity,
      }));

      const progressRows = (progressRes.data ?? []) as LessonProgressRow[];
      const completedLessons = progressRows
        .filter((r) => r.status === 'completed')
        .map((r) => r.lesson_id);
      const lessonScores: Record<string, number> = {};
      for (const row of progressRows) {
        if (row.score !== null && row.score !== undefined) {
          lessonScores[row.lesson_id] = Number(row.score);
        }
      }

      // 2. Summary via edge function
      const { data } = await invokeEdgeFunction<{ data: SummaryResponse }>('education-progress', {
        body: { action: 'summary' },
      });

      const summary = data?.data;

      set({
        tracks,
        lessonsByTrack,
        badges,
        completedLessons,
        lessonScores,
        totalXP: summary?.totalXp ?? 0,
        level: summary?.level ?? 1,
        levelTitle: summary?.title ?? 'Novice',
        nextLevelThreshold: summary?.nextThreshold ?? 300,
        streak: summary?.streak ?? 0,
        longestStreak: summary?.longestStreak ?? 0,
        lastActiveDate: summary?.lastActiveDate ?? null,
        earnedBadges: summary?.badges ?? [],
        activeChallenges: summary?.activeChallenges ?? [],
      });
    } catch (err) {
      // Fail open — keep whatever is in state (persisted offline values still render)
      if (import.meta.env.DEV) {
        console.warn('[education] hydrateEducation failed:', err);
      }
    }
  },

  completeLesson_v2: async (lessonId, score, timeSpentSec) => {
    try {
      const { data, error } = await invokeEdgeFunction<{ data: CompleteResponse }>(
        'education-progress',
        {
          body: { action: 'complete', lessonId, score, timeSpentSec },
        }
      );

      if (error || !data?.data) {
        return { leveledUp: false, badgesUnlocked: [] as Badge[] };
      }

      const payload = data.data;
      const unlocked = payload.badgesUnlocked ?? [];

      set((state) => {
        const completedLessons = state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId];

        const lessonScores = {
          ...state.lessonScores,
          [lessonId]: Math.max(state.lessonScores[lessonId] ?? 0, score),
        };

        const mergedBadges = [...state.earnedBadges];
        for (const badge of unlocked) {
          if (!mergedBadges.some((b) => b.id === badge.id)) {
            mergedBadges.push(badge);
          }
        }

        return {
          completedLessons,
          lessonScores,
          totalXP: payload.totalXp,
          level: payload.level,
          levelTitle: payload.title,
          nextLevelThreshold: payload.nextThreshold,
          streak: payload.streak,
          longestStreak: Math.max(state.longestStreak, payload.longestStreak, payload.streak),
          earnedBadges: mergedBadges,
          lastCelebration: payload.leveledUp
            ? { type: 'level', payload, seen: false }
            : unlocked.length > 0
              ? { type: 'badge', payload: unlocked[0], seen: false }
              : state.lastCelebration,
        };
      });

      return { leveledUp: payload.leveledUp, badgesUnlocked: unlocked };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[education] completeLesson_v2 failed:', err);
      }
      return { leveledUp: false, badgesUnlocked: [] as Badge[] };
    }
  },

  recordLessonView: async (lessonId, timeSpentSec) => {
    try {
      await invokeEdgeFunction('education-progress', {
        body: { action: 'view', lessonId, timeSpentSec },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[education] recordLessonView failed:', err);
      }
    }
  },

  acknowledgeCelebration: () => set({ lastCelebration: null }),
});
