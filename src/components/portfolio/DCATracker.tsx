import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <Card className="border-dashed border-primary/20 glass-light">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">Auto-Invest with DCA</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                  Set up automated buys to build your portfolio consistently without timing the market.
                </p>
              </div>
              <Button size="sm" className="text-xs" onClick={() => navigate('/dca-planner')}>
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
      <Card className="overflow-hidden glass-card">
        {/* Gradient accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary via-violet-500 to-primary/60" />
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">DCA Automation</span>
              <Badge variant="secondary" className="text-[11px]">{activePlans.length} active</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-primary" onClick={() => navigate('/dca-planner')}>
              Manage <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 rounded-xl bg-secondary/30">
              <DollarSign className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold">${totalMonthly}</p>
              <p className="text-[11px] text-muted-foreground uppercase">Monthly</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/30">
              <TrendingUp className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-semibold">${totalInvested.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground uppercase">Total Invested</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-secondary/30">
              <Calendar className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-semibold">{dcaPlans.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase">Plans</p>
            </div>
          </div>

          {/* Active Plans Mini List */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Active Plans</p>
            {activePlans.slice(0, 3).map((plan) => {
              const assetsLabel = plan.assets.map(a => a.symbol).join(', ');
              const nextExec = plan.nextExecutionDate ? new Date(plan.nextExecutionDate) : null;
              const isOverdue = nextExec && nextExec <= new Date();

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/dca-planner')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">${plan.amountPerInterval}/{plan.frequency}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{assetsLabel}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isOverdue ? (
                      <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-400 gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Due
                      </Badge>
                    ) : nextExec ? (
                      <span className="text-[11px] text-muted-foreground">
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
                className="w-full text-center text-xs text-primary py-1"
              >
                +{activePlans.length - 3} more plans
              </button>
            )}
          </div>

          {/* Recent Executions */}
          {recentExecutions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Recent Executions</p>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {recentExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/20"
                    >
                      <div className="flex items-center gap-2">
                        {exec.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-xs font-medium">{exec.asset_symbol}</span>
                        <span className="text-[11px] text-muted-foreground">
                          ${Number(exec.amount_usdt).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
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
