import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Sparkles, ChevronRight, RefreshCw, Lock } from 'lucide-react';
import { useExplosivePicks } from '@/hooks/useExplosivePicks';
import { ExplosiveScoreRing } from '@/components/explosive/ExplosiveScoreRing';
import { cn } from '@/lib/utils';

// ─── Risk dot colors ────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  conservative: 'bg-emerald-400',
  balanced: 'bg-blue-400',
  high: 'bg-amber-400',
  extreme: 'bg-red-400',
};

const RISK_LABELS: Record<string, string> = {
  conservative: 'Low',
  balanced: 'Med',
  high: 'High',
  extreme: 'Ext',
};

// ─── Skeleton ───────────────────────────────────────────────────

function PickSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 animate-pulse">
      <div className="w-6 h-6 rounded-lg bg-secondary" />
      <div className="w-8 h-8 rounded-full bg-secondary" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-secondary rounded w-20" />
        <div className="h-2.5 bg-secondary rounded w-14" />
      </div>
      <div className="w-7 h-7 rounded-full bg-secondary" />
    </div>
  );
}

// ─── Format ─────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

// ─── Widget ─────────────────────────────────────────────────────

export function ExplosivePicksWidget() {
  const navigate = useNavigate();
  const { coins, isLoading, error, refetch, isPro } = useExplosivePicks(5);
  const visibleCoins = isPro ? coins.slice(0, 5) : coins.slice(0, 5);
  const freeLimit = 2;

  if (error && !coins.length) {
    return (
      <Card className="border-none glass-card overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-400/30" />
        <CardContent className="py-6 flex flex-col items-center gap-2 text-center">
          <Flame className="w-6 h-6 text-orange-400/50" />
          <p className="text-sm text-muted-foreground">Unable to load explosive picks</p>
          <button onClick={() => refetch()} className="text-xs text-primary font-medium">
            Tap to retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && !coins.length) {
    return (
      <Card className="border-none glass-card overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-400/20" />
        <CardContent className="py-8 text-center">
          <Flame className="w-8 h-8 text-orange-400/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No explosive picks right now</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Our AI is analyzing the market. Check back soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none glass-card overflow-hidden shadow-[0_0_40px_-12px_hsl(30_90%_50%/0.12)]">
      {/* Gradient accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-bold text-foreground">Explosive Picks</span>
            <Badge
              variant="secondary"
              className="relative overflow-hidden bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-300 border-orange-500/20 text-[10px] px-1.5 py-0"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              AI
              {/* Shimmer overlay */}
              <span className="absolute inset-0 shimmer-sweep" />
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={() => navigate('/explosive-list')}
          >
            View All <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>

        {/* Picks List */}
        <div className="space-y-0">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <PickSkeleton key={i} />)
          ) : (
            visibleCoins.map((coin, idx) => {
              const isLocked = !isPro && idx >= freeLimit;
              return (
                <motion.button
                  key={coin.coinId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'w-full flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-secondary/30 rounded-lg px-1 -mx-1',
                    idx < visibleCoins.length - 1 && 'border-b border-border/10',
                  )}
                  onClick={() => !isLocked && navigate('/explosive-list')}
                >
                  {/* Rank */}
                  <div className="w-6 h-6 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0 relative">
                    <span className="text-[10px] font-bold text-muted-foreground">#{idx + 1}</span>
                    {/* Pulsing dot for #1 */}
                    {idx === 0 && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>

                  {/* Coin Icon */}
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                  )}

                  {/* Name + Symbol */}
                  <div className={cn('flex-1 min-w-0', isLocked && 'blur-[4px] select-none')}>
                    <p className="text-sm font-semibold text-foreground truncate">{coin.name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">{coin.symbol}</p>
                  </div>

                  {/* Score Ring */}
                  <div className={cn(isLocked && 'blur-[4px]')}>
                    <ExplosiveScoreRing score={coin.totalScore} />
                  </div>

                  {/* Risk Dot */}
                  <div className={cn('flex items-center gap-1', isLocked && 'blur-[4px]')}>
                    <div className={cn('w-2 h-2 rounded-full', RISK_COLORS[coin.riskLevel])} />
                    <span className="text-[9px] text-muted-foreground/60">{RISK_LABELS[coin.riskLevel]}</span>
                  </div>

                  {/* Lock overlay for free users */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </div>

        {/* Upgrade CTA for free users */}
        {!isPro && coins.length > freeLimit && (
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-xs text-orange-300 font-medium hover:from-orange-500/20 hover:to-amber-500/20 transition-all"
          >
            <Lock className="w-3 h-3 inline mr-1.5 -mt-0.5" />
            Unlock all picks with Pro
          </button>
        )}

        {/* Footer */}
        {!isLoading && coins.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground/40">
              Updated {timeAgo(coins[0].computedAt)}
            </span>
            <button
              onClick={() => refetch()}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
