import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingV2Store } from '@/store/slices/onboardingV2Slice';
import { OnboardingProgress } from '@/components/onboarding-v2/OnboardingProgress';
import { StepProfile } from '@/components/onboarding-v2/StepProfile';
import { StepStrategy } from '@/components/onboarding-v2/StepStrategy';
import { StepAmount } from '@/components/onboarding-v2/StepAmount';
import { StepConfirm } from '@/components/onboarding-v2/StepConfirm';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TOTAL_STEPS = 4;

const steps = [StepProfile, StepStrategy, StepAmount, StepConfirm];

export default function UnifiedOnboarding() {
  const { currentStep, setStep } = useOnboardingV2Store();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const clampedStep = Math.min(Math.max(currentStep, 0), TOTAL_STEPS - 1);
  const CurrentStep = steps[clampedStep];

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' };

  function handleNext() {
    if (clampedStep < TOTAL_STEPS - 1) {
      setStep(clampedStep + 1);
    }
  }

  function handleBack() {
    if (clampedStep > 0) {
      setStep(clampedStep - 1);
    }
  }

  function handleComplete() {
    navigate('/home');
  }

  function handleSkip() {
    navigate('/home');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <img
          src="/logo.svg"
          alt="Apice Capital"
          className="h-8"
          onError={(e) => {
            // Fallback if logo doesn't load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-sm text-muted-foreground font-medium">
          {t('onboardingV2.stepOf')} {clampedStep + 1}/{TOTAL_STEPS}
        </span>
        {clampedStep < TOTAL_STEPS - 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
          >
            {t('onboardingV2.skip')}
          </Button>
        )}
        {clampedStep === TOTAL_STEPS - 1 && <div className="w-16" />}
      </div>

      {/* Progress bar */}
      <OnboardingProgress current={clampedStep} total={TOTAL_STEPS} />

      {/* Live region for step announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {t('onboardingV2.stepAnnounce')} {clampedStep + 1}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={clampedStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={transition}
          className="flex-1 px-4 py-6 flex flex-col w-full max-w-lg mx-auto"
        >
          <ErrorBoundary>
            <CurrentStep
              onNext={handleNext}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
