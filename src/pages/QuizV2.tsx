import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Coins,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore, UserProfile, InvestorType } from "@/store/appStore";
import { getPersonalizedTiers } from "@/data/sampleData";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Quiz v2 — premium dark funnel matching AiTradeLanding aesthetic.
 * - EN-only copy (no i18n indirection)
 * - Apice gradient tokens (blue → violet → gold)
 * - Reuses Quiz v1 business logic: updateUserProfile, calculateInvestorType,
 *   trackEvent, getPersonalizedTiers, mission completion.
 */

type OptionIcon = typeof Target;

interface QuizOption {
  value: string;
  label: string;
  description: string;
  icon: OptionIcon;
}

interface QuizQuestion {
  id: keyof UserProfile | "weeklyInvestment";
  sectionIcon: OptionIcon;
  tag: string;
  question: string;
  subtitle: string;
  helper?: string;
  options?: QuizOption[];
  dynamic?: boolean;
}

const questions: QuizQuestion[] = [
  {
    id: "goal",
    sectionIcon: Target,
    tag: "Goal",
    question: "What matters most to you?",
    subtitle: "This shapes the entire setup — we'll recommend a strategy aligned with your primary goal.",
    options: [
      {
        value: "passive-income",
        label: "Passive income",
        description: "Consistent returns over time, minimal effort.",
        icon: Coins,
      },
      {
        value: "growth",
        label: "Long-term growth",
        description: "Maximize capital appreciation with patience.",
        icon: BarChart3,
      },
      {
        value: "balanced",
        label: "Balanced mix",
        description: "Growth with meaningful stability rails.",
        icon: Sparkles,
      },
      {
        value: "protection",
        label: "Capital protection",
        description: "Preserve what you have, grow cautiously.",
        icon: Shield,
      },
    ],
  },
  {
    id: "experience",
    sectionIcon: Brain,
    tag: "Experience",
    question: "How familiar are you with crypto?",
    subtitle: "We adapt the depth and pace of recommendations to match your context.",
    options: [
      {
        value: "new",
        label: "Just getting started",
        description: "New to crypto. Curious and cautious.",
        icon: Sparkles,
      },
      {
        value: "intermediate",
        label: "Intermediate",
        description: "I understand the basics and track the market.",
        icon: BarChart3,
      },
      {
        value: "experienced",
        label: "Experienced",
        description: "Active operator — comfortable with tools and risk.",
        icon: Brain,
      },
    ],
  },
  {
    id: "riskTolerance",
    sectionIcon: Shield,
    tag: "Risk",
    question: "How much volatility can you sit with?",
    subtitle: "Be honest — this decides your allocation and stop-loss rules.",
    helper: "No wrong answer; we protect both extremes.",
    options: [
      {
        value: "low",
        label: "Low",
        description: "Prefer stability. Losses keep me up at night.",
        icon: Shield,
      },
      {
        value: "medium",
        label: "Medium",
        description: "Comfortable with moderate swings — no panic.",
        icon: BarChart3,
      },
      {
        value: "high",
        label: "High",
        description: "Bring on volatility — I see opportunity in noise.",
        icon: Zap,
      },
    ],
  },
  {
    id: "capitalRange",
    sectionIcon: Wallet,
    tag: "Capital",
    question: "How much are you starting with?",
    subtitle: "Helps match the right strategies — no judgment, nothing off the table.",
    options: [
      {
        value: "under-200",
        label: "Under $200",
        description: "Testing the waters, building the habit.",
        icon: Sparkles,
      },
      {
        value: "200-1k",
        label: "$200 – $1,000",
        description: "Starter allocation, room to compound.",
        icon: Coins,
      },
      {
        value: "1k-5k",
        label: "$1,000 – $5,000",
        description: "Committed capital — real skin in the game.",
        icon: BarChart3,
      },
      {
        value: "5k-plus",
        label: "$5,000+",
        description: "Significant position — serious infrastructure.",
        icon: Wallet,
      },
    ],
  },
  {
    id: "habitType",
    sectionIcon: Bot,
    tag: "Habit",
    question: "How hands-on do you want to be?",
    subtitle: "We can automate more or less — pick what matches your life, not your ideals.",
    options: [
      {
        value: "passive",
        label: "Fully passive",
        description: "Set it and forget it. Weekly report is enough.",
        icon: Bot,
      },
      {
        value: "minimal",
        label: "Quick check-ins",
        description: "Five minutes a day, nothing more.",
        icon: CalendarClock,
      },
      {
        value: "active",
        label: "Active learner",
        description: "I want to understand and engage daily.",
        icon: Brain,
      },
    ],
  },
  {
    id: "preferredAssets",
    sectionIcon: Coins,
    tag: "Assets",
    question: "Where do you feel comfortable?",
    subtitle: "We'll always include safer bases — this tunes the rest of the basket.",
    options: [
      {
        value: "btc-eth",
        label: "BTC & ETH only",
        description: "Blue chip only. Conviction over breadth.",
        icon: Shield,
      },
      {
        value: "majors",
        label: "Top majors",
        description: "Top 10 by market cap. Liquidity-first.",
        icon: BarChart3,
      },
      {
        value: "majors-alts",
        label: "Majors + selected alts",
        description: "Broader exposure with disciplined limits.",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "weeklyInvestment",
    sectionIcon: CalendarClock,
    tag: "Weekly",
    question: "Pick your weekly commitment.",
    subtitle: "Consistency is the Apice edge — it compounds faster than timing.",
    helper: "Change anytime from Settings.",
    dynamic: true,
  },
];

function QuizV2Inner() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);

  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const userProfile = useAppStore((s) => s.userProfile);
  const completeMissionTask = useAppStore((s) => s.completeMissionTask);
  const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);
  const setWeeklyInvestment = useAppStore((s) => s.setWeeklyInvestment);
  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);

  useEffect(() => {
    try {
      trackEvent(AnalyticsEvents.QUIZ_STARTED, { variant: "v2" });
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => {
      contentRef.current
        ?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus();
    });
  }, [currentStep]);

  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const stepLabel = String(currentStep + 1).padStart(2, "0");
  const totalLabel = String(totalSteps).padStart(2, "0");

  const currentValue = currentQuestion.dynamic
    ? weeklyInvestment
    : (userProfile[currentQuestion.id as keyof UserProfile] as string | undefined);

  const tiers = useMemo(() => {
    if (!currentQuestion.dynamic) return [];
    let type: InvestorType = "Balanced Optimizer";
    if (userProfile.riskTolerance === "low" || userProfile.goal === "protection") {
      type = "Conservative Builder";
    } else if (userProfile.riskTolerance === "high" || userProfile.goal === "growth") {
      type = "Growth Seeker";
    }
    return getPersonalizedTiers(userProfile.capitalRange, type);
  }, [currentQuestion.dynamic, userProfile.riskTolerance, userProfile.goal, userProfile.capitalRange]);

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate("/welcome");
    }
  }

  function handleSelect(value: string | number) {
    try {
      if (currentQuestion.dynamic) {
        setWeeklyInvestment(Number(value));
      } else {
        updateUserProfile({ [currentQuestion.id]: value as UserProfile[keyof UserProfile] });
      }

      if (currentStep < totalSteps - 1) {
        setCurrentStep((s) => s + 1);
        return;
      }

      calculateInvestorType();
      completeMissionTask("m1_profileQuizDone");
      trackEvent(AnalyticsEvents.QUIZ_COMPLETED, { variant: "v2" });
      navigate("/profile-result");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  function handleSkip() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      navigate("/home");
    }
  }

  const SectionIcon = currentQuestion.sectionIcon;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
      {/* Background decor */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,143,255,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(234,179,8,0.08),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(155,135,245,0.14),transparent_25%),linear-gradient(180deg,#0F1626_0%,#152038_40%,#0F1626_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-10 pt-6 md:px-8 md:pt-10">
        {/* Header row: back + step label + skip */}
        <header className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3">
            <SectionIcon
              aria-hidden="true"
              className="h-4 w-4 text-[hsl(var(--apice-gold))]"
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
              {currentQuestion.tag}
            </span>
            <span className="text-[11px] font-medium text-white/40">
              {stepLabel} <span className="text-white/25">/ {totalLabel}</span>
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            aria-label="Skip this question"
            className="hidden text-xs text-white/50 hover:text-white md:inline-flex"
          >
            Skip
          </Button>

          <div className="md:hidden w-11" />
        </header>

        {/* Progress bar */}
        <div
          className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Quiz progress"
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(var(--apice-gradient-start)), hsl(var(--apice-gradient-end)) 50%, hsl(var(--apice-gold)))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: "easeOut" }}
          />
        </div>

        <div className="sr-only" aria-live="polite">
          Step {currentStep + 1} of {totalSteps}: {currentQuestion.question}
        </div>

        {/* Question + options */}
        <div ref={contentRef} className="flex flex-1 flex-col justify-center py-10 md:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuestionHeader
                stepLabel={stepLabel}
                totalLabel={totalLabel}
                question={currentQuestion.question}
                subtitle={currentQuestion.subtitle}
                helper={currentQuestion.helper}
              />

              {currentQuestion.dynamic ? (
                <TiersGrid
                  tiers={tiers}
                  currentValue={currentValue as number | undefined}
                  onSelect={handleSelect}
                  prefersReducedMotion={prefersReducedMotion ?? false}
                />
              ) : (
                <OptionsGrid
                  options={currentQuestion.options ?? []}
                  currentValue={currentValue as string | undefined}
                  onSelect={handleSelect}
                  prefersReducedMotion={prefersReducedMotion ?? false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <footer className="mt-auto flex items-center justify-between gap-4 border-t border-white/5 pt-5 text-xs text-white/40">
          <span>
            Step <span className="font-semibold text-white/70 tabular-nums">{stepLabel}</span> of{" "}
            <span className="tabular-nums">{totalLabel}</span>
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full px-3 py-1 text-xs font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626] md:hidden"
          >
            Skip
          </button>
        </footer>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Question header
// ────────────────────────────────────────────────────────────

function QuestionHeader({
  stepLabel,
  totalLabel,
  question,
  subtitle,
  helper,
}: {
  stepLabel: string;
  totalLabel: string;
  question: string;
  subtitle: string;
  helper?: string;
}) {
  return (
    <div className="max-w-3xl">
      <span className="font-display text-[110px] font-semibold leading-none text-white/5 select-none tabular-nums md:text-[160px]">
        {stepLabel}
      </span>

      <h1 className="font-display mt-[-48px] text-balance bg-gradient-to-br from-white via-white/90 to-white/55 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-transparent md:mt-[-64px] md:text-6xl">
        {question}
      </h1>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
        {subtitle}
      </p>

      {helper && (
        <p className="mt-3 text-xs uppercase tracking-[0.28em] text-[hsl(var(--apice-gold))]/80">
          {helper}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Options grid
// ────────────────────────────────────────────────────────────

function OptionsGrid({
  options,
  currentValue,
  onSelect,
  prefersReducedMotion,
}: {
  options: QuizOption[];
  currentValue?: string;
  onSelect: (value: string) => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className="mt-10 grid gap-3 md:mt-12 md:grid-cols-2"
    >
      {options.map((option, idx) => {
        const selected = currentValue === option.value;
        const Icon = option.icon;
        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(option.value)}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : idx * 0.05, duration: 0.35 }}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            className={cn(
              "group relative overflow-hidden rounded-3xl border p-5 text-left backdrop-blur transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]",
              selected
                ? "border-[hsl(var(--apice-gold))]/40 bg-white/[0.04] shadow-[0_0_0_1px_hsl(var(--apice-gold)/0.2),0_20px_60px_-20px_hsl(var(--apice-gold)/0.3)]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            )}
          >
            {/* Hover glow */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
                !selected && "group-hover:opacity-100"
              )}
              style={{
                background:
                  "radial-gradient(420px at 50% 0%, hsl(var(--apice-gradient-end) / 0.1), transparent 70%)",
              }}
            />

            <div className="relative flex items-start gap-4">
              <div
                aria-hidden="true"
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border",
                  selected
                    ? "border-[hsl(var(--apice-gold))]/40 bg-[hsl(var(--apice-gold))]/15"
                    : "border-white/10 bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    selected ? "text-[hsl(var(--apice-gold))]" : "text-white/70"
                  )}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold tracking-tight text-white md:text-lg">
                    {option.label}
                  </h3>
                  {selected && (
                    <CheckCircle2
                      className="h-4 w-4 text-[hsl(var(--apice-gold))]"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-white/55">
                  {option.description}
                </p>
              </div>

              <ChevronRight
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 transition-all",
                  selected
                    ? "translate-x-0.5 text-[hsl(var(--apice-gold))]"
                    : "text-white/20 group-hover:translate-x-0.5 group-hover:text-white/50"
                )}
                aria-hidden="true"
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Tiers grid (last step)
// ────────────────────────────────────────────────────────────

interface Tier {
  amount: number;
  label: string;
  tag: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

function TiersGrid({
  tiers,
  currentValue,
  onSelect,
  prefersReducedMotion,
}: {
  tiers: Tier[];
  currentValue?: number;
  onSelect: (value: number) => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <div role="radiogroup" className="mt-10 grid gap-3 md:mt-12 md:grid-cols-2">
      {tiers.map((tier, idx) => {
        const selected = currentValue === tier.amount;
        return (
          <motion.button
            key={tier.amount}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(tier.amount)}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : idx * 0.05, duration: 0.35 }}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
            className={cn(
              "group relative overflow-hidden rounded-3xl border p-5 text-left backdrop-blur transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]",
              selected
                ? "border-[hsl(var(--apice-gold))]/50 bg-white/[0.05] shadow-[0_0_0_1px_hsl(var(--apice-gold)/0.3),0_20px_60px_-20px_hsl(var(--apice-gold)/0.4)]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            )}
          >
            {tier.recommended && (
              <span
                aria-label="Recommended"
                className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[hsl(var(--apice-gold))]/40 bg-[hsl(var(--apice-gold))]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--apice-gold))]"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Pick
              </span>
            )}

            <div className="relative flex items-start gap-4">
              <div
                aria-hidden="true"
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-2xl",
                  selected
                    ? "border-[hsl(var(--apice-gold))]/40 bg-[hsl(var(--apice-gold))]/15"
                    : "border-white/10 bg-white/5"
                )}
              >
                <span aria-hidden="true">{tier.icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base font-semibold tracking-tight text-white md:text-lg">
                    {tier.label}
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {tier.tag}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/55">
                  {tier.description}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-semibold tabular-nums text-white">
                  ${tier.amount}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">/ week</p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────

export default function QuizV2() {
  return (
    <ErrorBoundary>
      <QuizV2Inner />
    </ErrorBoundary>
  );
}
