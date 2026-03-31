import { useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingV2Store } from '@/store/slices/onboardingV2Slice';
import {
  getRecommendedStrategy,
  getAllStrategies,
  calculateProjection,
  formatBRL,
} from '@/lib/projections';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap, LayoutDashboard } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepConfirmProps {
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

export function StepConfirm({ onComplete }: StepConfirmProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const {
    goal,
    experience,
    riskProfile,
    selectedStrategy,
    weeklyAmount,
    completeOnboarding,
  } = useOnboardingV2Store();

  // Resolve the active strategy object
  const strategy = useMemo(() => {
    const all = getAllStrategies();
    if (selectedStrategy) {
      const found = all.find((s) => s.id === selectedStrategy);
      if (found) return found;
    }
    return getRecommendedStrategy(goal, experience, riskProfile);
  }, [selectedStrategy, goal, experience, riskProfile]);

  const projection5y = useMemo(
    () => calculateProjection(weeklyAmount, 5),
    [weeklyAmount]
  );

  const allocationText = strategy.allocations
    .map((a) => `${a.percentage}% ${a.asset}`)
    .join(' + ');

  // Fire confetti on mount
  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion) return;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#14b8a6'],
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    fireConfetti();
  }, [fireConfetti]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeOut' };

  function handleConnectBybit() {
    completeOnboarding();
    // Navigate to Bybit connection flow (settings)
    window.location.href = '/settings';
  }

  function handleDashboard() {
    completeOnboarding();
    onComplete();
  }

  return (
    <div className="flex flex-col flex-1 items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={transition}
        className="w-full flex flex-col items-center flex-1"
      >
        {/* Celebration heading */}
        <motion.h2
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { delay: 0.2, duration: 0.3 }
          }
          className="text-2xl font-bold text-center mb-6"
        >
          {t('onboardingV2.planReady')}
        </motion.h2>

        {/* Summary card */}
        <Card variant="premium" className="w-full mb-6">
          <CardContent className="p-5 space-y-4">
            <SummaryRow
              label={t('onboardingV2.strategy')}
              value={strategy.name}
            />
            <SummaryRow
              label={t('onboardingV2.allocation')}
              value={allocationText}
            />
            <SummaryRow
              label={t('onboardingV2.weeklyValue')}
              value={`${formatBRL(weeklyAmount)}/${t('onboardingV2.perWeek')}`}
            />
            <div className="border-t border-border pt-3">
              <SummaryRow
                label={t('onboardingV2.projection')}
                value={formatBRL(projection5y)}
                highlight
              />
            </div>
          </CardContent>
        </Card>

        {/* Trust message */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/50 mb-6 w-full">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('onboardingV2.trustMessage')}
          </p>
        </div>

        {/* Next step label */}
        <p className="text-sm font-medium text-muted-foreground mb-3 w-full">
          {t('onboardingV2.nextStep')}
        </p>

        {/* CTAs */}
        <div className="w-full space-y-3 mt-auto">
          <Button
            variant="premium"
            size="lg"
            className="w-full"
            onClick={handleConnectBybit}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t('onboardingV2.connectExchange')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleDashboard}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            {t('onboardingV2.goToDashboard')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? 'font-bold text-primary text-lg'
            : 'font-semibold text-sm text-foreground'
        }
      >
        {value}
      </span>
    </div>
  );
}
