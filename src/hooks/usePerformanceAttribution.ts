import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AssetPerformance {
  symbol: string;
  totalBought: number;
  totalSold: number;
  currentHolding: number;
  totalCostBasis: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
}

interface PortfolioPerformance {
  assets: AssetPerformance[];
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  totalPnlPct: number;
}

export function usePerformanceAttribution() {
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all buy executions from DCA
      const { data: buyExecutions } = await supabase
        .from('dca_executions')
        .select('asset_symbol, amount_usdt, quantity, price')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .not('quantity', 'is', null)
        .not('price', 'is', null);

      // Fetch all trade orders (sells)
      const { data: tradeOrders } = await supabase
        .from('trade_orders')
        .select('asset_symbol, side, fill_quantity, fill_price, amount_usdt, realized_pnl')
        .eq('user_id', user.id)
        .eq('status', 'filled');

      // Aggregate holdings per asset
      const holdings: Record<string, {
        totalBoughtQty: number; totalBoughtCost: number;
        totalSoldQty: number; totalSoldRevenue: number; realizedPnl: number;
      }> = {};

      for (const exec of (buyExecutions || [])) {
        const symbol = exec.asset_symbol.toUpperCase();
        if (!holdings[symbol]) {
          holdings[symbol] = { totalBoughtQty: 0, totalBoughtCost: 0, totalSoldQty: 0, totalSoldRevenue: 0, realizedPnl: 0 };
        }
        holdings[symbol].totalBoughtQty += exec.quantity;
        holdings[symbol].totalBoughtCost += exec.amount_usdt;
      }

      // Add buy orders from trade_orders (rebalance buys)
      for (const order of (tradeOrders || [])) {
        const symbol = order.asset_symbol.toUpperCase();
        if (!holdings[symbol]) {
          holdings[symbol] = { totalBoughtQty: 0, totalBoughtCost: 0, totalSoldQty: 0, totalSoldRevenue: 0, realizedPnl: 0 };
        }
        if (order.side === 'buy' && order.fill_quantity && order.fill_price) {
          holdings[symbol].totalBoughtQty += order.fill_quantity;
          holdings[symbol].totalBoughtCost += order.amount_usdt || (order.fill_quantity * order.fill_price);
        }
        if (order.side === 'sell' && order.fill_quantity && order.fill_price) {
          holdings[symbol].totalSoldQty += order.fill_quantity;
          holdings[symbol].totalSoldRevenue += order.fill_quantity * order.fill_price;
          holdings[symbol].realizedPnl += order.realized_pnl || 0;
        }
      }

      // Fetch current prices
      const symbols = Object.keys(holdings);
      const priceMap: Record<string, number> = {};

      try {
        const { data: marketData } = await supabase.functions.invoke('market-data', {
          body: { action: 'tickers' },
        });
        const tickers = marketData?.data || {};
        for (const symbol of symbols) {
          const ticker = tickers[symbol + 'USDT'];
          if (ticker) {
            priceMap[symbol] = parseFloat(ticker.lastPrice);
          }
        }
      } catch {
        // Fallback: skip price fetch, show cost basis only
      }

      // Calculate performance per asset
      const assets: AssetPerformance[] = [];
      let totalInvested = 0;
      let totalCurrentValue = 0;
      let totalUnrealizedPnl = 0;
      let totalRealizedPnl = 0;

      for (const [symbol, h] of Object.entries(holdings)) {
        const currentHolding = h.totalBoughtQty - h.totalSoldQty;
        if (currentHolding <= 0 && h.realizedPnl === 0) continue;

        const avgBuyPrice = h.totalBoughtQty > 0 ? h.totalBoughtCost / h.totalBoughtQty : 0;
        const currentPrice = priceMap[symbol] || 0;
        const currentValue = currentHolding * currentPrice;
        const costBasisOfHolding = currentHolding * avgBuyPrice;
        const unrealizedPnl = currentPrice > 0 ? currentValue - costBasisOfHolding : 0;
        const unrealizedPnlPct = costBasisOfHolding > 0 ? (unrealizedPnl / costBasisOfHolding) * 100 : 0;

        // Calculate realized PnL from sells if not already tracked
        let realizedPnl = h.realizedPnl;
        if (realizedPnl === 0 && h.totalSoldQty > 0) {
          realizedPnl = h.totalSoldRevenue - (h.totalSoldQty * avgBuyPrice);
        }

        assets.push({
          symbol,
          totalBought: h.totalBoughtQty,
          totalSold: h.totalSoldQty,
          currentHolding,
          totalCostBasis: costBasisOfHolding,
          avgBuyPrice,
          currentPrice,
          currentValue,
          unrealizedPnl,
          unrealizedPnlPct,
          realizedPnl,
        });

        totalInvested += h.totalBoughtCost;
        totalCurrentValue += currentValue;
        totalUnrealizedPnl += unrealizedPnl;
        totalRealizedPnl += realizedPnl;
      }

      // Sort by current value descending
      assets.sort((a, b) => b.currentValue - a.currentValue);

      const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
      const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

      setPerformance({
        assets,
        totalInvested,
        totalCurrentValue,
        totalUnrealizedPnl,
        totalRealizedPnl,
        totalPnl,
        totalPnlPct,
      });
    } catch (err) {
      console.error('[usePerformanceAttribution] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { performance, isLoading, fetchPerformance };
}
