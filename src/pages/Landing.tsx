import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  LineChart,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { useAppStore } from "@/store/appStore";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import {
  BinanceIcon,
  BybitIcon,
  CoinbaseIcon,
  KrakenIcon,
} from "@/components/icons";
import { ApiceLogo } from "@/components/brand";
import { flags } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";

/**
 * Apice International Landing v2 — premium, EN-first, dark crypto fintech.
 * Uses ui-ux-pro-max design direction + Magic MCP component patterns +
 * Apice brand tokens (#050816 deep, primary blue, gold accent, violet gradient end).
 *
 * Sections: Nav · Hero · Stats · Exchanges · Features Bento · How · Testimonials
 * Marquee · Pricing · FAQ · Final CTA · Footer.
 * All copy hardcoded in English — landing is the face of the international pivot.
 */
export default function Landing() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
      <BackgroundDecor />
      <LandingNav />
      <main id="main">
        <Hero />
        <StatsStrip />
        <ExchangesStrip />
        <FeaturesBento />
        <HowItWorks />
        <TestimonialsMarquee />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Background decoration (fixed, full-viewport)
// ────────────────────────────────────────────────────────────

function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* Layered radial gradients + deep base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,143,255,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(234,179,8,0.1),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(155,135,245,0.12),transparent_25%),linear-gradient(180deg,#0F1626_0%,#152038_40%,#0F1626_100%)]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Nav
// ────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="relative z-20 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <a href="#" className="group flex items-center gap-3" aria-label="Apice — Global AI Investing">
          <ApiceLogo
            variant="unified-horizontal-dark"
            size={52}
            aria-label="Apice — Global AI Investing"
          />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            Product
          </a>
          <a
            href="#how"
            className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            FAQ
          </a>
        </nav>

        <Badge className="hidden border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur hover:bg-white/5 md:inline-flex">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden="true" />
          Apice Methodology
        </Badge>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  function goToPrimaryFlow() {
    trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
      origin: "landing-hero-primary",
    });
    if (session) {
      navigate(hasCompletedOnboarding ? "/home" : "/onboarding");
      return;
    }
    navigate("/auth");
  }

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-title"
      className="relative z-10 px-6 pb-16 pt-6 md:px-10 md:pb-24 md:pt-10"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/75 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
            New · AI Trade Setup is live for early users
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display mt-8 text-balance bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-transparent md:text-7xl lg:text-[88px]"
          >
            Strategic wealth,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, hsl(var(--apice-gradient-start)) 0%, hsl(var(--apice-gradient-end)) 50%, hsl(var(--apice-gold)) 100%)",
              }}
            >
              engineered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-white/65 md:text-xl"
          >
            Apice combines AI-driven trading with automated DCA savings so you build
            wealth with method — not impulse. 24/7 execution. Non-custodial. Yours to
            control.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="h-14 min-w-[220px] rounded-2xl px-8 text-base font-semibold shadow-[0_0_60px_rgba(82,143,255,0.3)] transition-all hover:shadow-[0_0_80px_rgba(82,143,255,0.5)]"
              onClick={goToPrimaryFlow}
            >
              Build my setup
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-14 min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur hover:border-white/20 hover:bg-white/10"
            >
              <a href="#how">
                See how it works
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-5 text-xs text-white/40"
          >
            No credit card · Free tier with unlimited DCA · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Dashboard mockup preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-10 top-10 h-80 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(var(--apice-gradient-end) / 0.45), transparent 70%)",
            }}
          />
          <div className="relative rounded-[28px] border border-white/10 bg-white/[0.02] p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="overflow-hidden rounded-[22px] border border-white/5 bg-[#0a0f1e]">
              <HeroMockup />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroMockup() {
  const metrics = [
    { label: "Total portfolio", value: "$48,275.12", delta: "+12.4%", positive: true },
    { label: "AI Trade", value: "$32,140.00", delta: "+8.7%", positive: true },
    { label: "DCA Savings", value: "$16,135.12", delta: "+3.2%", positive: true },
    { label: "This week", value: "$250.00", delta: "Auto-deposit", positive: true },
  ];

  const positions = [
    { asset: "BTC", amount: "0.4821", usd: "$20,110", delta: "+2.1%" },
    { asset: "ETH", amount: "6.215", usd: "$12,380", delta: "+4.8%" },
    { asset: "SOL", amount: "85.3", usd: "$7,940", delta: "+9.2%" },
    { asset: "USDT", amount: "7,845", usd: "$7,845", delta: "-" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
            Portfolio overview · live
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">$48,275.12</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          +12.4% · 30d
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
          >
            <p className="text-[10px] uppercase tracking-widest text-white/40">{m.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">{m.value}</p>
            <p
              className={cn(
                "mt-1 text-[11px] font-medium",
                m.positive ? "text-emerald-400" : "text-red-400"
              )}
            >
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative mt-5 h-40 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--apice-gradient-end))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--apice-gradient-end))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="heroChartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--apice-gradient-start))" />
              <stop offset="100%" stopColor="hsl(var(--apice-gold))" />
            </linearGradient>
          </defs>
          <path
            d="M0,95 L40,82 L80,85 L120,62 L160,68 L200,45 L240,52 L280,28 L320,34 L360,15 L400,20 L400,120 L0,120 Z"
            fill="url(#heroChartFill)"
          />
          <path
            d="M0,95 L40,82 L80,85 L120,62 L160,68 L200,45 L240,52 L280,28 L320,34 L360,15 L400,20"
            fill="none"
            stroke="url(#heroChartStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="400" cy="20" r="4" fill="hsl(var(--apice-gold))" className="animate-pulse" />
        </svg>
        <div className="absolute bottom-3 left-4 text-[10px] font-medium uppercase tracking-wider text-white/30">
          30-day performance
        </div>
      </div>

      {/* Positions table preview */}
      <div className="mt-5 hidden rounded-2xl border border-white/5 bg-white/[0.02] md:block">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Top positions
          </p>
          <span className="text-[10px] text-white/30">4 assets</span>
        </div>
        <div className="divide-y divide-white/5">
          {positions.map((p) => (
            <div key={p.asset} className="grid grid-cols-4 items-center gap-4 px-4 py-3 text-sm">
              <span className="font-semibold text-white">{p.asset}</span>
              <span className="tabular-nums text-white/60">{p.amount}</span>
              <span className="tabular-nums text-white">{p.usd}</span>
              <span
                className={cn(
                  "text-right tabular-nums",
                  p.delta.startsWith("+") ? "text-emerald-400" : "text-white/40"
                )}
              >
                {p.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Stats Strip (animated counters)
// ────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: 12500, suffix: "+", label: "Early users" },
    { value: 48, prefix: "$", suffix: "M+", label: "Portfolio tracked" },
    { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
    { value: 15, suffix: "+", label: "Countries" },
  ];

  return (
    <section aria-label="Platform stats" className="relative z-10 border-y border-white/5 bg-white/[0.01] py-14 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:px-10">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}

function StatItem({
  value,
  prefix = "",
  suffix = "",
  label,
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const spring = useSpring(0, { damping: 40, stiffness: 120, mass: 1 });
  const display = useTransform(spring, (latest) =>
    latest.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, value, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => setDisplayValue(latest));
    return unsubscribe;
  }, [display]);

  return (
    <div className="text-center md:text-left">
      <p
        ref={ref}
        className="font-display text-3xl font-semibold tracking-tight text-white md:text-5xl"
        aria-label={`${prefix}${value}${suffix} ${label}`}
      >
        {prefix}
        <span>{displayValue}</span>
        {suffix}
      </p>
      <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Exchanges strip
// ────────────────────────────────────────────────────────────

function ExchangesStrip() {
  const exchanges = [
    { Icon: BinanceIcon, name: "Binance" },
    { Icon: BybitIcon, name: "Bybit" },
    { Icon: CoinbaseIcon, name: "Coinbase" },
    { Icon: KrakenIcon, name: "Kraken" },
  ];

  return (
    <section aria-label="Supported exchanges" className="relative z-10 px-6 py-12 md:px-10">
      <p className="mb-8 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">
        Connect your preferred exchange
      </p>
      <div className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-8 sm:grid-cols-4">
        {exchanges.map(({ Icon, name }) => (
          <motion.div
            key={name}
            whileHover={{ scale: 1.05 }}
            className="group flex items-center justify-center opacity-50 transition-opacity duration-300 hover:opacity-100"
            title={name}
          >
            <Icon className="h-10 w-auto text-white grayscale transition-all duration-300 group-hover:grayscale-0" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Features Bento
// ────────────────────────────────────────────────────────────

function FeaturesBento() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative z-10 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--apice-gold))]">
            Everything you need
          </span>
          <h2
            id="features-title"
            className="font-display mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
          >
            Built for investors who demand discipline.
          </h2>
          <p className="mt-4 text-white/60">
            Four pillars, one platform — zero spreadsheets, zero all-nighters watching charts.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Large feature: AI Trade */}
          <FeatureCard
            icon={BrainCircuit}
            title="AI Trade"
            description="Adaptive strategies read the market in real-time, rebalance automatically, and protect your capital with built-in risk rules you define."
            className="md:col-span-2 md:row-span-2"
            size="lg"
          />

          <FeatureCard
            icon={LineChart}
            title="DCA Planner"
            description="Automate weekly deposits across your favorite assets. Compound without lifting a finger."
          />

          <FeatureCard
            icon={Wallet}
            title="Unified Portfolio"
            description="One dashboard for everything — across exchanges and strategies. Never lose sight."
          />

          <FeatureCard
            icon={ShieldCheck}
            title="Risk Rules"
            description="Stop-loss, max drawdown, position limits — all enforced 24/7 by the engine."
            className="md:col-span-1"
          />

          <FeatureCard
            icon={Radar}
            title="Live monitoring"
            description="Real-time market context, asset momentum, and strategic recommendations delivered daily."
            className="md:col-span-2"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  size = "md",
}: {
  icon: typeof BrainCircuit;
  title: string;
  description: string;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur transition-all hover:border-white/10 md:p-8", className)}
    >
      {/* Hover glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px at 50% 0%, hsl(var(--apice-gradient-end) / 0.12), transparent 70%)",
        }}
      />

      <div
        aria-hidden="true"
        className="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--apice-gradient-start) / 0.2), hsl(var(--apice-gradient-end) / 0.1))",
        }}
      >
        <Icon className="h-5 w-5 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
      </div>

      <h3
        className={cn(
          "font-display relative font-semibold tracking-tight text-white",
          size === "lg" ? "text-2xl md:text-3xl" : "text-xl"
        )}
      >
        {title}
      </h3>
      <p className={cn("relative mt-3 leading-relaxed text-white/60", size === "lg" ? "text-base md:text-lg max-w-xl" : "text-sm")}>
        {description}
      </p>

      {size === "lg" && <AITradeVisual />}
    </motion.div>
  );
}

function AITradeVisual() {
  return (
    <div className="relative mt-8 h-48 overflow-hidden rounded-2xl border border-white/5 bg-[#0a0f1e] md:h-64">
      <svg
        viewBox="0 0 500 200"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--apice-gradient-end))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--apice-gradient-end))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d="M0,170 L40,155 L80,160 L120,130 L160,140 L200,100 L240,110 L280,70 L320,80 L360,45 L400,55 L440,20 L480,28 L500,15 L500,200 L0,200 Z"
          fill="url(#aiFill)"
        />
        <path
          d="M0,170 L40,155 L80,160 L120,130 L160,140 L200,100 L240,110 L280,70 L320,80 L360,45 L400,55 L440,20 L480,28 L500,15"
          fill="none"
          stroke="hsl(var(--apice-gradient-end))"
          strokeWidth="2"
        />
        {/* Buy/Sell markers */}
        {[
          { x: 120, y: 130, type: "buy" },
          { x: 280, y: 70, type: "sell" },
          { x: 400, y: 55, type: "buy" },
        ].map((m, i) => (
          <g key={i}>
            <circle
              cx={m.x}
              cy={m.y}
              r="6"
              fill={m.type === "buy" ? "#10b981" : "#f59e0b"}
              opacity="0.2"
            />
            <circle
              cx={m.x}
              cy={m.y}
              r="3"
              fill={m.type === "buy" ? "#10b981" : "#f59e0b"}
            />
          </g>
        ))}
      </svg>
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
        AI active · Strategy: Momentum
      </div>
      <div className="absolute bottom-4 left-4 flex gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="text-white/60">Buy signal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="text-white/60">Take profit</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// How it works
// ────────────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    title: "Connect your exchange",
    body: "Secure read/trade API keys — we never hold your funds. Assets stay on your exchange, under your control.",
  },
  {
    n: "02",
    title: "Choose your strategy",
    body: "AI Trade for active management, DCA Planner for hands-off compounding, or both. Risk profile in 3 minutes.",
  },
  {
    n: "03",
    title: "Watch it compound",
    body: "Live dashboard. Weekly performance. Full transparency. Adjust anytime. Cancel anytime.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="relative z-10 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--apice-gold))]">
            How it works
          </span>
          <h2
            id="how-title"
            className="font-display mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
          >
            From signup to compounding in under 5 minutes.
          </h2>
        </div>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur"
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden="true"
                  className="font-display shrink-0 text-4xl font-semibold tabular-nums text-[hsl(var(--apice-gold))] md:text-5xl"
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Testimonials marquee
// ────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "Apice replaced three apps and a spreadsheet for me. The DCA planner alone paid for itself in the first month.",
    name: "Rafael M.",
    role: "Software engineer · Lisbon",
  },
  {
    quote:
      "I was skeptical about AI trading until I saw the risk rules in action. It's disciplined in ways I never was.",
    name: "Ana P.",
    role: "Product manager · São Paulo",
  },
  {
    quote:
      "Finally a crypto platform that doesn't look like a casino. Clean, transparent, and I actually understand what's happening.",
    name: "Mark O.",
    role: "Consultant · London",
  },
  {
    quote:
      "The 24/7 execution and the weekly reports changed the way I think about long-term portfolios.",
    name: "Noah K.",
    role: "Founder · Berlin",
  },
  {
    quote:
      "Setup took 4 minutes. The onboarding quiz nailed my risk profile. I've been compounding ever since.",
    name: "Carla D.",
    role: "Investor · Madrid",
  },
  {
    quote:
      "The AI picks made sense. Not magic — just consistency I couldn't sustain on my own.",
    name: "James T.",
    role: "Trader · Dublin",
  },
];

function TestimonialsMarquee() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="relative z-10 overflow-hidden px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--apice-gold))]">
          Loved by early users
        </span>
        <h2
          id="testimonials-title"
          className="font-display mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
        >
          People sleep better when Apice has their back.
        </h2>
      </div>

      <div
        className="relative mt-16 flex gap-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        role="region"
        aria-label="Customer testimonials"
      >
        <MarqueeRow testimonials={testimonials} duration={40} />
        <MarqueeRow testimonials={[...testimonials].reverse()} duration={50} direction="reverse" />
      </div>
    </section>
  );
}

function MarqueeRow({
  testimonials,
  duration,
  direction = "normal",
}: {
  testimonials: typeof testimonials;
  duration: number;
  direction?: "normal" | "reverse";
}) {
  return (
    <motion.ul
      animate={{ x: direction === "reverse" ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      className="flex shrink-0 gap-6"
    >
      {[...testimonials, ...testimonials].map((t, idx) => (
        <li
          key={idx}
          className="flex w-[380px] shrink-0 flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur md:w-[420px]"
        >
          <div>
            <div className="mb-3 flex items-center gap-0.5" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  aria-hidden="true"
                  className="h-4 w-4 fill-[hsl(var(--apice-gold))] text-[hsl(var(--apice-gold))]"
                />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed text-white/80 md:text-base">
              "{t.quote}"
            </blockquote>
          </div>
          <figcaption className="mt-6 border-t border-white/5 pt-4 text-xs text-white/50">
            <span className="font-semibold text-white">{t.name}</span>
            <br />
            {t.role}
          </figcaption>
        </li>
      ))}
    </motion.ul>
  );
}

// ────────────────────────────────────────────────────────────
// Pricing
// ────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "DCA savings on autopilot. Perfect for building your base.",
    features: [
      "Unlimited DCA plans",
      "Up to 3 exchanges",
      "Weekly performance reports",
      "Community support",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$19",
    period: "/ month",
    description: "AI Trade + everything in Starter. For investors who mean business.",
    features: [
      "Everything in Starter",
      "AI Trade active strategies",
      "Risk rules & stop-loss automation",
      "Priority support",
      "Advanced analytics",
      "Custom alert rules",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
];

function Pricing() {
  const navigate = useNavigate();
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative z-10 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--apice-gold))]">
            Simple pricing
          </span>
          <h2
            id="pricing-title"
            className="font-display mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
          >
            Free to start. Upgrade when you outgrow it.
          </h2>
          <p className="mt-4 text-white/60">
            No hidden fees. No commission on profits. You keep what you earn.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative overflow-hidden rounded-3xl border bg-white/[0.02] p-8 backdrop-blur md:p-10",
                plan.highlight
                  ? "border-[hsl(var(--apice-gold))]/40 shadow-[0_0_80px_-20px_hsl(var(--apice-gold)/0.3)]"
                  : "border-white/5"
              )}
            >
              {plan.highlight && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    background:
                      "radial-gradient(600px at 50% 0%, hsl(var(--apice-gold) / 0.08), transparent 60%)",
                  }}
                />
              )}

              {plan.highlight && (
                <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--apice-gold))]/30 bg-[hsl(var(--apice-gold))]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--apice-gold))]">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Most popular
                </div>
              )}

              <h3 className="font-display relative text-2xl font-semibold tracking-tight text-white">
                {plan.name}
              </h3>
              <p className="relative mt-1 text-sm text-white/60">{plan.description}</p>

              <div className="relative mt-8 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-semibold tabular-nums text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-white/50">{plan.period}</span>
              </div>

              <Button
                size="lg"
                onClick={() =>
                  trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                    origin: `landing-pricing-${plan.name.toLowerCase()}`,
                  }) ?? navigate("/auth")
                }
                className={cn(
                  "relative mt-8 h-12 w-full rounded-2xl text-base font-semibold",
                  !plan.highlight &&
                    "bg-white/10 text-white hover:bg-white/15 backdrop-blur border border-white/10"
                )}
                variant={plan.highlight ? "default" : "ghost"}
              >
                {plan.cta}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>

              <ul className="relative mt-10 space-y-4 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        plan.highlight ? "text-[hsl(var(--apice-gold))]" : "text-emerald-400"
                      )}
                    />
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is my money safe?",
    a: "Apice never holds your funds. Your assets stay on your chosen exchange. We only use read/trade API permissions — no withdrawal rights, ever.",
  },
  {
    q: "How does AI Trade work?",
    a: "AI Trade combines multiple quantitative strategies and adapts them to current market conditions. You choose your risk profile; Apice executes within your rules and stops out when limits are hit.",
  },
  {
    q: "What's the minimum investment?",
    a: "Starter is free forever with no minimum. Premium starts at $19/month and works best with $500+ in capital, though there is no enforced minimum.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in one click from Settings. Your DCA plans and AI Trade strategies pause immediately; your funds remain untouched on your exchange.",
  },
  {
    q: "Do I need trading experience?",
    a: "No. Apice is built for investors who want to be disciplined without spending hours analyzing charts. The onboarding quiz sets up your risk profile in under 3 minutes.",
  },
  {
    q: "Is Apice regulated?",
    a: "Apice operates as a non-custodial SaaS — we are not a broker or exchange. You comply with your local regulations for the exchange you connect.",
  },
];

function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative z-10 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--apice-gold))]">
            Questions
          </span>
          <h2
            id="faq-title"
            className="font-display mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
          >
            Everything you want to know, before you sign up.
          </h2>
        </div>

        <div className="mt-12 rounded-3xl border border-white/5 bg-white/[0.02] p-2 backdrop-blur">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} {...faq} isLast={idx === faqs.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("px-5", !isLast && "border-b border-white/5")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
      >
        <span className="text-base font-semibold text-white md:text-lg">{q}</span>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs transition-transform",
            open && "rotate-45"
          )}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 pr-10 text-sm leading-relaxed text-white/60 md:text-base">{a}</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Final CTA
// ────────────────────────────────────────────────────────────

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="final-cta-title" className="relative z-10 px-6 pb-24 md:px-10">
      <div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-white/10 p-10 text-center md:p-16"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--apice-gradient-start) / 0.35) 0%, hsl(var(--apice-gradient-end) / 0.2) 50%, hsl(var(--apice-gold) / 0.15) 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[hsl(var(--apice-gold))]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[hsl(var(--apice-gradient-start))]/20 blur-3xl"
        />

        <Zap className="relative mx-auto h-12 w-12 text-[hsl(var(--apice-gold))]" aria-hidden="true" />
        <h2
          id="final-cta-title"
          className="font-display relative mt-5 text-balance text-4xl font-semibold tracking-tight md:text-5xl"
        >
          Your portfolio deserves a smarter edge.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/65">
          Join 12,500+ investors already letting AI handle the discipline while they sleep.
        </p>

        <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={() => {
              trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                origin: "landing-final-cta",
              });
              navigate("/auth");
            }}
            className="h-14 min-w-[220px] rounded-2xl px-8 text-base font-semibold shadow-[0_0_60px_rgba(82,143,255,0.4)]"
          >
            Create free account
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-14 min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur"
          >
            <a href="#pricing">Compare plans</a>
          </Button>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Non-custodial
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            No commission on profits
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 px-6 py-14 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur"
            >
              <ApiceLogo variant="triangle" size={20} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Apice</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                AI Trade Setup
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            AI-powered crypto trading and DCA savings for disciplined investors. Built
            international. Built non-custodial.
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            { label: "AI Trade", href: "#features" },
            { label: "DCA Planner", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { label: "About", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Contact", href: "/support" },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { label: "Terms of Service", href: "#" },
            { label: "Privacy Policy", href: "#" },
            { label: "Risk Disclosure", href: "#" },
            { label: "Security", href: "#" },
          ]}
        />
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 md:flex-row">
        <p>© {new Date().getFullYear()} Apice. All rights reserved.</p>
        <p className="max-w-xl text-center md:text-right">
          Crypto investments carry risk. Past performance does not guarantee future
          results. Apice is a non-custodial SaaS and not a broker.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
