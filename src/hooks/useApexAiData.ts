import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type {
  ApexAiPortfolio,
  ApexAiPosition,
  ApexAiTrade,
  ApexAiUserCredits,
  ApexAiSymbol,
} from '@/types/apexAi';

/**
 * Hooks de dados para Apex AI.
 * Usa TanStack Query para cache + Supabase Realtime para live updates.
 */

// ─── Portfolios ──────────────────────────────────────────────

export function useApexAiPortfolios() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['apex-ai-portfolios', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_portfolios')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApexAiPortfolio[];
    },
  });
}

export function useApexAiPortfolio(portfolioId: string | null) {
  return useQuery({
    queryKey: ['apex-ai-portfolio', portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_portfolios')
        .select('*')
        .eq('id', portfolioId!)
        .single();
      if (error) throw error;
      return data as ApexAiPortfolio;
    },
  });
}

// ─── Symbols ─────────────────────────────────────────────────

export function useApexAiSymbols(portfolioId: string | null) {
  return useQuery({
    queryKey: ['apex-ai-symbols', portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_symbols')
        .select('*')
        .eq('portfolio_id', portfolioId!)
        .order('allocation_pct', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApexAiSymbol[];
    },
  });
}

// ─── Positions (com Realtime) ────────────────────────────────

export function useApexAiPositions(portfolioId: string | null) {
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<ApexAiPosition[]>([]);

  const query = useQuery({
    queryKey: ['apex-ai-positions', portfolioId],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_positions')
        .select('*')
        .eq('portfolio_id', portfolioId!)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApexAiPosition[];
    },
  });

  // Sync local state with query data
  useEffect(() => {
    if (query.data) setPositions(query.data);
  }, [query.data]);

  // Realtime subscription
  useEffect(() => {
    if (!portfolioId) return;

    const channel = supabase
      .channel(`apex-ai-positions-${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apex_ai_positions',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['apex-ai-positions', portfolioId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portfolioId, queryClient]);

  return { ...query, data: positions };
}

// ─── Trades (histórico) ──────────────────────────────────────

export function useApexAiTrades(portfolioId: string | null, limit = 50) {
  return useQuery({
    queryKey: ['apex-ai-trades', portfolioId, limit],
    enabled: !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_trades')
        .select('*')
        .eq('portfolio_id', portfolioId!)
        .order('closed_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ApexAiTrade[];
    },
  });
}

// ─── User Credits ────────────────────────────────────────────

export function useApexAiCredits() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['apex-ai-credits', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apex_ai_user_credits')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      // Se não existe, retorna row default
      return (
        (data as ApexAiUserCredits) ?? {
          user_id: userId!,
          balance: 0,
          lifetime_earned: 0,
          lifetime_spent: 0,
          low_balance_threshold: 500,
          updated_at: new Date().toISOString(),
        }
      );
    },
  });
}

// ─── Stats derivados ─────────────────────────────────────────

export function useApexAiPortfolioStats(portfolioId: string | null) {
  const trades = useApexAiTrades(portfolioId, 200);
  const positions = useApexAiPositions(portfolioId);

  const data = (() => {
    if (!trades.data) return null;

    const tradesArr = trades.data;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const totalPnl = tradesArr.reduce((sum, t) => sum + Number(t.net_pnl ?? t.pnl), 0);
    const totalPnl24h = tradesArr
      .filter((t) => now - new Date(t.closed_at).getTime() < ONE_DAY)
      .reduce((sum, t) => sum + Number(t.net_pnl ?? t.pnl), 0);

    const winCount = tradesArr.filter((t) => Number(t.pnl) > 0).length;
    const lossCount = tradesArr.filter((t) => Number(t.pnl) <= 0).length;
    const winRate = tradesArr.length > 0 ? (winCount / tradesArr.length) * 100 : 0;
    const avgProfit = tradesArr.length > 0 ? totalPnl / tradesArr.length : 0;

    return {
      total_pnl: totalPnl,
      total_pnl_24h: totalPnl24h,
      win_rate: winRate,
      win_count: winCount,
      loss_count: lossCount,
      total_trades: tradesArr.length,
      open_positions: positions.data?.length ?? 0,
      avg_profit_per_trade: avgProfit,
    };
  })();

  return { data, isLoading: trades.isLoading || positions.isLoading };
}

// ─── Daily P&L Series ────────────────────────────────────────

export function useApexAiDailyPnL(portfolioId: string | null, days = 30) {
  return useQuery({
    queryKey: ['apex-ai-daily-pnl', portfolioId, days],
    enabled: !!portfolioId,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('apex_ai_trades')
        .select('closed_at, pnl, net_pnl')
        .eq('portfolio_id', portfolioId!)
        .gte('closed_at', since.toISOString())
        .order('closed_at', { ascending: true });

      if (error) throw error;

      // Agrega por dia
      const byDay = new Map<string, number>();
      (data ?? []).forEach((t: { closed_at: string; pnl: number; net_pnl?: number }) => {
        const day = t.closed_at.slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + Number(t.net_pnl ?? t.pnl));
      });

      const result: Array<{ date: string; pnl: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, pnl: byDay.get(key) ?? 0 });
      }

      return result;
    },
  });
}
