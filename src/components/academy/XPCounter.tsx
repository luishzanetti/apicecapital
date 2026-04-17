import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface XPCounterProps {
  /** Current total XP */
  value: number;
  /** Optional label suffix, defaults to "XP" */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Extra classes on the outer span */
  className?: string;
  /** Show the lightning icon next to the count */
  showIcon?: boolean;
}

/**
 * XPCounter — animated counter that rolls up to the current XP.
 *
 * Whenever the value increases, renders a transient "+N XP" bubble
 * above the counter for ~1.2s. Respects reduced motion via framer-motion's
 * internal handling of springs.
 */
export function XPCounter({
  value,
  label = 'XP',
  size = 'md',
  className,
  showIcon = true,
}: XPCounterProps) {
  const spring = useSpring(value, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState<number>(value);
  const [pop, setPop] = useState<{ id: number; amount: number } | null>(null);
  const previousRef = useRef<number>(value);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplay(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  useEffect(() => {
    const previous = previousRef.current;
    if (value !== previous) {
      spring.set(value);
      const delta = value - previous;
      if (delta > 0) {
        const id = Date.now();
        setPop({ id, amount: delta });
        const timeout = setTimeout(() => setPop((p) => (p?.id === id ? null : p)), 1200);
        previousRef.current = value;
        return () => clearTimeout(timeout);
      }
      previousRef.current = value;
    }
  }, [value, spring]);

  const sizeClasses: Record<NonNullable<XPCounterProps['size']>, string> = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSize: Record<NonNullable<XPCounterProps['size']>, string> = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span className={cn('relative inline-flex items-center font-semibold tabular-nums', sizeClasses[size], className)}>
      {showIcon && <Zap className={cn(iconSize[size], 'text-amber-400 fill-amber-400/30')} aria-hidden="true" />}
      <span>
        {display.toLocaleString('en-US')} {label}
      </span>

      <AnimatePresence>
        {pop && (
          <motion.span
            key={pop.id}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -16, scale: 1 }}
            exit={{ opacity: 0, y: -28 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute -top-2 right-0 text-xs font-bold text-amber-400"
            aria-live="polite"
          >
            +{pop.amount} XP
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default XPCounter;
