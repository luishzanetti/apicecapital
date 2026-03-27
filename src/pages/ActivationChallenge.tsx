import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    Gift,
    Lock,
    Sparkles,
    Star,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { activationChallenge, bybitGuide } from '@/data/sampleData';

export default function ActivationChallenge() {
    const navigate = useNavigate();
    const missionProgress = useAppStore((s) => s.missionProgress);
    const completeMissionTask = useAppStore((s) => s.completeMissionTask);
    const startActivationChallenge = useAppStore((s) => s.startActivationChallenge);
    const advanceChallengeDay = useAppStore((s) => s.advanceChallengeDay);

    const currentDay = missionProgress.m2_activationChallengeDay;
    const hasStarted = currentDay > 0;
    const [expandedDay, setExpandedDay] = useState<number | null>(hasStarted ? currentDay : null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const [showBybitGuide, setShowBybitGuide] = useState(false);

    const handleStartChallenge = () => {
        startActivationChallenge();
        setExpandedDay(1);
        completeMissionTask('m2_methodologyRead');
    };

    const handleCompleteTask = (taskId: string) => {
        setCompletedTasks((prev) => new Set(prev).add(taskId));

        // Map specific tasks to mission progress
        if (taskId === 'c2-2' || taskId === 'c2-3') {
            completeMissionTask('m2_bybitAccountCreated');
        }
        if (taskId === 'c3-2') {
            completeMissionTask('m2_firstDepositUSDT');
        }
    };

    const handleCompleteDay = (day: number) => {
        if (day >= currentDay) {
            advanceChallengeDay();
        }
        // Move to next day
        const nextDay = day + 1;
        if (nextDay <= 7) {
            setExpandedDay(nextDay);
        }
    };

    const isDayUnlocked = (day: number) => {
        if (!hasStarted) return false;
        return day <= currentDay;
    };

    const isDayCompleted = (day: number) => {
        return day < currentDay;
    };

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* Header */}
            <div
                className="px-6 pt-8 pb-6"
                style={{
                    background: 'linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 100%)',
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">7-Day Challenge</h1>
                        <p className="text-xs text-muted-foreground">Apice Strategies Activation</p>
                    </div>
                    {hasStarted && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold text-primary">
                                Day {Math.min(currentDay, 7)}/7
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress visualization */}
                <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 7 }, (_, i) => {
                        const day = i + 1;
                        const completed = isDayCompleted(day);
                        const active = day === currentDay;
                        return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className={cn(
                                        'w-full h-1.5 rounded-full transition-all',
                                        completed
                                            ? 'bg-green-500'
                                            : active
                                                ? 'bg-primary animate-pulse'
                                                : 'bg-secondary'
                                    )}
                                />
                                <span className={cn(
                                    'text-[9px] font-medium',
                                    completed ? 'text-green-400' : active ? 'text-primary' : 'text-muted-foreground'
                                )}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Start CTA */}
                {!hasStarted && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-primary/20 overflow-hidden">
                            <CardContent className="p-5">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">🚀</div>
                                    <h2 className="text-lg font-bold mb-2">
                                        Ready to Start?
                                    </h2>
                                    <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                                        In 7 days you'll go from account creation to your first purchase.
                                        Each day has practical tasks to execute the Apice methodology.
                                    </p>
                                    <Button
                                        className="rounded-full px-8"
                                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                                        onClick={handleStartChallenge}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Start Challenge
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Day Cards */}
            <div className="px-6 space-y-3">
                {activationChallenge.map((day) => {
                    const unlocked = isDayUnlocked(day.day);
                    const completed = isDayCompleted(day.day);
                    const isActive = day.day === currentDay;
                    const isExpanded = expandedDay === day.day;
                    const allTasksDone = day.tasks.every((t) => completedTasks.has(t.id));

                    return (
                        <motion.div
                            key={day.day}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: unlocked || day.day === 1 ? 1 : 0.5, y: 0 }}
                            transition={{ delay: day.day * 0.05 }}
                        >
                            <Card
                                className={cn(
                                    'overflow-hidden transition-all',
                                    completed
                                        ? 'border-green-500/20'
                                        : isActive
                                            ? 'border-primary/30'
                                            : !unlocked
                                                ? 'border-border/30'
                                                : 'border-border/50'
                                )}
                                style={
                                    isActive
                                        ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(99,102,241,0.03))' }
                                        : undefined
                                }
                            >
                                {/* Day Header */}
                                <button
                                    className="w-full p-4 flex items-center gap-3"
                                    onClick={() => {
                                        if (!unlocked && !completed) return;
                                        setExpandedDay(isExpanded ? null : day.day);
                                    }}
                                    disabled={!unlocked && !completed}
                                >
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                            completed
                                                ? 'bg-green-500/10'
                                                : isActive
                                                    ? 'bg-primary/10'
                                                    : 'bg-secondary'
                                        )}
                                    >
                                        {completed ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : !unlocked ? (
                                            <Lock className="w-4 h-4 text-muted-foreground/40" />
                                        ) : (
                                            <span className="text-lg">{day.icon}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'text-[10px] font-bold uppercase tracking-wider',
                                                    completed ? 'text-green-400' : isActive ? 'text-primary' : 'text-muted-foreground'
                                                )}
                                            >
                                                Day {day.day}
                                            </span>
                                            {isActive && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium animate-pulse">
                                                    TODAY
                                                </span>
                                            )}
                                        </div>
                                        <p className={cn('text-sm font-semibold', !unlocked && 'text-muted-foreground')}>{day.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{day.subtitle}</p>
                                    </div>
                                    {(unlocked || completed) && (
                                        <ChevronRight
                                            className={cn(
                                                'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
                                                isExpanded && 'rotate-90'
                                            )}
                                        />
                                    )}
                                </button>

                                {/* Expanded Tasks */}
                                <AnimatePresence>
                                    {isExpanded && (unlocked || completed) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                                                {day.tasks.map((task, idx) => {
                                                    const taskDone = completedTasks.has(task.id) || completed;

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={cn(
                                                                'p-3 rounded-xl',
                                                                taskDone ? 'bg-green-500/5' : 'bg-secondary/30'
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className={cn(
                                                                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                                                        taskDone ? 'bg-green-500/10' : 'bg-secondary'
                                                                    )}
                                                                >
                                                                    {taskDone ? (
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                                            {idx + 1}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={cn('text-xs font-semibold', taskDone && 'text-muted-foreground line-through')}>
                                                                        {task.title}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                                                                        {task.description}
                                                                    </p>

                                                                    {/* Tip */}
                                                                    {task.tip && !taskDone && (
                                                                        <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                                                            <p className="text-[10px] text-amber-400 flex items-start gap-1.5">
                                                                                <Star className="w-3 h-3 shrink-0 mt-0.5" />
                                                                                {task.tip}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Action button */}
                                                                    {!taskDone && (
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button
                                                                                className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary active:scale-95 transition-all"
                                                                                onClick={() => {
                                                                                    if (task.actionRoute) {
                                                                                        navigate(task.actionRoute);
                                                                                    }
                                                                                    handleCompleteTask(task.id);
                                                                                }}
                                                                            >
                                                                                {task.actionLabel}
                                                                            </button>

                                                                            {/* Special: Bybit link for day 2 tasks */}
                                                                            {(task.id === 'c2-2') && (
                                                                                <button
                                                                                    className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 active:scale-95 transition-all flex items-center gap-1"
                                                                                    onClick={() => setShowBybitGuide(true)}
                                                                                >
                                                                                    <Gift className="w-3 h-3" />
                                                                                    Apice Invite
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Complete Day CTA */}
                                                {isActive && !completed && (
                                                    <div className="text-center pt-2">
                                                        {allTasksDone ? (
                                                            <Button
                                                                className="rounded-full px-6"
                                                                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                                                onClick={() => handleCompleteDay(day.day)}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                Complete Day {day.day}
                                                            </Button>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Complete all tasks to advance
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-amber-400 mt-2">{day.reward}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bybit Guide Modal */}
            <AnimatePresence>
                {showBybitGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
                        onClick={() => setShowBybitGuide(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="w-full max-w-lg bg-card rounded-t-3xl border border-border/50 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                {/* Handle */}
                                <div className="w-10 h-1 rounded-full bg-secondary mx-auto mb-6" />

                                {/* Title */}
                                <div className="text-center mb-6">
                                    <div className="text-4xl mb-2">🏦</div>
                                    <h2 className="text-lg font-bold">
                                        Complete Bybit Guide
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Create your account in 5 simple steps
                                    </p>
                                </div>

                                {/* Benefits */}
                                <div className="mb-6">
                                    <p className="text-xs font-semibold mb-3 text-primary">
                                        Apice Invitation Benefits
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {bybitGuide.benefits.map((b, i) => (
                                            <div
                                                key={i}
                                                className="p-3 rounded-xl bg-primary/5 border border-primary/10"
                                            >
                                                <span className="text-lg">{b.icon}</span>
                                                <p className="text-[11px] font-semibold mt-1">{b.title}</p>
                                                <p className="text-[10px] text-muted-foreground">{b.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-3 mb-6">
                                    {bybitGuide.steps.map((s, i) => (
                                        <div key={s.step} className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-primary">{s.step}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold">{s.title}</p>
                                                <p className="text-[10px] text-muted-foreground">{s.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <Button
                                    className="w-full rounded-full h-12"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                    onClick={() => {
                                        window.open(bybitGuide.referralLink, '_blank');
                                        completeMissionTask('m2_bybitReferralUsed');
                                        setShowBybitGuide(false);
                                    }}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Create Bybit Account
                                </Button>

                                <p className="text-[10px] text-center text-muted-foreground mt-3">
                                    Code: <span className="font-mono font-bold text-primary">{bybitGuide.referralCode}</span> · Bonus automatically applied
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
