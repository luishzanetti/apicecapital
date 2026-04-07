import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { getCryptoPrice, type CoinData } from '@/services/marketData';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  BookOpen,
  Repeat,
  Wallet,
  Activity,
  Zap,
  Info,
} from 'lucide-react';

// ─── Coin descriptions ──────────────────────────────────────

const COIN_DESCRIPTIONS: Record<string, { description: string; consensus: string; useCase: string }> = {
  bitcoin: {
    description:
      'Bitcoin is the first and most widely recognized cryptocurrency, created in 2009 by the pseudonymous Satoshi Nakamoto. It introduced the concept of a decentralized digital currency secured by cryptographic proof rather than trust in a central authority.',
    consensus: 'Proof of Work (SHA-256)',
    useCase: 'Digital store of value, peer-to-peer payments',
  },
  ethereum: {
    description:
      'Ethereum is a decentralized computing platform that enables smart contracts and decentralized applications (dApps). It is the foundation for DeFi, NFTs, and the broader Web3 ecosystem.',
    consensus: 'Proof of Stake (Beacon Chain)',
    useCase: 'Smart contracts, DeFi, NFTs, dApps',
  },
  solana: {
    description:
      'Solana is a high-performance blockchain known for its speed and low transaction costs. It supports smart contracts and has become a popular platform for DeFi and consumer applications.',
    consensus: 'Proof of Stake + Proof of History',
    useCase: 'High-throughput DeFi, payments, gaming',
  },
  binancecoin: {
    description:
      'BNB is the native token of the BNB Chain ecosystem, originally launched by Binance. It is used for transaction fees, staking, and accessing services across the Binance ecosystem.',
    consensus: 'Proof of Staked Authority (PoSA)',
    useCase: 'Exchange utility, DeFi, transaction fees',
  },
  ripple: {
    description:
      'XRP is the native digital asset of the XRP Ledger, designed for fast and cost-efficient cross-border payments. It is used by financial institutions for real-time gross settlement.',
    consensus: 'XRP Ledger Consensus Protocol (RPCA)',
    useCase: 'Cross-border payments, remittances',
  },
  cardano: {
    description:
      'Cardano is a research-driven blockchain platform built with a peer-reviewed academic approach. It supports smart contracts and focuses on sustainability, scalability, and interoperability.',
    consensus: 'Ouroboros Proof of Stake',
    useCase: 'Smart contracts, identity, governance',
  },
  dogecoin: {
    description:
      'Dogecoin started as a meme cryptocurrency in 2013 but has grown into a widely recognized digital currency. It is known for its active community and use in tipping and microtransactions.',
    consensus: 'Proof of Work (Scrypt)',
    useCase: 'Tipping, microtransactions, community payments',
  },
  avalanche: {
    description:
      'Avalanche is a smart contracts platform that focuses on speed, low costs, and eco-friendliness. Its subnet architecture allows custom blockchain deployments for institutions and enterprises.',
    consensus: 'Avalanche Consensus (Snow Protocol)',
    useCase: 'DeFi, enterprise blockchains, subnets',
  },
  polkadot: {
    description:
      'Polkadot is a multi-chain network that enables different blockchains to interoperate and share security. It allows specialized blockchains (parachains) to connect and communicate seamlessly.',
    consensus: 'Nominated Proof of Stake (NPoS)',
    useCase: 'Cross-chain interoperability, parachains',
  },
  chainlink: {
    description:
      'Chainlink is a decentralized oracle network that connects smart contracts with real-world data, APIs, and payment systems. It is the most widely used oracle solution in DeFi.',
    consensus: 'Decentralized Oracle Network',
    useCase: 'Price feeds, data oracles, cross-chain',
  },
  polygon: {
    description:
      'Polygon is an Ethereum scaling solution that provides faster and cheaper transactions. It has evolved into a suite of scaling technologies including ZK-rollups and sidechains.',
    consensus: 'Proof of Stake (Heimdall + Bor)',
    useCase: 'Ethereum scaling, low-cost transactions',
  },
  litecoin: {
    description:
      'Litecoin is one of the earliest altcoins, created in 2011 as a "lighter" version of Bitcoin. It offers faster block times and has been a testing ground for Bitcoin innovations like SegWit and Lightning Network.',
    consensus: 'Proof of Work (Scrypt)',
    useCase: 'Peer-to-peer payments, store of value',
  },
  tron: {
    description:
      'TRON is a blockchain platform focused on content sharing and entertainment. It has become one of the largest networks for USDT stablecoin transfers due to its low fees.',
    consensus: 'Delegated Proof of Stake (DPoS)',
    useCase: 'Stablecoin transfers, content, entertainment',
  },
  'shiba-inu': {
    description:
      'Shiba Inu is a community-driven cryptocurrency that has expanded beyond its meme origins to include a DEX (ShibaSwap), an L2 network (Shibarium), and an expanding ecosystem.',
    consensus: 'ERC-20 on Ethereum / Shibarium L2',
    useCase: 'Community token, DeFi, metaverse',
  },
  uniswap: {
    description:
      'Uniswap is the leading decentralized exchange protocol on Ethereum, pioneering the automated market maker (AMM) model. UNI is its governance token, granting voting rights on protocol decisions.',
    consensus: 'ERC-20 Governance Token',
    useCase: 'Decentralized trading, liquidity provision, governance',
  },
};

// ─── AI insights by coin ─────────────────────────────────────

function getAIInsight(coinId: string, change24h: number): string {
  const sentiment = change24h >= 3 ? 'bullish' : change24h <= -3 ? 'bearish' : 'neutral';
  const insights: Record<string, Record<string, string>> = {
    bitcoin: {
      bullish:
        'Bitcoin is showing strong upward momentum. Historically, sustained rallies above key moving averages have preceded extended bull runs. Consider maintaining or increasing your DCA allocation.',
      bearish:
        'Bitcoin is experiencing a pullback. For long-term DCA investors, dips like these historically represent accumulation opportunities. Stay disciplined with your strategy.',
      neutral:
        'Bitcoin is consolidating in a tight range. This often precedes a significant move. Continue your DCA plan and avoid emotional decisions during low-volatility periods.',
    },
    ethereum: {
      bullish:
        'Ethereum is gaining strength, potentially driven by increased DeFi activity and network upgrades. The ETH/BTC ratio is worth monitoring for relative strength signals.',
      bearish:
        'Ethereum is under pressure. Layer-2 adoption continues to grow regardless of short-term price action. DCA through volatility has historically rewarded patient investors.',
      neutral:
        'Ethereum is trading sideways. Developer activity remains strong, and upcoming protocol improvements could be catalysts. Maintain your allocation strategy.',
    },
  };

  const coinInsights = insights[coinId];
  if (coinInsights) return coinInsights[sentiment];

  if (sentiment === 'bullish')
    return `This asset is showing positive momentum with a ${Math.abs(change24h).toFixed(1)}% gain in the last 24 hours. Monitor volume confirmation before adjusting your allocation.`;
  if (sentiment === 'bearish')
    return `This asset has declined ${Math.abs(change24h).toFixed(1)}% in the past 24 hours. For DCA strategies, temporary dips can improve your average cost basis over time.`;
  return 'This asset is trading within a stable range. Continue following your investment plan and review your allocation during your next scheduled rebalance.';
}

// ─── Chart data generator ────────────────────────────────────

type TimeRange = '24H' | '7D' | '30D';

function generateChartData(price: number, range: TimeRange) {
  const pointsByRange: Record<TimeRange, number> = { '24H': 24, '7D': 7, '30D': 30 };
  const points = pointsByRange[range];
  const series: { label: string; value: number }[] = [];

  let seed = Math.round(price * 100) + (range === '24H' ? 1 : range === '7D' ? 2 : 3);
  const rand = () => {
    seed = (seed * 48271 + 1) % 2147483647;
    return (seed % 1000) / 1000;
  };

  const volatility = range === '24H' ? 0.008 : range === '7D' ? 0.015 : 0.025;
  let value = price * (1 - volatility * 2 + rand() * volatility);

  for (let i = 0; i < points; i++) {
    const drift = (price - value) * 0.04;
    const noise = (rand() - 0.5) * price * volatility;
    value = Math.max(value * 0.9, value + drift + noise);
    series.push({
      label:
        range === '24H'
          ? `${i}h`
          : range === '7D'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7]
            : `${i + 1}`,
      value: Math.round(value * 100) / 100,
    });
  }

  series.push({ label: 'Now', value: price });
  return series;
}

// ─── Format helpers ──────────────────────────────────────────

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Fade-up animation ──────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

// ─── Component ──────────────────────────────────────────────

function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const dcaPlans = useAppStore((s) => s.dcaPlans);

  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');

  const coinId = id ?? '';

  const fetchCoin = useCallback(
    async (isRefresh = false) => {
      if (!coinId) return;
      if (isRefresh) setRefreshing(true);
      try {
        const data = await getCryptoPrice(coinId);
        if (data) setCoin(data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coinId]
  );

  useEffect(() => {
    fetchCoin();
    const interval = setInterval(() => fetchCoin(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchCoin]);

  // Chart data
  const chartData = useMemo(
    () => (coin ? generateChartData(coin.current_price, timeRange) : []),
    [coin, timeRange]
  );

  const chartDelta = useMemo(() => {
    if (chartData.length < 2) return { pct: 0, abs: 0 };
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    return {
      pct: first > 0 ? ((last - first) / first) * 100 : 0,
      abs: last - first,
    };
  }, [chartData]);

  const chartPositive = chartDelta.pct >= 0;
  const change24h = coin?.price_change_percentage_24h ?? 0;
  const isPositive = change24h >= 0;

  // User position
  const holding = useMemo(() => {
    if (!coin) return null;
    const symbol = coin.symbol.toUpperCase();
    return analytics.spotHoldings.find((h) => h.coin === symbol) ?? null;
  }, [coin, analytics.spotHoldings]);

  const allocationPct = useMemo(() => {
    if (!holding || analytics.totalEquity <= 0) return 0;
    return (holding.usdValue / analytics.totalEquity) * 100;
  }, [holding, analytics.totalEquity]);

  const activeDCAPlan = useMemo(() => {
    if (!coin) return null;
    const symbol = coin.symbol.toUpperCase();
    return dcaPlans.find(
      (p) => p.isActive && p.assets.some((a) => a.symbol === symbol)
    ) ?? null;
  }, [coin, dcaPlans]);

  // Coin info
  const coinInfo = COIN_DESCRIPTIONS[coinId] ?? {
    description: `${coin?.name ?? coinId} is a digital asset traded on major cryptocurrency exchanges.`,
    consensus: 'Varies',
    useCase: 'Digital asset',
  };

  const aiInsight = useMemo(
    () => (coin ? getAIInsight(coinId, change24h) : ''),
    [coinId, coin, change24h]
  );

  // Simulated 24h high/low
  const high24h = coin ? coin.current_price * (1 + Math.abs(change24h) / 100 + 0.005) : 0;
  const low24h = coin ? coin.current_price * (1 - Math.abs(change24h) / 100 - 0.003) : 0;

  // ─── Loading state ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-sm">Asset not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div {...fadeUp} className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{coin.name}</h1>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {coin.symbol.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => fetchCoin(true)}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </div>
      </motion.div>

      <div className="px-4 pt-5 space-y-5">
        {/* Price */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <p className="text-3xl font-bold tracking-tight md:text-4xl">{formatPrice(coin.current_price)}</p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              )}
            >
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isPositive ? '+' : ''}
              {change24h.toFixed(2)}%
            </div>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border-0 bg-black/20 shadow-xl shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Price Chart</p>
                <div className="flex items-center gap-1 rounded-full bg-secondary/40 p-1">
                  {(['24H', '7D', '30D'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                        timeRange === range
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="asset-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.24} />
                        <stop offset="100%" stopColor={chartPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), '']}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2.25}
                      fill="url(#asset-chart-gradient)"
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {chartDelta.abs >= 0 ? '+' : ''}
                  {formatPrice(Math.abs(chartDelta.abs))} ({chartDelta.pct >= 0 ? '+' : ''}
                  {chartDelta.pct.toFixed(2)}%)
                </span>
                <span>{timeRange} range</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Your Position */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border-0 bg-black/20 shadow-xl shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Your Position</p>
              </div>

              {holding ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                      <p className="text-[11px] text-muted-foreground">Holdings</p>
                      <p className="text-sm font-bold mt-1">
                        {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
                        <span className="text-muted-foreground font-normal">{coin.symbol.toUpperCase()}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                      <p className="text-[11px] text-muted-foreground">Value</p>
                      <p className="text-sm font-bold mt-1">{formatUSD(holding.usdValue)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                      <p className="text-[11px] text-muted-foreground">Allocation</p>
                      <p className="text-sm font-bold mt-1">{allocationPct.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                      <p className="text-[11px] text-muted-foreground">DCA Status</p>
                      <p className="text-sm font-bold mt-1">
                        {activeDCAPlan ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-normal text-xs">No plan</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/40">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No position yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Start building a position with Dollar-Cost Averaging
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-1"
                    onClick={() => navigate('/dca-planner')}
                  >
                    <Repeat className="mr-1.5 h-3.5 w-3.5" />
                    Start DCA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Market Stats */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-0 bg-black/20 shadow-xl shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10">
                  <BarChart3 className="h-4 w-4 text-sky-400" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Market Stats</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] text-muted-foreground">24h High</p>
                  <p className="text-sm font-bold mt-1 text-green-400">{formatPrice(high24h)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] text-muted-foreground">24h Low</p>
                  <p className="text-sm font-bold mt-1 text-red-400">{formatPrice(low24h)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] text-muted-foreground">24h Change</p>
                  <p className={cn('text-sm font-bold mt-1', isPositive ? 'text-green-400' : 'text-red-400')}>
                    {isPositive ? '+' : ''}
                    {change24h.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] text-muted-foreground">Sentiment</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-bold">
                      {change24h >= 3 ? (
                        <span className="text-green-400">Bullish</span>
                      ) : change24h <= -3 ? (
                        <span className="text-red-400">Bearish</span>
                      ) : (
                        <span className="text-amber-400">Neutral</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] text-muted-foreground">Price Range (24h)</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400"
                        style={{
                          width: `${Math.min(100, Math.max(5, ((coin.current_price - low24h) / (high24h - low24h)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatPrice(low24h)}</span>
                      <span>{formatPrice(high24h)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insight */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="border-0 bg-gradient-to-br from-primary/5 via-black/20 to-cyan-500/5 shadow-xl shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">AI Insight</p>
                  <p className="text-[10px] text-muted-foreground">Apice Intelligence</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{aiInsight}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => navigate('/home')}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Ask AI about {coin.name}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-border/30 bg-black/20 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => navigate('/dca-planner')}
            >
              <Repeat className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium">Add to DCA</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-border/30 bg-black/20 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => navigate('/portfolio')}
            >
              <Wallet className="h-5 w-5 text-sky-400" />
              <span className="text-[11px] font-medium">Portfolio</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-border/30 bg-black/20 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => navigate('/learn')}
            >
              <BookOpen className="h-5 w-5 text-amber-400" />
              <span className="text-[11px] font-medium">Learn</span>
            </Button>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <Card className="border-0 bg-black/20 shadow-xl shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
                  <Info className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  About {coin.name}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{coinInfo.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Consensus</p>
                  <p className="text-xs font-medium mt-1">{coinInfo.consensus}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Use Case</p>
                  <p className="text-xs font-medium mt-1">{coinInfo.useCase}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default AssetDetail;
