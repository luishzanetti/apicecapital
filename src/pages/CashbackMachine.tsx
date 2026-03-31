import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { referralLinks } from '@/data/sampleData';
import { 
  ArrowLeft, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  ChevronRight, 
  Check,
  ExternalLink,
  Sparkles,
  DollarSign,
  Gift,
  Zap,
  Clock,
  ArrowRight,
  Star,
  Bitcoin
} from 'lucide-react';

const cashbackTiers = [
  { category: 'Everyday Purchases', rate: '2%', description: 'Groceries, gas, dining, online shopping', icon: DollarSign },
  { category: 'Travel & Entertainment', rate: '3-5%', description: 'Hotels, flights, streaming services', icon: Star },
  { category: 'Select Subscriptions', rate: '100%', description: 'ChatGPT, Netflix, Spotify, Amazon Prime, TradingView', icon: Gift },
  { category: 'Premium Services', rate: '5-10%', description: 'Tech, SaaS, and partner brands', icon: Zap },
];

const projections = [
  { spend: 500, monthly: '10-50', yearly: '120-600' },
  { spend: 1000, monthly: '20-100', yearly: '240-1,200' },
  { spend: 2000, monthly: '40-200', yearly: '480-2,400' },
  { spend: 5000, monthly: '100-500', yearly: '1,200-6,000' },
];

const setupSteps = [
  { id: 'understand', title: 'Understand the Strategy', description: 'Learn how cashback-to-BTC works', icon: Sparkles },
  { id: 'apply', title: 'Apply for Card', description: 'Get your crypto cashback card', icon: CreditCard },
  { id: 'setup', title: 'Configure Cashback', description: 'Set BTC as your cashback currency', icon: Bitcoin },
  { id: 'spend', title: 'Use for All Expenses', description: 'Replace your current card for daily spending', icon: DollarSign },
  { id: 'compound', title: 'Watch It Compound', description: 'Your BTC grows with every purchase', icon: TrendingUp },
];

export default function CashbackMachine() {
  const navigate = useNavigate();
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const linkClicks = useAppStore((s) => s.linkClicks);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [selectedSpend, setSelectedSpend] = useState(2000);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  const currentProjection = projections.find(p => p.spend === selectedSpend) || projections[2];
  const bybitLink = referralLinks.find(l => l.id === 'bybit');

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Cashback Machine</h1>
              <Badge variant="premium" size="sm">New</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Turn expenses into Bitcoin income
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-24"
      >
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl apice-gradient-primary flex items-center justify-center shadow-lg">
                <CreditCard className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold">BTC Income Engine</h2>
                <p className="text-xs text-muted-foreground">Every purchase builds your Bitcoin stack</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The simplest wealth-building strategy: use a crypto cashback card for all your daily expenses 
              and automatically accumulate Bitcoin with every purchase. Zero extra effort, maximum compounding.
            </p>
          </div>
        </Card>

        {/* Cashback Tiers */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Cashback Rates
          </h2>
          <div className="space-y-2">
            {cashbackTiers.map((tier, i) => (
              <motion.div
                key={tier.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <tier.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{tier.category}</h3>
                          <Badge variant={tier.rate === '100%' ? 'premium' : 'outline'} size="sm">
                            {tier.rate}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Projection Calculator */}
        <Card variant="premium">
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Your BTC Projection
            </h3>
            
            <p className="text-xs text-muted-foreground mb-3">Monthly card spending:</p>
            <div className="flex gap-2 mb-4">
              {projections.map((p) => (
                <button
                  key={p.spend}
                  onClick={() => setSelectedSpend(p.spend)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedSpend === p.spend
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  ${p.spend.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Monthly BTC</p>
                <p className="text-xl font-bold">${currentProjection.monthly}</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">Yearly BTC</p>
                <p className="text-xl font-bold text-primary">${currentProjection.yearly}</p>
              </div>
            </div>

            <p className="text-[11px] text-center text-muted-foreground mt-3">
              Estimates based on average cashback rates. Actual BTC value varies with market price.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Setup Guide
          </h2>
          <div className="space-y-2">
            {setupSteps.map((step, i) => {
              const isCompleted = completedSteps.includes(step.id);
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${isCompleted ? 'border-primary/20 bg-primary/5' : ''}`}
                    onClick={() => {
                      if (step.id === 'apply' && bybitLink) {
                        trackLinkClick('bybit');
                        window.open(bybitLink.url, '_blank');
                      }
                      toggleStep(step.id);
                    }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          isCompleted 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium text-sm ${isCompleted ? 'text-primary' : ''}`}>{step.title}</h3>
                          <p className="text-[11px] text-muted-foreground">{step.description}</p>
                        </div>
                        {step.id === 'apply' && (
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Why This Works */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Why This Strategy Works
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Zero additional cost</span> — You're spending this money anyway. 
                  The cashback is pure accumulation.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Automatic DCA effect</span> — Every purchase dollar-cost-averages 
                  into BTC at different price points.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Compounding power</span> — Over years, even small daily cashback 
                  compounds significantly, especially if BTC appreciates.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">100% cashback subscriptions</span> — Services you already pay for 
                  become effectively free when cashback covers the full amount.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learn More CTA */}
        <Card 
          className="cursor-pointer hover:border-primary/20 transition-colors"
          onClick={() => navigate('/learn')}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Learn More About Cashback Strategies</h3>
                <p className="text-xs text-muted-foreground">
                  Deep-dive into compounding, BTC accumulation, and income strategies
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Trust Footer */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your card funds remain under your control. Cashback rates vary by provider and card tier. 
            BTC value fluctuates with market conditions.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
