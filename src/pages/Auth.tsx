import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Account created!", {
                    description: "Please check your email to confirm your account."
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        toast.error("Email not confirmed", {
                            description: "Please check your inbox or spam folder for the confirmation link."
                        });
                        return;
                    }
                    if (error.message.includes("Invalid login credentials")) {
                        toast.error("Invalid credentials", {
                            description: "Check your email and password or sign up if you don't have an account."
                        });
                        return;
                    }
                    throw error;
                }
                toast.success("Successfully logged in!");
                navigate("/home");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Authentication failed", {
                description: error.message || "An error occurred. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? "Enter your email below to create your account"
                            : "Enter your email below to login to your account"}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    placeholder="m@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Sign Up" : "Sign In"}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
