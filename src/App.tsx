import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";

// Pages
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
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

function AppContent() {
  const incrementDaysActive = useAppStore((s) => s.incrementDaysActive);

  useEffect(() => {
    incrementDaysActive();
    document.documentElement.classList.add('dark');
  }, [incrementDaysActive]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/splash" element={<Splash />} />

      {/* Protected onboarding routes */}
      <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/profile-result" element={<ProtectedRoute><ProfileResult /></ProtectedRoute>} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
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
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
