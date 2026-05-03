import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dcaAssets } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import type { CoinHolding } from '@/hooks/useExchangeBalance';

interface AssetMover {
  coin: string;
  usdValue: number;
  pnl: number;
  pnlPercent: number;
  color: string;
}

function fmt(v: number, opts?: { compact?: boolean }) {
  if (opts?.compact && Math.abs(v) >= 1000) {
    return v.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface TopMoversCardProps {
  holdings: CoinHolding[];
  isConnected: boolean;
}

export function TopMoversCard({ holdings, isConnected }: TopMoversCardProps) {
  const movers = useMemo<AssetMover[]>(() => {
    if (!isConnected) return [];
    return holdings
      .filter((h) => h.usdValue > 0 && Math.abs(h.unrealisedPnl ?? 0) > 0.01)
      .map((h) => {
        const costBasis = h.usdValue - (h.unrealisedPnl ?? 0);
        const pnlPercent = costBasis > 0 ? ((h.unrealisedPnl ?? 0) / costBasis) * 100 : 0;
        const meta = dcaAssets.find((a) => a.symbol === h.coin);
        return {
          coin: h.coin,
          usdValue: h.usdValue,
          pnl: h.unrealisedPnl ?? 0,
          pnlPercent,
          color: meta?.color ?? 'hsl(220 12% 60%)',
        };
      });
  }, [holdings, isConnected]);

  const winners = useMemo(
    () => [...movers].filter((m) => m.pnl > 0).sort((a, b) => b.pnlPercent - a.pnlPercent).slice(0, 3),
    [movers],
  );
  const losers = useMemo(
    () => [...movers].filter((m) => m.pnl < 0).sort((a, b) => a.pnlPercent - b.pnlPercent).slice(0, 3),
    [movers],
  );

  if (!isConnected || movers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MoverColumn
        title="Top Performers"
        icon={<Trophy className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))]" />}
        accent="text-[hsl(var(--apice-emerald))]"
        empty="No winners yet"
        items={winners}
        positive
      />
      <MoverColumn
        title="Underperformers"
        icon={<Flame className="w-3.5 h-3.5 text-red-400" />}
        accent="text-red-400"
        empty="No losers — nice work"
        items={losers}
        positive={false}
      />
    </div>
  );
}

interface MoverColumnProps {
  title: string;
  icon: React.ReactNode;
  accent: string;
  empty: string;
  items: AssetMover[];
  positive: boolean;
}

function MoverColumn({ title, icon, empty, items, positive }: MoverColumnProps) {
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            {title}
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{empty}</p>
        ) : (
          <div className="space-y-2">
            {items.map((m, i) => (
              <motion.div
                key={m.coin}
                initial={{ opacity: 0, x: positive ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${m.color}20`,
                      color: m.color,
                    }}
                  >
                    <span className="text-[10px] font-bold">{m.coin.slice(0, 3)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{m.coin}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {fmt(m.usdValue, { compact: true })}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-bold tabular-nums',
                    positive ? 'text-emerald-400' : 'text-red-400',
                  )}>
                    <TrendIcon className="h-2.5 w-2.5" />
                    {positive ? '+' : ''}{m.pnlPercent.toFixed(1)}%
                  </div>
                  <p className={cn(
                    'text-[10px] tabular-nums',
                    positive ? 'text-emerald-400/70' : 'text-red-400/70',
                  )}>
                    {positive ? '+' : ''}{fmt(m.pnl, { compact: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
