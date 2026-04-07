import { useMarketIntelligence, type MarketRegime } from '@/hooks/useMarketIntelligence';

const REGIME_LABELS: Record<MarketRegime, string> = {
  BULL: 'Bull',
  BEAR: 'Bear',
  SIDEWAYS: 'Sideways',
  HIGH_VOLATILITY: 'High Vol.',
  ALTSEASON: 'Altseason',
  CAPITULATION: 'Capitulation',
};

const REGIME_BG: Record<MarketRegime, string> = {
  BULL: 'bg-green-500/20 text-green-400 border-green-500/30',
  BEAR: 'bg-red-500/20 text-red-400 border-red-500/30',
  SIDEWAYS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HIGH_VOLATILITY: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ALTSEASON: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CAPITULATION: 'bg-red-600/20 text-red-300 border-red-600/30',
};

interface MarketRegimeBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  showConfidence?: boolean;
}

export function MarketRegimeBadge({
  size = 'md',
  showDescription = false,
  showConfidence = false,
}: MarketRegimeBadgeProps) {
  const { regime, regimeIcon } = useMarketIntelligence();

  if (!regime) {
    return (
      <div className="animate-pulse bg-zinc-800 rounded-lg h-8 w-24" />
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full border font-medium
            ${REGIME_BG[regime.regime]}
            ${sizeClasses[size]}
          `}
        >
          <span>{regimeIcon}</span>
          <span>{REGIME_LABELS[regime.regime]}</span>
        </span>
        {showConfidence && (
          <span className="text-xs text-zinc-500">
            {regime.confidence.toFixed(0)}% confidence
          </span>
        )}
      </div>
      {showDescription && (
        <p className="text-xs text-zinc-400 ml-1">
          {regime.description}
        </p>
      )}
    </div>
  );
}
