import { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Shield, Crown, Medal, Lock, Sparkles } from 'lucide-react';
import { useAppStore, type MissionProgress } from '@/store/appStore';
import { missionDefinitions } from '@/data/sampleData';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const PARTICLES = Array.from({ length: 14 }).map((_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    id: i,
    x: Math.cos(angle) * (70 + Math.random() * 30),
    y: Math.sin(angle) * (70 + Math.random() * 30) - 20,
    color: i % 3 === 0 ? '#F5B544' : i % 3 === 1 ? '#6EE7A8' : '#16A661',
    size: 6 + Math.random() * 6,
    delay: Math.random() * 0.15,
  };
});

function LevelUpBurst({ level, name }: { level: number; name: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="absolute h-40 w-40 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(56,214,138,0.55) 0%, rgba(56,214,138,0.15) 40%, transparent 70%)',
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.4, 1.1], opacity: [0, 1, 0] }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.2, 1, 0.6] }}
          transition={{ duration: 1.3, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.div
        className="relative flex flex-col items-center gap-1 rounded-2xl border border-[#16A661]/40 bg-[#0F1626]/90 px-4 py-2 backdrop-blur"
        style={{ boxShadow: '0 0 24px rgba(56,214,138,0.45)' }}
        initial={{ y: 10, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -6, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7A8]">
          <Sparkles className="h-3 w-3" />
          Level up
        </div>
        <div className="text-sm font-bold text-white">Level {level} \u00b7 {name}</div>
      </motion.div>
    </motion.div>
  );
}

export function GamificationWidget() {
  const missionProgress = useAppStore((state) => state.missionProgress);
  const subscription = useAppStore((state) => state.subscription);
  const { language } = useTranslation();
  const [celebrateLevel, setCelebrateLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);

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
    { name: copy.levelNames[0], icon: Shield, gradient: 'from-slate-600/80 to-slate-500/80', ring: 'ring-white/10' },
    { name: copy.levelNames[1], icon: Star, gradient: 'from-sky-600/80 to-sky-400/80', ring: 'ring-white/10' },
    { name: copy.levelNames[2], icon: Zap, gradient: 'from-[#0F5D3F] to-[hsl(var(--apice-emerald))]', ring: 'ring-[hsl(var(--apice-emerald))]/20' },
    { name: copy.levelNames[3], icon: Medal, gradient: 'from-[hsl(var(--apice-emerald))] to-[#6EE7A8]', ring: 'ring-[hsl(var(--apice-emerald))]/30' },
    { name: copy.levelNames[4], icon: Crown, gradient: 'from-[hsl(var(--apice-gold))] to-amber-300', ring: 'ring-[hsl(var(--apice-gold))]/30' },
  ];

  const info = levelInfo[currentLevel - 1] || levelInfo[levelInfo.length - 1];
  const LevelIcon = info.icon;

  useEffect(() => {
    const prev = prevLevelRef.current;
    if (prev !== null && currentLevel > prev) {
      setCelebrateLevel(currentLevel);
      const t = setTimeout(() => setCelebrateLevel(null), 2200);
      return () => clearTimeout(t);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  const tierConfig: Record<string, { label: string; gradient: string; textColor: string; borderColor: string }> = {
    free: {
      label: copy.tierLabels.free,
      gradient: 'from-white/[0.06] to-white/[0.02]',
      textColor: 'text-white/70',
      borderColor: '',
    },
    pro: {
      label: copy.tierLabels.pro,
      gradient: 'from-[hsl(var(--apice-emerald))]/15 to-[hsl(var(--apice-emerald))]/5',
      textColor: 'text-[hsl(var(--apice-emerald))]',
      borderColor: '',
    },
    elite: {
      label: copy.tierLabels.elite,
      gradient: 'from-[hsl(var(--apice-gold))]/15 to-[hsl(var(--apice-gold))]/5',
      textColor: 'text-[hsl(var(--apice-gold))]',
      borderColor: '',
    },
  };
  const tier = tierConfig[subscription.tier] || tierConfig.free;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl glass-card p-5">
        <AnimatePresence>
          {celebrateLevel !== null && (
            <LevelUpBurst key={celebrateLevel} level={celebrateLevel} name={info.name} />
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 rounded-full bg-[hsl(var(--apice-emerald)/0.08)] blur-3xl" />

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
                <h3 className="text-[15px] font-semibold leading-none text-white">
                  {copy.level} {currentLevel}
                </h3>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  {info.name}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Zap className="h-3.5 w-3.5 fill-[hsl(var(--apice-gold))] text-[hsl(var(--apice-gold))]" />
                <span className="text-sm font-mono font-semibold tabular-nums text-[hsl(var(--apice-gold))]">{totalXP.toLocaleString()} XP</span>
              </div>
              <p className="mt-0.5 text-[11px] font-mono tabular-nums text-white/55">
                {(xpForNextLevel - totalXP).toLocaleString()} {copy.nextLevel} {currentLevel + 1}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, hsl(var(--apice-emerald)) 0%, #38D68A 60%, #6EE7A8 100%)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              <span>{copy.progress}</span>
              <span className="font-mono tabular-nums">{progressToNextLevel}%</span>
            </div>
            {currentLevel < 5 && (
              <p className="text-[11px] text-white/55">
                <span className="font-mono tabular-nums">{xpToNextLevel.toLocaleString()}</span> {copy.pathToNext} {currentLevel + 1}
                {' — '}
                {copy.keepInvesting} {levelInfo[currentLevel]?.name || ''}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl glass-card p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
            <Trophy className="h-3 w-3" />
            {copy.achievements}
          </h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.length > 0 ? (
              earnedBadges.map((badge, index) => (
                <div
                  key={index}
                  title={badge.title}
                  className="flex h-12 w-12 cursor-default items-center justify-center rounded-xl bg-[hsl(var(--apice-emerald))]/10 text-2xl transition-transform hover:scale-110"
                >
                  {badge.icon}
                </div>
              ))
            ) : (
              <p className="text-[11px] italic leading-relaxed text-white/45">{copy.lockedBadges}</p>
            )}
            {Array.from({ length: Math.max(0, 4 - earnedBadges.length) }).map((_, index) => (
              <div
                key={`locked-${index}`}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.02] opacity-40"
              >
                <Lock className="h-3.5 w-3.5 text-white/35" />
              </div>
            ))}
          </div>
          {earnedBadges.length > 0 && earnedBadges.length >= missionDefinitions.length ? (
            <p className="mt-2 text-[11px] font-semibold text-[hsl(var(--apice-emerald))]">{copy.allBadgesEarned}</p>
          ) : nextBadge ? (
            <p className="mt-2 text-[11px] text-white/55">
              {copy.nextBadgeLabel} {nextBadge.icon} {nextBadge.title} — <span className="font-mono tabular-nums">{nextBadge.xpNeeded.toLocaleString()}</span> {copy.xpToGo}
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl glass-card p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
            <Crown className="h-3 w-3" />
            {copy.plan}
          </h4>
          <div className="space-y-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl bg-gradient-to-r px-3 py-2.5',
                tier.gradient
              )}
            >
              <span className={cn('text-sm font-semibold', tier.textColor)}>{tier.label}</span>
            </div>
            <p className="text-[11px] leading-snug text-white/55">
              {subscription.tier === 'free' ? copy.premiumUpsell : copy.premiumActive}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
