import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/appStore";

const DEMO_SESSION_KEY = 'apice-demo-session';

function createDemoUser(email: string): User {
    return {
        id: 'demo-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
        email,
        app_metadata: {},
        user_metadata: { demo: true },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
    } as User;
}

function createDemoSession(email: string): Session {
    const user = createDemoUser(email);
    return {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 999999,
        expires_at: Math.floor(Date.now() / 1000) + 999999,
        token_type: 'bearer',
        user,
    } as Session;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    demoSignIn: (email: string) => void;
    isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
    demoSignIn: () => { },
    isDemoMode: false,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const syncFromSupabase = useAppStore((state) => state.syncFromSupabase);
    const resetApp = useAppStore((state) => state.resetApp);
    const isDemoMode = !isSupabaseConfigured;

    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Restore demo session from localStorage
            const savedEmail = localStorage.getItem(DEMO_SESSION_KEY);
            if (savedEmail) {
                const demoSession = createDemoSession(savedEmail);
                setSession(demoSession);
                setUser(demoSession.user);
            }
            setLoading(false);
            return;
        }

        let isMounted = true;

        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!isMounted) return;
                setSession(session);
                setUser(session?.user ?? null);
                if (session) {
                    syncFromSupabase();
                }
            })
            .catch((error) => {
                console.error("Failed to load session:", error);
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                if (session) {
                    syncFromSupabase();
                } else {
                    resetApp();
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [syncFromSupabase, resetApp]);

    const demoSignIn = (email: string) => {
        const demoSession = createDemoSession(email);
        localStorage.setItem(DEMO_SESSION_KEY, email);
        setSession(demoSession);
        setUser(demoSession.user);
    };

    const signOut = async () => {
        if (isDemoMode) {
            localStorage.removeItem(DEMO_SESSION_KEY);
            setSession(null);
            setUser(null);
            resetApp();
            return;
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, demoSignIn, isDemoMode }}>
            {children}
        </AuthContext.Provider>
    );
};
