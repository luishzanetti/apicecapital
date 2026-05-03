import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dcaAssets } from '@/data/sampleData';
import type { CoinHolding } from '@/hooks/useExchangeBalance';
import { cn } from '@/lib/utils';

type SortKey = 'value' | 'pnl' | 'roi' | 'allocation';
type SortDir = 'asc' | 'desc';

interface AssetRow {
  coin: string;
  balance: number;
  usdValue: number;
  costBasis: number;
  pnl: number;
  roi: number;
  allocation: number;
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

interface AssetROITableProps {
  holdings: CoinHolding[];
  totalValue: number;
}

export function AssetROITable({ holdings, totalValue }: AssetROITableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo<AssetRow[]>(() => {
    return holdings
      .filter((h) => h.usdValue > 0)
      .map((h) => {
        const pnl = h.unrealisedPnl ?? 0;
        const costBasis = h.usdValue - pnl;
        const roi = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
        const allocation = totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0;
        const meta = dcaAssets.find((a) => a.symbol === h.coin);
        return {
          coin: h.coin,
          balance: h.balance,
          usdValue: h.usdValue,
          costBasis,
          pnl,
          roi,
          allocation,
          color: meta?.color ?? 'hsl(220 12% 60%)',
        };
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortDir === 'desc' ? bv - av : av - bv;
      });
  }, [holdings, totalValue, sortKey, sortDir]);

  if (rows.length === 0) return null;

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortBtn = ({ id, label }: { id: SortKey; label: string }) => {
    const active = sortKey === id;
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        className={cn(
          'inline-flex items-center gap-0.5 transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground/80',
        )}
      >
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
      </button>
    );
  };

  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const portfolioRoi = (() => {
    const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
    return totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  })();

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Holdings ROI
              </h3>
              <p className="text-[11px] text-muted-foreground">{rows.length} positions · sortable</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-sm font-bold tabular-nums',
              portfolioRoi >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi.toFixed(2)}%
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Portfolio ROI
            </p>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold border-b border-white/[0.06]">
          <div className="col-span-3 text-muted-foreground">Asset</div>
          <div className="col-span-3 text-right"><SortBtn id="value" label="Value" /></div>
          <div className="col-span-3 text-right"><SortBtn id="pnl" label="P&L" /></div>
          <div className="col-span-2 text-right"><SortBtn id="roi" label="ROI" /></div>
          <div className="col-span-1 text-right"><SortBtn id="allocation" label="%" /></div>
        </div>

        {/* Rows */}
        <AnimatePresence initial={false}>
          <div>
            {rows.map((r, i) => {
              const positive = r.pnl >= 0;
              return (
                <motion.div
                  key={r.coin}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-12 gap-2 px-2 py-2.5 border-b border-white/[0.03] last:border-0 items-center"
                >
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${r.color}22`, color: r.color }}
                    >
                      <span className="text-[9px] font-bold">{r.coin.slice(0, 3)}</span>
                    </div>
                    <span className="text-xs font-semibold truncate">{r.coin}</span>
                  </div>

                  <div className="col-span-3 text-right">
                    <p className="text-xs font-bold tabular-nums">{fmt(r.usdValue, { compact: true })}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {r.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>

                  <div className="col-span-3 text-right">
                    <p className={cn(
                      'text-xs font-bold tabular-nums inline-flex items-center gap-0.5 justify-end',
                      positive ? 'text-emerald-400' : 'text-red-400',
                    )}>
                      {positive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                      {fmt(Math.abs(r.pnl), { compact: true })}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      vs {fmt(r.costBasis, { compact: true })}
                    </p>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={cn(
                      'inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums',
                      positive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400',
                    )}>
                      {positive ? '+' : ''}{r.roi.toFixed(1)}%
                    </span>
                  </div>

                  <div className="col-span-1 text-right">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {r.allocation.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
