import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  ApexAiLayerConfig,
  ApexAiRegimeState,
  ApexAiSymbolIntelligence,
  ApexAiAggregatedPosition,
  ApexAiStrategyEvent,
} from '@/types/apexAi';

/**
 * V2 hooks — multi-layer DCA grid + regime intelligence
 */

// ─── Layer config ─────────────────────────────────────────────

export function useApexAiLayerConfig(portfolioId: string | null) {
  return useQuery({
    queryKey: ['apex-ai-layer-config', portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_layer_config')
        .select('*')
        .eq('portfolio_id', portfolioId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ApexAiLayerConfig | null;
    },
  });
}

// ─── Regime state (per symbol) ────────────────────────────────

export function useApexAiRegime(symbols: string[]) {
  return useQuery({
    queryKey: ['apex-ai-regime', ...symbols.sort()],
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_regime_state')
        .select('*')
        .in('symbol', symbols);
      if (error) throw error;
      const map: Record<string, ApexAiRegimeState> = {};
      for (const row of data ?? []) {
        map[row.symbol] = row as ApexAiRegimeState;
      }
      return map;
    },
  });
}

// ─── Symbol intelligence ──────────────────────────────────────

export function useApexAiSymbolIntelligence(symbols: string[]) {
  return useQuery({
    queryKey: ['apex-ai-symbol-intel', ...symbols.sort()],
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_symbol_intelligence')
        .select('*')
        .in('symbol', symbols);
      if (error) throw error;
      const map: Record<string, ApexAiSymbolIntelligence> = {};
      for (const row of data ?? []) {
        map[row.symbol] = row as ApexAiSymbolIntelligence;
      }
      return map;
    },
  });
}

// ─── Aggregated positions (layer waterfall per symbol/side) ──

export function useApexAiAggregatedPositions(portfolioId: string | null) {
  return useQuery({
    queryKey: ['apex-ai-aggregated-positions', portfolioId],
    enabled: !!portfolioId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_aggregated_positions')
        .select('*')
        .eq('portfolio_id', portfolioId!);
      if (error) throw error;
      return (data ?? []) as ApexAiAggregatedPosition[];
    },
  });
}

// ─── Strategy events (timeline) ───────────────────────────────

export function useApexAiStrategyEvents(portfolioId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['apex-ai-strategy-events', portfolioId, limit],
    enabled: !!portfolioId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_strategy_events')
        .select('*')
        .eq('portfolio_id', portfolioId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ApexAiStrategyEvent[];
    },
  });
}
