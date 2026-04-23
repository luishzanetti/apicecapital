import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { learningTracks, type Track as LearnTrack } from '@/data/sampleData';
import { PathNode } from './PathNode';
import { cn } from '@/lib/utils';

/**
 * Map each track slug to a CSS color string (world theme).
 * Tracks not listed fall back to --world-foundation.
 */
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

function isTrackAccessible(
  tier: 'free' | 'pro' | 'club',
  userTier: 'free' | 'pro' | 'club'
): boolean {
  if (tier === 'free') return true;
  if (tier === 'pro') return userTier === 'pro' || userTier === 'club';
  return userTier === 'club';
}

interface NodeMeta {
  lessonId: string;
  title: string;
  state: 'locked' | 'available' | 'in-progress' | 'completed' | 'boss';
  index: number;
  isBoss: boolean;
}

export interface LearningMapProps {
  /** Optional override for which track to auto-scroll to */
  focusTrackId?: string;
}

/**
 * LearningMap — Duolingo-style vertical learning path.
 *
 * Each learning track is rendered as a "world" with its own color theme.
 * Lessons form a zig-zag path connected by an SVG guide line. The first
 * uncompleted accessible node is auto-scrolled into view on mount.
 */
export function LearningMap({ focusTrackId }: LearningMapProps) {
  const navigate = useNavigate();
  const learnProgress = useAppStore((s) => s.learnProgress);
  const subscription = useAppStore((s) => s.subscription);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeNodeRef = useRef<HTMLDivElement | null>(null);

  /**
   * Compute node state per track + pick the first accessible, uncompleted
   * node overall so we can scroll it into view.
   */
  const { tracksWithNodes, activeLessonId } = useMemo(() => {
    const result: Array<{
      track: LearnTrack;
      accessible: boolean;
      completedCount: number;
      nodes: NodeMeta[];
    }> = [];
    let activeId: string | null = null;

    for (const track of learningTracks) {
      const accessible = isTrackAccessible(track.requiredTier, subscription.tier);
      const lessonCount = track.lessons.length;
      const nodes: NodeMeta[] = track.lessons.map((lesson, i) => {
        const isLast = i === lessonCount - 1;
        const completed = learnProgress.completedLessons.includes(lesson.id);
        const prevCompleted =
          i === 0 ||
          learnProgress.completedLessons.includes(track.lessons[i - 1]!.id);
        const lessonLocked =
          !accessible ||
          (lesson.isLocked && subscription.tier === 'free') ||
          (!completed && !prevCompleted);

        let state: NodeMeta['state'] = 'locked';
        if (completed) {
          state = 'completed';
        } else if (!lessonLocked) {
          state = isLast ? 'boss' : 'available';
          if (!activeId) activeId = lesson.id;
        }

        return {
          lessonId: lesson.id,
          title: lesson.title,
          state,
          index: i + 1,
          isBoss: isLast,
        };
      });
      const completedCount = nodes.filter((n) => n.state === 'completed').length;
      result.push({ track, accessible, completedCount, nodes });
    }

    return { tracksWithNodes: result, activeLessonId: activeId };
  }, [learnProgress, subscription]);

  // Auto-scroll to active node — centered so it sits comfortably above the floating nav
  useEffect(() => {
    if (!activeNodeRef.current) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    activeNodeRef.current.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [activeLessonId, focusTrackId]);

  const handleNodeSelect = (
    meta: NodeMeta,
    accessible: boolean,
    trackName: string,
    prevLessonTitle: string | undefined
  ) => {
    if (!accessible) {
      toast.info('Upgrade required', {
        description: `Unlock ${trackName} with a plan upgrade.`,
      });
      return;
    }
    if (meta.state === 'locked') {
      toast.message(
        prevLessonTitle
          ? `Complete "${prevLessonTitle}" to unlock`
          : 'Complete the previous lesson to unlock',
        { icon: '🔒' }
      );
      return;
    }
    navigate(`/learn/lesson/${meta.lessonId}`);
  };

  return (
    <div ref={containerRef} className="space-y-10" aria-label="Learning map">
      {tracksWithNodes.map(({ track, accessible, completedCount, nodes }) => {
        const worldColor = worldColorFor(track.id);
        const trackProgress = (completedCount / track.lessons.length) * 100;

        return (
          <section
            key={track.id}
            className="relative"
            aria-labelledby={`world-${track.id}`}
          >
            {/* World banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-3xl p-5 mb-8 border"
              style={{
                background: `linear-gradient(135deg, ${worldColor}, transparent 120%)`,
                borderColor: `${worldColor.replace('hsl(', 'hsl(').replace(')', ' / 0.25)')}`,
              }}
            >
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-50"
                style={{ background: worldColor }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-4">
                <span className="text-4xl shrink-0" aria-hidden="true">
                  {track.icon ?? '🌍'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">
                    World
                  </p>
                  <h2
                    id={`world-${track.id}`}
                    className="text-xl font-bold text-white truncate"
                  >
                    {track.name}
                  </h2>
                  <p className="text-xs text-white/80 line-clamp-1">
                    {track.description}
                  </p>
                </div>
                {!accessible && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur text-white/90 text-[11px] font-semibold">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    {track.requiredTier.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="relative mt-4 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${trackProgress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="text-xs font-bold text-white tabular-nums">
                  {completedCount}/{track.lessons.length}
                </span>
              </div>
            </motion.div>

            {/* Path of nodes (zigzag) — uses CSS-aligned dotted segments instead of an
                absolute SVG so the guide line always tracks the real node positions. */}
            <div className="relative flex flex-col items-center gap-7 sm:gap-8">
              {nodes.map((node, i) => {
                const zigOffset = i % 2 === 0 ? 0 : 1; // alternate left/right
                const isActiveNode = node.lessonId === activeLessonId;
                const prevTitle = i > 0 ? nodes[i - 1]!.title : undefined;
                const isLast = i === nodes.length - 1;

                return (
                  <motion.div
                    key={node.lessonId}
                    ref={isActiveNode ? activeNodeRef : undefined}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      delay: i * 0.04,
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    }}
                    className={cn(
                      'relative flex w-full',
                      zigOffset
                        ? 'justify-end pr-4 sm:pr-16'
                        : 'justify-start pl-4 sm:pl-16',
                    )}
                  >
                    <div className="relative flex flex-col items-center">
                      <PathNode
                        state={node.state}
                        label={node.title}
                        worldColor={worldColor}
                        index={node.state === 'available' ? undefined : node.index}
                        onSelect={() =>
                          handleNodeSelect(node, accessible, track.name, prevTitle)
                        }
                      />
                      {/* Dotted connector to the next node — anchored to this node */}
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 h-7 sm:h-8 w-px"
                          style={{
                            backgroundImage: `linear-gradient(to bottom, ${worldColor.replace(')', ' / 0.45)')} 50%, transparent 50%)`,
                            backgroundSize: '1px 6px',
                            backgroundRepeat: 'repeat-y',
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          'mt-2 max-w-[120px] sm:max-w-[160px] text-center text-[11px] font-medium leading-tight',
                          node.state === 'locked'
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {node.title}
                      </span>
                      {isActiveNode && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: worldColor }}
                        >
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          Start here
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default LearningMap;
