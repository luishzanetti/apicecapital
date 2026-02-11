import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTopMarketCoins, CoinData } from "@/services/marketData";
import { TrendingUp, TrendingDown, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function TopCoinsList() {
    const [coins, setCoins] = useState<CoinData[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const data = await getTopMarketCoins(10);
                setCoins(data);
            } catch (error) {
                console.error("Failed to fetch top coins", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoins();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold">Market Movers</h2>
                <Badge variant="outline" className="text-xs">
                    Top 10 by Market Cap
                </Badge>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                <div className="flex w-max space-x-4 p-1 pb-4">
                    {coins.map((coin) => (
                        <Card
                            key={coin.id}
                            className="w-[160px] cursor-pointer hover:border-primary/50 transition-all active:scale-95"
                            onClick={() => navigate(`/asset/${coin.id}`)} // We'll need to create this route eventually, or handle it
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[80px]">{coin.symbol.toUpperCase()}</p>
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{coin.name}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">
                                        ${coin.current_price?.toLocaleString() || '0.00'}
                                    </p>
                                    <div className={`flex items-center text-xs ${(coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {(coin.price_change_percentage_24h || 0) >= 0 ? (
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 mr-1" />
                                        )}
                                        {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
