import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Shield, Crown, Medal, Lock } from 'lucide-react';
import { useAppStore, type MissionProgress } from '@/store/appStore';
import { missionDefinitions } from '@/data/sampleData';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
    const missionProgress = useAppStore((s) => s.missionProgress);
    const subscription = useAppStore((s) => s.subscription);

    const { totalXP, earnedBadges, currentLevel, xpForNextLevel, progressToNextLevel } = useMemo(() => {
        let xp = 0;
        const badges: { title: string; icon: string; color: string }[] = [];

        missionDefinitions.forEach((mission) => {
            const completedTasks = mission.tasks.filter(
                (t) => missionProgress[t.storeKey as keyof MissionProgress]
            );
            const missionXP = completedTasks.reduce((sum, t) => sum + t.xp, 0);
            xp += missionXP;
            if (completedTasks.length === mission.tasks.length) {
                badges.push({ title: mission.badge, icon: mission.badgeIcon, color: mission.color });
            }
        });

        const levelThresholds = [0, 500, 1200, 2500, 5000];
        let level = 1;
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (xp >= levelThresholds[i]) { level = i + 1; break; }
        }

        const nextThreshold = levelThresholds[level] || levelThresholds[level - 1] * 2;
        const currentThreshold = levelThresholds[level - 1];
        const xpProgress = xp - currentThreshold;
        const neededForNext = nextThreshold - currentThreshold;
        const percent = Math.min(Math.round((xpProgress / neededForNext) * 100), 100);

        return { totalXP: xp, earnedBadges: badges, currentLevel: level, xpForNextLevel: nextThreshold, progressToNextLevel: percent };
    }, [missionProgress]);

    const levelInfo = [
        { name: 'Novice', icon: Shield, gradient: 'from-slate-500 to-slate-400', ring: 'ring-slate-500/20' },
        { name: 'Apprentice', icon: Star, gradient: 'from-blue-600 to-blue-400', ring: 'ring-blue-500/25' },
        { name: 'Navigator', icon: Zap, gradient: 'from-indigo-600 to-indigo-400', ring: 'ring-indigo-500/25' },
        { name: 'Veteran', icon: Medal, gradient: 'from-purple-600 to-purple-400', ring: 'ring-purple-500/25' },
        { name: 'Master', icon: Crown, gradient: 'from-amber-500 to-yellow-400', ring: 'ring-amber-500/30' },
    ];

    const info = levelInfo[currentLevel - 1] || levelInfo[levelInfo.length - 1];
    const LevelIcon = info.icon;

    const tierConfig: Record<string, { label: string; gradient: string; textColor: string; borderColor: string }> = {
        free: { label: 'Free', gradient: 'from-slate-700/30 to-slate-600/20', textColor: 'text-slate-300', borderColor: 'border-slate-500/20' },
        pro: { label: 'Pro', gradient: 'from-primary/15 to-primary/5', textColor: 'text-primary', borderColor: 'border-primary/25' },
        elite: { label: 'Elite ✦', gradient: 'from-amber-500/15 to-amber-400/5', textColor: 'text-amber-400', borderColor: 'border-amber-500/25' },
    };
    const tier = tierConfig[subscription.tier] || tierConfig.free;

    return (
        <div className="space-y-3">
            {/* Level & XP Card */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border/40 p-5 apice-shadow-card">
                {/* Subtle bg orbs */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-28 h-28 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    {/* Level row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {/* Icon with gradient ring */}
                            <div className={cn(
                                'w-12 h-12 rounded-2xl flex items-center justify-center ring-2',
                                `bg-gradient-to-br ${info.gradient}`,
                                info.ring
                            )}>
                                <LevelIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold leading-none">Level {currentLevel}</h3>
                                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">
                                    {info.name}
                                </p>
                            </div>
                        </div>

                        {/* XP display */}
                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                                <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="text-sm font-bold text-primary">{totalXP.toLocaleString()} XP</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {(xpForNextLevel - totalXP).toLocaleString()} to Lv {currentLevel + 1}
                            </p>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="space-y-1.5">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(250 84% 60%))',
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNextLevel}%` }}
                                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">
                            <span>Progress</span>
                            <span>{progressToNextLevel}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges + Membership */}
            <div className="grid grid-cols-2 gap-3">
                {/* Badges */}
                <div className="rounded-3xl bg-card border border-border/40 p-4">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Trophy className="w-3 h-3" />
                        Badges
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {earnedBadges.length > 0
                            ? earnedBadges.map((badge, i) => (
                                <div
                                    key={i}
                                    title={badge.title}
                                    className="w-10 h-10 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform cursor-default"
                                >
                                    {badge.icon}
                                </div>
                            ))
                            : <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">Complete missions to earn badges</p>
                        }
                        {/* Locked slots */}
                        {Array.from({ length: Math.max(0, 4 - earnedBadges.length) }).map((_, i) => (
                            <div
                                key={`locked-${i}`}
                                className="w-10 h-10 rounded-xl bg-secondary/20 border border-dashed border-border/30 flex items-center justify-center opacity-30"
                            >
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Membership */}
                <div className="rounded-3xl bg-card border border-border/40 p-4">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Crown className="w-3 h-3" />
                        Plan
                    </h4>
                    <div className="space-y-2">
                        <div className={cn(
                            'px-3 py-2.5 rounded-xl border bg-gradient-to-r flex items-center gap-2',
                            tier.gradient, tier.borderColor
                        )}>
                            <span className={cn('text-sm font-bold', tier.textColor)}>{tier.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            {subscription.tier === 'free'
                                ? 'Upgrade to unlock Pro features'
                                : 'Premium account active ✓'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
