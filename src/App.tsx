import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";

// Pages
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Quiz from "./pages/Quiz";
import ProfileResult from "./pages/ProfileResult";
import Home from "./pages/Home";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Automate from "./pages/Automate";
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
      <Route path="/splash" element={<Splash />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/profile-result" element={<ProfileResult />} />
      
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/strategies/:id" element={<StrategyDetail />} />
        <Route path="/automate" element={<Automate />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/support" element={<Support />} />
        <Route path="/security" element={<Support />} />
        <Route path="/legal" element={<Support />} />
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
