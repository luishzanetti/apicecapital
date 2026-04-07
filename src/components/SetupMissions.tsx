import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronRight, Lock, Zap, Trophy, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type MissionProgress } from '@/store/appStore';
import { missionDefinitions } from '@/data/sampleData';
import { toast } from 'sonner';

export default function SetupMissions() {
    const navigate = useNavigate();
    const missionProgress = useAppStore((s) => s.missionProgress);
    const completeMissionTask = useAppStore((s) => s.completeMissionTask);
    const [expandedMission, setExpandedMission] = useState<number | null>(null);

    // Calculate mission completion
    const getMissionCompletion = (missionId: number) => {
        const mission = missionDefinitions.find((m) => m.id === missionId);
        if (!mission) return { completed: 0, total: 0, percent: 0 };
        const completed = mission.tasks.filter(
            (t) => missionProgress[t.storeKey as keyof MissionProgress]
        ).length;
        return {
            completed,
            total: mission.tasks.length,
            percent: Math.round((completed / mission.tasks.length) * 100),
        };
    };

    // Determine if a mission is unlocked
    const isMissionUnlocked = (missionId: number) => {
        if (missionId === 1) return true;
        // Mission 2 requires both Mission 1 tasks to be complete
        if (missionId === 2) {
            return missionProgress.m1_profileQuizDone && missionProgress.m1_onboardingCompleted;
        }
        // Mission N requires at least 1 task from mission N-1
        const prevMission = missionDefinitions.find((m) => m.id === missionId - 1);
        if (!prevMission) return false;
        return prevMission.tasks.some(
            (t) => missionProgress[t.storeKey as keyof MissionProgress]
        );
    };

    // Find active mission (first incomplete)
    const activeMissionId = useMemo(() => {
        return missionDefinitions.find((m) => {
            const { percent } = getMissionCompletion(m.id);
            return percent < 100;
        })?.id ?? 5;
    }, [missionProgress]);

    // Auto-expand active mission on mount or change
    useEffect(() => {
        if (expandedMission === null) {
            setExpandedMission(activeMissionId);
        }
    }, [activeMissionId, expandedMission]);


    // Total XP earned
    const totalXP = missionDefinitions.reduce((acc, m) => {
        const earned = m.tasks
            .filter((t) => missionProgress[t.storeKey as keyof MissionProgress])
            .reduce((sum, t) => sum + t.xp, 0);
        return acc + earned;
    }, 0);

    const totalPossibleXP = missionDefinitions.reduce((a, m) => a + m.xpTotal, 0);
    const overallPercent = Math.round(
        (missionDefinitions.reduce((a, m) => a + getMissionCompletion(m.id).completed, 0) /
            missionDefinitions.reduce((a, m) => a + m.tasks.length, 0)) *
        100
    );

    return (
        <div className="space-y-3">
            {/* Header with overall progress */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                    >
                        <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Your Apice Journey</p>
                        <p className="text-[11px] text-muted-foreground">
                            {totalXP} / {totalPossibleXP} XP · {overallPercent}% completed
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{totalXP} XP</span>
                </div>
            </div>

            {/* Overall progress bar */}
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
                    animate={{ width: `${overallPercent}%` }}
                    transition={{ duration: 0.6 }}
                />
            </div>

            {/* Mission Cards */}
            {missionDefinitions.map((mission) => {
                const { completed, total, percent } = getMissionCompletion(mission.id);
                const unlocked = isMissionUnlocked(mission.id);
                const isActive = mission.id === activeMissionId;
                const isExpanded = expandedMission === mission.id;
                const isComplete = percent === 100;

                return (
                    <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mission.id * 0.05 }}
                        className={cn(
                            'rounded-2xl border overflow-hidden transition-all',
                            isComplete
                                ? 'border-green-500/20 bg-green-500/5'
                                : isActive && unlocked
                                    ? 'border-primary/30'
                                    : !unlocked
                                        ? 'border-border/30 opacity-60'
                                        : 'border-border/50'
                        )}
                        style={
                            isActive && unlocked && !isComplete
                                ? {
                                    background:
                                        'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))',
                                }
                                : undefined
                        }
                    >
                        {/* Mission Header */}
                        <button
                            className="w-full px-4 py-3 flex items-center gap-3"
                            onClick={() => {
                                if (!unlocked) return;
                                setExpandedMission(isExpanded ? null : mission.id);
                            }}
                            disabled={!unlocked}
                        >
                            {/* Progress Ring */}
                            <div className="relative w-10 h-10 shrink-0">
                                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-secondary"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.5"
                                        fill="none"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeDasharray={`${percent * 0.975} 100`}
                                        className={cn(
                                            isComplete
                                                ? 'stroke-green-500'
                                                : isActive
                                                    ? 'stroke-primary'
                                                    : 'stroke-muted-foreground'
                                        )}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {isComplete ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : !unlocked ? (
                                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                        <span className="text-sm">{mission.icon}</span>
                                    )}
                                </div>
                            </div>

                            {/* Mission Info */}
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold uppercase tracking-wider',
                                            isComplete
                                                ? 'text-green-400'
                                                : isActive
                                                    ? mission.color
                                                    : 'text-muted-foreground'
                                        )}
                                    >
                                        Mission {mission.id}
                                    </span>
                                    {isComplete && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                                                {mission.badgeIcon} {mission.badge}
                                            </span>
                                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold flex items-center gap-1">
                                                <PlayCircle className="w-2.5 h-2.5" />
                                                REVIEW
                                            </span>
                                        </div>
                                    )}
                                    {isActive && !isComplete && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium animate-pulse">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={cn(
                                        'text-sm font-semibold truncate',
                                        !unlocked ? 'text-muted-foreground' : ''
                                    )}
                                >
                                    {mission.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{mission.subtitle}</p>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-muted-foreground">
                                    {completed}/{total}
                                </span>
                                {unlocked &&
                                    (isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    ))}
                            </div>
                        </button>

                        {/* Expanded Task List */}
                        <AnimatePresence>
                            {isExpanded && unlocked && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-3 space-y-2 border-t border-border/30 pt-3">
                                        {mission.tasks.map((task, idx) => {
                                            const isDone =
                                                missionProgress[task.storeKey as keyof MissionProgress];

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={cn(
                                                        'flex items-start gap-3 p-3 rounded-xl transition-all',
                                                        isDone
                                                            ? 'bg-green-500/5'
                                                            : 'bg-secondary/30 hover:bg-secondary/50'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                                            isDone ? 'bg-green-500/10' : 'bg-secondary'
                                                        )}
                                                    >
                                                        {isDone ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground font-medium">
                                                                {idx + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={cn(
                                                                'text-xs font-semibold',
                                                                isDone && 'text-muted-foreground line-through'
                                                            )}
                                                        >
                                                            {task.title}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                        {!isDone && (
                                                            <button
                                                                className={cn(
                                                                    'mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95',
                                                                    `bg-gradient-to-r ${mission.gradient} text-white`
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (task.actionRoute) {
                                                                        navigate(task.actionRoute);
                                                                    } else {
                                                                        completeMissionTask(
                                                                            task.storeKey as keyof MissionProgress
                                                                        );
                                                                        toast.success(`Mission complete! +${task.xp} XP`);
                                                                    }
                                                                }}
                                                            >
                                                                {task.actionLabel}
                                                            </button>
                                                        )}
                                                        {isDone && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Zap className="w-3 h-3 text-amber-400" />
                                                                <span className="text-[11px] text-amber-400 font-medium">
                                                                    +{task.xp} XP
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Mission reward preview */}
                                        {!isComplete && (
                                            <div className="text-center py-2">
                                                <p className="text-[11px] text-muted-foreground">
                                                    Reward: <span className="font-medium">{mission.badgeIcon} {mission.badge}</span> + <span className="text-amber-400 font-medium">{mission.xpTotal} XP</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
