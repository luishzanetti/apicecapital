import { useEffect } from 'react';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';

export function RebalanceAlertCard() {
  const { rebalance, fetchRebalance, logBehaviorEvent } = useMarketIntelligence();

  useEffect(() => {
    fetchRebalance();
  }, [fetchRebalance]);

  if (!rebalance || !rebalance.needs_rebalance) return null;

  const handleAccept = () => {
    logBehaviorEvent('rebalance_applied', {
      deviation: rebalance.max_deviation,
      recommendation: rebalance.recommendation,
    });
  };

  const handleDismiss = () => {
    logBehaviorEvent('rebalance_dismissed', {
      deviation: rebalance.max_deviation,
    });
  };

  return (
    <div className="glass-card border-glow-gold rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚖️</span>
        <h3 className="text-sm font-medium text-amber-300">Rebalanceamento Sugerido</h3>
      </div>

      <p className="text-xs text-foreground/80">{rebalance.explanation}</p>

      {/* Deviation indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Desvio:</span>
        <div className="flex-1 bg-secondary/40 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-amber-500 transition-all"
            style={{ width: `${Math.min(100, (rebalance.max_deviation || 0) / 30 * 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-amber-400">
          {rebalance.max_deviation?.toFixed(1)}%
        </span>
      </div>

      {/* Recommendation */}
      {rebalance.recommendation && (
        <div className="glass-light rounded-lg p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Próximo aporte sugerido</p>
          {Object.entries(rebalance.recommendation).map(([asset, pct]) => (
            <div key={asset} className="flex items-center justify-between text-xs">
              <span className="text-foreground/80">{asset.replace('USDT', '')}</span>
              <span className="text-foreground font-medium">{pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Over/Under allocated */}
      <div className="flex gap-3 text-[10px]">
        {rebalance.over_allocated && rebalance.over_allocated.length > 0 && (
          <div>
            <span className="text-red-400">Acima do target: </span>
            <span className="text-muted-foreground">{rebalance.over_allocated.join(', ')}</span>
          </div>
        )}
        {rebalance.under_allocated && rebalance.under_allocated.length > 0 && (
          <div>
            <span className="text-green-400">Abaixo do target: </span>
            <span className="text-muted-foreground">{rebalance.under_allocated.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAccept}
          className="flex-1 glass-light text-amber-300 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-amber-500/15 press-scale"
        >
          Aplicar no Próximo DCA
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 glass-light text-muted-foreground text-xs py-2 rounded-lg transition-colors hover:bg-secondary/60"
        >
          Ignorar
        </button>
      </div>
    </div>
  );
}
