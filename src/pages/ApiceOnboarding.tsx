import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Compass,
  Radar,
  Shield,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useAppStore, type UserProfile } from '@/store/appStore';
import { getReturnLabel, getReturnRateForInvestorType } from '@/data/sampleData';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const TOTAL_STEPS = 4;
const QUICK_AMOUNTS = [50, 100, 250, 500];
const MIN_WEEKLY_AMOUNT = 25;
const MAX_WEEKLY_AMOUNT = 1500;
const STEP_SIZE = 25;

const goalOptions: Array<{
  value: NonNullable<UserProfile['goal']>;
  label: string;
  description: string;
}> = [
  {
    value: 'passive-income',
    label: 'Strategic income',
    description: 'I want to build a capital machine with consistency.',
  },
  {
    value: 'growth',
    label: 'Maximum growth',
    description: 'I seek more aggressive expansion with risk management.',
  },
  {
    value: 'balanced',
    label: 'Balanced growth',
    description: 'I want to accelerate without losing portfolio coherence.',
  },
  {
    value: 'protection',
    label: 'Smart preservation',
    description: 'I prefer a strong base and more defensive decisions.',
  },
];

const experienceOptions: Array<{
  value: NonNullable<UserProfile['experience']>;
  label: string;
  description: string;
}> = [
  {
    value: 'new',
    label: 'New to this market',
    description: 'I need clarity, step-by-step guidance, and structure.',
  },
  {
    value: 'intermediate',
    label: 'Already investing',
    description: 'I understand the market, but want to organize my execution better.',
  },
  {
    value: 'experienced',
    label: 'Experienced profile',
    description: 'I want a more sophisticated framework to scale decisions.',
  },
];

const riskOptions: Array<{
  value: NonNullable<UserProfile['riskTolerance']>;
  label: string;
  description: string;
}> = [
  {
    value: 'low',
    label: 'Conservative',
    description: 'Priority on protection, stability, and a solid base.',
  },
  {
    value: 'medium',
    label: 'Moderate',
    description: 'I accept fluctuations with a focus on adjusted growth.',
  },
  {
    value: 'high',
    label: 'Aggressive',
    description: 'I seek greater acceleration with calculated risk.',
  },
];

const capitalOptions: Array<{
  value: NonNullable<UserProfile['capitalRange']>;
  label: string;
  description: string;
}> = [
  {
    value: 'under-200',
    label: 'Up to $200',
    description: 'Entry phase, method validation, and habit building.',
  },
  {
    value: '200-1k',
    label: '$200 to $1,000',
    description: 'Room for a strong base and initial diversification.',
  },
  {
    value: '1k-5k',
    label: '$1,000 to $5,000',
    description: 'A fuller setup with an intelligent portfolio.',
  },
  {
    value: '5k-plus',
    label: 'Above $5,000',
    description: 'Robust structure to scale execution and allocation.',
  },
];

const blueprintByInvestorType = {
  'Conservative Builder': {
    title: 'Defensive base with AI',
    description:
      'The setup prioritizes anchor assets, protection, and constant risk reads to grow without depending on extreme moves.',
    allocation: [
      { symbol: 'BTC', allocation: 55 },
      { symbol: 'ETH', allocation: 30 },
      { symbol: 'USDT', allocation: 15 },
    ],
    execution: 'Discipline, tactical reserve, and conservative rebalancing.',
  },
  'Balanced Optimizer': {
    title: 'Apice smart diversification',
    description:
      'The setup combines a strong base, selective exposure, and AI to adjust allocation, context, and growth pace.',
    allocation: [
      { symbol: 'BTC', allocation: 40 },
      { symbol: 'ETH', allocation: 25 },
      { symbol: 'SOL', allocation: 20 },
      { symbol: 'LINK', allocation: 15 },
    ],
    execution: 'Balance between structure, timing, and portfolio expansion.',
  },
  'Growth Seeker': {
    title: 'Aggressive expansion with risk management',
    description:
      'The setup enters growth with more intensity, keeping AI, criteria, and protection to avoid improvisation.',
    allocation: [
      { symbol: 'BTC', allocation: 30 },
      { symbol: 'ETH', allocation: 20 },
      { symbol: 'SOL', allocation: 20 },
      { symbol: 'ARB', allocation: 15 },
      { symbol: 'INJ', allocation: 15 },
    ],
    execution: 'More beta, more opportunity, and more context control.',
  },
} as const;

function determineInvestorType(
  goal: UserProfile['goal'],
  riskTolerance: UserProfile['riskTolerance']
) {
  if (riskTolerance === 'low' || goal === 'protection') {
    return 'Conservative Builder' as const;
  }

  if (riskTolerance === 'high' || goal === 'growth') {
    return 'Growth Seeker' as const;
  }

  return 'Balanced Optimizer' as const;
}

function projectWeeklyPlan(weeklyAmount: number, annualRate: number, years: number) {
  const weeklyRate = Math.pow(1 + annualRate, 1 / 52) - 1;
  let total = 0;

  for (let week = 0; week < years * 52; week += 1) {
    total = (total + weeklyAmount) * (1 + weeklyRate);
  }

  return Math.round(total);
}

function formatUSD(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function OnboardingOption({
  selected,
  label,
  description,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-3xl border px-4 py-4 text-left transition-all duration-200',
        selected
          ? 'border-primary/60 bg-primary/12 shadow-[0_0_30px_rgba(82,143,255,0.16)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
      )}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-xs leading-6 text-white/58">{description}</p>
    </button>
  );
}

function ActionTile({
  title,
  body,
  actionLabel,
  onClick,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/62">{body}</p>
      <Button
        variant="outline"
        className="mt-4 w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        onClick={onClick}
      >
        {actionLabel}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function ApiceOnboarding() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const userProfile = useAppStore((state) => state.userProfile);
  const weeklyInvestment = useAppStore((state) => state.weeklyInvestment);
  const persistedStep = useAppStore((state) => state.onboardingStep);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const calculateInvestorType = useAppStore((state) => state.calculateInvestorType);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const startFreeTrial = useAppStore((state) => state.startFreeTrial);
  const setWeeklyInvestment = useAppStore((state) => state.setWeeklyInvestment);
  const completeMissionTask = useAppStore((state) => state.completeMissionTask);
  const completeWizardStep = useAppStore((state) => state.completeWizardStep);
  const setOnboardingStep = useAppStore((state) => state.setOnboardingStep);
  const skipOnboarding = useAppStore((state) => state.skipOnboarding);

  const [step, setStepLocal] = useState(() => Math.min(persistedStep || 0, TOTAL_STEPS - 1));
  const [goal, setGoal] = useState<UserProfile['goal']>(userProfile.goal);
  const [experience, setExperience] = useState<UserProfile['experience']>(userProfile.experience);
  const [riskTolerance, setRiskTolerance] = useState<UserProfile['riskTolerance']>(userProfile.riskTolerance);
  const [capitalRange, setCapitalRange] = useState<UserProfile['capitalRange']>(userProfile.capitalRange);
  const [localWeeklyAmount, setLocalWeeklyAmount] = useState(
    weeklyInvestment > 0 ? weeklyInvestment : 150
  );

  const canContinueProfile = Boolean(goal && experience && riskTolerance && capitalRange);
  const investorTypePreview = useMemo(
    () => determineInvestorType(goal, riskTolerance),
    [goal, riskTolerance]
  );
  const strategyBlueprint = blueprintByInvestorType[investorTypePreview];
  const annualRate = getReturnRateForInvestorType(investorTypePreview);
  const returnLabel = getReturnLabel(investorTypePreview);
  const projections = useMemo(
    () => ({
      oneYear: projectWeeklyPlan(localWeeklyAmount, annualRate, 1),
      threeYears: projectWeeklyPlan(localWeeklyAmount, annualRate, 3),
      fiveYears: projectWeeklyPlan(localWeeklyAmount, annualRate, 5),
    }),
    [annualRate, localWeeklyAmount]
  );

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

  function setStep(nextStep: number) {
    setStepLocal(nextStep);
    setOnboardingStep(nextStep);
  }

  function handleBack() {
    if (step === 0) {
      navigate(-1);
      return;
    }

    setStep(step - 1);
  }

  function handleSkip() {
    skipOnboarding();
    setOnboardingStep(0);
    navigate('/home', { replace: true });
  }

  function handleProfileContinue() {
    if (!canContinueProfile) {
      return;
    }

    completeWizardStep('aiTrade', 'profile-defined');
    setStep(2);
  }

  function handleWeeklyAmountChange(values: number[]) {
    const snapped = Math.round(values[0] / STEP_SIZE) * STEP_SIZE;
    setLocalWeeklyAmount(Math.max(MIN_WEEKLY_AMOUNT, Math.min(MAX_WEEKLY_AMOUNT, snapped)));
  }

  function completeOnboardingFlow(destination: string, wizardStep?: string) {
    updateUserProfile({
      goal,
      experience,
      riskTolerance,
      capitalRange,
    });
    calculateInvestorType();
    setWeeklyInvestment(localWeeklyAmount);
    completeMissionTask('m2_methodologyRead');
    completeMissionTask('m3_strategyChosen');
    completeMissionTask('m1_profileQuizDone');
    if (wizardStep) {
      completeWizardStep('aiTrade', wizardStep);
    }
    completeWizardStep('aiTrade', 'onboarding-completed');
    completeOnboarding();
    startFreeTrial();
    setOnboardingStep(0);

    trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      onboarding: 'apice-ai-trade-setup',
      investorType: investorTypePreview,
      weeklyAmount: localWeeklyAmount,
    });

    navigate(destination, { replace: true });
  }

  function handleFinish() {
    completeOnboardingFlow('/home');
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,143,255,0.14),transparent_30%),linear-gradient(180deg,#050816_0%,#081120_36%,#050816_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:80px_80px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-6 md:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-colors hover:bg-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Apice Onboarding</p>
            <p className="mt-1 text-sm text-white/68">
              Step {step + 1} of {TOTAL_STEPS}
            </p>
          </div>

          <Button
            variant="ghost"
            className="text-white/60 hover:bg-white/[0.06] hover:text-white"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
            className="h-full rounded-full bg-[linear-gradient(90deg,#528fff,#f6c85b)] transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          You are on step {step + 1} of the Apice onboarding.
        </div>

        <div className="flex flex-1 items-center py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -20 }}
              transition={transition}
              className="w-full"
            >
              {step === 0 && (
                <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                  <div>
                    <Badge className="border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/[0.05]">
                      AI Trade Setup + Apice Methodology
                    </Badge>
                    <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-white md:text-6xl">
                      First you understand the engine. Then you accelerate the capital.
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                      This onboarding is designed to explain how the AI Trade Setup fits into
                      the Apice vision: smart diversification, 24/7 operations,
                      continuous result reads, and daily portfolio growth with AI support.
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {[
                        {
                          icon: Brain,
                          title: 'Understand the method',
                          body: 'The setup is not a shortcut. It is a structure for operating with logic.',
                        },
                        {
                          icon: Workflow,
                          title: 'Configure the tool',
                          body: 'You leave with the clear mission to access, align, and activate operations.',
                        },
                        {
                          icon: Radar,
                          title: 'Grow every day',
                          body: 'AI steps in to guide the next portfolio move with consistency.',
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                        >
                          <item.icon className="w-5 h-5 text-[#78aaff]" />
                          <p className="mt-4 text-base font-semibold text-white">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-white/60">{item.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="premium"
                        size="xl"
                        className="h-14 rounded-2xl px-8 text-base"
                        onClick={() => setStep(1)}
                      >
                        Start my setup
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="xl"
                        className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                        onClick={handleSkip}
                      >
                        Go straight to dashboard
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(82,143,255,0.14),rgba(5,8,22,0.25))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/42">Apice Vision</p>
                    <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                      Smart wealth is born from process, not impulse.
                    </p>

                    <div className="mt-6 space-y-4">
                      {[
                        'Diversifying with AI prevents the portfolio from depending on a single win.',
                        'Operating 24/7 with method reduces lost timing and improves consistency.',
                        'Daily analysis keeps the setup adjusted to the market and your profile.',
                      ].map((item, index) => (
                        <div key={item} className="flex gap-4 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                          <span className="text-2xl font-semibold tracking-tight text-white/24">0{index + 1}</span>
                          <p className="text-sm leading-7 text-white/64">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-white/42">Profile and context</p>
                    <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
                      The right setup starts with the right profile.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-white/64">
                      Instead of pushing a generic tool, Apice organizes the flow
                      based on your goal, experience, risk, and available capital.
                    </p>

                    <div className="mt-8 space-y-6">
                      <section>
                        <p className="mb-3 text-sm font-semibold text-white">Primary goal</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {goalOptions.map((option) => (
                            <OnboardingOption
                              key={option.value}
                              selected={goal === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setGoal(option.value)}
                            />
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="mb-3 text-sm font-semibold text-white">Your experience</p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {experienceOptions.map((option) => (
                            <OnboardingOption
                              key={option.value}
                              selected={experience === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setExperience(option.value)}
                            />
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="mb-3 text-sm font-semibold text-white">Risk tolerance</p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {riskOptions.map((option) => (
                            <OnboardingOption
                              key={option.value}
                              selected={riskTolerance === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setRiskTolerance(option.value)}
                            />
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="mb-3 text-sm font-semibold text-white">Initial capital range</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {capitalOptions.map((option) => (
                            <OnboardingOption
                              key={option.value}
                              selected={capitalRange === option.value}
                              label={option.label}
                              description={option.description}
                              onClick={() => setCapitalRange(option.value)}
                            />
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        size="xl"
                        className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button
                        variant="premium"
                        size="xl"
                        className="h-14 rounded-2xl px-8 text-base"
                        onClick={handleProfileContinue}
                        disabled={!canContinueProfile}
                      >
                        Set my profile
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/42">Setup preview</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                      {investorTypePreview}
                    </p>
                    <p className="mt-2 text-sm text-[#f6c85b]">{strategyBlueprint.title}</p>
                    <p className="mt-4 text-sm leading-7 text-white/64">
                      {strategyBlueprint.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {strategyBlueprint.allocation.map((asset) => (
                        <div key={asset.symbol}>
                          <div className="mb-2 flex items-center justify-between text-xs text-white/58">
                            <span>{asset.symbol}</span>
                            <span>{asset.allocation}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#528fff,#f6c85b)]"
                              style={{ width: `${asset.allocation}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/42">AI Read</p>
                      <p className="mt-3 text-sm leading-7 text-white/64">
                        {strategyBlueprint.execution}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-white/42">Budget and structure</p>
                    <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
                      Now we define the strength of your weekly engine.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-white/64">
                      This value serves as an execution reference. You can later convert it
                      to your operational routine within the app and the partner tool.
                    </p>

                    <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                      <div className="text-center">
                        <p className="text-sm text-white/48">Recommended weekly budget</p>
                        <p className="mt-3 text-5xl font-semibold tracking-tight text-white">
                          {formatUSD(localWeeklyAmount)}
                        </p>
                        <p className="mt-2 text-sm text-white/54">per week</p>
                      </div>

                      <div className="mt-8">
                        <Slider
                          value={[localWeeklyAmount]}
                          onValueChange={handleWeeklyAmountChange}
                          min={MIN_WEEKLY_AMOUNT}
                          max={MAX_WEEKLY_AMOUNT}
                          step={STEP_SIZE}
                          aria-label="Weekly setup amount"
                        />
                        <div className="mt-3 flex justify-between text-xs text-white/46">
                          <span>{formatUSD(MIN_WEEKLY_AMOUNT)}</span>
                          <span>{formatUSD(MAX_WEEKLY_AMOUNT)}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {QUICK_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setLocalWeeklyAmount(amount)}
                            className={cn(
                              'rounded-2xl px-4 py-2 text-sm font-medium transition-all',
                              localWeeklyAmount === amount
                                ? 'bg-primary text-white shadow-[0_0_30px_rgba(82,143,255,0.18)]'
                                : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.08]'
                            )}
                          >
                            {formatUSD(amount)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">1 year</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{formatUSD(projections.oneYear)}</p>
                      </div>
                      <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">3 years</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{formatUSD(projections.threeYears)}</p>
                      </div>
                      <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(82,143,255,0.14),rgba(5,8,22,0.25))] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">5 years</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{formatUSD(projections.fiveYears)}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-6 text-white/44">
                      Educational scenario based on the {investorTypePreview} profile and target return
                      of the Apice methodology ({returnLabel}). This does not represent a guaranteed result.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        size="xl"
                        className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button
                        variant="premium"
                        size="xl"
                        className="h-14 rounded-2xl px-8 text-base"
                        onClick={() => {
                          completeWizardStep('aiTrade', 'budget-defined');
                          setStep(3);
                        }}
                      >
                        Review final mission
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex items-center gap-3">
                      <Compass className="w-5 h-5 text-[#78aaff]" />
                      <p className="text-sm font-semibold text-white">Apice suggested setup</p>
                    </div>

                    <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                      {strategyBlueprint.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/64">
                      {strategyBlueprint.description}
                    </p>

                    <div className="mt-6 rounded-[26px] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 shrink-0 text-[#78aaff]" />
                        <div>
                          <p className="text-sm font-semibold text-white">Role of AI</p>
                          <p className="mt-2 text-sm leading-7 text-white/62">
                            AI steps in to analyze context, sustain execution discipline,
                            and guide strategic decisions without relying on emotion.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[26px] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 shrink-0 text-[#f6c85b]" />
                        <div>
                          <p className="text-sm font-semibold text-white">Structural protection</p>
                          <p className="mt-2 text-sm leading-7 text-white/62">
                            Diversification and risk management prevent growth from depending on a single move.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(82,143,255,0.14),rgba(5,8,22,0.25))] p-6">
                    <Badge className="border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/[0.05]">
                      Mission ready
                    </Badge>
                    <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white">
                      Your onboarding is now an operational plan.
                    </h2>
                    <p className="mt-4 text-base leading-8 text-white/66">
                      The next move is simple: access the tool at the right point,
                      configure your operation, and track portfolio evolution with Apice AI.
                    </p>

                    <div className="mt-8 space-y-4">
                      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Profile</p>
                        <p className="mt-2 text-lg font-semibold text-white">{investorTypePreview}</p>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Suggested setup</p>
                        <p className="mt-2 text-lg font-semibold text-white">{strategyBlueprint.title}</p>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">Weekly budget</p>
                        <p className="mt-2 text-lg font-semibold text-white">{formatUSD(localWeeklyAmount)}</p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[26px] border border-emerald-400/18 bg-emerald-400/8 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
                        <p className="text-sm leading-7 text-emerald-100/82">
                          Apice serves as method and decision intelligence. You keep control of the structure and capital.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-white/42">Next steps</p>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <ActionTile
                        title="Open guest access"
                        body="This is where you enter the correct external point. This is the only place in the flow where the original reference appears."
                        actionLabel="View access"
                        onClick={() => completeOnboardingFlow('/referrals', 'guest-access-opened')}
                      />
                      <ActionTile
                        title="Configure the plan in the app"
                        body="Take the weekly budget to the DCA Planner and adjust your execution within the Apice ecosystem."
                        actionLabel="Open planner"
                        onClick={() => completeOnboardingFlow('/dca-planner', 'planner-opened')}
                      />
                      <ActionTile
                        title="Follow AI daily"
                        body="Use the dashboard, insights, and portfolio analysis to grow with objective recommendations every day."
                        actionLabel="Go to dashboard"
                        onClick={() => completeOnboardingFlow('/home', 'dashboard-opened')}
                      />
                    </div>

                    <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                      <div className="flex items-start gap-4">
                        <Bot className="w-5 h-5 shrink-0 text-[#78aaff]" />
                        <div>
                          <p className="text-base font-semibold text-white">The role of AI after setup</p>
                          <p className="mt-3 text-sm leading-7 text-white/64">
                            After configuration, the focus shifts to result reads,
                            allocation adjustments, strategic timing, and execution discipline.
                            This is what transforms the setup into real portfolio growth.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        size="xl"
                        className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                        onClick={handleBack}
                      >
                        Adjust setup
                      </Button>
                      <Button
                        variant="premium"
                        size="xl"
                        className="h-14 rounded-2xl px-8 text-base"
                        onClick={handleFinish}
                      >
                        Complete onboarding
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
