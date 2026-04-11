import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ArrowRight,
  Bitcoin,
  Wallet,
  Target,
  Clock,
  CheckCircle2,
  Star,
  CircleDollarSign,
} from 'lucide-react';

const projections = [
  { spend: 500, monthly: 25, yearly: 300, btcYearly: 0.0032 },
  { spend: 1000, monthly: 50, yearly: 600, btcYearly: 0.0063 },
  { spend: 2000, monthly: 100, yearly: 1200, btcYearly: 0.0126 },
  { spend: 5000, monthly: 250, yearly: 3000, btcYearly: 0.0316 },
];

const subscriptions = [
  { name: 'Netflix', icon: '🎬', price: '$15.99/mo' },
  { name: 'Spotify', icon: '🎵', price: '$10.99/mo' },
  { name: 'ChatGPT', icon: '🤖', price: '$20/mo' },
  { name: 'Amazon Prime', icon: '📦', price: '$14.99/mo' },
  { name: 'TradingView', icon: '📊', price: '$14.95/mo' },
];

const milestones = [
  { amount: 500, label: 'First $500', reward: 'Start at 2%', icon: Target },
  { amount: 2000, label: '$2,000 spent', reward: 'Unlock 4% tier', icon: TrendingUp },
  { amount: 5000, label: '$5,000 spent', reward: 'Unlock 7% tier', icon: Star },
  { amount: 10000, label: '$10,000 spent', reward: 'Unlock 10% max tier', icon: Zap },
];

export default function CashbackMachine() {
  const navigate = useNavigate();
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);
  const [selectedSpend, setSelectedSpend] = useState(2000);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const currentProjection = projections.find((p) => p.spend === selectedSpend) || projections[2];
  const bybitLink = referralLinks.find((l) => l.id === 'bybit');

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Cashback Machine</h1>
              <Badge variant="premium" size="sm">New</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Turn every purchase into Bitcoin</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6">
        {/* HERO — Full visual impact */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(245,158,11,0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.18), transparent 50%), linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))',
              }}
            />
            <CardContent className="relative space-y-5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">BTC Income Engine</h2>
                  <p className="text-sm text-muted-foreground">Every swipe builds your Bitcoin stack</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Use your crypto cashback card as your <span className="font-semibold text-foreground">primary card</span> for all purchases.
                Get <span className="font-semibold text-amber-400">2% to 10% back in Bitcoin</span> on everything — and{' '}
                <span className="font-semibold text-green-400">100% back</span> on select subscriptions.
                Zero effort. Maximum compounding.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">2-10%</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">All purchases</p>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">100%</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Subscriptions</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Auto compound</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CASHBACK TIERS — Only 2, prominent */}
        <motion.div {...fadeUp} transition={{ delay: 0.08, duration: 0.5 }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">How you earn</h2>

          {/* Tier 1: All purchases */}
          <Card className="mb-3 overflow-hidden border-amber-500/20">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-amber-500/20 to-orange-500/10 p-4">
                  <CircleDollarSign className="mb-1 h-7 w-7 text-amber-400" />
                  <span className="text-2xl font-bold text-amber-400">2-10%</span>
                  <span className="text-xs uppercase tracking-wider text-amber-400/70">back</span>
                </div>
                <div className="flex-1 space-y-2 p-4">
                  <h3 className="text-base font-bold">Every Purchase, Every Day</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Groceries, gas, dining, shopping, online orders, rideshare — everything you already spend on.
                    Start at 2% and unlock up to 10% as you spend more.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Groceries', 'Gas', 'Dining', 'Shopping', 'Online', 'Rideshare'].map((tag) => (
                      <span key={tag} className="rounded-full border border-border/40 px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier 2: Subscriptions */}
          <Card className="overflow-hidden border-green-500/20">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-green-500/20 to-emerald-500/10 p-4">
                  <Gift className="mb-1 h-7 w-7 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">100%</span>
                  <span className="text-xs uppercase tracking-wider text-green-400/70">back</span>
                </div>
                <div className="flex-1 space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Select Subscriptions</h3>
                    <Badge variant="premium" size="sm">Best deal</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    100% of your subscription cost returned as Bitcoin. These services become
                    effectively free — you pay, and get every cent back in BTC.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subscriptions.map((sub) => (
                      <div key={sub.name} className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/5 px-2.5 py-1">
                        <span className="text-sm">{sub.icon}</span>
                        <span className="text-[11px] font-medium">{sub.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SPEND MILESTONES — Gamification to encourage spending */}
        <motion.div {...fadeUp} transition={{ delay: 0.16, duration: 0.5 }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Unlock higher rates</h2>
          <Card className="border-primary/10">
            <CardContent className="space-y-3 p-4">
              <p className="text-xs text-muted-foreground">
                The more you use the card, the higher your cashback rate. Deposit <span className="font-semibold text-foreground">$500</span> and make it your primary card to unlock tiers faster.
              </p>
              {milestones.map((m, i) => {
                const progress = Math.min(100, (0 / m.amount) * 100); // Will be dynamic with real data
                return (
                  <div key={m.amount} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <m.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{m.label}</span>
                        <span className="text-[11px] text-primary">{m.reward}</span>
                      </div>
                      <Progress value={progress} className="mt-1.5 h-1.5" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* PROJECTION CALCULATOR */}
        <motion.div {...fadeUp} transition={{ delay: 0.24, duration: 0.5 }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your BTC projection</h2>
          <Card className="overflow-hidden border-0 shadow-xl">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.12), transparent 60%)',
              }}
            />
            <CardContent className="relative space-y-4 p-5">
              <p className="text-xs text-muted-foreground">Monthly card spending:</p>
              <div className="flex gap-2">
                {projections.map((p) => (
                  <button
                    key={p.spend}
                    onClick={() => setSelectedSpend(p.spend)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      selectedSpend === p.spend
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    ${p.spend.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly</p>
                  <p className="mt-1 text-xl font-bold">${currentProjection.monthly}</p>
                  <p className="text-xs text-muted-foreground">in BTC</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Yearly</p>
                  <p className="mt-1 text-xl font-bold text-primary">${currentProjection.yearly.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">in BTC</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">BTC/year</p>
                  <p className="mt-1 text-lg font-bold text-amber-400">{currentProjection.btcYearly}</p>
                  <p className="text-xs text-muted-foreground">accumulated</p>
                </div>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Based on average 5% cashback rate. If BTC grows 50%/year, your $1,200 becomes $1,800+.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* SETUP GUIDE — Clear path to conversion */}
        <motion.div {...fadeUp} transition={{ delay: 0.32, duration: 0.5 }}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Get started in 4 steps</h2>
          <div className="space-y-2">
            {[
              {
                step: 1,
                title: 'Sign up on Bybit',
                description: 'Create your free Bybit account through our partner link. Takes 2 minutes.',
                detail: 'Bybit offers one of the best crypto debit card programs with cashback directly in BTC. No annual fee.',
                icon: Wallet,
                action: 'Sign Up Free',
                isExternal: true,
              },
              {
                step: 2,
                title: 'Deposit $500',
                description: 'Fund your account to activate the card and start earning immediately.',
                detail: 'Your $500 deposit stays in YOUR account — it\'s not a fee. Use it for trading, DCA, or just hold it. The deposit activates the physical card and the 2% cashback tier. Spend more to unlock higher tiers up to 10%.',
                icon: DollarSign,
                action: null,
              },
              {
                step: 3,
                title: 'Set as primary card',
                description: 'Replace your current debit/credit card for all daily purchases.',
                detail: 'Add it to Apple Pay / Google Pay for contactless. Use it for groceries, gas, dining, shopping — everything. The more you spend, the higher your tier unlocks.',
                icon: CreditCard,
                action: null,
              },
              {
                step: 4,
                title: 'Watch BTC stack up',
                description: 'Every purchase auto-converts cashback to Bitcoin. Compounding starts day one.',
                detail: 'Your BTC accumulates automatically. No manual action needed. Check your Apice dashboard to track growth, projections, and milestone progress.',
                icon: Bitcoin,
                action: null,
              },
            ].map((item, i) => {
              const isOpen = activeStep === i;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.06 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${isOpen ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5' : 'hover:border-border/60'}`}
                    onClick={() => setActiveStep(isOpen ? null : i)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                          isOpen ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                        }`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-primary">Step {item.step}</span>
                          </div>
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-xl border border-border/30 bg-black/20 p-3">
                              <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                              {item.isExternal && bybitLink && (
                                <Button
                                  size="sm"
                                  className="mt-3 w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    trackLinkClick('bybit');
                                    window.open(bybitLink.url, '_blank');
                                  }}
                                >
                                  {item.action}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* WHY IT WORKS — Trust & education */}
        <motion.div {...fadeUp} transition={{ delay: 0.4, duration: 0.5 }}>
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Why this strategy is unbeatable
              </h3>
              {[
                {
                  title: 'Zero additional cost',
                  text: 'You\'re spending this money anyway on groceries, gas, and subscriptions. The cashback is pure accumulation — no extra spending required.',
                },
                {
                  title: 'Automatic DCA effect',
                  text: 'Every purchase dollar-cost-averages into BTC at different price points. No timing the market, no stress, no decisions.',
                },
                {
                  title: 'Compounding over years',
                  text: 'Even small daily cashback compounds significantly. If BTC appreciates 50% per year, your $600/year in cashback becomes $900+ — and keeps growing.',
                },
                {
                  title: 'Free subscriptions',
                  text: '100% cashback on Netflix, Spotify, ChatGPT means you effectively get these services for free while building Bitcoin wealth.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <div>
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* FINAL CTA — High conversion */}
        <motion.div {...fadeUp} transition={{ delay: 0.48, duration: 0.5 }}>
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 p-6 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Start earning Bitcoin today</h3>
              <p className="mt-1 text-sm opacity-90">
                Sign up, deposit $500, and use the card for everything.
                Your first cashback hits within 24 hours.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-4 w-full gap-2 text-base font-bold"
                onClick={() => {
                  if (bybitLink) {
                    trackLinkClick('bybit');
                    window.open(bybitLink.url, '_blank');
                  }
                }}
              >
                Get Your Card
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="mt-3 text-[11px] opacity-70">
                Free sign-up · No annual fee · Funds stay in YOUR account
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Trust footer */}
        <motion.div {...fadeUp} transition={{ delay: 0.54, duration: 0.5 }}>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-4">
            <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Your deposited funds remain under your full control. Cashback rates vary by spending tier and provider.
              BTC value fluctuates with market conditions. Past performance does not guarantee future results.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
