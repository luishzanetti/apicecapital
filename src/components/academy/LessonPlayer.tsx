import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Brain, Check, ChevronRight, Clock,
  Lightbulb, PlayCircle, Quote, Sparkles, Star, Target, Trophy, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type {
  ContentBlock,
  Lesson as DataLesson,
  Track as DataTrack,
} from '@/data/sampleData';
import { QuizEngine } from './QuizEngine';

const XP_PER_LESSON = 50;
const XP_PER_QUIZ = 30;

// Reuse the same world theme mapping as LearningMap
const WORLD_COLORS: Record<string, string> = {
  foundations: 'hsl(var(--world-foundation))',
  'dca-mastery': 'hsl(var(--world-dca))',
  'portfolio-mastery': 'hsl(var(--world-portfolio))',
  automation: 'hsl(var(--world-capital))',
  'copy-trading': 'hsl(var(--world-market))',
  'bybit-mastery': 'hsl(var(--world-altis))',
};

function worldColorFor(trackId: string): string {
  return WORLD_COLORS[trackId] ?? 'hsl(var(--world-foundation))';
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p className="font-serif text-[18px] leading-[1.75] tracking-[-0.005em] text-foreground/90">
        {block.content}
      </p>
    );
  }
  if (block.type === 'highlight') {
    return (
      <div className="flex gap-4 p-5 rounded-3xl bg-primary/6 border border-primary/20">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
            Key Concept
          </p>
          <p className="font-serif text-[17px] leading-[1.65] text-foreground">
            {block.content}
          </p>
        </div>
      </div>
    );
  }
  if (block.type === 'stat') {
    return (
      <div className="flex items-center gap-5 p-5 rounded-3xl bg-secondary/40 border border-border/60">
        <div className="text-center min-w-[100px]">
          <p className="text-3xl font-display font-bold text-primary">{block.value}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
            {block.label}
          </p>
        </div>
        <div className="w-px self-stretch bg-border" />
        <p className="text-sm text-muted-foreground leading-relaxed">{block.content}</p>
      </div>
    );
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="pl-5 border-l-4 border-primary/50 py-2 space-y-2">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-primary/70 shrink-0 mt-1" aria-hidden="true" />
          <p className="font-serif italic text-[18px] leading-[1.7] text-foreground/90">
            "{block.content}"
          </p>
        </div>
        {block.author && (
          <footer className="text-sm text-muted-foreground pl-8">
            — {block.author}
            {block.role && <span className="opacity-70">, {block.role}</span>}
          </footer>
        )}
      </blockquote>
    );
  }
  return null;
}

export interface LessonPlayerProps {
  lesson: DataLesson;
  track: DataTrack;
  lessonIndex: number;
  totalLessons: number;
  nextLesson?: DataLesson | null;
  isCompleted: boolean;
  onComplete: () => void;
  onOpenNext?: () => void;
  /** Practical tool link CTA — overrides the default "Portfolio" button */
  toolHref?: string;
  toolLabel?: string;
}

/**
 * LessonPlayer — premium reader experience.
 *
 * Sticky scroll-progress bar, hero, optional video, serif body, optional
 * quiz (inline), and a next-lesson card. The CTA at the bottom lets the
 * user mark the lesson complete or move on if already done.
 */
export function LessonPlayer({
  lesson,
  track,
  lessonIndex,
  totalLessons,
  nextLesson,
  isCompleted,
  onComplete,
  onOpenNext,
  toolHref,
  toolLabel,
}: LessonPlayerProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progressWidth = useTransform(scrollYProgress, (v) => `${v * 100}%`);

  const worldColor = worldColorFor(track.id);
  const hasQuiz = !!lesson.quiz && lesson.quiz.length > 0;
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Only relevant for video — embed pattern stays minimal
  const videoEmbed = useMemo(() => {
    // Not present in current sampleData, but forward-compat
    return (lesson as { videoUrl?: string }).videoUrl ?? null;
  }, [lesson]);

  useEffect(() => {
    // Scroll to top on lesson change
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [lesson.id]);

  return (
    <div
      ref={scrollRef}
      className="relative min-h-screen max-h-screen overflow-y-auto pb-40 bg-background"
    >
      {/* Sticky scroll progress */}
      <motion.div
        className="sticky top-0 z-30 h-[3px] w-full origin-left"
        style={{
          background: `linear-gradient(90deg, ${worldColor}, hsl(var(--apice-gold)))`,
          transformOrigin: '0 0',
          scaleX: scrollYProgress,
        }}
        aria-hidden="true"
      />

      {/* Back button */}
      <div className="sticky top-[3px] z-20 flex items-center gap-3 px-5 py-3 bg-background/80 backdrop-blur-md border-b border-border/40">
        <button
          onClick={() => navigate('/learn')}
          className="w-9 h-9 rounded-full bg-secondary/70 hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
          aria-label="Back to Academy"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <p className="text-xs font-semibold text-muted-foreground truncate">
          {track.name} · {lessonIndex + 1}/{totalLessons}
        </p>
        {isCompleted && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--apice-success)/0.12)] text-[hsl(var(--apice-success))] text-[11px] font-semibold">
            <Check className="w-3 h-3" aria-hidden="true" />
            Completed
          </span>
        )}
      </div>

      {/* Hero */}
      <header
        className="relative px-5 pt-8 pb-10 overflow-hidden"
        style={{
          minHeight: '40vh',
        }}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${worldColor} 0%, transparent 55%), radial-gradient(circle at 80% 90%, hsl(var(--apice-gold) / 0.3) 0%, transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 backdrop-blur-[60px]" aria-hidden="true" />

        <div className="relative max-w-2xl mx-auto space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: worldColor }}>
            {track.name} · Lesson {lessonIndex + 1} of {totalLessons}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
            {lesson.title}
          </h1>
          {lesson.summary?.[0] && (
            <p className="font-serif text-lg text-foreground/70 leading-snug">
              {lesson.summary[0]}.
            </p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {lesson.readingTime} min
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" aria-hidden="true" />
              +{XP_PER_LESSON} XP
            </span>
            {hasQuiz && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: `${worldColor.replace(')', ' / 0.15)')}`,
                  color: worldColor,
                }}
              >
                <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                {lesson.quiz!.length} quiz
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Video placeholder (if provided) */}
      {videoEmbed && (
        <section className="px-5 py-4">
          <div className="max-w-2xl mx-auto aspect-video rounded-3xl overflow-hidden border border-border bg-black relative">
            <iframe
              src={videoEmbed}
              title={lesson.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Key takeaways */}
      <section className="px-5 py-2">
        <div className="max-w-2xl mx-auto rounded-3xl bg-card border border-border/60 p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            Key takeaways
          </h2>
          <ul className="space-y-2.5">
            {lesson.summary.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${worldColor.replace(')', ' / 0.15)')}` }}
                >
                  <Check className="w-3 h-3" style={{ color: worldColor }} strokeWidth={3} aria-hidden="true" />
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Content blocks */}
      <article className="px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {lesson.contentBlocks
            ? lesson.contentBlocks.map((block, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BlockRenderer block={block} />
                </motion.div>
              ))
            : (
                <p className="font-serif text-[18px] leading-[1.75] text-foreground/90">
                  {lesson.content}
                </p>
              )}
        </div>
      </article>

      {/* Quiz */}
      {hasQuiz && (
        <section className="px-5 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {!showQuiz && quizScore === null ? (
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                className="w-full rounded-3xl p-5 border text-left transition-all hover:border-primary/40"
                style={{
                  background: `${worldColor.replace(')', ' / 0.08)')}`,
                  borderColor: `${worldColor.replace(')', ' / 0.25)')}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${worldColor.replace(')', ' / 0.2)')}` }}
                  >
                    <Brain className="w-5 h-5" style={{ color: worldColor }} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold">Knowledge check</p>
                    <p className="text-xs text-muted-foreground">
                      {lesson.quiz!.length} questions · Score 80%+ for +{XP_PER_QUIZ} XP bonus
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
                </div>
              </button>
            ) : (
              <QuizEngine
                questions={lesson.quiz!}
                xpBonus={XP_PER_QUIZ}
                worldColor={worldColor}
                onComplete={(score) => setQuizScore(score)}
              />
            )}
          </div>
        </section>
      )}

      {/* Do this now */}
      <section className="px-5 py-4">
        <div className="max-w-2xl mx-auto rounded-3xl border border-amber-500/25 bg-amber-500/8 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Apply it
          </h2>
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {lesson.doThisNow}
          </p>
          <Button
            variant="soft"
            size="sm"
            onClick={() => navigate(toolHref ?? '/portfolio')}
            className="w-full sm:w-auto"
          >
            {toolLabel ?? 'Open the tool'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* Challenge */}
      {lesson.challenge && (
        <section className="px-5 py-4">
          <div className="max-w-2xl mx-auto rounded-3xl border border-amber-500/20 bg-amber-500/4 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Challenge</p>
                <h3 className="text-base font-bold">{lesson.challenge.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lesson.challenge.description}
            </p>
            <ol className="space-y-2">
              {lesson.challenge.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/90">{step}</p>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2 pt-1">
              <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <p className="text-xs font-semibold text-amber-400">{lesson.challenge.reward}</p>
            </div>
          </div>
        </section>
      )}

      {/* Next lesson */}
      {nextLesson && (
        <section className="px-5 py-6">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={onOpenNext ?? (() => navigate(`/learn/lesson/${nextLesson.id}`))}
              className="w-full rounded-3xl p-5 bg-card border border-border hover:border-primary/40 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${worldColor.replace(')', ' / 0.15)')}` }}
                >
                  <PlayCircle className="w-5 h-5" style={{ color: worldColor }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Next lesson
                  </p>
                  <p className="text-base font-bold truncate">{nextLesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    +{XP_PER_LESSON} XP · {nextLesson.readingTime} min
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" aria-hidden="true" />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* Fixed CTA */}
      <div className="fixed bottom-[88px] lg:bottom-0 left-0 lg:left-[240px] right-0 z-30 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
        <div className="max-w-2xl lg:max-w-3xl mx-auto">
          <Button
            variant={isCompleted ? 'secondary' : 'premium'}
            size="lg"
            className="w-full"
            onClick={onComplete}
          >
            {isCompleted ? (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </>
            ) : (
              <>
                Complete & earn {XP_PER_LESSON} XP
                <Zap className="w-4 h-4 ml-1" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LessonPlayer;
