import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import {
  ArrowLeft, ChevronRight, Shield, Zap, TrendingUp,
  PieChart, Lock, ExternalLink, Copy, Check,
  DollarSign, Landmark, ArrowRightLeft, Sparkles,
  Target, Layers, BarChart3, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Step 1: The Apice Method ───────────────────────────────────────────────

function ApiceMethodStep({ onComplete }: { onComplete: () => void }) {
  const [activePillar, setActivePillar] = useState<number | null>(null);
  const [pillarsViewed, setPillarsViewed] = useState<Set<number>>(new Set());

  const pillars = [
    {
      id: 1,
      icon: <ArrowRightLeft className="w-6 h-6" />,
      title: 'DCA — Dollar Cost Averaging',
      tagline: 'Consistency defeats timing',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      stats: [
        { label: 'Success rate over 3+ years', value: '83%' },
        { label: 'Avg. advantage vs lump-sum in volatile markets', value: '+27%' },
      ],
      content: [
        'DCA is the single most powerful wealth-building strategy in volatile markets. Instead of trying to time the market — a game that even Wall Street professionals lose — you invest a fixed amount at regular intervals.',
        'The math is elegant: when prices drop, your fixed amount buys MORE units. When prices rise, you buy fewer. Over time, your average entry price naturally optimizes below the market average.',
        'At Apice, we don\'t just recommend DCA — we\'ve engineered an entire system around it. Your weekly investment plan, automated allocation, and portfolio rebalancing all work together as a unified wealth engine.',
      ],
      apiceRule: 'The Apice Golden Rule: Consistency > Amount. $25/week for 4 years at 35% annual growth = $15,000+. Start small, never stop.',
    },
    {
      id: 2,
      icon: <PieChart className="w-6 h-6" />,
      title: 'Strategic Diversification',
      tagline: 'Never put all eggs in one basket',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      stats: [
        { label: 'Optimal assets in portfolio', value: '2–5' },
        { label: 'Additional annual returns with rebalancing', value: '+1–3%' },
      ],
      content: [
        'Diversification isn\'t just about owning multiple coins — it\'s about strategic allocation across uncorrelated asset classes. The Apice methodology uses a layered approach:',
        'Layer 1 — Foundation (40–60%): BTC and ETH. These are your blue-chip anchors. They move the portfolio in bull markets and provide relative stability.',
        'Layer 2 — Growth (20–35%): High-conviction L1s, DeFi protocols, and infrastructure tokens. These provide asymmetric upside during expansion phases.',
        'Layer 3 — Shield (10–20%): Stablecoins and yield-bearing assets. This is your dry powder for buying dips and generating passive income.',
      ],
      apiceRule: 'Apice Allocation Rule: Max 15% in any single high-risk alt. Your foundation layer should always be 40%+ of total portfolio.',
    },
    {
      id: 3,
      icon: <Zap className="w-6 h-6" />,
      title: 'Micro-Leverage',
      tagline: 'The Apice edge — amplified compounding',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      stats: [
        { label: 'Extra performance with strategic micro-leverage', value: '+15–25%' },
        { label: 'Recommended max leverage ratio', value: '1.5x' },
      ],
      content: [
        'This is where the Apice methodology separates from generic crypto advice. Micro-Leverage is NOT about risky 50x margin trading — it\'s about intelligent, controlled amplification of your DCA engine.',
        'How it works: When markets drop 20%+ from local highs (a signal we track automatically), the system suggests doubling your DCA amount. At 40%+ drops, it suggests tripling. This is mathematically proven to increase long-term returns by 15–25%.',
        'The key insight: buying more during fear and less during euphoria inverts the behavior of 95% of retail investors. You become the smart money that profits from others\' emotions.',
        'Advanced Apice members also access yield strategies on their stablecoin reserves, earning 5–12% APY on capital that\'s waiting to be deployed — turning idle cash into a working asset.',
      ],
      apiceRule: 'Micro-Leverage Rule: Never allocate more than you\'re prepared to hold for 12+ months. The power is in patience, not panic.',
    },
  ];

  const handlePillarView = (idx: number) => {
    setActivePillar(activePillar === idx ? null : idx);
    setPillarsViewed(prev => new Set(prev).add(idx));
  };

  const allViewed = pillarsViewed.size === 3;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">The 3 Pillars of Apice</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Every Apice strategy is built on these three principles working together. Master them and you master the market.
        </p>
      </div>

      {/* Pillar Synergy Visual */}
      <div className="flex items-center justify-center gap-2 py-3">
        {pillars.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
              pillarsViewed.has(i)
                ? `bg-gradient-to-br ${p.color} shadow-lg`
                : 'bg-secondary/60 border border-border/40'
            )}>
              <span className={pillarsViewed.has(i) ? 'text-white' : 'text-muted-foreground'}>
                {p.icon}
              </span>
            </div>
            {i < 2 && (
              <div className={cn(
                'w-6 h-0.5 rounded-full transition-colors duration-300',
                pillarsViewed.has(i) && pillarsViewed.has(i + 1) ? 'bg-primary' : 'bg-border/40'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Pillars */}
      <div className="space-y-3">
        {pillars.map((pillar, idx) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <button
              onClick={() => handlePillarView(idx)}
              className={cn(
                'w-full text-left rounded-2xl border overflow-hidden transition-all duration-300',
                activePillar === idx
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/40 bg-card hover:border-primary/20'
              )}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', pillar.bgColor)}>
                    <span className={pillar.textColor}>{pillar.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{pillar.title}</h3>
                      {pillarsViewed.has(idx) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{pillar.tagline}</p>
                  </div>
                  <ChevronRight className={cn(
                    'w-5 h-5 text-muted-foreground/40 transition-transform duration-200',
                    activePillar === idx && 'rotate-90'
                  )} />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {activePillar === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {pillar.stats.map((stat) => (
                        <div key={stat.label} className="p-3 rounded-xl bg-secondary/40 border border-border/20">
                          <p className={cn('text-xl font-bold', pillar.textColor)}>{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {pillar.content.map((paragraph, i) => (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Apice Rule */}
                    <div className={cn('p-3 rounded-xl border', pillar.bgColor, 'border-transparent')}>
                      <div className="flex items-start gap-2">
                        <Sparkles className={cn('w-4 h-4 shrink-0 mt-0.5', pillar.textColor)} />
                        <p className="text-xs font-medium leading-relaxed">{pillar.apiceRule}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: allViewed ? 1 : 0.4 }}
        className="pt-2"
      >
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          disabled={!allViewed}
          onClick={onComplete}
        >
          {allViewed ? 'I\'ve Mastered the Pillars' : `Explore all 3 pillars (${pillarsViewed.size}/3)`}
          {allViewed && <Check className="w-4 h-4 ml-2" />}
        </Button>
        {!allViewed && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Tap each pillar above to unlock completion
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Step 2: The Fortress ───────────────────────────────────────────────────

function FortressStep({ onComplete }: { onComplete: () => void }) {
  const [sectionsRead, setSectionsRead] = useState<Set<number>>(new Set());

  const sections = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Why You Need a Fortress',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      content: 'In traditional finance, your bank holds your money and you trust the system. In crypto, YOU are the bank. This is both the greatest opportunity and the biggest responsibility. Without a secure execution platform, even the best strategy is worthless.',
    },
    {
      icon: <Landmark className="w-5 h-5" />,
      title: 'Exchanges: Your Execution Engine',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      content: 'A top-tier exchange like Bybit provides institutional-grade security, deep liquidity, and the tools you need to execute the Apice methodology. Think of it as your command center — where DCA plans execute, portfolios rebalance, and wealth compounds 24/7.',
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Security Architecture',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      content: 'Bybit secures assets with multi-signature cold wallets, 2FA authentication, anti-phishing codes, and a $300M+ insurance fund. Your Apice fortress operates with the same security standards as institutional trading desks.',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Why Bybit Specifically',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      content: 'Bybit ranks consistently in the top 3 global exchanges by volume. Zero-fee spot trading on major pairs, 750+ trading pairs, advanced API for automation, and 24/7 customer support. It\'s the platform Apice selected after evaluating 40+ exchanges on security, fees, liquidity, and user experience.',
    },
  ];

  const handleSectionRead = (idx: number) => {
    setSectionsRead(prev => new Set(prev).add(idx));
  };

  const allRead = sectionsRead.size === sections.length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center mx-auto shadow-lg shadow-slate-500/20 border border-slate-500/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">The Fortress</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Your financial fortress is the foundation of everything. Understand why it matters before you build it.
        </p>
      </div>

      {/* Security Score Visual */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-400">Bybit Security Score</span>
          <span className="text-2xl font-bold text-emerald-400">9.4/10</span>
        </div>
        <div className="h-2 bg-secondary/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: '94%' }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Cold wallet custody</span>
          <span>$300M+ insurance</span>
          <span>Top 3 global</span>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => handleSectionRead(idx)}
            className={cn(
              'p-4 rounded-2xl border transition-all duration-300 cursor-pointer',
              sectionsRead.has(idx)
                ? 'border-primary/20 bg-primary/5'
                : 'border-border/40 bg-card hover:border-primary/10'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', section.bg)}>
                <span className={section.color}>{section.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  {sectionsRead.has(idx) && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant="premium"
        size="lg"
        className="w-full"
        disabled={!allRead}
        onClick={onComplete}
      >
        {allRead ? 'My Fortress Awaits' : `Read all sections (${sectionsRead.size}/${sections.length})`}
        {allRead && <Shield className="w-4 h-4 ml-2" />}
      </Button>
    </div>
  );
}

// ─── Step 3: Gateway Access ─────────────────────────────────────────────────

function GatewayAccessStep({ onComplete }: { onComplete: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('APICE');
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenBybit = () => {
    trackLinkClick('bybit');
    window.open('https://www.bybit.com/invite?ref=APICE', '_blank');
  };

  const handleAccountCreated = () => {
    setShowCelebration(true);
    setTimeout(() => onComplete(), 2500);
  };

  const steps = [
    { num: 1, title: 'Click the button below', desc: 'Opens Bybit with your Apice referral pre-applied' },
    { num: 2, title: 'Create your account', desc: 'Email + password. Takes under 60 seconds' },
    { num: 3, title: 'Complete KYC verification', desc: 'ID document + selfie. Usually approved in minutes' },
    { num: 4, title: 'Return here and confirm', desc: 'Click "Account Created" to unlock your perks' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <Landmark className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Gateway Access</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Create your Bybit account — the execution engine for all Apice strategies.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: '💰', label: '$30 Welcome Bonus', desc: 'Applied automatically' },
          { icon: '📉', label: 'Reduced Fees', desc: 'Exclusive Apice rates' },
          { icon: '🎁', label: 'VIP Promotions', desc: 'Priority access' },
          { icon: '🤝', label: 'Priority Support', desc: 'Apice partner channel' },
        ].map((b) => (
          <div key={b.label} className="p-3 rounded-xl bg-secondary/40 border border-border/20 text-center">
            <span className="text-xl">{b.icon}</span>
            <p className="text-xs font-semibold mt-1">{b.label}</p>
            <p className="text-[10px] text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {step.num}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-px h-8 bg-border/40" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Code */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Your Apice referral code</p>
            <p className="text-xl font-bold tracking-widest text-amber-400">APICE</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={handleOpenBybit}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Create Bybit Account
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleAccountCreated}
        >
          <Check className="w-4 h-4 mr-2" />
          I've Created My Account
        </Button>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="text-center space-y-4 px-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
                className="text-6xl mx-auto"
              >
                🏰
              </motion.div>
              <h2 className="text-2xl font-bold">Fortress Activated!</h2>
              <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
                Your execution engine is ready. Welcome to the Apice ecosystem — your wealth-building journey starts now.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-primary"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">+150 XP earned</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex flex-wrap justify-center gap-2 pt-2"
              >
                {['DCA Automation', 'Live Portfolio', 'AI Insights', 'All Strategies'].map((feat, i) => (
                  <motion.span
                    key={feat}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.15 }}
                    className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary"
                  >
                    {feat}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 4: Elite Benefits ─────────────────────────────────────────────────

function EliteBenefitsStep({ onComplete }: { onComplete: () => void }) {
  const [verified, setVerified] = useState(false);

  const benefits = [
    {
      icon: '💎',
      title: 'Fee Reduction Protocol',
      value: 'Save up to 20%',
      desc: 'The Apice referral code automatically reduces your trading fees. On a $10,000 annual volume, that\'s $200+ saved — money that compounds in your portfolio instead.',
      color: 'from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: '🏆',
      title: 'Exclusive Liquidity Pools',
      value: 'Priority access',
      desc: 'Apice members get early access to new token listings, launchpad events, and promotional yield programs that aren\'t available to regular Bybit users.',
      color: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
    },
    {
      icon: '📊',
      title: 'Advanced Trading Tools',
      value: 'Unlocked at sign-up',
      desc: 'Grid bots, copy trading, portfolio analytics — all the tools the Apice methodology leverages for automation are available from day one with your account.',
      color: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
    },
    {
      icon: '🎯',
      title: 'Compounding Advantage',
      value: 'Calculated impact',
      desc: 'Lower fees + better rates + automation = your money compounds faster. Over 3 years, the Apice protocol advantage can mean 8–15% more portfolio growth vs standard accounts.',
      color: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Elite Benefits</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Your Apice protocol is active. Here's what you've unlocked.
        </p>
      </div>

      {/* Impact Summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estimated annual advantage</p>
        <p className="text-3xl font-bold text-primary">$200–$1,500+</p>
        <p className="text-xs text-muted-foreground mt-1">Based on $5k–$50k annual volume</p>
      </div>

      {/* Benefits */}
      <div className="space-y-3">
        {benefits.map((b, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={cn('p-4 rounded-2xl bg-gradient-to-r border', b.color, b.border)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold">{b.title}</h3>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{b.value}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verification */}
      <div className="space-y-3">
        {!verified ? (
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/30">
            <p className="text-xs text-muted-foreground mb-3">
              Confirm that you used the referral code <span className="font-bold text-amber-400">APICE</span> when creating your account to activate all benefits.
            </p>
            <div className="flex gap-2">
              <Button
                variant="premium"
                size="sm"
                className="flex-1"
                onClick={() => { setVerified(true); }}
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Yes, I used APICE
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText('APICE');
                  toast.success('Code copied! Apply it in Bybit settings.');
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Code
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={onComplete}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Perks Activated
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Step 5: Fuel the Tank ──────────────────────────────────────────────────

function FuelTankStep({ onComplete }: { onComplete: () => void }) {
  const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);

  const methods = [
    {
      icon: '💳',
      title: 'Card Deposit (Fastest)',
      time: '~2 min',
      steps: ['Go to Bybit → "Buy Crypto" → "Express"', 'Select USDT, enter amount', 'Pay with Visa/Mastercard', 'USDT arrives in your Spot wallet'],
    },
    {
      icon: '🏦',
      title: 'Bank Transfer (Lowest fees)',
      time: '1–3 business days',
      steps: ['Go to Bybit → "Deposit" → "Fiat"', 'Select your currency and bank', 'Transfer from your bank app', 'Convert to USDT when received'],
    },
    {
      icon: '🔄',
      title: 'Crypto Transfer',
      time: '~15 min',
      steps: ['Go to Bybit → "Deposit" → "Crypto"', 'Select USDT and network (TRC-20 is cheapest)', 'Copy your deposit address', 'Send USDT from another wallet/exchange'],
    },
  ];

  const [expandedMethod, setExpandedMethod] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Fuel the Tank</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Your engine is ready. Now add fuel — even the smallest deposit activates the entire Apice system.
        </p>
      </div>

      {/* Suggested Amount */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Suggested first deposit</p>
        <p className="text-3xl font-bold text-green-400">
          ${weeklyInvestment > 0 ? Math.max(weeklyInvestment * 4, 50) : 100}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {weeklyInvestment > 0
            ? `~4 weeks of your $${weeklyInvestment}/week plan`
            : 'Enough to start your first DCA cycle'
          }
        </p>
      </div>

      {/* Important Note */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-amber-400">Apice Rule:</span> Only invest what you won't need for 12+ months. Your deposit fuels a long-term compounding engine, not a short-term trade.
          </p>
        </div>
      </div>

      {/* Deposit Methods */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose your deposit method</p>
        {methods.map((method, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <button
              onClick={() => setExpandedMethod(expandedMethod === idx ? null : idx)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                expandedMethod === idx
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/40 bg-card hover:border-primary/20'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{method.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{method.time}</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 text-muted-foreground/40 transition-transform',
                  expandedMethod === idx && 'rotate-90'
                )} />
              </div>
            </button>
            <AnimatePresence>
              {expandedMethod === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-2 space-y-2">
                    {method.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {si + 1}
                        </span>
                        <p className="text-xs text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant="premium"
        size="lg"
        className="w-full"
        onClick={onComplete}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        I've Made My First Deposit
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        You can always come back and complete this step later
      </p>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

const STEP_CONFIG = [
  { param: 'method', storeKey: 'm2_methodologyRead' as const, title: 'Master the Apice Method', xp: 150 },
  { param: 'fortress', storeKey: 'm2_whyCryptoExchange' as const, title: 'The Fortress', xp: 100 },
  { param: 'gateway', storeKey: 'm2_bybitAccountCreated' as const, title: 'Gateway Access', xp: 150 },
  { param: 'benefits', storeKey: 'm2_bybitReferralUsed' as const, title: 'Elite Benefits', xp: 100 },
  { param: 'fuel', storeKey: 'm2_firstDepositUSDT' as const, title: 'Fuel the Tank', xp: 100 },
];

export default function MethodologyMission() {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const completeMissionTask = useAppStore((s) => s.completeMissionTask);

  const stepIndex = STEP_CONFIG.findIndex(s => s.param === step);
  const config = STEP_CONFIG[stepIndex] || STEP_CONFIG[0];

  const handleComplete = () => {
    completeMissionTask(config.storeKey);
    toast.success(`+${config.xp} XP — ${config.title} complete!`);

    // Navigate to next step or back to home
    const nextStep = STEP_CONFIG[stepIndex + 1];
    if (nextStep) {
      navigate(`/mission2/${nextStep.param}`, { replace: true });
    } else {
      navigate('/home');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'method': return <ApiceMethodStep onComplete={handleComplete} />;
      case 'fortress': return <FortressStep onComplete={handleComplete} />;
      case 'gateway': return <GatewayAccessStep onComplete={handleComplete} />;
      case 'benefits': return <EliteBenefitsStep onComplete={handleComplete} />;
      case 'fuel': return <FuelTankStep onComplete={handleComplete} />;
      default: return <ApiceMethodStep onComplete={handleComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mission 2</p>
            <p className="text-xs font-semibold">{config.title}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mt-3">
          {STEP_CONFIG.map((s, i) => (
            <div
              key={s.param}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors duration-300',
                i < stepIndex ? 'bg-green-400' :
                i === stepIndex ? 'bg-primary' :
                'bg-border/40'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
