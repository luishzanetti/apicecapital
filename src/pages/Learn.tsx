import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore } from '@/store/appStore';
import { learningTracks, learnBadges } from '@/data/sampleData';
import {
  BookOpen, ChevronRight, Lock, Flame, Check, Clock,
  Trophy, Zap, Star, GraduationCap, Target, Brain,
  Sparkles, PlayCircle, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const XP_PER_LESSON = 50;
const LEVEL_KEYS = [
  { level: 1, key: 'learn.levels.beginner', xpRequired: 0 },
  { level: 2, key: 'learn.levels.apprentice', xpRequired: 150 },
  { level: 3, key: 'learn.levels.student', xpRequired: 350 },
  { level: 4, key: 'learn.levels.specialist', xpRequired: 600 },
  { level: 5, key: 'learn.levels.expert', xpRequired: 1000 },
  { level: 6, key: 'learn.levels.master', xpRequired: 1500 },
];

function getLevel(xp: number) {
  let current = LEVEL_KEYS[0];
  for (const l of LEVEL_KEYS) {
    if (xp >= l.xpRequired) current = l;
    else break;
  }
  const nextLevel = LEVEL_KEYS.find((l) => l.xpRequired > xp);
  const progressToNext = nextLevel
    ? ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100
    : 100;
  return { ...current, xp, nextLevel, progressToNext };
}

type TrackTier = 'free' | 'pro' | 'club';

function getTrackTier(track: typeof learningTracks[number], index: number): TrackTier {
  // Use requiredTier from data if available, else fall back to index-based logic
  if (track.requiredTier && track.requiredTier !== 'free') return track.requiredTier;
  if (index <= 1) return 'free';
  if (index <= 3) return 'pro';
  return 'club';
}

function isTrackAccessible(tier: TrackTier, userTier: 'free' | 'pro' | 'club'): boolean {
  if (tier === 'free') return true;
  if (tier === 'pro') return userTier === 'pro' || userTier === 'club';
  if (tier === 'club') return userTier === 'club';
  return false;
}

const tierBadgeConfig: Record<TrackTier, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  pro: { label: 'Pro', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  club: { label: 'Club', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
};

const SUGGESTED_PATHS: Record<string, { label: string; trackIds: string[] }> = {
  'Conservative Builder': {
    label: 'Conservative Builder',
    trackIds: ['foundations', 'dca-mastery', 'bybit-mastery'],
  },
  'Balanced Optimizer': {
    label: 'Balanced Optimizer',
    trackIds: ['foundations', 'dca-mastery', 'portfolio-mastery'],
  },
  'Growth Seeker': {
    label: 'Growth Seeker',
    trackIds: ['foundations', 'portfolio-mastery', 'automation'],
  },
};

export default function Learn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);
  const subscription = useAppStore((s) => s.subscription);
  const investorType = useAppStore((s) => s.investorType);

  // Auto-expand first uncompleted track on first visit
  const firstUncompletedTrackId = useMemo(() => {
    for (const track of learningTracks) {
      const tier = getTrackTier(track, learningTracks.indexOf(track));
      if (!isTrackAccessible(tier, subscription.tier)) continue;
      const allDone = track.lessons.every((l) =>
        learnProgress.completedLessons.includes(l.id)
      );
      if (!allDone) return track.id;
    }
    return null;
  }, [learnProgress, subscription]);

  const [expandedTrack, setExpandedTrack] = useState<string | null>(firstUncompletedTrackId);

  const completedCount = learnProgress.completedLessons.length;
  const totalLessons = learningTracks.reduce((sum, track) => sum + track.lessons.length, 0);
  const totalXP = completedCount * XP_PER_LESSON;
  const level = getLevel(totalXP);

  const completedTracks = learningTracks.filter((track) =>
    track.lessons.every((l) => learnProgress.completedLessons.includes(l.id))
  ).length;

  const earnedBadgeIds = learnBadges
    .filter((b) => {
      if (b.unlockCondition.type === 'lessons') return completedCount >= b.unlockCondition.count;
      if (b.unlockCondition.type === 'streak') return learnProgress.currentStreak >= b.unlockCondition.count;
      if (b.unlockCondition.type === 'tracks') return completedTracks >= b.unlockCondition.count;
      return false;
    })
    .map((b) => b.id);

  const nextBadge = learnBadges.find((b) => !earnedBadgeIds.includes(b.id));

  // Find next lesson to do
  const nextLessonUp = useMemo(() => {
    for (let i = 0; i < learningTracks.length; i++) {
      const track = learningTracks[i];
      const tier = getTrackTier(track, i);
      if (!isTrackAccessible(tier, subscription.tier)) continue;
      for (const lesson of track.lessons) {
        if (!learnProgress.completedLessons.includes(lesson.id) &&
          !(lesson.isLocked && subscription.tier === 'free')) {
          return { track, lesson };
        }
      }
    }
    return null;
  }, [learnProgress, subscription]);

  // Suggested path based on investor type
  const suggestedPath = investorType ? SUGGESTED_PATHS[investorType] : null;
  const suggestedTracks = suggestedPath
    ? suggestedPath.trackIds
        .map((id) => learningTracks.find((t) => t.id === id))
        .filter(Boolean) as typeof learningTracks
    : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Header */}
      <div
        className="px-5 pt-7 pb-5 space-y-4"
        style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">{t('learn.title')}</h1>
            </div>
            <p className="text-muted-foreground text-xs">
              {t('learn.subtitle')}
            </p>
          </div>
          {learnProgress.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{learnProgress.currentStreak}d</span>
            </div>
          )}
        </div>

        {/* Level & XP Card */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 p-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="flex items-center gap-4">
            <ProgressRing progress={Math.round(level.progressToNext)} size={60} strokeWidth={5} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold">{t('learn.level')} {level.level}</span>
                <span className="text-xs text-muted-foreground">· {t(level.key)}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className="h-full apice-gradient-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progressToNext}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />{totalXP} XP</span>
                <span>{level.nextLevel ? t('learn.xpToLevel', { xp: level.nextLevel.xpRequired - totalXP, level: level.nextLevel.level }) : `🏆 ${t('learn.maxLevel')}`}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
            {[
              { label: t('learn.lessons'), value: completedCount, icon: BookOpen },
              { label: t('learn.dayStreak'), value: learnProgress.currentStreak, icon: Flame },
              { label: t('learn.badges'), value: earnedBadgeIds.length, icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Continue Learning CTA */}
        {nextLessonUp && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => navigate(`/learn/${nextLessonUp.track.id}/${nextLessonUp.lesson.id}`)}
              className="w-full relative overflow-hidden rounded-2xl p-4 text-left"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              <div className="absolute inset-0 bg-white/5" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-0.5">{t('learn.continueLearning')}</p>
                  <p className="text-sm font-bold text-white truncate">{nextLessonUp.lesson.title}</p>
                  <p className="text-[11px] text-white/70">{nextLessonUp.track.name} · +{XP_PER_LESSON} XP</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Suggested Path */}
        {suggestedPath && suggestedTracks && suggestedTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold">Recommended for {suggestedPath.label}:</p>
            </div>
            <div className="space-y-2">
              {suggestedTracks.map((track, i) => {
                const completedInTrack = track.lessons.filter((l) =>
                  learnProgress.completedLessons.includes(l.id)
                ).length;
                const isDone = completedInTrack === track.lessons.length;
                return (
                  <button
                    key={track.id}
                    onClick={() => setExpandedTrack(track.id)}
                    className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-primary/5 transition-colors"
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isDone ? 'bg-green-500 text-white' : 'bg-primary/15 text-primary'
                    )}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{track.name}</p>
                      <p className="text-[11px] text-muted-foreground">{completedInTrack}/{track.lessons.length} lessons</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Academy Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/40 bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Academy Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-base font-bold">{completedCount}<span className="text-xs text-muted-foreground font-normal">/{totalLessons}</span></p>
              <p className="text-[11px] text-muted-foreground">Lessons</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-base font-bold">{totalXP}</p>
              <p className="text-[11px] text-muted-foreground">XP Earned</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/40">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-base font-bold">{earnedBadgeIds.length}<span className="text-xs text-muted-foreground font-normal">/{learnBadges.length}</span></p>
              <p className="text-[11px] text-muted-foreground">Badges</p>
            </div>
          </div>
          {totalLessons > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>Overall completion</span>
                <span>{Math.round((completedCount / totalLessons) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full apice-gradient-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / totalLessons) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-sm">{t('learn.achievements')}</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{earnedBadgeIds.length}/{learnBadges.length}</span>
          </div>

          {/* Next badge callout */}
          {nextBadge && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3"
            >
              <span className="text-2xl">{nextBadge.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{t('learn.nextBadge', { name: nextBadge.name })}</p>
                <p className="text-[11px] text-muted-foreground">{nextBadge.requirement}</p>
              </div>
              <Target className="w-4 h-4 text-primary shrink-0" />
            </motion.div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {learnBadges.map((badge, i) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'relative p-2.5 rounded-xl text-center transition-all',
                    isEarned ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 opacity-40'
                  )}
                >
                  {!isEarned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className={cn('text-xl', !isEarned && 'opacity-10')}>{badge.icon}</span>
                  <p className={cn('text-[11px] font-medium mt-0.5 leading-tight', !isEarned && 'opacity-10')}>{badge.name}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Learning Tracks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">{t('learn.learningTracks')}</h2>
          </div>

          <div className="space-y-3">
            {learningTracks.map((track, i) => {
              const tier = getTrackTier(track, i);
              const accessible = isTrackAccessible(tier, subscription.tier);
              const isGated = !accessible;
              const badgeCfg = tierBadgeConfig[tier];
              const completedInTrack = track.lessons.filter((l) =>
                learnProgress.completedLessons.includes(l.id)
              ).length;
              const trackProgress = Math.round((completedInTrack / track.lessons.length) * 100);
              const isTrackComplete = completedInTrack === track.lessons.length;
              const isExpanded = expandedTrack === track.id;
              const upgradeTier = tier === 'club' ? 'Club' : 'Pro';

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn(isGated && 'opacity-60')}
                >
                  <div className={cn(
                    'rounded-2xl border overflow-hidden transition-all',
                    isGated ? 'border-border/30 bg-card' :
                      isTrackComplete ? 'border-amber-500/20 bg-amber-500/5' :
                        isExpanded ? 'border-primary/30 bg-primary/3' : 'border-border/50 bg-card'
                  )}>
                    {/* Track Header */}
                    <button
                      className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                      onClick={() => !isGated && setExpandedTrack(isExpanded ? null : track.id)}
                      disabled={isGated}
                    >
                      <div className="relative w-10 h-10 shrink-0">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2" className="stroke-secondary" />
                          <circle
                            cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={`${trackProgress * 0.975} 100`}
                            className={isTrackComplete ? 'stroke-amber-400' : isGated ? 'stroke-muted-foreground/30' : 'stroke-primary'}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isGated ? (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          ) : isTrackComplete ? (
                            <Crown className="w-4 h-4 text-amber-400" />
                          ) : (
                            <span className="text-base">{track.icon || '📚'}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold truncate">{track.name}</p>
                          {/* Tier badge - always show */}
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0',
                            badgeCfg.className
                          )}>
                            {badgeCfg.label}
                          </span>
                          {isTrackComplete && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium shrink-0">{t('learn.trackComplete')}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{track.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className={cn('h-full rounded-full', isTrackComplete ? 'bg-amber-400' : isGated ? 'bg-muted-foreground/20' : 'apice-gradient-primary')}
                              animate={{ width: `${trackProgress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{completedInTrack}/{track.lessons.length}</span>
                        </div>
                      </div>

                      <ChevronRight className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isExpanded && 'rotate-90')} />
                    </button>

                    {/* Upgrade CTA for gated tracks */}
                    {isGated && (
                      <div className="px-4 pb-4">
                        <Button
                          variant="premium"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate('/upgrade')}
                        >
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          Upgrade to {upgradeTier}
                        </Button>
                      </div>
                    )}

                    {/* Lesson List */}
                    <AnimatePresence>
                      {isExpanded && !isGated && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-1.5 border-t border-border/30 pt-3">
                            {track.lessons.map((lesson, li) => {
                              const isCompleted = learnProgress.completedLessons.includes(lesson.id);
                              const isLessonLocked = lesson.isLocked && subscription.tier === 'free';
                              const isNextUp =
                                !isCompleted && !isLessonLocked &&
                                li === track.lessons.findIndex((l) =>
                                  !learnProgress.completedLessons.includes(l.id) &&
                                  !(l.isLocked && subscription.tier === 'free')
                                );
                              const hasQuiz = lesson.quiz && lesson.quiz.length > 0;
                              const hasChallenge = !!lesson.challenge;

                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => !isLessonLocked && navigate(`/learn/${track.id}/${lesson.id}`)}
                                  disabled={isLessonLocked}
                                  className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left disabled:opacity-50',
                                    isNextUp ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/40 hover:bg-secondary/70'
                                  )}
                                >
                                  <div className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                                    isCompleted ? 'bg-green-500 text-white' :
                                      isNextUp ? 'apice-gradient-primary text-white' :
                                        'bg-secondary text-muted-foreground'
                                  )}>
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> :
                                      isLessonLocked ? <Lock className="w-3 h-3" /> :
                                        isNextUp ? <Zap className="w-3.5 h-3.5" /> :
                                          <BookOpen className="w-3 h-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{lesson.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {isNextUp && <span className="text-[11px] text-primary font-semibold">&#9654; {t('learn.upNext')}</span>}
                                      {hasQuiz && !isNextUp && <span className="text-[11px] text-primary/70 flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" />{t('learn.quiz')}</span>}
                                      {hasChallenge && !isNextUp && <span className="text-[11px] text-amber-400/70 flex items-center gap-0.5"><Target className="w-2.5 h-2.5" />{t('learn.challenge')}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isCompleted && <span className="text-[11px] text-green-400 font-medium">+{XP_PER_LESSON}</span>}
                                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                      <Clock className="w-2.5 h-2.5" />{lesson.readingTime}m
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Daily challenge reminder */}
        {learnProgress.currentStreak === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-orange-500/8 border border-orange-500/20"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm font-bold">{t('learn.startStreak')}</p>
                <p className="text-xs text-muted-foreground">{t('learn.streakMessage')}</p>
              </div>
            </div>
            {nextLessonUp && (
              <Button
                variant="premium"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate(`/learn/${nextLessonUp.track.id}/${nextLessonUp.lesson.id}`)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {t('learn.startFirstLesson')}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
