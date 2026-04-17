import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { useAppStore } from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TriangleMark } from "@/components/brand/BrandMark";

/**
 * Auth — premium signup/login aligned with AiTradeLanding.
 * Preserves business logic: Supabase auth, demo mode, Zod validation,
 * forgot-password, resend confirmation, redirect flows.
 * Visual upgraded to dark #050816 + gradient tricolor + glass cards + premium motion.
 */

const authSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email is too long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const { session, demoSignIn, isDemoMode } = useAuth();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/home";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (session) navigate(redirectPath, { replace: true });
  }, [session, navigate, redirectPath]);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      toast.success("Password reset email sent! Check your inbox.");
    } catch {
      toast.error("Could not send reset email. Try again.");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    try {
      await supabase.auth.resend({ type: "signup", email });
      toast.success("Confirmation email resent! Check your inbox.");
    } catch {
      toast.error("Could not resend email. Try again.");
    }
  };

  const handleAuth = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0]?.message || "Invalid input");
          return;
        }

        if (isDemoMode) {
          demoSignIn(validation.data.email);
          toast.success(isSignUp ? "Account created (demo)" : "Welcome back (demo)");
          if (isSignUp && !hasCompletedOnboarding) {
            navigate("/onboarding");
          } else {
            navigate(redirectPath);
          }
          return;
        }

        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          if (data?.session) {
            toast.success("Welcome to Apice");
            navigate(hasCompletedOnboarding ? redirectPath : "/onboarding");
          } else {
            toast.success("Account created", {
              description: "Check your email to confirm your account.",
            });
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            if (error.message.includes("Email not confirmed")) {
              toast.error("Email not confirmed", {
                description: "Check your inbox or spam folder.",
              });
              return;
            }
            if (error.message.includes("Invalid login credentials")) {
              toast.error("Invalid credentials", {
                description: "Check your email/password or create an account.",
              });
              return;
            }
            throw error;
          }
          toast.success("Welcome back");
          navigate(redirectPath);
        }
      } catch (error: unknown) {
        const description =
          error instanceof Error ? error.message : "Something went wrong.";
        toast.error("Authentication failed", { description });
      } finally {
        setLoading(false);
      }
    },
    [email, password, isSignUp, isDemoMode, demoSignIn, hasCompletedOnboarding, navigate, redirectPath]
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
      {/* Background decor */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,143,255,0.2),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(234,179,8,0.1),transparent_22%),radial-gradient(circle_at_15%_80%,rgba(155,135,245,0.18),transparent_30%),linear-gradient(180deg,#0F1626_0%,#152038_50%,#0F1626_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
      </div>

      {/* Animated orbs */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed -left-20 top-[8%] z-0 h-80 w-80 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--apice-gradient-end) / 0.22), transparent 70%)",
            }}
            animate={{ x: [0, 20, -6, 0], y: [0, -18, 8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed -right-16 bottom-[10%] z-0 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--apice-gold) / 0.2), transparent 70%)",
            }}
            animate={{ x: [0, -14, 10, 0], y: [0, 14, -10, 0], scale: [1, 0.95, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="relative z-20 bg-[hsl(var(--apice-gold))]/95 py-1.5 text-center text-xs font-semibold text-[#050816]">
          Demo mode — no real authentication required
        </div>
      )}

      <main
        id="main"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10"
        aria-labelledby="auth-title"
      >
        {/* Logo + heading */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <TriangleMark variant="circle" size={64} aria-hidden="true" />

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h1
                id="auth-title"
                className="font-display text-3xl font-semibold tracking-[-0.02em] text-white md:text-[36px]"
              >
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-white/55">
                {isSignUp
                  ? "Start your AI Trade setup in minutes."
                  : "Resume your Apice setup where you left off."}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 w-full max-w-sm"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur md:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(500px at 50% 0%, hsl(var(--apice-gradient-end) / 0.08), transparent 60%)",
              }}
            />

            <form onSubmit={handleAuth} className="relative space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55"
                >
                  Email
                </label>
                <div className="relative mt-2">
                  <Mail
                    className={cn(
                      "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
                      focused === "email"
                        ? "text-[hsl(var(--apice-gold))]"
                        : "text-white/40"
                    )}
                    aria-hidden="true"
                  />
                  <Input
                    id="auth-email"
                    placeholder="you@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={loading}
                    required
                    value={email}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/35 transition-all",
                      "focus-visible:border-[hsl(var(--apice-gold))]/40 focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[hsl(var(--apice-gold))]/15"
                    )}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="auth-password"
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock
                    className={cn(
                      "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
                      focused === "password"
                        ? "text-[hsl(var(--apice-gold))]"
                        : "text-white/40"
                    )}
                    aria-hidden="true"
                  />
                  <Input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    required
                    minLength={6}
                    value={password}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      "h-12 rounded-2xl border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-white/35 transition-all",
                      "focus-visible:border-[hsl(var(--apice-gold))]/40 focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[hsl(var(--apice-gold))]/15"
                    )}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password (login only) */}
              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-[hsl(var(--apice-gold))] transition-colors hover:text-[hsl(var(--apice-gold))]/80 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <div aria-live="polite" className="sr-only" />

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="group h-12 w-full rounded-2xl text-sm font-semibold shadow-[0_0_60px_-12px_rgba(82,143,255,0.45)] transition-all hover:shadow-[0_0_80px_-12px_rgba(82,143,255,0.65)]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    {isSignUp ? "Create account" : "Sign in"}
                    <ArrowRight
                      className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            </form>

            {/* Legal / resend / toggle */}
            <div className="relative mt-6 space-y-4">
              {isSignUp && (
                <>
                  <p className="text-[11px] leading-relaxed text-white/45">
                    By creating an account, you agree to our{" "}
                    <Link
                      to="/terms"
                      className="font-medium text-[hsl(var(--apice-gold))] transition-colors hover:text-[hsl(var(--apice-gold))]/80"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-medium text-[hsl(var(--apice-gold))] transition-colors hover:text-[hsl(var(--apice-gold))]/80"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="text-xs font-medium text-[hsl(var(--apice-gold))] transition-colors hover:text-[hsl(var(--apice-gold))]/80"
                    >
                      Didn't receive it? Resend
                    </button>
                  </div>
                </>
              )}

              <div className="border-t border-white/5 pt-4 text-center text-xs text-white/55">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp((v) => !v)}
                  className="ml-1 font-bold text-white transition-colors hover:text-[hsl(var(--apice-gold))] focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex items-center gap-2 text-[11px] text-white/40"
        >
          <Shield className="h-3 w-3 text-emerald-400/70" aria-hidden="true" />
          <span className="tracking-wide">
            {isDemoMode
              ? "Demo mode — no real account created"
              : "Bank-grade encryption · Non-custodial · Your keys, your crypto"}
          </span>
          <Sparkles
            className="h-3 w-3 text-[hsl(var(--apice-gold))]/50"
            aria-hidden="true"
          />
        </motion.div>
      </main>
    </div>
  );
}
