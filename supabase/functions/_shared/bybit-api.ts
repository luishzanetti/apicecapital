// Shared Bybit API utilities for Supabase Edge Functions
// Extracted from dca-execute to eliminate duplication

import { hmacSHA256 } from './crypto.ts';

// ─── CORS Headers ───────────────────────────────────────────

export function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:8080', 'http://localhost:8081',
    'http://localhost:5173', 'http://localhost:3000',
  ].filter(Boolean) as string[];
  const origin = req?.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Bybit REST API ─────────────────────────────────────────

export async function bybitPost(
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

export async function bybitGet(
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

// ─── Symbol Mapping ─────────────────────────────────────────

export const ASSET_TO_SYMBOL: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
  XRP: 'XRPUSDT', ADA: 'ADAUSDT', DOGE: 'DOGEUSDT', AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT', LINK: 'LINKUSDT', MATIC: 'MATICUSDT', LTC: 'LTCUSDT',
  TRX: 'TRXUSDT', SHIB: 'SHIBUSDT', UNI: 'UNIUSDT',
  USDT: 'USDTUSDT', USDC: 'USDCUSDT',
};

// Linear perpetual symbols (same naming convention on Bybit)
export const LINEAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
];
