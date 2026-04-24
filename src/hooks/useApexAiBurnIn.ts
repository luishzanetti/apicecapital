import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApexAiBurnInHealth {
  portfolio_id: string;
  portfolio_name: string;
  risk_profile: string;
  status: string;
  live_mode: boolean;
  capital_usdt: number;
  total_pnl: number;
  win_count: number;
  loss_count: number;
  last_tick_at: string | null;
  last_reconcile_at: string | null;
  reconcile_error: string | null;
  drawdown_high_water_mark: number | null;
  seconds_since_last_tick: number | null;
  seconds_since_last_reconcile: number | null;
  open_positions: number;
  active_groups: number;
  live_positions: number;
  trades_24h: number;
  pnl_24h: number;
  cycles_24h: number;
  layers_opened_24h: number;
  live_errors_24h: number;
}

/**
 * useApexAiBurnInHealth — returns the consolidated health snapshot for a
 * portfolio. Used for the burn-in monitoring UI (A6 deliverable).
 */
export function useApexAiBurnInHealth(portfolioId: string | null) {
  return useQuery({
    queryKey: ['apex-ai-burn-in-health', portfolioId],
    enabled: !!portfolioId,
    refetchInterval: 30_000, // refresh every 30s
    queryFn: async (): Promise<ApexAiBurnInHealth | null> => {
      if (!portfolioId) return null;
      const { data, error } = await supabase
        .from('apex_ai_burn_in_health')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .maybeSingle();
      if (error) throw error;
      return data as ApexAiBurnInHealth | null;
    },
  });
}
