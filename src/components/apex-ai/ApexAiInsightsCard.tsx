import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApexAiInsights } from '@/hooks/useApexAiInsights';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import type {
  InsightSeverity,
  ApexAiRecommendation,
  ApexAiAlert,
} from '@/lib/apexAi/insights';

/**
 * ApexAiInsightsCard — AI Advisor layer for the Apex AI dashboard.
 *
 * Shows:
 *   - Portfolio health score (0–100, grade A–D) with contributing factors
 *   - Active alerts (critical / warning items that need attention)
 *   - Prioritized recommendations (what to do next)
 *
 * Source tag ('Local AI' vs 'Claude') indicates whether this came from the
 * deterministic local engine or the remote LLM-powered one. Transparent to
 * the user but useful for debugging/trust.
 */

export function ApexAiInsightsCard({ portfolioId }: { portfolioId: string }) {
  const { data: report, source, isLoading } = useApexAiInsights(portfolioId);

  if (isLoading) {
    return <InsightsCardSkeleton />;
  }

  if (!report) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Header: AI Advisor title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-semibold">Apex AI Advisor</p>
        </div>
        <SourceBadge source={source} />
      </div>

      {/* Health score */}
      <Card className="border-border/50 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              report.health.score >= 80
                ? 'radial-gradient(circle at 0% 0%, rgba(22,166,97,0.08), transparent 50%)'
                : report.health.score >= 65
                ? 'radial-gradient(circle at 0% 0%, rgba(82,143,255,0.06), transparent 50%)'
                : report.health.score >= 45
                ? 'radial-gradient(circle at 0% 0%, rgba(245,181,68,0.08), transparent 50%)'
                : 'radial-gradient(circle at 0% 0%, rgba(239,68,68,0.08), transparent 50%)',
          }}
        />
        <CardContent className="p-5 relative">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 relative">
              {/* Score circle */}
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                />
                <motion.circle
                  initial={{ strokeDashoffset: 213 }}
                  animate={{
                    strokeDashoffset: 213 - (213 * report.health.score) / 100,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={gradeColor(report.health.grade)}
                  strokeWidth="6"
                  strokeDasharray="213"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{report.health.score}</span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: gradeColor(report.health.grade) }}
                >
                  {report.health.grade}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold">Portfolio Health</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {report.health.summary}
              </p>
            </div>
          </div>

          {/* Factors */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
            {report.health.factors.map((f) => (
              <div key={f.label} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {f.label}
                </p>
                <p
                  className={`text-xs font-semibold ${toneToTextColor(f.tone)}`}
                >
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {report.alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span className="font-semibold">
              {report.alerts.length} alert{report.alerts.length > 1 ? 's' : ''}
            </span>
          </div>
          {report.alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="font-semibold">
              {report.recommendations.length} recommendation
              {report.recommendations.length > 1 ? 's' : ''}
            </span>
          </div>
          {report.recommendations.map((r) => (
            <RecommendationRow key={r.id} rec={r} />
          ))}
        </div>
      )}

      {/* Empty state — perfect portfolio */}
      {report.alerts.length === 0 && report.recommendations.length === 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              All clear. Apex AI has no concerns or suggestions at the moment —
              your configuration looks solid.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function InsightsCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-white/5 rounded" />
            <div className="h-2.5 w-48 bg-white/5 rounded" />
            <div className="h-2.5 w-40 bg-white/5 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: 'llm' | 'local' }) {
  if (source === 'llm') {
    return (
      <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] px-1.5 py-0">
        <Zap className="w-2.5 h-2.5 mr-0.5" />
        Claude AI
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 text-[10px] px-1.5 py-0">
      Local AI
    </Badge>
  );
}

function AlertRow({ alert }: { alert: ApexAiAlert }) {
  const tone = toneToBg(alert.severity);
  const Icon = iconForSeverity(alert.severity);
  return (
    <Card className={`border-${tone.border} ${tone.bg}`}>
      <CardContent className="p-3 flex items-start gap-3">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${toneToTextColor(alert.severity)}`} />
        <div className="space-y-0.5">
          <p className={`text-xs font-semibold ${toneToTextColor(alert.severity)}`}>
            {alert.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {alert.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationRow({ rec }: { rec: ApexAiRecommendation }) {
  const Icon = iconForSeverity(rec.severity);
  return (
    <Card className="border-border/50 hover:border-violet-500/30 transition-colors">
      <CardContent className="p-3 flex items-start gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${toneToChipBg(
            rec.severity
          )}`}
        >
          <Icon className={`w-3.5 h-3.5 ${toneToTextColor(rec.severity)}`} />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs font-semibold text-foreground">{rec.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {rec.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tone helpers ───────────────────────────────────────────

function toneToTextColor(tone: InsightSeverity): string {
  switch (tone) {
    case 'success':
      return 'text-emerald-400';
    case 'warning':
      return 'text-orange-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-blue-400';
  }
}

function toneToChipBg(tone: InsightSeverity): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500/10';
    case 'warning':
      return 'bg-orange-500/10';
    case 'critical':
      return 'bg-red-500/10';
    default:
      return 'bg-blue-500/10';
  }
}

function toneToBg(tone: InsightSeverity): { bg: string; border: string } {
  switch (tone) {
    case 'success':
      return { bg: 'bg-emerald-500/5', border: 'emerald-500/20' };
    case 'warning':
      return { bg: 'bg-orange-500/5', border: 'orange-500/20' };
    case 'critical':
      return { bg: 'bg-red-500/5', border: 'red-500/20' };
    default:
      return { bg: 'bg-blue-500/5', border: 'blue-500/20' };
  }
}

function iconForSeverity(
  s: InsightSeverity
): React.ComponentType<{ className?: string }> {
  switch (s) {
    case 'success':
      return CheckCircle2;
    case 'warning':
      return AlertTriangle;
    case 'critical':
      return AlertTriangle;
    default:
      return Info;
  }
}

function gradeColor(g: 'A' | 'B' | 'C' | 'D'): string {
  switch (g) {
    case 'A':
      return '#16A661';
    case 'B':
      return '#528FFF';
    case 'C':
      return '#F5B544';
    case 'D':
      return '#EF4444';
  }
}

// Prevent unused import warnings
const _keepImports = { TrendingUp };
void _keepImports;
