import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingV2Store } from '@/store/slices/onboardingV2Slice';
import {
  getRecommendedStrategy,
  getAllStrategies,
  getProjectionData,
  formatBRL,
  type Strategy,
} from '@/lib/projections';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StepStrategyProps {
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

function StrategyCard({
  strategy,
  isSelected,
  isRecommended,
  onSelect,
}: {
  strategy: Strategy;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const allocationText = strategy.allocations
    .map((a) => `${a.percentage}% ${a.asset}`)
    .join(' + ');

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-2xl border text-left transition-all duration-200 relative',
        isSelected
          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0">
          <div className="text-[11px] px-2 py-0.5 bg-primary text-white font-bold rounded-bl-lg rounded-tr-2xl">
            {t('onboardingV2.recommended')}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm">{strategy.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{allocationText}</p>
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export function StepStrategy({ onNext }: StepStrategyProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const {
    goal,
    experience,
    riskProfile,
    selectedStrategy,
    weeklyAmount,
    setStrategy,
  } = useOnboardingV2Store();

  const [showOthers, setShowOthers] = useState(false);

  const recommended = useMemo(
    () => getRecommendedStrategy(goal, experience, riskProfile),
    [goal, experience, riskProfile]
  );

  const allStrategies = useMemo(() => getAllStrategies(), []);
  const otherStrategies = allStrategies.filter((s) => s.id !== recommended.id);

  // Use selected strategy or fall back to recommended
  const activeStrategyId = selectedStrategy ?? recommended.id;

  const chartData = useMemo(
    () => getProjectionData(weeklyAmount),
    [weeklyAmount]
  );

  const projection5y = chartData[chartData.length - 1]?.projected ?? 0;

  const profileLabel = riskProfile
    ? t(`onboardingV2.risk${riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}`)
    : t('onboardingV2.riskModerate');

  function handleSelect(strategyId: string) {
    setStrategy(strategyId);
  }

  function handleContinue() {
    if (!selectedStrategy) {
      setStrategy(recommended.id);
    }
    onNext();
  }

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' };

  return (
    <div className="flex flex-col flex-1">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        {/* Profile badge */}
        <p className="text-sm text-muted-foreground mb-1">
          {t('onboardingV2.profileResult')}: <span className="font-semibold text-foreground">{profileLabel}</span>
        </p>
        <h2 className="text-2xl font-bold mb-4">
          {t('onboardingV2.recommendedStrategy')}
        </h2>

        {/* Main strategy card with chart */}
        <Card variant="premium" className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">{recommended.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {recommended.allocations.map((a) => `${a.percentage}% ${a.asset}`).join(' + ')}
            </p>

            {/* Chart */}
            <div className="h-40 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatBRL(value), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#investedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#projGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('onboardingV2.projection5y')}
              </span>
              <span className="font-bold text-primary text-lg">
                {formatBRL(projection5y)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('onboardingV2.investingWeekly')} {formatBRL(weeklyAmount)}/{t('onboardingV2.weekLabel')}
            </p>
          </CardContent>
        </Card>

        {/* See others toggle */}
        <button
          onClick={() => setShowOthers(!showOthers)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          {showOthers ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {t('onboardingV2.seeOthers')}
        </button>

        {showOthers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition}
            className="space-y-2 mb-4"
          >
            {otherStrategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                isSelected={activeStrategyId === s.id}
                isRecommended={false}
                onSelect={() => handleSelect(s.id)}
              />
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <Button
          className="w-full mt-4"
          size="lg"
          onClick={handleContinue}
        >
          {t('onboardingV2.useThis')}
        </Button>
      </motion.div>
    </div>
  );
}
