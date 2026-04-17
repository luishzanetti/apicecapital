import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTopMarketCoins, type CoinData } from "@/services/marketData";
import { TrendingUp, TrendingDown, WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
function generateSparkline(price: number, change24h: number): number[] {
    const points = 12;
    const startPrice = price / (1 + change24h / 100);
    return Array.from({ length: points }, (_, i) => {
        const progress = i / (points - 1);
        const noise = (Math.sin(i * 2.5) * 0.003 + Math.cos(i * 1.7) * 0.002) * price;
        return startPrice + (price - startPrice) * progress + noise;
    });
}

function MiniSparkline({ data, isPositive, id }: { data: number[]; isPositive: boolean; id: string }) {
    const width = 64;
    const height = 24;
    const pad = 2;
    const { path, areaPath, last } = useMemo(() => {
        if (!data.length) return { path: "", areaPath: "", last: { x: 0, y: height / 2 } };
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const step = (width - pad * 2) / Math.max(data.length - 1, 1);
        const points = data.map((v, i) => {
            const x = pad + i * step;
            const y = pad + (1 - (v - min) / range) * (height - pad * 2);
            return { x, y };
        });
        const path = points
            .map((p, i) => (i === 0 ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}` : `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`))
            .join(" ");
        const areaPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;
        return { path, areaPath, last: points[points.length - 1] };
    }, [data]);

    const strokeColor = isPositive ? "#16A661" : "#F43F5E";
    const glowColor = isPositive ? "#38D68A" : "#FB7185";
    const fillColor = isPositive ? "#16A661" : "#F43F5E";
    const glowId = `sparkGlow-${id}`;
    const gradId = `sparkGrad-${id}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <defs>
                <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
            />
            <circle cx={last.x} cy={last.y} r={1.8} fill={glowColor} filter={`url(#${glowId})`} />
        </svg>
    );
}

function CoinCardSkeleton() {
    return (
        <div className="w-[160px] rounded-2xl bg-white/[0.02] p-4">
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
        </div>
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
            <div className="p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-3 pb-4">
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
            <div className="p-6 flex flex-col items-center gap-2 text-center">
                <WifiOff className="w-6 h-6 text-white/40" />
                <p className="text-sm text-white/60">Unable to load market data</p>
                <button onClick={() => window.location.reload()} className="text-xs text-[hsl(var(--apice-emerald))] font-semibold">Tap to retry</button>
            </div>
        );
    }

    return (
        <div className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Top 10 · 24h
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchCoins(true)}
                        disabled={refreshing}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                        aria-label="Refresh market data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-white/55 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--apice-emerald))] animate-pulse" />
                        Live
                    </span>
                </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-3 pb-4">
                    {coins.map((coin) => {
                        const change = coin.price_change_percentage_24h || 0;
                        const isPositive = change >= 0;
                        const sparklineData =
                            coin.sparkline_in_7d?.price?.length
                                ? coin.sparkline_in_7d.price.slice(-12)
                                : generateSparkline(coin.current_price || 0, change);

                        return (
                            <div
                                key={coin.id}
                                className="w-[160px] cursor-pointer rounded-2xl bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-all active:scale-[0.97]"
                                onClick={() => navigate(`/asset/${coin.id}`)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-white truncate max-w-[80px]">{coin.symbol.toUpperCase()}</p>
                                        <p className="text-[11px] text-white/45 truncate max-w-[80px]">{coin.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <p className="font-mono font-semibold tabular-nums text-sm text-white">
                                            ${coin.current_price?.toLocaleString() || '0.00'}
                                        </p>
                                        <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${isPositive ? 'text-[hsl(var(--apice-emerald))]' : 'text-red-400'}`}>
                                            {isPositive ? (
                                                <TrendingUp className="w-3 h-3" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3" />
                                            )}
                                            {Math.abs(change).toFixed(2)}%
                                        </div>
                                    </div>
                                    <MiniSparkline data={sparklineData} isPositive={isPositive} id={coin.id} />
                                </div>
                            </div>
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
