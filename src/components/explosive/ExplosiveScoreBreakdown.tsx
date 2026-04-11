import type { ExplosiveScorePillars } from '@/types/explosive';

interface ExplosiveScoreBreakdownProps {
  pillars: ExplosiveScorePillars;
}

const PILLAR_CONFIG = [
  { key: 'fundamental' as const, label: 'Fundamentals', max: 25, color: 'bg-emerald-500' },
  { key: 'momentum' as const, label: 'Momentum', max: 20, color: 'bg-blue-500' },
  { key: 'marketPosition' as const, label: 'Market Position', max: 15, color: 'bg-violet-500' },
  { key: 'risk' as const, label: 'Risk Score', max: 15, color: 'bg-amber-500' },
  { key: 'narrative' as const, label: 'Narrative', max: 15, color: 'bg-cyan-500' },
  { key: 'timing' as const, label: 'Timing', max: 10, color: 'bg-orange-500' },
];

export function ExplosiveScoreBreakdown({ pillars }: ExplosiveScoreBreakdownProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Score Breakdown</p>
      {PILLAR_CONFIG.map(({ key, label, max, color }) => {
        const value = pillars[key];
        const pct = Math.round((value / max) * 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-[11px] font-medium text-foreground/80">{value}/{max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
