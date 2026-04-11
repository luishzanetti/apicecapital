import { useEffect } from 'react';
import { usePerformanceAttribution } from '@/hooks/usePerformanceAttribution';

function formatUsd(value: number): string {
  return value < 0
    ? `-$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlColor(value: number): string {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-muted-foreground';
}

export function PerformanceCard() {
  const { performance, isLoading, fetchPerformance } = usePerformanceAttribution();

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-secondary/40 rounded w-48 mb-3" />
        <div className="h-24 bg-secondary/40 rounded" />
      </div>
    );
  }

  if (!performance || performance.assets.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground/80 mb-2">Performance</h3>
        <p className="text-xs text-muted-foreground">No execution history yet. Start a DCA plan to track performance.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-medium text-foreground">Profit Engine</h3>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${pnlColor(performance.totalPnl)}`}>
            {formatUsd(performance.totalPnl)}
          </p>
          <p className={`text-xs ${pnlColor(performance.totalPnlPct)}`}>
            {performance.totalPnlPct >= 0 ? '+' : ''}{performance.totalPnlPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-light rounded-lg p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Invested</p>
          <p className="text-xs font-semibold text-foreground">{formatUsd(performance.totalInvested)}</p>
        </div>
        <div className="glass-light rounded-lg p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Unrealized</p>
          <p className={`text-xs font-semibold ${pnlColor(performance.totalUnrealizedPnl)}`}>
            {formatUsd(performance.totalUnrealizedPnl)}
          </p>
        </div>
        <div className="glass-light rounded-lg p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Realized</p>
          <p className={`text-xs font-semibold ${pnlColor(performance.totalRealizedPnl)}`}>
            {formatUsd(performance.totalRealizedPnl)}
          </p>
        </div>
      </div>

      {/* Asset breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Per Asset</p>
        {performance.assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between text-xs glass-light rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground w-10">{asset.symbol}</span>
              <div className="text-muted-foreground">
                <span className="text-xs">avg </span>
                <span>${asset.avgBuyPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${pnlColor(asset.unrealizedPnl)}`}>
                {formatUsd(asset.unrealizedPnl)}
              </p>
              <p className={`text-xs ${pnlColor(asset.unrealizedPnlPct)}`}>
                {asset.unrealizedPnlPct >= 0 ? '+' : ''}{asset.unrealizedPnlPct.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
