// Supabase Edge Function: explosive-score
// Computes AI-powered Explosive Scores for curated crypto universe
// Runs every 4 hours via cron or on-demand via POST
//
// Actions:
//   "compute"  — Recalculate all scores (cron / manual trigger)
//   "read"     — Return current scored coins (client reads)
//
// Data sources: CoinGecko (market + dev + community), DeFiLlama (TVL)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_BASE = 'https://api.llama.fi';

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

// ─── Scoring Constants ──────────────────────────────────────────

const WEIGHTS = {
  fundamental: 25,
  momentum: 20,
  marketPosition: 15,
  risk: 15,
  narrative: 15,
  timing: 10,
};

// Sector mapping for narrative scoring
const SECTOR_MAP: Record<string, string> = {};

// ─── CoinGecko Batch Fetch ─────────────────────────────────────

async function fetchCoinGeckoBatch(coinIds: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const batchSize = 10;

  for (let i = 0; i < coinIds.length; i += batchSize) {
    const batch = coinIds.slice(i, i + batchSize);
    const ids = batch.join(',');

    try {
      // Market data with sparkline for RSI proxy
      const marketRes = await fetch(
        `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=7d,30d&per_page=${batchSize}`
      );

      if (marketRes.ok) {
        const data = await marketRes.json();
        for (const coin of data) {
          results[coin.id] = { market: coin };
        }
      }
    } catch (e) {
      console.error(`CoinGecko batch fetch error:`, e);
    }

    // Rate limit: 2s between batches
    if (i + batchSize < coinIds.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Fetch detailed data (dev + community) for top coins only
  const topIds = coinIds.slice(0, 30);
  for (const coinId of topIds) {
    try {
      const detailRes = await fetch(
        `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true`
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        if (results[coinId]) {
          results[coinId].detail = detail;
        }
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`CoinGecko detail fetch error for ${coinId}:`, e);
    }
  }

  return results;
}

// ─── DeFiLlama TVL Fetch ────────────────────────────────────────

async function fetchDeFiLlamaTVL(slugs: { coinId: string; slug: string }[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const { coinId, slug } of slugs) {
    if (!slug) continue;
    try {
      const res = await fetch(`${DEFILLAMA_BASE}/protocol/${slug}`);
      if (res.ok) {
        const data = await res.json();
        results[coinId] = {
          tvl: data.currentChainTvls ? Object.values(data.currentChainTvls).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : (data.tvl || 0),
          tvlChange1d: data.change_1d || 0,
          tvlChange7d: data.change_7d || 0,
          tvlChange30d: data.change_1m || 0,
          category: data.category || '',
        };
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`DeFiLlama fetch error for ${slug}:`, e);
    }
  }

  return results;
}

// ─── Score Computation ──────────────────────────────────────────

function computeRSIProxy(sparkline: number[]): number {
  if (!sparkline || sparkline.length < 14) return 50;
  const last14 = sparkline.slice(-14);
  let gains = 0, losses = 0;
  for (let i = 1; i < last14.length; i++) {
    const diff = last14[i] - last14[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = (gains / 13) / (losses / 13);
  return 100 - (100 / (1 + rs));
}

function scoreFundamental(coinData: any, tvlData: any): number {
  let score = 0;

  // TVL growth 30d (0-8)
  if (tvlData) {
    const change = tvlData.tvlChange30d || 0;
    if (change > 50) score += 8;
    else if (change > 20) score += 5;
    else if (change > 0) score += 2;
  }

  // Dev activity (0-8)
  const commits = coinData?.detail?.developer_data?.commit_count_4_weeks || 0;
  if (commits > 100) score += 8;
  else if (commits > 50) score += 5;
  else if (commits > 20) score += 3;
  else if (commits > 5) score += 1;

  // Tokenomics health (0-5): circulating/max ratio
  const market = coinData?.market;
  if (market?.circulating_supply && market?.max_supply && market.max_supply > 0) {
    const ratio = market.circulating_supply / market.max_supply;
    if (ratio >= 0.3 && ratio <= 0.7) score += 5;
    else if (ratio > 0.7 && ratio <= 0.9) score += 3;
    else score += 1;
  } else {
    score += 2; // neutral for infinite supply
  }

  // Community presence (0-4)
  const twitter = coinData?.detail?.community_data?.twitter_followers || 0;
  if (twitter > 500000) score += 4;
  else if (twitter > 100000) score += 3;
  else if (twitter > 10000) score += 2;
  else if (twitter > 1000) score += 1;

  return Math.min(score, WEIGHTS.fundamental);
}

function scoreMomentum(market: any): number {
  let score = 0;

  // 7d price change (0-7)
  const change7d = market?.price_change_percentage_7d_in_currency || 0;
  if (change7d > 15) score += 7;
  else if (change7d > 5) score += 4;
  else if (change7d > 0) score += 2;

  // 30d price change (0-7)
  const change30d = market?.price_change_percentage_30d_in_currency || 0;
  if (change30d > 30) score += 7;
  else if (change30d > 10) score += 4;
  else if (change30d > 0) score += 2;

  // Volume surge proxy (0-6): high volume relative to market cap
  const vol = market?.total_volume || 0;
  const mcap = market?.market_cap || 1;
  const volRatio = vol / mcap;
  if (volRatio > 0.3) score += 6;
  else if (volRatio > 0.15) score += 4;
  else if (volRatio > 0.05) score += 2;

  return Math.min(score, WEIGHTS.momentum);
}

function scoreMarketPosition(market: any, hasBybit: boolean): number {
  let score = 0;

  // Market cap tier (0-5): sweet spot is small-mid cap
  const mcap = market?.market_cap || 0;
  if (mcap < 50_000_000) score += 3;        // micro-cap (high upside, high risk)
  else if (mcap < 500_000_000) score += 5;   // small cap (sweet spot)
  else if (mcap < 5_000_000_000) score += 4; // mid cap
  else score += 2;                            // large cap (limited upside)

  // Liquidity: volume > $10M (0-5)
  const vol = market?.total_volume || 0;
  if (vol > 100_000_000) score += 5;
  else if (vol > 10_000_000) score += 3;
  else if (vol > 1_000_000) score += 1;

  // Listed on Bybit (0-5)
  if (hasBybit) score += 5;

  return Math.min(score, WEIGHTS.marketPosition);
}

function scoreRisk(market: any, sparkline: number[]): number {
  let score = 0;

  // Volatility from sparkline (0-8, inverted: moderate vol = highest score)
  if (sparkline && sparkline.length >= 7) {
    const returns = [];
    for (let i = 1; i < sparkline.length; i++) {
      returns.push((sparkline[i] - sparkline[i-1]) / sparkline[i-1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0.15) score += 2;       // extreme vol
    else if (stdDev > 0.08) score += 5;   // moderate vol (good for trading)
    else if (stdDev > 0.03) score += 8;   // healthy vol
    else score += 5;                       // too stable for "explosive"
  } else {
    score += 4;
  }

  // ATH drawdown (0-7): recovery potential
  const ath = market?.ath || 0;
  const price = market?.current_price || 0;
  if (ath > 0 && price > 0) {
    const drawdown = ((ath - price) / ath) * 100;
    if (drawdown > 90) score += 2;       // possibly dead
    else if (drawdown > 50) score += 7;  // strong recovery potential
    else if (drawdown > 30) score += 5;  // decent upside
    else score += 3;                      // near ATH
  } else {
    score += 3;
  }

  return Math.min(score, WEIGHTS.risk);
}

function scoreNarrative(market: any, sector: string, sectorAvgChanges: Record<string, number>): number {
  let score = 0;

  // Sector momentum (0-8)
  const sectorChange = sectorAvgChanges[sector] || 0;
  if (sectorChange > 10) score += 8;
  else if (sectorChange > 5) score += 5;
  else if (sectorChange > 0) score += 3;

  // Social velocity proxy: high market cap rank with good volume (0-7)
  const rank = market?.market_cap_rank || 999;
  if (rank <= 50) score += 3;
  else if (rank <= 100) score += 5;
  else if (rank <= 200) score += 7; // smaller coins with volume = narrative
  else score += 4;

  return Math.min(score, WEIGHTS.narrative);
}

function scoreTiming(market: any, sparkline: number[]): number {
  let score = 0;

  // ATH distance opportunity (0-5)
  const ath = market?.ath || 0;
  const price = market?.current_price || 0;
  if (ath > 0 && price > 0) {
    const drawdown = ((ath - price) / ath) * 100;
    if (drawdown >= 60 && drawdown <= 85) score += 5; // accumulation zone
    else if (drawdown >= 40 && drawdown < 60) score += 3;
    else if (drawdown < 30) score += 1;
    else score += 2; // >85% drawdown, risky
  }

  // RSI proxy (0-5): oversold = buying opportunity
  const rsi = computeRSIProxy(sparkline);
  if (rsi < 30) score += 5;       // oversold
  else if (rsi < 40) score += 4;
  else if (rsi < 60) score += 3;  // neutral
  else if (rsi < 70) score += 2;
  else score += 1;                  // overbought

  return Math.min(score, WEIGHTS.timing);
}

// ─── Risk Level Classification ──────────────────────────────────

function classifyRisk(totalScore: number, fundamental: number, volatility: number): string {
  if (totalScore > 70 && fundamental > 18) return 'conservative';
  if (totalScore > 50 && fundamental > 10) return 'balanced';
  if (totalScore > 40) return 'high';
  return 'extreme';
}

// ─── Rationale Generator ────────────────────────────────────────

function generateRationale(coin: any, pillars: any, sector: string, tvlData: any): string {
  const parts: string[] = [];
  const market = coin.market;

  if (pillars.fundamental >= 18) parts.push('Strong fundamentals with active development');
  else if (pillars.fundamental >= 12) parts.push('Solid project fundamentals');

  if (pillars.momentum >= 14) parts.push('significant momentum surge');
  else if (pillars.momentum >= 8) parts.push('positive momentum building');

  if (tvlData && tvlData.tvlChange30d > 20) parts.push(`TVL growing ${Math.round(tvlData.tvlChange30d)}% in 30d`);

  const drawdown = market?.ath ? ((market.ath - market.current_price) / market.ath * 100) : 0;
  if (drawdown > 60 && drawdown < 85) parts.push('in accumulation zone below ATH');

  if (parts.length === 0) parts.push(`${sector.toUpperCase()} sector play with potential`);

  return parts.join('. ') + '.';
}

// ─── Buying Strategy Generator ──────────────────────────────────

function generateBuyingStrategy(totalScore: number, riskLevel: string, market: any): any {
  if (totalScore > 75) {
    return {
      method: 'dca',
      rationale: 'Strong conviction — consistent accumulation recommended',
      suggestedAllocation: riskLevel === 'conservative' ? 8 : riskLevel === 'balanced' ? 5 : 3,
      timeHorizon: '6-12m',
    };
  }
  if (totalScore > 60) {
    return {
      method: 'lump_dip',
      rationale: 'Good potential — buy on dips for better entry',
      suggestedAllocation: riskLevel === 'conservative' ? 5 : riskLevel === 'balanced' ? 4 : 3,
      timeHorizon: '6-12m',
    };
  }
  return {
    method: 'scaled_entry',
    rationale: 'Speculative — small position with scaled entries',
    suggestedAllocation: 2,
    timeHorizon: '3-6m',
  };
}

// ─── Main Compute Pipeline ──────────────────────────────────────

async function computeScores(supabaseClient: any) {
  // 1. Fetch active universe
  const { data: universe, error: uErr } = await supabaseClient
    .from('explosive_universe')
    .select('*')
    .eq('is_active', true);

  if (uErr || !universe?.length) {
    throw new Error(`Failed to load universe: ${uErr?.message || 'empty'}`);
  }

  const coinIds = universe.map((c: any) => c.coin_id);

  // 2. Fetch CoinGecko data
  const geckoData = await fetchCoinGeckoBatch(coinIds);

  // 3. Fetch DeFiLlama TVL for DeFi coins
  const defiSlugs = universe
    .filter((c: any) => c.defillama_slug)
    .map((c: any) => ({ coinId: c.coin_id, slug: c.defillama_slug }));
  const tvlData = await fetchDeFiLlamaTVL(defiSlugs);

  // 4. Compute sector averages for narrative scoring
  const sectorChanges: Record<string, number[]> = {};
  for (const coin of universe) {
    const market = geckoData[coin.coin_id]?.market;
    if (market?.price_change_percentage_7d_in_currency) {
      if (!sectorChanges[coin.sector]) sectorChanges[coin.sector] = [];
      sectorChanges[coin.sector].push(market.price_change_percentage_7d_in_currency);
    }
  }
  const sectorAvgChanges: Record<string, number> = {};
  for (const [sector, changes] of Object.entries(sectorChanges)) {
    sectorAvgChanges[sector] = changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  // 5. Score each coin
  const scores: any[] = [];
  for (const coin of universe) {
    const data = geckoData[coin.coin_id];
    if (!data?.market) continue;

    const market = data.market;
    const sparkline = market.sparkline_in_7d?.price || [];
    const tvl = tvlData[coin.coin_id];

    const fundamental = scoreFundamental(data, tvl);
    const momentum = scoreMomentum(market);
    const marketPosition = scoreMarketPosition(market, !!coin.bybit_symbol);
    const risk = scoreRisk(market, sparkline);
    const narrative = scoreNarrative(market, coin.sector, sectorAvgChanges);
    const timing = scoreTiming(market, sparkline);

    const totalScore = fundamental + momentum + marketPosition + risk + narrative + timing;
    const riskLevel = classifyRisk(totalScore, fundamental, 0);

    scores.push({
      coin_id: coin.coin_id,
      total_score: totalScore,
      fundamental_score: fundamental,
      momentum_score: momentum,
      market_position_score: marketPosition,
      risk_score: risk,
      narrative_score: narrative,
      timing_score: timing,
      risk_level: riskLevel,
      rationale: generateRationale(data, { fundamental, momentum, marketPosition, risk, narrative, timing }, coin.sector, tvl),
      buying_strategy: generateBuyingStrategy(totalScore, riskLevel, market),
      raw_metrics: {
        price: market.current_price,
        change24h: market.price_change_percentage_24h,
        change7d: market.price_change_percentage_7d_in_currency,
        change30d: market.price_change_percentage_30d_in_currency,
        volume24h: market.total_volume,
        marketCap: market.market_cap,
        marketCapRank: market.market_cap_rank,
        ath: market.ath,
        athDistance: market.ath ? ((market.ath - market.current_price) / market.ath * 100) : 0,
        image: market.image,
        tvl: tvl?.tvl || null,
        tvlChange30d: tvl?.tvlChange30d || null,
        devCommits: data.detail?.developer_data?.commit_count_4_weeks || null,
        twitterFollowers: data.detail?.community_data?.twitter_followers || null,
      },
      computed_at: new Date().toISOString(),
    });
  }

  // 6. Upsert scores
  for (const score of scores) {
    await supabaseClient
      .from('explosive_scores')
      .upsert(score, { onConflict: 'coin_id' });
  }

  // 7. Save snapshots for delta computation
  const snapshots = scores.map(s => ({
    coin_id: s.coin_id,
    twitter_followers: s.raw_metrics.twitterFollowers,
    tvl: s.raw_metrics.tvl,
    volume_24h: s.raw_metrics.volume24h,
    market_cap: s.raw_metrics.marketCap,
  }));
  if (snapshots.length > 0) {
    await supabaseClient.from('coin_snapshots').insert(snapshots);
  }

  return { scored: scores.length, topScore: Math.max(...scores.map(s => s.total_score)) };
}

// ─── Read Scores (Client-facing) ────────────────────────────────

async function readScores(supabaseClient: any, limit: number) {
  const { data, error } = await supabaseClient
    .from('explosive_scores')
    .select(`
      *,
      explosive_universe!inner (symbol, name, sector, bybit_symbol)
    `)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Read scores error: ${error.message}`);

  return (data || []).map((row: any) => ({
    coinId: row.coin_id,
    symbol: row.explosive_universe.symbol,
    name: row.explosive_universe.name,
    sector: row.explosive_universe.sector,
    image: row.raw_metrics?.image || '',
    currentPrice: row.raw_metrics?.price || 0,
    change24h: row.raw_metrics?.change24h || 0,
    totalScore: Number(row.total_score),
    pillars: {
      fundamental: Number(row.fundamental_score),
      momentum: Number(row.momentum_score),
      marketPosition: Number(row.market_position_score),
      risk: Number(row.risk_score),
      narrative: Number(row.narrative_score),
      timing: Number(row.timing_score),
    },
    riskLevel: row.risk_level,
    rationale: row.rationale,
    buyingStrategy: row.buying_strategy,
    rawMetrics: row.raw_metrics,
    computedAt: row.computed_at,
  }));
}

// ─── Handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const { action = 'read', limit = 30 } = await req.json().catch(() => ({}));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      action === 'compute'
        ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        : Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    if (action === 'compute') {
      const cronSecret = req.headers.get('x-cron-secret');
      const expectedSecret = Deno.env.get('CRON_SECRET');
      if (expectedSecret && cronSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const result = await computeScores(supabaseClient);
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Default: read scores
    const scores = await readScores(supabaseClient, limit);
    return new Response(JSON.stringify({ success: true, data: scores }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('explosive-score error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
