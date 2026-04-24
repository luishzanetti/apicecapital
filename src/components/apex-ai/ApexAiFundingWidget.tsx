import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowUpRight, ArrowDownRight, Info, TrendingUp } from 'lucide-react';
import type { ApexAiSymbolIntelligence } from '@/types/apexAi';

/**
 * ApexAiFundingWidget — shows funding rate opportunities across tracked
 * symbols. Highlights:
 *   - Top positive funding (longs pay shorts) → SHORT capture
 *   - Top negative funding (shorts pay longs) → LONG capture
 *   - Annualized APR estimate
 *
 * Apex AI operates hedge mode, so the bot inherently captures funding on
 * whichever leg is favorable — this widget makes that edge visible to the
 * user and flags high-APR opportunities.
 */
export function ApexAiFundingWidget({
  intelligenceMap,
}: {
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>;
}) {
  const ranked = useMemo(() => rankByFunding(intelligenceMap), [intelligenceMap]);

  if (ranked.all.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold">Funding intelligence</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Collecting funding rate data from exchanges. Next update in a few minutes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bestPositive = ranked.all.filter((r) => r.funding_rate > 0).sort((a, b) => b.funding_rate - a.funding_rate).slice(0, 3);
  const bestNegative = ranked.all.filter((r) => r.funding_rate < 0).sort((a, b) => a.funding_rate - b.funding_rate).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Funding intelligence</p>
                <p className="text-[11px] text-muted-foreground">
                  Hedge mode earns funding on the favorable leg automatically
                </p>
              </div>
            </div>
          </div>

          {ranked.avg_apr_pct !== 0 && (
            <div className="flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                  Avg funding yield
                </span>
              </div>
              <span className="text-sm font-bold text-amber-400">
                {ranked.avg_apr_pct > 0 ? '+' : ''}
                {ranked.avg_apr_pct.toFixed(1)}% APR
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FundingList
              title="Shorts earn (+ funding)"
              icon={ArrowDownRight}
              rows={bestPositive}
              tone="danger"
              emptyText="No positive funding right now"
            />
            <FundingList
              title="Longs earn (− funding)"
              icon={ArrowUpRight}
              rows={bestNegative}
              tone="success"
              emptyText="No negative funding right now"
            />
          </div>

          <div className="flex items-start gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p>
              Funding is paid every 8 hours. APR ≈ rate × 3 × 365. In hedge
              mode, the bot's favorable leg collects funding passively.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface FundingRow {
  symbol: string;
  funding_rate: number;
  apr_pct: number;
}

interface RankedFunding {
  all: FundingRow[];
  avg_apr_pct: number;
}

function rankByFunding(map: Record<string, ApexAiSymbolIntelligence>): RankedFunding {
  const rows: FundingRow[] = [];
  let totalApr = 0;
  let count = 0;

  for (const [symbol, intel] of Object.entries(map)) {
    if (intel.funding_rate == null) continue;
    const rate = Number(intel.funding_rate);
    const apr = rate * 3 * 365 * 100;
    rows.push({ symbol, funding_rate: rate, apr_pct: apr });
    totalApr += apr;
    count++;
  }

  return {
    all: rows,
    avg_apr_pct: count > 0 ? totalApr / count : 0,
  };
}

function FundingList({
  title,
  icon: Icon,
  rows,
  tone,
  emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: FundingRow[];
  tone: 'success' | 'danger';
  emptyText: string;
}) {
  const colorClass = tone === 'success' ? 'text-emerald-400' : 'text-rose-400';
  const bgClass = tone === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${colorClass}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {title}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div
              key={r.symbol}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md ${bgClass}`}
            >
              <span className="text-xs font-semibold">{r.symbol.replace('USDT', '')}</span>
              <div className="text-right">
                <span className={`text-xs font-bold ${colorClass}`}>
                  {r.funding_rate > 0 ? '+' : ''}
                  {(r.funding_rate * 100).toFixed(4)}%
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">
                  ({r.apr_pct > 0 ? '+' : ''}
                  {r.apr_pct.toFixed(1)}% APR)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
