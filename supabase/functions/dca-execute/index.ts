// Supabase Edge Function: dca-execute
// Executes DCA buy orders on Bybit for plans that are due
// Can be triggered by: Supabase Cron, manual user action, or webhook
//
// Actions:
//   "execute-plan"  — Execute a specific plan (user-triggered)
//   "execute-due"   — Execute ALL due plans (cron-triggered, requires service role)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:8080', 'http://localhost:8081',
    'http://localhost:5173', 'http://localhost:3000',
  ].filter(Boolean) as string[];
  const origin = req?.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Crypto helpers (same as bybit-account) ─────────────────

function evpBytesToKey(password: string, salt: Uint8Array, keyLen: number, ivLen: number): Uint8Array {
  const totalLen = keyLen + ivLen;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  let prev = new Uint8Array(0);

  while (offset < totalLen) {
    const input = new Uint8Array(prev.length + password.length + salt.length);
    input.set(prev, 0);
    input.set(new TextEncoder().encode(password), prev.length);
    input.set(salt, prev.length + password.length);
    prev = md5(input);
    const copyLen = Math.min(prev.length, totalLen - offset);
    result.set(prev.slice(0, copyLen), offset);
    offset += copyLen;
  }
  return result;
}

function md5(data: Uint8Array): Uint8Array {
  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,
    0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,
    0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,
    0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,
    0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,
    0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,
    0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,
    0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,
    0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];
  const S = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ];
  function rl(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
  const padLen = 64 - ((data.length + 9) % 64 === 0 ? 64 : (data.length + 9) % 64);
  const padded = new Uint8Array(data.length + 1 + padLen + 8);
  padded.set(data);
  padded[data.length] = 0x80;
  const bits = data.length * 8;
  padded[padded.length - 8] = bits & 0xff;
  padded[padded.length - 7] = (bits >>> 8) & 0xff;
  padded[padded.length - 6] = (bits >>> 16) & 0xff;
  padded[padded.length - 5] = (bits >>> 24) & 0xff;
  const words = new Uint32Array(padded.buffer);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      const t = d; d = c; c = b;
      b = (b + rl((a + f + K[j] + words[i + g]) | 0, S[j])) | 0;
      a = t;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  const r = new Uint8Array(16);
  const v = new DataView(r.buffer);
  v.setInt32(0, a0, true); v.setInt32(4, b0, true); v.setInt32(8, c0, true); v.setInt32(12, d0, true);
  return r;
}

async function aesDecryptAsync(ciphertext: string, passphrase: string): Promise<string> {
  const raw = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  if (new TextDecoder().decode(raw.slice(0, 8)) !== 'Salted__') throw new Error('Invalid format');
  const salt = raw.slice(8, 16);
  const encrypted = raw.slice(16);
  const keyIv = evpBytesToKey(passphrase, salt, 32, 16);
  const key = await crypto.subtle.importKey('raw', keyIv.slice(0, 32), { name: 'AES-CBC' }, false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: keyIv.slice(32, 48) }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

async function hmacSHA256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Bybit API helpers ──────────────────────────────────────

async function bybitPost(
  apiKey: string, apiSecret: string, testnet: boolean,
  endpoint: string, body: Record<string, any>
): Promise<any> {
  const baseURL = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const bodyStr = JSON.stringify(body);
  const signature = await hmacSHA256(apiSecret, `${timestamp}${apiKey}${recvWindow}${bodyStr}`);

  const res = await fetch(`${baseURL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'Content-Type': 'application/json',
    },
    body: bodyStr,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Bybit ${res.status}: ${res.statusText} — ${errBody}`);
  }
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit ${json.retCode}: ${json.retMsg}`);
  return json.result;
}

async function bybitGet(
  apiKey: string, apiSecret: string, testnet: boolean,
  endpoint: string, params: Record<string, string> = {}
): Promise<any> {
  const baseURL = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const qs = new URLSearchParams(params).toString();
  const signature = await hmacSHA256(apiSecret, `${timestamp}${apiKey}${recvWindow}${qs}`);

  const res = await fetch(`${baseURL}${endpoint}${qs ? `?${qs}` : ''}`, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Bybit ${res.status}: ${res.statusText} — ${errBody}`);
  }
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit ${json.retCode}: ${json.retMsg}`);
  return json.result;
}

// Symbol mapping for spot trading
const ASSET_TO_SYMBOL: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
  XRP: 'XRPUSDT', ADA: 'ADAUSDT', DOGE: 'DOGEUSDT', AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT', LINK: 'LINKUSDT', MATIC: 'MATICUSDT', LTC: 'LTCUSDT',
  TRX: 'TRXUSDT', SHIB: 'SHIBUSDT', UNI: 'UNIUSDT',
};

// ─── Frequency to milliseconds ──────────────────────────────

function frequencyToMs(freq: string): number {
  switch (freq) {
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
    case 'biweekly': return 14 * 24 * 60 * 60 * 1000;
    case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

// ─── Execute a single DCA plan ──────────────────────────────

interface ExecutionResult {
  planId: string;
  executions: Array<{
    asset: string;
    symbol: string;
    amountUsdt: number;
    quantity: string | null;
    price: string | null;
    orderId: string | null;
    status: 'success' | 'failed';
    error: string | null;
  }>;
  totalSpent: number;
}

async function executePlan(
  plan: any,
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  supabaseAdmin: any
): Promise<ExecutionResult> {
  const result: ExecutionResult = {
    planId: plan.id,
    executions: [],
    totalSpent: 0,
  };

  const assets: Array<{ symbol: string; allocation: number }> = plan.assets || [];

  for (const asset of assets) {
    const tradingSymbol = ASSET_TO_SYMBOL[asset.symbol.toUpperCase()];
    if (!tradingSymbol) {
      result.executions.push({
        asset: asset.symbol,
        symbol: 'UNKNOWN',
        amountUsdt: 0,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Unsupported asset: ${asset.symbol}`,
      });
      continue;
    }

    const amountUsdt = (plan.amount_per_interval * asset.allocation) / 100;

    // Skip tiny orders (Bybit minimum is ~$1)
    if (amountUsdt < 1) {
      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: `Amount too small: $${amountUsdt.toFixed(2)} (min $1)`,
      });
      continue;
    }

    try {
      // Place spot market buy order (quote quantity = USDT amount)
      const orderResult = await bybitPost(apiKey, apiSecret, testnet, '/v5/order/create', {
        category: 'spot',
        symbol: tradingSymbol,
        side: 'Buy',
        orderType: 'Market',
        qty: amountUsdt.toFixed(2),
        marketUnit: 'quoteCoin', // Buy using USDT amount
      });

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: orderResult.qty || null,
        price: orderResult.price || null,
        orderId: orderResult.orderId || null,
        status: 'success',
        error: null,
      });
      result.totalSpent += amountUsdt;

      // Record execution in DB
      await supabaseAdmin.from('dca_executions').insert({
        plan_id: plan.id,
        user_id: plan.user_id,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        quantity: orderResult.qty ? parseFloat(orderResult.qty) : null,
        price: orderResult.price ? parseFloat(orderResult.price) : null,
        status: 'success',
        bybit_order_id: orderResult.orderId || null,
      });

      // Also record as transaction for portfolio tracking
      await supabaseAdmin.from('transactions').insert({
        user_id: plan.user_id,
        asset_symbol: asset.symbol.toUpperCase(),
        type: 'buy',
        amount: orderResult.qty ? parseFloat(orderResult.qty) : amountUsdt,
        price_per_unit: orderResult.price ? parseFloat(orderResult.price) : 0,
        date: new Date().toISOString(),
        fees: 0,
        notes: `DCA auto-buy [Plan ${plan.id}]`,
      });

    } catch (err: any) {
      console.error(`[dca-execute] Order failed for ${tradingSymbol}:`, err);

      result.executions.push({
        asset: asset.symbol,
        symbol: tradingSymbol,
        amountUsdt,
        quantity: null,
        price: null,
        orderId: null,
        status: 'failed',
        error: err.message || 'Order failed',
      });

      // Record failed execution
      await supabaseAdmin.from('dca_executions').insert({
        plan_id: plan.id,
        user_id: plan.user_id,
        asset_symbol: asset.symbol,
        amount_usdt: amountUsdt,
        status: 'failed',
        error_message: err.message || 'Order failed',
      });
    }
  }

  // Update plan's next execution date and total invested
  const nextDate = new Date(Date.now() + frequencyToMs(plan.frequency)).toISOString();
  const failedCount = result.executions.filter(e => e.status === 'failed').length;
  await supabaseAdmin
    .from('dca_plans')
    .update({
      next_execution_date: nextDate,
      total_invested: (plan.total_invested || 0) + result.totalSpent,
      last_execution_date: new Date().toISOString(),
      execution_count: (plan.execution_count || 0) + 1,
      failed_executions: (plan.failed_executions || 0) + failedCount,
    })
    .eq('id', plan.id);

  // Check if plan has expired
  if (plan.duration_days) {
    const startDate = new Date(plan.start_date).getTime();
    const endDate = startDate + plan.duration_days * 24 * 60 * 60 * 1000;
    if (Date.now() > endDate) {
      await supabaseAdmin
        .from('dca_plans')
        .update({ is_active: false })
        .eq('id', plan.id);
    }
  }

  return result;
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    const encryptionKey = ENCRYPTION_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'execute-plan';

    // ─── Action: execute-plan (user-triggered) ───────────
    if (action === 'execute-plan') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planId = body.planId;
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing planId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the plan (verify ownership)
      const { data: plan, error: planError } = await supabaseAdmin
        .from('dca_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get credentials
      const { data: creds } = await supabaseAdmin
        .from('bybit_credentials')
        .select('api_key, api_secret_encrypted, testnet')
        .eq('user_id', user.id)
        .single();

      if (!creds) {
        return new Response(
          JSON.stringify({ error: 'no_credentials', message: 'Connect Bybit first' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
      const result = await executePlan(plan, creds.api_key, apiSecret, creds.testnet || false, supabaseAdmin);

      return new Response(
        JSON.stringify({ data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: execute-due (cron-triggered) ────────────
    if (action === 'execute-due') {
      // This should be called by Supabase Cron with service role
      const cronSecret = req.headers.get('x-cron-secret');
      const expectedSecret = Deno.env.get('CRON_SECRET');
      if (!expectedSecret) {
        console.error('[dca-execute] CRON_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (cronSecret !== expectedSecret) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch all active plans that are due
      const now = new Date().toISOString();
      const { data: duePlans, error: plansError } = await supabaseAdmin
        .from('dca_plans')
        .select('*')
        .eq('is_active', true)
        .lte('next_execution_date', now);

      if (plansError || !duePlans || duePlans.length === 0) {
        return new Response(
          JSON.stringify({ data: { executed: 0, message: 'No plans due' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: ExecutionResult[] = [];
      const errors: string[] = [];

      for (const plan of duePlans) {
        try {
          const { data: creds } = await supabaseAdmin
            .from('bybit_credentials')
            .select('api_key, api_secret_encrypted, testnet')
            .eq('user_id', plan.user_id)
            .single();

          if (!creds) {
            errors.push(`Plan ${plan.id}: No credentials for user ${plan.user_id}`);
            continue;
          }

          const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
          const result = await executePlan(plan, creds.api_key, apiSecret, creds.testnet || false, supabaseAdmin);
          results.push(result);
        } catch (err: any) {
          errors.push(`Plan ${plan.id}: ${err.message}`);
        }
      }

      return new Response(
        JSON.stringify({
          data: {
            executed: results.length,
            total_plans_due: duePlans.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: history (get execution history) ─────────
    if (action === 'history') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planId = body.planId;
      const limit = body.limit || 20;

      let query = supabaseAdmin
        .from('dca_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (planId) query = query.eq('plan_id', planId);

      const { data: executions, error } = await query;

      return new Response(
        JSON.stringify({ data: executions || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "execute-plan", "execute-due", or "history".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[dca-execute] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
