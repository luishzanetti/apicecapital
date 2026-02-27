import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  TrendingUp,
  Plus,
  ArrowRight,
  Wallet,
  Zap,
  Target,
  Shield,
  Link as LinkIcon,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/components/AuthProvider";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { TopCoinsList } from "@/components/TopCoinsList";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Investor';

  const userProfile = useAppStore((state) => state.userProfile);
  const setupProgress = useAppStore((state) => state.setupProgress);
  const subscription = useAppStore((state) => state.subscription);
  const daysActive = useAppStore((state) => state.daysActive);

  /*
  const {
    holdings,
    totalBalance,
    totalPnL,
    totalPnLPercentage,
    isLoading: isPortfolioLoading
  } = usePortfolioData();
  */
  // Mock data to unblock initial load
  const holdings: any[] = [];
  const totalBalance = 0;
  const totalPnL = 0;
  const totalPnLPercentage = 0;
  const isPortfolioLoading = false;

  // Calculate setup progress percentage by counting true values
  const progressSteps = [
    setupProgress?.exchangeAccountCreated,
    setupProgress?.corePortfolioSelected,
    setupProgress?.dcaPlanConfigured,
  ];
  const completedSteps = progressSteps.filter(Boolean).length;
  const progressPercentage = (completedSteps / progressSteps.length) * 100;

  const handleConnectBybit = () => {
    toast.info("Exchange Integration", {
      description: "Coming soon! AI analysis of your Bybit trades is being developed."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 safe-top">
      {/* Header */}
      <header className="px-5 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-3" onClick={() => navigate('/profile')}>
          <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
            <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back,</p>
            <h2 className="text-sm font-bold">{userName}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => navigate('/profile')}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/profile')}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-8">
        {/* Portfolio Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wallet className="w-32 h-32" />
            </div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                  <h1 className="text-3xl font-bold tracking-tight">
                    ${isPortfolioLoading ? "..." : totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>
                <Badge variant={totalPnL >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPortfolioLoading ? "..." : `${Math.abs(totalPnLPercentage).toFixed(2)}%`}
                </Badge>
              </div>
              <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString()} (All time)
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <AddTransactionModal onTransactionAdded={() => {}} />
                <Button variant="outline" className="w-full bg-background/50 hover:bg-background/80" onClick={() => navigate('/portfolio')}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top 10 Coins Carousel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TopCoinsList />
        </motion.div>

        {/* Action Required / Setup */}
        {progressPercentage < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Setup Progress
                  </CardTitle>
                  <span className="text-xs font-mono text-primary">{Math.round(progressPercentage)}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progressPercentage} className="h-2 mb-3" />
                <p className="text-xs text-muted-foreground mb-3">
                  Complete your profile to unlock AI insights.
                </p>
                <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={() => navigate('/quiz')}>
                  Continue Setup <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Exchange Integration Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-none text-white relative overflow-hidden group cursor-pointer" onClick={handleConnectBybit}>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <CardContent className="flex items-center gap-4 p-5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base">Connect Bybit</h3>
                <p className="text-xs text-gray-300 mt-1">
                  Analyze your trade history with AI to find patterns and improve.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions / Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/30 transition-all border-dashed" onClick={() => navigate('/portfolio/builder')}>
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center h-full">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Portfolio Builder</h3>
                <p className="text-[10px] text-muted-foreground">Create custom index</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/30 transition-all border-dashed" onClick={() => navigate('/strategies')}>
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2 text-center h-full">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Strategies</h3>
                <p className="text-[10px] text-muted-foreground">Automated plays</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Holdings Snapshot */}
        <div>
          <h3 className="font-semibold text-sm mb-3 px-1">Top Holdings</h3>
          {holdings.length > 0 ? (
            <div className="space-y-2">
              {holdings.slice(0, 3).map((holding) => (
                <Card key={holding.asset} className="border-none bg-secondary/30">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-bold text-xs">
                        {holding.asset.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{holding.asset}</p>
                        <p className="text-xs text-muted-foreground">{holding.amount} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">${holding.value.toLocaleString()}</p>
                      <p className={`text-xs ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">No assets yet</p>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => document.getElementById('add-transaction-trigger')?.click()}>
                  Add your first asset
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
