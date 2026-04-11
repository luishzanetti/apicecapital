import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { supabase } from '@/integrations/supabase/client';

interface WarChestStatus {
  regime: string;
  profileType: string;
  currentReservePct: number;
  currentReserveUsd: number;
  targetReservePct: number;
  deployablePct: number;
  deployableUsd: number;
  action: 'ACCUMULATE' | 'HOLD' | 'DEPLOY' | 'PARTIAL_DEPLOY';
  actionDescription: string;
  deployTargets: { asset: string; pct: number }[];
  fearGreed: number;
  explanation: string;
}

const ACTION_CONFIG = {
  ACCUMULATE: { icon: '🛡️', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Accumulating' },
  HOLD: { icon: '⏳', color: 'text-muted-foreground', bg: 'bg-secondary/10 border-border/20', label: 'Holding' },
  DEPLOY: { icon: '🚀', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 animate-pulse', label: 'DEPLOY!' },
  PARTIAL_DEPLOY: { icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Partial Deploy' },
};

export function WarChestCard() {
  const [status, setStatus] = useState<WarChestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deployResults, setDeployResults] = useState<string[]>([]);
  const { regime, logBehaviorEvent } = useMarketIntelligence();
  const { buyAsset } = useTradeExecution();
  const navigate = useNavigate();

  const fetchWarChest = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await invokeEdgeFunction<{ data: WarChestStatus }>(
        'market-intelligence',
        { body: { action: 'war-chest' } }
      );
      if (data?.data) setStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch war chest:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarChest();
  }, [fetchWarChest]);

  if (isLoading || !status) {
    return (
      <div className="glass-card rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-secondary/40 rounded w-44 mb-3" />
        <div className="h-20 bg-secondary/40 rounded" />
      </div>
    );
  }

  const config = ACTION_CONFIG[status.action];
  const isDeploy = status.action === 'DEPLOY' || status.action === 'PARTIAL_DEPLOY';
  const reserveHealth = status.currentReservePct >= status.targetReservePct ? 'healthy' : 'low';

  return (
    <div className={`rounded-xl p-4 border space-y-3 ${config.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">War Chest</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${config.color}`}>
            {status.currentReservePct}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            ${status.currentReserveUsd.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Reserve bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Current reserve</span>
          <span>Target: {status.targetReservePct}%</span>
        </div>
        <div className="w-full bg-secondary/40 rounded-full h-2.5 relative overflow-hidden">
          {/* Target marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/40 z-10"
            style={{ left: `${Math.min(status.targetReservePct, 100) / 30 * 100}%` }}
          />
          {/* Current fill */}
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isDeploy ? 'bg-gradient-to-r from-red-500 to-amber-500' :
              reserveHealth === 'healthy' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${Math.min(status.currentReservePct / 30 * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Action description */}
      <p className={`text-xs leading-relaxed ${isDeploy ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {status.actionDescription}
      </p>

      {/* Deploy targets (shown only when deploying) */}
      {isDeploy && status.deployTargets.length > 0 && (
        <div className="glass-light rounded-lg p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deploy Targets</p>
          {status.deployTargets.map((target) => (
            <div key={target.asset} className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">{target.asset}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-secondary/40 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                    style={{ width: `${target.pct}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">{target.pct}%</span>
              </div>
            </div>
          ))}
          {status.deployableUsd > 0 && (
            <p className="text-xs text-amber-300 font-medium pt-1 border-t border-border/30">
              ${status.deployableUsd.toLocaleString()} available to deploy
            </p>
          )}
        </div>
      )}

      {/* ACTION BUTTONS */}
      {isDeploy && !deployed && deployResults.length === 0 && (
        <div className="space-y-2">
          {/* Option 1: Apply to next DCA (soft deploy) */}
          <button
            onClick={async () => {
              setIsDeploying(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const allocationAdjustments: Record<string, number> = {};
                for (const target of status.deployTargets) {
                  allocationAdjustments[target.asset] = target.pct;
                }

                await supabase
                  .from('dca_plans')
                  .update({
                    smart_dca_override: {
                      adjusted_amount: status.deployableUsd,
                      allocation_adjustments: allocationAdjustments,
                      regime: status.regime,
                      applied_at: new Date().toISOString(),
                    },
                  })
                  .eq('user_id', user.id)
                  .eq('is_active', true);

                await logBehaviorEvent('war_chest_deployed', {
                  regime: status.regime, deploy_pct: status.deployablePct,
                  deploy_usd: status.deployableUsd, targets: status.deployTargets,
                  fear_greed: status.fearGreed, mode: 'next_dca',
                });
                setDeployed(true);
              } finally {
                setIsDeploying(false);
              }
            }}
            disabled={isDeploying}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-foreground active:scale-[0.98] disabled:opacity-50"
          >
            {isDeploying ? 'Deploying...' : `Deploy $${status.deployableUsd.toLocaleString()} on Next DCA`}
          </button>

          {/* Option 2: Instant deploy via market buys NOW */}
          <button
            onClick={async () => {
              setIsDeploying(true);
              const results: string[] = [];
              try {
                const regimeStr = status.regime;
                for (const target of status.deployTargets) {
                  const amountUsd = status.deployableUsd * (target.pct / 100);
                  if (amountUsd < 1) continue;
                  const result = await buyAsset(target.asset, amountUsd, 'war_chest', regimeStr);
                  results.push(result?.status === 'success'
                    ? `Bought $${amountUsd.toFixed(0)} ${target.asset}`
                    : `Failed: ${target.asset} — ${result?.error || 'unknown'}`
                  );
                }
                await logBehaviorEvent('war_chest_instant_deployed', {
                  regime: regimeStr, deploy_usd: status.deployableUsd,
                  targets: status.deployTargets, results,
                });
              } finally {
                setDeployResults(results);
                setIsDeploying(false);
              }
            }}
            disabled={isDeploying}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isDeploying ? 'Executing...' : `Instant Deploy $${status.deployableUsd.toLocaleString()} Now`}
          </button>
        </div>
      )}

      {deployResults.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deploy Results</p>
          {deployResults.map((r, i) => (
            <p key={i} className={`text-xs ${r.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>
              {r}
            </p>
          ))}
        </div>
      )}

      {deployed && (
        <div className="space-y-2">
          <div className="w-full py-3 rounded-lg text-center text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            War Chest deployed! Next DCA will execute with deploy targets.
          </div>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase
                .from('dca_plans')
                .update({ smart_dca_override: null })
                .eq('user_id', user.id)
                .eq('is_active', true);
              setDeployed(false);
            }}
            className="w-full py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel deploy
          </button>
        </div>
      )}

      {status.action === 'ACCUMULATE' && (
        <button
          onClick={() => navigate('/dca-planner')}
          className="w-full py-2.5 rounded-lg text-xs font-medium transition-all bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
        >
          Configure DCA with War Chest →
        </button>
      )}

      {/* Context line */}
      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/30">
        <span className="text-muted-foreground/60">
          Fear & Greed: <span className={status.fearGreed < 25 ? 'text-red-400' : status.fearGreed > 75 ? 'text-green-400' : 'text-muted-foreground'}>
            {status.fearGreed}
          </span>
        </span>
        <span className="text-muted-foreground/60">
          Profile: {status.profileType}
        </span>
      </div>
    </div>
  );
}
