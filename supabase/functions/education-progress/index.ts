// Supabase Edge Function: education-progress
// Week 3 — Full implementation.
//
// Actions:
//   - 'complete'     — mark lesson completed, award XP, update streak, level-up, badges
//   - 'view'         — telemetry: upsert lesson_progress first_viewed_at/last_viewed_at/time_spent_sec
//   - 'quiz_attempt' — record quiz result, increment attempts, update best score
//   - 'summary'      — aggregated progress payload for store hydration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ──────────────────────────────────────────────────

interface LessonRow {
  id: string;
  track_id: string;
  xp: number;
}

interface UserXpRow {
  user_id: string;
  total_xp: number;
  level: number;
  title: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  lessons_completed: number;
  tracks_completed: number;
}

interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  unlock_condition_json: UnlockCondition;
  xp_reward: number;
}

type UnlockCondition =
  | { type: 'lessons_completed'; count: number }
  | { type: 'streak_reached'; days: number }
  | { type: 'track_completed'; trackSlug?: string; trackId?: string }
  | { type: 'total_xp'; amount: number }
  | { type: 'perfect_quiz'; count?: number }
  | { type: 'first_quiz_pass' }
  | Record<string, unknown>;

interface LessonProgressRow {
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  score: number | null;
  attempts: number;
  time_spent_sec: number;
  completed_at: string | null;
  first_viewed_at: string;
  last_viewed_at: string;
}

// ─── Helpers ────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function diffInDays(a: string, b: string): number {
  // UTC-midnight safe diff in days between two YYYY-MM-DD strings
  const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
  return Math.round((ta - tb) / (1000 * 60 * 60 * 24));
}

function calculateLevel(xp: number): { level: number; title: string; nextThreshold: number } {
  // Mirrors public.calculate_level from migration 006_v2_foundation.sql
  if (xp >= 6000) return { level: 6, title: 'Elite', nextThreshold: 999999 };
  if (xp >= 3500) return { level: 5, title: 'Master', nextThreshold: 6000 };
  if (xp >= 1800) return { level: 4, title: 'Strategist', nextThreshold: 3500 };
  if (xp >= 800) return { level: 3, title: 'Navigator', nextThreshold: 1800 };
  if (xp >= 300) return { level: 2, title: 'Apprentice', nextThreshold: 800 };
  return { level: 1, title: 'Novice', nextThreshold: 300 };
}

async function ensureUserXp(admin: SupabaseClient, userId: string): Promise<UserXpRow> {
  const { data: existing } = await admin
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as UserXpRow;

  const defaults: UserXpRow = {
    user_id: userId,
    total_xp: 0,
    level: 1,
    title: 'Novice',
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    lessons_completed: 0,
    tracks_completed: 0,
  };
  const { data: inserted, error } = await admin
    .from('user_xp')
    .insert(defaults)
    .select('*')
    .single();

  if (error || !inserted) {
    // Fall back to defaults — upstream will still attempt updates via upsert
    return defaults;
  }
  return inserted as UserXpRow;
}

/**
 * Evaluate all badges the user has NOT yet earned and return those whose
 * unlock condition is satisfied by the current user state.
 */
async function evaluateBadgeUnlocks(
  admin: SupabaseClient,
  userId: string,
  userState: {
    totalXp: number;
    currentStreak: number;
    lessonsCompleted: number;
    tracksCompleted: number;
    completedTrackIds: Set<string>;
    completedTrackSlugs: Set<string>;
    perfectQuizCount: number;
    firstQuizPass: boolean;
  }
): Promise<BadgeRow[]> {
  const [{ data: catalog }, { data: earned }] = await Promise.all([
    admin.from('badges').select('*'),
    admin.from('user_badges').select('badge_id').eq('user_id', userId),
  ]);

  const earnedIds = new Set<string>((earned ?? []).map((r: { badge_id: string }) => r.badge_id));
  const candidates: BadgeRow[] = [];

  for (const raw of (catalog ?? []) as BadgeRow[]) {
    if (earnedIds.has(raw.id)) continue;
    const cond = raw.unlock_condition_json as UnlockCondition;
    const type = (cond as { type?: string })?.type;

    let matched = false;
    if (type === 'lessons_completed') {
      matched = userState.lessonsCompleted >= ((cond as { count: number }).count ?? 0);
    } else if (type === 'streak_reached') {
      matched = userState.currentStreak >= ((cond as { days: number }).days ?? 0);
    } else if (type === 'track_completed') {
      const trackSlug = (cond as { trackSlug?: string }).trackSlug;
      const trackId = (cond as { trackId?: string }).trackId;
      if (trackSlug) matched = userState.completedTrackSlugs.has(trackSlug);
      else if (trackId) matched = userState.completedTrackIds.has(trackId);
    } else if (type === 'total_xp') {
      matched = userState.totalXp >= ((cond as { amount: number }).amount ?? 0);
    } else if (type === 'perfect_quiz') {
      matched = userState.perfectQuizCount >= ((cond as { count?: number }).count ?? 1);
    } else if (type === 'first_quiz_pass') {
      matched = userState.firstQuizPass;
    }

    if (matched) candidates.push(raw);
  }

  return candidates;
}

async function computeCompletedTracks(
  admin: SupabaseClient,
  userId: string
): Promise<{ tracksCompleted: number; completedTrackIds: Set<string>; completedTrackSlugs: Set<string> }> {
  // A track is "completed" when every published lesson in it has a
  // matching completed row in lesson_progress for this user.
  const { data: tracks } = await admin
    .from('learning_tracks')
    .select('id, slug, lessons:lessons!inner(id, is_published)');

  const completedTrackIds = new Set<string>();
  const completedTrackSlugs = new Set<string>();

  if (!tracks || tracks.length === 0) {
    return { tracksCompleted: 0, completedTrackIds, completedTrackSlugs };
  }

  const { data: progress } = await admin
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const completedLessonIds = new Set<string>(
    (progress ?? []).map((p: { lesson_id: string }) => p.lesson_id)
  );

  for (const track of tracks as Array<{ id: string; slug: string; lessons: Array<{ id: string; is_published: boolean }> }>) {
    const published = (track.lessons ?? []).filter((l) => l.is_published);
    if (published.length === 0) continue;
    const allDone = published.every((l) => completedLessonIds.has(l.id));
    if (allDone) {
      completedTrackIds.add(track.id);
      completedTrackSlugs.add(track.slug);
    }
  }

  return { tracksCompleted: completedTrackIds.size, completedTrackIds, completedTrackSlugs };
}

async function computeQuizStats(
  admin: SupabaseClient,
  userId: string
): Promise<{ perfectQuizCount: number; firstQuizPass: boolean }> {
  const { data: rows } = await admin
    .from('lesson_progress')
    .select('score, status')
    .eq('user_id', userId);

  const list = (rows ?? []) as Array<{ score: number | null; status: string }>;
  const perfectQuizCount = list.filter((r) => (r.score ?? 0) >= 100).length;
  const firstQuizPass = list.some((r) => (r.score ?? 0) >= 80 && r.status === 'completed');
  return { perfectQuizCount, firstQuizPass };
}

// ─── Main Handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error('Supabase env vars missing');
    }

    // ─── Auth ──────────────────────────────────────────────
    const userToken = req.headers.get('x-user-token') || req.headers.get('authorization');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bearerToken = userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`;
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: bearerToken } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Admin client (bypasses RLS for user_xp / user_badges) ──
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? '';

    // ─── Action: view ──────────────────────────────────────
    if (action === 'view') {
      const lessonId = String(body.lessonId ?? '');
      const timeSpentSec = Math.max(0, Number(body.timeSpentSec ?? 0));
      if (!lessonId) {
        return new Response(
          JSON.stringify({ error: 'lessonId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date().toISOString();
      // Upsert — preserve first_viewed_at if row exists, bump last_viewed_at + time_spent_sec
      const { data: existing } = await admin
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        await admin
          .from('lesson_progress')
          .update({
            last_viewed_at: now,
            time_spent_sec: (existing.time_spent_sec ?? 0) + timeSpentSec,
          })
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId);
      } else {
        await admin.from('lesson_progress').insert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'in_progress',
          time_spent_sec: timeSpentSec,
          first_viewed_at: now,
          last_viewed_at: now,
        });
      }

      return new Response(
        JSON.stringify({ data: { ok: true } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: quiz_attempt ─────────────────────────────
    if (action === 'quiz_attempt') {
      const lessonId = String(body.lessonId ?? '');
      const score = Number(body.score ?? 0);
      const passed = Boolean(body.passed);
      if (!lessonId) {
        return new Response(
          JSON.stringify({ error: 'lessonId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date().toISOString();
      const { data: existing } = await admin
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const prevScore = existing?.score ?? 0;
      const bestScore = Math.max(prevScore, score);
      const attempts = (existing?.attempts ?? 0) + 1;

      if (existing) {
        await admin
          .from('lesson_progress')
          .update({
            score: bestScore,
            attempts,
            status: passed ? 'in_progress' : existing.status, // 'complete' flips it to 'completed'
            last_viewed_at: now,
          })
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId);
      } else {
        await admin.from('lesson_progress').insert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'in_progress',
          score: bestScore,
          attempts,
          first_viewed_at: now,
          last_viewed_at: now,
        });
      }

      return new Response(
        JSON.stringify({ data: { attempts, bestScore, passed } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: complete ─────────────────────────────────
    if (action === 'complete') {
      const lessonId = String(body.lessonId ?? '');
      const score = Number(body.score ?? 0);
      const timeSpentSec = Math.max(0, Number(body.timeSpentSec ?? 0));
      if (!lessonId) {
        return new Response(
          JSON.stringify({ error: 'lessonId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Fetch lesson
      const { data: lesson, error: lessonErr } = await admin
        .from('lessons')
        .select('id, track_id, xp')
        .eq('id', lessonId)
        .maybeSingle();
      if (lessonErr || !lesson) {
        return new Response(
          JSON.stringify({ error: 'Lesson not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const lessonRow = lesson as LessonRow;

      const now = new Date().toISOString();
      const today = todayIso();

      // 2. Check if lesson already completed (idempotent — no double XP)
      const { data: prevProgress } = await admin
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const alreadyCompleted = prevProgress?.status === 'completed';
      const prevScore = (prevProgress as LessonProgressRow | null)?.score ?? 0;
      const bestScore = Math.max(prevScore, score);

      // 3. Upsert lesson_progress → completed
      const progressPayload: Partial<LessonProgressRow> = {
        user_id: user.id,
        lesson_id: lessonId,
        status: 'completed',
        score: bestScore,
        attempts: (prevProgress?.attempts ?? 0) + (alreadyCompleted ? 0 : 1),
        time_spent_sec: (prevProgress?.time_spent_sec ?? 0) + timeSpentSec,
        completed_at: alreadyCompleted ? (prevProgress?.completed_at ?? now) : now,
        last_viewed_at: now,
      };
      if (!prevProgress) progressPayload.first_viewed_at = now;

      await admin
        .from('lesson_progress')
        .upsert(progressPayload, { onConflict: 'user_id,lesson_id' });

      // 4. Load user_xp (or create default)
      const userXp = await ensureUserXp(admin, user.id);

      // 5. Streak calculation
      let newStreak = userXp.current_streak ?? 0;
      const lastActive = userXp.last_active_date;
      if (!lastActive) {
        newStreak = 1;
      } else if (lastActive === today) {
        // no change
      } else {
        const delta = diffInDays(today, lastActive);
        if (delta === 1) newStreak = newStreak + 1;
        else if (delta > 1) newStreak = 1;
        // delta < 0 shouldn't happen (clock skew) — keep current
      }
      const newLongest = Math.max(userXp.longest_streak ?? 0, newStreak);

      // 6. XP award (skip if idempotent replay of same completion)
      let xpAwarded = 0;
      if (!alreadyCompleted) {
        xpAwarded += lessonRow.xp ?? 0;
        if (score >= 80) xpAwarded += 30; // quiz bonus
        if (newStreak >= 7) xpAwarded = Math.round(xpAwarded * 1.5); // streak multiplier
      }
      const newTotalXp = (userXp.total_xp ?? 0) + xpAwarded;

      // 7. Level calculation
      const oldLevel = userXp.level ?? 1;
      const { level: newLevel, title: newTitle, nextThreshold } = calculateLevel(newTotalXp);
      const leveledUp = newLevel > oldLevel;

      // 8. Update user_xp row
      const newLessonsCompleted = alreadyCompleted
        ? (userXp.lessons_completed ?? 0)
        : (userXp.lessons_completed ?? 0) + 1;

      await admin
        .from('user_xp')
        .upsert(
          {
            user_id: user.id,
            total_xp: newTotalXp,
            level: newLevel,
            title: newTitle,
            current_streak: newStreak,
            longest_streak: newLongest,
            last_active_date: today,
            lessons_completed: newLessonsCompleted,
            tracks_completed: userXp.tracks_completed ?? 0,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        );

      // 9. Recompute track completions and badge eligibility
      const { tracksCompleted, completedTrackIds, completedTrackSlugs } = await computeCompletedTracks(admin, user.id);
      if (tracksCompleted !== (userXp.tracks_completed ?? 0)) {
        await admin
          .from('user_xp')
          .update({ tracks_completed: tracksCompleted, updated_at: now })
          .eq('user_id', user.id);
      }

      const { perfectQuizCount, firstQuizPass } = await computeQuizStats(admin, user.id);

      const newlyUnlocked = await evaluateBadgeUnlocks(admin, user.id, {
        totalXp: newTotalXp,
        currentStreak: newStreak,
        lessonsCompleted: newLessonsCompleted,
        tracksCompleted,
        completedTrackIds,
        completedTrackSlugs,
        perfectQuizCount,
        firstQuizPass,
      });

      // 10. Insert user_badges for newly earned
      if (newlyUnlocked.length > 0) {
        const inserts = newlyUnlocked.map((b) => ({
          user_id: user.id,
          badge_id: b.id,
          earned_at: now,
          context_json: { via: 'lesson_complete', lessonId },
        }));
        await admin.from('user_badges').upsert(inserts, { onConflict: 'user_id,badge_id' });
      }

      const badgesUnlocked = newlyUnlocked.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        description: b.description ?? undefined,
        icon: b.icon ?? undefined,
        rarity: b.rarity,
        earnedAt: now,
      }));

      return new Response(
        JSON.stringify({
          data: {
            xpAwarded,
            totalXp: newTotalXp,
            level: newLevel,
            title: newTitle,
            nextThreshold,
            leveledUp,
            streak: newStreak,
            longestStreak: newLongest,
            lessonsCompleted: newLessonsCompleted,
            tracksCompleted,
            badgesUnlocked,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: summary ──────────────────────────────────
    if (action === 'summary') {
      const userXp = await ensureUserXp(admin, user.id);
      const { level, title, nextThreshold } = calculateLevel(userXp.total_xp);

      const [{ data: earnedBadgeRows }, { data: challengeRows }] = await Promise.all([
        admin
          .from('user_badges')
          .select('earned_at, badges ( id, slug, name, description, icon, rarity )')
          .eq('user_id', user.id),
        admin
          .from('challenges')
          .select('id, slug, title, description, type, rules_json, reward_xp, active_from, active_to')
          .eq('is_active', true),
      ]);

      const badges = (earnedBadgeRows ?? []).map((row: any) => ({
        id: row.badges?.id,
        slug: row.badges?.slug,
        name: row.badges?.name,
        description: row.badges?.description ?? undefined,
        icon: row.badges?.icon ?? undefined,
        rarity: row.badges?.rarity,
        earnedAt: row.earned_at,
      })).filter((b: { id?: string }) => b.id);

      const activeChallenges = (challengeRows ?? []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description ?? undefined,
        type: c.type,
        rulesJson: c.rules_json,
        rewardXp: c.reward_xp ?? 0,
        activeFrom: c.active_from ?? undefined,
        activeTo: c.active_to ?? undefined,
      }));

      return new Response(
        JSON.stringify({
          data: {
            totalXp: userXp.total_xp,
            level,
            title,
            nextThreshold,
            streak: userXp.current_streak,
            longestStreak: userXp.longest_streak,
            lessonsCompleted: userXp.lessons_completed,
            tracksCompleted: userXp.tracks_completed,
            lastActiveDate: userXp.last_active_date,
            badges,
            activeChallenges,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "complete", "view", "quiz_attempt", or "summary".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[education-progress] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
