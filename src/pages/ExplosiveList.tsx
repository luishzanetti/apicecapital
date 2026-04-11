import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { getTopMarketCoins, type CoinData } from '@/services/marketData';
import {
  ArrowLeft,
  Flame,
  Search,
  TrendingUp,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────

function getMomentumBadge(change24h: number): { label: string; color: string } | null {
  if (change24h > 5) return { label: 'Hot', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  if (change24h > 2) return { label: 'Rising', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
  return null;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

// ─── Skeleton ───────────────────────────────────────────────

function CoinSkeleton() {
  return (
    <div className="rounded-2xl glass-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded w-24" />
          <div className="h-3 bg-secondary rounded w-16" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 bg-secondary rounded w-20 ml-auto" />
          <div className="h-3 bg-secondary rounded w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function ExplosiveList() {
  const navigate = useNavigate();
  const subscription = useAppStore((s) => s.subscription);

  const tier = subscription?.tier ?? 'free';
  const isFree = tier === 'free';

  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch top 20 coins
  useEffect(() => {
    let cancelled = false;

    async function fetchCoins() {
      setLoading(true);
      try {
        const data = await getTopMarketCoins(20);
        if (!cancelled) setCoins(data);
      } catch {
        // Silently fail, show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCoins();
    return () => { cancelled = true; };
  }, []);

  // Filter by search
  const filtered = coins.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
  });

  // Determine visible count
  const FREE_LIMIT = 10;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Explosive List</h1>
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground">Top momentum coins</p>
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            Updated daily
          </Badge>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-5 space-y-4"
      >
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Coin list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <CoinSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No coins match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((coin, index) => {
              const rank = index + 1;
              const isGated = isFree && rank > FREE_LIMIT;
              const momentum = getMomentumBadge(coin.price_change_percentage_24h);
              const isPositive = coin.price_change_percentage_24h >= 0;

              return (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.6) }}
                  className="relative"
                >
                  {/* Gated overlay */}
                  {isGated && (
                    <div className="absolute inset-0 z-10 rounded-2xl backdrop-blur-md bg-background/60 flex flex-col items-center justify-center gap-2">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">Upgrade to Pro</p>
                    </div>
                  )}

                  <button
                    onClick={() => !isGated && navigate(`/asset/${coin.id}`)}
                    disabled={isGated}
                    className="w-full rounded-2xl glass-card p-4 text-left transition-all hover:border-primary/30 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-muted-foreground">#{rank}</span>
                      </div>

                      {/* Coin icon */}
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-10 h-10 rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-bold">{coin.symbol.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}

                      {/* Name + symbol */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{coin.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                      </div>

                      {/* Price + change */}
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatPrice(coin.current_price)}</p>
                        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
                          isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Momentum badge */}
                    {momentum && (
                      <div className="mt-3">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${momentum.color}`}>
                          {momentum.label === 'Hot' && <Flame className="w-3 h-3 mr-1" />}
                          {momentum.label === 'Rising' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {momentum.label}
                        </Badge>
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {isFree && !loading && filtered.length > FREE_LIMIT && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <Button
              variant="premium"
              onClick={() => navigate('/upgrade')}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Unlock all 20 coins with Pro
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
