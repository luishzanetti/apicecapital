import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { getTopMarketCoins, type CoinData } from '@/services/marketData';
import type { ExplosiveCoin, ExplosiveRiskLevel, BuyingStrategy } from '@/types/explosive';

// ─── Supabase-backed fetch (production) ─────────────────────────

export async function fetchExplosiveScores(limit = 30): Promise<ExplosiveCoin[]> {
  if (!isSupabaseConfigured) {
    return fetchFallbackScores(limit);
  }

  try {
    const { data, error } = await invokeEdgeFunction<{ success: boolean; data: ExplosiveCoin[] }>(
      'explosive-score',
      { body: { action: 'read', limit } },
    );

    if (error || !data?.data?.length) {
      return fetchFallbackScores(limit);
    }

    return data.data;
  } catch {
    return fetchFallbackScores(limit);
  }
}

// ─── Local Fallback Scoring (demo / offline) ────────────────────

const FALLBACK_UNIVERSE: { id: string; symbol: string; name: string; sector: ExplosiveCoin['sector'] }[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', sector: 'l1' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', sector: 'l1' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', sector: 'l1' },
  { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', sector: 'l1' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', sector: 'infra' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', sector: 'defi' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', sector: 'defi' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', sector: 'l2' },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', sector: 'l2' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', sector: 'l1' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', sector: 'l1' },
  { id: 'render-token', symbol: 'RNDR', name: 'Render', sector: 'ai' },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', sector: 'defi' },
  { id: 'fetch-ai', symbol: 'FET', name: 'Fetch.ai', sector: 'ai' },
  { id: 'pendle', symbol: 'PENDLE', name: 'Pendle', sector: 'defi' },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', sector: 'infra' },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable', sector: 'gaming' },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', sector: 'infra' },
  { id: 'jupiter', symbol: 'JUP', name: 'Jupiter', sector: 'defi' },
  { id: 'ondo-finance', symbol: 'ONDO', name: 'Ondo Finance', sector: 'rwa' },
];

function computeLocalScore(coin: CoinData, sector: ExplosiveCoin['sector']): ExplosiveCoin {
  const change = coin.price_change_percentage_24h || 0;
  const absChange = Math.abs(change);

  // Simplified scoring based on available data
  const momentum = Math.min(20, Math.max(0, change > 0 ? absChange * 1.5 : absChange * 0.5));
  const fundamental = sector === 'l1' ? 18 : sector === 'defi' ? 16 : sector === 'ai' ? 15 : sector === 'infra' ? 14 : 10;
  const marketPosition = 10;
  const risk = 10;
  const narrative = sector === 'ai' ? 13 : sector === 'rwa' ? 12 : sector === 'defi' ? 11 : 8;
  const timing = change < -5 ? 8 : change < 0 ? 6 : 4;

  const totalScore = Math.min(100, Math.round(fundamental + momentum + marketPosition + risk + narrative + timing));

  const riskLevel: ExplosiveRiskLevel =
    totalScore > 70 ? 'conservative' :
    totalScore > 50 ? 'balanced' :
    totalScore > 40 ? 'high' : 'extreme';

  const buyingStrategy: BuyingStrategy = totalScore > 70
    ? { method: 'dca', rationale: 'Strong conviction — consistent accumulation', suggestedAllocation: 8, timeHorizon: '6-12m' }
    : totalScore > 55
    ? { method: 'lump_dip', rationale: 'Good potential — buy on dips', suggestedAllocation: 5, timeHorizon: '6-12m' }
    : { method: 'scaled_entry', rationale: 'Speculative — small scaled entries', suggestedAllocation: 2, timeHorizon: '3-6m' };

  const rationales: Record<string, string> = {
    l1: 'Layer 1 with strong ecosystem and growing adoption.',
    l2: 'Layer 2 scaling solution capturing increasing market share.',
    defi: 'DeFi protocol with growing TVL and protocol revenue.',
    ai: 'AI narrative driving developer and investor interest.',
    infra: 'Infrastructure play powering the next generation of dApps.',
    gaming: 'Gaming/metaverse project with growing user base.',
    meme: 'Community-driven with high volatility and social momentum.',
    rwa: 'Real World Assets tokenization — bridging TradFi and DeFi.',
  };

  return {
    coinId: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    sector,
    currentPrice: coin.current_price,
    change24h: change,
    totalScore,
    pillars: {
      fundamental: Math.round(fundamental),
      momentum: Math.round(momentum),
      marketPosition,
      risk,
      narrative,
      timing: Math.round(timing),
    },
    riskLevel,
    rationale: rationales[sector] || 'Emerging crypto with growth potential.',
    buyingStrategy,
    rawMetrics: {
      price: coin.current_price,
      change24h: change,
      marketCap: null,
      volume24h: null,
    },
    computedAt: new Date().toISOString(),
  };
}

async function fetchFallbackScores(limit: number): Promise<ExplosiveCoin[]> {
  try {
    const marketCoins = await getTopMarketCoins(20);

    const scored: ExplosiveCoin[] = [];
    for (const fallback of FALLBACK_UNIVERSE) {
      const marketCoin = marketCoins.find(c => c.id === fallback.id);
      if (marketCoin) {
        scored.push(computeLocalScore(marketCoin, fallback.sector));
      }
    }

    return scored
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  } catch {
    return [];
  }
}
