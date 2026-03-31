import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountOverviewCard() {
  const analytics = usePortfolioAnalytics();

  if (!analytics.isConnected) return null;

  const {
    totalEquity,
    fundingBalance,
    grandTotal,
    totalUnrealizedPnL,
    pnlPercent,
    totalAvailableBalance,
  } = analytics;

  const fmt = (v: number) =>
    `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pnlPositive = totalUnrealizedPnL >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Account Overview</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Unified Account */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Unified Account</p>
              <p className="text-sm font-bold">{fmt(totalEquity)}</p>
            </div>

            {/* Funding Account */}
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
              <p className="text-[11px] text-amber-400 uppercase tracking-wider mb-1">Funding Account</p>
              <p className="text-sm font-bold">{fmt(fundingBalance)}</p>
            </div>

            {/* Grand Total */}
            <div className="rounded-xl bg-secondary/40 border border-border/30 p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
              <p className="text-sm font-bold">{fmt(grandTotal)}</p>
            </div>

            {/* Unrealized P&L */}
            <div className={cn(
              'rounded-xl border p-3',
              pnlPositive ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'
            )}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Unrealized P&L</p>
              <div className="flex items-center gap-1">
                {pnlPositive ? (
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span className={cn('text-sm font-bold', pnlPositive ? 'text-green-400' : 'text-red-400')}>
                  {pnlPositive ? '+' : ''}{fmt(totalUnrealizedPnL)}
                </span>
              </div>
              <p className={cn('text-[11px] mt-0.5', pnlPositive ? 'text-green-400/70' : 'text-red-400/70')}>
                {pnlPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
              </p>
            </div>

            {/* Available Balance */}
            <div className="rounded-xl bg-secondary/40 border border-border/30 p-3 col-span-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-sm font-bold">{fmt(totalAvailableBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
