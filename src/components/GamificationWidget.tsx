import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Shield, Crown, Medal, Lock } from 'lucide-react';
import { useAppStore, type MissionProgress } from '@/store/appStore';
import { missionDefinitions } from '@/data/sampleData';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
  const missionProgress = useAppStore((state) => state.missionProgress);
  const subscription = useAppStore((state) => state.subscription);
  const { language } = useTranslation();

  const { totalXP, earnedBadges, currentLevel, xpForNextLevel, progressToNextLevel, nextBadge, xpToNextLevel } = useMemo(() => {
    let xp = 0;
    const badges: { title: string; icon: string; color: string }[] = [];
    let firstUnearned: { title: string; icon: string; xpNeeded: number } | null = null;

    missionDefinitions.forEach((mission) => {
      const completedTasks = mission.tasks.filter(
        (task) => missionProgress[task.storeKey as keyof MissionProgress]
      );
      const missionXP = completedTasks.reduce((sum, task) => sum + task.xp, 0);
      xp += missionXP;

      if (completedTasks.length === mission.tasks.length) {
        badges.push({ title: mission.badge, icon: mission.badgeIcon, color: mission.color });
      } else if (!firstUnearned) {
        const remainingXP = mission.tasks
          .filter((task) => !missionProgress[task.storeKey as keyof MissionProgress])
          .reduce((sum, task) => sum + task.xp, 0);
        firstUnearned = { title: mission.badge, icon: mission.badgeIcon, xpNeeded: remainingXP };
      }
    });

    const levelThresholds = [0, 500, 1200, 2500, 5000];
    let level = 1;

    for (let index = levelThresholds.length - 1; index >= 0; index -= 1) {
      if (xp >= levelThresholds[index]) {
        level = index + 1;
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
      nextBadge: firstUnearned as { title: string; icon: string; xpNeeded: number } | null,
      xpToNextLevel: nextThreshold - xp,
    };
  }, [missionProgress]);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            level: 'Nível',
            progress: 'Progresso',
            achievements: 'Conquistas',
            plan: 'Plano',
            lockedBadges: 'Conclua missões para ganhar conquistas',
            nextLevel: 'para o nível',
            nextBadgeLabel: 'Próximo:',
            xpToGo: 'XP restantes',
            pathToNext: 'XP para o nível',
            keepInvesting: 'Continue investindo para alcançar',
            allBadgesEarned: 'Todas as conquistas desbloqueadas! Você está no top 1%.',
            premiumUpsell: 'Faça upgrade para desbloquear recursos Pro',
            premiumActive: 'Conta premium ativa ✓',
            tierLabels: {
              free: 'Gratuito',
              pro: 'Pro',
              elite: 'Elite ✦',
            },
            levelNames: ['Iniciante', 'Aprendiz', 'Navegador', 'Veterano', 'Mestre'],
          }
        : {
            level: 'Level',
            progress: 'Progress',
            achievements: 'Achievements',
            plan: 'Plan',
            lockedBadges: 'Complete missions to unlock achievements',
            nextLevel: 'to level',
            nextBadgeLabel: 'Next:',
            xpToGo: 'XP to go',
            pathToNext: 'XP to level',
            keepInvesting: 'Keep investing to reach',
            allBadgesEarned: 'All badges earned! You\'re in the top 1%.',
            premiumUpsell: 'Upgrade to unlock Pro features',
            premiumActive: 'Premium account active ✓',
            tierLabels: {
              free: 'Free',
              pro: 'Pro',
              elite: 'Elite ✦',
            },
            levelNames: ['Beginner', 'Apprentice', 'Navigator', 'Veteran', 'Master'],
          },
    [language]
  );

  const levelInfo = [
    { name: copy.levelNames[0], icon: Shield, gradient: 'from-slate-500 to-slate-400', ring: 'ring-slate-500/20' },
    { name: copy.levelNames[1], icon: Star, gradient: 'from-blue-600 to-blue-400', ring: 'ring-blue-500/25' },
    { name: copy.levelNames[2], icon: Zap, gradient: 'from-indigo-600 to-indigo-400', ring: 'ring-indigo-500/25' },
    { name: copy.levelNames[3], icon: Medal, gradient: 'from-purple-600 to-purple-400', ring: 'ring-purple-500/25' },
    { name: copy.levelNames[4], icon: Crown, gradient: 'from-amber-500 to-yellow-400', ring: 'ring-amber-500/30' },
  ];

  const info = levelInfo[currentLevel - 1] || levelInfo[levelInfo.length - 1];
  const LevelIcon = info.icon;

  const tierConfig: Record<string, { label: string; gradient: string; textColor: string; borderColor: string }> = {
    free: {
      label: copy.tierLabels.free,
      gradient: 'from-slate-700/30 to-slate-600/20',
      textColor: 'text-slate-300',
      borderColor: 'border-slate-500/20',
    },
    pro: {
      label: copy.tierLabels.pro,
      gradient: 'from-primary/15 to-primary/5',
      textColor: 'text-primary',
      borderColor: 'border-primary/25',
    },
    elite: {
      label: copy.tierLabels.elite,
      gradient: 'from-amber-500/15 to-amber-400/5',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/25',
    },
  };
  const tier = tierConfig[subscription.tier] || tierConfig.free;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl glass-card p-5 apice-shadow-card">
        <div className="pointer-events-none absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -ml-10 -mb-10 h-28 w-28 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl ring-2',
                  `bg-gradient-to-br ${info.gradient}`,
                  info.ring
                )}
              >
                <LevelIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-none">
                  {copy.level} {currentLevel}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {info.name}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Zap className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-sm font-bold text-primary">{totalXP.toLocaleString()} XP</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {(xpForNextLevel - totalXP).toLocaleString()} {copy.nextLevel} {currentLevel + 1}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(250 84% 60%))' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{copy.progress}</span>
              <span>{progressToNextLevel}%</span>
            </div>
            {currentLevel < 5 && (
              <p className="text-[11px] text-muted-foreground">
                {xpToNextLevel.toLocaleString()} {copy.pathToNext} {currentLevel + 1}
                {' — '}
                {copy.keepInvesting} {levelInfo[currentLevel]?.name || ''}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl glass-card p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Trophy className="h-3 w-3" />
            {copy.achievements}
          </h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.length > 0 ? (
              earnedBadges.map((badge, index) => (
                <div
                  key={index}
                  title={badge.title}
                  className="flex h-12 w-12 cursor-default items-center justify-center rounded-xl glass-light text-2xl shadow-md transition-transform hover:scale-110"
                  style={{ boxShadow: '0 0 12px hsl(var(--primary) / 0.3)' }}
                >
                  {badge.icon}
                </div>
              ))
            ) : (
              <p className="text-[11px] italic leading-relaxed text-muted-foreground/60">{copy.lockedBadges}</p>
            )}
            {Array.from({ length: Math.max(0, 4 - earnedBadges.length) }).map((_, index) => (
              <div
                key={`locked-${index}`}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/30 bg-secondary/20 opacity-30"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
          {earnedBadges.length > 0 && earnedBadges.length >= missionDefinitions.length ? (
            <p className="mt-2 text-[11px] font-semibold text-primary">{copy.allBadgesEarned}</p>
          ) : nextBadge ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {copy.nextBadgeLabel} {nextBadge.icon} {nextBadge.title} — {nextBadge.xpNeeded.toLocaleString()} {copy.xpToGo}
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl glass-card p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Crown className="h-3 w-3" />
            {copy.plan}
          </h4>
          <div className="space-y-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl border bg-gradient-to-r px-3 py-2.5',
                tier.gradient,
                tier.borderColor
              )}
            >
              <span className={cn('text-sm font-bold', tier.textColor)}>{tier.label}</span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {subscription.tier === 'free' ? copy.premiumUpsell : copy.premiumActive}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
