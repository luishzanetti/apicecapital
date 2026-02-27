import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Shield, Crown, Medal } from 'lucide-react';
import { useAppStore, type MissionProgress } from '@/store/appStore';
import { missionDefinitions } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export function GamificationWidget() {
    const missionProgress = useAppStore((s) => s.missionProgress);
    const subscription = useAppStore((s) => s.subscription);

    // Calculate XP and levels
    const { totalXP, earnedBadges, currentLevel, xpForNextLevel, progressToNextLevel } = useMemo(() => {
        let xp = 0;
        const badges: { title: string; icon: string; color: string }[] = [];

        missionDefinitions.forEach((mission) => {
            const completedTasks = mission.tasks.filter(
                (t) => missionProgress[t.storeKey as keyof MissionProgress]
            );

            const missionXP = completedTasks.reduce((sum, t) => sum + t.xp, 0);
            xp += missionXP;

            // If mission is 100% complete, add the mission badge
            if (completedTasks.length === mission.tasks.length) {
                badges.push({
                    title: mission.badge,
                    icon: mission.badgeIcon,
                    color: mission.color,
                });
            }
        });

        // Level calculation (linear for simplicity, can be changed later)
        // Level 1: 0, Level 2: 500, Level 3: 1200, Level 4: 2500, Level 5: 5000
        const levelThresholds = [0, 500, 1200, 2500, 5000];
        let level = 1;
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (xp >= levelThresholds[i]) {
                level = i + 1;
                break;
            }
        }

        const nextThreshold = levelThresholds[level] || levelThresholds[level - 1] * 2;
        const currentThreshold = levelThresholds[level - 1];
        const xpProgress = xp - currentThreshold;
        const neededForNext = nextThreshold - currentThreshold;
        const percent = Math.min(Math.round((xpProgress / neededForNext) * 100), 100);

        return {
            totalXP: xp,
            earnedBadges: badges,
            currentLevel: level,
            xpForNextLevel: nextThreshold,
            progressToNextLevel: percent,
        };
    }, [missionProgress]);

    const levelInfo = [
        { name: 'Novice', icon: Shield, color: 'text-slate-400' },
        { name: 'Apprentice', icon: Star, color: 'text-blue-400' },
        { name: 'Navigator', icon: Zap, color: 'text-indigo-400' },
        { name: 'Veteran', icon: Medal, color: 'text-purple-400' },
        { name: 'Master', icon: Crown, color: 'text-amber-400' },
    ];

    const currentLevelInfo = levelInfo[currentLevel - 1] || levelInfo[levelInfo.length - 1];

    return (
        <div className="space-y-4">
            {/* Experience and Level Card */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 shadow-sm">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                "bg-secondary/50 backdrop-blur-sm border border-white/5"
                            )}>
                                <currentLevelInfo.icon className={cn("w-6 h-6", currentLevelInfo.color)} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-none mb-1">Level {currentLevel}</h3>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    {currentLevelInfo.name}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end text-primary font-bold">
                                <Zap className="w-4 h-4 fill-primary" />
                                <span>{totalXP} XP</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {xpForNextLevel - totalXP} XP until Level {currentLevel + 1}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Progress value={progressToNextLevel} className="h-2 bg-secondary" />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>PROGRESS</span>
                            <span>{progressToNextLevel}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-card border border-border/40 p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Trophy className="w-3 h-3" />
                        Badges
                    </h4>

                    <div className="flex flex-wrap gap-2">
                        {earnedBadges.length > 0 ? (
                            earnedBadges.map((badge, i) => (
                                <div
                                    key={i}
                                    title={badge.title}
                                    className="w-10 h-10 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-center text-xl shadow-sm"
                                >
                                    {badge.icon}
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground italic py-2">
                                Complete missions to earn badges
                            </p>
                        )}

                        {/* Locked Badge Placeholders */}
                        {Array.from({ length: Math.max(0, 4 - earnedBadges.length) }).map((_, i) => (
                            <div key={`locked-${i}`} className="w-10 h-10 rounded-xl bg-secondary/20 border border-dashed border-border/40 flex items-center justify-center opacity-40 grayscale">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl bg-card border border-border/40 p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Crown className="w-3 h-3" />
                        Membership
                    </h4>

                    <div className="space-y-2">
                        <div className={cn(
                            "px-3 py-2 rounded-xl border flex items-center gap-2",
                            subscription.tier === 'free'
                                ? "bg-slate-500/5 border-slate-500/20 text-slate-400"
                                : subscription.tier === 'pro'
                                    ? "bg-primary/5 border-primary/20 text-primary"
                                    : "bg-amber-500/5 border-amber-500/20 text-amber-500"
                        )}>
                            <span className="text-sm font-bold capitalize">{subscription.tier}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {subscription.tier === 'free' ? 'Upgrade to unlock Pro features' : 'Premium account active'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
