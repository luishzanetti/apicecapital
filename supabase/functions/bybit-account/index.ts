// Supabase Edge Function: bybit-account
// Securely fetches Bybit wallet balance server-side
// API secrets never leave the server — decrypted in Deno, not in the browser

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';
import { hmacSHA256 as sharedHmacSHA256, aesDecryptAsync as sharedAesDecryptAsync, evpBytesToKey as sharedEvpBytesToKey, md5 as sharedMd5 } from '../_shared/crypto.ts';
import { getCorsHeaders } from '../_shared/bybit-api.ts';

// Legacy constant for backwards compatibility within handler
const CORS_HEADERS = getCorsHeaders();

// ─── AES Decryption (compatible with CryptoJS) ─────────────

function decryptAES(ciphertext: string, passphrase: string): string {
  // CryptoJS AES format: "Salted__" + 8-byte salt + encrypted data (base64 encoded)
  const rawData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // Check "Salted__" prefix
  const salted = new TextDecoder().decode(rawData.slice(0, 8));
  if (salted !== 'Salted__') {
    throw new Error('Invalid CryptoJS ciphertext format');
  }

  const salt = rawData.slice(8, 16);
  const encrypted = rawData.slice(16);

  // Derive key + IV using OpenSSL EVP_BytesToKey (MD5-based)
  const keyIv = evpBytesToKey(passphrase, salt, 32, 16);
  const key = keyIv.slice(0, 32);
  const iv = keyIv.slice(32, 48);

  // Decrypt using Web Crypto API
  return aesDecrypt(encrypted, key, iv);
}

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

    // MD5 hash
    prev = md5(input);
    const copyLen = Math.min(prev.length, totalLen - offset);
    result.set(prev.slice(0, copyLen), offset);
    offset += copyLen;
  }

  return result;
}

function md5(data: Uint8Array): Uint8Array {
  // Simple MD5 implementation for EVP key derivation
  const encoder = new TextEncoder();

  function rotateLeft(x: number, n: number) {
    return (x << n) | (x >>> (32 - n));
  }

  function toUint32Array(bytes: Uint8Array): Uint32Array {
    const padLen = 64 - ((bytes.length + 9) % 64 === 0 ? 64 : (bytes.length + 9) % 64);
    const padded = new Uint8Array(bytes.length + 1 + padLen + 8);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const bits = bytes.length * 8;
    padded[padded.length - 8] = bits & 0xff;
    padded[padded.length - 7] = (bits >>> 8) & 0xff;
    padded[padded.length - 6] = (bits >>> 16) & 0xff;
    padded[padded.length - 5] = (bits >>> 24) & 0xff;
    return new Uint32Array(padded.buffer);
  }

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const words = toUint32Array(data);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d] = [a0, b0, c0, d0];

    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }

      const temp = d;
      d = c;
      c = b;
      b = (b + rotateLeft((a + f + K[j] + words[i + g]) | 0, S[j])) | 0;
      a = temp;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const result = new Uint8Array(16);
  const view = new DataView(result.buffer);
  view.setInt32(0, a0, true);
  view.setInt32(4, b0, true);
  view.setInt32(8, c0, true);
  view.setInt32(12, d0, true);
  return result;
}

function aesDecrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): string {
  // Use SubtleCrypto for AES-CBC decryption
  // Note: This is synchronous for Edge Function simplicity
  // We'll use a sync approach via Deno's built-in crypto
  const decipher = new AesCbc(key, iv);
  const decrypted = decipher.decrypt(data);
  // Remove PKCS7 padding
  const padLen = decrypted[decrypted.length - 1];
  return new TextDecoder().decode(decrypted.slice(0, decrypted.length - padLen));
}

// Simple AES-CBC implementation
class AesCbc {
  private key: Uint8Array;
  private iv: Uint8Array;

  constructor(key: Uint8Array, iv: Uint8Array) {
    this.key = key;
    this.iv = iv;
  }

  decrypt(data: Uint8Array): Uint8Array {
    // We'll use the Web Crypto API synchronously via a workaround
    // For Deno, we can use the built-in aes module
  throw new Error('Use async version');
  }
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ─── HMAC-SHA256 for Bybit Auth ─────────────────────────────

async function hmacSHA256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── AES-CBC Async Decrypt ──────────────────────────────────

async function aesDecryptAsync(ciphertext: string, passphrase: string): Promise<string> {
  const rawData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  if (new TextDecoder().decode(rawData.slice(0, 8)) !== 'Salted__') {
    throw new Error('Invalid CryptoJS format');
  }

  const salt = rawData.slice(8, 16);
  const encrypted = rawData.slice(16);
  const keyIv = evpBytesToKey(passphrase, salt, 32, 16);

  const key = await crypto.subtle.importKey(
    'raw',
    keyIv.slice(0, 32),
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: keyIv.slice(32, 48) },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

type BybitWalletCoin = {
  coin: string;
  walletBalance: string;
  spotBorrow?: string;
  equity: string;
  usdValue: string;
  unrealisedPnl?: string;
  availableToWithdraw?: string;
  free?: string;
  locked?: string;
  marginCollateral?: boolean;
  collateralSwitch?: boolean;
};

type BybitUnifiedAccount = {
  totalEquity: string;
  totalWalletBalance: string;
  totalMarginBalance: string;
  totalAvailableBalance: string;
  totalPerpUPL: string;
  totalInitialMargin: string;
  totalMaintenanceMargin: string;
  coin?: BybitWalletCoin[];
};

type BybitFundingCoin = {
  coin: string;
  walletBalance?: string;
  transferBalance?: string;
};

type BybitPositionRecord = {
  category?: string;
  symbol: string;
  side: string;
  size: string;
  avgPrice?: string;
  entryPrice: string;
  markPrice: string;
  positionValue?: string;
  positionIM?: string;
  positionMM?: string;
  unrealisedPnl: string;
  leverage: string;
};

type BybitTickerResult = {
  list?: Array<{ lastPrice?: string }>;
};

type FundingHoldingRecord = {
  coin: string;
  balance: number;
  usdValue: number;
};

// ─── Bybit Authenticated Request ────────────────────────────

async function bybitAuthGet<T = Record<string, unknown>>(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const baseURL = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';

  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const queryString = new URLSearchParams(params).toString();
  const signPayload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  const signature = await hmacSHA256(apiSecret, signPayload);

  const url = `${baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Bybit API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit Error ${json.retCode}: ${json.retMsg}`);
  return json.result as T;
}

const STABLECOINS = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD']);

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function bybitPublicGet<T = Record<string, unknown>>(
  testnet: boolean,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const baseURL = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com';

  const queryString = new URLSearchParams(params).toString();
  const url = `${baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Bybit API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (json.retCode !== 0) throw new Error(`Bybit Error ${json.retCode}: ${json.retMsg}`);
  return json.result as T;
}

async function getTransferableBalances(
  apiKey: string,
  apiSecret: string,
  testnet: boolean,
  coins: string[]
): Promise<Record<string, number>> {
  const uniqueCoins = [...new Set(coins.filter(Boolean))];
  if (uniqueCoins.length === 0) return {};

  const balances = await Promise.all(
    chunkArray(uniqueCoins, 10).map(async (coinChunk) => {
      const result = await bybitAuthGet<{ balance?: Array<{ coin: string; transferBalance: string }> }>(
        apiKey,
        apiSecret,
        testnet,
        '/v5/asset/transfer/query-account-coins-balance',
        {
          accountType: 'UNIFIED',
          coin: coinChunk.join(','),
        }
      );

      return (result.balance || []) as Array<{ coin: string; transferBalance: string }>;
    })
  );

  return balances.flat().reduce<Record<string, number>>((acc, coinBalance) => {
    acc[coinBalance.coin] = toNumber(coinBalance.transferBalance);
    return acc;
  }, {});
}

async function getCoinUsdPrices(testnet: boolean, coins: string[]): Promise<Record<string, number>> {
  const uniqueCoins = [...new Set(coins.filter(Boolean))];
  const prices: Record<string, number> = {};

  await Promise.all(
    uniqueCoins.map(async (coin) => {
      if (STABLECOINS.has(coin)) {
        prices[coin] = 1;
        return;
      }

      try {
        const ticker = await bybitPublicGet<BybitTickerResult>(testnet, '/v5/market/tickers', {
          category: 'spot',
          symbol: `${coin}USDT`,
        });
        prices[coin] = toNumber(ticker.list?.[0]?.lastPrice);
      } catch {
        prices[coin] = 0;
      }
    })
  );

  return prices;
}

async function getOpenFuturesPositions(
  apiKey: string,
  apiSecret: string,
  testnet: boolean
): Promise<Array<{
  category: string;
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  unrealisedPnl: number;
  notionalUsd: number;
  initialMarginUsd: number;
  maintenanceMarginUsd: number;
}>> {
  const categories = ['linear', 'inverse'];

  const results = await Promise.all(
    categories.map(async (category) => {
      try {
        const response = await bybitAuthGet<{ list?: BybitPositionRecord[] }>(apiKey, apiSecret, testnet, '/v5/position/list', {
          category,
          limit: '200',
        });

        return (response.list || [])
          .filter((position) => toNumber(position.size) > 0)
          .map((position) => {
            const markPrice = toNumber(position.markPrice);
            const positionValue = toNumber(position.positionValue);
            const positionIM = toNumber(position.positionIM);
            const positionMM = toNumber(position.positionMM);
            const unrealisedPnl = toNumber(position.unrealisedPnl);
            const multiplier = category === 'inverse' ? markPrice : 1;

            return {
              category,
              symbol: position.symbol,
              side: position.side,
              size: toNumber(position.size),
              entryPrice: toNumber(position.avgPrice ?? position.entryPrice),
              markPrice,
              leverage: toNumber(position.leverage),
              unrealisedPnl: unrealisedPnl * multiplier,
              notionalUsd: positionValue * multiplier,
              initialMarginUsd: positionIM * multiplier,
              maintenanceMarginUsd: positionMM * multiplier,
            };
          });
      } catch {
        return [];
      }
    })
  );

  return results.flat();
}

// ─── Main Handler ───────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user token — prefer x-user-token (sent by client to bypass gateway JWT validation)
    // Fall back to authorization header for backward compatibility
    const userToken = req.headers.get('x-user-token') || req.headers.get('authorization');
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    const encryptionKey = ENCRYPTION_KEY;

    // Create admin client to read credentials
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify JWT from x-user-token
    const bearerToken = userToken.startsWith('Bearer ') ? userToken : `Bearer ${userToken}`;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: bearerToken } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'balance';

    // ─── Action: test-credentials (plaintext from form, before DB lookup) ──
    if (action === 'test-credentials') {
      const { apiKey: testKey, apiSecret: testSecret } = body;
      if (!testKey || !testSecret) {
        return new Response(
          JSON.stringify({ error: 'API key and secret are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use the provided plaintext credentials to test connection
      const isTestnet = body.isTestnet || body.testnet || false;
      const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

      // Test with GET /v5/account/info
      const timestamp = Date.now().toString();
      const recvWindow = '20000';
      const queryString = '';
      const signPayload = timestamp + testKey + recvWindow + queryString;
      const signature = await hmacSHA256(testSecret, signPayload);

      const testResp = await fetch(`${baseUrl}/v5/account/info`, {
        headers: {
          'X-BAPI-API-KEY': testKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN': signature,
        },
      });

      const testResult = await testResp.json();

      if (testResult.retCode === 0) {
        return new Response(
          JSON.stringify({ data: { valid: true, unifiedMarginStatus: testResult.result?.unifiedMarginStatus } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ data: { valid: false, error: testResult.retMsg } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch encrypted credentials
    const { data: creds, error: credError } = await supabaseAdmin
      .from('bybit_credentials')
      .select('api_key, api_secret_encrypted, testnet')
      .eq('user_id', user.id)
      .single();

    if (credError || !creds) {
      return new Response(
        JSON.stringify({ error: 'no_credentials', message: 'Bybit account not connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt API secret server-side (NEVER sent to client)
    const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
    const apiKey = creds.api_key;
    const testnet = creds.testnet || false;

    // ─── Action: balance (unified + funding) ────────────
    if (action === 'balance') {
      // Fetch UNIFIED account (spot/derivatives)
      const accountType = body.accountType || 'UNIFIED';
      const result = await bybitAuthGet<{ list?: BybitUnifiedAccount[] }>(apiKey, apiSecret, testnet, '/v5/account/wallet-balance', {
        accountType,
      });

      const account = result.list?.[0];
      if (!account) {
        return new Response(
          JSON.stringify({ error: 'No account data returned' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const transferableBalances = await getTransferableBalances(
        apiKey,
        apiSecret,
        testnet,
        (account.coin || []).map((coin: BybitWalletCoin) => coin.coin)
      );

      // Extract spot holdings with values
      const holdings = (account.coin || [])
        .filter((c: BybitWalletCoin) => {
          const walletBalance = toNumber(c.walletBalance);
          const equity = toNumber(c.equity);
          const usdValue = toNumber(c.usdValue);
          const spotBorrow = toNumber(c.spotBorrow);
          return walletBalance > 0 || equity > 0 || usdValue > 0 || spotBorrow > 0;
        })
        .map((c: BybitWalletCoin) => ({
          coin: c.coin,
          balance: Math.max(0, toNumber(c.walletBalance) - toNumber(c.spotBorrow)),
          walletBalance: toNumber(c.walletBalance),
          spotBorrow: toNumber(c.spotBorrow),
          equity: toNumber(c.equity),
          usdValue: toNumber(c.usdValue),
          unrealisedPnl: toNumber(c.unrealisedPnl),
          availableToWithdraw: transferableBalances[c.coin] ?? 0,
          locked: toNumber(c.locked),
          marginCollateral: Boolean(c.marginCollateral),
          collateralSwitch: Boolean(c.collateralSwitch),
        }))
        .sort((a, b) => b.usdValue - a.usdValue);

      // Fetch FUND account (funding/earn)
      let fundingBalance = 0;
      let fundingHoldings: FundingHoldingRecord[] = [];
      try {
        const fundResult = await bybitAuthGet<{ balance?: BybitFundingCoin[] }>(apiKey, apiSecret, testnet, '/v5/asset/transfer/query-account-coins-balance', {
          accountType: 'FUND',
        });
        const fundCoins = fundResult.balance || [];
        const priceMap = await getCoinUsdPrices(testnet, fundCoins.map((coin: BybitFundingCoin) => coin.coin));
        fundingHoldings = fundCoins
          .filter((c: BybitFundingCoin) => toNumber(c.walletBalance) > 0 || toNumber(c.transferBalance) > 0)
          .map((c: BybitFundingCoin) => ({
            coin: c.coin,
            balance: toNumber(c.walletBalance),
            usdValue: toNumber(c.walletBalance) * (priceMap[c.coin] ?? 0),
          }))
          .sort((a, b) => b.usdValue - a.usdValue);
        fundingBalance = fundingHoldings.reduce((sum: number, c) => sum + c.usdValue, 0);
      } catch (e) {
        // Funding account may not be available, continue with 0
        console.log('[bybit-account] Funding balance fetch skipped:', (e as Error).message);
      }

      const totalEquity = toNumber(account.totalEquity);
      const totalWalletBalance = toNumber(account.totalWalletBalance);
      const totalMarginBalance = toNumber(account.totalMarginBalance);
      const totalAvailableBalance = toNumber(account.totalAvailableBalance);
      const totalPerpUPL = toNumber(account.totalPerpUPL);
      const totalInitialMargin = toNumber(account.totalInitialMargin);
      const totalMaintenanceMargin = toNumber(account.totalMaintenanceMargin);
      const futuresPositions = await getOpenFuturesPositions(apiKey, apiSecret, testnet);
      const futuresPositionCount = futuresPositions.length;
      const futuresNotional = futuresPositions.reduce((sum, position) => sum + position.notionalUsd, 0);
      const futuresMarginBalance = futuresPositions.reduce((sum, position) => sum + position.initialMarginUsd, 0);
      const futuresMaintenanceMargin = futuresPositions.reduce((sum, position) => sum + position.maintenanceMarginUsd, 0);
      const spotBalance = totalWalletBalance;

      // Grand total = Funding (savings) + Unified (trading)
      // Funding is the PRIMARY balance (user's accumulated crypto)
      // Unified is the SECONDARY balance (trading/futures capital)
      const grandTotal = fundingBalance + totalEquity;

      return new Response(
        JSON.stringify({
          data: {
            // Primary: Funding account (savings/accumulation)
            grandTotal,
            fundingBalance,
            fundingHoldings,
            // Secondary: Unified/Trading account
            totalEquity,
            totalWalletBalance,
            totalMarginBalance,
            totalAvailableBalance,
            totalUnrealizedPnL: totalPerpUPL,
            totalInitialMargin,
            totalMaintenanceMargin,
            holdings,
            accountType,
            testnet,
            spotBalance,
            // Futures detail
            futuresBalance: futuresMarginBalance,
            futuresInitialMargin: totalInitialMargin,
            futuresPositionCount,
            futuresNotional,
            futuresMarginBalance,
            futuresMaintenanceMargin,
            futuresUnrealizedPnl: totalPerpUPL,
            futuresPositions,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: positions ───────────────────────────────
    if (action === 'positions') {
      const category = body.category || 'linear';
      const result = await bybitAuthGet<{ list?: BybitPositionRecord[] }>(apiKey, apiSecret, testnet, '/v5/position/list', {
        category,
      });

      const positions = (result.list || [])
        .filter((p: BybitPositionRecord) => parseFloat(p.size) > 0)
        .map((p: BybitPositionRecord) => ({
          symbol: p.symbol,
          side: p.side,
          size: parseFloat(p.size),
          entryPrice: parseFloat(p.entryPrice),
          markPrice: parseFloat(p.markPrice),
          unrealisedPnl: parseFloat(p.unrealisedPnl),
          leverage: p.leverage,
        }));

      return new Response(
        JSON.stringify({ data: { positions } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Action: test ────────────────────────────────────
    if (action === 'test') {
      try {
        await bybitAuthGet(apiKey, apiSecret, testnet, '/v5/account/info');
        return new Response(
          JSON.stringify({ data: { connected: true, testnet } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error('[bybit-account] Connection test failed:', err);
        return new Response(
          JSON.stringify({ data: { connected: false, error: 'Connection test failed' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "balance", "positions", "test", or "test-credentials".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[bybit-account] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
