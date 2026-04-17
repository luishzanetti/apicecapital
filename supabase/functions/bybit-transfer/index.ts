// Supabase Edge Function: bybit-transfer
// SCAFFOLD — Week 2 task
//
// Responsibility (future):
//   - Execute inter-account transfers on Bybit (UNIFIED <-> FUND)
//   - Persist transfer history in `account_transfers` table
//   - Emit balance-refresh side effects after success
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
    // NOTE: body intentionally parsed but not yet acted upon.
    const { action, fromAccount, toAccount, coin, amount, initiatedFrom } = await req.json().catch(() => ({}));
    void action; void fromAccount; void toAccount; void coin; void amount; void initiatedFrom;

    // TODO: Week 2 — Full implementation
    // - Authenticate via x-user-token (see bybit-account for reference)
    // - Load encrypted Bybit credentials from `bybit_credentials`
    // - Validate source balance via /v5/asset/transfer/query-account-coins-balance
    // - Insert pending row in `account_transfers` (status=pending)
    // - Call POST /v5/asset/transfer/inter-transfer with a fresh transferId
    // - Update row with status=success + bybit_txn_id on success
    //   or status=failed + error_message on failure
    // - Return { data: { transfer: {...} } }

    // Reference unused import to avoid tree-shake warnings in editors.
    void createClient;

    return new Response(
      JSON.stringify({
        data: null,
        error: 'bybit-transfer not yet implemented (Week 2 task)',
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
