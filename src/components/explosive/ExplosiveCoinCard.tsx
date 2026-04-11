import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Lock } from 'lucide-react';
import { ExplosiveScoreRing } from './ExplosiveScoreRing';
import { ExplosiveScoreBreakdown } from './ExplosiveScoreBreakdown';
import { ExplosiveBuyStrategy } from './ExplosiveBuyStrategy';
import { cn } from '@/lib/utils';
import type { ExplosiveCoin } from '@/types/explosive';

interface ExplosiveCoinCardProps {
  coin: ExplosiveCoin;
  rank: number;
  isLocked?: boolean;
}

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  conservative: { label: 'Low Risk', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  balanced: { label: 'Medium', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  high: { label: 'High Risk', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  extreme: { label: 'Extreme', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const SECTOR_BADGE: Record<string, string> = {
  defi: 'DeFi',
  l1: 'Layer 1',
  l2: 'Layer 2',
  ai: 'AI',
  gaming: 'Gaming',
  meme: 'Meme',
  rwa: 'RWA',
  infra: 'Infra',
};

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
}

export function ExplosiveCoinCard({ coin, rank, isLocked = false }: ExplosiveCoinCardProps) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_BADGE[coin.riskLevel] || RISK_BADGE.balanced;
  const change = coin.change24h;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl glass-card border border-border/20 overflow-hidden"
    >
      {/* Main Row */}
      <button
        onClick={() => !isLocked && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
      >
        {/* Rank */}
        <div className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground">#{rank}</span>
        </div>

        {/* Coin Icon */}
        {coin.image ? (
          <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
        )}

        {/* Name + Sector */}
        <div className={cn('flex-1 min-w-0', isLocked && 'blur-[4px] select-none')}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{coin.name}</p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground/60 border-border/30">
              {SECTOR_BADGE[coin.sector] || coin.sector}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground uppercase">{coin.symbol}</span>
            <span className="text-[11px] text-muted-foreground/50">{formatPrice(coin.currentPrice)}</span>
          </div>
        </div>

        {/* Score */}
        <div className={cn(isLocked && 'blur-[4px]')}>
          <ExplosiveScoreRing score={coin.totalScore} size={36} strokeWidth={3.5} />
        </div>

        {/* 24h Change */}
        <div className={cn('text-right shrink-0 w-16', isLocked && 'blur-[4px]')}>
          <p className={cn(
            'text-xs font-semibold',
            change >= 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 mt-0.5', risk.className)}>
            {risk.label}
          </Badge>
        </div>

        {/* Expand indicator */}
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground/30 shrink-0 transition-transform',
          expanded && 'rotate-180',
          isLocked && 'hidden',
        )} />

        {/* Lock overlay */}
        {isLocked && (
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40">Pro</span>
          </div>
        )}
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/10 pt-4">
              {/* AI Rationale */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">AI Rationale</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{coin.rationale}</p>
              </div>

              {/* Score Breakdown */}
              <ExplosiveScoreBreakdown pillars={coin.pillars} />

              {/* Buying Strategy */}
              <ExplosiveBuyStrategy strategy={coin.buyingStrategy} />

              {/* Key Metrics */}
              {coin.rawMetrics && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Key Metrics</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {coin.rawMetrics.tvl != null && (
                      <MetricCard label="TVL" value={`$${formatCompact(coin.rawMetrics.tvl as number)}`} />
                    )}
                    {coin.rawMetrics.volume24h != null && (
                      <MetricCard label="24h Volume" value={`$${formatCompact(coin.rawMetrics.volume24h as number)}`} />
                    )}
                    {coin.rawMetrics.devCommits != null && (
                      <MetricCard label="Dev Commits (4w)" value={String(coin.rawMetrics.devCommits)} />
                    )}
                    {coin.rawMetrics.athDistance != null && (
                      <MetricCard label="ATH Distance" value={`${(coin.rawMetrics.athDistance as number).toFixed(0)}%`} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
      <p className="text-xs font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}
