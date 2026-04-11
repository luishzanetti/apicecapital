import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore, UserProfile, InvestorType } from '@/store/appStore';
import { ArrowLeft, ChevronRight, DollarSign, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonalizedTiers } from '@/data/sampleData';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizQuestion {
  id: keyof UserProfile;
  question: string;
  subtitle: string;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'goal',
    question: "What's your primary goal?",
    subtitle: 'This shapes your recommended path',
    options: [
      { value: 'passive-income', label: 'Passive Income', description: 'Consistent returns over time' },
      { value: 'growth', label: 'Long-term Growth', description: 'Maximize capital appreciation' },
      { value: 'balanced', label: 'Balanced', description: 'Growth with stability' },
      { value: 'protection', label: 'Capital Protection', description: 'Preserve wealth first' },
    ],
  },
  {
    id: 'experience',
    question: 'Your crypto experience?',
    subtitle: 'We adapt complexity to your level',
    options: [
      { value: 'new', label: 'New', description: 'Just getting started' },
      { value: 'intermediate', label: 'Intermediate', description: 'Understand the basics' },
      { value: 'experienced', label: 'Experienced', description: 'Active in the market' },
    ],
  },
  {
    id: 'riskTolerance',
    question: 'Risk tolerance?',
    subtitle: 'Be honest—this affects your strategy',
    options: [
      { value: 'low', label: 'Low', description: 'Prefer stability over high returns' },
      { value: 'medium', label: 'Medium', description: 'Accept moderate fluctuations' },
      { value: 'high', label: 'High', description: 'Comfortable with significant volatility' },
    ],
  },
  {
    id: 'capitalRange',
    question: 'Starting capital?',
    subtitle: 'Helps match suitable strategies',
    options: [
      { value: 'under-200', label: 'Under $200', description: 'Testing the waters' },
      { value: '200-1k', label: '$200 – $1,000', description: 'Starter allocation' },
      { value: '1k-5k', label: '$1,000 – $5,000', description: 'Committed capital' },
      { value: '5k-plus', label: '$5,000+', description: 'Significant investment' },
    ],
  },
  {
    id: 'habitType',
    question: 'How active do you want to be?',
    subtitle: 'We can automate more or less',
    options: [
      { value: 'passive', label: 'Fully Passive', description: 'Set it and forget it' },
      { value: 'minimal', label: 'Minimal Actions', description: 'Quick daily check-ins' },
      { value: 'active', label: 'Active Learner', description: 'Engaged and learning' },
    ],
  },
  {
    id: 'preferredAssets',
    question: 'Preferred asset focus?',
    subtitle: 'Your comfort zone',
    options: [
      { value: 'btc-eth', label: 'BTC & ETH Only', description: 'Blue-chip focus' },
      { value: 'majors', label: 'Top Majors', description: 'Top 10 by market cap' },
      { value: 'majors-alts', label: 'Majors + Alts', description: 'Broader exposure' },
    ],
  },
  {
    id: 'weeklyInvestment' as any,
    question: 'How much to invest weekly?',
    subtitle: 'Consistency is key to the Apice methodology',
    options: [], // Dynamic options will be used
  },
];

function QuizInner() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const userProfile = useAppStore((s) => s.userProfile);
  const completeMissionTask = useAppStore((s) => s.completeMissionTask);
  const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);

  // Animation helpers for reduced motion
  const animDuration = prefersReducedMotion ? 0 : undefined;

  useEffect(() => {
    try {
      trackEvent(AnalyticsEvents.QUIZ_STARTED);
    } catch {
      // Analytics tracking is best-effort
    }
  }, []);

  // Focus management + smooth scroll on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      const container = contentRef.current;
      if (container) {
        const focusable = container.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    });
  }, [currentStep]);

  const currentQuestion = quizQuestions[currentStep];
  const totalSteps = quizQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentValue = currentStep < quizQuestions.length
    ? userProfile[currentQuestion?.id as keyof UserProfile]
    : useAppStore.getState().weeklyInvestment;

  // i18n mapping for quiz questions
  const quizI18nMap: Record<string, { question: string; subtitle: string; options: Record<string, { label: string; description: string }> }> = {
    goal: {
      question: t('quiz.goalQuestion'),
      subtitle: t('quiz.goalSubtitle'),
      options: {
        'passive-income': { label: t('quiz.goalPassiveIncome'), description: t('quiz.goalPassiveIncomeDesc') },
        'growth': { label: t('quiz.goalGrowth'), description: t('quiz.goalGrowthDesc') },
        'balanced': { label: t('quiz.goalBalanced'), description: t('quiz.goalBalancedDesc') },
        'protection': { label: t('quiz.goalProtection'), description: t('quiz.goalProtectionDesc') },
      },
    },
    experience: {
      question: t('quiz.expQuestion'),
      subtitle: t('quiz.expSubtitle'),
      options: {
        'new': { label: t('quiz.expNew'), description: t('quiz.expNewDesc') },
        'intermediate': { label: t('quiz.expIntermediate'), description: t('quiz.expIntermediateDesc') },
        'experienced': { label: t('quiz.expExperienced'), description: t('quiz.expExperiencedDesc') },
      },
    },
    riskTolerance: {
      question: t('quiz.riskQuestion'),
      subtitle: t('quiz.riskSubtitle'),
      options: {
        'low': { label: t('quiz.riskLow'), description: t('quiz.riskLowDesc') },
        'medium': { label: t('quiz.riskMedium'), description: t('quiz.riskMediumDesc') },
        'high': { label: t('quiz.riskHigh'), description: t('quiz.riskHighDesc') },
      },
    },
    capitalRange: {
      question: t('quiz.capitalQuestion'),
      subtitle: t('quiz.capitalSubtitle'),
      options: {
        'under-200': { label: t('quiz.capitalUnder200'), description: t('quiz.capitalUnder200Desc') },
        '200-1k': { label: t('quiz.capital200to1k'), description: t('quiz.capital200to1kDesc') },
        '1k-5k': { label: t('quiz.capital1kto5k'), description: t('quiz.capital1kto5kDesc') },
        '5k-plus': { label: t('quiz.capital5kPlus'), description: t('quiz.capital5kPlusDesc') },
      },
    },
    habitType: {
      question: t('quiz.habitQuestion'),
      subtitle: t('quiz.habitSubtitle'),
      options: {
        'passive': { label: t('quiz.habitPassive'), description: t('quiz.habitPassiveDesc') },
        'minimal': { label: t('quiz.habitMinimal'), description: t('quiz.habitMinimalDesc') },
        'active': { label: t('quiz.habitActive'), description: t('quiz.habitActiveDesc') },
      },
    },
    preferredAssets: {
      question: t('quiz.assetsQuestion'),
      subtitle: t('quiz.assetsSubtitle'),
      options: {
        'btc-eth': { label: t('quiz.assetsBtcEth'), description: t('quiz.assetsBtcEthDesc') },
        'majors': { label: t('quiz.assetsMajors'), description: t('quiz.assetsMajorsDesc') },
        'majors-alts': { label: t('quiz.assetsMajorsAlts'), description: t('quiz.assetsMajorsAltsDesc') },
      },
    },
    weeklyInvestment: {
      question: t('quiz.weeklyQuestion'),
      subtitle: t('quiz.weeklySubtitle'),
      options: {},
    },
  };

  // Calculate dynamic tiers for the last step
  const tiers = useMemo(() => {
    if (currentStep !== totalSteps - 1) return [];

    // Calculate a temporary investor type for the UI
    let type: InvestorType = 'Balanced Optimizer';
    if (userProfile.riskTolerance === 'low' || userProfile.goal === 'protection') {
      type = 'Conservative Builder';
    } else if (userProfile.riskTolerance === 'high' || userProfile.goal === 'growth') {
      type = 'Growth Seeker';
    }

    return getPersonalizedTiers(userProfile.capitalRange, type);
  }, [currentStep, userProfile.capitalRange, userProfile.riskTolerance, userProfile.goal, totalSteps]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/welcome');
    }
  };

  const handleSelect = (value: string | number) => {
    try {
      if (currentStep < quizQuestions.length) {
        updateUserProfile({ [currentQuestion.id]: value as any });
      } else {
        useAppStore.getState().setWeeklyInvestment(value as number);
      }

      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Synchronous: calculate type, mark missions, then navigate
        calculateInvestorType();
        completeMissionTask('m1_profileQuizDone');
        trackEvent(AnalyticsEvents.QUIZ_COMPLETED);
        navigate('/profile-result');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const qi18n = currentQuestion ? quizI18nMap[currentQuestion.id] : quizI18nMap['weeklyInvestment'];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            aria-label={t('quiz.back')}
            className="w-10 h-10 rounded-full glass-light flex items-center justify-center transition-colors hover:bg-secondary/80 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-caption text-muted-foreground font-medium">
            {currentStep + 1} / {totalSteps}
          </span>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-secondary rounded-full mb-10 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full apice-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="polite">
          {currentStep + 1} / {totalSteps}
        </div>

        {/* Question */}
        <div ref={contentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-2xl font-bold mb-2">{qi18n?.question ?? currentQuestion.question}</h1>
              <p className="text-muted-foreground text-sm mb-8">
                {qi18n?.subtitle ?? currentQuestion.subtitle}
              </p>

              {/* Options */}
              <div className="space-y-3" role="radiogroup" aria-label={qi18n?.question ?? currentQuestion.question}>
                {currentStep < quizQuestions.length - 1 ? (
                  currentQuestion.options.map((option, i) => {
                    const isSelected = currentValue === option.value;
                    const optI18n = qi18n?.options?.[option.value];
                    return (
                      <motion.button
                        key={option.value}
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: prefersReducedMotion ? 0 : i * 0.05, duration: animDuration }}
                        onClick={() => handleSelect(option.value)}
                        role="radio"
                        aria-checked={isSelected}
                        aria-selected={isSelected}
                        className={cn(
                          'w-full p-4 rounded-2xl border text-left transition-all duration-200 press-scale overflow-hidden',
                          isSelected
                            ? 'border-primary/40 glass-card border-glow-blue'
                            : 'glass-light hover:border-primary/30'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm mb-0.5 truncate">{optI18n?.label ?? option.label}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {optI18n?.description ?? option.description}
                            </p>
                          </div>
                          <ChevronRight className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            isSelected ? 'text-primary' : 'text-muted-foreground/30'
                          )} />
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  tiers.map((tier, i) => {
                    const isSelected = currentValue === tier.amount;
                    return (
                      <motion.button
                        key={tier.amount}
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: prefersReducedMotion ? 0 : i * 0.05, duration: animDuration }}
                        onClick={() => handleSelect(tier.amount)}
                        role="radio"
                        aria-checked={isSelected}
                        aria-selected={isSelected}
                        className={cn(
                          'w-full p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 press-scale relative overflow-hidden',
                          isSelected
                            ? 'glass-card border-glow-blue'
                            : 'glass-light hover:border-primary/30'
                        )}
                      >
                        {tier.recommended && (
                          <div className="absolute top-0 right-0">
                            <div className="text-[11px] px-2 py-0.5 bg-primary text-white font-bold rounded-bl-lg">
                              {t('quiz.recommended')}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-xl sm:text-2xl shrink-0">{tier.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-semibold text-sm truncate">{tier.label}</h3>
                              <div className="text-[11px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium uppercase tracking-wider shrink-0">
                                {tier.tag}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                              {tier.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-primary">${tier.amount}</p>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">/week</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Skip option */}
        <div className="mt-auto pt-6">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            aria-label={t('quiz.skip')}
            onClick={() => {
              if (currentStep < totalSteps - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                navigate('/home');
              }
            }}
          >
            {t('quiz.skip')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Wrap in ErrorBoundary for error handling
export default function Quiz() {
  return (
    <ErrorBoundary>
      <QuizInner />
    </ErrorBoundary>
  );
}
