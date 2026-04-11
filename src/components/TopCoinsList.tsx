import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTopMarketCoins, type CoinData } from "@/services/marketData";
import { TrendingUp, TrendingDown, ArrowRight, WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line } from "recharts";

function generateSparkline(price: number, change24h: number): number[] {
    const points = 12;
    const startPrice = price / (1 + change24h / 100);
    return Array.from({ length: points }, (_, i) => {
        const progress = i / (points - 1);
        const noise = (Math.sin(i * 2.5) * 0.003 + Math.cos(i * 1.7) * 0.002) * price;
        return startPrice + (price - startPrice) * progress + noise;
    });
}

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
    const chartData = useMemo(() => data.map((v) => ({ v })), [data]);
    return (
        <ResponsiveContainer width={60} height={24}>
            <LineChart data={chartData}>
                <Line
                    type="monotone"
                    dataKey="v"
                    stroke={isPositive ? '#22c55e' : '#ef4444'}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

function CoinCardSkeleton() {
    return (
        <Card className="w-[160px]">
            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-12" />
                        <Skeleton className="h-2.5 w-16" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14" />
                </div>
            </CardContent>
        </Card>
    );
}

export function TopCoinsList() {
    const [coins, setCoins] = useState<CoinData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const fetchCoins = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const data = await getTopMarketCoins(10);
            if (data.length === 0 && !isRefresh) setError(true);
            if (data.length > 0) {
                setCoins(data);
                setError(false);
            }
        } catch {
            if (!isRefresh) setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCoins();
        // Auto-refresh every 60s
        const interval = setInterval(() => fetchCoins(true), 60_000);
        return () => clearInterval(interval);
    }, [fetchCoins]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                    <div className="flex w-max space-x-4 p-1 pb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <CoinCardSkeleton key={i} />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        );
    }

    if (error && coins.length === 0) {
        return (
            <div className="p-6 rounded-2xl border border-border/30 bg-secondary/20 flex flex-col items-center gap-2 text-center">
                <WifiOff className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Unable to load market data</p>
                <button onClick={() => window.location.reload()} className="text-xs text-primary font-medium">Tap to retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold">Market Movers</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchCoins(true)}
                        disabled={refreshing}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <Badge variant="outline" className="text-xs">Live</Badge>
                </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                <div className="flex w-max space-x-4 p-1 pb-4">
                    {coins.map((coin) => {
                        const change = coin.price_change_percentage_24h || 0;
                        const isPositive = change >= 0;
                        const sparklineData =
                            coin.sparkline_in_7d?.price?.length
                                ? coin.sparkline_in_7d.price.slice(-12)
                                : generateSparkline(coin.current_price || 0, change);

                        return (
                            <Card
                                key={coin.id}
                                className="w-[160px] cursor-pointer hover:border-primary/20 hover:bg-white/[0.02] transition-all active:scale-95"
                                onClick={() => navigate(`/asset/${coin.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-bold text-sm truncate max-w-[80px]">{coin.symbol.toUpperCase()}</p>
                                            <p className="text-[11px] text-muted-foreground truncate max-w-[80px]">{coin.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm">
                                                ${coin.current_price?.toLocaleString() || '0.00'}
                                            </p>
                                            <div className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? (
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3 mr-1" />
                                                )}
                                                {Math.abs(change).toFixed(2)}%
                                            </div>
                                        </div>
                                        <MiniSparkline data={sparklineData} isPositive={isPositive} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

// Add types in marketData.ts if missing:
/*
export interface CoinData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    image: string;
    sparkline_in_7d?: { price: number[] };
}
*/
