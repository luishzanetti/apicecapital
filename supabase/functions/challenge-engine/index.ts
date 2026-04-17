// Supabase Edge Function: challenge-engine
// Week 3 — Full implementation.
//
// Event-driven evaluator for active challenges.
//
// Actions:
//   - 'evaluate' — Called from education-progress (or other edge functions)
//                  when events trigger. Service-role calls accepted.
//                  Input:  { action, userId, trigger, metadata? }
//                  Output: { data: { completedChallenges, xpAwarded, badgesUnlocked } }
//
//   - 'list'     — Return active challenges with the user's progress merged.
//                  Input:  { action, type?: 'daily' | 'weekly' | 'all' }
//                  Output: { data: { challenges: ChallengeWithProgress[] } }
//
//   - 'start'    — User explicitly starts a challenge (for opt-in challenges).
//                  Input:  { action, challengeId }
//                  Output: { data: { challengeId, startedAt } }
//
// Rule schema (stored in challenges.rules_json):
//   {
//     trigger: 'lesson_completed' | 'streak_reached' | 'track_completed'
//            | 'dca_executed' | 'xp_earned',
//     target: {
//       action: string,          // semantic identifier of what counts
//       count: number,           // how many occurrences are required
//       trackSlug?: string,      // optional: specific track filter
//       scope?: 'any' | 'same-day' | 'within-week',
//     },
//     window?: '24h' | '7d' | '30d' | null,  // time limit
//   }
//
// Response envelope: { data: T | null, error?: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ──────────────────────────────────────────────────

type TriggerKind =
  | 'lesson_completed'
  | 'streak_reached'
  | 'track_completed'
  | 'dca_executed'
  | 'xp_earned';

type WindowKind = '24h' | '7d' | '30d' | null;

interface ChallengeRule {
  trigger: TriggerKind;
  target: {
    action: string;
    count: number;
    trackSlug?: string;
    scope?: 'any' | 'same-day' | 'within-week';
  };
  window?: WindowKind;
}

interface ChallengeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: 'daily' | 'weekly' | 'seasonal' | 'evergreen' | 'cohort';
  rules_json: ChallengeRule;
  reward_xp: number;
  badge_id: string | null;
  active_from: string | null;
  active_to: string | null;
  is_active: boolean;
  created_at: string;
}

interface ChallengeProgressRow {
  user_id: string;
  challenge_id: string;
  progress_json: {
    current?: number;
    target?: number;
    startedAt?: string;
    lastEventAt?: string;
    [key: string]: unknown;
  };
  started_at: string;
  completed_at: string | null;
}

interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  xp_reward: number;
}

interface EvaluateMetadata {
  lessonId?: string;
  trackId?: string;
  trackSlug?: string;
  streakDays?: number;
  xpDelta?: number;
  [key: string]: unknown;
}

interface CompletedChallengeDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: ChallengeRow['type'];
  rewardXp: number;
  completedAt: string;
}

interface BadgeDto {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: BadgeRow['rarity'];
  earnedAt: string;
}

interface ChallengeWithProgressDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: ChallengeRow['type'];
  rulesJson: ChallengeRule;
  rewardXp: number;
  activeFrom?: string;
  activeTo?: string;
  progress?: {
    current: number;
    target: number;
    startedAt?: string;
    completedAt?: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function windowMs(window: WindowKind): number | null {
  if (!window) return null;
  switch (window) {
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function isWindowExpired(startedAt: string | undefined, window: WindowKind): boolean {
  if (!window || !startedAt) return false;
  const ms = windowMs(window);
  if (ms == null) return false;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return false;
  return Date.now() - start > ms;
}

function isChallengeActive(challenge: ChallengeRow, ts: number = Date.now()): boolean {
  if (!challenge.is_active) return false;
  if (challenge.active_from) {
    const from = Date.parse(challenge.active_from);
    if (!Number.isNaN(from) && ts < from) return false;
  }
  if (challenge.active_to) {
    const to = Date.parse(challenge.active_to);
    if (!Number.isNaN(to) && ts > to) return false;
  }
  return true;
}

/**
 * Decide whether a given challenge is relevant for the trigger+metadata pair.
 * Pure function — no side effects.
 */
function matchesRule(challenge: ChallengeRow, trigger: TriggerKind, metadata: EvaluateMetadata): boolean {
  const rule = challenge.rules_json;
  if (!rule || rule.trigger !== trigger) return false;

  // Filter by trackSlug if rule scopes to a specific track
  const targetSlug = rule.target?.trackSlug;
  if (targetSlug && metadata.trackSlug && targetSlug !== metadata.trackSlug) {
    return false;
  }

  return true;
}

/**
 * Compute the next progress state for a challenge given the incoming event.
 * Handles window expiry by resetting counters.
 */
function incrementProgress(
  current: ChallengeProgressRow | null,
  rule: ChallengeRule,
  trigger: TriggerKind,
  metadata: EvaluateMetadata
): { progress: ChallengeProgressRow['progress_json']; startedAt: string; reachedTarget: boolean } {
  const target = Math.max(1, rule.target?.count ?? 1);
  const now = nowIso();

  const existingStartedAt = current?.progress_json?.startedAt ?? current?.started_at;
  const expired = isWindowExpired(existingStartedAt, rule.window ?? null);

  const prevCount = !expired && typeof current?.progress_json?.current === 'number'
    ? current.progress_json.current
    : 0;

  // Some triggers carry the exact count (e.g. streak_reached → metadata.streakDays).
  let nextCount: number;
  if (trigger === 'streak_reached' && typeof metadata.streakDays === 'number') {
    nextCount = Math.max(prevCount, metadata.streakDays);
  } else {
    nextCount = prevCount + 1;
  }

  const startedAt = expired || !existingStartedAt ? now : existingStartedAt;

  return {
    progress: {
      current: Math.min(nextCount, target),
      target,
      startedAt,
      lastEventAt: now,
    },
    startedAt,
    reachedTarget: nextCount >= target,
  };
}

function mapChallengeRowToDto(
  row: ChallengeRow,
  progress: ChallengeProgressRow | null
): ChallengeWithProgressDto {
  const target = row.rules_json?.target?.count ?? 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    rulesJson: row.rules_json,
    rewardXp: row.reward_xp ?? 0,
    activeFrom: row.active_from ?? undefined,
    activeTo: row.active_to ?? undefined,
    progress: progress
      ? {
          current: typeof progress.progress_json?.current === 'number' ? progress.progress_json.current : 0,
          target: typeof progress.progress_json?.target === 'number' ? progress.progress_json.target : target,
          startedAt: progress.started_at,
          completedAt: progress.completed_at ?? undefined,
        }
      : undefined,
  };
}

// ─── Data access ────────────────────────────────────────────

async function fetchActiveChallengesByTrigger(
  admin: SupabaseClient,
  trigger: TriggerKind
): Promise<ChallengeRow[]> {
  const { data, error } = await admin
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .contains('rules_json', { trigger });

  if (error) {
    // Fallback: some PostgREST configurations may reject `.contains` on mixed
    // JSONB shapes. Fall back to a full scan and filter in memory.
    const { data: all, error: err2 } = await admin
      .from('challenges')
      .select('*')
      .eq('is_active', true);
    if (err2) throw err2;
    return ((all ?? []) as ChallengeRow[]).filter(
      (c) => c.rules_json?.trigger === trigger && isChallengeActive(c)
    );
  }

  return ((data ?? []) as ChallengeRow[]).filter((c) => isChallengeActive(c));
}

async function fetchChallengeProgress(
  admin: SupabaseClient,
  userId: string,
  challengeIds: string[]
): Promise<Map<string, ChallengeProgressRow>> {
  const map = new Map<string, ChallengeProgressRow>();
  if (challengeIds.length === 0) return map;

  const { data, error } = await admin
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  if (error) throw error;

  for (const row of (data ?? []) as ChallengeProgressRow[]) {
    map.set(row.challenge_id, row);
  }
  return map;
}

async function awardXp(admin: SupabaseClient, userId: string, xp: number): Promise<void> {
  if (xp <= 0) return;

  const { data: existing } = await admin
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await admin.from('user_xp').insert({
      user_id: userId,
      total_xp: xp,
      level: 1,
      title: 'Novice',
    });
    return;
  }

  const newTotal = (existing.total_xp ?? 0) + xp;
  await admin
    .from('user_xp')
    .update({ total_xp: newTotal, updated_at: nowIso() })
    .eq('user_id', userId);
}

async function awardBadge(
  admin: SupabaseClient,
  userId: string,
  badgeId: string,
  context: Record<string, unknown>
): Promise<BadgeRow | null> {
  // Idempotent: primary key (user_id, badge_id) + upsert
  const { data: badge } = await admin
    .from('badges')
    .select('id, slug, name, description, icon, rarity, xp_reward')
    .eq('id', badgeId)
    .maybeSingle();

  if (!badge) return null;

  const { data: existing } = await admin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (existing) return null; // already earned

  await admin.from('user_badges').upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      earned_at: nowIso(),
      context_json: context,
    },
    { onConflict: 'user_id,badge_id' }
  );

  return badge as BadgeRow;
}

// ─── Action: evaluate ───────────────────────────────────────

async function handleEvaluate(
  admin: SupabaseClient,
  userId: string,
  trigger: TriggerKind,
  metadata: EvaluateMetadata
): Promise<{
  completedChallenges: CompletedChallengeDto[];
  xpAwarded: number;
  badgesUnlocked: BadgeDto[];
}> {
  const completedChallenges: CompletedChallengeDto[] = [];
  const badgesUnlocked: BadgeDto[] = [];
  let xpAwarded = 0;

  const challenges = await fetchActiveChallengesByTrigger(admin, trigger);
  if (challenges.length === 0) {
    return { completedChallenges, xpAwarded, badgesUnlocked };
  }

  const progressMap = await fetchChallengeProgress(
    admin,
    userId,
    challenges.map((c) => c.id)
  );

  for (const challenge of challenges) {
    if (!matchesRule(challenge, trigger, metadata)) continue;

    const existing = progressMap.get(challenge.id) ?? null;

    // Skip if already completed and not a recurring challenge type
    // Daily/weekly auto-reset via window expiry; evergreen/seasonal do not.
    if (existing?.completed_at && challenge.type !== 'daily' && challenge.type !== 'weekly') {
      continue;
    }

    // For daily/weekly: if window has NOT expired and we already completed,
    // skip to avoid double-awarding in the same window.
    if (existing?.completed_at) {
      const window = challenge.rules_json?.window ?? null;
      if (!isWindowExpired(existing.progress_json?.startedAt ?? existing.started_at, window)) {
        continue;
      }
    }

    const { progress, startedAt, reachedTarget } = incrementProgress(
      existing?.completed_at ? null : existing,
      challenge.rules_json,
      trigger,
      metadata
    );

    const now = nowIso();
    const completedAt = reachedTarget ? now : null;

    const payload: Partial<ChallengeProgressRow> = {
      user_id: userId,
      challenge_id: challenge.id,
      progress_json: progress,
      started_at: startedAt,
      completed_at: completedAt,
    };

    const { error: upsertErr } = await admin
      .from('challenge_progress')
      .upsert(payload, { onConflict: 'user_id,challenge_id' });

    if (upsertErr) {
      console.error('[challenge-engine] progress upsert failed:', upsertErr.message, {
        challengeId: challenge.id,
      });
      continue;
    }

    if (reachedTarget && !existing?.completed_at) {
      // Award XP
      if (challenge.reward_xp > 0) {
        await awardXp(admin, userId, challenge.reward_xp);
        xpAwarded += challenge.reward_xp;
      }

      // Award associated badge (if any)
      if (challenge.badge_id) {
        const badge = await awardBadge(admin, userId, challenge.badge_id, {
          via: 'challenge_completed',
          challengeId: challenge.id,
          challengeSlug: challenge.slug,
        });
        if (badge) {
          if (badge.xp_reward && badge.xp_reward > 0) {
            await awardXp(admin, userId, badge.xp_reward);
            xpAwarded += badge.xp_reward;
          }
          badgesUnlocked.push({
            id: badge.id,
            slug: badge.slug,
            name: badge.name,
            description: badge.description ?? undefined,
            icon: badge.icon ?? undefined,
            rarity: badge.rarity,
            earnedAt: now,
          });
        }
      }

      completedChallenges.push({
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description ?? undefined,
        type: challenge.type,
        rewardXp: challenge.reward_xp ?? 0,
        completedAt: now,
      });
    }
  }

  return { completedChallenges, xpAwarded, badgesUnlocked };
}

// ─── Action: list ───────────────────────────────────────────

async function handleList(
  admin: SupabaseClient,
  userId: string,
  type: 'daily' | 'weekly' | 'all'
): Promise<{ challenges: ChallengeWithProgressDto[] }> {
  let query = admin
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type !== 'all') {
    query = query.eq('type', type);
  }

  const { data: challengeRows, error: chErr } = await query;
  if (chErr) throw chErr;

  const activeRows = ((challengeRows ?? []) as ChallengeRow[]).filter((c) => isChallengeActive(c));

  const progressMap = await fetchChallengeProgress(
    admin,
    userId,
    activeRows.map((c) => c.id)
  );

  const challenges: ChallengeWithProgressDto[] = activeRows.map((row) =>
    mapChallengeRowToDto(row, progressMap.get(row.id) ?? null)
  );

  return { challenges };
}

// ─── Action: start ──────────────────────────────────────────

async function handleStart(
  admin: SupabaseClient,
  userId: string,
  challengeId: string
): Promise<{ challengeId: string; startedAt: string }> {
  const { data: challenge, error: chErr } = await admin
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .maybeSingle();

  if (chErr) throw chErr;
  if (!challenge) throw new Error('Challenge not found');

  const row = challenge as ChallengeRow;
  if (!isChallengeActive(row)) {
    throw new Error('Challenge is not currently active');
  }

  const now = nowIso();
  const target = row.rules_json?.target?.count ?? 1;

  const { data: existing } = await admin
    .from('challenge_progress')
    .select('started_at, completed_at')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (existing?.started_at && !existing.completed_at) {
    return { challengeId, startedAt: existing.started_at };
  }

  await admin.from('challenge_progress').upsert(
    {
      user_id: userId,
      challenge_id: challengeId,
      progress_json: { current: 0, target, startedAt: now },
      started_at: now,
      completed_at: null,
    },
    { onConflict: 'user_id,challenge_id' }
  );

  return { challengeId, startedAt: now };
}

// ─── Auth helpers ───────────────────────────────────────────

/**
 * Authentication strategy:
 *   - Prefer user JWT (x-user-token or Authorization: Bearer <user-jwt>).
 *   - Accept service-role key as the Authorization header for internal
 *     edge-function-to-edge-function calls (e.g. education-progress).
 *     In this mode, the caller MUST supply `userId` in the body.
 */
async function resolveUserId(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  serviceKey: string,
  bodyUserId?: string
): Promise<string> {
  const authHeader = req.headers.get('authorization') ?? '';
  const userTokenHeader = req.headers.get('x-user-token') ?? '';
  const token = (userTokenHeader || authHeader).replace(/^Bearer\s+/i, '').trim();

  // Service-role shortcut for internal calls
  if (token && token === serviceKey) {
    if (!bodyUserId) {
      throw new Error('userId required when calling with service role');
    }
    return bodyUserId;
  }

  if (!token) throw new Error('Missing authorization');

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user.id;
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

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? '';

    const userId = await resolveUserId(req, supabaseUrl, anonKey, serviceKey, body.userId);

    const admin = createClient(supabaseUrl, serviceKey);

    // ─── Action: evaluate ──────────────────────────────
    if (action === 'evaluate') {
      const trigger = body.trigger as TriggerKind | undefined;
      const metadata: EvaluateMetadata = (body.metadata ?? {}) as EvaluateMetadata;

      const validTriggers: TriggerKind[] = [
        'lesson_completed',
        'streak_reached',
        'track_completed',
        'dca_executed',
        'xp_earned',
      ];
      if (!trigger || !validTriggers.includes(trigger)) {
        return new Response(
          JSON.stringify({ error: 'Invalid or missing trigger' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await handleEvaluate(admin, userId, trigger, metadata);
      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: list ──────────────────────────────────
    if (action === 'list') {
      const type = (body.type ?? 'all') as 'daily' | 'weekly' | 'all';
      const validTypes = ['daily', 'weekly', 'all'];
      if (!validTypes.includes(type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid type. Use "daily", "weekly", or "all".' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const result = await handleList(admin, userId, type);
      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: start ─────────────────────────────────
    if (action === 'start') {
      const challengeId = String(body.challengeId ?? '').trim();
      if (!challengeId) {
        return new Response(
          JSON.stringify({ error: 'challengeId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const result = await handleStart(admin, userId, challengeId);
      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "evaluate", "list", or "start".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[challenge-engine] Error:', message);
    const status = /unauthorized|missing authorization/i.test(message) ? 401 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
