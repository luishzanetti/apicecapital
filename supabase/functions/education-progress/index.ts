// Supabase Edge Function: education-progress
// SCAFFOLD — Week 3 task
//
// Responsibility (future):
//   - action='complete'      → mark lesson completed, award XP, update streak, evaluate level-up
//   - action='view'          → record lesson view + time-on-page telemetry
//   - action='quiz_attempt'  → persist quiz attempt + score, unlock badge if perfect
//   - action='summary'       → return aggregated education state for the authenticated user
//
// Status: 501 Not Implemented (scaffold only)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, lessonId, score, timeSpentSec } = await req.json().catch(() => ({}));
    void action; void lessonId; void score; void timeSpentSec;

    // TODO: Week 3 — Full implementation
    // Actions:
    //   'complete':
    //     - Authenticate via x-user-token
    //     - Insert into `lesson_completions` (user_id, lesson_id, score, time_spent_sec)
    //     - Award lesson.xp to the user, bump `education_profiles.total_xp`
    //     - Recompute level + level_title; set leveledUp flag if threshold crossed
    //     - Update streak + longest_streak based on last_active_date
    //     - Invoke challenge-engine with trigger='lesson_completed' for side effects
    //     - Return { leveledUp, badgesUnlocked, xpAwarded, newLevel }
    //
    //   'view':
    //     - Insert or upsert lightweight row in `lesson_views`
    //     - No XP, no state mutation beyond telemetry
    //
    //   'quiz_attempt':
    //     - Insert into `quiz_attempts` with selected answers + score
    //     - Award bonus XP if score == 100 and attempt == 1
    //     - Unlock "perfect-quiz" badge family as applicable
    //
    //   'summary':
    //     - Aggregate tracks, lessonsByTrack, earnedBadges, activeChallenges,
    //       totalXP, level, streak — for store hydration

    void createClient;

    return new Response(
      JSON.stringify({
        data: null,
        error: 'education-progress not yet implemented (Week 3 task)',
        scaffold: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 501,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
