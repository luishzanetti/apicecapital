import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/appStore';
import { Brain, CheckCircle, AlertTriangle, TrendingUp, Shield, Zap, Loader2 } from 'lucide-react';

export function PortfolioAiAnalysis() {
    const userProfile = useAppStore((s) => s.userProfile);
    const investorType = useAppStore((s) => s.investorType);
    const [analyzing, setAnalyzing] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Simulated analysis logic
    const handleAnalyze = () => {
        setAnalyzing(true);
        setShowResult(false);
        setTimeout(() => {
            setAnalyzing(false);
            setShowResult(true);
        }, 2500); // 2.5s simulated delay
    };

    const getRecommendations = () => {
        if (investorType === 'Conservative Builder') {
            return {
                strategy: 'Defensive Accumulation',
                allocation: '70% BTC / 20% ETH / 10% Stables',
                reason: 'High priority on capital preservation while capturing major trend movements.',
                riskLevel: 'Low',
                action: 'Focus on DCA into Bitcoin during dips.'
            };
        } else if (investorType === 'Growth Seeker') {
            return {
                strategy: 'Aggressive Growth',
                allocation: '40% BTC / 30% ETH / 30% Alts (AI/Gaming)',
                reason: 'You have high risk tolerance. Exposure to emerging narratives offers asymmetric upside.',
                riskLevel: 'High',
                action: 'Layer into high-beta assets but maintain stop-losses.'
            };
        } else {
            return {
                strategy: 'Balanced Weighted',
                allocation: '50% BTC / 30% ETH / 20% L1s',
                reason: 'Optimal Sharpe ratio. Captures growth without excessive drawdown risk.',
                riskLevel: 'Medium',
                action: 'Rebalance monthly to maintain 50% Bitcoin dominance.'
            };
        }
    };

    const rec = getRecommendations();

    return (
        <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-primary animate-pulse" />
                    AI Portfolio Intelligence
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 space-y-4">
                {!showResult && !analyzing && (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Analyze your profile and current market conditions to generate a personalized strategy.
                        </p>
                        <Button onClick={handleAnalyze} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
                            <Zap className="w-4 h-4 mr-2" />
                            Run AI Analysis
                        </Button>
                    </div>
                )}

                {analyzing && (
                    <div className="space-y-4 py-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Scanning Volatility...</span>
                                <span>34%</span>
                            </div>
                            <Progress value={34} className="h-1" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Analyzing Risk Profile...</span>
                                <span>78%</span>
                            </div>
                            <Progress value={78} className="h-1" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Optimizing Allocations...</span>
                                <span>92%</span>
                            </div>
                            <Progress value={92} className="h-1" />
                        </div>
                        <div className="flex justify-center mt-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    </div>
                )}

                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-background/50 border border-border/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-primary">{rec.strategy}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target Allocation</p>
                                <p className="text-xs font-medium">{rec.allocation}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-medium">{rec.riskLevel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-accent mb-0.5">Recommended Action</p>
                                    <p className="text-xs text-muted-foreground">{rec.action}</p>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleAnalyze} className="w-full text-xs h-8">
                            Refresh Analysis
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
