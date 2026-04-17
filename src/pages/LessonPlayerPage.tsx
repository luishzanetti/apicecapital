import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import { LessonPlayer } from '@/components/academy/LessonPlayer';

const XP_PER_LESSON = 50;

/**
 * LessonPlayerPage — wrapper route /learn/lesson/:lessonId
 *
 * Looks up the lesson by ID across all tracks, renders the premium
 * LessonPlayer, and handles completion → celebration → navigation to
 * the next lesson (or back to /learn if no next lesson exists).
 */
export default function LessonPlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const completeLesson = useAppStore((s) => s.completeLesson);
  const learnProgress = useAppStore((s) => s.learnProgress);

  const [showCelebration, setShowCelebration] = useState(false);

  const { track, lesson, lessonIndex, nextLesson } = useMemo(() => {
    for (const t of learningTracks) {
      const idx = t.lessons.findIndex((l) => l.id === lessonId);
      if (idx >= 0) {
        return {
          track: t,
          lesson: t.lessons[idx],
          lessonIndex: idx,
          nextLesson: t.lessons[idx + 1] ?? null,
        };
      }
    }
    return { track: null, lesson: null, lessonIndex: -1, nextLesson: null };
  }, [lessonId]);

  const isCompleted = !!lessonId && learnProgress.completedLessons.includes(lessonId);

  const handleComplete = useCallback(() => {
    if (!lesson || !track) return;
    if (!isCompleted) {
      completeLesson(lesson.id);
      setShowCelebration(true);
      const isTrackDone = track.lessons.every(
        (l) => l.id === lesson.id || learnProgress.completedLessons.includes(l.id)
      );
      if (isTrackDone) {
        toast.success(`Track complete — ${track.name}`, {
          description: 'Outstanding work. Pick the next world to keep momentum.',
        });
      }
      const timer = setTimeout(() => {
        setShowCelebration(false);
        if (nextLesson) {
          navigate(`/learn/lesson/${nextLesson.id}`);
        } else {
          navigate('/learn');
        }
      }, 1600);
      return () => clearTimeout(timer);
    }
    if (nextLesson) {
      navigate(`/learn/lesson/${nextLesson.id}`);
    } else {
      navigate('/learn');
    }
  }, [lesson, track, isCompleted, completeLesson, nextLesson, navigate, learnProgress]);

  useEffect(() => {
    // Reset celebration if lesson id changes mid-flight
    setShowCelebration(false);
  }, [lessonId]);

  if (!lesson || !track) {
    return <Navigate to="/learn" replace />;
  }

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-lg"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="text-center space-y-3 px-6"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl mb-2"
                aria-hidden="true"
              >
                <Sparkles className="w-16 h-16 text-amber-400 mx-auto" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold">Lesson complete!</h2>
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <span className="text-lg font-bold text-amber-400">+{XP_PER_LESSON} XP</span>
              </div>
              {!nextLesson && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <span className="text-sm font-bold text-amber-400">Track complete</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LessonPlayer
        lesson={lesson}
        track={track}
        lessonIndex={lessonIndex}
        totalLessons={track.lessons.length}
        nextLesson={nextLesson}
        isCompleted={isCompleted}
        onComplete={handleComplete}
      />
    </>
  );
}
