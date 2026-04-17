// Supabase Edge Function: balance-monitor
// SCAFFOLD — Week 1 extended task
//
// Responsibility (future):
//   - action='refresh'  → on-demand rebuild of balance snapshot + alerts for a user
//   - cron (daily)      → persist snapshot in `balance_snapshots` + emit FundAlert rows
//
// Status: 501 Not Implemented (scaffold only)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action } = await req.json().catch(() => ({ action: 'refresh' }));
    void action;

    // TODO: Week 1 extended — Full implementation
    // Modes:
    //   1. On-demand 'refresh' (user-initiated):
    //      - Authenticate via x-user-token
    //      - Call bybit-account internals to fetch live balances
    //      - Compute aggregates: spot / unified / funding / total
    //      - Evaluate alert rules vs. active DCA plans (runway, insufficient funds, etc.)
    //      - Upsert latest snapshot + return { currentBalances, alerts }
    //
    //   2. Cron 'daily_snapshot' (x-cron-secret header):
    //      - Iterate all users with connected Bybit credentials
    //      - Capture snapshot row per user in `balance_snapshots`
    //      - Emit FundAlert rows for users approaching runway limits
    //      - Return { processed: N, alerts_emitted: M }

    void createClient;

    return new Response(
      JSON.stringify({
        data: null,
        error: 'balance-monitor not yet implemented (Week 1 extended task)',
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
