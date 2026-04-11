import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { learningTracks } from '@/data/sampleData';
import type { ContentBlock, QuizQuestion, LessonChallenge } from '@/data/sampleData';
import {
  ArrowLeft, Check, Clock, ArrowRight, BookOpen, Zap, Star,
  Trophy, Brain, Target, ChevronRight, Quote, TrendingUp,
  Lightbulb, CheckCircle2, XCircle, ListChecks, Scroll
} from 'lucide-react';
import { cn } from '@/lib/utils';

const XP_PER_LESSON = 50;
const XP_PER_QUIZ = 30;

// ─── Content Block Renderer ────────────────────────────────────────────────
function ContentBlockView({ block }: { block: ContentBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p className="text-[15px] text-foreground/80 leading-[1.75] tracking-[-0.01em]">
        {block.content}
      </p>
    );
  }
  if (block.type === 'highlight') {
    return (
      <div className="flex gap-3.5 p-4 rounded-2xl bg-primary/8 border border-primary/20 shadow-sm shadow-primary/5">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">Key Concept</p>
          <p className="text-[15px] font-medium text-foreground leading-[1.65]">{block.content}</p>
        </div>
      </div>
    );
  }
  if (block.type === 'stat') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
        <div className="text-center min-w-[80px]">
          <p className="text-2xl font-bold text-primary">{block.value}</p>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-tight mt-0.5">{block.label}</p>
        </div>
        <div className="w-px h-10 bg-border/50" />
        <p className="text-xs text-muted-foreground leading-relaxed">{block.content}</p>
      </div>
    );
  }
  if (block.type === 'quote') {
    return (
      <div className="pl-4 border-l-2 border-primary/40 space-y-1.5 py-1">
        <div className="flex items-start gap-2">
          <Quote className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
          <p className="text-[15px] italic text-foreground/80 leading-[1.7]">"{block.content}"</p>
        </div>
        {block.author && (
          <p className="text-xs text-muted-foreground pl-6">
            — {block.author}{block.role && <span className="opacity-70">, {block.role}</span>}
          </p>
        )}
      </div>
    );
  }
  return null;
}

// ─── Interactive Quiz ──────────────────────────────────────────────────────
function QuizSection({
  questions,
  onComplete,
}: {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q.correctIndex;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === q.correctIndex) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
      onComplete(correctCount + (isCorrect ? 1 : 0));
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  if (finished) {
    const score = correctCount + (isCorrect ? 1 : 0);
    const percent = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-3"
      >
        <div className="text-4xl">{percent >= 80 ? '🎉' : percent >= 50 ? '💪' : '📚'}</div>
        <h3 className="font-bold text-base">Quiz Complete!</h3>
        <p className="text-muted-foreground text-sm">{score}/{questions.length} correct</p>
        {percent >= 80 && (
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">+{XP_PER_QUIZ} Bonus XP!</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {percent >= 80 ? 'Perfect! You\'ve mastered this quiz.' : percent >= 50 ? 'Good effort! Review the content and try again later.' : 'Keep studying — you\'ll get it next time.'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Question {currentQ + 1} of {questions.length}</span>
        <span className="text-primary font-medium">{Math.round((currentQ / questions.length) * 100)}%</span>
      </div>
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full apice-gradient-primary rounded-full"
          animate={{ width: `${(currentQ / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <p className="text-sm font-semibold leading-snug pt-1">{q.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isChosen = selected === i;
          const isRight = i === q.correctIndex;
          let style = 'bg-secondary/50 border-border/50 text-foreground';
          if (showResult && isChosen && isCorrect) style = 'bg-green-500/10 border-green-500/40 text-green-400';
          else if (showResult && isChosen && !isCorrect) style = 'bg-red-500/10 border-red-500/40 text-red-400';
          else if (showResult && isRight) style = 'bg-green-500/10 border-green-500/40 text-green-400';

          return (
            <motion.button
              key={i}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              disabled={showResult}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm',
                style,
                !showResult && 'hover:bg-primary/5 hover:border-primary/20 active:scale-98'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border',
                showResult && isChosen && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                  showResult && isChosen && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                    showResult && isRight ? 'bg-green-500 border-green-500 text-white' :
                      'bg-secondary border-border text-muted-foreground'
              )}>
                {showResult && (isChosen || isRight) ? (
                  isRight ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />
                ) : String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-3 rounded-xl text-xs leading-relaxed',
              isCorrect ? 'bg-green-500/8 text-green-300 border border-green-500/20' : 'bg-red-500/8 text-red-300 border border-red-500/20'
            )}
          >
            <span className="font-semibold">{isCorrect ? '✅ Correct! ' : '❌ Not quite. '}</span>
            {q.explanation}
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && (
        <Button variant="premium" size="sm" className="w-full" onClick={handleNext}>
          {currentQ + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ─── Challenge Card ────────────────────────────────────────────────────────
function ChallengeCard({ challenge }: { challenge: LessonChallenge }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">🎯 Challenge</p>
            <p className="text-xs text-amber-400/80">{challenge.title}</p>
          </div>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-amber-400/60 transition-transform', expanded && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-amber-500/15 pt-3">
              <p className="text-xs text-muted-foreground">{challenge.description}</p>
              <div className="space-y-1.5">
                {challenge.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xs text-amber-400 font-medium">{challenge.reward}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function LessonDetail() {
  const { trackId, lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useAppStore((s) => s.completeLesson);
  const learnProgress = useAppStore((s) => s.learnProgress);
  const [showCelebration, setShowCelebration] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [activeTab, setActiveTab] = useState<'lesson' | 'quiz' | 'challenge'>('lesson');

  const track = learningTracks.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.id === lessonId);
  const lessonIndex = track?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const nextLesson = track?.lessons[lessonIndex + 1];

  const isCompleted = learnProgress.completedLessons.includes(lessonId || '');
  const lessonNumber = lessonIndex + 1;
  const totalInTrack = track?.lessons.length ?? 0;
  const hasQuiz = lesson?.quiz && lesson.quiz.length > 0;
  const hasChallenge = !!lesson?.challenge;

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

  const handleQuizComplete = (score: number) => {
    setQuizDone(true);
    setQuizScore(score);
    // Persist quiz completion by marking the lesson as complete in the store
    if (lesson && !isCompleted) {
      completeLesson(lesson.id);
    }
  };

  const tabs = [
    { id: 'lesson' as const, label: 'Lesson', icon: Scroll },
    ...(hasQuiz ? [{ id: 'quiz' as const, label: 'Quiz', icon: Brain }] : []),
    ...(hasChallenge ? [{ id: 'challenge' as const, label: 'Challenge', icon: Target }] : []),
  ];

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
              className="text-center px-8"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-xl font-bold mb-2">Lesson Complete!</h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-400">+{XP_PER_LESSON} XP</span>
              </div>
              {quizDone && quizScore >= (lesson.quiz?.length ?? 1) * 0.8 && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">+{XP_PER_QUIZ} Quiz Bonus!</span>
                </div>
              )}
              {!nextLesson && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Track Complete! 🏆</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 py-5 safe-top border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/learn')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{track.name} · {lessonNumber}/{totalInTrack}</p>
            <h1 className="text-base font-bold leading-tight truncate">{lesson.title}</h1>
          </div>
          {isCompleted && (
            <Badge variant="low" size="sm" className="gap-1 shrink-0">
              <Check className="w-3 h-3" /> Done
            </Badge>
          )}
        </div>

        {/* Track progress dots */}
        <div className="flex gap-1 mt-3">
          {track.lessons.map((l, i) => (
            <div
              key={l.id}
              className={`flex-1 h-1 rounded-full transition-all ${learnProgress.completedLessons.includes(l.id)
                  ? 'bg-primary'
                  : i === lessonIndex
                    ? 'bg-primary/40'
                    : 'bg-secondary'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border/30">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> {lesson.readingTime} min
        </span>
        <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
          <Star className="w-3.5 h-3.5" /> +{XP_PER_LESSON} XP
        </span>
        {hasQuiz && (
          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Brain className="w-3.5 h-3.5" /> +{XP_PER_QUIZ} quiz bonus
          </span>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex px-5 pt-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              {tab.id === 'quiz' && quizDone && (
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-5 space-y-4 pb-44 lg:pb-24"
      >
        {activeTab === 'lesson' && (
          <>
            {/* Key Takeaways */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  Key Takeaways
                </h3>
                <div className="space-y-2">
                  {lesson.summary.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex items-start gap-2.5"
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

            {/* Rich Content Blocks */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Lesson
                </h3>
                <div className="space-y-5">
                  {lesson.contentBlocks ? (
                    lesson.contentBlocks.map((block, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                      >
                        <ContentBlockView block={block} />
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-[15px] text-foreground/80 leading-[1.75]">{lesson.content}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Do This Now */}
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                ✨ Do This Now
              </h3>
              <p className="text-sm text-muted-foreground">{lesson.doThisNow}</p>
            </div>

            {/* Challenge teaser */}
            {hasChallenge && (
              <ChallengeCard challenge={lesson.challenge!} />
            )}

            {/* Next Lesson Preview */}
            {nextLesson && (
              <Card variant="interactive" onClick={handleComplete}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1">Next Lesson</p>
                      <p className="font-medium text-sm">{nextLesson.title}</p>
                      <p className="text-[11px] text-primary mt-0.5">+{XP_PER_LESSON} XP</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'quiz' && hasQuiz && (
          <>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-0.5">Knowledge Check</p>
                <p className="text-xs text-muted-foreground">Score 80%+ to earn +{XP_PER_QUIZ} bonus XP. Test your understanding of the lesson.</p>
              </div>
            </div>
            <QuizSection questions={lesson.quiz!} onComplete={handleQuizComplete} />
          </>
        )}

        {activeTab === 'challenge' && hasChallenge && (
          <>
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
              <Target className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-0.5 text-amber-300">Practical Challenge</p>
                <p className="text-xs text-muted-foreground">Apply what you learned with a real-world exercise. Complete it to earn bonus XP and a badge.</p>
              </div>
            </div>
            <Card>
              <CardContent className="pt-4 pb-4 space-y-4">
                <div>
                  <h3 className="font-bold text-sm mb-1">{lesson.challenge!.title}</h3>
                  <p className="text-xs text-muted-foreground">{lesson.challenge!.description}</p>
                </div>
                <div className="space-y-2">
                  {lesson.challenge!.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-semibold text-amber-300">Reward: {lesson.challenge!.reward}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Fixed CTA — respects sidebar on desktop, above BottomNav on mobile */}
      <div className="fixed bottom-[88px] lg:bottom-0 left-0 lg:left-[240px] right-0 z-30 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
        <div className="max-w-2xl lg:max-w-3xl mx-auto">
          <Button
            variant={isCompleted ? 'secondary' : 'premium'}
            size="lg"
            className="w-full"
            onClick={handleComplete}
          >
            {isCompleted ? (
              <>Review Complete <Check className="w-4 h-4 ml-1" /></>
            ) : (
              <>Complete & Earn {XP_PER_LESSON} XP <Zap className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
