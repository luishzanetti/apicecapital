import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { getReturnRateForInvestorType, getReturnLabel } from '@/data/sampleData';
import {
    ArrowRight, ArrowLeft, TrendingUp, DollarSign, Sparkles,
    Shield, Target, Zap, ChevronRight, Check, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

// Investment tier configurations
const getPersonalizedTiers = (capitalRange: string | null, investorType: string | null) => {
    const isConservative = investorType === 'Conservative Builder';
    const isGrowth = investorType === 'Growth Seeker';

    if (capitalRange === 'under-200') {
        return [
            { amount: 25, label: 'Starter', tag: 'Start small', description: 'Build the habit with minimal commitment', icon: '🌱', recommended: false },
            { amount: 50, label: 'Recommended', tag: 'Sweet spot', description: 'The ideal starting point for your profile', icon: '⭐', recommended: true },
            { amount: 100, label: 'Accelerated', tag: 'Fast track', description: 'Accelerate your early growth phase', icon: '🚀', recommended: false },
        ];
    }
    if (capitalRange === '200-1k') {
        return [
            { amount: 50, label: 'Starter', tag: 'Build habits', description: 'Consistent weekly contribution', icon: '🌱', recommended: false },
            { amount: 100, label: 'Recommended', tag: 'Optimal growth', description: isConservative ? 'Steady accumulation of proven assets' : 'Balanced growth for your goals', icon: '⭐', recommended: true },
            { amount: 250, label: 'Accelerated', tag: 'Power mode', description: 'Maximize your early portfolio growth', icon: '🚀', recommended: false },
        ];
    }
    if (capitalRange === '1k-5k') {
        return [
            { amount: 100, label: 'Steady', tag: 'Consistent', description: 'Disciplined weekly accumulation', icon: '🌱', recommended: false },
            { amount: 250, label: 'Recommended', tag: 'Optimal', description: isGrowth ? 'Aggressive growth aligned to your goals' : 'Sweet spot for your capital level', icon: '⭐', recommended: true },
            { amount: 500, label: 'Accelerated', tag: 'Fast track', description: 'Reach investment milestones faster', icon: '🚀', recommended: false },
        ];
    }
    // 5k-plus
    return [
        { amount: 250, label: 'Moderate', tag: 'Steady pace', description: 'Consistent high-value accumulation', icon: '🌱', recommended: false },
        { amount: 500, label: 'Recommended', tag: 'Optimal', description: 'Strategic allocation for serious investors', icon: '⭐', recommended: true },
        { amount: 1000, label: 'Maximum', tag: 'Full power', description: 'Maximum weekly allocation for rapid growth', icon: '🚀', recommended: false },
    ];
};

// Generate projection data
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
            data.push({
                label: month === 0 ? 'Now' : `${month}m`,
                projected: Math.round(total),
                invested: Math.round(invested),
            });
        }
    }
    return data;
};

export default function InvestmentOnboarding() {
    const navigate = useNavigate();
    const userProfile = useAppStore((s) => s.userProfile);
    const investorType = useAppStore((s) => s.investorType);
    const setWeeklyInvestment = useAppStore((s) => s.setWeeklyInvestment);
    const completeOnboarding = useAppStore((s) => s.completeOnboarding);
    const startFreeTrial = useAppStore((s) => s.startFreeTrial);

    const tiers = useMemo(
        () => getPersonalizedTiers(userProfile.capitalRange, investorType),
        [userProfile.capitalRange, investorType]
    );

    const recommendedTier = tiers.find(t => t.recommended) || tiers[1];
    const [selectedAmount, setSelectedAmount] = useState(recommendedTier.amount);
    const [customMode, setCustomMode] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm'>('select');

    const annualRate = getReturnRateForInvestorType(investorType) || 0.10;
    const returnLabel = getReturnLabel(investorType) || 'Moderate';

    const projectionData = useMemo(() => generateProjections(selectedAmount, annualRate), [selectedAmount, annualRate]);
    const fiveYearProjected = projectionData[projectionData.length - 1]?.projected || 0;
    const fiveYearInvested = projectionData[projectionData.length - 1]?.invested || 0;
    const fiveYearGain = fiveYearProjected - fiveYearInvested;
    const fiveYearReturn = fiveYearInvested > 0 ? ((fiveYearGain / fiveYearInvested) * 100).toFixed(0) : '0';

    const selectedTier = tiers.find(t => t.amount === selectedAmount);

    const handleConfirm = () => {
        setWeeklyInvestment(selectedAmount);
        if (!useAppStore.getState().hasCompletedOnboarding) {
            completeOnboarding();
            startFreeTrial();
        }
        navigate('/profile-result');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col safe-top">
            {/* Header */}
            <div className="px-6 pt-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Badge variant="outline" className="text-xs px-3 py-1">
                        Final Step
                    </Badge>
                    <div className="w-10" />
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-secondary rounded-full overflow-hidden mt-4">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)' }}
                        initial={{ width: '85%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 'select' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 px-6 pb-8 flex flex-col"
                    >
                        {/* Title */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold mb-2">Set Your Weekly Investment</h1>
                            <p className="text-muted-foreground text-sm">
                                Choose how much you want to invest each week.
                                <br />
                                <span className="text-xs">Personalized for your <strong className="text-primary">{investorType}</strong> profile.</span>
                            </p>
                        </div>

                        {/* Tier Selection */}
                        {!customMode && (
                            <div className="space-y-3 mb-6">
                                {tiers.map((tier, i) => (
                                    <motion.button
                                        key={tier.amount}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        onClick={() => setSelectedAmount(tier.amount)}
                                        className={cn(
                                            'w-full p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] relative overflow-hidden',
                                            selectedAmount === tier.amount
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                : 'border-border bg-card hover:border-primary/30'
                                        )}
                                    >
                                        {tier.recommended && (
                                            <div className="absolute top-0 right-0">
                                                <Badge className="rounded-none rounded-bl-lg text-[11px] px-2 py-0.5 bg-primary">
                                                    RECOMMENDED
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl">{tier.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-semibold text-sm">{tier.label}</h3>
                                                    <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                                                        {tier.tag}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{tier.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">${tier.amount}</p>
                                                <p className="text-[11px] text-muted-foreground">/week</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Custom Amount */}
                        {customMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <Card className="border-primary/20">
                                    <CardContent className="pt-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-medium">Custom Amount</span>
                                            <span className="text-2xl font-bold text-primary">${selectedAmount}</span>
                                        </div>
                                        <Slider
                                            value={[selectedAmount]}
                                            onValueChange={([v]) => setSelectedAmount(v)}
                                            min={10}
                                            max={2000}
                                            step={5}
                                            className="mb-3"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>$10</span>
                                            <span>$2,000</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        <button
                            onClick={() => setCustomMode(!customMode)}
                            className="text-xs text-primary hover:text-primary/80 text-center mb-6 underline underline-offset-4"
                        >
                            {customMode ? 'Choose from recommended tiers' : 'Set a custom amount'}
                        </button>

                        {/* Projection Preview */}
                        <Card className="border-none bg-gradient-to-br from-primary/5 via-background to-secondary/5 mb-6">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">5-Year Projection</span>
                                </div>
                                <div className="h-[140px] w-full mb-3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectionData}>
                                            <defs>
                                                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                                labelStyle={{ color: '#888', fontSize: '11px' }}
                                            />
                                            <Area type="monotone" dataKey="projected" stroke="#8b5cf6" fill="url(#projGrad)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="invested" stroke="#4ade80" fillOpacity={0} strokeDasharray="5 5" strokeWidth={1} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase">Invested</p>
                                        <p className="text-sm font-bold">${fiveYearInvested.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase">Projected</p>
                                        <p className="text-sm font-bold text-primary">${fiveYearProjected.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-muted-foreground uppercase">Return</p>
                                        <p className="text-sm font-bold text-green-500">+{fiveYearReturn}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Strategy Rationale */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 mb-6">
                            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                {investorType === 'Conservative Builder'
                                    ? `At $${selectedAmount}/week, you'll build a solid blue-chip foundation focused on BTC & ETH. This disciplined approach minimizes timing risk while steadily growing your portfolio.`
                                    : investorType === 'Growth Seeker'
                                        ? `At $${selectedAmount}/week, you'll aggressively diversify across high-conviction assets. Your growth-focused allocation targets asymmetric upside while maintaining core positions.`
                                        : `At $${selectedAmount}/week, you'll build a balanced portfolio optimized for risk-adjusted returns. Your allocation combines stability with strategic growth exposure.`
                                }
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-auto">
                            <Button
                                variant="premium"
                                size="lg"
                                className="w-full"
                                onClick={() => setStep('confirm')}
                            >
                                Continue with ${selectedAmount}/week
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                            <p className="text-center text-[11px] text-muted-foreground mt-3">
                                You can change this anytime in your portfolio settings.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 px-6 pb-8 flex flex-col"
                    >
                        {/* Confirmation Screen */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold mb-2">Your Investment Plan</h1>
                            <p className="text-muted-foreground text-sm">
                                Here's a summary of your personalized strategy.
                            </p>
                        </div>

                        {/* Summary Card */}
                        <Card className="overflow-hidden mb-6">
                            <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weekly Investment</span>
                                    </div>
                                    <Badge variant="default" className="bg-primary">Active</Badge>
                                </div>
                                <p className="text-4xl font-bold mb-1">${selectedAmount}</p>
                                <p className="text-xs text-muted-foreground">per week · ${(selectedAmount * 4).toLocaleString()}/month · ${(selectedAmount * 52).toLocaleString()}/year</p>
                            </div>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Profile Type</p>
                                        <p className="text-sm font-medium">{investorType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">5-Year Projection</p>
                                        <p className="text-sm font-medium">${fiveYearProjected.toLocaleString()} <span className="text-green-500 text-xs">(+{fiveYearReturn}%)</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Strategy</p>
                                        <p className="text-sm font-medium">
                                            {investorType === 'Conservative Builder' ? 'Blue-Chip DCA' : investorType === 'Growth Seeker' ? 'Growth Diversified' : 'Balanced Optimizer'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* How it works */}
                        <div className="space-y-3 mb-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" /> How it works
                            </h3>
                            {[
                                { step: '1', text: 'You receive a weekly reminder to make your deposit' },
                                { step: '2', text: 'We show you exactly how to split it across your portfolio' },
                                { step: '3', text: 'Confirm your deposit and watch your portfolio grow' },
                                { step: '4', text: 'Unlock new strategies as your portfolio evolves' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-[11px] font-bold text-primary">{item.step}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Trust */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 mb-6">
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Your funds remain on your exchange. Apice guides your allocation—you execute and stay in full control.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="mt-auto space-y-3">
                            <Button
                                variant="premium"
                                size="lg"
                                className="w-full"
                                onClick={handleConfirm}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Activate My Plan
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={() => setStep('select')}
                            >
                                Go back and adjust
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
