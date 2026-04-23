import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store/appStore";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LevelUpCelebration } from "@/components/academy/LevelUpCelebration";
import { BadgeEarnedModal } from "@/components/academy/BadgeEarnedModal";
import { ApiceLogo } from "@/components/brand";

const Landing = lazy(() => import("./pages/AiTradeLanding"));
const Splash = lazy(() => import("./pages/Splash"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const Quiz = lazy(() => import("./pages/Quiz"));
const QuizV2 = lazy(() => import("./pages/QuizV2"));
const ProfileResult = lazy(() => import("./pages/ProfileResult"));
const ApiceOnboarding = lazy(() => import("./pages/AiTradeOnboarding"));
const Home = lazy(() => import("./pages/Home"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PortfolioDetail = lazy(() => import("./pages/PortfolioDetail"));
const Strategies = lazy(() => import("./pages/Strategies"));
const DCAPlanner = lazy(() => import("./pages/DCAPlanner"));
const Learn = lazy(() => import("./pages/Learn"));
const LessonPlayerPage = lazy(() => import("./pages/LessonPlayerPage"));
const ActivationChallenge = lazy(() => import("./pages/ActivationChallenge"));
const Badges = lazy(() => import("./pages/Badges"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Settings = lazy(() => import("./pages/Settings"));
const ReferralLinks = lazy(() => import("./pages/ReferralLinks"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Support = lazy(() => import("./pages/Support"));
const Automations = lazy(() => import("./pages/Automations"));
const CashbackOnboarding = lazy(() => import("./pages/CashbackOnboarding"));
const CashbackMachine = lazy(() => import("./pages/CashbackMachine"));
const CashbackDashboard = lazy(() => import("./pages/CashbackDashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AiTradeDashboard = lazy(() => import("./pages/AiTradeDashboard"));
const AiTradeSetup = lazy(() => import("./pages/AiTradeSetup"));
const ApexAiLanding = lazy(() => import("./pages/ApexAiLanding"));
const ApexAiOnboarding = lazy(() => import("./pages/ApexAiOnboarding"));
const ApexAiSetup = lazy(() => import("./pages/ApexAiSetup"));
const ApexAiDashboard = lazy(() => import("./pages/ApexAiDashboard"));
const ApexAiPortfolios = lazy(() => import("./pages/ApexAiPortfolios"));
const ApexAiStatements = lazy(() => import("./pages/ApexAiStatements"));
import { ApexAiErrorBoundary } from "./components/apex-ai/ApexAiErrorBoundary";
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const QuickDCA = lazy(() => import("./pages/QuickDCA"));
const ExplosiveList = lazy(() => import("./pages/ExplosiveList"));
const MethodologyMission = lazy(() => import("./pages/MethodologyMission"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, gcTime: 300_000, refetchOnWindowFocus: false },
  },
});

// Branded loading screen with Apice logo
function AppLoading() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
      <div className="w-14 h-14 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
        <ApiceLogo variant="triangle" size={28} className="text-white" aria-label="Apice" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{t('common.loading')}</p>
    </div>
  );
}

// Legacy redirect: /learn/:trackId/:lessonId → /learn/lesson/:lessonId
const LegacyLessonRedirect = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  return <Navigate to={`/learn/lesson/${lessonId ?? ''}`} replace />;
};

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
  const checkTrialExpiry = useAppStore((s) => s.checkTrialExpiry);

  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    incrementDaysActive();
    checkTrialExpiry();
    // Apply persisted theme (default: dark)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [incrementDaysActive, checkTrialExpiry, theme]);

  return (
    <Suspense fallback={<AppLoading />}>
    <LevelUpCelebration />
    <BadgeEarnedModal />
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/welcome" element={<Welcome />} />
      {/* /quiz redirects to premium /quiz-v2 — legacy Quiz component kept for internal fallback. */}
      <Route path="/quiz" element={<Navigate to="/quiz-v2" replace />} />
      <Route path="/quiz-legacy" element={<Quiz />} />
      <Route path="/quiz-v2" element={<QuizV2 />} />
      <Route path="/profile-result" element={<ProfileResult />} />
      <Route path="/onboarding" element={<ApiceOnboarding />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/strategies/ai-trade" element={<Navigate to="/ai-trade" replace />} />
        <Route path="/ai-trade" element={<AiTradeDashboard />} />
        <Route path="/ai-trade/setup" element={<AiTradeSetup />} />
        {/* Apex AI — Trading 24/7 com IA, fee 10% profit */}
        <Route path="/apex-ai" element={<ApexAiErrorBoundary><ApexAiLanding /></ApexAiErrorBoundary>} />
        <Route path="/apex-ai/onboarding" element={<ApexAiErrorBoundary><ApexAiOnboarding /></ApexAiErrorBoundary>} />
        <Route path="/apex-ai/setup" element={<ApexAiErrorBoundary><ApexAiSetup /></ApexAiErrorBoundary>} />
        <Route path="/apex-ai/dashboard" element={<ApexAiErrorBoundary><ApexAiDashboard /></ApexAiErrorBoundary>} />
        <Route path="/apex-ai/portfolios" element={<ApexAiErrorBoundary><ApexAiPortfolios /></ApexAiErrorBoundary>} />
        <Route path="/apex-ai/statements" element={<ApexAiErrorBoundary><ApexAiStatements /></ApexAiErrorBoundary>} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/lesson/:lessonId" element={<LessonPlayerPage />} />
        <Route path="/learn/:trackId/:lessonId" element={<LegacyLessonRedirect />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/referrals" element={<ReferralLinks />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/support" element={<Support />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/asset/:id" element={<AssetDetail />} />
        <Route path="/quick-dca" element={<QuickDCA />} />
        <Route path="/explosive-list" element={<ExplosiveList />} />
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
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
