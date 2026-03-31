import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useOnboardingV2Store } from '@/store/slices/onboardingV2Slice';
import { cn } from '@/lib/utils';
import {
  PiggyBank,
  TrendingUp,
  Landmark,
  Layers,
  GraduationCap,
  BarChart3,
  Rocket,
  Shield,
  Scale,
  Flame,
} from 'lucide-react';

interface StepProfileProps {
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

type SubStep = 'goal' | 'experience' | 'risk';

interface QuestionOption {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
}

const goalOptions: QuestionOption[] = [
  { id: 'savings', labelKey: 'onboardingV2.goalSavings', icon: <PiggyBank className="w-5 h-5" /> },
  { id: 'growth', labelKey: 'onboardingV2.goalGrowth', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'retirement', labelKey: 'onboardingV2.goalRetirement', icon: <Landmark className="w-5 h-5" /> },
  { id: 'diversify', labelKey: 'onboardingV2.goalDiversify', icon: <Layers className="w-5 h-5" /> },
];

const experienceOptions: QuestionOption[] = [
  { id: 'beginner', labelKey: 'onboardingV2.expBeginner', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'intermediate', labelKey: 'onboardingV2.expIntermediate', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'advanced', labelKey: 'onboardingV2.expAdvanced', icon: <Rocket className="w-5 h-5" /> },
];

const riskOptions: QuestionOption[] = [
  { id: 'conservative', labelKey: 'onboardingV2.riskConservative', icon: <Shield className="w-5 h-5" /> },
  { id: 'moderate', labelKey: 'onboardingV2.riskModerate', icon: <Scale className="w-5 h-5" /> },
  { id: 'aggressive', labelKey: 'onboardingV2.riskAggressive', icon: <Flame className="w-5 h-5" /> },
];

const SUB_STEPS: SubStep[] = ['goal', 'experience', 'risk'];

export function StepProfile({ onNext }: StepProfileProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const {
    goal,
    experience,
    riskProfile,
    setGoal,
    setExperience,
    setRiskProfile,
  } = useOnboardingV2Store();

  const [subStep, setSubStep] = useState<number>(() => {
    // Resume from where user left off
    if (!goal) return 0;
    if (!experience) return 1;
    if (!riskProfile) return 2;
    return 0;
  });

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: 'easeOut' };

  const currentSubStep = SUB_STEPS[subStep];

  function getConfig(): {
    titleKey: string;
    options: QuestionOption[];
    selected: string | null;
  } {
    switch (currentSubStep) {
      case 'goal':
        return { titleKey: 'onboardingV2.goalTitle', options: goalOptions, selected: goal };
      case 'experience':
        return { titleKey: 'onboardingV2.expTitle', options: experienceOptions, selected: experience };
      case 'risk':
        return { titleKey: 'onboardingV2.riskTitle', options: riskOptions, selected: riskProfile };
      default:
        return { titleKey: '', options: [], selected: null };
    }
  }

  function handleSelect(id: string) {
    switch (currentSubStep) {
      case 'goal':
        setGoal(id as 'savings' | 'growth' | 'retirement' | 'diversify');
        break;
      case 'experience':
        setExperience(id as 'beginner' | 'intermediate' | 'advanced');
        break;
      case 'risk':
        setRiskProfile(id as 'conservative' | 'moderate' | 'aggressive');
        break;
    }

    // Auto-advance
    if (subStep < SUB_STEPS.length - 1) {
      setSubStep(subStep + 1);
    } else {
      onNext();
    }
  }

  const { titleKey, options, selected } = getConfig();

  return (
    <div className="flex flex-col flex-1">
      {/* Live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {t('onboardingV2.stepAnnounce')} {subStep + 1}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSubStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={transition}
        >
          <h2 className="text-2xl font-bold mb-6">{t(titleKey)}</h2>

          <div
            className={cn(
              'grid gap-3',
              options.length === 4
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            )}
            role="radiogroup"
            aria-label={t(titleKey)}
          >
            {options.map((option, i) => (
              <motion.button
                key={option.id}
                role="radio"
                aria-checked={selected === option.id}
                aria-label={t(option.labelKey)}
                tabIndex={0}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: i * 0.05, duration: 0.15 }
                }
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                onClick={() => handleSelect(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(option.id);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-150',
                  selected === option.id
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    selected === option.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {option.icon}
                </div>
                <span className="font-medium text-sm">{t(option.labelKey)}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sub-step dots indicator */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {SUB_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              i === subStep ? 'bg-primary w-6' : 'bg-secondary'
            )}
          />
        ))}
      </div>
    </div>
  );
}
