// Supabase Edge Function: balance-monitor
//
// Monitors user Bybit balances against active DCA plans and emits fund alerts
// when runway drops below safe thresholds.
//
// Actions:
//   - refresh       : on-demand snapshot + alert evaluation for the authenticated user
//   - evaluate      : cron-callable; iterates all users with active DCA plans
//   - dismiss_alert : mark a single alert as dismissed (72h snooze window)
//
// Runway buckets:
//   >= 3.0 months  → info       (no alert; resolve any existing)
//   >= 1.5 months  → warning    (low_funding)
//   >= 0.5 months  → critical   (critical_low_funding)
//   <  0.5 months  → blocked    (insufficient_funds)
//
// Alert semantics:
//   - De-dupe: re-use an existing unresolved/un-dismissed row with the same code
//     within 72h. Update context + message in place instead of creating duplicates.
//   - Auto-resolve: when runway recovers to >=3 months, any open alert tied to
//     the plan is marked resolved.
//   - Snooze: if the user dismissed an alert with the same code, do not
//     re-create until 72h after dismissed_at.
//
// Response envelope (consistent across actions):
//   { data: T | null, error: string | null }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseAdmin = ReturnType<typeof createClient>;

import { aesDecryptAsync } from '../_shared/crypto.ts';
import { bybitGet, getCorsHeaders } from '../_shared/bybit-api.ts';

// ─── Types ──────────────────────────────────────────────────

type Severity = 'info' | 'warning' | 'critical' | 'blocked';
type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface Balances {
  funding: number;
  unified: number;
  spot: number;
  contract: number;
  total: number;
}

interface DcaPlanRow {
  id: string;
  user_id: string;
  amount_per_interval: number | string;
  frequency: string;
  is_active: boolean;
}

interface FundAlertRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  severity: Severity;
  code: string;
  message: string;
  context_json: Record<string, unknown> | null;
  triggered_at: string;
  resolved_at: string | null;
  dismissed_at: string | null;
}

interface BybitWalletCoin {
  coin: string;
  walletBalance?: string;
  equity?: string;
  usdValue?: string;
  spotBorrow?: string;
}

interface BybitUnifiedAccount {
  totalEquity?: string;
  totalAvailableBalance?: string;
  totalWalletBalance?: string;
  coin?: BybitWalletCoin[];
}

interface BybitFundingCoin {
  coin: string;
  walletBalance?: string;
  transferBalance?: string;
}

interface RefreshResult {
  balances: Balances;
  alerts: FundAlertApi[];
  snapshotAt: string;
}

interface FundAlertApi {
  id: string;
  planId: string | null;
  severity: Severity;
  code: string;
  message: string;
  contextJson: Record<string, unknown>;
  triggeredAt: string;
}

// ─── Constants ──────────────────────────────────────────────

const EXECUTIONS_PER_MONTH: Record<Frequency, number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
};

// 72h snooze window for dismissed alerts and de-duplication window for
// unresolved alerts with the same code.
const SNOOZE_WINDOW_HOURS = 72;
const SNOOZE_WINDOW_MS = SNOOZE_WINDOW_HOURS * 60 * 60 * 1000;

const STABLECOINS = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD']);

// ─── Structured logging ─────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, event: string, payload: Record<string, unknown> = {}): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    fn: 'balance-monitor',
    level,
    event,
    ...payload,
  });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.info(entry);
}

// ─── HTTP helpers ───────────────────────────────────────────

function jsonResponse(
  body: { data: unknown; error: string | null },
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isFrequency(value: unknown): value is Frequency {
  return value === 'daily' || value === 'weekly' || value === 'biweekly' || value === 'monthly';
}

function mapAlertToApi(row: FundAlertRow): FundAlertApi {
  return {
    id: row.id,
    planId: row.plan_id,
    severity: row.severity,
    code: row.code,
    message: row.message,
    contextJson: (row.context_json ?? {}) as Record<string, unknown>,
    triggeredAt: row.triggered_at,
  };
}

// ─── Bybit price lookup (stablecoins short-circuit to 1) ────

async function getCoinUsdPrice(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  coin: string,
): Promise<number> {
  const upper = coin.toUpperCase();
  if (STABLECOINS.has(upper)) return 1;
  try {
    const res = await bybitGet(apiKey, apiSecret, testnet, '/v5/market/tickers', {
      category: 'spot',
      symbol: `${upper}USDT`,
    });
    const list = (res as { list?: Array<{ lastPrice?: string }> }).list ?? [];
    return toNumber(list[0]?.lastPrice);
  } catch {
    return 0;
  }
}

// ─── Bybit balance fetching ─────────────────────────────────

async function fetchUserBalances(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
): Promise<Balances> {
  // UNIFIED account (primary trading capital — used by DCA + ALTIS)
  // Prefer totalEquity so locked-in positions count toward "total balance".
  let unifiedTotal = 0;
  try {
    const unifiedRes = await bybitGet(apiKey, apiSecret, testnet, '/v5/account/wallet-balance', {
      accountType: 'UNIFIED',
    });
    const account = ((unifiedRes as { list?: BybitUnifiedAccount[] }).list ?? [])[0];
    if (account) {
      unifiedTotal = toNumber(account.totalEquity)
        || toNumber(account.totalWalletBalance)
        || toNumber(account.totalAvailableBalance);
    }
  } catch (err) {
    log('warn', 'unified_balance_failed', { message: err instanceof Error ? err.message : 'unknown' });
  }

  // SPOT account — only populated on Bybit Classic (pre-UTA). On UTA this
  // endpoint returns an empty list, so a 0 here is a safe no-op.
  let spotTotal = 0;
  try {
    const spotRes = await bybitGet(apiKey, apiSecret, testnet, '/v5/account/wallet-balance', {
      accountType: 'SPOT',
    });
    const account = ((spotRes as { list?: BybitUnifiedAccount[] }).list ?? [])[0];
    if (account) {
      spotTotal = toNumber(account.totalEquity)
        || toNumber(account.totalWalletBalance);
    }
  } catch (err) {
    // Most users are on UTA — this endpoint returning "account type error" is expected.
    log('info', 'spot_balance_skipped', { message: err instanceof Error ? err.message : 'unknown' });
  }

  // CONTRACT account — Bybit Classic derivatives wallet. Empty for UTA users.
  let contractTotal = 0;
  try {
    const contractRes = await bybitGet(apiKey, apiSecret, testnet, '/v5/account/wallet-balance', {
      accountType: 'CONTRACT',
    });
    const account = ((contractRes as { list?: BybitUnifiedAccount[] }).list ?? [])[0];
    if (account) {
      contractTotal = toNumber(account.totalEquity)
        || toNumber(account.totalWalletBalance);
    }
  } catch (err) {
    log('info', 'contract_balance_skipped', { message: err instanceof Error ? err.message : 'unknown' });
  }

  // FUND account (savings / accumulation)
  let fundingTotal = 0;
  try {
    const fundRes = await bybitGet(
      apiKey,
      apiSecret,
      testnet,
      '/v5/asset/transfer/query-account-coins-balance',
      { accountType: 'FUND' },
    );
    const coins = (fundRes as { balance?: BybitFundingCoin[] }).balance ?? [];
    if (coins.length > 0) {
      const priced = await Promise.all(
        coins.map(async (c) => {
          // Prefer transferBalance (what is actually movable) over walletBalance.
          const balance = toNumber(c.transferBalance) || toNumber(c.walletBalance);
          if (balance <= 0) return 0;
          const price = await getCoinUsdPrice(apiKey, apiSecret, testnet, c.coin);
          return balance * price;
        }),
      );
      fundingTotal = priced.reduce((sum, v) => sum + v, 0);
    }
  } catch (err) {
    log('warn', 'funding_balance_failed', { message: err instanceof Error ? err.message : 'unknown' });
  }

  const total = unifiedTotal + fundingTotal + spotTotal + contractTotal;
  return {
    funding: fundingTotal,
    unified: unifiedTotal,
    spot: spotTotal,
    contract: contractTotal,
    total,
  };
}

// ─── Snapshot persistence ───────────────────────────────────

async function insertSnapshot(
  admin: SupabaseAdmin,
  userId: string,
  balances: Balances,
): Promise<string> {
  // We persist the UNIFIED slice because DCA plans draw from Unified.
  // total_usd = unified equity, available_usd = same (treated as deployable).
  const capturedAt = new Date().toISOString();
  const { error } = await admin.from('balance_snapshots').insert({
    user_id: userId,
    account_type: 'UNIFIED',
    total_usd: balances.unified,
    available_usd: balances.unified,
    locked_usd: 0,
    holdings_json: {
      funding: balances.funding,
      unified: balances.unified,
      spot: balances.spot,
      contract: balances.contract,
      total: balances.total,
    },
    captured_at: capturedAt,
  });

  if (error) {
    log('warn', 'snapshot_insert_failed', { userId, error: error.message });
  }

  return capturedAt;
}

// ─── Alert evaluation ───────────────────────────────────────

interface AlertDecision {
  severity: Severity;
  code: string;
  message: string;
  remainingMonths: number;
  remainingExecutions: number;
  monthlyRequired: number;
  available: number;
}

function evaluatePlanRunway(plan: DcaPlanRow, availableForPlan: number): AlertDecision | null {
  if (!isFrequency(plan.frequency)) {
    return null;
  }

  const amount = toNumber(plan.amount_per_interval);
  if (amount <= 0) return null;

  const executionsPerMonth = EXECUTIONS_PER_MONTH[plan.frequency];
  const monthlyRequired = amount * executionsPerMonth;
  if (monthlyRequired <= 0) return null;

  const remainingMonths = availableForPlan / monthlyRequired;
  const remainingExecutions = Math.max(0, Math.floor(availableForPlan / amount));

  if (remainingMonths >= 3) {
    // Green zone — signal resolution to caller.
    return {
      severity: 'info',
      code: 'funds_ok',
      message: 'Funds OK',
      remainingMonths,
      remainingExecutions,
      monthlyRequired,
      available: availableForPlan,
    };
  }

  if (remainingMonths >= 1.5) {
    return {
      severity: 'warning',
      code: 'low_funding',
      message: `${remainingMonths.toFixed(1)} months of funds remaining`,
      remainingMonths,
      remainingExecutions,
      monthlyRequired,
      available: availableForPlan,
    };
  }

  if (remainingMonths >= 0.5) {
    return {
      severity: 'critical',
      code: 'critical_low_funding',
      message: `Only ${remainingExecutions} executions left. Add funds.`,
      remainingMonths,
      remainingExecutions,
      monthlyRequired,
      available: availableForPlan,
    };
  }

  return {
    severity: 'blocked',
    code: 'insufficient_funds',
    message: 'Insufficient funds. Next execution cannot run.',
    remainingMonths,
    remainingExecutions,
    monthlyRequired,
    available: availableForPlan,
  };
}

// ─── Alert upsert with dedupe + snooze ──────────────────────

async function applyAlertDecision(
  admin: SupabaseAdmin,
  userId: string,
  planId: string,
  decision: AlertDecision,
): Promise<void> {
  const now = new Date();
  const nowIso = now.toISOString();
  const windowStart = new Date(now.getTime() - SNOOZE_WINDOW_MS).toISOString();

  // Fetch recent alerts for this user+plan to make dedupe/snooze decisions.
  const { data: recentRows, error: fetchError } = await admin
    .from('fund_alerts')
    .select('id, user_id, plan_id, severity, code, message, context_json, triggered_at, resolved_at, dismissed_at')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .gte('triggered_at', windowStart)
    .order('triggered_at', { ascending: false });

  if (fetchError) {
    log('warn', 'alert_query_failed', { userId, planId, error: fetchError.message });
    return;
  }

  const recent = (recentRows as FundAlertRow[] | null) ?? [];

  // Green-zone: resolve every unresolved/un-dismissed alert for this plan.
  if (decision.code === 'funds_ok') {
    const openIds = recent
      .filter((r) => r.resolved_at === null && r.dismissed_at === null)
      .map((r) => r.id);
    if (openIds.length > 0) {
      const { error: updateError } = await admin
        .from('fund_alerts')
        .update({ resolved_at: nowIso })
        .in('id', openIds);
      if (updateError) {
        log('warn', 'alert_resolve_failed', { userId, planId, error: updateError.message });
      } else {
        log('info', 'alert_resolved', { userId, planId, resolvedCount: openIds.length });
      }
    }
    return;
  }

  // Snooze: if user dismissed same code within the window, skip.
  const snoozed = recent.find(
    (r) => r.code === decision.code
      && r.dismissed_at !== null
      && (now.getTime() - new Date(r.dismissed_at).getTime()) < SNOOZE_WINDOW_MS,
  );
  if (snoozed) {
    log('info', 'alert_snoozed', { userId, planId, code: decision.code, snoozedId: snoozed.id });
    return;
  }

  // Dedupe: update existing open alert with same code.
  const existing = recent.find(
    (r) => r.code === decision.code && r.resolved_at === null && r.dismissed_at === null,
  );

  const contextJson = {
    remainingMonths: decision.remainingMonths,
    remainingExecutions: decision.remainingExecutions,
    monthlyRequired: decision.monthlyRequired,
    available: decision.available,
  };

  if (existing) {
    const { error: updateError } = await admin
      .from('fund_alerts')
      .update({
        severity: decision.severity,
        message: decision.message,
        context_json: contextJson,
      })
      .eq('id', existing.id);
    if (updateError) {
      log('warn', 'alert_update_failed', { userId, planId, error: updateError.message });
    }
    return;
  }

  // Before creating a new alert, resolve any alert for this plan with a
  // different code — severity changed, old alert is stale.
  const staleIds = recent
    .filter((r) => r.code !== decision.code && r.resolved_at === null && r.dismissed_at === null)
    .map((r) => r.id);
  if (staleIds.length > 0) {
    const { error: staleError } = await admin
      .from('fund_alerts')
      .update({ resolved_at: nowIso })
      .in('id', staleIds);
    if (staleError) {
      log('warn', 'alert_stale_resolve_failed', { userId, planId, error: staleError.message });
    }
  }

  const { error: insertError } = await admin.from('fund_alerts').insert({
    user_id: userId,
    plan_id: planId,
    severity: decision.severity,
    code: decision.code,
    message: decision.message,
    context_json: contextJson,
  });

  if (insertError) {
    log('warn', 'alert_insert_failed', { userId, planId, error: insertError.message });
  } else {
    log('info', 'alert_created', { userId, planId, code: decision.code, severity: decision.severity });
  }
}

// ─── Per-user evaluation pipeline ───────────────────────────

async function evaluateUser(
  admin: SupabaseAdmin,
  encryptionKey: string,
  userId: string,
): Promise<{ balances: Balances; alertsProcessed: number } | null> {
  // 1. Credentials
  const { data: creds, error: credError } = await admin
    .from('bybit_credentials')
    .select('api_key, api_secret_encrypted, testnet')
    .eq('user_id', userId)
    .single();

  if (credError || !creds) {
    log('info', 'skip_user_no_credentials', { userId });
    return null;
  }

  let apiKey: string;
  let apiSecret: string;
  let testnet: boolean;
  try {
    apiKey = creds.api_key as string;
    apiSecret = await aesDecryptAsync(creds.api_secret_encrypted as string, encryptionKey);
    testnet = Boolean(creds.testnet);
  } catch (err) {
    log('error', 'decrypt_failed', { userId, message: err instanceof Error ? err.message : 'decrypt error' });
    return null;
  }

  // 2. Balances
  const balances = await fetchUserBalances(apiKey, apiSecret, testnet);

  // 3. Snapshot
  await insertSnapshot(admin, userId, balances);

  // 4. Evaluate active DCA plans
  const { data: plans, error: planError } = await admin
    .from('dca_plans')
    .select('id, user_id, amount_per_interval, frequency, is_active')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (planError) {
    log('warn', 'plan_query_failed', { userId, error: planError.message });
    return { balances, alertsProcessed: 0 };
  }

  const activePlans = (plans as DcaPlanRow[] | null) ?? [];
  const availableForPlans = balances.unified;

  let processed = 0;
  for (const plan of activePlans) {
    const decision = evaluatePlanRunway(plan, availableForPlans);
    if (!decision) continue;
    await applyAlertDecision(admin, userId, plan.id, decision);
    processed += 1;
  }

  return { balances, alertsProcessed: processed };
}

// ─── Auth ───────────────────────────────────────────────────

async function authenticateUser(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<{ id: string } | { error: string; status: number }> {
  const userToken = req.headers.get('x-user-token') || req.headers.get('authorization');
  if (!userToken) return { error: 'Missing authorization', status: 401 };

  const bearerToken = userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`;
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: bearerToken } },
  });

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', status: 401 };
  return { id: user.id };
}

function verifyCronSecret(req: Request): boolean {
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) return true; // Not configured → allow (dev convenience)
  return req.headers.get('x-cron-secret') === expected;
}

// ─── Action handlers ────────────────────────────────────────

async function handleRefresh(
  userId: string,
  admin: SupabaseAdmin,
  encryptionKey: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const result = await evaluateUser(admin, encryptionKey, userId);
  if (!result) {
    return jsonResponse(
      { data: null, error: 'Bybit account not connected. Connect your API key in Settings.' },
      404,
      corsHeaders,
    );
  }

  // Return only currently-active alerts (unresolved + un-dismissed) for this user.
  const { data: alertRows, error: alertError } = await admin
    .from('fund_alerts')
    .select('id, user_id, plan_id, severity, code, message, context_json, triggered_at, resolved_at, dismissed_at')
    .eq('user_id', userId)
    .is('resolved_at', null)
    .is('dismissed_at', null)
    .order('triggered_at', { ascending: false });

  if (alertError) {
    log('warn', 'active_alerts_query_failed', { userId, error: alertError.message });
  }

  const alerts = ((alertRows as FundAlertRow[] | null) ?? []).map(mapAlertToApi);

  const payload: RefreshResult = {
    balances: result.balances,
    alerts,
    snapshotAt: new Date().toISOString(),
  };

  log('info', 'refresh_complete', {
    userId,
    unified: result.balances.unified,
    funding: result.balances.funding,
    spot: result.balances.spot,
    contract: result.balances.contract,
    total: result.balances.total,
    alertsActive: alerts.length,
    alertsProcessed: result.alertsProcessed,
  });

  return jsonResponse({ data: payload, error: null }, 200, corsHeaders);
}

async function handleEvaluate(
  admin: SupabaseAdmin,
  encryptionKey: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  // Find distinct user_ids with active DCA plans.
  const { data: plans, error } = await admin
    .from('dca_plans')
    .select('user_id')
    .eq('is_active', true);

  if (error) {
    log('error', 'cron_plan_query_failed', { error: error.message });
    return jsonResponse({ data: null, error: 'Failed to list active plans' }, 500, corsHeaders);
  }

  const userIds = [...new Set((plans as Array<{ user_id: string }> | null)?.map((p) => p.user_id) ?? [])];

  let processedUsers = 0;
  let totalAlerts = 0;
  let skippedUsers = 0;

  for (const userId of userIds) {
    try {
      const result = await evaluateUser(admin, encryptionKey, userId);
      if (!result) {
        skippedUsers += 1;
        continue;
      }
      processedUsers += 1;
      totalAlerts += result.alertsProcessed;
    } catch (err) {
      log('error', 'cron_user_failed', {
        userId,
        message: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  log('info', 'evaluate_complete', {
    totalUsers: userIds.length,
    processedUsers,
    skippedUsers,
    alertsProcessed: totalAlerts,
  });

  return jsonResponse(
    {
      data: {
        totalUsers: userIds.length,
        processedUsers,
        skippedUsers,
        alertsProcessed: totalAlerts,
      },
      error: null,
    },
    200,
    corsHeaders,
  );
}

async function handleDismissAlert(
  userId: string,
  alertId: string,
  admin: SupabaseAdmin,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (typeof alertId !== 'string' || alertId.length === 0) {
    return jsonResponse({ data: null, error: 'alertId is required' }, 400, corsHeaders);
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('fund_alerts')
    .update({ dismissed_at: nowIso })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    log('error', 'dismiss_failed', { userId, alertId, error: error.message });
    return jsonResponse({ data: null, error: 'Failed to dismiss alert' }, 500, corsHeaders);
  }

  if (!data) {
    return jsonResponse({ data: null, error: 'Alert not found' }, 404, corsHeaders);
  }

  log('info', 'alert_dismissed', { userId, alertId });
  return jsonResponse({ data: { id: alertId, dismissedAt: nowIso }, error: null }, 200, corsHeaders);
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey || !encryptionKey) {
      log('error', 'missing_env', {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(serviceKey),
        hasAnonKey: Boolean(anonKey),
        hasEncryptionKey: Boolean(encryptionKey),
      });
      return jsonResponse({ data: null, error: 'Server not configured' }, 500, corsHeaders);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : 'refresh';

    if (action === 'evaluate') {
      if (!verifyCronSecret(req)) {
        return jsonResponse({ data: null, error: 'Unauthorized' }, 401, corsHeaders);
      }
      return await handleEvaluate(admin, encryptionKey, corsHeaders);
    }

    // Both refresh + dismiss_alert require a user JWT.
    const authResult = await authenticateUser(req, supabaseUrl, anonKey);
    if ('error' in authResult) {
      return jsonResponse({ data: null, error: authResult.error }, authResult.status, corsHeaders);
    }
    const userId = authResult.id;

    switch (action) {
      case 'refresh':
        return await handleRefresh(userId, admin, encryptionKey, corsHeaders);
      case 'dismiss_alert': {
        const alertId = typeof body.alertId === 'string' ? body.alertId : '';
        return await handleDismissAlert(userId, alertId, admin, corsHeaders);
      }
      default:
        return jsonResponse(
          { data: null, error: 'Invalid action. Use "refresh", "evaluate", or "dismiss_alert".' },
          400,
          corsHeaders,
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log('error', 'unhandled_exception', { message });
    return jsonResponse({ data: null, error: 'Internal server error' }, 500, corsHeaders);
  }
});
