import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success("Account created!", {
                    description: "Please check your email to confirm your account.",
                });
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
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background orbs */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 50% at 50% -15%, hsl(var(--primary) / 0.1), transparent 70%)',
                }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full pointer-events-none"
                style={{
                    top: '-5%', left: '-20%',
                    background: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 70%)',
                    filter: 'blur(50px)',
                }}
                animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full pointer-events-none"
                style={{
                    bottom: '5%', right: '-15%',
                    background: 'radial-gradient(circle, hsl(250 84% 60% / 0.08), transparent 70%)',
                    filter: 'blur(50px)',
                }}
                animate={{ x: [0, -12, 0], y: [0, 14, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-2 mb-9 relative z-10"
            >
                <div className="w-14 h-14 rounded-[18px] apice-gradient-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-1">
                    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" className="text-white">
                        <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
                        <path d="M20 13L30 32H10L20 13Z" fill="currentColor" opacity="0.28" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isSignUp ? "Create your account" : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                    {isSignUp
                        ? "Start your crypto journey with Apice"
                        : "Sign in to your Apice Capital account"}
                </p>
            </motion.div>

            {/* Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="glass-card rounded-3xl p-6 shadow-2xl">
                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    placeholder="you@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 pl-10 rounded-2xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 focus:ring-2 transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 pl-10 pr-10 rounded-2xl bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 focus:ring-2 transition-all text-sm"
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            disabled={loading}
                            className="w-full h-12 rounded-2xl apice-gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all press-scale mt-2"
                        >
                            {loading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : isSignUp ? "Create Account" : "Sign In"}
                        </Button>
                    </form>

                    {/* Toggle sign in / sign up */}
                    <div className="mt-5 pt-4 border-t border-border/30">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-muted-foreground text-xs">
                                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[10px] text-muted-foreground/40 mt-8 text-center relative z-10"
            >
                Secure & private. Your keys, your crypto.
            </motion.p>
        </div>
    );
}
