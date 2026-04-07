import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNextExecutionDate } from '@/lib/dca';
import { DCAPlan, useAppStore } from '@/store/appStore';
import { dcaAssets } from '@/data/sampleData';
import { useDCAExecution, type DCAExecution } from '@/hooks/useDCAExecution';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Play,
  Pause,
  Trash2,
  Clock,
  DollarSign,
  TrendingUp,
  Infinity as InfinityIcon,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';

interface DCAPlanCardProps {
  plan: DCAPlan;
}

export function DCAPlanCard({ plan }: DCAPlanCardProps) {
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const deleteDcaPlan = useAppStore((s) => s.deleteDcaPlan);
  const { executePlan, fetchHistory, isExecuting, lastResult, error, clearError } = useDCAExecution();
  const { language } = useTranslation();

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DCAExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getFrequencyMultiplier = () => {
    switch (plan.frequency) {
      case 'daily': return plan.durationDays || 365;
      case 'weekly': return Math.ceil((plan.durationDays || 365) / 7);
      case 'biweekly': return Math.ceil((plan.durationDays || 365) / 14);
      case 'monthly': return Math.ceil((plan.durationDays || 365) / 30);
    }
  };

  const totalProjected = plan.amountPerInterval * getFrequencyMultiplier();
  const assetsLabel = plan.assets.map(a => `${a.symbol} (${a.allocation}%)`).join(' · ');
  const frequencyLabelMap: Record<DCAPlan['frequency'], string> = {
    daily: language === 'pt' ? 'dia' : 'day',
    weekly: language === 'pt' ? 'semana' : 'week',
    biweekly: language === 'pt' ? 'quinzena' : 'biweekly',
    monthly: language === 'pt' ? 'mês' : 'month',
  };
  const copy =
    language === 'pt'
      ? {
          active: 'Ativo',
          paused: 'Pausado',
          continuous: 'Contínuo',
          progress: 'Progresso',
          daysLeft: (days: number) => `${days} dias restantes`,
          ongoing: 'Em andamento',
          invested: (value: number) => `$${value.toLocaleString('pt-BR')} investidos`,
          target: (value: number) => `Meta de $${value.toLocaleString('pt-BR')}`,
          executing: 'Executando...',
          executeNow: 'Executar agora',
          executed: (value: number) => `DCA executado: $${value.toFixed(2)} investidos`,
          bought: (quantity?: number | null, price?: number | null, amountUsdt?: number | null) =>
            `Comprado${quantity ? ` ${quantity}` : ''} ${price ? `@ $${price}` : `$${(amountUsdt ?? 0).toFixed(2)}`}`,
          failed: (reason?: string | null) => `Falhou: ${reason || 'Erro na execução'}`,
          noHistory: 'Nenhum histórico de execução ainda',
        }
      : {
          active: 'Active',
          paused: 'Paused',
          continuous: 'Continuous',
          progress: 'Progress',
          daysLeft: (days: number) => `${days} days left`,
          ongoing: 'Ongoing',
          invested: (value: number) => `$${value.toLocaleString('en-US')} invested`,
          target: (value: number) => `Target $${value.toLocaleString('en-US')}`,
          executing: 'Executing...',
          executeNow: 'Execute now',
          executed: (value: number) => `DCA executed: $${value.toFixed(2)} invested`,
          bought: (quantity?: number | null, price?: number | null, amountUsdt?: number | null) =>
            `Bought${quantity ? ` ${quantity}` : ''} ${price ? `@ $${price}` : `$${(amountUsdt ?? 0).toFixed(2)}`}`,
          failed: (reason?: string | null) => `Failed: ${reason || 'Execution error'}`,
          noHistory: 'No execution history yet',
        };

  // Calculate days remaining
  const startDate = new Date(plan.startDate);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = plan.durationDays ? Math.max(0, plan.durationDays - daysPassed) : null;
  const progressPercent = plan.durationDays
    ? Math.min(100, Math.round((daysPassed / plan.durationDays) * 100))
    : null;

  const handleExecute = async () => {
    clearError();
    const result = await executePlan(plan.id, {
      id: plan.id,
      assets: plan.assets,
      amountPerInterval: plan.amountPerInterval,
      frequency: plan.frequency,
    });

    if (result) {
      updateDcaPlan(plan.id, {
        totalInvested: (plan.totalInvested ?? 0) + result.totalSpent,
        nextExecutionDate: getNextExecutionDate(plan.frequency),
      });
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      setLoadingHistory(true);
      const result = await fetchHistory(plan.id, 10);
      if (result) {
        setHistory(result);
      }
      setLoadingHistory(false);
    }
    setShowHistory(!showHistory);
  };

  // Auto-dismiss result after 8s
  useEffect(() => {
    if (lastResult || error) {
      const timer = setTimeout(() => clearError(), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastResult, error, clearError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
    >
      <Card className={plan.isActive ? 'border-primary/30' : 'opacity-70'}>
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">
                  ${plan.amountPerInterval}/{frequencyLabelMap[plan.frequency]}
                </h3>
                <Badge variant={plan.isActive ? 'low' : 'outline'} size="sm">
                  {plan.isActive ? copy.active : copy.paused}
                </Badge>
                {plan.durationDays === null && (
                  <Badge variant="premium" size="sm">
                    <InfinityIcon className="w-3 h-3 mr-1" />
                    {copy.continuous}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{assetsLabel}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateDcaPlan(plan.id, { isActive: !plan.isActive })}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  plan.isActive
                    ? 'bg-apice-warning/10 text-apice-warning'
                    : 'bg-apice-success/10 text-apice-success'
                }`}
              >
                {plan.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteDcaPlan(plan.id)}
                className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Asset Colors Bar */}
          <div className="h-2 rounded-full overflow-hidden flex mb-3">
            {plan.assets.map((asset) => {
              const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
              return (
                <div
                  key={asset.symbol}
                  className="h-full"
                  style={{
                    width: `${asset.allocation}%`,
                    backgroundColor: assetData?.color || 'hsl(var(--primary))'
                  }}
                />
              );
            })}
          </div>

          {/* Progress (if has duration) */}
          {progressPercent !== null && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{copy.progress}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {daysRemaining !== null ? (
                <span>{copy.daysLeft(daysRemaining)}</span>
              ) : (
                <span>{copy.ongoing}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{copy.invested(plan.totalInvested ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{copy.target(totalProjected)}</span>
            </div>
          </div>

          {/* Execute Now + History */}
          <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1.5"
                disabled={!plan.isActive || isExecuting}
                onClick={handleExecute}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {copy.executing}
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    {copy.executeNow}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1"
                onClick={toggleHistory}
              >
                <History className="w-3 h-3" />
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>

            {/* Execution Result */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {copy.executed(lastResult.totalSpent)}
                    </div>
                    {lastResult.executions && lastResult.executions.length > 0 && (
                      <div className="space-y-0.5">
                        {lastResult.executions.map((r, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">
                            {r.asset}: {r.status === 'success'
                              ? copy.bought(r.quantity, r.price, r.amountUsdt)
                              : copy.failed(r.error)
                            }
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Execution History */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {copy.noHistory}
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {history.map((exec) => (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-secondary/50"
                        >
                          <div className="flex items-center gap-1.5">
                            {exec.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="font-medium">{exec.asset_symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              ${Number(exec.amount_usdt).toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(exec.executed_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
