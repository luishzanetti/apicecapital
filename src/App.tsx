import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

// Pages
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Quiz from "./pages/Quiz";
import ProfileResult from "./pages/ProfileResult";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./pages/PortfolioDetail";
import PortfolioBuilder from "./pages/PortfolioBuilder";
import Strategies from "./pages/Strategies";
import DCAPlanner from "./pages/DCAPlanner";
import CashbackMachine from "./pages/CashbackMachine";
import Learn from "./pages/Learn";
import LessonDetail from "./pages/LessonDetail";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
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
    <Routes>
      <Route path="/splash" element={session ? <Navigate to="/home" /> : <Splash />} />
      <Route path="/welcome" element={session ? <Navigate to="/home" /> : <Welcome />} />
      <Route path="/auth" element={session ? <Navigate to="/home" /> : <Auth />} />

      {/* Quiz flow can be public or protected depending on preference, kept public for onboarding */}
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/profile-result" element={<ProfileResult />} />

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/home" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/portfolio/builder" element={<PortfolioBuilder />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/strategies/dca" element={<DCAPlanner />} />
        <Route path="/strategies/cashback" element={<CashbackMachine />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:trackId/:lessonId" element={<LessonDetail />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/support" element={<Support />} />
      </Route>

      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
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
);

export default App;
