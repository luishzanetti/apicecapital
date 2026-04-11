import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { MarketRegimeBadge } from './MarketRegimeBadge';
import { FearGreedGauge } from './FearGreedGauge';
import { SmartDCACard } from './SmartDCACard';
import { DailyBriefingCard } from './DailyBriefingCard';
import { SmartAlertsList } from './SmartAlertsList';
import { BehavioralScoreCard } from './BehavioralScoreCard';
import { RebalanceAlertCard } from './RebalanceAlertCard';

export function IntelligenceDashboard() {
  const { btcPrice, btcChange24h, regime, userIntel } = useMarketIntelligence();

  return (
    <div className="space-y-4">
      {/* Top bar: Market overview */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* BTC Price */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Bitcoin</p>
              <p className="text-lg font-bold text-foreground">
                ${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <span
              className={`text-sm font-medium ${
                btcChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {btcChange24h >= 0 ? '+' : ''}{btcChange24h.toFixed(2)}%
            </span>
          </div>

          {/* Regime */}
          <MarketRegimeBadge size="md" showConfidence />

          {/* Fear & Greed mini */}
          <FearGreedGauge />
        </div>
      </div>

      {/* Daily Briefing — Full width */}
      <DailyBriefingCard />

      {/* Alerts — if any */}
      <SmartAlertsList maxAlerts={3} />

      {/* Rebalance suggestion — if needed */}
      <RebalanceAlertCard />

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Smart DCA */}
        <SmartDCACard />

        {/* Behavioral Score */}
        <BehavioralScoreCard />
      </div>
    </div>
  );
}
