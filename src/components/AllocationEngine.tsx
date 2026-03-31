import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { dcaRecommendations, portfolios } from '@/data/sampleData';
import {
    Sparkles, Info, Check, ChevronRight, ArrowRight, TrendingUp,
    Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllocationEngineProps {
    weeklyAmount: number;
    onAccept: (allocations: { asset: string; percentage: number; color: string }[]) => void;
    onCustomize: () => void;
    compact?: boolean;
}

// Color palette for assets
const assetColors: Record<string, string> = {
    BTC: 'hsl(33, 100%, 50%)',
    ETH: 'hsl(217, 100%, 60%)',
    SOL: 'hsl(280, 100%, 60%)',
    AVAX: 'hsl(0, 100%, 60%)',
    LINK: 'hsl(220, 100%, 55%)',
    ARB: 'hsl(210, 100%, 55%)',
    USDT: 'hsl(152, 70%, 50%)',
    USDC: 'hsl(210, 100%, 55%)',
    OP: 'hsl(0, 100%, 55%)',
    TIA: 'hsl(270, 100%, 65%)',
    INJ: 'hsl(200, 100%, 55%)',
    JUP: 'hsl(30, 100%, 55%)',
    Others: 'hsl(200, 50%, 50%)',
    Stables: 'hsl(152, 60%, 50%)',
};

export function AllocationEngine({ weeklyAmount, onAccept, onCustomize, compact }: AllocationEngineProps) {
    const investorType = useAppStore((s) => s.investorType);
    const userProfile = useAppStore((s) => s.userProfile);
    const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
    const learnProgress = useAppStore((s) => s.learnProgress);
    const unlockState = useAppStore((s) => s.unlockState);

    // Smart allocation logic
    const recommendation = useMemo(() => {
        // 1. If user has a selected portfolio, use its allocations
        if (selectedPortfolio.portfolioId) {
            const portfolio = portfolios.find(p => p.id === selectedPortfolio.portfolioId);
            if (portfolio) {
                return {
                    allocations: portfolio.allocations.map(a => ({
                        asset: a.asset,
                        percentage: a.percentage,
                        color: a.color || assetColors[a.asset] || 'hsl(200, 50%, 50%)',
                    })),
                    rationale: portfolio.whyItWorks,
                    strategyName: portfolio.name,
                    riskLevel: portfolio.riskLabel,
                    source: 'portfolio' as const,
                };
            }
        }

        // 2. Use DCA recommendation based on profile
        const rec = dcaRecommendations.find(
            r => r.profileType === investorType && r.capitalRange === userProfile.capitalRange
        );
        if (rec) {
            return {
                allocations: rec.assets.map(a => ({
                    asset: a.symbol,
                    percentage: a.allocation,
                    color: assetColors[a.symbol] || 'hsl(200, 50%, 50%)',
                })),
                rationale: rec.rationale,
                strategyName: `${investorType} Strategy`,
                riskLevel: investorType === 'Conservative Builder' ? 'Low Risk'
                    : investorType === 'Growth Seeker' ? 'High Risk' : 'Medium Risk',
                source: 'recommendation' as const,
            };
        }

        // 3. Fallback to balanced default
        return {
            allocations: [
                { asset: 'BTC', percentage: 40, color: assetColors.BTC },
                { asset: 'ETH', percentage: 30, color: assetColors.ETH },
                { asset: 'SOL', percentage: 20, color: assetColors.SOL },
                { asset: 'USDT', percentage: 10, color: assetColors.USDT },
            ],
            rationale: 'Balanced allocation across top assets for diversified growth.',
            strategyName: 'Balanced Default',
            riskLevel: 'Medium Risk',
            source: 'default' as const,
        };
    }, [selectedPortfolio, investorType, userProfile.capitalRange]);

    // Personalization context
    const contextFactors = useMemo(() => {
        const factors: string[] = [];
        if (investorType) factors.push(`${investorType} profile`);
        if (learnProgress.completedLessons.length > 0) factors.push(`${learnProgress.completedLessons.length} lessons completed`);
        if (unlockState.optimizedPortfolios) factors.push('Pro features unlocked');
        return factors;
    }, [investorType, learnProgress, unlockState]);

    if (compact) {
        return (
            <div className="space-y-3">
                {/* Compact allocation bar */}
                <div className="flex h-3 rounded-full overflow-hidden">
                    {recommendation.allocations.map((alloc) => (
                        <div
                            key={alloc.asset}
                            className="h-full transition-all duration-500"
                            style={{ width: `${alloc.percentage}%`, backgroundColor: alloc.color }}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {recommendation.allocations.map((alloc) => (
                        <div key={alloc.asset} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alloc.color }} />
                            <span className="text-xs">{alloc.asset}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{alloc.percentage}%</span>
                            <span className="text-[11px] text-muted-foreground">${((weeklyAmount * alloc.percentage) / 100).toFixed(0)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border-primary/20">
            <div className="p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold">Smart Allocation</h3>
                    </div>
                    <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
                        {recommendation.source === 'portfolio' ? 'Portfolio-based' : 'AI Recommended'}
                    </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Personalized for: {contextFactors.join(' · ')}
                </p>
            </div>

            <CardContent className="pt-4 pb-4 space-y-4">
                {/* Strategy Name & Risk */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{recommendation.strategyName}</span>
                    </div>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-[11px]',
                            recommendation.riskLevel === 'Low Risk' && 'bg-green-500/10 text-green-400',
                            recommendation.riskLevel === 'Medium Risk' && 'bg-amber-500/10 text-amber-400',
                            recommendation.riskLevel === 'High Risk' && 'bg-red-500/10 text-red-400',
                        )}
                    >
                        {recommendation.riskLevel}
                    </Badge>
                </div>

                {/* Visual allocation bar */}
                <div className="flex h-3 rounded-full overflow-hidden">
                    {recommendation.allocations.map((alloc) => (
                        <motion.div
                            key={alloc.asset}
                            initial={{ width: 0 }}
                            animate={{ width: `${alloc.percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full"
                            style={{ backgroundColor: alloc.color }}
                        />
                    ))}
                </div>

                {/* Asset list */}
                <div className="space-y-2">
                    {recommendation.allocations.map((alloc, i) => (
                        <motion.div
                            key={alloc.asset}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: alloc.color }} />
                            <span className="text-sm flex-1 font-medium">{alloc.asset}</span>
                            <span className="text-sm text-muted-foreground">{alloc.percentage}%</span>
                            <span className="text-sm font-semibold">
                                ${((weeklyAmount * alloc.percentage) / 100).toFixed(2)}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Rationale */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50">
                    <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {recommendation.rationale}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="premium"
                        size="sm"
                        className="flex-1"
                        onClick={() => onAccept(recommendation.allocations)}
                    >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Accept
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={onCustomize}
                    >
                        Customize
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
