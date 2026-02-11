import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { ProgressRing } from '@/components/ProgressRing';
import { useAppStore } from '@/store/appStore';
import { learningTracks, learnBadges } from '@/data/sampleData';
import {
  BookOpen, ChevronRight, Lock, Flame, Check, Clock,
  Trophy, Zap, Star, GraduationCap, Target,
} from 'lucide-react';

// XP system
const XP_PER_LESSON = 50;
const LEVELS = [
  { level: 1, name: 'Novice', xpRequired: 0 },
  { level: 2, name: 'Learner', xpRequired: 150 },
  { level: 3, name: 'Student', xpRequired: 350 },
  { level: 4, name: 'Scholar', xpRequired: 600 },
  { level: 5, name: 'Expert', xpRequired: 1000 },
  { level: 6, name: 'Master', xpRequired: 1500 },
];

function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l;
    else break;
  }
  const nextLevel = LEVELS.find((l) => l.xpRequired > xp);
  const progressToNext = nextLevel
    ? ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100
    : 100;
  return { ...current, xp, nextLevel, progressToNext };
}

export default function Learn() {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);
  const subscription = useAppStore((s) => s.subscription);

  const completedCount = learnProgress.completedLessons.length;
  const totalLessons = learningTracks.reduce((sum, track) => sum + track.lessons.length, 0);
  const totalXP = completedCount * XP_PER_LESSON;
  const level = getLevel(totalXP);

  // Compute completed tracks
  const completedTracks = learningTracks.filter((track) =>
    track.lessons.every((l) => learnProgress.completedLessons.includes(l.id))
  ).length;

  // Determine earned badges
  const earnedBadgeIds = learnBadges
    .filter((b) => {
      if (b.unlockCondition.type === 'lessons') return completedCount >= b.unlockCondition.count;
      if (b.unlockCondition.type === 'streak') return learnProgress.currentStreak >= b.unlockCondition.count;
      if (b.unlockCondition.type === 'tracks') return completedTracks >= b.unlockCondition.count;
      return false;
    })
    .map((b) => b.id);

  const nextBadge = learnBadges.find((b) => !earnedBadgeIds.includes(b.id));

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* ───── Hero Header ───── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">Learn</h1>
            </div>
            <p className="text-muted-foreground text-xs">
              Build investing mastery, one lesson at a time
            </p>
          </div>
          {learnProgress.currentStreak > 0 && (
            <Badge variant="default" size="sm" className="gap-1">
              <Flame className="w-3 h-3" />
              {learnProgress.currentStreak}d streak
            </Badge>
          )}
        </div>

        {/* ───── Level & XP Card ───── */}
        <Card variant="premium">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <ProgressRing progress={Math.round(level.progressToNext)} size={64} strokeWidth={5} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-apice-gold" />
                  <span className="text-sm font-bold">Level {level.level}</span>
                  <span className="text-xs text-muted-foreground">• {level.name}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className="h-full apice-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${level.progressToNext}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{totalXP} XP</span>
                  <span>{level.nextLevel ? `${level.nextLevel.xpRequired} XP to Level ${level.nextLevel.level}` : 'Max level!'}</span>
                </div>
              </div>
            </div>

            {/* Micro stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{learnProgress.currentStreak}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{earnedBadgeIds.length}</p>
                <p className="text-[10px] text-muted-foreground">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───── Achievement Badges ───── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-apice-gold" />
              <h2 className="font-semibold text-sm">Achievements</h2>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {earnedBadgeIds.length}/{learnBadges.length}
            </span>
          </div>

          {/* Next badge callout */}
          {nextBadge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3"
            >
              <span className="text-2xl">{nextBadge.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Next: {nextBadge.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextBadge.requirement}</p>
              </div>
              <Target className="w-4 h-4 text-primary shrink-0" />
            </motion.div>
          )}

          {/* Badge grid */}
          <div className="grid grid-cols-4 gap-2">
            {learnBadges.map((badge, i) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative p-2.5 rounded-xl text-center transition-all ${
                    isEarned
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-secondary/50 opacity-50'
                  }`}
                >
                  {!isEarned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className={`text-xl ${!isEarned ? 'opacity-20 blur-sm' : ''}`}>
                    {badge.icon}
                  </span>
                  <p className={`text-[9px] font-medium mt-0.5 leading-tight ${!isEarned ? 'opacity-20' : ''}`}>
                    {badge.name}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ───── Learning Tracks ───── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Learning Tracks</h2>
          </div>

          <div className="space-y-4">
            {learningTracks.map((track, i) => {
              const isTrackLocked = track.isLocked && subscription.tier === 'free';
              const completedInTrack = track.lessons.filter((l) =>
                learnProgress.completedLessons.includes(l.id)
              ).length;
              const trackProgress = Math.round((completedInTrack / track.lessons.length) * 100);
              const isTrackComplete = completedInTrack === track.lessons.length;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <LockedOverlay
                    isLocked={isTrackLocked}
                    message="Upgrade to unlock"
                    onUnlock={() => navigate('/upgrade')}
                  >
                    <Card variant={isTrackComplete ? 'gold' : 'interactive'}>
                      <CardContent className="pt-5">
                        {/* Track header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isTrackComplete ? (
                                <Badge variant="low" size="sm" className="gap-1">
                                  <Check className="w-3 h-3" /> Complete
                                </Badge>
                              ) : (
                                <h3 className="font-semibold text-sm">{track.name}</h3>
                              )}
                              {isTrackLocked && (
                                <Badge variant="premium" size="sm">
                                  <Lock className="w-3 h-3 mr-1" /> Pro
                                </Badge>
                              )}
                            </div>
                            {!isTrackComplete && (
                              <p className="text-xs text-muted-foreground">{track.description}</p>
                            )}
                            {isTrackComplete && (
                              <p className="text-sm font-semibold">{track.name}</p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{completedInTrack}/{track.lessons.length} lessons</span>
                            <span>{trackProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${isTrackComplete ? 'apice-gradient-gold' : 'apice-gradient-primary'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${trackProgress}%` }}
                              transition={{ duration: 0.5, delay: i * 0.08 }}
                            />
                          </div>
                        </div>

                        {/* Lesson list */}
                        <div className="space-y-1.5">
                          {track.lessons.slice(0, 4).map((lesson, li) => {
                            const isCompleted = learnProgress.completedLessons.includes(lesson.id);
                            const isLessonLocked = lesson.isLocked && subscription.tier === 'free';
                            const isNextUp =
                              !isCompleted &&
                              !isLessonLocked &&
                              li ===
                                track.lessons.findIndex(
                                  (l) =>
                                    !learnProgress.completedLessons.includes(l.id) &&
                                    !(l.isLocked && subscription.tier === 'free')
                                );

                            return (
                              <button
                                key={lesson.id}
                                onClick={() =>
                                  !isLessonLocked &&
                                  !isTrackLocked &&
                                  navigate(`/learn/${track.id}/${lesson.id}`)
                                }
                                disabled={isLessonLocked || isTrackLocked}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left disabled:opacity-50 ${
                                  isNextUp
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'bg-secondary/50 hover:bg-secondary'
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                    isCompleted
                                      ? 'bg-apice-success text-white'
                                      : isNextUp
                                      ? 'apice-gradient-primary text-white'
                                      : 'bg-secondary text-muted-foreground'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className="w-3 h-3" />
                                  ) : isLessonLocked ? (
                                    <Lock className="w-3 h-3" />
                                  ) : isNextUp ? (
                                    <Zap className="w-3 h-3" />
                                  ) : (
                                    <BookOpen className="w-3 h-3" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{lesson.title}</p>
                                  {isNextUp && (
                                    <p className="text-[10px] text-primary font-medium">Up next</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted && (
                                    <span className="text-[10px] text-apice-success font-medium">+{XP_PER_LESSON} XP</span>
                                  )}
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {lesson.readingTime}m
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                          {track.lessons.length > 4 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-1">
                              +{track.lessons.length - 4} more lessons
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </LockedOverlay>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
