import { useEffect, useState, useMemo } from 'react';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { MarketRegimeBadge } from './MarketRegimeBadge';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

export function SmartDCACard() {
  const { smartDCA, fetchSmartDCA, regime, isLoading, sendFeedback, logBehaviorEvent } = useMarketIntelligence();
  const { language } = useTranslation();
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            empty: 'Nenhum plano DCA ativo para otimizar.',
            suggested: 'Aporte sugerido',
            allocationAdj: 'Alocação ajustada',
            applying: 'Aplicando...',
            applyPrefix: 'Aplicar Smart DCA',
            perWeek: '/semana',
            applied: 'Smart DCA aplicado ao próximo aporte!',
            reset: 'Resetar para DCA padrão',
          }
        : {
            empty: 'No active DCA plan to optimize.',
            suggested: 'Suggested amount',
            allocationAdj: 'Adjusted allocation',
            applying: 'Applying...',
            applyPrefix: 'Apply Smart DCA',
            perWeek: '/week',
            applied: 'Smart DCA applied to next deposit!',
            reset: 'Reset to standard DCA',
          },
    [language]
  );

  useEffect(() => {
    fetchSmartDCA();
  }, [fetchSmartDCA]);

  if (isLoading || !smartDCA) {
    return (
      <div className="glass-card rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-secondary/40 rounded w-40 mb-3" />
        <div className="h-16 bg-secondary/40 rounded" />
      </div>
    );
  }

  if (smartDCA.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground/80 mb-2">Smart DCA</h3>
        <p className="text-xs text-muted-foreground">{copy.empty}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-medium text-foreground">Smart DCA</h3>
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
            <div className="flex items-center justify-between glass-light rounded-lg p-3">
              <div>
                <p className="text-xs text-muted-foreground">{copy.suggested}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground line-through text-sm">
                    ${plan.original_amount}
                  </span>
                  <span className="text-foreground font-semibold text-lg">
                    ${plan.adjusted_amount}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      isIncrease ? 'bg-green-500/20 text-green-400' :
                      isDecrease ? 'bg-red-500/20 text-red-400' :
                      'bg-secondary/40 text-muted-foreground'
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
                <p className="text-xs text-muted-foreground">{copy.allocationAdj}</p>
                {Object.entries(plan.allocation_adjustments).map(([symbol, alloc]) => {
                  const diff = alloc.adjusted - alloc.original;
                  return (
                    <div key={symbol} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/80 font-medium">{symbol.replace('USDT', '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{alloc.original}%</span>
                        <span className="text-muted-foreground/60">→</span>
                        <span className="text-foreground">{alloc.adjusted}%</span>
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              {plan.explanation}
            </p>

            {/* 1-CLICK APPLY BUTTON — writes override to database */}
            {plan.adjustment_pct !== 0 && !applied && (
              <button
                onClick={async () => {
                  setApplying(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const override = {
                      adjusted_amount: plan.adjusted_amount,
                      allocation_adjustments: Object.fromEntries(
                        Object.entries(plan.allocation_adjustments).map(([symbol, alloc]) => [
                          symbol.replace('USDT', ''),
                          alloc.adjusted,
                        ])
                      ),
                      regime: plan.regime,
                      applied_at: new Date().toISOString(),
                    };

                    await supabase
                      .from('dca_plans')
                      .update({ smart_dca_override: override })
                      .eq('user_id', user.id)
                      .eq('is_active', true);

                    await logBehaviorEvent('recommendation_accepted', {
                      type: 'smart_dca',
                      regime: plan.regime,
                      adjustment_pct: plan.adjustment_pct,
                      original_amount: plan.original_amount,
                      adjusted_amount: plan.adjusted_amount,
                    });
                    setApplied(true);
                  } finally {
                    setApplying(false);
                  }
                }}
                disabled={applying}
                className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-[0.98] disabled:opacity-50"
              >
                {applying ? copy.applying : `${copy.applyPrefix} — $${plan.adjusted_amount}${copy.perWeek}`}
              </button>
            )}
            {applied && (
              <div className="space-y-2">
                <div className="w-full py-2 rounded-lg text-center text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  {copy.applied}
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
                  className="w-full py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.reset}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
