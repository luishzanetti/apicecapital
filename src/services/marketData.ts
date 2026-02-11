
interface CoinData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    image: string;
}

// Cache to prevent excessive API calls
let priceCache: Record<string, { data: CoinData; timestamp: number }> = {};
const CACHE_DURATION = 60 * 1000; // 1 minute

export const getCryptoPrice = async (coinId: string): Promise<CoinData | null> => {
    const now = Date.now();
    if (priceCache[coinId] && now - priceCache[coinId].timestamp < CACHE_DURATION) {
        return priceCache[coinId].data;
    }

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`
        );

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("CoinGecko rate limit hit, using cached/fallback if available");
                if (priceCache[coinId]) return priceCache[coinId].data;
                return null;
            }
            throw new Error('Failed to fetch price');
        }

        const data = await response.json();
        if (data && data.length > 0) {
            priceCache[coinId] = { data: data[0], timestamp: now };
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching crypto price:', error);
        return null;
    }
};


export const getTopMarketCoins = async (limit = 10): Promise<CoinData[]> => {
    // Check cache first (using a special key for top list)
    const cacheKey = `top_${limit}`;
    const now = Date.now();

    // We can reuse the priceCache structure or create a list cache
    // For simplicity, let's just fetch for now, maybe add simple caching later if needed
    // But actually, we should cache the LIST itself.

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
        );

        if (!response.ok) {
            console.warn("CoinGecko limit for top coins");
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error fetching top coins:", error);
        return [];
    }
};

export const getMarketData = async (coinIds: string[]): Promise<CoinData[]> => {
    // delay to avoid rate limits if called in loop
    const results: CoinData[] = [];
    for (const id of coinIds) {
        const data = await getCryptoPrice(id);
        if (data && !results.find(c => c.id === data.id)) results.push(data);
        await new Promise(r => setTimeout(r, 1000)); // Be nice to free API
    }
    return results;
}
