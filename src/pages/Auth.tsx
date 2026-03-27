import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const TRANSITION_SMOOTH = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: TRANSITION_SMOOTH } },
};

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, demoSignIn, isDemoMode } = useAuth();

  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Demo mode: skip Supabase, use local session
      if (isDemoMode) {
        demoSignIn(email);
        toast.success(isSignUp ? "Account created (demo mode)!" : "Welcome back (demo mode)!");
        navigate("/home");
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) {
          toast.success("Account created successfully!");
          navigate("/home");
        } else {
          toast.success("Account created!", {
            description: "Please check your email to confirm your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast.error("Email not confirmed", {
              description: "Please check your inbox or spam for the confirmation link.",
            });
            return;
          }
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid credentials", {
              description: "Check your email and password, or sign up if you don't have an account.",
            });
            return;
          }
          throw error;
        }
        toast.success("Welcome back!");
        navigate("/home");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Authentication failed", {
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, isSignUp, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Ambient Background — layered orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.08), transparent 60%)',
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            top: '-15%', left: '-15%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.07), transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            bottom: '-10%', right: '-10%',
            background: 'radial-gradient(circle, hsl(var(--apice-gradient-end) / 0.06), transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={{ x: [0, -15, 0], y: [0, 18, 0], scale: [1, 0.96, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10 flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 mb-10">
          <motion.div
            className="w-16 h-16 rounded-[20px] apice-gradient-primary flex items-center justify-center shadow-2xl relative"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <div className="absolute inset-0 rounded-[20px] glow-primary opacity-60" />
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="text-white relative z-10">
              <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
              <path d="M20 13L30 32H10L20 13Z" fill="currentColor" opacity="0.3" />
            </svg>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-caption text-muted-foreground mt-1.5">
                {isSignUp
                  ? "Start your crypto journey with Apice"
                  : "Sign in to your Apice Capital account"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="glass-card rounded-3xl p-6 apice-shadow-elevated">
            <form onSubmit={handleAuth} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-micro font-semibold text-muted-foreground uppercase tracking-widest">
                  Email
                </label>
                <div className="relative group">
                  <Mail className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === "email" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={loading}
                    value={email}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "h-12 pl-10 rounded-2xl bg-secondary/40 border-border/40 text-sm transition-all duration-300",
                      focusedField === "email" && "border-primary/50 ring-2 ring-primary/15 bg-secondary/60"
                    )}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-micro font-semibold text-muted-foreground uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <Lock className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                    focusedField === "password" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    value={password}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "h-12 pl-10 pr-10 rounded-2xl bg-secondary/40 border-border/40 text-sm transition-all duration-300",
                      focusedField === "password" && "border-primary/50 ring-2 ring-primary/15 bg-secondary/60"
                    )}
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  disabled={loading}
                  className="w-full h-12 rounded-2xl apice-gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Toggle */}
            <div className="mt-6 pt-4 border-t border-border/20">
              <div className="flex items-center justify-center gap-2">
                <span className="text-micro text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-micro font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 mt-8 text-muted-foreground/40"
        >
          <Shield className="w-3 h-3" />
          <span className="text-[10px] tracking-wide">
            {isDemoMode ? "Demo mode • No Supabase configured • Data saved locally" : "End-to-end encrypted • Your keys, your crypto"}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
