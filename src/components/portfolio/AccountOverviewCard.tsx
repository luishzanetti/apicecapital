import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { useTranslation } from '@/hooks/useTranslation';
import { Layers, ArrowUpRight, ArrowDownRight, ShieldCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountOverviewCard() {
  const analytics = usePortfolioAnalytics();
  const { language } = useTranslation();

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            title: analytics.hasLiveBalance ? 'Visão das contas' : 'Snapshot do portfólio',
            primary: analytics.hasLiveBalance ? 'Saldo spot' : 'Valor do portfólio',
            secondary: analytics.hasLiveBalance ? 'Margem futuros' : 'Capital investido',
            tertiary: analytics.hasLiveBalance ? 'Funding' : 'Reserva em stablecoins',
            pnl: analytics.hasLiveBalance ? 'P&L em aberto' : 'P&L estimado',
            footer: analytics.hasLiveBalance ? 'Total consolidado' : 'Base estimada disponível',
          }
        : {
            title: analytics.hasLiveBalance ? 'Account overview' : 'Portfolio snapshot',
            primary: analytics.hasLiveBalance ? 'Spot balance' : 'Portfolio value',
            secondary: analytics.hasLiveBalance ? 'Futures margin' : 'Capital invested',
            tertiary: analytics.hasLiveBalance ? 'Funding' : 'Stablecoin reserve',
            pnl: analytics.hasLiveBalance ? 'Open P&L' : 'Estimated P&L',
            footer: analytics.hasLiveBalance ? 'Grand total' : 'Estimated liquid base',
          },
    [analytics.hasLiveBalance, language]
  );

  if (!analytics.isConnected) return null;

  const fmt = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pnlPositive = analytics.totalUnrealizedPnL >= 0;
  const secondaryValue = analytics.hasLiveBalance ? analytics.futuresBalance : analytics.totalCostBasis;
  const tertiaryValue = analytics.hasLiveBalance ? analytics.fundingBalance : analytics.stablecoinsValue;
  const footerValue = analytics.hasLiveBalance
    ? analytics.grandTotal
    : Math.max(analytics.totalAvailableBalance, analytics.stablecoinsValue);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{copy.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{copy.primary}</p>
              <p className="text-sm font-bold">{fmt(analytics.spotBalance)}</p>
            </div>

            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-amber-400">{copy.secondary}</p>
              <p className="text-sm font-bold">{fmt(secondaryValue)}</p>
            </div>

            <div className="rounded-xl border border-border/30 bg-secondary/40 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                {analytics.hasLiveBalance ? (
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{copy.tertiary}</p>
              </div>
              <p className="text-sm font-bold">{fmt(tertiaryValue)}</p>
            </div>

            <div
              className={cn(
                'rounded-xl border p-3',
                pnlPositive ? 'border-green-500/10 bg-green-500/5' : 'border-red-500/10 bg-red-500/5'
              )}
            >
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{copy.pnl}</p>
              <div className="flex items-center gap-1">
                {pnlPositive ? (
                  <ArrowUpRight className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                )}
                <span className={cn('text-sm font-bold', pnlPositive ? 'text-green-400' : 'text-red-400')}>
                  {pnlPositive ? '+' : ''}
                  {fmt(analytics.totalUnrealizedPnL)}
                </span>
              </div>
              <p className={cn('mt-0.5 text-[11px]', pnlPositive ? 'text-green-400/70' : 'text-red-400/70')}>
                {pnlPositive ? '+' : ''}
                {analytics.pnlPercent.toFixed(2)}%
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-border/30 bg-secondary/40 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{copy.footer}</p>
              <p className="text-sm font-bold">{fmt(footerValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
