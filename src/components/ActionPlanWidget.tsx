import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { actionPlanSteps } from '@/data/sampleData';
import { CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActionPlanWidget() {
    const navigate = useNavigate();
    const userProfile = useAppStore((s) => s.userProfile);
    const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);
    const weeklyInvestment = useAppStore((s) => s.weeklyInvestment);
    const weeklyDepositHistory = useAppStore((s) => s.weeklyDepositHistory);
    const portfolioAccepted = useAppStore((s) => s.portfolioAccepted);

    const getStepStatus = (status: string): 'done' | 'active' | 'locked' => {
        switch (status) {
            case 'profileSet':
                return userProfile.goal ? 'done' : 'active';
            case 'strategySet':
                if (!userProfile.goal) return 'locked';
                return portfolioAccepted ? 'done' : 'active';
            case 'weeklySet':
                if (!portfolioAccepted) return 'locked';
                return weeklyInvestment > 0 ? 'done' : 'active';
            case 'executed':
                if (weeklyInvestment <= 0) return 'locked';
                return weeklyDepositHistory.length > 0 ? 'done' : 'active';
            case 'optimized':
                return weeklyDepositHistory.length >= 4 ? 'done' : 'locked';
            default:
                return 'locked';
        }
    };

    const getStepAction = (status: string): (() => void) | null => {
        switch (status) {
            case 'profileSet':
                return !userProfile.goal ? () => navigate('/quiz') : null;
            case 'strategySet':
                return !portfolioAccepted ? () => navigate('/portfolio') : null;
            case 'weeklySet':
                return weeklyInvestment <= 0 ? () => navigate('/investment-setup') : null;
            case 'executed':
                return weeklyDepositHistory.length === 0 ? () => navigate('/portfolio') : null;
            default:
                return null;
        }
    };

    const completedSteps = actionPlanSteps.filter((s) => getStepStatus(s.status) === 'done').length;
    const progress = (completedSteps / actionPlanSteps.length) * 100;

    return (
        <Card className="overflow-hidden border-primary/10">
            <div
                className="px-4 py-3"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">AI Action Plan</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                        {completedSteps}/{actionPlanSteps.length}
                    </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Build a diversified portfolio step by step with AI guidance
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
            <CardContent className="pt-3 pb-4">
                <div className="space-y-2">
                    {actionPlanSteps.map((step, i) => {
                        const status = getStepStatus(step.status);
                        const action = getStepAction(step.status);
                        return (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl transition-all',
                                    status === 'active' && 'bg-primary/5 border border-primary/20',
                                    status === 'done' && 'bg-green-500/5',
                                    status === 'locked' && 'opacity-50'
                                )}
                                onClick={action || undefined}
                                style={action ? { cursor: 'pointer' } : undefined}
                            >
                                <div className="shrink-0">
                                    {status === 'done' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div
                                            className={cn(
                                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                                status === 'active' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                                            )}
                                        >
                                            {step.step}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">{step.icon}</span>
                                        <span className={cn('text-xs font-medium', status === 'locked' && 'text-muted-foreground')}>
                                            {step.title}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                        {step.description}
                                    </p>
                                </div>
                                {action && (
                                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
