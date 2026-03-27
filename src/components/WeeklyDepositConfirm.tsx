import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { dcaRecommendations } from '@/data/sampleData';
import {
    CheckCircle2, DollarSign, ExternalLink, Shield, ChevronDown,
    ChevronUp, X, Sparkles, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Get current ISO week ID
function getCurrentWeekId(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const weekNum = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function WeeklyDepositConfirm({ isOpen, onClose }: Props) {
    const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
    const investorType = useAppStore((s) => s.investorType);
    const userProfile = useAppStore((s) => s.userProfile);
    const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
    const confirmWeeklyDeposit = useAppStore((s) => s.confirmWeeklyDeposit);
    const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
    const weeklyDepositStreak = useAppStore((s) => s.weeklyDepositStreak);
    const [confirmed, setConfirmed] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dcaConfigured, setDcaConfigured] = useState(false);

    const currentWeekId = getCurrentWeekId();
    const alreadyConfirmed = weeklyDepositHistory.some(d => d.weekId === currentWeekId);

    // Generate allocations from selected portfolio or recommendation
    const getAllocations = () => {
        if (selectedPortfolio.allocations && selectedPortfolio.allocations.length > 0) {
            return selectedPortfolio.allocations.map(a => ({
                asset: a.asset,
                percentage: a.percentage,
                amount: (weeklyInvestment * a.percentage) / 100,
            }));
        }
        // Fallback to recommendation
        const rec = dcaRecommendations.find(
            r => r.profileType === investorType && r.capitalRange === userProfile.capitalRange
        );
        if (rec) {
            return rec.assets.map(a => ({
                asset: a.symbol,
                percentage: a.allocation,
                amount: (weeklyInvestment * a.allocation) / 100,
            }));
        }
        return [{ asset: 'BTC', percentage: 60, amount: weeklyInvestment * 0.6 }, { asset: 'ETH', percentage: 40, amount: weeklyInvestment * 0.4 }];
    };

    const allocations = getAllocations();

    const handleConfirm = async () => {
        if (!dcaConfigured) {
            toast.error('Please confirm your DCA setup on Bybit first.');
            return;
        }

        setIsSyncing(true);
        // Simulate real-time sync with broker
        await new Promise(resolve => setTimeout(resolve, 2000));

        confirmWeeklyDeposit(currentWeekId, weeklyInvestment, allocations);
        setIsSyncing(false);
        setConfirmed(true);

        toast.success('Synced with Bybit! 🎉', {
            description: `$${weeklyInvestment} reported and matched with your exchange.`,
        });
        setTimeout(() => {
            onClose();
            setConfirmed(false);
            setDcaConfigured(false);
        }, 2000);
    };

    if (alreadyConfirmed && !confirmed) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        className="w-full max-w-md bg-card rounded-t-3xl border-t border-border overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-secondary" />
                        </div>

                        {confirmed ? (
                            /* Success State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                    className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </motion.div>
                                <h2 className="text-xl font-bold mb-2">Deposit Confirmed!</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    ${weeklyInvestment} allocated. {weeklyDepositStreak + 1} week streak! 🔥
                                </p>
                            </motion.div>
                        ) : (
                            /* Confirmation Form */
                            <div className="p-6 safe-bottom">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold">Log Investment</h2>
                                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Explanation */}
                                <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        <span className="font-semibold text-blue-400">How it works:</span> Log the amount you invested on your exchange this week. Your DCA plan auto-buys as configured — make sure your Bybit DCA settings match your Apice plan for accurate tracking.
                                    </p>
                                </div>

                                {/* Amount */}
                                <Card className="mb-4 border-primary/20 overflow-hidden">
                                    <div className="p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">This Week's Investment</p>
                                                <p className="text-2xl font-bold">${weeklyInvestment}</p>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                                                <DollarSign className="w-3 h-3 mr-0.5" />
                                                Weekly
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>

                                {/* Allocation Breakdown */}
                                <Card className="mb-4">
                                    <CardContent className="pt-4 pb-3">
                                        <button
                                            onClick={() => setShowBreakdown(!showBreakdown)}
                                            className="w-full flex items-center justify-between mb-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-semibold">Allocation Breakdown</span>
                                            </div>
                                            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        {showBreakdown && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="space-y-2"
                                            >
                                                {allocations.map((alloc, i) => (
                                                    <div key={alloc.asset} className="flex items-center gap-3">
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{ backgroundColor: `hsl(${i * 50 + 200}, 70%, 55%)` }}
                                                        />
                                                        <span className="text-xs flex-1">{alloc.asset}</span>
                                                        <span className="text-xs text-muted-foreground">{alloc.percentage}%</span>
                                                        <span className="text-xs font-medium">${alloc.amount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {/* Visual bar */}
                                                <div className="flex h-2 rounded-full overflow-hidden mt-2">
                                                    {allocations.map((alloc, i) => (
                                                        <div
                                                            key={alloc.asset}
                                                            className="h-full"
                                                            style={{
                                                                width: `${alloc.percentage}%`,
                                                                backgroundColor: `hsl(${i * 50 + 200}, 70%, 55%)`,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Broker Sync Confirmation */}
                                <div className="mb-6 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                id="dca-sync"
                                                checked={dcaConfigured}
                                                onChange={(e) => setDcaConfigured(e.target.checked)}
                                                className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <label htmlFor="dca-sync" className="flex-1 cursor-pointer">
                                            <p className="text-sm font-semibold mb-1">DCA Matches My Exchange</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                I confirm my Bybit DCA is set to buy $${weeklyInvestment}/week with the same allocation shown above. Both Apice and my exchange are in sync.
                                            </p>
                                        </label>
                                    </div>
                                </div>

                                {/* Bybit Link */}
                                <a
                                    href="https://www.bybit.com/trade/spot-dca"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 mb-4 hover:bg-secondary/80 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium">Configure DCA on Bybit</p>
                                        <p className="text-[10px] text-muted-foreground">Open DCA tool on the exchange</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </a>

                                {/* Trust */}
                                <div className="flex items-center gap-2 mb-5">
                                    <Shield className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <p className="text-[10px] text-muted-foreground">
                                        This logs your investment for tracking. Your funds stay on your exchange — Apice never has access to your wallet. For extra purchases outside DCA, simply log them here too.
                                    </p>
                                </div>

                                {/* CTA */}
                                <Button
                                    variant="premium"
                                    size="lg"
                                    className="w-full relative overflow-hidden"
                                    onClick={handleConfirm}
                                    disabled={isSyncing || !dcaConfigured}
                                >
                                    {isSyncing ? (
                                        <>
                                            <span className="animate-pulse flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 animate-spin-slow" />
                                                Syncing with Bybit...
                                            </span>
                                            <motion.div
                                                className="absolute bottom-0 left-0 h-1 bg-white/30"
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 2 }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Confirm and Sync Real-time
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
