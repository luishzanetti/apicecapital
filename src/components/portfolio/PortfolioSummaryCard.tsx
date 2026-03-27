import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet, RefreshCw, TrendingUp, TrendingDown, Link2,
  ChevronRight, Eye, EyeOff, ArrowUpRight, ArrowDownRight,
  Zap, PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  Stablecoins: '#26A17B',
  Altcoins: '#8B5CF6',
};

function AllocationRing({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
      <circle cx="46" cy="46" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
      {segments.filter(s => s.pct > 0).map((seg) => {
        const dashLen = (seg.pct / 100) * circumference;
        const dashGap = circumference - dashLen;
        const el = (
          <circle
            key={seg.label}
            cx="46"
            cy="46"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform="rotate(-90 46 46)"
            className="transition-all duration-700"
          />
        );
        offset += dashLen;
        return el;
      })}
    </svg>
  );
}

function SummarySkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-5">
          <Skeleton className="w-[92px] h-[92px] rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioSummaryCard() {
  const navigate = useNavigate();
  const analytics = usePortfolioAnalytics();
  const { refresh, isRefreshing } = useExchangeBalance();
  const [hideBalance, setHideBalance] = useState(false);

  if (analytics.isLoading) return <SummarySkeleton />;

  if (!analytics.isConnected) {
    return (
      <Card className="border-dashed border-primary/30 overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Link2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold mb-1">Connect Your Exchange</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                Link your Bybit account to track your real portfolio, see live balances, and get performance analytics.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/settings')}>
              Connect Bybit
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { grandTotal, totalEquity, fundingBalance, totalUnrealizedPnL, pnlPercent } = analytics;
  const pnlPositive = totalUnrealizedPnL >= 0;
  const hasFunding = fundingBalance > 0;

  const segments = [
    { label: 'BTC', pct: analytics.btcPct, color: CATEGORY_COLORS.BTC },
    { label: 'ETH', pct: analytics.ethPct, color: CATEGORY_COLORS.ETH },
    { label: 'Stablecoins', pct: analytics.stablecoinsPct, color: CATEGORY_COLORS.Stablecoins },
    { label: 'Altcoins', pct: analytics.altcoinsPct, color: CATEGORY_COLORS.Altcoins },
  ];

  const fmt = (v: number) => hideBalance ? '****' : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-primary/10">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, hsl(var(--primary)), transparent 70%)' }}
        />
        <CardContent className="pt-5 pb-5 space-y-4 relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Portfolio</span>
            </div>
            <div className="flex items-center gap-2">
              {analytics.isTestnet && (
                <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400">TESTNET</Badge>
              )}
              <Badge variant="outline" className="text-[8px] gap-1 border-green-500/30 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
              <button onClick={() => setHideBalance(!hideBalance)} className="text-muted-foreground hover:text-foreground transition-colors">
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={refresh} disabled={isRefreshing} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Main: Ring + Balance */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <AllocationRing segments={segments} />
              <div className="absolute inset-0 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-muted-foreground/40" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Total Balance</p>
              <p className="text-3xl font-bold tracking-tight">{fmt(grandTotal)}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md',
                  pnlPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                )}>
                  {pnlPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {hideBalance ? '***' : `${pnlPositive ? '+' : ''}${pnlPercent.toFixed(2)}%`}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {hideBalance ? '****' : `${pnlPositive ? '+' : ''}$${Math.abs(totalUnrealizedPnL).toFixed(2)}`} P&L
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {analytics.spotCount} assets · {analytics.activeDCAPlans} DCA plans
              </p>
            </div>
          </div>

          {/* Account Breakdown: Unified + Funding */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[9px] text-muted-foreground font-medium uppercase">Unified (Spot)</span>
              </div>
              <p className="text-sm font-bold">{fmt(totalEquity)}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-[9px] text-muted-foreground font-medium uppercase">Funding</span>
              </div>
              <p className="text-sm font-bold">{hasFunding ? fmt(fundingBalance) : <span className="text-muted-foreground">$0.00</span>}</p>
            </div>
          </div>

          {/* Funding Holdings Detail (if any) */}
          {hasFunding && analytics.fundingHoldings.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">Funding Assets</p>
              <div className="flex flex-wrap gap-1.5">
                {analytics.fundingHoldings.slice(0, 6).map((fh) => (
                  <div key={fh.coin} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <span className="text-[10px] font-semibold">{fh.coin}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {hideBalance ? '***' : fh.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="text-center p-2 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-[9px] text-muted-foreground font-medium">{seg.label}</span>
                </div>
                <p className="text-xs font-bold">{seg.pct.toFixed(1)}%</p>
              </div>
            ))}
          </div>

          {/* Quick Stats Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="text-center flex-1">
              <p className="text-[9px] text-muted-foreground uppercase">Available</p>
              <p className="text-xs font-semibold">{fmt(analytics.totalAvailableBalance)}</p>
            </div>
            <div className="w-px h-6 bg-border/30" />
            <div className="text-center flex-1">
              <p className="text-[9px] text-muted-foreground uppercase">DCA/mo</p>
              <p className="text-xs font-semibold">
                {hideBalance ? '****' : `$${analytics.totalDCACommittedMonthly.toLocaleString()}`}
              </p>
            </div>
            <div className="w-px h-6 bg-border/30" />
            <div className="text-center flex-1">
              <p className="text-[9px] text-muted-foreground uppercase">DCA Invested</p>
              <p className="text-xs font-semibold">
                {hideBalance ? '****' : `$${analytics.totalDCAInvested.toLocaleString()}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
