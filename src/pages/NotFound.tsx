import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  ArrowLeft,
  PieChart,
  CalendarClock,
  BookOpen,
  CreditCard,
  Compass,
  Search,
} from "lucide-react";

const suggestedPages = [
  { label: "Home", path: "/home", icon: Home, description: "Your dashboard" },
  { label: "Portfolio", path: "/portfolio", icon: PieChart, description: "View your holdings" },
  { label: "DCA Planner", path: "/dca-planner", icon: CalendarClock, description: "Set up auto-invest" },
  { label: "Learn", path: "/learn", icon: BookOpen, description: "Crypto education" },
  { label: "Cashback", path: "/cashback-machine", icon: CreditCard, description: "Earn BTC on purchases" },
  { label: "Strategies", path: "/strategies", icon: Compass, description: "Explore strategies" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 404 — route not found
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="text-7xl font-black text-primary/15 leading-none select-none">404</div>
          <h1 className="text-xl font-bold">Lost in the blockchain</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page <span className="font-mono text-xs bg-secondary/60 px-1.5 py-0.5 rounded">{location.pathname}</span> does not exist.
            But your portfolio is still safe — let us get you back on track.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go Back
          </Button>
          <Button size="sm" onClick={() => navigate('/home', { replace: true })}>
            <Home className="w-4 h-4 mr-1.5" />
            Home
          </Button>
        </div>

        {/* Suggested pages */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Looking for one of these?
            </p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-1">
                {suggestedPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => navigate(page.path)}
                    className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <page.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{page.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{page.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
