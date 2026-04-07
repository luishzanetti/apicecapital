import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMarketData } from '@/services/marketData';

export interface Transaction {
    id: string;
    asset_symbol: string;
    type: 'buy' | 'sell';
    amount: number;
    price_per_unit: number;
    date: string;
    fees: number;
}

export interface AssetHolding {
    symbol: string;
    amount: number;
    avgBuyPrice: number;
    currentPrice: number;
    currentValue: number;
    pnl: number;
    pnlPercentage: number;
    allocation: number; // percentage of total portfolio
}

export interface PortfolioMetrics {
    totalValue: number;
    totalInvested: number; // Cost basis
    totalPnL: number;
    pnlPercentage: number;
    holdings: AssetHolding[];
    loading: boolean;
}

export const usePortfolioData = () => {
    const [metrics, setMetrics] = useState<PortfolioMetrics>({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        pnlPercentage: 0,
        holdings: [],
        loading: true,
    });

    const fetchPortfolio = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setMetrics(prev => ({ ...prev, loading: false }));
                return;
            }
            const authResponse = { data: { user: session.user } };

            const user = authResponse.data.user;
            if (!user) {
                setMetrics(prev => ({ ...prev, loading: false }));
                return;
            }

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                // Treat as empty to prevent crash
                setMetrics(prev => ({ ...prev, loading: false }));
                return;
            }

            if (!transactions || transactions.length === 0) {
                setMetrics(prev => ({ ...prev, loading: false }));
                return;
            }

            // 1. Aggregate Holdings
            const holdingsMap: Record<string, { amount: number; costBasis: number }> = {};

            transactions.forEach((tx: any) => {
                const symbol = tx.asset_symbol?.toUpperCase() || 'UNKNOWN';
                if (!holdingsMap[symbol]) holdingsMap[symbol] = { amount: 0, costBasis: 0 };

                if (tx.type === 'buy') {
                    holdingsMap[symbol].amount += Number(tx.amount || 0);
                    holdingsMap[symbol].costBasis += Number(tx.amount || 0) * Number(tx.price_per_unit || 0) + Number(tx.fees || 0);
                } else {
                    const currentAmount = holdingsMap[symbol].amount;
                    if (currentAmount > 0) {
                        const reductionRatio = Number(tx.amount || 0) / currentAmount;
                        holdingsMap[symbol].costBasis -= holdingsMap[symbol].costBasis * reductionRatio;
                        holdingsMap[symbol].amount -= Number(tx.amount || 0);
                    }
                }
            });

            // 2. Fetch Current Prices
            const symbolToId: Record<string, string> = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'SOL': 'solana',
                'USDT': 'tether',
                'USDC': 'usd-coin',
            };

            const coinIds = Object.keys(holdingsMap)
                .map(sym => symbolToId[sym] || sym.toLowerCase())
                .filter(Boolean);

            let priceMap: Record<string, number> = {};
            try {
                const prices = await getMarketData(coinIds);
                prices.forEach(p => {
                    const symbol = Object.keys(symbolToId).find(key => symbolToId[key] === p.id) || p.symbol.toUpperCase();
                    priceMap[symbol] = p.current_price;
                });
            } catch {
                // Market data unavailable, prices will show as 0
            }

            // 3. Calculate Metrics
            let totalValue = 0;
            let totalInvested = 0;
            const holdings: AssetHolding[] = [];

            Object.entries(holdingsMap).forEach(([symbol, data]) => {
                if (data.amount <= 0.000001) return;

                const currentPrice = priceMap[symbol] || 0;
                const currentValue = data.amount * currentPrice;
                const pnl = currentValue - data.costBasis;
                const pnlPercentage = data.costBasis > 0 ? (pnl / data.costBasis) * 100 : 0;

                totalValue += currentValue;
                totalInvested += data.costBasis;

                holdings.push({
                    symbol,
                    amount: data.amount,
                    avgBuyPrice: data.costBasis / data.amount,
                    currentPrice,
                    currentValue,
                    pnl,
                    pnlPercentage,
                    allocation: 0
                });
            });

            // Calc allocations
            holdings.forEach(h => {
                h.allocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
            });

            setMetrics({
                totalValue,
                totalInvested,
                totalPnL: totalValue - totalInvested,
                pnlPercentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
                holdings: holdings.sort((a, b) => b.currentValue - a.currentValue),
                loading: false
            });

        } catch {
            setMetrics(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        try {
            fetchPortfolio();
            const interval = setInterval(fetchPortfolio, 60000); // Update every minute
            return () => clearInterval(interval);
        } catch {
            // Portfolio fetch failed silently; will retry on next interval
        }
    }, []);

    return { ...metrics, refresh: fetchPortfolio };
};
