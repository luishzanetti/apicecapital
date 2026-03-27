import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/appStore';
import { portfolios, aiMarketRecommendations } from '@/data/sampleData';
import { AllocationEngine } from '@/components/AllocationEngine';
import { WeeklyDepositConfirm } from '@/components/WeeklyDepositConfirm';
import DCAOnboarding from '@/components/DCAOnboarding';
import InvestmentDashboard from '@/components/InvestmentDashboard';
import ActionPlanWidget from '@/components/ActionPlanWidget';
import LockedStrategies from '@/components/LockedStrategies';
import { TopCoinsList } from '@/components/TopCoinsList';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { SpotHoldingsTable } from '@/components/portfolio/SpotHoldingsTable';
import { AccountOverviewCard } from '@/components/portfolio/AccountOverviewCard';
import { DCATracker } from '@/components/portfolio/DCATracker';
import { PerformanceMetrics } from '@/components/portfolio/PerformanceMetrics';
import {
  DollarSign, ChevronRight, Edit3, Check,
  Wallet, PieChart, Lock, Flame,
  ArrowRight, CheckCircle2, Target, Sparkles,
  Brain, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

function getCurrentWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function Portfolio() {
  const navigate = useNavigate();
  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
  const setWeeklyInvestment = useAppStore((s) => s.setWeeklyInvestment);
  const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
  const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
  const selectPortfolio = useAppStore((s) => s.selectPortfolio);

  const [editingWeekly, setEditingWeekly] = useState(false);
  const [editAmount, setEditAmount] = useState(weeklyInvestment);
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [showDCAOnboarding, setShowDCAOnboarding] = useState(false);
  const [pendingAllocations, setPendingAllocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'history'>('overview');

  const totalDeposited = weeklyDepositHistory.reduce((sum, d) => sum + d.amount, 0);
  const currentWeekId = getCurrentWeekId();
  const thisWeekDeposited = weeklyDepositHistory.some(d => d.weekId === currentWeekId);

  const corePortfolios = portfolios.filter(p => p.type === 'core');
  const proPortfolios = portfolios.filter(p => p.type === 'optimized');

  const marketSentiment = useMemo(() => {
    const sentiments = ['neutral', 'dip', 'bullish', 'neutral'] as const;
    const idx = Math.floor(new Date().getDate() / 8) % sentiments.length;
    return aiMarketRecommendations[sentiments[idx]];
  }, []);

  const handleAcceptAllocation = (allocations: { asset: string; percentage: number; color: string }[]) => {
    setPendingAllocations(allocations);
    setShowDCAOnboarding(true);
  };

  const handleDCAOnboardingComplete = () => {
    const firstUnlocked = corePortfolios[0];
    if (firstUnlocked && pendingAllocations.length > 0) {
      selectPortfolio(firstUnlocked.id, pendingAllocations.map(a => ({
        asset: a.asset,
        percentage: a.percentage,
        color: a.color,
      })));
    }
  };

  const handleSaveWeekly = () => {
    setWeeklyInvestment(editAmount);
    setEditingWeekly(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-4"
        style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.07) 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Investment Engine</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Portfolio</h1>
          </div>
          {weeklyDepositStreak > 0 && (
            <Badge
              variant="outline"
              className="gap-1.5 border-orange-500/30 bg-orange-500/5 text-orange-400 text-[10px] font-bold"
            >
              <Flame className="w-3 h-3" />
              {weeklyDepositStreak}w streak
            </Badge>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex bg-secondary/40 rounded-2xl p-1 gap-1 relative">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'strategies', label: 'Strategies' },
            { key: 'history', label: 'History' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative flex-1 py-2 px-3 rounded-[14px] text-xs font-semibold transition-colors duration-200 z-10',
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="portfolioTabPill"
                  className="absolute inset-0 bg-card rounded-[14px] shadow-sm"
                  style={{ border: '1px solid hsl(var(--border) / 0.4)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Empty State: No portfolio selected */}
              {selectedPortfolio.portfolioId === null && weeklyInvestment === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">Your portfolio starts here</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-[280px] mx-auto leading-relaxed">
                    Choose a strategy and set up your weekly investment to start building wealth automatically.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setActiveTab('strategies')}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white apice-gradient-primary transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      Explore Strategies
                    </button>
                    <button
                      onClick={() => navigate('/journey')}
                      className="w-full py-3 rounded-xl text-sm font-semibold border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-[0.98]"
                    >
                      Start the Apice Journey
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Hero: Portfolio Summary with Allocation Ring */}
              <PortfolioSummaryCard />

              {/* Spot Holdings Table */}
              <SpotHoldingsTable />

              {/* Account Overview */}
              <AccountOverviewCard />

              {/* DCA Automation Tracker */}
              <DCATracker />

              {/* Portfolio Health & Insights */}
              <PerformanceMetrics />

              {/* Market Coins */}
              <TopCoinsList />

              {/* AI Market Insight */}
              {weeklyInvestment > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <div className={cn(
                    'p-4 rounded-2xl border transition-all',
                    marketSentiment.bgColor,
                    marketSentiment.borderColor
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-lg shrink-0">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold">AI Recommendation</span>
                          <Badge variant="outline" className={cn('text-[8px] px-1', marketSentiment.borderColor, marketSentiment.color)}>
                            {marketSentiment.title}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {marketSentiment.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Weekly Investment Editor */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="overflow-hidden">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Weekly Investment</span>
                      </div>
                      {!editingWeekly ? (
                        <button
                          onClick={() => { setEditAmount(weeklyInvestment); setEditingWeekly(true); }}
                          className="flex items-center gap-1 text-xs text-primary"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      ) : (
                        <button onClick={handleSaveWeekly} className="flex items-center gap-1 text-xs text-green-500">
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                      )}
                    </div>

                    {editingWeekly ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">${editAmount}</span>
                          <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <Slider
                          value={[editAmount]}
                          onValueChange={([v]) => setEditAmount(v)}
                          min={10}
                          max={2000}
                          step={5}
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>$10</span>
                          <span>${(editAmount * 4).toLocaleString()}/month</span>
                          <span>$2,000</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-end gap-2 mb-1">
                          <span className="text-2xl font-bold">${weeklyInvestment}</span>
                          <span className="text-xs text-muted-foreground mb-1">/week · ${(weeklyInvestment * 4).toLocaleString()}/month</span>
                        </div>
                        {weeklyInvestment === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => navigate('/investment-setup')}
                          >
                            Set Up Weekly Investment
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Confirm Deposit CTA */}
              {weeklyInvestment > 0 && !thisWeekDeposited && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  <button onClick={() => setShowDepositConfirm(true)} className="w-full press-scale">
                    <div
                      className="p-4 rounded-2xl border border-primary/30 hover:border-primary/50 transition-all"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.09), hsl(250 84% 60% / 0.06))' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 glow-primary">
                          <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold">Confirm Weekly Deposit</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ${weeklyInvestment} ready to allocate · Tap to confirm
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              {thisWeekDeposited && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-400">This week's deposit confirmed!</p>
                    <p className="text-xs text-muted-foreground">Next deposit next week</p>
                  </div>
                </div>
              )}

              {/* Smart Allocation Engine */}
              {weeklyInvestment > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <AllocationEngine
                    weeklyAmount={weeklyInvestment}
                    onAccept={handleAcceptAllocation}
                    onCustomize={() => navigate('/portfolio/builder')}
                  />
                </motion.div>
              )}

              {/* Action Plan Widget */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <ActionPlanWidget />
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'strategies' && (
            <motion.div
              key="strategies"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  Core Portfolios
                  <Badge variant="secondary" className="text-[9px]">DCA</Badge>
                </h3>
                <div className="space-y-3">
                  {corePortfolios.map((portfolio) => (
                    <Card
                      key={portfolio.id}
                      className={cn(
                        'overflow-hidden cursor-pointer transition-all active:scale-[0.98]',
                        selectedPortfolio.portfolioId === portfolio.id
                          ? 'border-primary/40 shadow-lg shadow-primary/5'
                          : 'border-border hover:border-primary/20'
                      )}
                      onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-semibold">{portfolio.name}</h4>
                              {selectedPortfolio.portfolioId === portfolio.id && (
                                <Badge className="text-[8px] px-1 py-0 bg-primary">Active</Badge>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[9px]',
                                portfolio.risk === 'conservative' && 'bg-green-500/10 text-green-400',
                                portfolio.risk === 'balanced' && 'bg-amber-500/10 text-amber-400',
                                portfolio.risk === 'growth' && 'bg-red-500/10 text-red-400',
                              )}
                            >
                              {portfolio.riskLabel}
                            </Badge>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{portfolio.description}</p>
                        <div className="flex h-2 rounded-full overflow-hidden">
                          {portfolio.allocations.map((alloc) => (
                            <div
                              key={alloc.asset}
                              className="h-full"
                              style={{ width: `${alloc.percentage}%`, backgroundColor: alloc.color }}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {portfolio.allocations.map((alloc) => (
                            <div key={alloc.asset} className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alloc.color }} />
                              <span className="text-[10px] text-muted-foreground">{alloc.asset} {alloc.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/50" />
              <LockedStrategies />

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Optimized Portfolios
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20" variant="outline">Pro</Badge>
                </h3>
                <div className="space-y-3">
                  {proPortfolios.map((portfolio) => (
                    <Card key={portfolio.id} className="overflow-hidden border-border/50 opacity-75">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">{portfolio.name}</h4>
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <Badge variant="secondary" className="text-[9px]">{portfolio.riskLabel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{portfolio.description}</p>
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate('/upgrade')}>
                          Unlock with Pro
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Card
                className="border-dashed border-primary/30 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
                onClick={() => navigate('/portfolio/builder')}
              >
                <CardContent className="pt-4 pb-4 text-center">
                  <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold mb-0.5">Build Custom Portfolio</p>
                  <p className="text-xs text-muted-foreground">Create your own allocation strategy</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Invested</p>
                    <p className="text-sm font-bold">${totalDeposited.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Deposits</p>
                    <p className="text-sm font-bold">{weeklyDepositHistory.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Streak</p>
                    <p className="text-sm font-bold">{weeklyDepositStreak}w</p>
                  </CardContent>
                </Card>
              </div>
              <InvestmentDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WeeklyDepositConfirm
        isOpen={showDepositConfirm}
        onClose={() => setShowDepositConfirm(false)}
      />
      <DCAOnboarding
        isOpen={showDCAOnboarding}
        onClose={() => setShowDCAOnboarding(false)}
        onComplete={handleDCAOnboardingComplete}
      />
    </div>
  );
}
