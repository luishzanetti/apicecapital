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
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚖️</span>
        <h3 className="text-sm font-medium text-amber-300">Rebalanceamento Sugerido</h3>
      </div>

      <p className="text-xs text-zinc-300">{rebalance.explanation}</p>

      {/* Deviation indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Desvio:</span>
        <div className="flex-1 bg-zinc-800 rounded-full h-2">
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
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Próximo aporte sugerido</p>
          {Object.entries(rebalance.recommendation).map(([asset, pct]) => (
            <div key={asset} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{asset.replace('USDT', '')}</span>
              <span className="text-white font-medium">{pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Over/Under allocated */}
      <div className="flex gap-3 text-[10px]">
        {rebalance.over_allocated && rebalance.over_allocated.length > 0 && (
          <div>
            <span className="text-red-400">Acima do target: </span>
            <span className="text-zinc-400">{rebalance.over_allocated.join(', ')}</span>
          </div>
        )}
        {rebalance.under_allocated && rebalance.under_allocated.length > 0 && (
          <div>
            <span className="text-green-400">Abaixo do target: </span>
            <span className="text-zinc-400">{rebalance.under_allocated.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAccept}
          className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium py-2 rounded-lg transition-colors"
        >
          Aplicar no Próximo DCA
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs py-2 rounded-lg transition-colors"
        >
          Ignorar
        </button>
      </div>
    </div>
  );
}
