// ============================================================================
// Edge Function: market-intelligence
// ============================================================================
// The brain of the Apice Intelligence System.
// Collects market data, calculates indicators, detects market regime,
// generates smart alerts, and updates user intelligence profiles.
//
// Actions:
//   - collect       : Fetch market data + calculate indicators (cron: every 15min)
//   - detect-regime : Classify current market regime
//   - calculate-scores : Update user behavioral scores (cron: daily)
//   - smart-dca     : Get adjusted DCA amounts for a user
//   - rebalance     : Check portfolio deviation and suggest rebalance
//   - briefing      : Generate personalized daily briefing
//   - alerts        : Get/manage smart alerts for a user
//
// Triggers:
//   - Cron (every 15min): collect + detect-regime
//   - Cron (daily 6am): calculate-scores + briefings
//   - User request: smart-dca, rebalance, briefing, alerts
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ---------------------------------------------------------------------------
// Config & Constants
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const FEAR_GREED_API = "https://api.alternative.me/fng/?limit=1";

const BYBIT_BASE = "https://api.bybit.com";
const TRACKED_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
  "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "TRXUSDT", "SHIBUSDT", "UNIUSDT",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Supabase Client (service role for writes)
// ---------------------------------------------------------------------------

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function getUserClient(authHeader: string) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

// ---------------------------------------------------------------------------
// Market Data Collection
// ---------------------------------------------------------------------------

async function fetchBybitTickers(): Promise<Record<string, any>> {
  const url = `${BYBIT_BASE}/v5/market/tickers?category=spot`;
  const res = await fetch(url);
  const data = await res.json();

  const tickers: Record<string, any> = {};
  if (data?.result?.list) {
    for (const t of data.result.list) {
      if (TRACKED_SYMBOLS.includes(t.symbol)) {
        tickers[t.symbol] = {
          price: parseFloat(t.lastPrice),
          volume_24h: parseFloat(t.volume24h) * parseFloat(t.lastPrice),
          change_24h_pct: parseFloat(t.price24hPcnt) * 100,
          high_24h: parseFloat(t.highPrice24h),
          low_24h: parseFloat(t.lowPrice24h),
        };
      }
    }
  }
  return tickers;
}

async function fetchFearGreedIndex(): Promise<{ value: number; label: string }> {
  try {
    const res = await fetch(FEAR_GREED_API);
    const data = await res.json();
    if (data?.data?.[0]) {
      return {
        value: parseInt(data.data[0].value),
        label: data.data[0].value_classification,
      };
    }
  } catch (_e) {
    // Fallback
  }
  return { value: 50, label: "Neutral" };
}

async function fetchBybitFundingRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  try {
    const url = `${BYBIT_BASE}/v5/market/tickers?category=linear`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.result?.list) {
      for (const t of data.result.list) {
        if (TRACKED_SYMBOLS.map(s => s).includes(t.symbol)) {
          rates[t.symbol] = parseFloat(t.fundingRate || "0");
        }
      }
    }
  } catch (_e) {
    // Funding rates are optional
  }
  return rates;
}

// ---------------------------------------------------------------------------
// Technical Indicators
// ---------------------------------------------------------------------------

// SMA: prices are newest-first, we use the most recent N entries
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(0, period); // newest N prices
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

// RSI: Wilder's smoothed RSI (EMA-based for accuracy)
function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  // Initial averages using SMA (first period)
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const diff = prices[i] - prices[i + 1]; // newest first
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }

  avgGain /= period;
  avgLoss /= period;

  // Wilder's smoothing for remaining data points
  const remaining = Math.min(prices.length - period - 1, period * 2);
  for (let i = period; i < period + remaining; i++) {
    if (i + 1 >= prices.length) break;
    const diff = prices[i] - prices[i + 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Volatility: Annualized standard deviation of returns
// Accounts for the actual data frequency (snapshots per day)
function calculateVolatility(prices: number[], snapshotsPerDay: number = 4): number | null {
  if (prices.length < 2) return null;

  const returns: number[] = [];
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i + 1] > 0) {
      returns.push((prices[i] - prices[i + 1]) / prices[i + 1]);
    }
  }

  if (returns.length === 0) return null;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  // Annualize based on actual frequency: sqrt(periodsPerYear)
  const periodsPerYear = snapshotsPerDay * 365;
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

// ---------------------------------------------------------------------------
// Action: COLLECT — Fetch market data & store with indicators
// ---------------------------------------------------------------------------

async function actionCollect(supabase: any): Promise<{ collected: number; regime: string }> {
  // 1. Fetch all data sources in parallel
  const [tickers, fearGreed, fundingRates] = await Promise.all([
    fetchBybitTickers(),
    fetchFearGreedIndex(),
    fetchBybitFundingRates(),
  ]);

  // 2. Get historical prices for indicator calculation
  const { data: historicalPrices } = await supabase
    .from("market_snapshots")
    .select("symbol, price, captured_at")
    .in("symbol", TRACKED_SYMBOLS)
    .order("captured_at", { ascending: false })
    .limit(TRACKED_SYMBOLS.length * 100); // ~100 data points per symbol

  // Group historical by symbol
  const priceHistory: Record<string, number[]> = {};
  for (const row of (historicalPrices || [])) {
    if (!priceHistory[row.symbol]) priceHistory[row.symbol] = [];
    priceHistory[row.symbol].push(row.price);
  }

  // 3. Calculate BTC dominance from tracked assets
  let totalMarketCap = 0;
  let btcMarketCap = 0;
  for (const [symbol, data] of Object.entries(tickers) as [string, any][]) {
    totalMarketCap += data.volume_24h; // Approximation using volume
    if (symbol === "BTCUSDT") btcMarketCap = data.volume_24h;
  }
  const btcDominance = totalMarketCap > 0 ? (btcMarketCap / totalMarketCap) * 100 : 50;

  // 4. Build snapshot rows with indicators
  const snapshots = [];
  const now = new Date().toISOString();

  for (const symbol of TRACKED_SYMBOLS) {
    const ticker = tickers[symbol];
    if (!ticker) continue;

    // Prepend current price to history for calculations
    const history = [ticker.price, ...(priceHistory[symbol] || [])];

    // Calculate indicators
    const sma7d = calculateSMA(history, 7 * 4);    // 7 days × 4 snapshots/day (15min intervals)
    const sma30d = calculateSMA(history, 30 * 4);
    const sma90d = calculateSMA(history, 90);       // Limited by available data
    const rsi14 = calculateRSI(history, 14);
    const vol30d = calculateVolatility(history.slice(0, 30 * 4));

    snapshots.push({
      symbol,
      price: ticker.price,
      volume_24h: ticker.volume_24h,
      change_24h_pct: ticker.change_24h_pct,
      high_24h: ticker.high_24h,
      low_24h: ticker.low_24h,
      sma_7d: sma7d,
      sma_30d: sma30d,
      sma_90d: sma90d,
      rsi_14: rsi14,
      volatility_30d: vol30d,
      fear_greed_index: fearGreed.value,
      fear_greed_label: fearGreed.label,
      btc_dominance: btcDominance,
      total_market_cap: totalMarketCap,
      funding_rate: fundingRates[symbol] || null,
      open_interest: null, // TODO: fetch from derivatives endpoint
      source: "bybit",
      captured_at: now,
    });
  }

  // 5. Insert snapshots
  const { error: insertError } = await supabase
    .from("market_snapshots")
    .insert(snapshots);

  if (insertError) {
    console.error("Failed to insert market snapshots:", insertError);
    throw new Error(`Snapshot insert failed: ${insertError.message}`);
  }

  // 6. Auto-detect regime after collecting new data
  const regime = await detectRegime(supabase);

  // 7. Cleanup old data (retention: 90 days)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("market_snapshots")
    .delete()
    .lt("captured_at", cutoff);

  return { collected: snapshots.length, regime };
}

// ---------------------------------------------------------------------------
// Action: DETECT-REGIME — Classify current market state
// ---------------------------------------------------------------------------

interface RegimeCriteria {
  btc_price: number;
  btc_vs_sma90: number;
  rsi: number;
  fear_greed: number;
  btc_dominance: number;
  volatility: number;
  funding_rate: number;
  change_7d: number;
}

function classifyRegime(c: RegimeCriteria): { regime: string; confidence: number; reason: string } {
  // Priority-ordered regime detection

  // CAPITULATION: extreme fear OR (fear + significant drawdown)
  // Relaxed: F&G alone < 12 is enough, OR F&G < 20 with drawdown > 15%
  if (c.fear_greed <= 12 || (c.fear_greed <= 20 && c.btc_vs_sma90 < 0.85)) {
    return {
      regime: "CAPITULATION",
      confidence: Math.min(95, (20 - c.fear_greed) * 3 + 40),
      reason: `Medo extremo (F&G: ${c.fear_greed})${c.btc_vs_sma90 < 0.9 ? ` com BTC ${((1 - c.btc_vs_sma90) * 100).toFixed(1)}% abaixo da SMA90` : ''}`,
    };
  }

  // HIGH_VOLATILITY: extreme volatility
  if (c.volatility > 1.0) { // >100% annualized volatility
    return {
      regime: "HIGH_VOLATILITY",
      confidence: Math.min(85, c.volatility * 50),
      reason: `Volatilidade extrema: ${(c.volatility * 100).toFixed(1)}% anualizada`,
    };
  }

  // ALTSEASON: BTC dominance falling + alts outperforming
  if (c.btc_dominance < 45 && c.btc_vs_sma90 > 0.95) {
    return {
      regime: "ALTSEASON",
      confidence: Math.min(80, (50 - c.btc_dominance) * 4 + 40),
      reason: `BTC dominance em ${c.btc_dominance.toFixed(1)}% — altcoins ganhando força`,
    };
  }

  // BULL: above SMA90 + RSI bullish + greed
  if (c.btc_vs_sma90 > 1.05 && c.rsi > 55 && c.fear_greed > 55) {
    return {
      regime: "BULL",
      confidence: Math.min(90, (c.rsi - 50) * 2 + c.fear_greed * 0.5),
      reason: `BTC ${((c.btc_vs_sma90 - 1) * 100).toFixed(1)}% acima da SMA90, RSI ${c.rsi.toFixed(0)}, F&G ${c.fear_greed}`,
    };
  }

  // BEAR: below SMA90 + RSI bearish + fear
  if (c.btc_vs_sma90 < 0.95 && c.rsi < 45 && c.fear_greed < 40) {
    return {
      regime: "BEAR",
      confidence: Math.min(90, (50 - c.rsi) * 2 + (40 - c.fear_greed)),
      reason: `BTC ${((1 - c.btc_vs_sma90) * 100).toFixed(1)}% abaixo da SMA90, RSI ${c.rsi.toFixed(0)}, F&G ${c.fear_greed}`,
    };
  }

  // SIDEWAYS: default — low volatility, neutral indicators
  return {
    regime: "SIDEWAYS",
    confidence: 60,
    reason: `Mercado lateral — BTC próximo da SMA90, RSI ${c.rsi?.toFixed(0) || "N/A"}, F&G ${c.fear_greed}`,
  };
}

async function detectRegime(supabase: any): Promise<string> {
  // Get latest BTC data
  const { data: btcData } = await supabase
    .from("market_snapshots")
    .select("*")
    .eq("symbol", "BTCUSDT")
    .order("captured_at", { ascending: false })
    .limit(1);

  if (!btcData?.length) return "SIDEWAYS";

  const latest = btcData[0];

  // Build criteria
  const criteria: RegimeCriteria = {
    btc_price: latest.price,
    btc_vs_sma90: latest.sma_90d ? latest.price / latest.sma_90d : 1.0,
    rsi: latest.rsi_14 || 50,
    fear_greed: latest.fear_greed_index || 50,
    btc_dominance: latest.btc_dominance || 50,
    volatility: latest.volatility_30d || 0.5,
    funding_rate: latest.funding_rate || 0,
    change_7d: 0, // TODO: calculate from historical
  };

  const classification = classifyRegime(criteria);

  // Get current regime
  const { data: currentRegime } = await supabase
    .from("market_regimes")
    .select("*")
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = currentRegime?.[0];

  if (existing && existing.regime === classification.regime) {
    // Same regime — increment consecutive periods
    await supabase
      .from("market_regimes")
      .update({
        consecutive_periods: existing.consecutive_periods + 1,
        confidence: classification.confidence,
        criteria,
      })
      .eq("id", existing.id);

    return classification.regime;
  }

  // Different regime detected — apply hysteresis to prevent jitter
  if (existing) {
    // Hysteresis: require higher confidence to SWITCH (75%) than to STAY (50%)
    // Exception: CAPITULATION has lower threshold (65%) because speed matters
    const switchThreshold = classification.regime === "CAPITULATION" ? 65 : 75;

    if (classification.confidence < switchThreshold) {
      // Not confident enough to switch — stay in current regime but log the detection
      console.log(`Regime ${classification.regime} detected (${classification.confidence}%) but below switch threshold (${switchThreshold}%). Staying in ${existing.regime}.`);
      return existing.regime;
    }

    // Additional debounce: if existing regime has been stable for 5+ periods,
    // require even higher confidence (85%) to switch (stability bias)
    if (existing.consecutive_periods >= 5 && classification.confidence < 85) {
      return existing.regime;
    }

    // Close existing regime
    await supabase
      .from("market_regimes")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", existing.id);
  }

  // Open new regime
  await supabase
    .from("market_regimes")
    .insert({
      regime: classification.regime,
      criteria,
      confidence: classification.confidence,
      consecutive_periods: 1,
      previous_regime: existing?.regime || null,
      transition_reason: classification.reason,
      started_at: new Date().toISOString(),
    });

  // Generate regime change alerts for all users with active DCA plans
  if (existing && existing.regime !== classification.regime) {
    await generateRegimeChangeAlerts(supabase, existing.regime, classification.regime, classification.reason);
  }

  return classification.regime;
}

// ---------------------------------------------------------------------------
// Action: SMART-DCA — Calculate adjusted DCA amounts
// ---------------------------------------------------------------------------

interface SmartDCAResult {
  original_amount: number;
  adjusted_amount: number;
  adjustment_pct: number;
  regime: string;
  profile: string;
  allocation_adjustments: Record<string, { original: number; adjusted: number }>;
  explanation: string;
}

// Adjustment matrix: [regime][profile] = multiplier
const DCA_ADJUSTMENT_MATRIX: Record<string, Record<string, number>> = {
  BULL:            { conservative: 1.0,  balanced: 1.0,  growth: 1.20 },
  BEAR:            { conservative: 1.0,  balanced: 0.90, growth: 0.80 },
  SIDEWAYS:        { conservative: 1.0,  balanced: 1.0,  growth: 1.0  },
  HIGH_VOLATILITY: { conservative: 0.80, balanced: 0.90, growth: 1.0  },
  ALTSEASON:       { conservative: 1.0,  balanced: 1.10, growth: 1.30 },
  CAPITULATION:    { conservative: 1.10, balanced: 1.20, growth: 1.40 },
};

// Allocation shifts per regime
const ALLOCATION_SHIFTS: Record<string, { btc_shift: number; alts_shift: number }> = {
  BULL:            { btc_shift: 0,    alts_shift: 0    },
  BEAR:            { btc_shift: 0.10, alts_shift: -0.10 },
  SIDEWAYS:        { btc_shift: 0,    alts_shift: 0    },
  HIGH_VOLATILITY: { btc_shift: 0.15, alts_shift: -0.15 },
  ALTSEASON:       { btc_shift: -0.10, alts_shift: 0.10 },
  CAPITULATION:    { btc_shift: 0.05, alts_shift: -0.05 },
};

const REGIME_EXPLANATIONS: Record<string, string> = {
  BULL: "Mercado em alta — mantendo alocações base. Growth profiles aumentam exposição.",
  BEAR: "Mercado em baixa — aumentando proporção de BTC, reduzindo altcoins para proteção.",
  SIDEWAYS: "Mercado lateral — mantendo estratégia DCA padrão. Momento ideal para acumulação.",
  HIGH_VOLATILITY: "Alta volatilidade — reduzindo exposição geral e priorizando BTC como refúgio.",
  ALTSEASON: "Temporada de altcoins — aumentando exposição a alts selecionadas com momentum.",
  CAPITULATION: "Medo extremo no mercado — historicamente o melhor momento para DCA agressivo.",
};

async function actionSmartDCA(supabase: any, userId: string): Promise<SmartDCAResult[]> {
  // Get user's intelligence profile
  const { data: intel } = await supabase
    .from("user_intelligence")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get current regime
  const { data: regimeData } = await supabase
    .from("market_regimes")
    .select("regime")
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const regime = regimeData?.[0]?.regime || "SIDEWAYS";
  const profileType = (intel?.evolved_investor_type || "Balanced Optimizer")
    .toLowerCase().includes("conservative") ? "conservative"
    : (intel?.evolved_investor_type || "").toLowerCase().includes("growth") ? "growth"
    : "balanced";

  const smartDCAEnabled = intel?.smart_dca_enabled !== false;
  const maxAdjustment = intel?.smart_dca_max_adjustment || 0.4;

  // Get user's active DCA plans
  const { data: plans } = await supabase
    .from("dca_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!plans?.length) return [];

  const results: SmartDCAResult[] = [];
  const multiplier = smartDCAEnabled
    ? DCA_ADJUSTMENT_MATRIX[regime]?.[profileType] || 1.0
    : 1.0;

  // Clamp to max adjustment
  const clampedMultiplier = Math.max(1 - maxAdjustment, Math.min(1 + maxAdjustment, multiplier));
  const shifts = ALLOCATION_SHIFTS[regime] || { btc_shift: 0, alts_shift: 0 };

  for (const plan of plans) {
    const originalAmount = plan.amount_per_interval;
    const adjustedAmount = Math.round(originalAmount * clampedMultiplier * 100) / 100;
    const assets = plan.assets || [];

    // Adjust allocations
    const adjustedAllocations: Record<string, { original: number; adjusted: number }> = {};
    let totalPct = 0;

    for (const asset of assets) {
      const symbol = asset.symbol || asset.asset;
      const originalPct = asset.allocation || asset.percentage || 0;
      const isBTC = symbol.toUpperCase().includes("BTC");

      let adjustedPct: number;
      if (isBTC) {
        adjustedPct = Math.max(30, originalPct + shifts.btc_shift * 100); // BTC min 30%
      } else {
        adjustedPct = Math.max(0, originalPct + shifts.alts_shift * 100 / Math.max(1, assets.length - 1));
      }

      adjustedAllocations[symbol] = {
        original: originalPct,
        adjusted: Math.round(adjustedPct * 10) / 10,
      };
      totalPct += adjustedPct;
    }

    // Normalize to 100%
    if (totalPct > 0 && totalPct !== 100) {
      const factor = 100 / totalPct;
      for (const key of Object.keys(adjustedAllocations)) {
        adjustedAllocations[key].adjusted = Math.round(adjustedAllocations[key].adjusted * factor * 10) / 10;
      }
    }

    results.push({
      original_amount: originalAmount,
      adjusted_amount: adjustedAmount,
      adjustment_pct: Math.round((clampedMultiplier - 1) * 100),
      regime,
      profile: profileType,
      allocation_adjustments: adjustedAllocations,
      explanation: REGIME_EXPLANATIONS[regime] || "Estratégia padrão.",
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Action: CALCULATE-SCORES — Update user behavioral scores
// ---------------------------------------------------------------------------

async function actionCalculateScores(supabase: any): Promise<{ updated: number }> {
  // Get all users with active DCA plans
  const { data: users } = await supabase
    .from("dca_plans")
    .select("user_id")
    .eq("is_active", true);

  const uniqueUsers = [...new Set((users || []).map((u: any) => u.user_id))];
  let updated = 0;

  for (const userId of uniqueUsers) {
    try {
      await calculateUserScore(supabase, userId as string);
      updated++;
    } catch (e) {
      console.error(`Failed to calculate score for ${userId}:`, e);
    }
  }

  return { updated };
}

async function calculateUserScore(supabase: any, userId: string): Promise<void> {
  // Fetch all behavior events for the last 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: events },
    { data: plans },
    { data: profile },
    { data: aiInteractions },
  ] = await Promise.all([
    supabase
      .from("user_behavior_events")
      .select("event_type, event_data, created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff),
    supabase
      .from("dca_plans")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("investor_type, capital_range, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("ai_interactions")
      .select("action, feedback, created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff),
  ]);

  const allEvents = events || [];
  const activePlans = (plans || []).filter((p: any) => p.is_active);

  // 1. CONSISTENCY (30%) — Aportes executados vs planejados
  const dcaExecuted = allEvents.filter((e: any) => e.event_type === "dca_executed").length;
  const dcaSkipped = allEvents.filter((e: any) => e.event_type === "dca_skipped").length;
  const totalDCA = dcaExecuted + dcaSkipped;
  const consistencyScore = totalDCA > 0
    ? Math.min(100, (dcaExecuted / totalDCA) * 100)
    : (activePlans.length > 0 ? 30 : 0); // New users with plans get baseline

  // 2. DISCIPLINE (25%) — Seguiu recomendações, não panic sold
  const recsAccepted = allEvents.filter((e: any) => e.event_type === "recommendation_accepted").length;
  const recsRejected = allEvents.filter((e: any) => e.event_type === "recommendation_rejected").length;
  const totalRecs = recsAccepted + recsRejected;
  const panicActions = allEvents.filter((e: any) => e.event_type === "panic_action").length;
  const dcaPaused = allEvents.filter((e: any) => e.event_type === "dca_paused").length;

  let disciplineScore = 50; // baseline
  if (totalRecs > 0) disciplineScore = (recsAccepted / totalRecs) * 80;
  disciplineScore -= panicActions * 15;
  disciplineScore -= dcaPaused * 5;
  disciplineScore = Math.max(0, Math.min(100, disciplineScore));

  // 3. KNOWLEDGE (20%) — Lições completadas, quizzes
  const lessonsCompleted = allEvents.filter((e: any) => e.event_type === "lesson_completed").length;
  const quizzesCompleted = allEvents.filter((e: any) => e.event_type === "quiz_completed").length;
  const knowledgeScore = Math.min(100, lessonsCompleted * 8 + quizzesCompleted * 15);

  // 4. ENGAGEMENT (15%) — AI usage, login frequency
  const aiUsage = (aiInteractions || []).length;
  const alertClicks = allEvents.filter((e: any) => e.event_type === "alert_clicked").length;
  const engagementScore = Math.min(100, aiUsage * 5 + alertClicks * 10);

  // 5. CAPITAL COMMITMENT (10%) — Invested vs declared
  const totalInvested = activePlans.reduce((sum: number, p: any) => sum + (p.total_invested || 0), 0);
  const declaredRange = profile?.capital_range || "$200-$500";
  const declaredMid = parseDeclaredCapital(declaredRange);
  const commitmentScore = declaredMid > 0
    ? Math.min(100, (totalInvested / declaredMid) * 100)
    : 30;

  // WEIGHTED TOTAL
  const behavioralScore = Math.round(
    consistencyScore * 0.30 +
    disciplineScore * 0.25 +
    knowledgeScore * 0.20 +
    engagementScore * 0.15 +
    commitmentScore * 0.10
  );

  // CONFIDENCE INDEX — How much we trust the profile
  const daysSinceSignup = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const dataPoints = allEvents.length + (aiInteractions || []).length;

  let confidenceIndex = 20; // Baseline
  confidenceIndex += Math.min(30, daysSinceSignup * 0.5); // Time-based (max 30)
  confidenceIndex += Math.min(30, dataPoints * 0.5);       // Data-based (max 30)
  confidenceIndex += Math.min(20, totalDCA * 2);            // DCA history (max 20)
  confidenceIndex = Math.min(100, Math.round(confidenceIndex));

  // Calculate streaks (current + longest)
  const dcaEvents = allEvents
    .filter((e: any) => e.event_type === "dca_executed" || e.event_type === "dca_skipped")
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let currentStreak = 0;
  for (const ev of dcaEvents) {
    if (ev.event_type === "dca_executed") currentStreak++;
    else break;
  }

  // Calculate longest streak from full history
  let longestStreak = 0;
  let tempStreak = 0;
  for (const ev of dcaEvents) {
    if (ev.event_type === "dca_executed") {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const planCount = activePlans.length || 1;
  const streakWeeks = Math.floor(currentStreak / planCount);
  const longestStreakWeeks = Math.floor(longestStreak / planCount);

  // Determine evolved investor type
  const originalType = profile?.investor_type || "Balanced Optimizer";
  const evolvedType = determineEvolvedType(originalType, behavioralScore, confidenceIndex, streakWeeks);

  // Upsert user intelligence
  await supabase
    .from("user_intelligence")
    .upsert({
      user_id: userId,
      behavioral_score: behavioralScore,
      consistency_score: Math.round(consistencyScore),
      discipline_score: Math.round(disciplineScore),
      knowledge_score: Math.round(knowledgeScore),
      engagement_score: Math.round(engagementScore),
      capital_commitment_score: Math.round(commitmentScore),
      confidence_index: confidenceIndex,
      original_investor_type: originalType,
      evolved_investor_type: evolvedType,
      smart_dca_enabled: true,
      current_streak_weeks: streakWeeks,
      longest_streak_weeks: longestStreakWeeks,
      total_dca_executed: dcaExecuted,
      total_dca_skipped: dcaSkipped,
      last_calculated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

function parseDeclaredCapital(range: string): number {
  const match = range.match(/\$?([\d,]+)/g);
  if (!match || match.length === 0) return 500;
  const values = match.map(v => parseInt(v.replace(/[$,]/g, "")));
  if (values.length >= 2) return (values[0] + values[1]) / 2;
  return values[0] || 500;
}

function determineEvolvedType(
  original: string,
  behavioralScore: number,
  confidence: number,
  streakWeeks: number
): string {
  // Don't evolve if not enough data
  if (confidence < 60 || streakWeeks < 8) return original;

  const isConservative = original.toLowerCase().includes("conservative");
  const isGrowth = original.toLowerCase().includes("growth");

  // Conservative → Balanced: consistent behavior + good score
  if (isConservative && behavioralScore > 70 && streakWeeks >= 12) {
    return "Balanced Optimizer";
  }

  // Balanced → Growth: high score + long streak
  if (!isConservative && !isGrowth && behavioralScore > 80 && streakWeeks >= 16) {
    return "Growth Seeker";
  }

  return original;
}

// ---------------------------------------------------------------------------
// Action: REBALANCE — Check deviation and suggest rebalance
// ---------------------------------------------------------------------------

async function actionRebalance(supabase: any, userId: string): Promise<any> {
  // Get active DCA plans
  const { data: plans } = await supabase
    .from("dca_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!plans?.length) return { needs_rebalance: false, reason: "Nenhum plano DCA ativo" };

  // Get latest portfolio snapshot
  const { data: snapshot } = await supabase
    .from("portfolio_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .limit(1);

  if (!snapshot?.length) {
    return { needs_rebalance: false, reason: "Sem snapshot de portfolio disponível" };
  }

  const latestSnapshot = snapshot[0];
  const actualAlloc = latestSnapshot.actual_allocation || {};
  const targetAlloc = latestSnapshot.target_allocation || {};

  // Calculate max deviation
  let maxDeviation = 0;
  const deviations: Record<string, number> = {};

  for (const [asset, targetPct] of Object.entries(targetAlloc) as [string, any][]) {
    const actualPct = (actualAlloc as any)[asset] || 0;
    const deviation = Math.abs(actualPct - targetPct);
    deviations[asset] = actualPct - targetPct;
    if (deviation > maxDeviation) maxDeviation = deviation;
  }

  const THRESHOLD = 15; // 15% deviation triggers rebalance

  if (maxDeviation < THRESHOLD) {
    return {
      needs_rebalance: false,
      max_deviation: maxDeviation,
      reason: `Alocação dentro do limite (desvio máximo: ${maxDeviation.toFixed(1)}%)`,
    };
  }

  // Generate soft rebalance suggestion
  const recommendation: Record<string, number> = {};
  const overAllocated: string[] = [];
  const underAllocated: string[] = [];

  for (const [asset, dev] of Object.entries(deviations)) {
    if (dev > 5) overAllocated.push(asset);
    if (dev < -5) underAllocated.push(asset);
  }

  // Next DCA should go 100% to under-allocated assets
  const totalUnderWeight = underAllocated.reduce((s, a) => s + Math.abs(deviations[a]), 0);
  for (const asset of underAllocated) {
    recommendation[asset] = totalUnderWeight > 0
      ? Math.round(Math.abs(deviations[asset]) / totalUnderWeight * 100)
      : Math.round(100 / underAllocated.length);
  }

  const explanation = `Seu portfolio desviou ${maxDeviation.toFixed(1)}% do target. ` +
    `${overAllocated.join(", ")} está(ão) acima do target. ` +
    `Sugiro direcionar seu próximo aporte DCA para ${underAllocated.join(", ")} para rebalancear.`;

  // Get current regime
  const { data: regimeData } = await supabase
    .from("market_regimes")
    .select("regime")
    .is("ended_at", null)
    .limit(1);

  const regime = regimeData?.[0]?.regime || "SIDEWAYS";

  // Save suggestion
  await supabase
    .from("rebalance_suggestions")
    .insert({
      user_id: userId,
      current_allocation: actualAlloc,
      target_allocation: targetAlloc,
      deviation_pct: maxDeviation,
      rebalance_mode: "soft",
      recommendation: { next_dca_allocation: recommendation },
      explanation,
      market_regime: regime,
    });

  return {
    needs_rebalance: true,
    max_deviation: maxDeviation,
    over_allocated: overAllocated,
    under_allocated: underAllocated,
    recommendation,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// Action: BRIEFING — Generate personalized daily briefing
// ---------------------------------------------------------------------------

async function actionBriefing(supabase: any, userId: string): Promise<any> {
  // Fetch all context in parallel
  const [
    { data: regime },
    { data: btcSnapshot },
    { data: portfolio },
    { data: intel },
    { data: plans },
    { data: alerts },
  ] = await Promise.all([
    supabase.from("market_regimes").select("regime, confidence, transition_reason").is("ended_at", null).limit(1),
    supabase.from("market_snapshots").select("*").eq("symbol", "BTCUSDT").order("captured_at", { ascending: false }).limit(1),
    supabase.from("portfolio_snapshots").select("*").eq("user_id", userId).order("captured_at", { ascending: false }).limit(1),
    supabase.from("user_intelligence").select("*").eq("user_id", userId).single(),
    supabase.from("dca_plans").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("smart_alerts").select("*").eq("user_id", userId).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
  ]);

  const currentRegime = regime?.[0]?.regime || "SIDEWAYS";
  const btc = btcSnapshot?.[0];
  const portfolioData = portfolio?.[0];
  const intelligence = intel;
  const activePlans = plans || [];
  const unreadAlerts = alerts || [];

  // Find next DCA execution
  let nextDCA = null;
  for (const plan of activePlans) {
    if (plan.next_execution_date) {
      const execDate = new Date(plan.next_execution_date);
      if (!nextDCA || execDate < nextDCA.date) {
        nextDCA = { date: execDate, amount: plan.amount_per_interval, frequency: plan.frequency };
      }
    }
  }

  // Build context for AI
  const context = {
    regime: currentRegime,
    btc_price: btc?.price,
    btc_change_24h: btc?.change_24h_pct,
    fear_greed: btc?.fear_greed_index,
    fear_greed_label: btc?.fear_greed_label,
    portfolio_value: portfolioData?.total_value_usd,
    portfolio_pnl_pct: portfolioData?.pnl_pct,
    portfolio_deviation: portfolioData?.allocation_deviation,
    behavioral_score: intelligence?.behavioral_score,
    confidence_index: intelligence?.confidence_index,
    investor_type: intelligence?.evolved_investor_type || "Balanced Optimizer",
    streak_weeks: intelligence?.current_streak_weeks,
    next_dca: nextDCA,
    active_plans_count: activePlans.length,
    unread_alerts: unreadAlerts.length,
    total_invested: activePlans.reduce((s: number, p: any) => s + (p.total_invested || 0), 0),
  };

  // Generate briefing via Claude
  const briefing = await generateAIBriefing(context);

  // Log interaction
  await supabase
    .from("ai_interactions")
    .insert({
      user_id: userId,
      action: "briefing",
      model: "claude-haiku-4-5-20251001",
      request_context: context,
      response_summary: briefing.summary,
      response_data: briefing,
    });

  return briefing;
}

async function generateAIBriefing(context: any): Promise<any> {
  const systemPrompt = `Você é o assistente de investimentos do Apice Capital. Gere um briefing diário CONCISO e PERSONALIZADO em português BR.

REGRAS:
- Máximo 5 linhas
- Use emojis com moderação (1-2 por seção)
- Seja específico com números
- Inclua uma dica acionável
- Tom: profissional mas acessível
- NUNCA dê conselho financeiro direto — frame como educação

FORMATO (JSON):
{
  "summary": "Resumo em 1 linha",
  "market": "Status do mercado (regime, BTC, sentimento)",
  "portfolio": "Status do portfolio (valor, PnL, alocação)",
  "next_action": "Próxima ação recomendada",
  "tip": "Dica educacional contextualizada ao momento",
  "motivation": "Frase motivacional curta baseada no streak/score"
}`;

  const userMessage = `Contexto do usuário:
- Regime: ${context.regime}
- BTC: $${context.btc_price?.toLocaleString()} (${context.btc_change_24h > 0 ? "+" : ""}${context.btc_change_24h?.toFixed(1)}% 24h)
- Fear & Greed: ${context.fear_greed} (${context.fear_greed_label})
- Portfolio: $${context.portfolio_value?.toLocaleString() || "N/A"} (${context.portfolio_pnl_pct > 0 ? "+" : ""}${context.portfolio_pnl_pct?.toFixed(1) || 0}%)
- Perfil: ${context.investor_type}
- Score comportamental: ${context.behavioral_score}/100
- Streak: ${context.streak_weeks} semanas
- Próximo DCA: ${context.next_dca ? `$${context.next_dca.amount} (${context.next_dca.frequency})` : "Não configurado"}
- Total investido: $${context.total_invested?.toLocaleString() || 0}
- Alertas não lidos: ${context.unread_alerts}

Gere o briefing diário.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { summary: text, market: "", portfolio: "", next_action: "", tip: "", motivation: "" };
  } catch (e) {
    console.error("AI briefing generation failed:", e);
    return {
      summary: "Briefing indisponível no momento",
      market: `Mercado em ${context.regime}. BTC: $${context.btc_price?.toLocaleString()}`,
      portfolio: `Portfolio: $${context.portfolio_value?.toLocaleString() || "N/A"}`,
      next_action: context.next_dca ? `Próximo aporte: $${context.next_dca.amount}` : "Configure um plano DCA",
      tip: "Consistência é a chave do DCA — aportes regulares superam timing de mercado.",
      motivation: "Continue firme na estratégia!",
    };
  }
}

// ---------------------------------------------------------------------------
// Action: ALERTS — Get/manage smart alerts
// ---------------------------------------------------------------------------

async function actionAlerts(
  supabase: any,
  userId: string,
  subAction: string,
  alertId?: string
): Promise<any> {
  switch (subAction) {
    case "list": {
      const { data } = await supabase
        .from("smart_alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return { alerts: data || [] };
    }

    case "unread": {
      const { data } = await supabase
        .from("smart_alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(10);
      return { alerts: data || [], count: data?.length || 0 };
    }

    case "read": {
      if (!alertId) return { error: "alert_id required" };
      await supabase
        .from("smart_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", alertId)
        .eq("user_id", userId);
      return { success: true };
    }

    case "dismiss": {
      if (!alertId) return { error: "alert_id required" };
      await supabase
        .from("smart_alerts")
        .update({ is_dismissed: true })
        .eq("id", alertId)
        .eq("user_id", userId);
      return { success: true };
    }

    case "acted": {
      if (!alertId) return { error: "alert_id required" };
      await supabase
        .from("smart_alerts")
        .update({ is_acted_on: true, acted_at: new Date().toISOString() })
        .eq("id", alertId)
        .eq("user_id", userId);
      return { success: true };
    }

    default:
      return { error: `Unknown sub-action: ${subAction}` };
  }
}

// ---------------------------------------------------------------------------
// Alert Generation Helpers
// ---------------------------------------------------------------------------

async function generateRegimeChangeAlerts(
  supabase: any,
  oldRegime: string,
  newRegime: string,
  reason: string
): Promise<void> {
  // Get all users with active DCA plans
  const { data: users } = await supabase
    .from("dca_plans")
    .select("user_id")
    .eq("is_active", true);

  const uniqueUsers = [...new Set((users || []).map((u: any) => u.user_id))];

  const alerts = uniqueUsers.map(userId => ({
    user_id: userId,
    alert_type: "regime_change",
    severity: newRegime === "CAPITULATION" ? "critical" : "warning",
    title: `Mudanca de regime: ${oldRegime} → ${newRegime}`,
    message: reason,
    action_label: "Ver Smart DCA",
    action_route: "/automations/dca",
    action_data: { old_regime: oldRegime, new_regime: newRegime },
    market_regime: newRegime,
    trigger_data: { reason },
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  if (alerts.length > 0) {
    await supabase.from("smart_alerts").insert(alerts);
  }
}

// ---------------------------------------------------------------------------
// Action: WAR-CHEST — Capital de Guerra strategy
// ---------------------------------------------------------------------------

interface WarChestStatus {
  regime: string;
  profileType: string;
  // Current state
  currentReservePct: number;
  currentReserveUsd: number;
  // Target state (based on regime)
  targetReservePct: number;
  deployablePct: number;
  deployableUsd: number;
  // Action
  action: 'ACCUMULATE' | 'HOLD' | 'DEPLOY' | 'PARTIAL_DEPLOY';
  actionDescription: string;
  deployTargets: { asset: string; pct: number }[];
  // Context
  fearGreed: number;
  explanation: string;
}

// War Chest reserve targets by regime and profile
const WAR_CHEST_TARGETS: Record<string, Record<string, { reserve: number; deploy: number }>> = {
  BULL:            { conservative: { reserve: 10, deploy: 0 },  balanced: { reserve: 8,  deploy: 0 },  growth: { reserve: 5,  deploy: 0 } },
  SIDEWAYS:        { conservative: { reserve: 15, deploy: 0 },  balanced: { reserve: 12, deploy: 0 },  growth: { reserve: 10, deploy: 0 } },
  BEAR:            { conservative: { reserve: 20, deploy: 0 },  balanced: { reserve: 18, deploy: 0 },  growth: { reserve: 15, deploy: 0 } },
  HIGH_VOLATILITY: { conservative: { reserve: 25, deploy: 0 },  balanced: { reserve: 20, deploy: 0 },  growth: { reserve: 15, deploy: 0 } },
  ALTSEASON:       { conservative: { reserve: 12, deploy: 3 },  balanced: { reserve: 8,  deploy: 5 },  growth: { reserve: 5,  deploy: 8 } },
  CAPITULATION:    { conservative: { reserve: 5,  deploy: 10 }, balanced: { reserve: 5,  deploy: 8 },  growth: { reserve: 5,  deploy: 7 } },
};

async function actionWarChest(supabase: any, userId: string): Promise<WarChestStatus> {
  // Get current regime
  const { data: regimeData } = await supabase
    .from("market_regimes")
    .select("regime")
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const regime = regimeData?.[0]?.regime || "SIDEWAYS";

  // Get user intelligence
  const { data: intel } = await supabase
    .from("user_intelligence")
    .select("evolved_investor_type")
    .eq("user_id", userId)
    .single();

  const evolvedType = (intel?.evolved_investor_type || "Balanced Optimizer").toLowerCase();
  const profileType = evolvedType.includes("conservative") ? "conservative"
    : evolvedType.includes("growth") ? "growth"
    : "balanced";

  // Get user's active plans to find current stablecoin allocation
  const { data: plans } = await supabase
    .from("dca_plans")
    .select("assets, amount_per_interval, total_invested")
    .eq("user_id", userId)
    .eq("is_active", true);

  let totalPortfolioValue = 0;
  let stablecoinValue = 0;
  const stablecoins = ["USDT", "USDC", "BUSD", "DAI", "FDUSD"];

  for (const plan of (plans || [])) {
    totalPortfolioValue += plan.total_invested || 0;
    for (const asset of (plan.assets || [])) {
      const sym = (asset.symbol || asset.asset || "").toUpperCase();
      if (stablecoins.some(s => sym.includes(s))) {
        stablecoinValue += (plan.total_invested || 0) * ((asset.allocation || asset.percentage || 0) / 100);
      }
    }
  }

  const currentReservePct = totalPortfolioValue > 0
    ? Math.round(stablecoinValue / totalPortfolioValue * 100)
    : 12; // Default assumption

  // Get fear & greed for context
  const { data: btcData } = await supabase
    .from("market_snapshots")
    .select("fear_greed_index")
    .eq("symbol", "BTCUSDT")
    .order("captured_at", { ascending: false })
    .limit(1);

  const fearGreed = btcData?.[0]?.fear_greed_index || 50;

  // Calculate target
  const targets = WAR_CHEST_TARGETS[regime]?.[profileType] || WAR_CHEST_TARGETS.SIDEWAYS[profileType];
  const targetReservePct = targets.reserve;
  const deployablePct = targets.deploy;
  const deployableUsd = totalPortfolioValue > 0 ? Math.round(totalPortfolioValue * deployablePct / 100) : 0;

  // Determine action
  let action: WarChestStatus['action'];
  let actionDescription: string;
  let deployTargets: { asset: string; pct: number }[] = [];

  if (deployablePct > 0 && currentReservePct > targetReservePct) {
    // DEPLOY or PARTIAL DEPLOY
    if (regime === "CAPITULATION") {
      action = "DEPLOY";
      actionDescription = `CAPITULAÇÃO DETECTADA (F&G: ${fearGreed})! Deploy ${deployablePct}% do Capital de Guerra em BTC e ETH. Historicamente, compras em medo extremo rendem +40-80% em 12 meses.`;
      deployTargets = [
        { asset: "BTC", pct: 60 },
        { asset: "ETH", pct: 40 },
      ];
    } else if (regime === "ALTSEASON") {
      action = "PARTIAL_DEPLOY";
      actionDescription = `Altseason em andamento — deployando ${deployablePct}% do Capital de Guerra em alts com momentum.`;
      deployTargets = [
        { asset: "SOL", pct: 40 },
        { asset: "AVAX", pct: 30 },
        { asset: "LINK", pct: 30 },
      ];
    } else {
      action = "HOLD";
      actionDescription = "Capital de Guerra em standby. Monitorando oportunidades.";
    }
  } else if (currentReservePct < targetReservePct) {
    action = "ACCUMULATE";
    const deficit = targetReservePct - currentReservePct;
    actionDescription = `Acumulando Capital de Guerra: ${currentReservePct}% → ${targetReservePct}% (faltam ${deficit}%). Regime ${regime} requer reserva de ${targetReservePct}%.`;
  } else {
    action = "HOLD";
    actionDescription = `Capital de Guerra adequado (${currentReservePct}%). Regime ${regime} — mantendo reserva estável.`;
  }

  // Generate alert if DEPLOY action
  if (action === "DEPLOY") {
    await supabase.from("smart_alerts").insert({
      user_id: userId,
      alert_type: "opportunity",
      severity: "critical",
      title: "Capital de Guerra — Hora de Deployar!",
      message: actionDescription,
      action_label: "Ver Oportunidade",
      action_route: "/automations/dca",
      action_data: { deploy_targets: deployTargets, deploy_pct: deployablePct },
      market_regime: regime,
      trigger_data: { fear_greed: fearGreed, current_reserve: currentReservePct },
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return {
    regime,
    profileType,
    currentReservePct,
    currentReserveUsd: Math.round(stablecoinValue),
    targetReservePct,
    deployablePct,
    deployableUsd,
    action,
    actionDescription,
    deployTargets,
    fearGreed,
    explanation: action === "DEPLOY"
      ? "Medo extremo no mercado = oportunidade histórica. O Capital de Guerra existe para este momento."
      : action === "ACCUMULATE"
      ? "Aumentando reserva para se preparar para a próxima oportunidade."
      : "Reserva adequada. O sistema monitora 24/7 e alertará quando for hora de agir.",
  };
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { action, sub_action, alert_id } = body;

    const supabaseService = getServiceClient();

    // Cron-triggered actions: MUST authenticate via x-cron-secret or service_role JWT.
    // (Previously allowed `!authHeader` — unauth requests — which let any caller
    //  trigger collect/calculate-scores and drain the Supabase free tier.)
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");
    const isCronSecret = cronSecret === CRON_SECRET && CRON_SECRET !== "";
    const isServiceRole = authHeader ? authHeader.includes(SUPABASE_SERVICE_KEY) : false;
    const isCronAction = action === "collect" || action === "calculate-scores";

    if (isCronAction && (isCronSecret || isServiceRole)) {
      // Allow cron actions from: cron_secret, service_role, or pg_cron (headerless)
      switch (action) {
        case "collect": {
          const result = await actionCollect(supabaseService);
          return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
        case "calculate-scores": {
          const result = await actionCalculateScores(supabaseService);
          return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
      }
    }

    // User-triggered actions (require auth)
    const userAuthHeader = req.headers.get("Authorization");
    if (!userAuthHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const userClient = getUserClient(userAuthHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let result;
    switch (action) {
      case "smart-dca":
        result = await actionSmartDCA(supabaseService, user.id);
        break;

      case "rebalance":
        result = await actionRebalance(supabaseService, user.id);
        break;

      case "briefing":
        result = await actionBriefing(supabaseService, user.id);
        break;

      case "alerts":
        result = await actionAlerts(supabaseService, user.id, sub_action || "list", alert_id);
        break;

      case "detect-regime": {
        const regime = await detectRegime(supabaseService);
        result = { regime };
        break;
      }

      case "war-chest":
        result = await actionWarChest(supabaseService, user.id);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("market-intelligence error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
