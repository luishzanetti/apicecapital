import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="px-4 pt-2 pb-1">
      <div
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`${t('onboardingV2.progressLabel')} ${current + 1}/${total}`}
        className="w-full h-1 bg-secondary rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full apice-gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: 'easeOut' }
          }
        />
      </div>
    </div>
  );
}
