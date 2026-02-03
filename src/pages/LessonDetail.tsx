import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import { ArrowLeft, Check, Clock, ArrowRight, BookOpen } from 'lucide-react';

export default function LessonDetail() {
  const { trackId, lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useAppStore((s) => s.completeLesson);
  const learnProgress = useAppStore((s) => s.learnProgress);

  const track = learningTracks.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.id === lessonId);
  const lessonIndex = track?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const nextLesson = track?.lessons[lessonIndex + 1];

  const isCompleted = learnProgress.completedLessons.includes(lessonId || '');

  if (!track || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Lesson not found</p>
      </div>
    );
  }

  const handleComplete = () => {
    completeLesson(lesson.id);
    if (nextLesson) {
      navigate(`/learn/${trackId}/${nextLesson.id}`);
    } else {
      navigate('/learn');
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <p className="text-xs text-muted-foreground">{track.name}</p>
            <h1 className="text-lg font-bold">{lesson.title}</h1>
          </div>
          {isCompleted && (
            <Badge variant="low" size="sm" className="gap-1">
              <Check className="w-3 h-3" />
              Done
            </Badge>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 pb-32"
      >
        {/* Reading Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{lesson.readingTime} min read</span>
        </div>

        {/* Key Points */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-4">Key Points</h3>
            <div className="space-y-3">
              {lesson.summary.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{point}</p>
                </div>
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
            <p className="text-sm text-muted-foreground">
              {lesson.doThisNow}
            </p>
          </CardContent>
        </Card>

        {/* Next Lesson Preview */}
        {nextLesson && (
          <Card className="cursor-pointer hover:border-primary/20 transition-colors" onClick={handleComplete}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next Lesson</p>
                  <p className="font-medium text-sm">{nextLesson.title}</p>
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
          {isCompleted ? 'Review Complete' : nextLesson ? 'Complete & Next' : 'Complete Lesson'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
