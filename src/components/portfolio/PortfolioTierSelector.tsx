import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import {
  PORTFOLIO_TIERS, AMOUNT_PRESETS,
  getRecommendedTier, getUpgradeRecommendation,
  type PortfolioTier, type PortfolioAsset,
} from '@/data/portfolioTiers';
import { MarketRegimeBadge } from '@/components/intelligence/MarketRegimeBadge';

// ─── Donut Chart ──────────────────────────────────────────────

function AllocationDonut({ assets, size = 80 }: { assets: PortfolioAsset[]; size?: number }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {assets.map((asset) => {
        const dashLength = (asset.percentage / 100) * circumference;
        const segment = (
          <circle
            key={asset.symbol}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={asset.color}
            strokeWidth={asset.isWarChest ? 6 : 8}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-700"
            opacity={asset.isWarChest ? 0.7 : 1}
          />
        );
        offset += dashLength;
        return segment;
      })}
    </svg>
  );
}

// ─── Tier Card ────────────────────────────────────────────────

function TierCard({
  tier,
  isSelected,
  isRecommended,
  onSelect,
}: {
  tier: PortfolioTier;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full text-left rounded-2xl border p-4 transition-all
        ${isSelected
          ? `bg-gradient-to-br ${tier.gradient} ${tier.borderColor} border-2 shadow-lg`
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        }
      `}
    >
      {/* Badges */}
      <div className="absolute -top-2.5 right-3 flex gap-1.5">
        {isRecommended && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-primary text-white rounded-full">
            RECOMMENDED
          </span>
        )}
        {tier.isPro && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
            PRO
          </span>
        )}
        {tier.highlight && !isRecommended && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-700 text-zinc-300 rounded-full">
            {tier.highlight}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Donut */}
        <div className="flex-shrink-0">
          <AllocationDonut assets={tier.assets} size={64} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tier.emoji}</span>
            <h3 className="text-sm font-bold text-white">{tier.name}</h3>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{tier.subtitle}</p>

          {/* Assets mini list */}
          <div className="flex flex-wrap gap-1 mt-2">
            {tier.assets.map((a) => (
              <span
                key={a.symbol}
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                  a.isWarChest
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {a.symbol} {a.percentage}%
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
            <span>{tier.riskLabel}</span>
            <span>•</span>
            <span>{tier.targetAnnualReturn} p.a.</span>
            <span>•</span>
            <span>From {tier.minCapitalLabel}</span>
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Quick Setup Panel ────────────────────────────────────────

function QuickSetup({
  tier,
  onActivate,
}: {
  tier: PortfolioTier;
  onActivate: (amount: number, frequency: string) => void;
}) {
  const presets = AMOUNT_PRESETS[tier.id] || [25, 50, 100, 200];
  const [selectedAmount, setSelectedAmount] = useState(tier.suggestedWeekly);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [isActivating, setIsActivating] = useState(false);

  const monthlyEstimate = useMemo(() => {
    const mult = frequency === 'daily' ? 30 : frequency === 'weekly' ? 4 : frequency === 'biweekly' ? 2 : 1;
    return selectedAmount * mult;
  }, [selectedAmount, frequency]);

  const handleActivate = async () => {
    setIsActivating(true);
    await onActivate(selectedAmount, frequency);
    setIsActivating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 mt-3">
        {/* Amount */}
        <div>
          <p className="text-xs text-zinc-400 mb-2">How much per contribution?</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-primary text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <p className="text-xs text-zinc-400 mb-2">Frequency</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Biweekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((freq) => (
              <button
                key={freq.value}
                onClick={() => setFrequency(freq.value)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  frequency === freq.value
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Amount per period</span>
            <span className="text-white font-bold">${selectedAmount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Monthly estimate</span>
            <span className="text-white font-bold">${monthlyEstimate}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">War Chest</span>
            <span className="text-emerald-400 font-bold">{tier.warChestPct}% (${Math.round(selectedAmount * tier.warChestPct / 100)})</span>
          </div>

          {/* Allocation preview */}
          <div className="pt-2 border-t border-zinc-700/50">
            <p className="text-[10px] text-zinc-500 mb-1.5">Allocation per ${selectedAmount} contribution:</p>
            {tier.assets.map((asset) => {
              const assetAmount = (selectedAmount * asset.percentage / 100).toFixed(2);
              return (
                <div key={asset.symbol} className="flex items-center justify-between text-[11px] py-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                    <span className={asset.isWarChest ? 'text-emerald-400' : 'text-zinc-300'}>{asset.name}</span>
                  </div>
                  <span className="text-zinc-400">${assetAmount} ({asset.percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activate */}
        <button
          onClick={handleActivate}
          disabled={isActivating}
          className={`
            w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]
            bg-gradient-to-r from-primary to-violet-600 text-white
            hover:from-primary/90 hover:to-violet-500
            disabled:opacity-50
          `}
        >
          {isActivating ? 'Activating...' : `Activate ${tier.name} — Auto DCA`}
        </button>

        <p className="text-[10px] text-zinc-600 text-center">
          Smart DCA activated • Automatic execution • Cancel anytime
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function PortfolioTierSelector() {
  const navigate = useNavigate();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const investorType = useAppStore((s) => s.investorType);
  const addDcaPlan = useAppStore((s) => s.addDcaPlan);
  const setSelectedPortfolio = useAppStore((s) => s.setSelectedPortfolio);
  const { regime, userIntel, logBehaviorEvent } = useMarketIntelligence();

  // Get recommended tier based on investor profile
  const recommendedTier = useMemo(() =>
    getRecommendedTier(investorType, 50),
  [investorType]);

  // Check for upgrade recommendation
  const upgradeRec = useMemo(() => {
    if (!selectedTierId || !userIntel) return null;
    return getUpgradeRecommendation(
      selectedTierId,
      userIntel.current_streak_weeks,
      userIntel.behavioral_score,
      0,
      regime?.regime || 'SIDEWAYS'
    );
  }, [selectedTierId, userIntel, regime]);

  const selectedTier = useMemo(() =>
    PORTFOLIO_TIERS.find(t => t.id === selectedTierId),
  [selectedTierId]);

  const handleActivate = async (amount: number, frequency: string) => {
    if (!selectedTier) return;

    // 1. Set portfolio
    setSelectedPortfolio(
      selectedTier.id,
      selectedTier.assets.map(a => ({
        asset: a.symbol,
        percentage: a.percentage,
        color: a.color,
      }))
    );

    // 2. Create DCA plan with tier's allocation
    addDcaPlan({
      assets: selectedTier.assets
        .filter(a => !a.isWarChest) // Exclude war chest from DCA execution (accumulates separately)
        .map(a => ({
          symbol: a.symbol,
          allocation: Math.round(a.percentage / (100 - selectedTier.warChestPct) * 100),
        })),
      amountPerInterval: Math.round(amount * (100 - selectedTier.warChestPct) / 100),
      frequency: frequency as any,
      durationDays: null, // Indefinite
    });

    // 3. Log behavior
    await logBehaviorEvent('strategy_changed', {
      tier: selectedTier.id,
      amount,
      frequency,
      war_chest_pct: selectedTier.warChestPct,
    });

    setActivated(true);
  };

  if (activated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/30 rounded-2xl p-6 text-center space-y-3"
      >
        <span className="text-4xl">✅</span>
        <h3 className="text-lg font-bold text-white">{selectedTier?.name} Activated!</h3>
        <p className="text-sm text-zinc-400">
          Your auto DCA is configured. The system runs on its own — you just need to keep a balance on Bybit.
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/dca-planner')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300"
          >
            View My Plans
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Choose your Strategy</h2>
          <p className="text-xs text-zinc-500">Select, configure the amount, and activate with 1 click</p>
        </div>
        <MarketRegimeBadge size="sm" />
      </div>

      {/* Tier Cards */}
      <div className="space-y-3">
        {PORTFOLIO_TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedTierId === tier.id}
            isRecommended={tier.id === recommendedTier.id}
            onSelect={() => setSelectedTierId(selectedTierId === tier.id ? null : tier.id)}
          />
        ))}
      </div>

      {/* Quick Setup (shows when tier selected) */}
      <AnimatePresence>
        {selectedTier && (
          <QuickSetup tier={selectedTier} onActivate={handleActivate} />
        )}
      </AnimatePresence>

      {/* Upgrade Recommendation */}
      {upgradeRec && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3"
        >
          <div className="flex items-center gap-2">
            <span>🎓</span>
            <p className="text-xs text-amber-300">
              {upgradeRec.reason
                .replace('{weeks}', String(userIntel?.current_streak_weeks || 0))
                .replace('{score}', String(userIntel?.behavioral_score || 0))
              }
            </p>
          </div>
          <button
            onClick={() => setSelectedTierId(upgradeRec.toTier)}
            className="mt-2 text-xs text-amber-400 font-semibold"
          >
            View {PORTFOLIO_TIERS.find(t => t.id === upgradeRec.toTier)?.name} →
          </button>
        </motion.div>
      )}
    </div>
  );
}
