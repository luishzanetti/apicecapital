import type { StrategyPerformance } from '@/hooks/useLeveragedTrading';

const STRATEGY_COLORS: Record<string, string> = {
  grid: 'bg-blue-500',
  trend_following: 'bg-green-500',
  mean_reversion: 'bg-purple-500',
  funding_arb: 'bg-amber-500',
  ai_signal: 'bg-cyan-500',
};

const STRATEGY_LABELS: Record<string, string> = {
  grid: 'Grid',
  trend_following: 'Trend',
  mean_reversion: 'Mean Rev',
  funding_arb: 'Arb',
  ai_signal: 'AI',
};

function formatUsd(v: number) {
  return v < 0
    ? `-$${Math.abs(v).toFixed(2)}`
    : `$${v.toFixed(2)}`;
}

function pnlColor(v: number) {
  return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground';
}

interface Props {
  performance: StrategyPerformance[];
}

export function LeveragedPerformanceCard({ performance }: Props) {
  if (!performance || performance.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground/80 mb-2">Strategy Performance</h3>
        <p className="text-xs text-muted-foreground">No performance data yet. Strategies need time to generate trades.</p>
      </div>
    );
  }

  const totalPnl = performance.reduce((s, p) => s + p.totalPnlUsd, 0);
  const totalFunding = performance.reduce((s, p) => s + p.fundingIncome, 0);
  const totalTrades = performance.reduce((s, p) => s + p.tradesClosed, 0);
  const maxPnl = Math.max(...performance.map(p => Math.abs(p.totalPnlUsd)), 1);
  const logScale = (val: number) => {
    if (val === 0 || maxPnl === 0) return 0;
    return (Math.log10(Math.abs(val) + 1) / Math.log10(maxPnl + 1)) * 100;
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-medium text-foreground">Strategy Performance</h3>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${pnlColor(totalPnl)}`}>
            {totalPnl >= 0 ? '+' : ''}{formatUsd(totalPnl)}
          </p>
          <p className="text-[10px] text-muted-foreground">{totalTrades} trades</p>
        </div>
      </div>

      {/* Summary row */}
      {totalFunding > 0 && (
        <div className="glass-light rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Funding Income</span>
          <span className="text-xs font-semibold text-amber-400">+{formatUsd(totalFunding)}</span>
        </div>
      )}

      {/* Per-strategy bars */}
      <div className="space-y-2">
        {performance.sort((a, b) => b.totalPnlUsd - a.totalPnlUsd).map(p => (
          <div key={p.strategyType} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STRATEGY_COLORS[p.strategyType] || 'bg-secondary'}`} />
                <span className="text-foreground/80 font-medium">{STRATEGY_LABELS[p.strategyType] || p.strategyType}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                {p.tradesClosed > 0 && <span className="text-muted-foreground">{Math.round(p.tradesClosed * p.winRate / 100)}W {Math.round(p.tradesClosed * (1 - p.winRate / 100))}L</span>}
                {p.winRate > 0 && <span className="text-muted-foreground">WR {p.winRate.toFixed(0)}%</span>}
                {p.profitFactor > 0 && p.profitFactor < 999 && <span className="text-muted-foreground">PF {p.profitFactor.toFixed(2)}</span>}
                <span className={`font-medium ${pnlColor(p.totalPnlUsd)}`}>
                  {p.totalPnlUsd >= 0 ? '+' : ''}{formatUsd(p.totalPnlUsd)}
                </span>
              </div>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  p.totalPnlUsd >= 0 ? STRATEGY_COLORS[p.strategyType] || 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, logScale(p.totalPnlUsd))}%`, opacity: 0.7 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
