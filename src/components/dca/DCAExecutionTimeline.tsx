import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useDCAExecution } from '@/hooks/useDCAExecution';
import type { DCAExecution } from '@/hooks/useDCAExecution';
import { cn } from '@/lib/utils';

const INITIAL_VISIBLE = 5;

function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 60_000) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function DCAExecutionTimeline() {
  const { fetchHistory } = useDCAExecution();
  const [executions, setExecutions] = useState<DCAExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchHistory(undefined, 20);
        if (!cancelled) setExecutions(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchHistory]);

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4',
          'flex items-center justify-center h-32',
        )}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-6',
          'flex flex-col items-center justify-center gap-2 text-center',
        )}
      >
        <CheckCircle2 className="h-7 w-7 text-white/20" />
        <p className="text-sm text-white/40">No executions yet</p>
      </div>
    );
  }

  const visible = expanded
    ? executions
    : executions.slice(0, INITIAL_VISIBLE);

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4">
      <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
        Execution History
      </h3>

      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />

        {visible.map((exec, i) => {
          const isSuccess = exec.status === 'success';
          return (
            <motion.div
              key={exec.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="relative flex items-start gap-3 py-2 pl-1"
            >
              {/* Dot */}
              <div className="relative z-10 mt-0.5 shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="h-[15px] w-[15px] text-emerald-400" />
                ) : (
                  <XCircle className="h-[15px] w-[15px] text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-white truncate">
                    {exec.asset_symbol}
                  </span>
                  <span className="text-[10px] text-white/40 shrink-0">
                    {relativeDate(exec.executed_at)}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-[11px] text-white/60">
                    ${exec.amount_usdt.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isSuccess ? 'text-emerald-400/80' : 'text-red-400/80',
                    )}
                  >
                    {isSuccess ? 'success' : 'failed'}
                  </span>
                </div>
                {exec.error_message && (
                  <p className="text-[10px] text-red-400/60 mt-0.5 truncate">
                    {exec.error_message}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {executions.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-1 py-1.5',
            'text-xs text-white/40 hover:text-white/60 transition-colors',
          )}
        >
          {expanded ? 'Show less' : `Show more (${executions.length - INITIAL_VISIBLE})`}
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      )}
    </div>
  );
}
