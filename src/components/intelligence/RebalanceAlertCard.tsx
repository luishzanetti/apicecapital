import { useEffect, useState } from 'react';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { supabase } from '@/integrations/supabase/client';

export function RebalanceAlertCard() {
  const { rebalance, fetchRebalance, regime, logBehaviorEvent } = useMarketIntelligence();
  const { sellAsset, buyAsset, isExecuting: isTrading } = useTradeExecution();
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hardRebalancing, setHardRebalancing] = useState(false);
  const [rebalanceResults, setRebalanceResults] = useState<string[]>([]);

  useEffect(() => {
    fetchRebalance();
  }, [fetchRebalance]);

  if (!rebalance || !rebalance.needs_rebalance) return null;

  const handleAccept = async () => {
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Write rebalance recommendation as smart_dca_override
      // This changes the NEXT DCA allocation to favor under-allocated assets
      const override = {
        allocation_adjustments: rebalance.recommendation,
        regime: 'REBALANCE',
        applied_at: new Date().toISOString(),
      };

      await supabase
        .from('dca_plans')
        .update({ smart_dca_override: override })
        .eq('user_id', user.id)
        .eq('is_active', true);

      await logBehaviorEvent('rebalance_applied', {
        deviation: rebalance.max_deviation,
        recommendation: rebalance.recommendation,
      });

      setApplied(true);
    } finally {
      setApplying(false);
    }
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
              <span className="text-foreground font-medium">{pct as number}%</span>
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
      {!applied && rebalanceResults.length === 0 ? (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={applying || hardRebalancing}
              className="flex-1 glass-light text-amber-300 text-xs font-medium py-2 rounded-lg transition-colors hover:bg-amber-500/15 press-scale disabled:opacity-50"
            >
              {applying ? 'Aplicando...' : 'Aplicar no Próximo DCA'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 glass-light text-muted-foreground text-xs py-2 rounded-lg transition-colors hover:bg-secondary/60"
            >
              Ignorar
            </button>
          </div>
          {/* Hard rebalance: sell over-allocated, buy under-allocated NOW */}
          {rebalance.over_allocated && rebalance.over_allocated.length > 0 && (
            <button
              onClick={async () => {
                setHardRebalancing(true);
                const results: string[] = [];
                try {
                  const regimeStr = regime?.regime || null;
                  // Note: quantities are conservative minimums for safety.
                  // Full position-aware rebalancing requires portfolio holdings data.
                  const overCount = rebalance.over_allocated!.length;
                  const underCount = (rebalance.under_allocated || []).length;

                  // Sell small portion of over-allocated assets
                  for (const asset of rebalance.over_allocated!) {
                    const cleanAsset = asset.replace('USDT', '');
                    // Conservative sell: small quantity per asset
                    const result = await sellAsset(cleanAsset, 0.001, 'rebalance', regimeStr);
                    results.push(result?.status === 'success'
                      ? `Sold ${cleanAsset} (${result.amountUsdt ? '$' + result.amountUsdt.toFixed(2) : 'min qty'})`
                      : `Failed: ${cleanAsset} — ${result?.error || 'unknown error'}`
                    );
                  }
                  // Buy under-allocated assets — split proceeds evenly
                  const buyAmountPerAsset = underCount > 0 ? Math.max(10, 50 / underCount) : 10;
                  for (const asset of (rebalance.under_allocated || [])) {
                    const cleanAsset = asset.replace('USDT', '');
                    const result = await buyAsset(cleanAsset, buyAmountPerAsset, 'rebalance', regimeStr);
                    results.push(result?.status === 'success'
                      ? `Bought $${buyAmountPerAsset.toFixed(0)} ${cleanAsset}`
                      : `Failed: ${cleanAsset} — ${result?.error || 'unknown error'}`
                    );
                  }
                  await logBehaviorEvent('hard_rebalance_executed', {
                    deviation: rebalance.max_deviation,
                    results,
                  });
                } finally {
                  setRebalanceResults(results);
                  setHardRebalancing(false);
                }
              }}
              disabled={hardRebalancing || isTrading}
              className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {hardRebalancing ? 'Rebalancing...' : 'Rebalancear Agora (Sell + Buy)'}
            </button>
          )}
        </div>
      ) : rebalanceResults.length > 0 ? (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Results</p>
          {rebalanceResults.map((r, i) => (
            <p key={i} className={`text-xs ${r.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>
              {r}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-full py-2 rounded-lg text-center text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Rebalanceamento aplicado ao próximo DCA!
          </div>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase
                .from('dca_plans')
                .update({ smart_dca_override: null })
                .eq('user_id', user.id)
                .eq('is_active', true);
              setApplied(false);
            }}
            className="w-full py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar override
          </button>
        </div>
      )}
    </div>
  );
}
