import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApexAiBurnInHealth, type ApexAiBurnInHealth } from '@/hooks/useApexAiBurnIn';

/**
 * ApexAiBurnInMonitor — compact health dashboard for the A6 burn-in phase.
 * Shows tick freshness, reconciliation status, and 24h activity snapshot.
 * Intended as a dev/admin view but useful for any user who wants to see
 * the system's heartbeat.
 */
export function ApexAiBurnInMonitor({ portfolioId }: { portfolioId: string }) {
  const { data: health, isLoading } = useApexAiBurnInHealth(portfolioId);

  if (isLoading) return <SkeletonCard />;
  if (!health) return null;

  const tickHealthy = health.seconds_since_last_tick !== null && health.seconds_since_last_tick < 180;
  const reconcileHealthy = !health.live_mode || (health.seconds_since_last_reconcile !== null && health.seconds_since_last_reconcile < 300);
  const hasErrors = health.reconcile_error !== null || health.live_errors_24h > 0;

  const overallStatus: 'healthy' | 'warning' | 'error' =
    hasErrors
      ? 'error'
      : !tickHealthy || !reconcileHealthy
      ? 'warning'
      : 'healthy';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon status={overallStatus} />
              <p className="text-sm font-semibold">System Health</p>
              <HealthBadge status={overallStatus} />
            </div>
            <Badge className="bg-muted text-muted-foreground border-none text-[10px]">
              {health.live_mode ? 'LIVE' : 'SIMULATE'}
            </Badge>
          </div>

          {/* Tick + reconcile freshness */}
          <div className="grid grid-cols-2 gap-2">
            <HealthRow
              label="Last tick"
              value={formatRelativeSec(health.seconds_since_last_tick)}
              ok={tickHealthy}
            />
            {health.live_mode && (
              <HealthRow
                label="Last reconcile"
                value={formatRelativeSec(health.seconds_since_last_reconcile)}
                ok={reconcileHealthy}
              />
            )}
          </div>

          {/* 24h activity */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
            <ActivityStat label="Open" value={health.open_positions} subtle={`${health.active_groups} grp`} />
            <ActivityStat label="Trades 24h" value={health.trades_24h} />
            <ActivityStat label="Cycles 24h" value={health.cycles_24h} />
            <ActivityStat
              label="Errors 24h"
              value={health.live_errors_24h}
              tone={health.live_errors_24h > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {health.reconcile_error && (
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-400 leading-snug">
                Reconcile error: {health.reconcile_error.slice(0, 120)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  if (status === 'healthy') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'warning') return <RefreshCw className="w-4 h-4 text-amber-400" />;
  return <AlertTriangle className="w-4 h-4 text-red-400" />;
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const config = {
    healthy: { label: 'All systems go', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    warning: { label: 'Warning', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    error: { label: 'Error', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  }[status];
  return <Badge className={`${config.className} text-[10px] px-1.5 py-0`}>{config.label}</Badge>;
}

function HealthRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/30">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-semibold ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
        {value}
      </span>
    </div>
  );
}

function ActivityStat({
  label,
  value,
  subtle,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  subtle?: string;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`text-base font-bold ${tone === 'danger' ? 'text-red-400' : 'text-foreground'}`}>
        {value}
      </p>
      {subtle && <p className="text-[9px] text-muted-foreground">{subtle}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="animate-pulse flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full bg-white/10" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeSec(s: number | null): string {
  if (s === null) return '—';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ensure unused imports don't error
const _kept = { Activity, Cpu };
void _kept;

export type { ApexAiBurnInHealth };
