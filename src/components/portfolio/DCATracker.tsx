import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useDCAExecution, DCAExecution } from '@/hooks/useDCAExecution';
import {
  Zap, Calendar, DollarSign, TrendingUp, ChevronRight,
  Clock, History, CheckCircle2, XCircle, Loader2, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DCATracker() {
  const navigate = useNavigate();
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const { fetchHistory } = useDCAExecution();
  const [recentExecutions, setRecentExecutions] = useState<DCAExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activePlans = dcaPlans.filter(p => p.isActive);
  const totalInvested = dcaPlans.reduce((sum, p) => sum + (p.totalInvested ?? 0), 0);

  const getMonthlyAmount = (freq: string, amt: number) => {
    switch (freq) {
      case 'daily': return amt * 30;
      case 'weekly': return amt * 4;
      case 'biweekly': return amt * 2;
      case 'monthly': return amt;
      default: return amt * 4;
    }
  };

  const totalMonthly = activePlans.reduce((sum, p) => sum + getMonthlyAmount(p.frequency, p.amountPerInterval), 0);

  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      const history = await fetchHistory(undefined, 5);
      setRecentExecutions(history);
      setLoadingHistory(false);
    };
    load();
  }, [fetchHistory]);

  if (dcaPlans.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-none glass-card">
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--apice-emerald))]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[hsl(var(--apice-emerald))]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold mb-0.5 text-white">Auto-Invest with DCA</p>
                <p className="text-xs text-white/55 leading-relaxed max-w-[260px]">
                  Set up automated buys to build your portfolio consistently without timing the market.
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs bg-[hsl(var(--apice-emerald))] hover:bg-[hsl(var(--apice-emerald))]/90 text-[#050816] font-semibold"
                onClick={() => navigate('/dca-planner')}
              >
                <Plus className="w-3 h-3 mr-1" />
                Create DCA Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="overflow-hidden border-none bg-transparent shadow-none">
        <CardContent className="p-5 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[hsl(var(--apice-emerald))]" />
              <span className="text-[15px] font-semibold text-white">DCA Automation</span>
              <span className="inline-flex items-center rounded-full bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] font-mono tabular-nums">
                {activePlans.length} active
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-[11px] gap-1 h-7 text-[hsl(var(--apice-emerald))] hover:bg-[hsl(var(--apice-emerald))]/10 font-semibold" onClick={() => navigate('/dca-planner')}>
              Manage <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-white/[0.02]">
              <DollarSign className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))] mx-auto mb-1" />
              <p className="font-mono text-lg font-semibold tabular-nums text-white">${totalMonthly}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Monthly</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02]">
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))] mx-auto mb-1" />
              <p className="font-mono text-lg font-semibold tabular-nums text-white">${totalInvested.toLocaleString()}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Invested</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02]">
              <Calendar className="w-3.5 h-3.5 text-white/55 mx-auto mb-1" />
              <p className="font-mono text-lg font-semibold tabular-nums text-white">{dcaPlans.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Plans</p>
            </div>
          </div>

          {/* Active Plans Mini List */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Active Plans</p>
            {activePlans.slice(0, 3).map((plan) => {
              const assetsLabel = plan.assets.map(a => a.symbol).join(', ');
              const nextExec = plan.nextExecutionDate ? new Date(plan.nextExecutionDate) : null;
              const isOverdue = nextExec && nextExec <= new Date();

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                  onClick={() => navigate('/dca-planner')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--apice-emerald))]/10 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-[hsl(var(--apice-emerald))]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold tabular-nums text-white">${plan.amountPerInterval}/{plan.frequency}</p>
                      <p className="text-[11px] text-white/55 truncate">{assetsLabel}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 text-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
                        <Clock className="w-2.5 h-2.5" />
                        Due
                      </span>
                    ) : nextExec ? (
                      <span className="text-[11px] font-mono tabular-nums text-white/55">
                        Next: {nextExec.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {activePlans.length > 3 && (
              <button
                onClick={() => navigate('/dca-planner')}
                className="w-full text-center text-[11px] text-[hsl(var(--apice-emerald))] font-semibold py-1 hover:text-[hsl(var(--apice-emerald))]/80 transition-colors"
              >
                +{activePlans.length - 3} more plans
              </button>
            )}
          </div>

          {/* Recent Executions */}
          {recentExecutions.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-white/45" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Recent Executions</p>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-white/45" />
                </div>
              ) : (
                <div className="space-y-1">
                  {recentExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2">
                        {exec.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-xs font-medium text-white/85">{exec.asset_symbol}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/55">
                          ${Number(exec.amount_usdt).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-white/45">
                        {new Date(exec.executed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
