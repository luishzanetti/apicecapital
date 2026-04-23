import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card, CardContent,
} from '@/components/ui/card';
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
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
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
  Wallet,
  Zap,
  RefreshCw,
  ChevronRight,
  Coins,
} from 'lucide-react';
import type { ApexAiPortfolio, ApexAiPortfolioStatus } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Dashboard principal
// KPIs + posições live (Realtime) + P&L chart + kill switch
// ═════════════════════════════════════════════════════════════════

export default function ApexAiDashboard() {
  const nav = useNavigate();
  const activeId = useAppStore((s) => s.apexAiActivePortfolioId);
  const setActiveId = useAppStore((s) => s.setApexAiActivePortfolio);

  const { data: portfolios, isLoading: loadingList } = useApexAiPortfolios();

  // Escolhe portfolio ativo, ou o primeiro da lista
  const currentId = useMemo(() => {
    if (activeId && portfolios?.some((p) => p.id === activeId)) return activeId;
    return portfolios?.[0]?.id ?? null;
  }, [activeId, portfolios]);

  useEffect(() => {
    if (currentId && currentId !== activeId) setActiveId(currentId);
  }, [currentId, activeId, setActiveId]);

  // Empty state: nenhum portfolio
  if (!loadingList && (!portfolios || portfolios.length === 0)) {
    return <EmptyDashboard />;
  }

  if (!currentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  return <DashboardContent portfolioId={currentId} onSwitchPortfolio={setActiveId} allPortfolios={portfolios ?? []} />;
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyDashboard() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="max-w-md mx-auto text-center space-y-6 pt-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Apex AI pronto para ligar</h1>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem nenhum bot configurado. Crie seu primeiro portfolio em menos de 5 minutos.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => nav('/apex-ai/onboarding')}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          Ativar Apex AI
        </Button>
      </div>
    </div>
  );
}

// ─── Dashboard content ────────────────────────────────────────

function DashboardContent({
  portfolioId,
  allPortfolios,
  onSwitchPortfolio,
}: {
  portfolioId: string;
  allPortfolios: ApexAiPortfolio[];
  onSwitchPortfolio: (id: string) => void;
}) {
  const nav = useNavigate();

  const { data: portfolio } = useApexAiPortfolio(portfolioId);
  const { data: credits } = useApexAiCredits();
  const { data: positions } = useApexAiPositions(portfolioId);
  const { data: trades } = useApexAiTrades(portfolioId, 10);
  const { data: stats } = useApexAiPortfolioStats(portfolioId);
  const { data: dailySeries } = useApexAiDailyPnL(portfolioId, 30);

  const [confirmKill, setConfirmKill] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleBotStatus(targetStatus: ApexAiPortfolioStatus) {
    if (!portfolio) return;
    setActionLoading(targetStatus);
    try {
      const { error } = await supabase
        .from('apex_ai_portfolios')
        .update({ status: targetStatus })
        .eq('id', portfolio.id);

      if (error) throw error;

      toast({
        title: targetStatus === 'active' ? 'Bot ativado' : 'Bot pausado',
        description:
          targetStatus === 'active'
            ? 'Apex AI começou a operar. Acompanhe as posições abaixo.'
            : 'Bot pausado. Nenhuma nova ordem será aberta.',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao atualizar status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function killSwitch() {
    if (!portfolio) return;
    setActionLoading('stopped');
    try {
      // MVP: apenas muda status. v2: chama edge function que fecha posições na Bybit.
      const { error } = await supabase
        .from('apex_ai_portfolios')
        .update({ status: 'stopped' })
        .eq('id', portfolio.id);
      if (error) throw error;

      toast({
        title: 'Kill switch acionado',
        description: 'Bot parado. Feche manualmente as posições na Bybit se necessário.',
      });
      setConfirmKill(false);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando portfolio…</div>
      </div>
    );
  }

  const isActive = portfolio.status === 'active';
  const isPaused = portfolio.status === 'paused';
  const isCircuitBreaker = portfolio.status === 'circuit_breaker';
  const isStopped = portfolio.status === 'stopped';

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
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
              <span className="text-xs text-muted-foreground capitalize">{portfolio.risk_profile}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allPortfolios.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/portfolios')}>
              Trocar
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/onboarding')}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Circuit breaker alert */}
      {isCircuitBreaker && (
        <Card className="mb-5 border-red-500/40 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-red-400">Circuit Breaker acionado</p>
              <p className="text-xs text-muted-foreground">
                Drawdown 24h ultrapassou {portfolio.drawdown_24h_trigger_pct}%. Bot pausado automaticamente.
                Revise a configuração antes de reativar.
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
              <p className="text-sm font-semibold text-orange-400">Saldo de Credits baixo</p>
              <p className="text-xs text-muted-foreground">
                Você tem <span className="font-semibold">{credits.balance.toFixed(0)} Credits</span>.
                Recarregue para evitar que o bot pause ao cobrar fee.
              </p>
            </div>
            <Button size="sm" variant="outline">
              Recarregar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <KpiCard
          label="P&L Total"
          value={formatCurrency(stats?.total_pnl ?? 0)}
          trend={stats?.total_pnl ?? 0}
          icon={TrendingUp}
        />
        <KpiCard
          label="P&L 24h"
          value={formatCurrency(stats?.total_pnl_24h ?? 0)}
          trend={stats?.total_pnl_24h ?? 0}
          icon={Activity}
        />
        <KpiCard
          label="Win rate"
          value={`${(stats?.win_rate ?? 0).toFixed(1)}%`}
          icon={ArrowUpRight}
          subtle={`${stats?.win_count ?? 0}W / ${stats?.loss_count ?? 0}L`}
        />
        <KpiCard
          label="Credits"
          value={`${(credits?.balance ?? 0).toFixed(0)}`}
          icon={Coins}
          subtle={`≈ $${((credits?.balance ?? 0) / 100).toFixed(2)}`}
        />
      </div>

      {/* P&L Chart */}
      <Card className="mb-5 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">P&L diário — 30 dias</p>
              <p className="text-xs text-muted-foreground">Lucro líquido após fees</p>
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
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(v) => `$${v}`}
                  />
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
                Sem dados ainda. Trade fechado aparecerá aqui.
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
              <p className="text-sm font-semibold">Controles do bot</p>
              <p className="text-xs text-muted-foreground">
                Capital: ${portfolio.capital_usdt.toLocaleString()} · Alav. máx: {portfolio.max_leverage}x
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
                Pausar
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
                Ativar
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
              Kill switch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Open Positions */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">
            Posições abertas {positions && positions.length > 0 && `(${positions.length})`}
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
                ? 'Nenhuma posição aberta no momento. A IA aguarda o setup ideal.'
                : 'Ative o bot para começar a operar.'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Trades */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Trades recentes</p>
          <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/statements')}>
            Ver todos
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {trades && trades.length > 0 ? (
          <div className="space-y-2">
            {trades.slice(0, 5).map((t) => (
              <TradeRow key={t.id} trade={t} />
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nenhum trade fechado ainda.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kill switch dialog */}
      <AlertDialog open={confirmKill} onOpenChange={setConfirmKill}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parar o bot agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação pausa o Apex AI imediatamente. Posições abertas na Bybit ficam como estão —
              feche manualmente se necessário. Você pode reativar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={killSwitch}
              className="bg-red-500 hover:bg-red-600"
            >
              Confirmar kill switch
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
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
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
  const config: Record<ApexAiPortfolioStatus, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    paused: { label: 'Pausado', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    stopped: { label: 'Parado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    error: { label: 'Erro', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    circuit_breaker: { label: 'Circuit breaker', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  };
  const c = config[status];
  return <Badge className={c.className}>{c.label}</Badge>;
}

function PositionCard({ position }: { position: import('@/types/apexAi').ApexAiPosition }) {
  const pnl = Number(position.unrealized_pnl);
  const isLong = position.side === 'long';
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{position.symbol.replace('USDT', '')}</span>
            <span className="text-xs text-muted-foreground">
              {position.side.toUpperCase()} · {position.leverage}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Entrada: ${Number(position.entry_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-foreground'}`}>
            {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {position.size} un.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade }: { trade: import('@/types/apexAi').ApexAiTrade }) {
  const pnl = Number(trade.net_pnl ?? trade.pnl);
  const isProfit = pnl > 0;
  const closedAt = new Date(trade.closed_at);
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{trade.symbol.replace('USDT', '')}</span>
            <span className="text-xs text-muted-foreground">
              {trade.side.toUpperCase()} · {trade.leverage}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {closedAt.toLocaleDateString('pt-BR')} {closedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
