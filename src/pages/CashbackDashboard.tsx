import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import {
    Bitcoin,
    TrendingUp,

    CreditCard,
    Settings,
    ChevronLeft,
    Sparkles,
    Target,
    ArrowRight,
    ExternalLink,
    TrendingDown,
    Lock,
    Loader2,
    Inbox,
    Lightbulb,
    Crown,
} from 'lucide-react';

// Subscription tier type
type Tier = 'free' | 'pro' | 'club';

// Data structures for the cashback dashboard
interface CashbackTransaction {
    id: string;
    source: string;
    amountUsd: number;
    cashbackUsd: number;
    cashbackBtc: number;
    date: string;
    type: 'purchase' | 'subscription' | 'trading-fee';
}

interface CashbackSummary {
    totalBtc: number;
    totalUsd: number;
    dailyChangePct: number;
    monthlyVolume: number;
    avgCashbackRate: number;
}

interface ChallengeState {
    currentUsd: number;
    targetUsd: number;
    daysRemaining: number;
    isActive: boolean;
}

interface OptimizationTip {
    id: string;
    title: string;
    description: string;
    potentialSavingsUsd: number;
}

// Estimated cashback data based on simulated trading volume
// In production, this would come from Bybit API
function useEstimatedCashbackData(): {
    summary: CashbackSummary;
    transactions: CashbackTransaction[];
    challenge: ChallengeState;
    optimizations: OptimizationTip[];
    isLoading: boolean;
} {
    const [isLoading] = useState(false);

    const summary: CashbackSummary = {
        totalBtc: 0.00000000,
        totalUsd: 0.00,
        dailyChangePct: 0,
        monthlyVolume: 0,
        avgCashbackRate: 0,
    };

    const transactions: CashbackTransaction[] = [];

    const challenge: ChallengeState = {
        currentUsd: 0,
        targetUsd: 500,
        daysRemaining: 30,
        isActive: false,
    };

    const optimizations: OptimizationTip[] = [
        {
            id: 'tip-1',
            title: 'Increase trading frequency',
            description: 'Trading 3x per week instead of 1x could boost your cashback by 40%. Consistent small trades accumulate faster than sporadic large ones.',
            potentialSavingsUsd: 18.50,
        },
        {
            id: 'tip-2',
            title: 'Use limit orders over market orders',
            description: 'Limit orders on Bybit have lower fees (0.01% maker vs 0.06% taker), meaning more of your volume converts to cashback.',
            potentialSavingsUsd: 12.00,
        },
        {
            id: 'tip-3',
            title: 'Enable subscription cashback partners',
            description: 'Connect eligible subscriptions (streaming, tools) to earn 100% BTC cashback on monthly charges.',
            potentialSavingsUsd: 25.00,
        },
    ];

    return { summary, transactions, challenge, optimizations, isLoading };
}

// Gated section with blur overlay and upgrade prompt
function GatedSection({
    children,
    isLocked,
    requiredTier,
    featureLabel,
    onUpgrade,
}: {
    children: React.ReactNode;
    isLocked: boolean;
    requiredTier: Tier;
    featureLabel: string;
    onUpgrade: () => void;
}) {
    if (!isLocked) return <>{children}</>;

    const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Club';

    return (
        <div className="relative">
            <div className="filter blur-[3px] pointer-events-none select-none opacity-60">
                {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-2xl">
                <div className="text-center space-y-2 p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{featureLabel}</p>
                    <p className="text-xs text-muted-foreground">
                        Available on {tierLabel} plan and above
                    </p>
                    <Button size="sm" variant="premium" onClick={onUpgrade} className="gap-1.5">
                        <Crown className="w-3 h-3" />
                        Upgrade to {tierLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}


// Empty state component
function EmptyState({ message, icon: Icon }: { message: string; icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export default function CashbackDashboard() {
    const navigate = useNavigate();
    const subscription = useAppStore((s) => s.subscription);
    const tier: Tier = subscription.tier;

    const { summary, transactions, optimizations, isLoading } = useEstimatedCashbackData();

    const handleUpgrade = () => navigate('/settings');

    // Tier-based access
    const canSeeFullDashboard = tier === 'pro' || tier === 'club';
    const canSeeOptimizations = tier === 'club';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading cashback data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
                <div className="px-5 py-4 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/strategies')}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-bold">Cashback Machine</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/settings')}
                        className="rounded-full"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {/* BTC Accumulated - Free tier can see overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-none bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Bitcoin className="w-32 h-32" />
                        </div>
                        <CardContent className="pt-6 relative z-10">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground font-medium">Accumulated Bitcoin</p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <Bitcoin className="w-8 h-8 text-amber-500" />
                                    <h1 className="text-4xl font-bold tracking-tight">
                                        {summary.totalBtc.toFixed(8)}
                                    </h1>
                                    <span className="text-sm text-muted-foreground">BTC</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-2xl font-semibold text-muted-foreground">
                                        ${summary.totalUsd.toFixed(2)}
                                    </p>
                                    {summary.dailyChangePct !== 0 && (
                                        <Badge variant={summary.dailyChangePct >= 0 ? 'default' : 'destructive'} className="gap-1">
                                            {summary.dailyChangePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(summary.dailyChangePct).toFixed(2)}%
                                        </Badge>
                                    )}
                                </div>
                                {summary.totalBtc === 0 && (
                                    <p className="text-xs text-muted-foreground/70 mt-2">
                                        Connect your Bybit account and start trading to earn cashback
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 30-Day Challenge - Free tier can see */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-primary/20 bg-primary/5 opacity-75">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    30-Day Challenge
                                </CardTitle>
                                <Badge variant="outline" className="gap-1 text-xs text-amber-400 border-amber-500/30">
                                    <Sparkles className="w-3 h-3" />
                                    Coming Q2 2026
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Challenge your cashback earnings with 30-day goals. Available when Bybit cashback API launches.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Accumulation Projection - Free tier sees basic, Pro sees full */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                Accumulation Projection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground mb-1">In 1 year</p>
                                    <p className="text-xl font-bold text-primary">0.028 BTC</p>
                                    <p className="text-xs text-muted-foreground">~$1,900</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground mb-1">In 5 years</p>
                                    <p className="text-xl font-bold text-green-500">0.140 BTC</p>
                                    <p className="text-xs text-muted-foreground">~$9,500</p>
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground italic">
                                *Based on $500/month average trading volume and conservative BTC growth
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Transaction History - Gated: Pro+ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <GatedSection
                        isLocked={!canSeeFullDashboard}
                        requiredTier="pro"
                        featureLabel="Transaction History"
                        onUpgrade={handleUpgrade}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-sm">Recent Transactions</h3>
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    See All <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {transactions.length === 0 ? (
                                <EmptyState
                                    icon={Inbox}
                                    message="No cashback transactions yet. Start trading on Bybit to earn BTC rewards on every trade."
                                />
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <Card key={tx.id} className="border-none bg-secondary/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                                                            <CreditCard className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm flex items-center gap-2">
                                                                {tx.source}
                                                                {tx.type === 'subscription' && (
                                                                    <Badge variant="default" className="text-[11px] px-1.5 py-0">100%</Badge>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">${tx.amountUsd.toFixed(2)}</p>
                                                        <p className="text-xs text-green-500 flex items-center gap-1">
                                                            <Bitcoin className="w-3 h-3" />
                                                            +{tx.cashbackBtc.toFixed(8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GatedSection>
                </motion.div>

                {/* Optimization Suggestions - Gated: Club only */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <GatedSection
                        isLocked={!canSeeOptimizations}
                        requiredTier="club"
                        featureLabel="Cashback Optimization Tips"
                        onUpgrade={handleUpgrade}
                    >
                        <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-violet-500" />
                                    Optimization Suggestions
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    AI-powered tips to maximize your cashback earnings
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {optimizations.map((tip) => (
                                    <div
                                        key={tip.id}
                                        className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-1"
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm">{tip.title}</p>
                                            <Badge variant="outline" className="text-[11px] text-green-500 border-green-500/30 shrink-0">
                                                +${tip.potentialSavingsUsd.toFixed(0)}/mo
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {tip.description}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </GatedSection>
                </motion.div>

                {/* 100% Cashback Subscriptions - Coming Soon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 opacity-75">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-green-500" />
                                    100% Cashback Subscriptions
                                </CardTitle>
                                <Badge variant="outline" className="gap-1 text-xs text-amber-400 border-amber-500/30 shrink-0">
                                    <Sparkles className="w-3 h-3" />
                                    Coming Q2 2026
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Get 100% back in Bitcoin on Netflix, Spotify, and more.
                            </p>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* CTA - Apply for Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white">
                        <CardContent className="p-6 text-center space-y-3">
                            <CreditCard className="w-12 h-12 mx-auto" />
                            <div>
                                <h3 className="font-bold text-lg">Don't have the card yet?</h3>
                                <p className="text-sm opacity-90">Apply now and start accumulating Bitcoin</p>
                            </div>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-full gap-2"
                                onClick={() => navigate('/cashback-machine')}
                            >
                                Request Card
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
