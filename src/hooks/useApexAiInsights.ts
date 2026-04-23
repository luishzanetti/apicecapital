import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useApexAiPortfolio,
  useApexAiPositions,
  useApexAiTrades,
  useApexAiCredits,
  useApexAiPortfolioStats,
} from './useApexAiData';
import {
  buildApexAiInsights,
  type ApexAiInsightsReport,
} from '@/lib/apexAi/insights';

/**
 * useApexAiInsights — returns a health + recommendations report for a
 * portfolio, computed from its current state.
 *
 * MVP uses deterministic heuristics locally. When the `apex-ai-insights`
 * Edge Function is available, the hook can be swapped to call it for an
 * LLM-powered report (richer language, scenario analysis). The interface
 * (ApexAiInsightsReport) is the same either way.
 *
 * The hook returns cached insights that refresh whenever underlying data
 * changes (TanStack Query handles invalidation).
 */
export function useApexAiInsights(portfolioId: string | null) {
  const { data: portfolio } = useApexAiPortfolio(portfolioId);
  const { data: positions } = useApexAiPositions(portfolioId);
  const { data: trades } = useApexAiTrades(portfolioId, 100);
  const { data: credits } = useApexAiCredits();
  const { data: stats } = useApexAiPortfolioStats(portfolioId);

  // Local (deterministic) insights — always computed, even without LLM
  const localInsights: ApexAiInsightsReport | null = useMemo(() => {
    if (!portfolio) return null;
    return buildApexAiInsights({
      portfolio,
      stats: stats ?? null,
      openPositions: positions ?? [],
      recentTrades: trades ?? [],
      credits: credits ?? null,
    });
  }, [portfolio, stats, positions, trades, credits]);

  // Optional: LLM-enhanced insights via Edge Function (falls back to local)
  const llmQuery = useQuery({
    queryKey: ['apex-ai-insights-llm', portfolioId, portfolio?.updated_at],
    enabled: Boolean(portfolioId && portfolio),
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'apex-ai-insights',
          {
            body: { portfolio_id: portfolioId },
          }
        );
        if (error || !data?.success) return null;
        return data.data as ApexAiInsightsReport;
      } catch {
        return null;
      }
    },
  });

  // Prefer LLM if available, else fall back to local heuristics
  const insights = llmQuery.data ?? localInsights;
  const source: 'llm' | 'local' = llmQuery.data ? 'llm' : 'local';

  return {
    data: insights,
    source,
    isLoading: llmQuery.isLoading && !localInsights,
  };
}
