import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useApexAiPortfolios,
  useApexAiPortfolioStats,
} from '@/hooks/useApexAiData';
import {
  Bot,
  ArrowRight,
  Sparkles,
  Activity,
  TrendingUp,
  Pause,
  AlertTriangle,
} from 'lucide-react';
import type { ApexAiPortfolio, ApexAiPortfolioStatus } from '@/types/apexAi';

/**
 * ApexAiWidget — Home page widget for Apex AI.
 *
 * Shows different states:
 *  - No portfolio: compact promo with "Activate Apex AI" CTA
 *  - Has portfolio: live status (P&L 24h, win rate, running/paused badge)
 *  - Circuit breaker triggered: warning state
 *
 * Designed to slot in alongside ExecutivePortfolioBoard / DCATracker /
 * ExplosivePicksWidget in Home.tsx.
 */

export function ApexAiWidget() {
  const { data: portfolios, isLoading } = useApexAiPortfolios();

  // Prefer active portfolio; fall back to first portfolio if only paused ones exist
  const featured = useMemo(() => {
    if (!portfolios || portfolios.length === 0) return null;
    return portfolios.find((p) => p.status === 'active') ?? portfolios[0];
  }, [portfolios]);

  if (isLoading) {
    return <ApexAiWidgetSkeleton />;
  }

  if (!featured) {
    return <ApexAiPromoCard />;
  }

  return <ApexAiStatusCard portfolio={featured} />;
}

// ─── Promo (no portfolio yet) ───────────────────────────────

function ApexAiPromoCard() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-emerald-500/3 to-transparent overflow-hidden relative">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(22,166,97,0.12),transparent_50%)] pointer-events-none" />

        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">{t('apexAi.cardTitle')}</h3>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    {t('apexAi.cardBadge')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('apexAi.cardSubtitle')}
                </p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {t('apexAi.cardDescription')}
          </p>

          <Button
            size="sm"
            onClick={() => nav('/apex-ai')}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/10"
          >
            {t('apexAi.landingCtaActivate')}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Status (has portfolio) ─────────────────────────────────

function ApexAiStatusCard({ portfolio }: { portfolio: ApexAiPortfolio }) {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { data: stats } = useApexAiPortfolioStats(portfolio.id);

  const pnl24h = stats?.total_pnl_24h ?? 0;
  const pnlTotal = stats?.total_pnl ?? Number(portfolio.total_pnl);
  const winRate = stats?.win_rate ?? 0;
  const isActive = portfolio.status === 'active';
  const isCircuitBreaker = portfolio.status === 'circuit_breaker';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/6 via-transparent to-transparent overflow-hidden relative cursor-pointer hover:border-emerald-500/40 transition-colors"
        onClick={() => nav('/apex-ai/dashboard')}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">{portfolio.name}</h3>
                  <StatusPill status={portfolio.status} t={t} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('apexAi.cardTitle')} ·{' '}
                  {portfolio.risk_profile === 'conservative'
                    ? t('apexAi.riskConservative')
                    : portfolio.risk_profile === 'balanced'
                    ? t('apexAi.riskBalanced')
                    : t('apexAi.riskAggressive')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>

          {isCircuitBreaker && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400 font-medium">
                {t('apexAi.dashboardCircuitBreakerTitle')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Metric
              label={t('apexAi.kpiPnlTotal')}
              value={formatPnl(pnlTotal)}
              tone={pnlTotal > 0 ? 'positive' : pnlTotal < 0 ? 'negative' : 'neutral'}
              icon={TrendingUp}
            />
            <Metric
              label={t('apexAi.kpiPnl24h')}
              value={formatPnl(pnl24h)}
              tone={pnl24h > 0 ? 'positive' : pnl24h < 0 ? 'negative' : 'neutral'}
              icon={Activity}
            />
            <Metric
              label={t('apexAi.kpiWinRate')}
              value={`${winRate.toFixed(0)}%`}
              tone={winRate >= 50 ? 'positive' : 'neutral'}
              icon={Sparkles}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function ApexAiWidgetSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-white/5" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-16 bg-white/5 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function Metric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-400'
      : tone === 'negative'
      ? 'text-red-400'
      : 'text-foreground';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StatusPill({
  status,
  t,
}: {
  status: ApexAiPortfolioStatus;
  t: (key: string) => string;
}) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
        <Activity className="w-2.5 h-2.5 mr-0.5" />
        {t('apexAi.statusActive')}
      </Badge>
    );
  }
  if (status === 'paused') {
    return (
      <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 text-[10px] px-1.5 py-0">
        <Pause className="w-2.5 h-2.5 mr-0.5" />
        {t('apexAi.statusPaused')}
      </Badge>
    );
  }
  if (status === 'circuit_breaker') {
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
        {t('apexAi.statusCircuitBreaker')}
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 text-[10px] px-1.5 py-0">
      {status === 'stopped' ? t('apexAi.statusStopped') : t('apexAi.statusError')}
    </Badge>
  );
}

function formatPnl(v: number): string {
  const sign = v > 0 ? '+' : '';
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}$${(v / 1000).toFixed(1)}K`;
  return `${sign}$${v.toFixed(2)}`;
}
