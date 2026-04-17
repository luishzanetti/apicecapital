// Supabase Edge Function: challenge-engine
// SCAFFOLD — Week 3 task
//
// Responsibility (future):
//   Event-driven evaluator for active challenges.
//   Triggers (sent as { trigger: ... } in request body):
//     - 'lesson_completed'   (from education-progress on lesson completion)
//     - 'streak_reached'     (from education-progress daily tick)
//     - 'track_completed'    (when the last lesson of a track is completed)
//     - 'dca_executed'       (from dca-execute on successful execution)
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
    const { trigger, userId, context } = await req.json().catch(() => ({}));
    void trigger; void userId; void context;

    // TODO: Week 3 — Full implementation
    // - Authenticate via x-user-token (or internal service role when called by another edge function)
    // - Load active challenges relevant to the trigger for the user
    //     from `challenges` + `challenge_progress`
    // - For each challenge, evaluate rulesJson against the trigger/context
    //     (e.g. streak >= 7, lessons_completed_today >= 3, dca_executions_week >= 5)
    // - Upsert `challenge_progress` rows (current, target, completedAt when target hit)
    // - Award rewardXp + unlock corresponding badges on completion
    // - Insert notification rows for newly completed challenges
    // - Return { completed: [...challengeIds], progressUpdates: [...] }

    void createClient;

    return new Response(
      JSON.stringify({
        data: null,
        error: 'challenge-engine not yet implemented (Week 3 task)',
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
