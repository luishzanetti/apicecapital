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
const Analytics = lazy(() => import("./pages/Analytics"));
const MethodologyMission = lazy(() => import("./pages/MethodologyMission"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Branded loading screen with Apice logo
function AppLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
      <div className="w-14 h-14 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
        <svg
          width="28"
          height="28"
          viewBox="0 0 40 40"
          fill="none"
          className="text-white"
        >
          <path
            d="M20 4L36 34H4L20 4Z"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M20 14L29 32H11L20 14Z"
            fill="currentColor"
            opacity="0.3"
          />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground font-medium">Loading...</p>
    </div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoading />;
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
    <Suspense fallback={<AppLoading />}>
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
        <Route path="/analytics" element={<Analytics />} />
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
