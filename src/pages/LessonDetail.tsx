import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import { ArrowLeft, Check, Clock, ArrowRight, BookOpen, Zap, Star, Trophy } from 'lucide-react';

const XP_PER_LESSON = 50;

export default function LessonDetail() {
  const { trackId, lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useAppStore((s) => s.completeLesson);
  const learnProgress = useAppStore((s) => s.learnProgress);
  const [showCelebration, setShowCelebration] = useState(false);

  const track = learningTracks.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.id === lessonId);
  const lessonIndex = track?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const nextLesson = track?.lessons[lessonIndex + 1];

  const isCompleted = learnProgress.completedLessons.includes(lessonId || '');
  const lessonNumber = lessonIndex + 1;
  const totalInTrack = track?.lessons.length ?? 0;

  if (!track || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Lesson not found</p>
      </div>
    );
  }

  const handleComplete = () => {
    if (!isCompleted) {
      completeLesson(lesson.id);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        if (nextLesson) {
          navigate(`/learn/${trackId}/${nextLesson.id}`);
        } else {
          navigate('/learn');
        }
      }, 1800);
    } else {
      if (nextLesson) {
        navigate(`/learn/${trackId}/${nextLesson.id}`);
      } else {
        navigate('/learn');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-xl font-bold mb-2">Lesson Complete!</h2>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-apice-gold" />
                <span className="text-lg font-bold text-apice-gold">+{XP_PER_LESSON} XP</span>
              </div>
              {!nextLesson && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Track Complete!</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 py-6 safe-top border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/learn')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{track.name} • {lessonNumber}/{totalInTrack}</p>
            <h1 className="text-lg font-bold">{lesson.title}</h1>
          </div>
          {isCompleted && (
            <Badge variant="low" size="sm" className="gap-1">
              <Check className="w-3 h-3" /> Done
            </Badge>
          )}
        </div>

        {/* Track progress bar */}
        <div className="mt-3">
          <div className="flex gap-1">
            {track.lessons.map((l, i) => (
              <div
                key={l.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  learnProgress.completedLessons.includes(l.id)
                    ? 'apice-gradient-primary'
                    : i === lessonIndex
                    ? 'bg-primary/30'
                    : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-5 pb-32"
      >
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {lesson.readingTime} min read
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-apice-gold" /> +{XP_PER_LESSON} XP
          </span>
        </div>

        {/* Key Points */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Key Takeaways
            </h3>
            <div className="space-y-3">
              {lesson.summary.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{point}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Lesson
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lesson.content}
            </p>
          </CardContent>
        </Card>

        {/* Do This Now */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-3">✨ Do This Now</h3>
            <p className="text-sm text-muted-foreground">{lesson.doThisNow}</p>
          </CardContent>
        </Card>

        {/* Next Lesson Preview */}
        {nextLesson && (
          <Card variant="interactive" onClick={handleComplete}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Next Lesson</p>
                  <p className="font-medium text-sm">{nextLesson.title}</p>
                  <p className="text-[10px] text-primary mt-0.5">+{XP_PER_LESSON} XP</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border safe-bottom">
        <Button
          variant={isCompleted ? 'secondary' : 'premium'}
          size="lg"
          className="w-full"
          onClick={handleComplete}
        >
          {isCompleted ? (
            <>Review Complete</>
          ) : (
            <>
              Complete & Earn {XP_PER_LESSON} XP
              <Zap className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
