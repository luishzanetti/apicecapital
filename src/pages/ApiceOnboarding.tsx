import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAppStore, UserProfile } from '@/store/appStore';
import { APICE_RETURN_RATES, getReturnRateForInvestorType } from '@/data/sampleData';
import {
    ArrowLeft, ArrowRight, ChevronRight, Shield, Zap, TrendingUp,
    Lock, Crown, Users, Target, Sparkles, Eye, BookOpen,
    DollarSign, PieChart, Award, Flame, CheckCircle2, Star, BarChart3,
    Rocket, Brain, Gem, X, SkipForward
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── ONBOARDING DATA ────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

interface QuizQuestion {
    id: keyof UserProfile;
    question: string;
    subtitle: string;
    icon: string;
    options: {
        value: string;
        label: string;
        description: string;
        icon: string;
    }[];
}

const quizQuestions: QuizQuestion[] = [
    {
        id: 'goal',
        question: 'What drives you?',
        subtitle: 'Your goal shapes every recommendation we make',
        icon: '🎯',
        options: [
            { value: 'passive-income', label: 'Passive Income', description: 'Consistent returns without effort', icon: '💰' },
            { value: 'growth', label: 'Maximum Growth', description: 'Maximize capital appreciation', icon: '📈' },
            { value: 'balanced', label: 'Balanced', description: 'Growth with stability', icon: '⚖️' },
            { value: 'protection', label: 'Capital Protection', description: 'Preserve wealth first', icon: '🛡️' },
        ],
    },
    {
        id: 'experience',
        question: 'Your experience level?',
        subtitle: 'We adapt complexity to match your knowledge',
        icon: '🧠',
        options: [
            { value: 'new', label: 'Beginner', description: 'Just getting started in crypto', icon: '🌱' },
            { value: 'intermediate', label: 'Intermediate', description: 'I understand the fundamentals', icon: '📊' },
            { value: 'experienced', label: 'Experienced', description: 'Active trader, knows the market', icon: '⚡' },
        ],
    },
    {
        id: 'riskTolerance',
        question: 'Risk appetite?',
        subtitle: 'Be honest — this defines your strategy',
        icon: '🎲',
        options: [
            { value: 'low', label: 'Conservative', description: '~15% a.a. — stability first', icon: '🛡️' },
            { value: 'medium', label: 'Moderate', description: '~35% a.a. — balanced growth', icon: '⚖️' },
            { value: 'high', label: 'Aggressive', description: '~60%+ a.a. — maximum growth', icon: '🚀' },
        ],
    },
    {
        id: 'capitalRange',
        question: 'Starting capital?',
        subtitle: 'Helps calibrate your personalized strategy',
        icon: '💎',
        options: [
            { value: 'under-200', label: 'Under $200', description: 'Perfect start for micro-leverage', icon: '🌱' },
            { value: '200-1k', label: '$200 – $1,000', description: 'Great for strategic DCA', icon: '📦' },
            { value: '1k-5k', label: '$1,000 – $5,000', description: 'Serious capital for growth', icon: '💰' },
            { value: '5k-plus', label: '$5,000+', description: 'Full strategy access', icon: '💎' },
        ],
    },
];

// ─── PROJECTIONS ─────────────────────────────────────────────────────────────

const generateProjections = (weekly: number, annualRate: number) => {
    const data = [];
    let total = 0;
    let invested = 0;
    for (let month = 0; month <= 60; month++) {
        if (month > 0) {
            invested += weekly * 4;
            total = (total + weekly * 4) * (1 + annualRate / 12);
        }
        if (month % 6 === 0) {
            data.push({ label: month === 0 ? 'Now' : `${month}m`, projected: Math.round(total), invested: Math.round(invested) });
        }
    }
    return data;
};

const getTiers = (_capitalRange: string | null) => {
    return [
        {
            amount: 100,
            label: 'Foundation',
            icon: '🌱',
            tag: 'Build the habit',
            proof: '$100/wk × 52 weeks = $5,200/yr invested',
            projections: { y1: '$5,850', y3: '$22,400', y5: '$52,000' },
        },
        {
            amount: 500,
            label: 'Recommended',
            icon: '⭐',
            tag: 'Optimal growth',
            recommended: true,
            proof: '$500/wk × 52 weeks = $26,000/yr invested',
            projections: { y1: '$29,250', y3: '$112,000', y5: '$260,000' },
        },
        {
            amount: 1000,
            label: 'Accelerated',
            icon: '🚀',
            tag: 'Maximum compounding',
            proof: '$1,000/wk × 52 weeks = $52,000/yr invested',
            projections: { y1: '$58,500', y3: '$224,000', y5: '$520,000' },
        },
    ];
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function ApiceOnboardingInner() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const prefersReducedMotion = useReducedMotion();
    const contentRef = useRef<HTMLDivElement>(null);
    const updateUserProfile = useAppStore((s) => s.updateUserProfile);
    const userProfile = useAppStore((s) => s.userProfile);
    const calculateInvestorType = useAppStore((s) => s.calculateInvestorType);
    const investorType = useAppStore((s) => s.investorType);
    const completeOnboarding = useAppStore((s) => s.completeOnboarding);
    const startFreeTrial = useAppStore((s) => s.startFreeTrial);
    const completeMissionTask = useAppStore((s) => s.completeMissionTask);
    const setWeeklyInvestment = useAppStore((s) => s.setWeeklyInvestment);
    const skipOnboarding = useAppStore((s) => s.skipOnboarding);
    const setOnboardingStep = useAppStore((s) => s.setOnboardingStep);
    const persistedStep = useAppStore((s) => s.onboardingStep);

    // Restore step from persisted store on mount
    const [step, setStepLocal] = useState(() => persistedStep || 0);
    const [quizStep, setQuizStep] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(500);
    const [customAmount, setCustomAmount] = useState(100);
    const [showCustom, setShowCustom] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Sync local step with persisted store
    const setStep = useCallback((newStep: number) => {
        setStepLocal(newStep);
        setOnboardingStep(newStep);
    }, [setOnboardingStep]);

    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    // Animation helpers for reduced motion
    const animDuration = prefersReducedMotion ? 0 : undefined;
    const slideIn = prefersReducedMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
        : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
    const slideInX = prefersReducedMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
        : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

    const annualRate = getReturnRateForInvestorType(investorType);
    const projectionData = useMemo(
        () => generateProjections(selectedAmount || customAmount, annualRate),
        [selectedAmount, customAmount, annualRate]
    );
    const tiers = useMemo(() => getTiers(userProfile.capitalRange), [userProfile.capitalRange]);

    // Scroll to top and focus management on step change
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // Focus management: focus the first interactive element
        requestAnimationFrame(() => {
            const container = contentRef.current;
            if (container) {
                const focusable = container.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                focusable?.focus();
            }
        });
    }, [step, quizStep]);

    const goNext = () => {
        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        }
    };

    const goBack = () => {
        if (step === 3 && quizStep > 0) {
            setQuizStep(quizStep - 1);
        } else if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        try {
            skipOnboarding();
            navigate('/home', { replace: true });
        } catch (err) {
            console.error('Skip onboarding error:', err);
            toast.error(t('onboarding.finishError'));
            navigate('/home', { replace: true });
        }
    };

    const handleFinish = () => {
        try {
            const amount = selectedAmount || customAmount;
            setWeeklyInvestment(amount);
            completeOnboarding();
            startFreeTrial();
            completeMissionTask('m1_onboardingCompleted');
            setConfirmed(true);
            setTimeout(() => {
                navigate('/home', { replace: true });
            }, 2200);
        } catch (err) {
            console.error('Onboarding finish error:', err);
            toast.error(t('onboarding.finishError'));
            navigate('/home', { replace: true });
        }
    };

    const handleQuizAnswer = (questionId: keyof UserProfile, value: string) => {
        try {
            updateUserProfile({ [questionId]: value });
            if (quizStep < quizQuestions.length - 1) {
                setTimeout(() => setQuizStep(quizStep + 1), prefersReducedMotion ? 0 : 200);
            } else {
                calculateInvestorType();
                setTimeout(() => goNext(), prefersReducedMotion ? 0 : 300);
            }
        } catch (err) {
            console.error('Quiz answer error:', err);
            toast.error(t('onboarding.finishError'));
        }
    };

    // ─── RENDER STEPS ──────────────────────────────────────────────────────────

    const renderStep = () => {
        switch (step) {
            // ═══ STEP 0: WELCOME TO THE CLUB ═══
            case 0:
                return (
                    <motion.div key="welcome" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                            {/* Logo */}
                            <motion.div
                                initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
                            >
                                <svg width="48" height="48" viewBox="0 0 40 40" fill="none" className="text-white">
                                    <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                                    <path d="M20 12L30 32H10L20 12Z" fill="currentColor" opacity="0.3" />
                                </svg>
                            </motion.div>

                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: animDuration }}>
                                <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20" variant="outline">
                                    <Crown className="w-3 h-3 mr-1" />
                                    {t('onboarding.exclusiveMemberAccess')}
                                </Badge>
                            </motion.div>

                            <motion.h1 initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: animDuration }}
                                className="text-3xl font-bold mb-3 leading-tight">
                                {t('onboarding.welcomeTitle')}<br /><span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{t('onboarding.welcomeBrand')}</span>
                            </motion.h1>

                            <motion.p initial={prefersReducedMotion ? {} : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: animDuration }}
                                className="text-muted-foreground text-sm mb-8 max-w-sm">
                                {t('onboarding.welcomeDesc')}
                            </motion.p>

                            {/* Club Benefits */}
                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: animDuration }} className="w-full space-y-3 mb-8">
                                {[
                                    { icon: Brain, label: t('onboarding.benefitStrategy'), desc: t('onboarding.benefitStrategyDesc'), color: 'text-indigo-400' },
                                    { icon: TrendingUp, label: t('onboarding.benefitReturns'), desc: t('onboarding.benefitReturnsDesc'), color: 'text-green-400' },
                                    { icon: Shield, label: t('onboarding.benefitRisk'), desc: t('onboarding.benefitRiskDesc'), color: 'text-blue-400' },
                                    { icon: Users, label: t('onboarding.benefitCommunity'), desc: t('onboarding.benefitCommunityDesc'), color: 'text-amber-400' },
                                ].map((item, i) => (
                                    <motion.div key={item.label} initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.8 + i * 0.1, duration: animDuration }}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-border/50">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                            <item.icon className={cn('w-5 h-5', item.color)} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        <div className="space-y-3">
                            <Button variant="premium" size="lg" className="w-full" onClick={goNext}>
                                {t('onboarding.startJourney')}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                );

            // ═══ STEP 1: THE APICE METHOD ═══
            case 1:
                return (
                    <motion.div key="method" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: animDuration }}>
                                <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20" variant="outline">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {t('onboarding.theApiceMethod')}
                                </Badge>
                                <h1 className="text-2xl font-bold mb-2">{t('onboarding.howWeGenerate')}<br />{t('onboarding.explosiveReturns')}</h1>
                                <p className="text-sm text-muted-foreground mb-6">{t('onboarding.methodDesc')}</p>
                            </motion.div>

                            <div className="space-y-4">
                                {[
                                    {
                                        num: '01', title: t('onboarding.strategicDCA'), desc: t('onboarding.strategicDCADesc'),
                                        icon: Target, color: 'from-blue-500 to-cyan-500',
                                        detail: t('onboarding.strategicDCADetail')
                                    },
                                    {
                                        num: '02', title: t('onboarding.smartDiversification'), desc: t('onboarding.smartDiversificationDesc'),
                                        icon: PieChart, color: 'from-purple-500 to-pink-500',
                                        detail: t('onboarding.smartDiversificationDetail')
                                    },
                                    {
                                        num: '03', title: t('onboarding.microLeverage'), desc: t('onboarding.microLeverageDesc'),
                                        icon: Rocket, color: 'from-amber-500 to-orange-500',
                                        detail: t('onboarding.microLeverageDetail')
                                    },
                                ].map((item, i) => (
                                    <motion.div key={item.num} initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.2 + i * 0.15, duration: animDuration }}>
                                        <Card className="overflow-hidden border-border/50">
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br', item.color)}>
                                                        <item.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[11px] font-bold text-muted-foreground">{item.num}</span>
                                                            <h3 className="text-sm font-bold">{item.title}</h3>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                                                        <Badge variant="secondary" className="text-[11px]">
                                                            <Sparkles className="w-2.5 h-2.5 mr-1" />
                                                            {item.detail}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: animDuration }}
                                className="mt-6 p-4 rounded-xl border border-primary/20" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Gem className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold">{t('onboarding.apiceEdge')}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t('onboarding.apiceEdgeDesc')}
                                </p>
                            </motion.div>
                        </div>

                        <Button variant="premium" size="lg" className="w-full mt-6" onClick={goNext}>
                            {t('onboarding.readyToLearn')}
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </motion.div>
                );

            // ═══ STEP 2: YOUR RETURNS ═══
            case 2:
                return (
                    <motion.div key="returns" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20" variant="outline">
                                <BarChart3 className="w-3 h-3 mr-1" />
                                {t('onboarding.performance')}
                            </Badge>
                            <h1 className="text-2xl font-bold mb-2">{t('onboarding.realReturns')}<br />{t('onboarding.realStrategy')}</h1>
                            <p className="text-sm text-muted-foreground mb-6">{t('onboarding.returnsDesc')}</p>

                            <div className="space-y-3">
                                {[
                                    {
                                        title: t('onboarding.conservative'), rate: t('onboarding.conservativeRate'), icon: Shield,
                                        desc: t('onboarding.conservativeDesc'),
                                        color: 'border-green-500/20', badge: 'bg-green-500/10 text-green-400',
                                        detail: t('onboarding.conservativeDetail'),
                                    },
                                    {
                                        title: t('onboarding.balanced'), rate: t('onboarding.balancedRate'), icon: BarChart3,
                                        desc: t('onboarding.balancedDesc'),
                                        color: 'border-blue-500/20', badge: 'bg-blue-500/10 text-blue-400',
                                        detail: t('onboarding.balancedDetail'),
                                        recommended: true,
                                    },
                                    {
                                        title: t('onboarding.aggressive'), rate: t('onboarding.aggressiveRate'), icon: Rocket,
                                        desc: t('onboarding.aggressiveDesc'),
                                        color: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400',
                                        detail: t('onboarding.aggressiveDetail'),
                                    },
                                ].map((item, i) => (
                                    <motion.div key={item.title} initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.2 + i * 0.1, duration: animDuration }}>
                                        <Card className={cn('overflow-hidden relative', item.color)}>
                                            {item.recommended && (
                                                <div className="absolute top-0 right-0 bg-primary px-2 py-0.5 rounded-bl-lg">
                                                    <span className="text-[11px] font-bold text-white uppercase">{t('onboarding.recommended')}</span>
                                                </div>
                                            )}
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                                        <item.icon className="w-6 h-6 text-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className="text-sm font-bold">{item.title}</h3>
                                                            <Badge className={cn('text-[11px] px-1.5 py-0', item.badge)} variant="outline">
                                                                {item.rate}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-1">{item.desc}</p>
                                                        <p className="text-[11px] text-muted-foreground/70">{item.detail}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: animDuration }}
                                className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
                                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                                <p className="text-[11px] text-muted-foreground">
                                    {t('onboarding.returnsDisclaimer')}
                                </p>
                            </motion.div>
                        </div>

                        <Button variant="premium" size="lg" className="w-full mt-6" onClick={goNext}>
                            {t('onboarding.personalizeStrategy')}
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </motion.div>
                );

            // ═══ STEP 3: PROFILE QUIZ ═══
            case 3: {
                const q = quizQuestions[quizStep];
                const quizProgress = ((quizStep + 1) / quizQuestions.length) * 100;
                // i18n mapping for quiz questions
                const quizI18n: Record<string, { question: string; subtitle: string; options: Record<string, { label: string; description: string }> }> = {
                    goal: {
                        question: t('onboarding.quizGoalQuestion'),
                        subtitle: t('onboarding.quizGoalSubtitle'),
                        options: {
                            'passive-income': { label: t('onboarding.quizGoalPassiveIncome'), description: t('onboarding.quizGoalPassiveIncomeDesc') },
                            'growth': { label: t('onboarding.quizGoalGrowth'), description: t('onboarding.quizGoalGrowthDesc') },
                            'balanced': { label: t('onboarding.quizGoalBalanced'), description: t('onboarding.quizGoalBalancedDesc') },
                            'protection': { label: t('onboarding.quizGoalProtection'), description: t('onboarding.quizGoalProtectionDesc') },
                        },
                    },
                    experience: {
                        question: t('onboarding.quizExpQuestion'),
                        subtitle: t('onboarding.quizExpSubtitle'),
                        options: {
                            'new': { label: t('onboarding.quizExpBeginner'), description: t('onboarding.quizExpBeginnerDesc') },
                            'intermediate': { label: t('onboarding.quizExpIntermediate'), description: t('onboarding.quizExpIntermediateDesc') },
                            'experienced': { label: t('onboarding.quizExpExperienced'), description: t('onboarding.quizExpExperiencedDesc') },
                        },
                    },
                    riskTolerance: {
                        question: t('onboarding.quizRiskQuestion'),
                        subtitle: t('onboarding.quizRiskSubtitle'),
                        options: {
                            'low': { label: t('onboarding.quizRiskLow'), description: t('onboarding.quizRiskLowDesc') },
                            'medium': { label: t('onboarding.quizRiskMedium'), description: t('onboarding.quizRiskMediumDesc') },
                            'high': { label: t('onboarding.quizRiskHigh'), description: t('onboarding.quizRiskHighDesc') },
                        },
                    },
                    capitalRange: {
                        question: t('onboarding.quizCapitalQuestion'),
                        subtitle: t('onboarding.quizCapitalSubtitle'),
                        options: {
                            'under-200': { label: t('onboarding.quizCapitalUnder200'), description: t('onboarding.quizCapitalUnder200Desc') },
                            '200-1k': { label: t('onboarding.quizCapital200to1k'), description: t('onboarding.quizCapital200to1kDesc') },
                            '1k-5k': { label: t('onboarding.quizCapital1kto5k'), description: t('onboarding.quizCapital1kto5kDesc') },
                            '5k-plus': { label: t('onboarding.quizCapital5kPlus'), description: t('onboarding.quizCapital5kPlusDesc') },
                        },
                    },
                };
                const qi18n = quizI18n[q.id];
                return (
                    <motion.div key="quiz" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20" variant="outline">
                                <Target className="w-3 h-3 mr-1" />
                                {t('onboarding.profileSetup')} — {quizStep + 1}/{quizQuestions.length}
                            </Badge>

                            {/* Mini progress */}
                            <div className="h-1 bg-secondary rounded-full overflow-hidden mb-6" role="progressbar" aria-valuenow={quizProgress} aria-valuemin={0} aria-valuemax={100} aria-label={t('onboarding.profileSetup')}>
                                <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${quizProgress}%` }} transition={{ duration: prefersReducedMotion ? 0 : 0.3 }} />
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div key={quizStep} {...slideInX} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}>
                                    <div className="text-center mb-2">
                                        <span className="text-3xl">{q.icon}</span>
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2 text-center">{qi18n?.question ?? q.question}</h1>
                                    <p className="text-sm text-muted-foreground mb-6 text-center">{qi18n?.subtitle ?? q.subtitle}</p>

                                    <div className="space-y-3" role="radiogroup" aria-label={qi18n?.question ?? q.question}>
                                        {q.options.map((option, i) => {
                                            const isSelected = userProfile[q.id] === option.value;
                                            const optI18n = qi18n?.options?.[option.value];
                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: prefersReducedMotion ? 0 : i * 0.05, duration: animDuration }}
                                                    onClick={() => handleQuizAnswer(q.id, option.value)}
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    aria-selected={isSelected}
                                                    className={cn(
                                                        'w-full p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98]',
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border bg-card hover:border-primary/30'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{option.icon}</span>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-sm mb-0.5">{optI18n?.label ?? option.label}</h3>
                                                            <p className="text-xs text-muted-foreground">{optI18n?.description ?? option.description}</p>
                                                        </div>
                                                        <ChevronRight className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground/30')} />
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            }

            // ═══ STEP 4: WEEKLY INVESTMENT ═══
            case 4:
                return (
                    <motion.div key="investment" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20" variant="outline">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {t('onboarding.weeklyPlan')}
                            </Badge>
                            <h1 className="text-2xl font-bold mb-1">{t('onboarding.setWeeklyInvestment')}</h1>
                            <p className="text-sm text-muted-foreground mb-6">
                                {t('onboarding.personalizedFor')} <strong className="text-primary">{investorType || 'Balanced Optimizer'}</strong> {t('onboarding.profile')}
                            </p>

                            {/* Tiers */}
                            <div className="space-y-3 mb-4">
                                {tiers.map((tier) => {
                                    const isSelected = selectedAmount === tier.amount;
                                    return (
                                        <button
                                            key={tier.amount}
                                            onClick={() => { setSelectedAmount(tier.amount); setShowCustom(false); }}
                                            className={cn(
                                                'w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98]',
                                                isSelected
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                    : 'border-border bg-card hover:border-primary/30',
                                                tier.recommended && !isSelected && 'border-amber-500/30 bg-amber-500/[0.02]'
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{tier.icon}</span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-bold">{tier.label}</h3>
                                                            <Badge variant={tier.recommended ? 'premium' : 'secondary'} className="text-[11px]">{tier.tag}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-primary">${tier.amount}</span>
                                                    <span className="text-xs text-muted-foreground">{t('onboarding.perWeek')}</span>
                                                </div>
                                            </div>
                                            {/* Proof line */}
                                            <p className="text-[11px] text-muted-foreground mb-2 pl-9">{tier.proof}</p>
                                            {/* Projections */}
                                            <div className="flex gap-3 pl-9">
                                                <div className="flex-1 text-center p-1.5 rounded-lg bg-secondary/50">
                                                    <p className="text-[11px] text-muted-foreground">1yr</p>
                                                    <p className="text-[11px] font-bold">{tier.projections.y1}</p>
                                                </div>
                                                <div className="flex-1 text-center p-1.5 rounded-lg bg-secondary/50">
                                                    <p className="text-[11px] text-muted-foreground">3yr</p>
                                                    <p className="text-[11px] font-bold text-primary">{tier.projections.y3}</p>
                                                </div>
                                                <div className="flex-1 text-center p-1.5 rounded-lg bg-secondary/50">
                                                    <p className="text-[11px] text-muted-foreground">5yr</p>
                                                    <p className="text-[11px] font-bold text-green-500">{tier.projections.y5}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom */}
                            <button onClick={() => setShowCustom(!showCustom)} className="text-xs text-primary underline mb-4">
                                {showCustom ? t('onboarding.hideCustom') : t('onboarding.showCustom')}
                            </button>

                            {showCustom && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4">
                                    <Card>
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-2xl font-bold text-primary">${customAmount}</span>
                                                <span className="text-xs text-muted-foreground">/week</span>
                                            </div>
                                            <Slider value={[customAmount]} onValueChange={([v]) => { setCustomAmount(v); setSelectedAmount(0); }} min={10} max={2000} step={5} />
                                            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                                                <span>$10</span><span>${(customAmount * 4).toLocaleString()}{t('onboarding.perMonth')}</span><span>$2,000</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Projection Chart */}
                            {(selectedAmount > 0 || showCustom) && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                    <Card className="border-none" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.04), rgba(99,102,241,0.04))' }}>
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                                <span className="text-sm font-semibold">{t('onboarding.growthProjection')}</span>
                                                <Badge variant="secondary" className="text-[11px] ml-auto">
                                                    {investorType === 'Conservative Builder' ? '~15%' : investorType === 'Growth Seeker' ? '~60%+' : '~35%'} {t('onboarding.annual')}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mb-3">
                                                {t('onboarding.projectionLegend')}
                                            </p>
                                            <div className="h-[140px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={projectionData}>
                                                        <defs>
                                                            <linearGradient id="onbGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                                                        <YAxis hide />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                                                        <Area type="monotone" dataKey="projected" stroke="#8b5cf6" fill="url(#onbGrad)" strokeWidth={2} />
                                                        <Area type="monotone" dataKey="invested" stroke="#4ade80" fillOpacity={0} strokeDasharray="5 5" strokeWidth={1} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-center mt-3">
                                                <div className="p-2 rounded-lg bg-secondary/40">
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.year1')}</p>
                                                    <p className="text-xs font-bold">${projectionData[2]?.projected.toLocaleString() || '—'}</p>
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.invested')}: ${projectionData[2]?.invested.toLocaleString() || '—'}</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.year3')}</p>
                                                    <p className="text-xs font-bold text-primary">${projectionData[6]?.projected.toLocaleString() || '—'}</p>
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.invested')}: ${projectionData[6]?.invested.toLocaleString() || '—'}</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.year5')}</p>
                                                    <p className="text-xs font-bold text-green-500">${projectionData[projectionData.length - 1]?.projected.toLocaleString() || '—'}</p>
                                                    <p className="text-[11px] text-muted-foreground">{t('onboarding.invested')}: ${projectionData[projectionData.length - 1]?.invested.toLocaleString() || '—'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Proof & context */}
                                    <div className="flex items-start gap-2 px-1">
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            {t('onboarding.projectionDisclaimer')}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <Button
                            variant="premium" size="lg"
                            className="w-full mt-6"
                            disabled={selectedAmount === 0 && !showCustom}
                            onClick={goNext}
                        >
                            {t('onboarding.continue')}
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </motion.div>
                );

            // ═══ STEP 5: APP TOUR & ACTIVATION ═══
            case 5:
                if (confirmed) {
                    return (
                        <motion.div key="success" initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: animDuration }} className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
                            {/* Confetti particles — hidden with reduced motion */}
                            {!prefersReducedMotion && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-2 h-2 rounded-full"
                                            style={{
                                                left: `${10 + Math.random() * 80}%`,
                                                top: '-5%',
                                                backgroundColor: ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899'][i % 6],
                                            }}
                                            initial={{ y: 0, opacity: 1, rotate: 0, scale: 0.6 + Math.random() * 0.8 }}
                                            animate={{
                                                y: [0, window.innerHeight * (0.5 + Math.random() * 0.5)],
                                                x: [0, (Math.random() - 0.5) * 150],
                                                opacity: [1, 1, 0],
                                                rotate: [0, Math.random() * 720 - 360],
                                            }}
                                            transition={{
                                                duration: 1.8 + Math.random() * 1.2,
                                                delay: Math.random() * 0.4,
                                                ease: [0.25, 0.46, 0.45, 0.94],
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            <motion.div initial={prefersReducedMotion ? {} : { scale: 0 }} animate={{ scale: 1 }} transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 200 }}
                                className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </motion.div>
                            <h1 className="text-2xl font-bold mb-2">{t('onboarding.allSet')}</h1>
                            <p className="text-muted-foreground text-sm mb-4">{t('onboarding.welcomeFamily')}<br />{t('onboarding.dashboardReady')}</p>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20" variant="outline">
                                <Crown className="w-3 h-3 mr-1" />
                                {t('onboarding.apiceMember')}
                            </Badge>
                        </motion.div>
                    );
                }

                return (
                    <motion.div key="tour" {...slideIn} transition={{ duration: animDuration }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20" variant="outline">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {t('onboarding.yourApp')}
                            </Badge>
                            <h1 className="text-2xl font-bold mb-2">{t('onboarding.yourDashboard')}</h1>
                            <p className="text-sm text-muted-foreground mb-6">{t('onboarding.dashboardDesc')}</p>

                            <div className="space-y-3">
                                {[
                                    { icon: TrendingUp, title: t('onboarding.tourHome'), desc: t('onboarding.tourHomeDesc'), color: 'text-green-400' },
                                    { icon: PieChart, title: t('onboarding.tourPortfolio'), desc: t('onboarding.tourPortfolioDesc'), color: 'text-blue-400' },
                                    { icon: Zap, title: t('onboarding.tourStrategies'), desc: t('onboarding.tourStrategiesDesc'), color: 'text-purple-400' },
                                    { icon: BookOpen, title: t('onboarding.tourLearn'), desc: t('onboarding.tourLearnDesc'), color: 'text-indigo-400' },
                                    { icon: Award, title: t('onboarding.tourProfile'), desc: t('onboarding.tourProfileDesc'), color: 'text-amber-400' },
                                ].map((item, i) => (
                                    <motion.div key={item.title} initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: prefersReducedMotion ? 0 : 0.1 + i * 0.08, duration: animDuration }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50">
                                        <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                            <item.icon className={cn('w-4 h-4', item.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold">{item.title}</p>
                                            <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Summary */}
                            <motion.div initial={prefersReducedMotion ? {} : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: animDuration }}
                                className="mt-6 p-4 rounded-xl border border-primary/20" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold">{t('onboarding.setupSummary')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div><span className="text-muted-foreground">{t('onboarding.summaryProfile')}</span> <strong>{investorType || 'Balanced'}</strong></div>
                                    <div><span className="text-muted-foreground">{t('onboarding.summaryWeekly')}</span> <strong>${selectedAmount || customAmount}</strong></div>
                                    <div><span className="text-muted-foreground">{t('onboarding.summaryTarget')}</span> <strong>{investorType === 'Conservative Builder' ? '~15%' : investorType === 'Growth Seeker' ? '~60%+' : '~35%'} a.a.</strong></div>
                                    <div><span className="text-muted-foreground">{t('onboarding.summaryStyle')}</span> <strong>{userProfile.habitType === 'passive' ? t('onboarding.stylePassive') : userProfile.habitType === 'active' ? t('onboarding.styleActive') : t('onboarding.styleMinimal')}</strong></div>
                                </div>
                            </motion.div>
                        </div>

                        <Button variant="premium" size="lg" className="w-full mt-6" onClick={handleFinish}>
                            <Rocket className="w-4 h-4 mr-1" />
                            {t('onboarding.activateDashboard')}
                        </Button>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    // ─── MAIN LAYOUT ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background flex flex-col px-6 py-6 safe-top">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goBack}
                    aria-label={t('common.back')}
                    className={cn('w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80', step === 0 && 'invisible')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {step === 0 ? '' : `${t('onboarding.stepOf').replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}`}
                </span>

                <button onClick={handleSkip} aria-label={t('onboarding.skip')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <SkipForward className="w-3 h-3" />
                    {t('onboarding.skip')}
                </button>
            </div>

            {/* Progress */}
            {step > 0 && (
                <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('onboarding.stepOf').replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}>
                    <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} animate={{ width: `${progress}%` }} transition={{ duration: prefersReducedMotion ? 0 : 0.3 }} />
                </div>
            )}

            {/* Step indicators for screen readers */}
            <div className="sr-only" aria-live="polite">
                {t('onboarding.stepOf').replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}
            </div>

            {/* Content */}
            <div ref={contentRef}>
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Wrap in ErrorBoundary for error handling
export default function ApiceOnboarding() {
    return (
        <ErrorBoundary>
            <ApiceOnboardingInner />
        </ErrorBoundary>
    );
}
