import { useEffect, useState } from 'react';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { MarketRegimeBadge } from './MarketRegimeBadge';

export function SmartDCACard() {
  const { smartDCA, fetchSmartDCA, regime, isLoading, sendFeedback, logBehaviorEvent } = useMarketIntelligence();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchSmartDCA();
  }, [fetchSmartDCA]);

  if (isLoading || !smartDCA) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-zinc-800 rounded w-40 mb-3" />
        <div className="h-16 bg-zinc-800 rounded" />
      </div>
    );
  }

  if (smartDCA.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Smart DCA</h3>
        <p className="text-xs text-zinc-500">Nenhum plano DCA ativo para otimizar.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-medium text-white">Smart DCA</h3>
        </div>
        <MarketRegimeBadge size="sm" />
      </div>

      {smartDCA.map((plan, idx) => {
        const isIncrease = plan.adjustment_pct > 0;
        const isDecrease = plan.adjustment_pct < 0;
        const isNeutral = plan.adjustment_pct === 0;

        return (
          <div key={idx} className="space-y-3">
            {/* Amount adjustment */}
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
              <div>
                <p className="text-xs text-zinc-400">Aporte sugerido</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-500 line-through text-sm">
                    ${plan.original_amount}
                  </span>
                  <span className="text-white font-semibold text-lg">
                    ${plan.adjusted_amount}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      isIncrease ? 'bg-green-500/20 text-green-400' :
                      isDecrease ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {isNeutral ? '0%' : `${isIncrease ? '+' : ''}${plan.adjustment_pct}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation adjustments */}
            {Object.keys(plan.allocation_adjustments).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Alocação ajustada</p>
                {Object.entries(plan.allocation_adjustments).map(([symbol, alloc]) => {
                  const diff = alloc.adjusted - alloc.original;
                  return (
                    <div key={symbol} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{symbol.replace('USDT', '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{alloc.original}%</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-white">{alloc.adjusted}%</span>
                        {diff !== 0 && (
                          <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
                            ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation */}
            <p className="text-xs text-zinc-400 leading-relaxed">
              {plan.explanation}
            </p>

            {/* 1-CLICK APPLY BUTTON */}
            {plan.adjustment_pct !== 0 && !applied && (
              <button
                onClick={async () => {
                  await logBehaviorEvent('recommendation_accepted', {
                    type: 'smart_dca',
                    regime: plan.regime,
                    adjustment_pct: plan.adjustment_pct,
                    original_amount: plan.original_amount,
                    adjusted_amount: plan.adjusted_amount,
                  });
                  setApplied(true);
                }}
                className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-[0.98]"
              >
                Aplicar Smart DCA — ${plan.adjusted_amount}/semana
              </button>
            )}
            {applied && (
              <div className="w-full py-2 rounded-lg text-center text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Smart DCA aplicado ao próximo aporte!
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
