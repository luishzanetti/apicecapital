import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dcaAssets } from '@/data/sampleData';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { cn } from '@/lib/utils';

interface AssetBreakdown {
  symbol: string;
  totalUsdt: number;
  totalQuantity: number;
  buyCount: number;
  avgBuyPrice: number | null;
  share: number;
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

function fmtPrice(v: number) {
  if (v === 0) return '—';
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: v < 1 ? 4 : 2,
    maximumFractionDigits: v < 1 ? 6 : 2,
  });
}

interface DCAByAssetCardProps {
  executions: DCAExecution[];
}

export function DCAByAssetCard({ executions }: DCAByAssetCardProps) {
  const breakdown = useMemo<AssetBreakdown[]>(() => {
    const grouped = new Map<string, {
      usdt: number;
      qty: number;
      count: number;
      priceWeighted: number;
      priceWeightedDenom: number;
    }>();

    for (const exec of executions) {
      if (exec.status !== 'success') continue;
      const existing = grouped.get(exec.asset_symbol) ?? {
        usdt: 0,
        qty: 0,
        count: 0,
        priceWeighted: 0,
        priceWeightedDenom: 0,
      };
      existing.usdt += exec.amount_usdt ?? 0;
      existing.qty += exec.quantity ?? 0;
      existing.count += 1;
      // VWAP-style: weighted avg buy price by USDT spent
      if (exec.price && exec.amount_usdt) {
        existing.priceWeighted += exec.price * exec.amount_usdt;
        existing.priceWeightedDenom += exec.amount_usdt;
      }
      grouped.set(exec.asset_symbol, existing);
    }

    const totalUsdt = Array.from(grouped.values()).reduce((s, v) => s + v.usdt, 0);

    return Array.from(grouped.entries())
      .map(([symbol, s]) => {
        const meta = dcaAssets.find((a) => a.symbol === symbol);
        const avgPrice = s.priceWeightedDenom > 0 ? s.priceWeighted / s.priceWeightedDenom : null;
        return {
          symbol,
          totalUsdt: s.usdt,
          totalQuantity: s.qty,
          buyCount: s.count,
          avgBuyPrice: avgPrice,
          share: totalUsdt > 0 ? (s.usdt / totalUsdt) * 100 : 0,
          color: meta?.color ?? 'hsl(220 12% 60%)',
        };
      })
      .sort((a, b) => b.totalUsdt - a.totalUsdt);
  }, [executions]);

  if (breakdown.length === 0) return null;

  const totalUsdt = breakdown.reduce((s, b) => s + b.totalUsdt, 0);
  const totalBuys = breakdown.reduce((s, b) => s + b.buyCount, 0);

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                DCA Distribution
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {breakdown.length} assets · {totalBuys} successful buys
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{fmt(totalUsdt, { compact: true })}</p>
            <p className="text-[11px] text-muted-foreground">total deployed</p>
          </div>
        </div>

        {/* Stacked share bar */}
        <div className="mb-4">
          <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
            {breakdown.map((b, i) => (
              <motion.div
                key={b.symbol}
                initial={{ width: 0 }}
                animate={{ width: `${b.share}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                style={{ backgroundColor: b.color }}
                className="h-full"
                title={`${b.symbol} · ${b.share.toFixed(1)}% · ${fmt(b.totalUsdt)}`}
              />
            ))}
          </div>
        </div>

        {/* Per-asset rows with VWAP */}
        <div className="space-y-2">
          {breakdown.map((b, i) => (
            <motion.div
              key={b.symbol}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-12 gap-2 items-center px-1 py-1.5 rounded-lg hover:bg-white/[0.02]"
            >
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${b.color}22`, color: b.color }}
                >
                  <span className="text-[9px] font-bold">{b.symbol.slice(0, 3)}</span>
                </div>
                <span className="text-xs font-semibold truncate">{b.symbol}</span>
              </div>

              <div className="col-span-3 text-right">
                <p className="text-xs font-bold tabular-nums">{fmt(b.totalUsdt, { compact: true })}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{b.share.toFixed(1)}%</p>
              </div>

              <div className="col-span-3 text-right">
                <div className="inline-flex items-center gap-0.5 text-[11px] font-bold text-foreground">
                  <TrendingUp className="h-2.5 w-2.5 text-emerald-400/70" />
                  {fmtPrice(b.avgBuyPrice ?? 0)}
                </div>
                <p className="text-[10px] text-muted-foreground">VWAP</p>
              </div>

              <div className="col-span-3 text-right">
                <p className="text-xs font-bold tabular-nums">{b.buyCount}</p>
                <p className="text-[10px] text-muted-foreground">
                  {b.totalQuantity > 0
                    ? `${b.totalQuantity.toLocaleString('en-US', { maximumFractionDigits: 4 })} qty`
                    : 'buys'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
