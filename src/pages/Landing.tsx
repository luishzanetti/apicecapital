import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Layers3,
  Radar,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { useAppStore } from '@/store/appStore';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const promisePoints = [
  {
    icon: Brain,
    title: 'Strategic AI',
    body: 'Market reads reduce noise, adjust context, and support decisions with method.',
  },
  {
    icon: Layers3,
    title: 'Smart diversification',
    body: 'We distribute capital across complementary structures so you never depend on a single narrative.',
  },
  {
    icon: Clock3,
    title: '24/7 operations',
    body: 'While the market never sleeps, the setup keeps monitoring execution, risk, and opportunity.',
  },
];

const methodologySteps = [
  {
    step: '01',
    title: 'Understand the strategy',
    body: 'You learn how the Apice vision combines AI, discipline, and diversification to build wealth more intelligently.',
  },
  {
    step: '02',
    title: 'Build and configure the tool',
    body: 'We define the ideal setup, connect operations to your profile, and guide you to guest access at the right time.',
  },
  {
    step: '03',
    title: 'Analyze and grow every day',
    body: 'The routine continues with daily result reads, allocation adjustments, and strategic recommendations from our AI.',
  },
];

const whyItWorks = [
  {
    title: 'Diversification reduces dependence on a single win',
    body: 'When the portfolio relies on multiple fronts with their own logic, the growth curve becomes less fragile to isolated mistakes.',
  },
  {
    title: 'AI helps maintain coherence through market cycles',
    body: 'Instead of reacting on impulse, you operate with reads, criteria, and a consistent framework to adapt the plan.',
  },
  {
    title: '24/7 creates continuity where the average investor loses timing',
    body: 'The edge is not staring at charts all day, but having a system that sustains monitoring and execution continuously.',
  },
];

const dailyLoop = [
  {
    title: 'Daily scenario read',
    body: 'We track context, risk, and asset momentum to know when to hold, reinforce, or adjust the structure.',
  },
  {
    title: 'Objective next-action recommendation',
    body: 'AI delivers what to do next: reinforce the base, diversify, review protection, or rebalance the setup.',
  },
  {
    title: 'Continuous portfolio evolution',
    body: 'Growth stops being improvisation and becomes a data-driven incremental improvement routine.',
  },
];

const faqs = [
  {
    question: 'Is this a guaranteed return promise?',
    answer:
      'No. Apice works with education, methodology, and operational intelligence. The logic is to build a process advantage, not promise fixed results.',
  },
  {
    question: 'Why does AI make a difference in this setup?',
    answer:
      'Because it helps maintain consistency, context reads, and discipline. The goal is to reduce improvisation and accelerate decision quality.',
  },
  {
    question: 'Do my funds stay with Apice?',
    answer:
      'No. Apice\'s vision is non-custodial: you operate on your own infrastructure and remain in control of your capital.',
  },
  {
    question: 'Is the focus a single setup or portfolio building?',
    answer:
      'Both. The setup works as an execution engine, but always within a broader vision of wealth, allocation, and sustainable growth.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/10 py-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-base font-semibold text-white">{question}</span>
        <span className="pt-1 text-xs text-white/50">{open ? 'close' : 'open'}</span>
      </button>
      {open && (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  function goToPrimaryFlow() {
    trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
      origin: 'ai-trade-setup-landing',
    });

    if (session) {
      navigate(hasCompletedOnboarding ? '/home' : '/onboarding');
      return;
    }

    navigate('/auth');
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,143,255,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(234,179,8,0.1),transparent_20%),linear-gradient(180deg,#050816_0%,#081120_38%,#050816_100%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:96px_96px]" />
      </div>

      <section
        ref={heroRef}
        className="relative min-h-[100svh] px-6 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10"
      >
        <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-7xl flex-col justify-between gap-14 md:min-h-[calc(100svh-3rem)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-[0_0_40px_rgba(82,143,255,0.25)] backdrop-blur">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 40 40"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M20 4L36 34H4L20 4Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M20 13L30 32H10L20 13Z"
                    fill="currentColor"
                    opacity="0.24"
                  />
                </svg>
              </div>
              <div>
                <p className="font-display text-xl font-semibold tracking-tight">Apice</p>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">AI Trade Setup</p>
              </div>
            </div>

            <Badge className="border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur hover:bg-white/5">
              Apice Methodology
            </Badge>
          </div>

          <div className="grid flex-1 items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <motion.div
              style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
              className="max-w-3xl"
            >
              <Badge className="mb-5 border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur hover:bg-white/5">
                AI-powered diversification. 24/7 operations. Growth with method.
              </Badge>

              <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
                The setup that turns strategic vision into wealth every day.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
                Apice organizes your entry into the AI Trade Setup with a clear narrative:
                understand the strategy, configure the tool the right way, analyze
                results, and grow your portfolio with strategic recommendations from our AI.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="premium"
                  size="xl"
                  className="h-14 rounded-2xl px-8 text-base"
                  onClick={goToPrimaryFlow}
                >
                  Build my setup
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                  onClick={() => scrollToSection('metodologia')}
                >
                  See how it works
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/56">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#f6c85b]" />
                  You stay in control of your capital
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6aa6ff]" />
                  AI applied to reads and execution
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -left-12 top-10 h-28 w-28 rounded-full bg-[#528fff]/20 blur-3xl" />
              <div className="absolute -right-10 bottom-4 h-36 w-36 rounded-full bg-[#f6c85b]/12 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Operations panel</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">Apice Wealth Engine</p>
                  </div>
                  <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    active 24/7
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {promisePoints.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <item.icon className="mb-4 w-5 h-5 text-[#78aaff]" />
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-2 text-xs leading-6 text-white/58">{item.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(82,143,255,0.14),rgba(6,9,21,0.4))] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/40">Growth cycle</p>
                        <p className="mt-2 text-lg font-semibold">Strategy, configuration, and daily growth</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-[#f6c85b]" />
                    </div>

                    <div className="mt-5 space-y-4">
                      {methodologySteps.map((item) => (
                        <div key={item.step} className="grid grid-cols-[48px_1fr] gap-4 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                          <div className="text-2xl font-semibold tracking-tight text-white/28">{item.step}</div>
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-sm leading-7 text-white/64">{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">AI Radar</p>
                      <div className="mt-4 space-y-3 text-sm text-white/72">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2"><Radar className="w-4 h-4 text-[#78aaff]" /> context</span>
                          <span>monitored</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-[#78aaff]" /> execution</span>
                          <span>assisted</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#78aaff]" /> risk</span>
                          <span>protected</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">Apice Vision</p>
                      <p className="mt-4 text-sm leading-7 text-white/68">
                        Smart growth is not about betting more. It is about organizing capital,
                        timing, risk, and consistency within a system that keeps
                        working even when you are not watching.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {whyItWorks.map((item) => (
              <div key={item.title} className="border-t border-white/10 pt-5">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="metodologia" className="relative px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/60 hover:bg-white/5">
              How it works
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
              The Apice methodology creates clarity before accelerating capital.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/66">
              We don't start with the tool. We start with the logic. You understand the
              game, receive a setup aligned with your profile, and only then move to practical
              operations with a structure that makes sense for the long term.
            </p>
          </div>

          <div className="space-y-5">
            {methodologySteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-semibold tracking-tight text-white/28">{item.step}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="mt-5 text-xl font-semibold tracking-tight text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/64">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/42">Onboarding mission</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white">
                From understanding to execution in one journey.
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4 border-t border-white/10 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/6">
                  <Target className="w-5 h-5 text-[#78aaff]" />
                </div>
                <div>
                  <p className="font-semibold">Right profile before the tool</p>
                  <p className="mt-2 text-sm leading-7 text-white/64">
                    Onboarding starts by aligning goals, risk, capital, and execution intensity.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/10 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/6">
                  <BarChart3 className="w-5 h-5 text-[#78aaff]" />
                </div>
                <div>
                  <p className="font-semibold">Setup with portfolio logic</p>
                  <p className="mt-2 text-sm leading-7 text-white/64">
                    The configuration shows why diversifying with AI is different from just plugging into a bot.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/10 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/6">
                  <CheckCircle2 className="w-5 h-5 text-[#78aaff]" />
                </div>
                <div>
                  <p className="font-semibold">Clear next action</p>
                  <p className="mt-2 text-sm leading-7 text-white/64">
                    At the end of the journey, you know exactly where to access, configure, validate, and monitor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur md:p-12">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/42">Growth routine</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
              After setup, AI steps in to sustain daily evolution.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {dailyLoop.map((item, index) => (
              <div key={item.title}>
                <p className="text-2xl font-semibold tracking-tight text-white/25">0{index + 1}</p>
                <p className="mt-4 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/64">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/42">Key questions</p>
          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.04] px-6 py-3 backdrop-blur md:px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-20 pt-8 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[40px] border border-white/10 bg-[linear-gradient(145deg,rgba(82,143,255,0.16),rgba(5,8,22,0.3))] px-8 py-10 text-center backdrop-blur md:px-12 md:py-14">
          <p className="text-sm uppercase tracking-[0.28em] text-white/45">Ready to activate</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
            Enter the Apice onboarding and build your AI Trade Setup the right way.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/66">
            The journey is designed to explain the method, configure operations, and open
            the daily portfolio growth routine with strategic AI support.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="premium"
              size="xl"
              className="h-14 rounded-2xl px-8 text-base"
              onClick={goToPrimaryFlow}
            >
              Start onboarding
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
              onClick={() => scrollToSection('metodologia')}
            >
              Review methodology
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
