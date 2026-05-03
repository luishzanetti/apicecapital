import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/components/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import {
  useApexAiPortfolios,
  useApexAiPortfolio,
  useApexAiPositions,
  useApexAiTrades,
  useApexAiCredits,
  useApexAiPortfolioStats,
  useApexAiDailyPnL,
} from '@/hooks/useApexAiData';
import {
  activateApexAiPortfolio,
  closeAllApexAiPositions,
} from '@/lib/apexAi/activateBot';
import { useApexAiSymbols } from '@/hooks/useApexAiData';
import { ApexAiInsightsCard } from '@/components/apex-ai/ApexAiInsightsCard';
import { ApexAiCommandCenter } from '@/components/apex-ai/ApexAiCommandCenter';
import { ApexAiBurnInMonitor } from '@/components/apex-ai/ApexAiBurnInMonitor';
import { ApexAiFundingWidget } from '@/components/apex-ai/ApexAiFundingWidget';
import { ApexAiReserveFundWidget } from '@/components/apex-ai/ApexAiReserveFundWidget';
import { ApexAiValidatedConfigCard } from '@/components/apex-ai/ApexAiValidatedConfigCard';
import { ApexAiExchangeStatusBanner } from '@/components/apex-ai/ApexAiExchangeStatusBanner';
import { ApexAiHedgeBoard } from '@/components/apex-ai/ApexAiHedgeBoard';
import { ApexAiLiveCyclesFeed } from '@/components/apex-ai/ApexAiLiveCyclesFeed';
import { ApexAiPerformanceCard } from '@/components/apex-ai/ApexAiPerformanceCard';
import { useApexAiTicker } from '@/hooks/useApexAiTicker';
import {
  useApexAiRegime,
  useApexAiSymbolIntelligence,
} from '@/hooks/useApexAiV2Data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Play,
  Pause,
  Plus,
  Square,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Coins,
  Zap,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  ApexAiPortfolio,
  ApexAiPortfolioStatus,
  ApexAiPosition,
  ApexAiTrade,
} from '@/types/apexAi';

export default function ApexAiDashboard() {
  const { t } = useTranslation();
  const activeId = useAppStore((s) => s.apexAiActivePortfolioId);
  const setActiveId = useAppStore((s) => s.setApexAiActivePortfolio);
  const { data: portfolios, isLoading: loadingList } = useApexAiPortfolios();

  const currentId = useMemo(() => {
    if (activeId && portfolios?.some((p) => p.id === activeId)) return activeId;
    return portfolios?.[0]?.id ?? null;
  }, [activeId, portfolios]);

  useEffect(() => {
    if (currentId && currentId !== activeId) setActiveId(currentId);
  }, [currentId, activeId, setActiveId]);

  if (!loadingList && (!portfolios || portfolios.length === 0)) {
    return <EmptyDashboard />;
  }

  if (!currentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">{t('apexAi.dashboardLoading')}</div>
      </div>
    );
  }

  return (
    <DashboardContent
      portfolioId={currentId}
      allPortfolios={portfolios ?? []}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyDashboard() {
  const nav = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="max-w-md mx-auto text-center space-y-6 pt-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('apexAi.dashboardEmptyTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('apexAi.dashboardEmptyDesc')}</p>
        </div>
        <Button
          size="lg"
          onClick={() => nav('/apex-ai/onboarding')}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          {t('apexAi.dashboardEmptyCta')}
        </Button>
      </div>
    </div>
  );
}

// ─── Dashboard content ────────────────────────────────────────

function DashboardContent({
  portfolioId,
  allPortfolios,
}: {
  portfolioId: string;
  allPortfolios: ApexAiPortfolio[];
}) {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: portfolio } = useApexAiPortfolio(portfolioId);
  const { data: credits } = useApexAiCredits();
  const { data: positions } = useApexAiPositions(portfolioId);
  const { data: trades } = useApexAiTrades(portfolioId, 10);
  const { data: stats } = useApexAiPortfolioStats(portfolioId);
  const { data: dailySeries } = useApexAiDailyPnL(portfolioId, 30);
  const { data: symbols } = useApexAiSymbols(portfolioId);

  // Client-side bot tick loop — updates PnL live + closes TP/SL + re-opens.
  // Only runs when portfolio status === 'active'. Safe to keep mounted.
  useApexAiTicker({ portfolio });

  // V2: regime + symbol intelligence for active symbols
  const activeSymbolList = useMemo(
    () => (symbols ?? []).filter((s) => s.is_active).map((s) => s.symbol),
    [symbols]
  );
  const { data: regimeMap = {} } = useApexAiRegime(activeSymbolList);
  const { data: intelligenceMap = {} } = useApexAiSymbolIntelligence(activeSymbolList);

  // Detect execution mode from open positions:
  // - 'sim-*' prefix = simulated (DB-only)
  // - anything else = real Bybit order IDs
  const openPositions = positions ?? [];
  const hasSimulatedPositions = openPositions.some((p) =>
    (p.exchange_position_id ?? '').startsWith('sim-')
  );
  const hasLivePositions = openPositions.some(
    (p) => p.exchange_position_id && !p.exchange_position_id.startsWith('sim-')
  );

  const [confirmKill, setConfirmKill] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleBotStatus(targetStatus: ApexAiPortfolioStatus) {
    if (!portfolio || !session?.user?.id) return;
    setActionLoading(targetStatus);
    try {
      if (targetStatus === 'active') {
        // Activation opens hedge positions immediately (CEO directive).
        // Real path: Edge Function bot-tick (deployed). Fallback: simulated.
        const result = await activateApexAiPortfolio(
          portfolio,
          symbols ?? [],
          session.user.id
        );

        if (result.status === 'error') {
          throw new Error(result.message ?? 'activation failed');
        }

        toast({
          title: t('apexAi.dashboardToastActivateTitle'),
          description:
            result.status === 'activated_simulated'
              ? `${t('apexAi.dashboardToastActivateDesc')} (simulation mode — ${result.positions_opened} positions opened)`
              : `${t('apexAi.dashboardToastActivateDesc')} — ${result.positions_opened} positions opened`,
        });

        // Invalidate ALL Apex AI queries so dashboard reflects new positions immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['apex-ai-positions', portfolio.id] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolio', portfolio.id] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolios'] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-trades', portfolio.id] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-credits'] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-daily-pnl', portfolio.id] }),
          queryClient.invalidateQueries({ queryKey: ['apex-ai-symbols', portfolio.id] }),
        ]);
      } else {
        // Pause: flip status only. Positions stay open (user can kill if wants to close)
        const { error } = await supabase
          .from('apex_ai_portfolios')
          .update({ status: targetStatus })
          .eq('id', portfolio.id);
        if (error) throw error;

        toast({
          title: t('apexAi.dashboardToastPauseTitle'),
          description: t('apexAi.dashboardToastPauseDesc'),
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function killSwitch() {
    if (!portfolio || !session?.user?.id) return;
    setActionLoading('stopped');
    try {
      // Kill switch closes all open positions (simulated ones persist to trades)
      const { closed } = await closeAllApexAiPositions(
        portfolio.id,
        session.user.id
      );

      const { error } = await supabase
        .from('apex_ai_portfolios')
        .update({ status: 'stopped' })
        .eq('id', portfolio.id);
      if (error) throw error;

      toast({
        title: t('apexAi.dashboardToastKillTitle'),
        description: `${t('apexAi.dashboardToastKillDesc')} (${closed} positions closed)`,
      });
      setConfirmKill(false);

      queryClient.invalidateQueries({ queryKey: ['apex-ai-positions', portfolio.id] });
      queryClient.invalidateQueries({ queryKey: ['apex-ai-trades', portfolio.id] });
      queryClient.invalidateQueries({ queryKey: ['apex-ai-portfolio', portfolio.id] });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">{t('apexAi.dashboardPortfolioLoading')}</div>
      </div>
    );
  }

  const isActive = portfolio.status === 'active';
  const isStopped = portfolio.status === 'stopped';
  const isCircuitBreaker = portfolio.status === 'circuit_breaker';

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{portfolio.name}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={portfolio.status} />
              <span className="text-xs text-muted-foreground capitalize">
                {portfolio.risk_profile === 'conservative'
                  ? t('apexAi.riskConservative')
                  : portfolio.risk_profile === 'balanced'
                  ? t('apexAi.riskBalanced')
                  : t('apexAi.riskAggressive')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allPortfolios.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/portfolios')}>
              {t('apexAi.dashboardSwitchBtn')}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/onboarding')}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mode banner */}
      {hasLivePositions && (
        <Card className="mb-5 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3 flex items-start gap-3">
            <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-emerald-400">
                Live trading mode
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Bot is executing real orders on your Bybit account. PnL reflects actual positions on the exchange.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSimulatedPositions && !hasLivePositions && (
        <Card className="mb-5 border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-3 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-violet-400">
                Simulation mode
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No Bybit API key connected — positions are simulated with real market prices but orders are not placed on the exchange. Connect Bybit in Settings to switch to live trading.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Circuit breaker alert */}
      {isCircuitBreaker && (
        <Card className="mb-5 border-red-500/40 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-red-400">
                {t('apexAi.dashboardCircuitBreakerTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('apexAi.dashboardCircuitBreakerDesc').replace(
                  '{{trigger}}',
                  String(portfolio.drawdown_24h_trigger_pct)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low credits alert */}
      {credits && credits.balance < credits.low_balance_threshold && (
        <Card className="mb-5 border-orange-500/40 bg-orange-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Coins className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-orange-400">
                {t('apexAi.dashboardLowCreditsTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('apexAi.dashboardLowCreditsDesc').replace(
                  '{{balance}}',
                  credits.balance.toFixed(0)
                )}
              </p>
            </div>
            <Button size="sm" variant="outline">
              {t('apexAi.dashboardLowCreditsCta')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <KpiCard
          label={t('apexAi.kpiPnlTotal')}
          value={formatCurrency(stats?.total_pnl ?? 0)}
          trend={stats?.total_pnl ?? 0}
          icon={TrendingUp}
        />
        <KpiCard
          label={t('apexAi.kpiPnl24h')}
          value={formatCurrency(stats?.total_pnl_24h ?? 0)}
          trend={stats?.total_pnl_24h ?? 0}
          icon={Activity}
        />
        <KpiCard
          label={t('apexAi.kpiWinRate')}
          value={`${(stats?.win_rate ?? 0).toFixed(1)}%`}
          icon={ArrowUpRight}
          subtle={t('apexAi.kpiWinLoss')
            .replace('{{wins}}', String(stats?.win_count ?? 0))
            .replace('{{losses}}', String(stats?.loss_count ?? 0))}
        />
        <KpiCard
          label={t('apexAi.kpiCredits')}
          value={`${(credits?.balance ?? 0).toFixed(0)}`}
          icon={Coins}
          subtle={`≈ $${((credits?.balance ?? 0) / 100).toFixed(2)}`}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           V3.2 — Apex AI canonical layout
           Order driven by what the user needs to see in priority:
             1. Validated config (credibility) — backtest stats
             2. Command Center (AI thinking now)
             3. Hedge Board (positions live with PnL)
             4. Performance (aggregated stats)
             5. Strategy Decisions (live cycles feed)
             6. Reserve fund (capital management)
             7. Insights (Advisor recommendations)
             8. Burn-in (system health)
         ══════════════════════════════════════════════════════════════ */}

      {/* 0. Exchange status banner — surfaces real-money blockers loud + clear */}
      <div className="mb-5">
        <ApexAiExchangeStatusBanner portfolioId={portfolio.id} />
      </div>

      {/* 1. Validated Strategy Card — proves what the bot is doing */}
      <div className="mb-5">
        <ApexAiValidatedConfigCard />
      </div>

      {/* 2. Command Center — AI analyzing market in real time */}
      {activeSymbolList.length > 0 && (
        <div className="mb-5">
          <ApexAiCommandCenter
            portfolio={portfolio}
            symbols={activeSymbolList}
            regimeMap={regimeMap}
            intelligenceMap={intelligenceMap}
          />
        </div>
      )}

      {/* 3. Hedge Board — what's open right now with live PnL + cycle proximity */}
      <div className="mb-5">
        <ApexAiHedgeBoard portfolioId={portfolio.id} />
      </div>

      {/* 4. Performance — total PnL, win rate, best/worst, last 24h */}
      <div className="mb-5">
        <ApexAiPerformanceCard portfolioId={portfolio.id} />
      </div>

      {/* 5. Strategy Decisions — live feed of cycles + significant events */}
      <div className="mb-5">
        <ApexAiLiveCyclesFeed portfolioId={portfolio.id} />
      </div>

      {/* 6. Smart Reserve Protocol — 10% of profits banked */}
      <div className="mb-5">
        <ApexAiReserveFundWidget portfolioId={portfolio.id} />
      </div>

      {/* 7. AI Advisor — contextual insights + alerts */}
      <div className="mb-5">
        <ApexAiInsightsCard portfolioId={portfolio.id} />
      </div>

      {/* 8. Burn-in monitor — system health for transparency */}
      <div className="mb-5">
        <ApexAiBurnInMonitor portfolioId={portfolio.id} />
      </div>

      {/* Funding intelligence — yield opportunities (kept available, lower priority) */}
      {activeSymbolList.length > 0 && (
        <div className="mb-5">
          <ApexAiFundingWidget intelligenceMap={intelligenceMap} />
        </div>
      )}

      {/* P&L Chart */}
      <Card className="mb-5 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{t('apexAi.dashboardChartTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('apexAi.dashboardChartDesc')}</p>
            </div>
          </div>
          <div className="h-40">
            {dailySeries && dailySeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    stroke="#9ca3af"
                    fontSize={10}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20,20,20,0.95)',
                      border: '1px solid #ffffff20',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                  />
                  <ReferenceLine y={0} stroke="#ffffff30" strokeDasharray="2 2" />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#16A661"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                {t('apexAi.dashboardChartEmpty')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="mb-5 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{t('apexAi.dashboardControlsTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('apexAi.dashboardControlsMeta')
                  .replace('{{capital}}', `$${portfolio.capital_usdt.toLocaleString()}`)
                  .replace('{{leverage}}', String(portfolio.max_leverage))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBotStatus('paused')}
                disabled={actionLoading !== null}
              >
                <Pause className="w-4 h-4 mr-1" />
                {t('apexAi.dashboardBtnPause')}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                onClick={() => toggleBotStatus('active')}
                disabled={actionLoading !== null || isStopped}
              >
                <Play className="w-4 h-4 mr-1" />
                {t('apexAi.dashboardBtnActivate')}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => setConfirmKill(true)}
              disabled={actionLoading !== null || isStopped}
            >
              <Square className="w-4 h-4 mr-1" />
              {t('apexAi.dashboardBtnKill')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Open Positions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">
            {t('apexAi.dashboardPositionsTitle')}{' '}
            {positions && positions.length > 0 && `(${positions.length})`}
          </p>
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {positions && positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((pos) => (
              <PositionCard key={pos.id} position={pos} />
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {isActive
                ? t('apexAi.dashboardPositionsEmptyActive')
                : t('apexAi.dashboardPositionsEmptyInactive')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Trades */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">{t('apexAi.dashboardTradesTitle')}</p>
          <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/statements')}>
            {t('apexAi.dashboardTradesSeeAll')}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {trades && trades.length > 0 ? (
          <div className="space-y-2">
            {trades.slice(0, 5).map((tr) => (
              <TradeRow key={tr.id} trade={tr} />
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {t('apexAi.dashboardTradesEmpty')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kill switch dialog */}
      <AlertDialog open={confirmKill} onOpenChange={setConfirmKill}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('apexAi.dashboardKillConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('apexAi.dashboardKillConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={killSwitch} className="bg-red-500 hover:bg-red-600">
              {t('apexAi.dashboardKillConfirmCta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  subtle,
}: {
  label: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  subtle?: string;
}) {
  const trendColor =
    trend === undefined
      ? 'text-foreground'
      : trend > 0
      ? 'text-emerald-400'
      : trend < 0
      ? 'text-red-400'
      : 'text-foreground';

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className={`text-xl font-bold ${trendColor}`}>{value}</p>
            {subtle && <p className="text-xs text-muted-foreground">{subtle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: ApexAiPortfolioStatus }) {
  const { t } = useTranslation();
  const config: Record<ApexAiPortfolioStatus, { labelKey: string; className: string }> = {
    active: {
      labelKey: 'apexAi.statusActive',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    paused: {
      labelKey: 'apexAi.statusPaused',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    },
    stopped: {
      labelKey: 'apexAi.statusStopped',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    error: {
      labelKey: 'apexAi.statusError',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    circuit_breaker: {
      labelKey: 'apexAi.statusCircuitBreaker',
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
  };
  const c = config[status];
  return <Badge className={c.className}>{t(c.labelKey)}</Badge>;
}

function PositionCard({ position }: { position: ApexAiPosition }) {
  const { t } = useTranslation();
  const pnl = Number(position.unrealized_pnl);
  const isLong = position.side === 'long';
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{position.symbol.replace('USDT', '')}</span>
            <span className="text-xs text-muted-foreground">
              {isLong ? t('apexAi.sideLong') : t('apexAi.sideShort')} · {position.leverage}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('apexAi.entryLabel').replace(
              '{{price}}',
              `$${Number(position.entry_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
            )}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              pnl > 0
                ? 'text-emerald-400'
                : pnl < 0
                ? 'text-red-400'
                : 'text-foreground'
            }`}
          >
            {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">{position.size}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade }: { trade: ApexAiTrade }) {
  const { t } = useTranslation();
  const pnl = Number(trade.net_pnl ?? trade.pnl);
  const isProfit = pnl > 0;
  const closedAt = new Date(trade.closed_at);
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{trade.symbol.replace('USDT', '')}</span>
            <span className="text-xs text-muted-foreground">
              {trade.side === 'long' ? t('apexAi.sideLong') : t('apexAi.sideShort')} ·{' '}
              {trade.leverage}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {closedAt.toLocaleDateString()}{' '}
            {closedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}${pnl.toFixed(2)}
          </p>
          {Number(trade.gas_fee) > 0 && (
            <p className="text-xs text-muted-foreground">
              fee ${Number(trade.gas_fee).toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}$${v.toFixed(2)}`;
}
