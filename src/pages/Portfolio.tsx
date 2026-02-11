import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore, recommendedPath } from '@/store/appStore';
import { portfolios } from '@/data/sampleData';
import { PortfolioAiAnalysis } from '@/components/PortfolioAiAnalysis';
import {
  ArrowRight, Shield, PieChart, Lock, Sparkles, Target,
  TrendingUp, ChevronRight, Zap, Award, DollarSign, Layers,
  RefreshCcw, Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Milestone tiers for progressive unlocking
const MILESTONES = [
  {
    threshold: 0,
    label: 'Starter',
    description: 'Core portfolios available',
    icon: '🌱',
    unlockedStrategies: ['core'],
  },
  {
    threshold: 300,
    label: 'Builder',
    description: 'Unlock optimized portfolios',
    icon: '🔨',
    unlockedStrategies: ['core', 'optimized'],
  },
  {
    threshold: 1000,
    label: 'Strategist',
    description: 'Unlock advanced diversification',
    icon: '🎯',
    unlockedStrategies: ['core', 'optimized', 'advanced'],
  },
  {
    threshold: 3000,
    label: 'Architect',
    description: 'Full access + explosive list',
    icon: '🏗️',
    unlockedStrategies: ['core', 'optimized', 'advanced', 'explosive'],
  },
  {
    threshold: 10000,
    label: 'Titan',
    description: 'Elite strategies & AI optimization',
    icon: '👑',
    unlockedStrategies: ['core', 'optimized', 'advanced', 'explosive', 'elite'],
  },
];

const WEEKLY_PRESETS = [25, 50, 100, 200, 500];

export default function Portfolio() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const unlockState = useAppStore((s) => s.unlockState);
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
  const dcaGamification = useAppStore((s) => s.dcaGamification);

  const [weeklyAmount, setWeeklyAmount] = useState(50);
  // Separate state for the projection chart slider if needed, or sync them
  const [projectionWeeklyInput, setProjectionWeeklyInput] = useState(50);

  const recommended = investorType ? recommendedPath[investorType] : 'balanced';

  // Calculate current tier based on total invested
  const totalInvested = dcaGamification.totalAmountCommitted;
  const currentMilestoneIndex = MILESTONES.reduce((acc, m, i) =>
    totalInvested >= m.threshold ? i : acc, 0
  );
  const currentMilestone = MILESTONES[currentMilestoneIndex];
  const nextMilestone = MILESTONES[currentMilestoneIndex + 1];
  const progressToNext = nextMilestone
    ? Math.min(100, ((totalInvested - currentMilestone.threshold) / (nextMilestone.threshold - currentMilestone.threshold)) * 100)
    : 100;

  // Mock projection data based on weekly input
  const generateProjections = (weekly: number) => {
    const data = [];
    let total = 0;
    let invested = 0;
    const annualRate = 0.08; // 8% avg return
    for (let month = 0; month <= 60; month++) { // 5 years
      if (month > 0) {
        invested += weekly * 4;
        total = (total + weekly * 4) * (1 + annualRate / 12);
      }
      if (month % 3 === 0) { // Add data point every quarter
        data.push({
          month: `M${month}`,
          value: Math.round(total),
          invested: Math.round(invested)
        });
      }
    }
    return data;
  };

  const projectionData = generateProjections(projectionWeeklyInput);

  const corePortfolios = portfolios.filter(p => p.type === 'core');
  const optimizedPortfolios = portfolios.filter(p => p.type === 'optimized');

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'low' as const;
      case 'balanced': return 'medium' as const;
      case 'growth': return 'high' as const;
      default: return 'default' as const;
    }
  };

  const isPortfolioLocked = (portfolio: typeof portfolios[0]) => {
    if (portfolio.type === 'core') return false;
    if (portfolio.type === 'optimized') return totalInvested < 300 && !unlockState.optimizedPortfolios;
    return true;
  };

  // Weekly projection
  const monthlyProjection = weeklyAmount * 4;
  const yearlyProjection = weeklyAmount * 52;
  const weeksToNextTier = nextMilestone
    ? Math.ceil((nextMilestone.threshold - totalInvested) / weeklyAmount)
    : 0;

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Portfolio</h1>
          </div>
          <p className="text-muted-foreground text-xs">
            Invest, grow, and unlock smarter diversification
          </p>
        </div>

        {/* Milestone Progress Card */}
        <Card className="overflow-hidden">
          <div className="apice-gradient-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentMilestone.icon}</span>
                <div>
                  <p className="text-xs opacity-80">Current Tier</p>
                  <h3 className="font-bold text-lg">{currentMilestone.label}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Total Invested</p>
                <p className="font-bold text-lg">${totalInvested.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {nextMilestone && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs opacity-80">
                  <span>${currentMilestone.threshold.toLocaleString()}</span>
                  <span>${nextMilestone.threshold.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-foreground rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs opacity-80 text-center">
                  ${(nextMilestone.threshold - totalInvested).toLocaleString()} to unlock <strong>{nextMilestone.label}</strong>
                  {weeksToNextTier > 0 && ` · ~${weeksToNextTier} weeks at $${weeklyAmount}/wk`}
                </p>
              </div>
            )}
            {!nextMilestone && (
              <p className="text-xs opacity-80 text-center mt-2">
                🎉 You've reached the highest tier! All strategies unlocked.
              </p>
            )}
          </div>

          {/* Milestone Roadmap */}
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between overflow-x-auto scrollbar-hide gap-1">
              {MILESTONES.map((m, i) => {
                const isActive = i <= currentMilestoneIndex;
                const isCurrent = i === currentMilestoneIndex;
                return (
                  <div key={m.label} className="flex flex-col items-center min-w-[56px]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 transition-all ${isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-card' :
                      isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                      {m.icon}
                    </div>
                    <span className={`text-[9px] text-center font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>{m.label}</span>
                    <span className="text-[8px] text-muted-foreground">${m.threshold.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Investment Input */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Weekly Investment
              </h3>
              <span className="text-lg font-bold text-primary">${weeklyAmount}</span>
            </div>

            {/* Presets */}
            <div className="flex gap-2 mb-4">
              {WEEKLY_PRESETS.map(amount => (
                <button
                  key={amount}
                  onClick={() => setWeeklyAmount(amount)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${weeklyAmount === amount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Slider */}
            <Slider
              value={[weeklyAmount]}
              onValueChange={([v]) => setWeeklyAmount(v)}
              min={5}
              max={1000}
              step={5}
              className="mb-4"
            />
          </CardContent>
        </Card>

        {/* AI Analysis Component */}
        <PortfolioAiAnalysis />
      </motion.div>

      {/* Growth Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Growth Projection
            </CardTitle>
            <CardDescription>
              Estimated value in 5 years with consistent investing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="invested" stroke="#82ca9d" fillOpacity={0} strokeDasharray="5 5" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekly Contribution</span>
                <span className="text-lg font-bold text-primary">${projectionWeeklyInput}</span>
              </div>
              <Slider
                value={[projectionWeeklyInput]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(vals) => setProjectionWeeklyInput(vals[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$10</span>
                <span>$1,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio Construction Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="advanced">Degen</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="space-y-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-base">Blue Chip Foundation</CardTitle>
                <CardDescription>Low volatility, long-term store of value.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">₿</div>
                      <span>Bitcoin</span>
                    </div>
                    <span className="font-bold">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">Ξ</div>
                      <span>Ethereum</span>
                    </div>
                    <span className="font-bold">30%</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="secondary" onClick={() => navigate('/portfolio/builder?template=core')}>
                  Apply Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explore" className="space-y-4">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-base">Sector Leaders</CardTitle>
                <CardDescription>Top protocols in AI, Gaming, and RWA.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">AI</Badge>
                      <span>Fetch.ai / Render</span>
                    </div>
                    <span className="font-bold">10%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Gaming</Badge>
                      <span>IMX / Beam</span>
                    </div>
                    <span className="font-bold">5%</span>
                  </div>
                </div>
                {unlockState.optimizedPortfolios ? (
                  <Button className="w-full mt-4" variant="secondary" onClick={() => navigate('/portfolio/builder?template=explore')}>
                    View Assets
                  </Button>
                ) : (
                  <Button className="w-full mt-4" variant="outline" disabled>
                    <Lock className="w-4 h-4 mr-2" /> Unlock with $1k Invested
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card className="border-l-4 border-l-red-500 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-base text-red-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> High Risk / Reward
                </CardTitle>
                <CardDescription>Memecoins and micro-caps. Capital at risk.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This section is for experienced users only.
                  Do not allocate more than 5% of your total portfolio here.
                </p>
                {unlockState.explosiveList ? (
                  <Button className="w-full" variant="destructive" onClick={() => navigate('/portfolio/builder?template=degen')}>
                    Enter War Room
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    <Lock className="w-4 h-4 mr-2" /> Unlock with Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Milestone Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-secondary to-background border-none">
          <CardContent className="pt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Next Milestone</p>
                  <h3 className="text-lg font-bold">{nextMilestone.label} Status</h3>
                </div>
                <span className="text-xl font-bold text-primary">{Math.round(progressToNext)}%</span>
              </div>
              <Progress value={progressToNext} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                Invest <span className="text-foreground font-medium">${(nextMilestone.threshold - totalInvested).toLocaleString()}</span> more to unlock {nextMilestone.label} features.
              </p>
              {/* Advanced Diversification — unlock at $1000 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Advanced Diversification
                  </h2>
                  <Badge variant={totalInvested >= 1000 ? 'unlocked' : 'locked'} size="sm">
                    {totalInvested >= 1000 ? 'Unlocked' : '$1,000 to unlock'}
                  </Badge>
                </div>
                <LockedOverlay
                  isLocked={totalInvested < 1000}
                  message={totalInvested < 1000
                    ? `Invest $${(1000 - totalInvested).toLocaleString()} more to unlock`
                    : undefined}
                  onUnlock={() => { }}
                >
                  <Card className={totalInvested < 1000 ? 'opacity-60' : ''}>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">Multi-Strategy Portfolio</h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            Combine DCA, yield strategies, and momentum plays in one optimized portfolio tailored to your goals.
                          </p>
                          <Badge variant="default" size="sm">AI-Personalized</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </LockedOverlay>
              </div>

              {/* Explosive List — unlock at $3000 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Explosive List
                  </h2>
                  <Badge variant={totalInvested >= 3000 ? 'unlocked' : 'locked'} size="sm">
                    {totalInvested >= 3000 ? 'Unlocked' : '$3,000 to unlock'}
                  </Badge>
                </div>
                <LockedOverlay
                  isLocked={totalInvested < 3000 && !unlockState.explosiveList}
                  message={`Invest $${(3000 - totalInvested).toLocaleString()} more to unlock`}
                  onUnlock={() => { }}
                >
                  <Card className={`border-destructive/20 bg-destructive/5 ${totalInvested < 3000 ? 'opacity-60' : ''}`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">High-Volatility Basket</h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            Higher volatility assets for asymmetric upside. Advanced users with proven discipline only.
                          </p>
                          <Badge variant="high" size="sm">Very High Risk</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </LockedOverlay>
              </div>

              {/* Portfolio Builder CTA */}
              <Card
                className="cursor-pointer hover:border-primary/20 transition-colors"
                onClick={() => navigate('/portfolio/builder')}
              >
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-0.5">Custom Builder</h3>
                        <p className="text-xs text-muted-foreground">
                          Create your own allocation strategy
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Trust Banner */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  All portfolios are frameworks. Your funds stay on your exchange. You control execution.
                </p>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[10px] text-muted-foreground pt-2">
                Past performance does not guarantee future results.
                <br />
                Crypto involves risk. Allocate responsibly.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
