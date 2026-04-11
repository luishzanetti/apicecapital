import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNextExecutionDate } from '@/lib/dca';
import { DCAPlan, useAppStore } from '@/store/appStore';
import { dcaAssets } from '@/data/sampleData';
import { useDCAExecution, type DCAExecution } from '@/hooks/useDCAExecution';
import {
  Play,
  Pause,
  Trash2,
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
  Timer,
} from 'lucide-react';

interface DCAPlanCardProps {
  plan: DCAPlan;
}

function useCountdown(targetDate: string) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const diff = new Date(targetDate).getTime() - now;
    if (diff <= 0) return { label: 'Due now', urgent: true };
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    if (days > 0) return { label: `in ${days}d`, urgent: false };
    return { label: `in ${hours}h`, urgent: hours <= 2 };
  }, [targetDate, now]);
}

const freqLabel: Record<DCAPlan['frequency'], string> = {
  daily: 'day',
  weekly: 'week',
  biweekly: '2wk',
  monthly: 'mo',
};

export function DCAPlanCard({ plan }: DCAPlanCardProps) {
  const updateDcaPlan = useAppStore((s) => s.updateDcaPlan);
  const deleteDcaPlan = useAppStore((s) => s.deleteDcaPlan);
  const { executePlan, fetchHistory, isExecuting, lastResult, error, clearError } = useDCAExecution();

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DCAExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const countdown = useCountdown(plan.nextExecutionDate);

  const getFrequencyMultiplier = () => {
    switch (plan.frequency) {
      case 'daily': return plan.durationDays || 365;
      case 'weekly': return Math.ceil((plan.durationDays || 365) / 7);
      case 'biweekly': return Math.ceil((plan.durationDays || 365) / 14);
      case 'monthly': return Math.ceil((plan.durationDays || 365) / 30);
    }
  };

  const totalProjected = plan.amountPerInterval * getFrequencyMultiplier();
  const assetsLabel = plan.assets.map(a => `${a.symbol} ${a.allocation}%`).join(' · ');

  // Days remaining
  const daysPassed = Math.floor((Date.now() - new Date(plan.startDate).getTime()) / 86_400_000);
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
      if (result) setHistory(result);
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
      <Card className={`glass-card ${plan.isActive ? 'border-primary/30' : 'opacity-60'}`}>
        <CardContent className="p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">
                ${plan.amountPerInterval}/{freqLabel[plan.frequency]}
              </h3>
              <Badge variant={plan.isActive ? 'low' : 'outline'} size="sm">
                {plan.isActive ? 'Active' : 'Paused'}
              </Badge>
              {plan.durationDays === null && (
                <Badge variant="premium" size="sm">
                  <InfinityIcon className="w-3 h-3 mr-0.5" />
                </Badge>
              )}
              {/* Countdown badge */}
              {plan.isActive && (
                <Badge
                  variant="outline"
                  size="sm"
                  className={
                    countdown.urgent
                      ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }
                >
                  <Timer className="w-3 h-3 mr-0.5" />
                  {countdown.label}
                </Badge>
              )}
            </div>
            <div className="flex gap-1.5 ml-2 shrink-0">
              <button
                onClick={() => updateDcaPlan(plan.id, { isActive: !plan.isActive })}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  plan.isActive
                    ? 'bg-apice-warning/10 text-apice-warning'
                    : 'bg-apice-success/10 text-apice-success'
                }`}
              >
                {plan.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => deleteDcaPlan(plan.id)}
                className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assets label */}
          <p className="text-[11px] text-muted-foreground mb-2">{assetsLabel}</p>

          {/* Asset color bar */}
          <div className="h-1.5 rounded-full overflow-hidden flex mb-2">
            {plan.assets.map((asset) => {
              const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
              return (
                <div
                  key={asset.symbol}
                  className="h-full"
                  style={{
                    width: `${asset.allocation}%`,
                    backgroundColor: assetData?.color || 'hsl(var(--primary))',
                  }}
                />
              );
            })}
          </div>

          {/* Progress bar (if has duration) */}
          {progressPercent !== null && (
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                <span>{daysRemaining}d left</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-3 text-[11px] mb-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              ${(plan.totalInvested ?? 0).toLocaleString('en-US')}
            </span>
            <span className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3 h-3" />
              ${totalProjected.toLocaleString('en-US')} target
            </span>
          </div>

          {/* Execute + History */}
          <div className="pt-2 border-t border-border/30 space-y-1.5">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1.5 h-7"
                disabled={!plan.isActive || isExecuting}
                onClick={handleExecute}
              >
                {isExecuting ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Executing...</>
                ) : (
                  <><Zap className="w-3 h-3" /> Execute now</>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-0.5 h-7 px-2"
                onClick={toggleHistory}
              >
                <History className="w-3 h-3" />
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>

            {/* Execution result feedback */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-1.5 rounded-md bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-1 text-[11px] text-green-400 font-medium mb-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      DCA executed: ${lastResult.totalSpent.toFixed(2)} invested
                    </div>
                    {lastResult.executions?.length > 0 && (
                      <div className="space-y-0.5">
                        {lastResult.executions.map((r, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {r.asset}: {r.status === 'success'
                              ? `Bought${r.quantity ? ` ${r.quantity}` : ''} ${r.price ? `@ $${r.price}` : `$${(r.amountUsdt ?? 0).toFixed(2)}`}`
                              : `Failed: ${r.error || 'Execution error'}`
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
                  <div className="p-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                      <XCircle className="w-3 h-3" />
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Execution history */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-1.5">
                      No execution history yet
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {history.map((exec) => (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between text-xs px-1.5 py-1 rounded bg-secondary/50"
                        >
                          <div className="flex items-center gap-1">
                            {exec.status === 'success'
                              ? <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />
                              : <XCircle className="w-2.5 h-2.5 text-red-400" />
                            }
                            <span className="font-medium">{exec.asset_symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              ${Number(exec.amount_usdt).toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(exec.executed_at).toLocaleDateString('en-US')}
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
