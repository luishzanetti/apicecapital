import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { PORTFOLIO_TIERS, getUpgradeRecommendation } from '@/data/portfolioTiers';

export function UpgradeRecommendation() {
  const navigate = useNavigate();
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
  const { regime, userIntel } = useMarketIntelligence();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const totalInvested = dcaPlans.reduce((s, p) => s + (p.totalInvested || 0), 0);

  const recommendation = useMemo(() => {
    const currentTierId = selectedPortfolio?.portfolioId || '';
    if (!currentTierId || !userIntel) return null;

    return getUpgradeRecommendation(
      currentTierId,
      userIntel.current_streak_weeks,
      userIntel.behavioral_score,
      totalInvested,
      regime?.regime || 'SIDEWAYS'
    );
  }, [selectedPortfolio, userIntel, regime, totalInvested]);

  if (!recommendation) return null;

  const targetTier = PORTFOLIO_TIERS.find(t => t.id === recommendation.toTier);
  if (!targetTier) return null;

  const message = recommendation.reason
    .replace('{weeks}', String(userIntel?.current_streak_weeks || 0))
    .replace('{score}', String(userIntel?.behavioral_score || 0))
    .replace('{amount}', totalInvested.toLocaleString())
    .replace('{fg}', String(regime?.regime === 'CAPITULATION' ? '< 15' : ''));

  return (
    <button
      onClick={() => navigate('/portfolio')}
      className="w-full text-left glass-card border-glow-gold rounded-xl p-4 hover-lift press-scale transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{targetTier.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Upgrade Disponível</p>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-1">
            Evolua para {targetTier.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {message}
          </p>
          <p className="text-xs text-primary font-semibold mt-2">
            Ver detalhes →
          </p>
        </div>
      </div>
    </button>
  );
}
