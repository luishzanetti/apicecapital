import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { QuizQuestion } from '@/data/sampleData';
import { AcademyProgressRing } from './ProgressRing';

export interface QuizEngineProps {
  questions: QuizQuestion[];
  /** XP bonus awarded on >=80% score */
  xpBonus?: number;
  /** CSS color for accent (defaults to primary) */
  worldColor?: string;
  /** Called with the final correct count */
  onComplete?: (score: number) => void;
}

interface ConfettiBurst {
  id: number;
}

/**
 * QuizEngine — one-question-at-a-time quiz renderer with celebratory
 * micro-interactions. Keeps the UI large-tap-target-friendly (56px+)
 * and surfaces explanations inline on both correct and wrong answers.
 */
export function QuizEngine({
  questions,
  xpBonus = 30,
  worldColor = 'hsl(var(--primary))',
  onComplete,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);
  const [finished, setFinished] = useState(false);

  const q = questions[currentIndex]!;
  const isCorrect = selected === q.correctIndex;

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correctIndex) {
      setCorrectCount((c) => c + 1);
      setBurst({ id: Date.now() });
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.(12);
        } catch {
          /* ignore haptics failure */
        }
      }
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.([0, 18, 30, 18]);
      } catch {
        /* ignore haptics failure */
      }
    }
  };

  const handleNext = () => {
    const finalCount = correctCount; // already updated on select
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      onComplete?.(finalCount);
      return;
    }
    setCurrentIndex((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (finished) {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    const stars = pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0;
    const earnedBonus = pct >= 80;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
        className="flex flex-col items-center text-center space-y-4 p-6 rounded-3xl border bg-card"
        style={{ borderColor: `${worldColor.replace(')', ' / 0.3)')}` }}
      >
        <AcademyProgressRing
          size={120}
          stroke={8}
          progress={pct}
          color={worldColor}
          showPercentage
          ariaLabel={`Quiz score ${pct}%`}
        />
        <div>
          <h3 className="text-lg font-bold">
            {pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Nicely done' : 'Keep going'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {correctCount}/{total} correct
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-6 h-6',
                i < stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        {earnedBonus && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            <Sparkles className="w-4 h-4" aria-hidden="true" />+{xpBonus} XP bonus
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {questions.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i < currentIndex
                ? 'w-6 bg-[hsl(var(--apice-success))]'
                : i === currentIndex
                ? 'w-8'
                : 'w-6 bg-secondary'
            )}
            style={
              i === currentIndex ? { background: worldColor } : undefined
            }
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="text-[11px] text-center text-muted-foreground font-semibold uppercase tracking-wider">
        Question {currentIndex + 1} of {questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border bg-card p-5 space-y-4 relative overflow-hidden"
        >
          {/* Confetti burst on correct */}
          <AnimatePresence>
            {burst && (
              <motion.div
                key={burst.id}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
                onAnimationComplete={() => setBurst(null)}
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: '50%',
                      top: '30%',
                      background:
                        i % 3 === 0
                          ? worldColor
                          : i % 3 === 1
                          ? 'hsl(var(--apice-gold))'
                          : 'hsl(var(--apice-success))',
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: (Math.cos((i / 12) * Math.PI * 2) * 120),
                      y: (Math.sin((i / 12) * Math.PI * 2) * 120),
                      opacity: 0,
                    }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <h3 className="text-lg font-bold leading-snug">{q.question}</h3>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isChosen = selected === i;
              const isRight = i === q.correctIndex;
              const showCorrect = revealed && isRight;
              const showWrong = revealed && isChosen && !isCorrect;

              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  whileTap={!revealed ? { scale: 0.98 } : undefined}
                  animate={
                    showWrong
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : undefined
                  }
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'w-full min-h-[56px] flex items-center gap-3 p-4 rounded-2xl border-2 text-left text-sm font-medium transition-all',
                    !revealed &&
                      'bg-secondary/40 border-border/60 hover:border-primary/40 hover:bg-primary/5',
                    showCorrect &&
                      'bg-[hsl(var(--apice-success)/0.12)] border-[hsl(var(--apice-success))] text-[hsl(var(--apice-success))] shadow-[0_0_20px_-2px_hsl(var(--apice-success)/0.4)]',
                    showWrong &&
                      'bg-destructive/10 border-destructive text-destructive shadow-[0_0_20px_-2px_hsl(var(--destructive)/0.4)]',
                    revealed && !isChosen && !isRight && 'opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
                      !revealed && 'bg-background border-border',
                      showCorrect &&
                        'bg-[hsl(var(--apice-success))] border-[hsl(var(--apice-success))] text-white',
                      showWrong && 'bg-destructive border-destructive text-white',
                      revealed && !isChosen && !isRight && 'bg-background border-border/50'
                    )}
                  >
                    {showCorrect ? (
                      <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                    ) : showWrong ? (
                      <X className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1">{opt}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'rounded-2xl p-4 text-sm leading-relaxed',
                  isCorrect
                    ? 'bg-[hsl(var(--apice-success)/0.08)] border border-[hsl(var(--apice-success)/0.3)] text-[hsl(var(--apice-success))]'
                    : 'bg-destructive/8 border border-destructive/30 text-destructive'
                )}
              >
                <p className="font-semibold mb-1">
                  {isCorrect ? "Nice — that's the core idea." : 'Not quite.'}
                </p>
                <p className="text-foreground/80">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {revealed && (
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={handleNext}
            >
              {currentIndex + 1 >= questions.length ? 'See results' : 'Next question'}
              <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuizEngine;
