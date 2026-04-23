// Supabase Edge Function: bybit-transfer
//
// Executes inter-account transfers on Bybit (SPOT / UNIFIED / FUND / CONTRACT)
// and persists history in public.account_transfers.
//
// Actions:
//   - execute : perform a transfer
//   - history : list last 20 transfers for the authenticated user
//   - quote   : preview a transfer (Bybit inter-transfers have no fees — this
//               just validates inputs so the UI can gate the confirm button)
//
// Response envelope (consistent across actions):
//   { data: T | null, error: string | null }
//
// Idempotency: our DB UUID is passed as Bybit's `transferId`. Duplicate submits
// with the same UUID are rejected by Bybit, so retries are safe.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseAdmin = ReturnType<typeof createClient>;
import { aesDecryptAsync } from '../_shared/crypto.ts';
import {
  bybitInterTransfer,
  getCorsHeaders,
  type BybitInterTransferParams,
} from '../_shared/bybit-api.ts';

// ─── Types ──────────────────────────────────────────────────

type AccountType = 'SPOT' | 'UNIFIED' | 'FUND' | 'CONTRACT';

const VALID_ACCOUNTS: readonly AccountType[] = ['SPOT', 'UNIFIED', 'FUND', 'CONTRACT'] as const;

const VALID_INITIATED_FROM = ['manual', 'auto_dca', 'auto_altis', 'auto_balance_rebalance'] as const;
type InitiatedFrom = typeof VALID_INITIATED_FROM[number];

interface ExecuteBody {
  action: 'execute';
  fromAccount: AccountType;
  toAccount: AccountType;
  coin: string;
  amount: number;
  initiatedFrom?: InitiatedFrom;
}

interface HistoryBody {
  action: 'history';
  limit?: number;
}

interface QuoteBody {
  action: 'quote';
  fromAccount: AccountType;
  toAccount: AccountType;
  coin: string;
  amount: number;
}

interface TransferRow {
  id: string;
  user_id: string;
  from_account: AccountType;
  to_account: AccountType;
  coin: string;
  amount: string | number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  bybit_txn_id: string | null;
  error_code: string | null;
  error_message: string | null;
  initiated_from: InitiatedFrom | null;
  created_at: string;
  completed_at: string | null;
}

// ─── Constants ──────────────────────────────────────────────

// Bybit per-coin minimum transfer thresholds. Values below these are rejected
// by Bybit with 170137. We fail fast client-side to save a round trip.
const MIN_TRANSFER_AMOUNTS: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  BTC: 0.0001,
  ETH: 0.001,
};
const DEFAULT_MIN_TRANSFER = 0;

const BYBIT_TRANSFER_ERRORS: Record<number, string> = {
  10003: 'Invalid API key',
  10004: 'Request signing failed',
  10005: 'API key lacks transfer permission — re-authorize in Settings',
  10006: 'Rate limited, try again shortly',
  10016: 'Bybit server error, retrying...',
  10017: 'API endpoint not found',
  170124: 'Order quantity too small',
  170137: 'Transfer amount too small (below minimum)',
  170217: 'Exceeds maximum transfer amount',
  170222: 'Invalid transfer amount',
  170223: 'Insufficient balance in source account',
  170224: 'Transfer to same account type not allowed',
  170225: 'Transfer temporarily disabled',
  33004: 'Insufficient balance',
};

// Codes that are safe to retry with exponential backoff
const RETRYABLE_CODES: ReadonlySet<number> = new Set([10006, 10016, 10017]);

const MAX_RETRY_ATTEMPTS = 3;
const HISTORY_DEFAULT_LIMIT = 20;
const HISTORY_MAX_LIMIT = 100;

// ─── Structured logging ─────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, event: string, payload: Record<string, unknown> = {}): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    fn: 'bybit-transfer',
    level,
    event,
    ...payload,
  });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.info(entry);
}

// ─── Helpers ────────────────────────────────────────────────

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

function isValidAccount(value: unknown): value is AccountType {
  return typeof value === 'string' && (VALID_ACCOUNTS as readonly string[]).includes(value);
}

function getMinAmount(coin: string): number {
  return MIN_TRANSFER_AMOUNTS[coin.toUpperCase()] ?? DEFAULT_MIN_TRANSFER;
}

interface ValidatedTransfer {
  fromAccount: AccountType;
  toAccount: AccountType;
  coin: string;
  amount: number;
}

function validateTransferInputs(input: {
  fromAccount: unknown;
  toAccount: unknown;
  coin: unknown;
  amount: unknown;
}): { ok: true; value: ValidatedTransfer } | { ok: false; error: string } {
  if (!isValidAccount(input.fromAccount)) {
    return { ok: false, error: `Invalid fromAccount. Must be one of: ${VALID_ACCOUNTS.join(', ')}` };
  }
  if (!isValidAccount(input.toAccount)) {
    return { ok: false, error: `Invalid toAccount. Must be one of: ${VALID_ACCOUNTS.join(', ')}` };
  }
  if (input.fromAccount === input.toAccount) {
    return { ok: false, error: 'fromAccount and toAccount must be different' };
  }
  if (typeof input.coin !== 'string' || input.coin.trim().length === 0) {
    return { ok: false, error: 'coin is required (non-empty string)' };
  }
  const coin = input.coin.trim().toUpperCase();

  const amountNum = typeof input.amount === 'number'
    ? input.amount
    : Number.parseFloat(String(input.amount ?? ''));
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: 'amount must be a positive number' };
  }
  const min = getMinAmount(coin);
  if (amountNum < min) {
    return { ok: false, error: `amount below minimum for ${coin} (min: ${min})` };
  }

  return {
    ok: true,
    value: {
      fromAccount: input.fromAccount,
      toAccount: input.toAccount,
      coin,
      amount: amountNum,
    },
  };
}

function mapRowToTransferApi(row: TransferRow): Record<string, unknown> {
  return {
    id: row.id,
    fromAccount: row.from_account,
    toAccount: row.to_account,
    coin: row.coin,
    amount: typeof row.amount === 'string' ? Number.parseFloat(row.amount) : row.amount,
    status: row.status,
    bybitTxnId: row.bybit_txn_id ?? undefined,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    initiatedFrom: row.initiated_from ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// ─── Execute flow ───────────────────────────────────────────

interface TransferExecutionResult {
  status: 'success' | 'failed';
  bybitTxnId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

async function callBybitWithRetry(
  apiKey: string,
  apiSecret: string,
  params: BybitInterTransferParams,
  isTestnet: boolean,
  userId: string,
): Promise<TransferExecutionResult> {
  let attempt = 0;
  let lastRetCode = 0;
  let lastRetMsg = '';

  while (attempt < MAX_RETRY_ATTEMPTS) {
    attempt += 1;
    try {
      const envelope = await bybitInterTransfer(apiKey, apiSecret, params, isTestnet);

      if (envelope.retCode === 0) {
        log('info', 'bybit_transfer_success', {
          userId,
          transferId: params.transferId,
          attempt,
          bybitTxnId: envelope.result?.transferId,
        });
        return {
          status: 'success',
          bybitTxnId: envelope.result?.transferId ?? params.transferId,
          errorCode: null,
          errorMessage: null,
        };
      }

      lastRetCode = envelope.retCode;
      lastRetMsg = envelope.retMsg || 'Unknown Bybit error';

      if (!RETRYABLE_CODES.has(envelope.retCode)) {
        log('warn', 'bybit_transfer_non_retryable', {
          userId,
          transferId: params.transferId,
          attempt,
          retCode: envelope.retCode,
          retMsg: lastRetMsg,
        });
        break;
      }

      log('warn', 'bybit_transfer_retrying', {
        userId,
        transferId: params.transferId,
        attempt,
        retCode: envelope.retCode,
        retMsg: lastRetMsg,
      });
    } catch (err) {
      lastRetCode = -1;
      lastRetMsg = err instanceof Error ? err.message : 'Network error';
      log('error', 'bybit_transfer_exception', {
        userId,
        transferId: params.transferId,
        attempt,
        message: lastRetMsg,
      });
    }

    if (attempt < MAX_RETRY_ATTEMPTS) {
      // 1s, 2s, 4s — exponential backoff
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  const friendly = BYBIT_TRANSFER_ERRORS[lastRetCode] ?? lastRetMsg;
  return {
    status: 'failed',
    bybitTxnId: null,
    errorCode: String(lastRetCode),
    errorMessage: friendly,
  };
}

async function handleExecute(
  body: ExecuteBody,
  userId: string,
  supabaseAdmin: SupabaseAdmin,
  encryptionKey: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  // Validate inputs BEFORE any DB/API calls
  const validation = validateTransferInputs(body);
  if (!validation.ok) {
    log('warn', 'validation_failed', { userId, error: validation.error });
    return jsonResponse({ data: null, error: validation.error }, 400, corsHeaders);
  }
  const { fromAccount, toAccount, coin, amount } = validation.value;

  const initiatedFrom: InitiatedFrom = (VALID_INITIATED_FROM as readonly string[]).includes(
    String(body.initiatedFrom),
  )
    ? (body.initiatedFrom as InitiatedFrom)
    : 'manual';

  // Fetch encrypted credentials
  const { data: creds, error: credError } = await supabaseAdmin
    .from('bybit_credentials')
    .select('api_key, api_secret_encrypted, testnet')
    .eq('user_id', userId)
    .single();

  if (credError || !creds) {
    log('warn', 'no_credentials', { userId });
    return jsonResponse(
      { data: null, error: 'Bybit account not connected. Connect your API key in Settings.' },
      404,
      corsHeaders,
    );
  }

  let apiKey: string;
  let apiSecret: string;
  let testnet: boolean;
  try {
    apiKey = creds.api_key as string;
    apiSecret = await aesDecryptAsync(creds.api_secret_encrypted as string, encryptionKey);
    testnet = Boolean(creds.testnet);
  } catch (err) {
    log('error', 'decrypt_failed', {
      userId,
      message: err instanceof Error ? err.message : 'decrypt error',
    });
    return jsonResponse(
      { data: null, error: 'Failed to decrypt API credentials' },
      500,
      corsHeaders,
    );
  }

  // Insert pending row — its id becomes Bybit's transferId for idempotency
  const { data: pendingRow, error: insertError } = await supabaseAdmin
    .from('account_transfers')
    .insert({
      user_id: userId,
      from_account: fromAccount,
      to_account: toAccount,
      coin,
      amount,
      status: 'pending',
      initiated_from: initiatedFrom,
    })
    .select('id, created_at')
    .single();

  if (insertError || !pendingRow) {
    log('error', 'db_insert_failed', {
      userId,
      error: insertError?.message ?? 'unknown',
    });
    return jsonResponse(
      { data: null, error: 'Failed to create transfer record' },
      500,
      corsHeaders,
    );
  }

  const transferId = pendingRow.id as string;

  log('info', 'transfer_initiated', {
    userId,
    transferId,
    fromAccount,
    toAccount,
    coin,
    amount,
    initiatedFrom,
    testnet,
  });

  // Call Bybit with retry
  const result = await callBybitWithRetry(
    apiKey,
    apiSecret,
    {
      transferId,
      coin,
      // Bybit expects string amount with up to 8 decimals
      amount: amount.toFixed(8).replace(/\.?0+$/, ''),
      fromAccountType: fromAccount,
      toAccountType: toAccount,
    },
    testnet,
    userId,
  );

  const completedAt = new Date().toISOString();

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('account_transfers')
    .update({
      status: result.status,
      bybit_txn_id: result.bybitTxnId,
      error_code: result.errorCode,
      error_message: result.errorMessage,
      completed_at: completedAt,
    })
    .eq('id', transferId)
    .eq('user_id', userId)
    .select('id, user_id, from_account, to_account, coin, amount, status, bybit_txn_id, error_code, error_message, initiated_from, created_at, completed_at')
    .maybeSingle();

  if (updateError) {
    log('error', 'db_update_failed', {
      userId,
      transferId,
      error: updateError.message,
    });
    // We still return what we know — the Bybit side either succeeded or failed
    // and the row is persisted as 'pending'. Admin reconciliation can fix the row.
  }

  // Shape consumed by the client (useAccountTransfer + transferSlice).
  // Must match src/store/types.ts::Transfer: id, fromAccount, toAccount,
  // coin, amount, status, bybitTxnId, createdAt, completedAt, ...
  const responseData = updatedRow
    ? mapRowToTransferApi(updatedRow as TransferRow)
    : {
        id: transferId,
        fromAccount,
        toAccount,
        coin,
        amount,
        status: result.status,
        bybitTxnId: result.bybitTxnId ?? undefined,
        errorCode: result.errorCode ?? undefined,
        errorMessage: result.errorMessage ?? undefined,
        initiatedFrom,
        createdAt: pendingRow.created_at,
        completedAt,
      };

  if (result.status === 'failed') {
    return jsonResponse(
      { data: responseData, error: result.errorMessage ?? 'Transfer failed' },
      200,
      corsHeaders,
    );
  }

  return jsonResponse({ data: responseData, error: null }, 200, corsHeaders);
}

// ─── History flow ───────────────────────────────────────────

async function handleHistory(
  body: HistoryBody,
  userId: string,
  supabaseAdmin: SupabaseAdmin,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const requested = typeof body.limit === 'number' && Number.isFinite(body.limit)
    ? Math.trunc(body.limit)
    : HISTORY_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requested, 1), HISTORY_MAX_LIMIT);

  const { data, error } = await supabaseAdmin
    .from('account_transfers')
    .select('id, user_id, from_account, to_account, coin, amount, status, bybit_txn_id, error_code, error_message, initiated_from, created_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    log('error', 'history_query_failed', { userId, error: error.message });
    return jsonResponse(
      { data: null, error: 'Failed to fetch transfer history' },
      500,
      corsHeaders,
    );
  }

  const transfers = (data as TransferRow[] | null ?? []).map(mapRowToTransferApi);
  // Return the array directly so clients can do `data?.data` and get a list.
  // Keep `transfers` in the envelope for backwards-compatible callers.
  return jsonResponse(
    { data: transfers, error: null, transfers },
    200,
    corsHeaders,
  );
}

// ─── Quote flow ─────────────────────────────────────────────
//
// Bybit inter-account transfers have no fees, so "quote" is effectively a
// validation preview. We surface the resolved min/valid flags so the UI can
// render a live confirm modal without a round-trip to Bybit.

function handleQuote(
  body: QuoteBody,
  corsHeaders: Record<string, string>,
): Response {
  const validation = validateTransferInputs(body);
  if (!validation.ok) {
    return jsonResponse(
      { data: { valid: false, reason: validation.error }, error: null },
      200,
      corsHeaders,
    );
  }

  const { fromAccount, toAccount, coin, amount } = validation.value;
  const min = getMinAmount(coin);

  return jsonResponse(
    {
      data: {
        valid: true,
        fromAccount,
        toAccount,
        coin,
        amount,
        minAmount: min,
        estimatedFee: 0, // Bybit internal transfers are free
        estimatedNet: amount,
      },
      error: null,
    },
    200,
    corsHeaders,
  );
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req) => {
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
      return jsonResponse(
        { data: null, error: 'Server not configured' },
        500,
        corsHeaders,
      );
    }

    // Authenticate
    const authResult = await authenticateUser(req, supabaseUrl, anonKey);
    if ('error' in authResult) {
      return jsonResponse(
        { data: null, error: authResult.error },
        authResult.status,
        corsHeaders,
      );
    }
    const userId = authResult.id;

    // Parse body
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';

    // Service-role client for DB writes
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    switch (action) {
      case 'execute':
        return await handleExecute(
          body as unknown as ExecuteBody,
          userId,
          supabaseAdmin,
          encryptionKey,
          corsHeaders,
        );

      case 'history':
        return await handleHistory(
          body as unknown as HistoryBody,
          userId,
          supabaseAdmin,
          corsHeaders,
        );

      case 'quote':
        return handleQuote(body as unknown as QuoteBody, corsHeaders);

      default:
        return jsonResponse(
          { data: null, error: 'Invalid action. Use "execute", "history", or "quote".' },
          400,
          corsHeaders,
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log('error', 'unhandled_exception', { message });
    return jsonResponse(
      { data: null, error: 'Internal server error' },
      500,
      corsHeaders,
    );
  }
});
