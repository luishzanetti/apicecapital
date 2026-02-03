import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import { BookOpen, ChevronRight, Lock, Flame, Check, Clock } from 'lucide-react';

export default function Learn() {
  const navigate = useNavigate();
  const unlockState = useAppStore((s) => s.unlockState);
  const learnProgress = useAppStore((s) => s.learnProgress);
  const subscription = useAppStore((s) => s.subscription);

  const completedCount = learnProgress.completedLessons.length;
  const totalLessons = learningTracks.reduce((sum, track) => sum + track.lessons.length, 0);

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">Learn</h1>
            </div>
            <p className="text-muted-foreground text-xs">
              Micro-lessons for smarter investing
            </p>
          </div>
          {learnProgress.currentStreak > 0 && (
            <Badge variant="default" size="sm" className="gap-1">
              <Flame className="w-3 h-3" />
              {learnProgress.currentStreak}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Progress</p>
                <p className="font-semibold text-sm">{completedCount} of {totalLessons} lessons</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Streak</p>
                <p className="font-semibold text-sm text-primary">{learnProgress.currentStreak} days</p>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full apice-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalLessons) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracks */}
        <div className="space-y-4">
          {learningTracks.map((track, i) => {
            const isTrackLocked = track.isLocked && subscription.tier === 'free';
            const completedInTrack = track.lessons.filter(l => 
              learnProgress.completedLessons.includes(l.id)
            ).length;

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <LockedOverlay
                  isLocked={isTrackLocked}
                  message="Upgrade to unlock"
                  onUnlock={() => navigate('/upgrade')}
                >
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{track.name}</h3>
                            {isTrackLocked && (
                              <Badge variant="premium" size="sm">
                                <Lock className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {track.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{track.lessons.length} lessons</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {completedInTrack} done
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>

                      {/* Lessons Preview */}
                      <div className="space-y-2 mt-4">
                        {track.lessons.slice(0, 3).map((lesson) => {
                          const isCompleted = learnProgress.completedLessons.includes(lesson.id);
                          const isLessonLocked = lesson.isLocked && subscription.tier === 'free';

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => !isLessonLocked && !isTrackLocked && navigate(`/learn/${track.id}/${lesson.id}`)}
                              disabled={isLessonLocked || isTrackLocked}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left disabled:opacity-50"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isCompleted 
                                  ? 'bg-apice-success text-white' 
                                  : 'bg-secondary text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-3 h-3" />
                                ) : isLessonLocked ? (
                                  <Lock className="w-3 h-3" />
                                ) : (
                                  <BookOpen className="w-3 h-3" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{lesson.title}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {lesson.readingTime}m
                              </div>
                            </button>
                          );
                        })}
                        {track.lessons.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{track.lessons.length - 3} more lessons
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
      </motion.div>
    </div>
  );
}
