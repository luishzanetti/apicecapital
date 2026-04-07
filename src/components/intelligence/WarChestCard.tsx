import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';

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
  ACCUMULATE: { icon: '🛡️', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Acumulando' },
  HOLD: { icon: '⏳', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', label: 'Em Espera' },
  DEPLOY: { icon: '🚀', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20 animate-pulse', label: 'DEPLOYAR!' },
  PARTIAL_DEPLOY: { icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Deploy Parcial' },
};

export function WarChestCard() {
  const [status, setStatus] = useState<WarChestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const { regime, logBehaviorEvent } = useMarketIntelligence();
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-zinc-800 rounded w-44 mb-3" />
        <div className="h-20 bg-zinc-800 rounded" />
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
            <h3 className="text-sm font-semibold text-white">Capital de Guerra</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${config.color}`}>
            {status.currentReservePct}%
          </p>
          <p className="text-[10px] text-zinc-500">
            ${status.currentReserveUsd.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Reserve bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Reserva atual</span>
          <span>Target: {status.targetReservePct}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 relative overflow-hidden">
          {/* Target marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-500 z-10"
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
      <p className={`text-xs leading-relaxed ${isDeploy ? 'text-white font-medium' : 'text-zinc-400'}`}>
        {status.actionDescription}
      </p>

      {/* Deploy targets (shown only when deploying) */}
      {isDeploy && status.deployTargets.length > 0 && (
        <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Destino do Deploy</p>
          {status.deployTargets.map((target) => (
            <div key={target.asset} className="flex items-center justify-between text-xs">
              <span className="text-white font-medium">{target.asset}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                    style={{ width: `${target.pct}%` }}
                  />
                </div>
                <span className="text-zinc-400 w-8 text-right">{target.pct}%</span>
              </div>
            </div>
          ))}
          {status.deployableUsd > 0 && (
            <p className="text-xs text-amber-300 font-medium pt-1 border-t border-zinc-700/50">
              ${status.deployableUsd.toLocaleString()} disponível para deploy
            </p>
          )}
        </div>
      )}

      {/* ACTION BUTTONS — 1-click execution */}
      {isDeploy && !deployed && (
        <button
          onClick={async () => {
            setIsDeploying(true);
            await logBehaviorEvent('war_chest_deployed', {
              regime: status.regime,
              deploy_pct: status.deployablePct,
              deploy_usd: status.deployableUsd,
              targets: status.deployTargets,
              fear_greed: status.fearGreed,
            });
            setDeployed(true);
            setIsDeploying(false);
          }}
          disabled={isDeploying}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white active:scale-[0.98] disabled:opacity-50"
        >
          {isDeploying ? 'Deployando...' : `Deployar $${status.deployableUsd.toLocaleString()} Agora`}
        </button>
      )}

      {deployed && (
        <div className="w-full py-3 rounded-lg text-center text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
          Deploy registrado! Aplique no seu próximo aporte DCA.
        </div>
      )}

      {status.action === 'ACCUMULATE' && (
        <button
          onClick={() => navigate('/dca-planner')}
          className="w-full py-2.5 rounded-lg text-xs font-medium transition-all bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
        >
          Configurar DCA com Capital de Guerra →
        </button>
      )}

      {/* Context line */}
      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-zinc-700/30">
        <span className="text-zinc-600">
          Fear & Greed: <span className={status.fearGreed < 25 ? 'text-red-400' : status.fearGreed > 75 ? 'text-green-400' : 'text-zinc-400'}>
            {status.fearGreed}
          </span>
        </span>
        <span className="text-zinc-600">
          Perfil: {status.profileType}
        </span>
      </div>
    </div>
  );
}
