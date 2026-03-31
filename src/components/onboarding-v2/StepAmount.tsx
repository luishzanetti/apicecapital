import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingV2Store } from '@/store/slices/onboardingV2Slice';
import { calculateProjection, formatBRL } from '@/lib/projections';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StepAmountProps {
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500];
const MIN_AMOUNT = 25;
const MAX_AMOUNT = 2000;
const STEP_SIZE = 25;

export function StepAmount({ onNext, onBack }: StepAmountProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { weeklyAmount, setWeeklyAmount } = useOnboardingV2Store();

  const projections = useMemo(
    () => ({
      y1: calculateProjection(weeklyAmount, 1),
      y3: calculateProjection(weeklyAmount, 3),
      y5: calculateProjection(weeklyAmount, 5),
    }),
    [weeklyAmount]
  );

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' };

  function handleSliderChange(values: number[]) {
    const snapped = Math.round(values[0] / STEP_SIZE) * STEP_SIZE;
    setWeeklyAmount(Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, snapped)));
  }

  return (
    <div className="flex flex-col flex-1">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="flex flex-col flex-1"
      >
        <h2 className="text-2xl font-bold mb-6">
          {t('onboardingV2.amountTitle')}
        </h2>

        {/* Amount display */}
        <div className="text-center mb-6">
          <motion.span
            key={weeklyAmount}
            initial={prefersReducedMotion ? {} : { scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-4xl font-bold text-primary inline-block"
          >
            {formatBRL(weeklyAmount)}
          </motion.span>
          <span className="text-lg text-muted-foreground ml-1">
            /{t('onboardingV2.perWeek')}
          </span>
        </div>

        {/* Slider */}
        <div className="px-2 mb-6">
          <Slider
            value={[weeklyAmount]}
            onValueChange={handleSliderChange}
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={STEP_SIZE}
            aria-label={t('onboardingV2.amountTitle')}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{formatBRL(MIN_AMOUNT)}</span>
            <span>{formatBRL(MAX_AMOUNT)}</span>
          </div>
        </div>

        {/* Quick suggestion buttons */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">
            {t('onboardingV2.quickSuggestions')}
          </p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setWeeklyAmount(amount)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  weeklyAmount === amount
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                {formatBRL(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Projections card */}
        <Card variant="glass" className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <ProjectionRow
                label={t('onboardingV2.in1year')}
                value={projections.y1}
                prefersReducedMotion={!!prefersReducedMotion}
              />
              <ProjectionRow
                label={t('onboardingV2.in3years')}
                value={projections.y3}
                prefersReducedMotion={!!prefersReducedMotion}
              />
              <ProjectionRow
                label={t('onboardingV2.in5years')}
                value={projections.y5}
                highlight
                prefersReducedMotion={!!prefersReducedMotion}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3 mt-auto pt-4">
          <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
            {t('onboardingV2.back')}
          </Button>
          <Button size="lg" onClick={onNext} className="flex-1">
            {t('onboardingV2.confirm')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectionRow({
  label,
  value,
  highlight = false,
  prefersReducedMotion,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  prefersReducedMotion: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <motion.span
        key={value}
        initial={prefersReducedMotion ? {} : { opacity: 0.5, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn(
          'font-bold',
          highlight ? 'text-primary text-lg' : 'text-foreground text-sm'
        )}
      >
        {formatBRL(value)}
      </motion.span>
    </div>
  );
}
