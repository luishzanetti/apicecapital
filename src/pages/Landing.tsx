import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowUp,
  Bot,
  Calendar,
  Gamepad2,
  Users,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Shield,
  ChevronDown,
  Check,
  Zap,
  HelpCircle,
  ArrowUpRight,
  Brain,
  X,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

/* ─── Data ─── */
const features = [
  {
    icon: Bot,
    title: 'AI Investment Advisor',
    description:
      'Personalized recommendations powered by Claude AI with live market data from 20+ crypto assets.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    icon: Calendar,
    title: 'Smart DCA Planner',
    description:
      'Create automated investment plans tailored to your risk profile. Set it once, build wealth consistently.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    icon: Gamepad2,
    title: 'Gamified Learning',
    description:
      '30+ lessons, XP system, badges, and streaks that make learning crypto investing genuinely fun.',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: Users,
    title: '3 Investor Profiles',
    description:
      'Conservative, Balanced, or Growth — your strategy, your rules. AI adapts to match your comfort zone.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
];

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Take the Quiz',
    description:
      '60-second investor profile quiz to understand your risk tolerance and goals.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Get Your Plan',
    description:
      'AI-recommended DCA strategy based on your unique investor profile.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Build Wealth',
    description:
      'Consistent weekly investments with direct Bybit integration. You stay in control.',
  },
];

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the essentials',
    features: [
      'Investor profile & path',
      '1 Classic portfolio',
      'Basic DCA planner',
      'Limited daily insights',
      'Foundational lessons',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49.90',
    period: '/month',
    description: 'Unlock the full AI-powered experience',
    features: [
      'Everything in Free',
      'All Classic & Optimized portfolios',
      'Advanced DCA templates',
      'AI Trade setup guides',
      'Premium daily insights',
      'All learning tracks',
      'Copy portfolios',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: '30 days free',
  },
  {
    id: 'club',
    name: 'Club',
    price: '$149.90',
    period: '/month',
    description: 'For serious crypto investors',
    features: [
      'Everything in Pro',
      'Exclusive community access',
      'Advanced risk configurations',
      'Early access to new features',
      'Direct strategy team contact',
      'Custom portfolio consulting',
    ],
    cta: 'Join the Club',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Is this financial advice?',
    answer:
      'No. Apice Capital is an educational platform that provides AI-powered tools and market data to help you make informed decisions. We do not provide financial advice, and all investment decisions are yours alone.',
  },
  {
    question: 'Where are my funds stored?',
    answer:
      'Your funds always remain in your own Bybit exchange account. Apice Capital is non-custodial — we never hold, access, or control your crypto. You maintain full ownership at all times.',
  },
  {
    question: 'How does the AI advisor work?',
    answer:
      'Our AI advisor is powered by Claude AI and analyzes real-time market data from 20+ crypto assets. It considers your investor profile, risk tolerance, and market conditions to provide personalized DCA strategy recommendations.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. There are no lock-in contracts. You can downgrade to the Free tier at any time and keep access to basic features forever. Your data and progress are always preserved.',
  },
  {
    question: 'What is DCA and why does it work?',
    answer:
      'Dollar-Cost Averaging (DCA) means investing a fixed amount at regular intervals regardless of price. It removes the emotion and guesswork from investing. Historical data shows Bitcoin DCA strategies over 4+ years have averaged 250%+ returns.',
  },
];

/* ─── FAQ Item Component ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="font-medium text-sm md:text-base pr-4">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Landing Page ─── */
export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCTA = () => {
    trackEvent(AnalyticsEvents.LANDING_CTA_CLICKED);
    navigate('/auth');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      {/* ════════════════════════════════════════
          Navigation Bar
      ════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl apice-gradient-primary flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 40 40"
                fill="none"
                className="text-white"
              >
                <path
                  d="M20 4L36 34H4L20 4Z"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Apice <span className="text-muted-foreground font-normal text-sm">Capital</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>
          <Button
            variant="premium"
            size="sm"
            onClick={handleCTA}
            className="text-xs"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.nav>

      {/* ════════════════════════════════════════
          Section 1: Hero
      ════════════════════════════════════════ */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent 70%)',
            }}
          />
          {/* Floating orbs */}
          <motion.div
            className="absolute w-96 h-96 rounded-full pointer-events-none"
            style={{
              top: '10%',
              left: '-5%',
              background:
                'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, 30, -10, 0],
              y: [0, -20, 15, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{
              bottom: '10%',
              right: '-5%',
              background:
                'radial-gradient(circle, hsl(250 84% 60% / 0.08), transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, -20, 10, 0],
              y: [0, 15, -10, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full pointer-events-none"
            style={{
              top: '40%',
              right: '20%',
              background:
                'radial-gradient(circle, hsl(var(--apice-gold) / 0.06), transparent 70%)',
              filter: 'blur(50px)',
            }}
            animate={{
              x: [0, 15, -8, 0],
              y: [0, -12, 8, 0],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-xs border-primary/30 text-primary bg-primary/5"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI-Powered Crypto Investing
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Build Crypto Wealth.{' '}
            <br className="hidden sm:block" />
            <span className="text-gradient-primary">One Week at a Time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The AI-powered platform that turns anyone into a disciplined crypto
            investor with proven DCA strategies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button
              variant="premium"
              size="lg"
              onClick={handleCTA}
              className="w-full sm:w-auto min-w-[200px] hover:scale-105 transition-transform duration-200"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="w-full sm:w-auto min-w-[200px] hover:scale-105 transition-transform duration-200"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-muted-foreground/70"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary/70" />
              Non-custodial
            </span>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-primary/70" />
              AI-Powered
            </span>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary/70" />
              Free to Start
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          Section 2: Problem / Solution
      ════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-12 md:gap-16 items-center"
          >
            {/* Problem */}
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium mb-6">
                <X className="w-3.5 h-3.5" />
                The Problem
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                95% of crypto traders{' '}
                <span className="text-destructive">lose money.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Emotional trading, FOMO buying, panic selling. Trying to time the
                market is a losing game for most investors. The data is clear:
                active trading destroys wealth for the vast majority.
              </p>
            </motion.div>

            {/* Solution */}
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <Check className="w-3.5 h-3.5" />
                The Solution
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                The other 5% use{' '}
                <span className="text-gradient-primary">DCA.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Dollar-Cost Averaging removes emotion from the equation. Invest a
                fixed amount every week, regardless of price. Simple, disciplined,
                and historically proven.
              </p>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm font-medium">
                  Bitcoin DCA over 4 years ={' '}
                  <span className="text-gradient-primary font-bold">250%+ average returns</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 3: Features Grid
      ════════════════════════════════════════ */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <Badge
                variant="outline"
                className="mb-4 px-4 py-1.5 text-xs border-primary/30 text-primary bg-primary/5"
              >
                Platform Features
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Everything you need to{' '}
              <span className="text-gradient-primary">invest smarter</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Professional-grade tools made simple. No experience required.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <Card
                  variant="glass"
                  className="h-full hover:border-primary/20 transition-all duration-300 group"
                >
                  <CardContent className="p-6 md:p-8">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 4: How It Works
      ════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 md:py-32 relative">
        {/* Subtle background accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 50%, hsl(var(--primary) / 0.04), transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <Badge
                variant="outline"
                className="mb-4 px-4 py-1.5 text-xs border-primary/30 text-primary bg-primary/5"
              >
                3 Simple Steps
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Start building wealth{' '}
              <span className="text-gradient-primary">in minutes</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              No complicated setup. No crypto experience needed.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg apice-gradient-primary text-white text-xs font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mt-12"
          >
            <Button variant="premium" size="lg" onClick={handleCTA} className="hover:scale-105 transition-transform duration-200">
              Start Your Journey
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 5: Social Proof / Stats
      ════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {[
              { value: 'Bybit', label: 'Powered by', icon: ArrowUpRight },
              { value: '20+', label: 'Crypto Assets Tracked', icon: TrendingUp },
              { value: 'AI', label: 'Real-Time Market Data', icon: Brain },
              { value: '30+', label: 'Interactive Lessons', icon: Gamepad2 },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-secondary mb-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 6: Pricing
      ════════════════════════════════════════ */}
      <section id="pricing" className="py-20 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <Badge
                variant="outline"
                className="mb-4 px-4 py-1.5 text-xs border-primary/30 text-primary bg-primary/5"
              >
                Simple Pricing
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Start free.{' '}
              <span className="text-gradient-primary">Upgrade when ready.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Start with 30 days of Pro — free, no credit card required.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-5 items-start"
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <Card
                  variant={plan.highlighted ? 'premium' : 'default'}
                  className={`relative overflow-hidden ${
                    plan.highlighted ? 'md:-mt-4 md:mb-4 ring-1 ring-primary/30' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl apice-gradient-primary text-white text-xs font-semibold">
                      {plan.badge}
                    </div>
                  )}
                  <CardContent className="p-6 md:p-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-bold">
                          {plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlighted ? 'premium' : 'outline'}
                      size="lg"
                      className="w-full"
                      onClick={handleCTA}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 7: FAQ
      ════════════════════════════════════════ */}
      <section id="faq" className="py-20 md:py-32">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <Badge
                variant="outline"
                className="mb-4 px-4 py-1.5 text-xs border-primary/30 text-primary bg-primary/5"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                FAQ
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            >
              Frequently asked{' '}
              <span className="text-gradient-primary">questions</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="space-y-3"
          >
            {faqs.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Section 8: Final CTA
      ════════════════════════════════════════ */}
      <section className="py-20 md:py-32 relative">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 50%, hsl(var(--primary) / 0.06), transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-5 md:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="w-16 h-16 rounded-2xl apice-gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 40 40"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M20 4L36 34H4L20 4Z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M20 13L30 32H10L20 13Z"
                    fill="currentColor"
                    opacity="0.28"
                  />
                </svg>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to build your{' '}
                <span className="text-gradient-primary">crypto wealth?</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Free forever. Upgrade when you're ready.
              </p>
            </motion.div>

            <motion.form
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-6"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl bg-secondary/50 border-border/50 text-base px-5"
              />
              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full sm:w-auto whitespace-nowrap"
              >
                Join Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>

            <motion.p
              variants={fadeIn}
              transition={{ duration: 0.6 }}
              className="text-xs text-muted-foreground/60"
            >
              No credit card required. Start investing in minutes.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          Footer
      ════════════════════════════════════════ */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg apice-gradient-primary flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 40 40"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M20 4L36 34H4L20 4Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Apice Capital</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <span>2026 Apice Capital. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════
          Back to Top Button
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full apice-gradient-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
