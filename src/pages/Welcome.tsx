import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriangleMark } from "@/components/brand/BrandMark";

/**
 * Welcome — first-impression screen post-Splash.
 * Dark premium aesthetic matching AiTradeLanding. EN hardcoded (conversion surface).
 * Preserves navigation: "/quiz" (start flow) + "/auth" (existing users).
 */
export default function Welcome() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Strategic AI",
      description:
        "Market reads reduce noise, adjust context, and support decisions with method — not impulse.",
    },
    {
      icon: BarChart3,
      title: "Smart diversification",
      description:
        "Capital spread across complementary structures — no dependence on a single narrative.",
    },
    {
      icon: Shield,
      title: "Non-custodial by design",
      description:
        "Your funds stay on your exchange. Apice only executes within your risk rules.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
      {/* Background decor */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,143,255,0.2),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(234,179,8,0.1),transparent_22%),radial-gradient(circle_at_15%_80%,rgba(155,135,245,0.16),transparent_30%),linear-gradient(180deg,#0F1626_0%,#152038_50%,#0F1626_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
      </div>

      {/* Animated ambient orbs */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed -right-16 top-[12%] z-0 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--apice-gradient-end) / 0.25), transparent 70%)",
            }}
            animate={{ x: [0, -14, 6, 0], y: [0, 12, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed -left-20 bottom-[15%] z-0 h-80 w-80 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--apice-gold) / 0.18), transparent 70%)",
            }}
            animate={{ x: [0, 18, -6, 0], y: [0, -10, 12, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-6 pt-10 pb-10 md:max-w-xl md:px-8 md:pt-14">
        {/* Logo */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <TriangleMark variant="circle" size={44} aria-hidden="true" />
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">Apice</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
              Global AI Investing
            </p>
          </div>
        </motion.div>

        {/* Hero */}
        <div className="mt-14 flex-1">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur"
          >
            <Sparkles
              className="h-3 w-3 text-[hsl(var(--apice-gold))]"
              aria-hidden="true"
            />
            Apice Methodology
          </motion.div>

          <motion.h1
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="font-display mt-5 text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[56px]"
          >
            Strategic wealth,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, hsl(var(--apice-gradient-start)) 0%, hsl(var(--apice-gradient-end)) 55%, hsl(var(--apice-gold)) 100%)",
              }}
            >
              engineered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="mt-5 max-w-md text-base leading-relaxed text-white/65 md:text-lg"
          >
            AI-driven trading and automated DCA savings — so you build wealth with
            method instead of impulse. 24/7 execution. Non-custodial. Yours.
          </motion.p>

          {/* Social proof */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {[
                { label: "A", color: "bg-[hsl(var(--apice-gradient-start))]/30 text-white" },
                { label: "K", color: "bg-[hsl(var(--apice-gradient-end))]/30 text-white" },
                { label: "M", color: "bg-[hsl(var(--apice-gold))]/25 text-white" },
                { label: "+", color: "bg-white/10 text-white/80" },
              ].map((avatar, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0F1626] text-[10px] font-semibold backdrop-blur ${avatar.color}`}
                >
                  {avatar.label}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-white/45" aria-hidden="true" />
              <span className="text-xs text-white/55">
                Joined by 12,500+ early users
              </span>
            </div>
          </motion.div>

          {/* Features */}
          <div className="mt-10 space-y-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.12, duration: 0.5 }}
                className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--apice-gradient-start) / 0.2), hsl(var(--apice-gradient-end) / 0.1))",
                  }}
                >
                  <feature.icon
                    className="h-5 w-5 text-[hsl(var(--apice-gold))]"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-10 space-y-3"
        >
          <Button
            size="lg"
            onClick={() => navigate("/quiz-v2")}
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_60px_-10px_rgba(82,143,255,0.45)] transition-all hover:shadow-[0_0_80px_-10px_rgba(82,143,255,0.65)]"
          >
            Build my setup
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>

          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="w-full rounded-xl py-3 text-sm font-medium text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
          >
            I already have an account
          </button>

          <p className="text-center text-[11px] text-white/35">
            Free tier · No credit card · Cancel anytime
          </p>
        </motion.div>
      </div>
    </div>
  );
}
