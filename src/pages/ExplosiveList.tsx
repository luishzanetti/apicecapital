import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExplosivePicks } from '@/hooks/useExplosivePicks';
import { ExplosiveCoinCard } from '@/components/explosive/ExplosiveCoinCard';
import { ExplosiveFilters } from '@/components/explosive/ExplosiveFilters';
import {
  ArrowLeft,
  Flame,
  Search,
  Lock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { ExplosiveFilterSector, ExplosiveSortKey, ExplosiveCoin } from '@/types/explosive';

// ─── Skeleton ───────────────────────────────────────────────

function CoinSkeleton() {
  return (
    <div className="rounded-2xl glass-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-secondary" />
        <div className="w-10 h-10 rounded-full bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded w-28" />
          <div className="h-3 bg-secondary rounded w-16" />
        </div>
        <div className="w-9 h-9 rounded-full bg-secondary" />
        <div className="space-y-2 text-right">
          <div className="h-4 bg-secondary rounded w-16 ml-auto" />
          <div className="h-3 bg-secondary rounded w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Sort logic ─────────────────────────────────────────────

function sortCoins(coins: ExplosiveCoin[], key: ExplosiveSortKey): ExplosiveCoin[] {
  const sorted = [...coins];
  switch (key) {
    case 'score':
      return sorted.sort((a, b) => b.totalScore - a.totalScore);
    case 'risk': {
      const riskOrder: Record<string, number> = { conservative: 0, balanced: 1, high: 2, extreme: 3 };
      return sorted.sort((a, b) => (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2));
    }
    case 'change24h':
      return sorted.sort((a, b) => b.change24h - a.change24h);
    case 'marketCap':
      return sorted.sort((a, b) => {
        const mcA = (a.rawMetrics?.marketCap as number) || 0;
        const mcB = (b.rawMetrics?.marketCap as number) || 0;
        return mcB - mcA;
      });
    default:
      return sorted;
  }
}

// ─── Component ──────────────────────────────────────────────

export default function ExplosiveList() {
  const navigate = useNavigate();
  const { allCoins, isLoading, isPro, refetch } = useExplosivePicks(30);

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<ExplosiveFilterSector>('all');
  const [sort, setSort] = useState<ExplosiveSortKey>('score');

  const filteredCoins = useMemo(() => {
    let result = allCoins;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
      );
    }

    // Sector filter
    if (sector !== 'all') {
      result = result.filter(c => c.sector === sector);
    }

    // Sort
    return sortCoins(result, sort);
  }, [allCoins, search, sector, sort]);

  const FREE_LIMIT = 5;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Explosive Picks</h1>
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground">AI-scored cryptos with real fundamentals</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="relative overflow-hidden bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-300 border-orange-500/20 text-[10px] px-2 py-0.5"
            >
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              AI Powered
              <span className="absolute inset-0 shimmer-sweep" />
            </Badge>
            <button
              onClick={() => refetch()}
              className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
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

        {/* Filters & Sort */}
        <ExplosiveFilters
          activeSector={sector}
          onSectorChange={setSector}
          activeSort={sort}
          onSortChange={setSort}
        />

        {/* Results count */}
        {!isLoading && (
          <p className="text-[11px] text-muted-foreground/50">
            {filteredCoins.length} coin{filteredCoins.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Coin list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CoinSkeleton key={i} />
            ))}
          </div>
        ) : filteredCoins.length === 0 ? (
          <div className="text-center py-16">
            <Flame className="w-8 h-8 text-orange-400/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search.trim() || sector !== 'all'
                ? 'No coins match your filters.'
                : 'No explosive picks available yet.'}
            </p>
            {(search.trim() || sector !== 'all') && (
              <button
                onClick={() => { setSearch(''); setSector('all'); }}
                className="text-xs text-primary font-medium mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCoins.map((coin, index) => {
              const isLocked = !isPro && index >= FREE_LIMIT;
              return (
                <ExplosiveCoinCard
                  key={coin.coinId}
                  coin={coin}
                  rank={index + 1}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {!isPro && !isLoading && filteredCoins.length > FREE_LIMIT && (
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
              Unlock all picks with Pro
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
