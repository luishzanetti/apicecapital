import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ExternalLink,
  PieChart,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAppStore,
  investorTypeDescriptions,
  recommendedPath,
} from "@/store/appStore";
import { cn } from "@/lib/utils";

/**
 * ProfileResult — premium result reveal matching AiTradeLanding aesthetic.
 * Preserves all business logic: investorType read, mission/setup progress flags,
 * clickable task routes, CTA target. Visual upgraded to dark #050816 +
 * blue/violet/gold gradient + glass cards + font-display hero.
 */
export default function ProfileResult() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const investorType = useAppStore((s) => s.investorType) || "Balanced Optimizer";
  const missionProgress = useAppStore((s) => s.missionProgress);
  const setupProgress = useAppStore((s) => s.setupProgress);

  const description = investorType ? investorTypeDescriptions[investorType] : null;
  const recommended = investorType ? recommendedPath[investorType] : "balanced";

  // Force dark mode for this reveal screen.
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const setupSteps = [
    {
      id: "exchange",
      label: "Connect exchange",
      sublabel: "Via Bybit referral link",
      timeEstimate: "2 min",
      done: missionProgress.m2_apiConnected || setupProgress.exchangeAccountCreated,
      icon: ExternalLink,
      route: "/settings",
    },
    {
      id: "portfolio",
      label: "Choose portfolio",
      sublabel: "One-tap selection",
      timeEstimate: "3 min",
      done: missionProgress.m3_portfolioSelected || setupProgress.corePortfolioSelected,
      icon: PieChart,
      route: "/strategies",
    },
    {
      id: "dca",
      label: "Start DCA",
      sublabel: "Simple schedule setup",
      timeEstimate: "2 min",
      done: missionProgress.m4_weeklyPlanSet || setupProgress.dcaPlanConfigured,
      icon: Zap,
      route: "/dca-planner",
    },
  ];

  const completedCount = setupSteps.filter((s) => s.done).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
      {/* Background decor — Landing-style layered radial gradients + grid */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,143,255,0.2),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(234,179,8,0.1),transparent_22%),radial-gradient(circle_at_15%_85%,rgba(155,135,245,0.16),transparent_30%),linear-gradient(180deg,#0F1626_0%,#152038_50%,#0F1626_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
      </div>

      <main
        id="main"
        className="relative z-10 mx-auto max-w-2xl px-5 pt-10 pb-14 md:pt-16 md:pb-20"
        aria-labelledby="result-title"
      >
        {/* Hero reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Eyebrow tag */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
            Your investor profile
          </motion.div>

          {/* Hero icon with gradient shell */}
          <motion.div
            initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 18 }}
            className="relative mx-auto mt-8 w-20 h-20"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-3xl blur-2xl opacity-70"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--apice-gradient-end) / 0.6), transparent 70%)",
              }}
            />
            <div
              className="relative grid h-20 w-20 place-items-center rounded-3xl border border-white/15 shadow-[0_20px_60px_-15px_hsl(var(--apice-gradient-end)/0.6)]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--apice-gradient-start)) 0%, hsl(var(--apice-gradient-end)) 60%, hsl(var(--apice-gold)) 100%)",
              }}
            >
              <Target className="h-9 w-9 text-white" aria-hidden="true" />
            </div>
          </motion.div>

          {/* Gradient headline */}
          <motion.h1
            id="result-title"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="font-display mt-8 text-balance bg-clip-text text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-transparent md:text-6xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #ffffff 40%, hsl(var(--apice-gradient-end)) 70%, hsl(var(--apice-gold)) 100%)",
            }}
          >
            {investorType}
          </motion.h1>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65 md:text-lg"
          >
            Based on your answers, here's the personalized track your setup will follow.
          </motion.p>
        </motion.div>

        {/* Profile description card */}
        {description && (
          <motion.section
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur md:p-8"
            aria-label="Profile breakdown"
          >
            <div className="space-y-5">
              <ProfileRow
                icon={Check}
                iconClassName="text-emerald-400"
                tag="What you want"
                body={description.wants}
              />
              <ProfileRow
                icon={Shield}
                iconClassName="text-[hsl(var(--destructive))]"
                tag="What to avoid"
                body={description.avoids}
              />
              <ProfileRow
                icon={Zap}
                iconClassName="text-[hsl(var(--apice-gold))]"
                tag="Your first step"
                body={description.firstStep}
              />
            </div>
          </motion.section>
        )}

        {/* Recommended setup path */}
        <motion.section
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.55 }}
          className="relative mt-6 overflow-hidden rounded-3xl border border-[hsl(var(--apice-gold))]/30 bg-white/[0.02] p-6 backdrop-blur md:p-8"
          aria-labelledby="setup-title"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px at 100% 0%, hsl(var(--apice-gold) / 0.1), transparent 60%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="setup-title"
                className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-white md:text-xl"
              >
                <Wallet
                  className="h-5 w-5 text-[hsl(var(--apice-gold))]"
                  aria-hidden="true"
                />
                Recommended setup path
              </h2>
              <p className="mt-1 text-sm text-white/55">
                Complete these to activate your{" "}
                <span className="font-semibold text-white">{recommended}</span> strategy.
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--apice-gold))]/40 bg-[hsl(var(--apice-gold))]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--apice-gold))]">
              {completedCount} / {setupSteps.length}
            </span>
          </div>

          <ol className="relative mt-6 space-y-2">
            {setupSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <motion.li
                  key={step.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.08, duration: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => !step.done && navigate(step.route)}
                    disabled={step.done}
                    aria-label={`${step.label} — ${step.done ? "completed" : `go to ${step.route}`}`}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl border border-transparent px-3 py-3 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]",
                      !step.done && "hover:border-white/10 hover:bg-white/[0.03]"
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-sm font-semibold",
                        step.done
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : "border-white/10 bg-white/5 text-white/70"
                      )}
                    >
                      {step.done ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <span className="tabular-nums">{idx + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold tracking-tight text-white md:text-base",
                          step.done && "text-white/45 line-through"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-white/45 md:text-sm">
                        {step.sublabel}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.15em] text-white/30">
                      {step.timeEstimate}
                    </span>

                    <StepIcon
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        step.done ? "text-white/25" : "text-white/40 group-hover:translate-x-0.5 group-hover:text-white/70"
                      )}
                    />
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </motion.section>

        {/* Trust message */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.45 }}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur"
        >
          <Shield
            className="h-5 w-5 shrink-0 text-emerald-400/80"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-white/55 md:text-[13px]">
            Your funds stay under your control — non-custodial. Stop or adjust anytime.
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.5 }}
          className="mt-8"
        >
          <Button
            size="lg"
            onClick={() => navigate("/home")}
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_60px_-10px_rgba(82,143,255,0.45)] transition-all hover:shadow-[0_0_80px_-10px_rgba(82,143,255,0.65)]"
          >
            Start your setup
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>

          <p className="mt-3 text-center text-xs text-white/35">
            Free to start · No credit card required
          </p>
        </motion.div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Profile row — reusable for wants/avoids/first-step
// ────────────────────────────────────────────────────────────

function ProfileRow({
  icon: Icon,
  iconClassName,
  tag,
  body,
}: {
  icon: typeof Check;
  iconClassName: string;
  tag: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5"
      >
        <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          {tag}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white/85 md:text-[15px]">
          {body}
        </p>
      </div>
    </div>
  );
}
