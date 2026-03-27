import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store/appStore";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Splash = lazy(() => import("./pages/Splash"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const Quiz = lazy(() => import("./pages/Quiz"));
const ProfileResult = lazy(() => import("./pages/ProfileResult"));
const ApiceOnboarding = lazy(() => import("./pages/ApiceOnboarding"));
const Home = lazy(() => import("./pages/Home"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PortfolioDetail = lazy(() => import("./pages/PortfolioDetail"));
const Strategies = lazy(() => import("./pages/Strategies"));
const DCAPlanner = lazy(() => import("./pages/DCAPlanner"));
const Learn = lazy(() => import("./pages/Learn"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const ActivationChallenge = lazy(() => import("./pages/ActivationChallenge"));
const Settings = lazy(() => import("./pages/Settings"));
const ReferralLinks = lazy(() => import("./pages/ReferralLinks"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Support = lazy(() => import("./pages/Support"));
const Automations = lazy(() => import("./pages/Automations"));
const CashbackOnboarding = lazy(() => import("./pages/CashbackOnboarding"));
const CashbackMachine = lazy(() => import("./pages/CashbackMachine"));
const CashbackDashboard = lazy(() => import("./pages/CashbackDashboard"));
const MethodologyMission = lazy(() => import("./pages/MethodologyMission"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// App-level skeleton for loading states
function AppSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pt-8 pb-5 space-y-4" style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
      </div>
      <div className="px-6 space-y-4 mt-4">
        <div className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    </div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppSkeleton />;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const incrementDaysActive = useAppStore((s) => s.incrementDaysActive);
  const { session } = useAuth();

  useEffect(() => {
    incrementDaysActive();
    document.documentElement.classList.add('dark');
  }, [incrementDaysActive]);

  return (
    <Suspense fallback={<AppSkeleton />}>
    <Routes>
      <Route path="/splash" element={<Splash />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/profile-result" element={<ProfileResult />} />
      <Route path="/onboarding" element={<ApiceOnboarding />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:trackId/:lessonId" element={<LessonDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/referrals" element={<ReferralLinks />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/support" element={<Support />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/dca-planner" element={<DCAPlanner />} />
        <Route path="/automations/dca" element={<DCAPlanner />} />
        <Route path="/investment-setup" element={<DCAPlanner />} />
        <Route path="/activation-challenge" element={<ActivationChallenge />} />
        <Route path="/mission2/:step" element={<MethodologyMission />} />
        <Route path="/cashback-onboarding" element={<CashbackOnboarding />} />
        <Route path="/cashback-machine" element={<CashbackMachine />} />
        <Route path="/cashback-dashboard" element={<CashbackDashboard />} />
      </Route>

      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
