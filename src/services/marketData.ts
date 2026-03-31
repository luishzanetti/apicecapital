import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';

export interface CoinData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    image: string;
    sparkline_in_7d?: { price: number[] };
}

// Bybit symbol mapping (CoinGecko id → Bybit symbol)
const BYBIT_SYMBOL_MAP: Record<string, string> = {
    bitcoin: 'BTCUSDT',
    ethereum: 'ETHUSDT',
    solana: 'SOLUSDT',
    binancecoin: 'BNBUSDT',
    ripple: 'XRPUSDT',
    cardano: 'ADAUSDT',
    dogecoin: 'DOGEUSDT',
    avalanche: 'AVAXUSDT',
    polkadot: 'DOTUSDT',
    chainlink: 'LINKUSDT',
    polygon: 'MATICUSDT',
    litecoin: 'LTCUSDT',
    tron: 'TRXUSDT',
    'shiba-inu': 'SHIBUSDT',
    uniswap: 'UNIUSDT',
};

// Coin metadata (icon + display name)
const COIN_META: Record<string, { name: string; image: string }> = {
    bitcoin: { name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
    ethereum: { name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    solana: { name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
    binancecoin: { name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
    ripple: { name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    cardano: { name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
    dogecoin: { name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    avalanche: { name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
    polkadot: { name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
    chainlink: { name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
    polygon: { name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
    litecoin: { name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
    tron: { name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
    'shiba-inu': { name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
    uniswap: { name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg' },
};

// Cache
let priceCache: Record<string, { data: CoinData; timestamp: number }> = {};
let topCoinsCache: { data: CoinData[]; timestamp: number } | null = null;
const CACHE_DURATION = 30_000; // 30s client-side cache

type TickerData = { lastPrice: string; price24hPcnt: string };

// ─── Edge Function fetch (preferred, server-side) ───────────

async function fetchTickersViaEdge(symbols?: string[]): Promise<Record<string, TickerData>> {
    try {
        const { data, error } = await invokeEdgeFunction('market-data', {
            body: {
                action: 'tickers',
                ...(symbols ? { symbols } : {}),
            },
        });
        if (error) throw error;
        return (data?.data as Record<string, TickerData>) || {};
    } catch (err) {
        console.warn('[marketData] Edge Function failed, falling back to direct:', err);
        return fetchBybitTickersDirect(symbols || Object.values(BYBIT_SYMBOL_MAP));
    }
}

async function fetchSingleTickerViaEdge(symbol: string): Promise<TickerData | null> {
    try {
        const { data, error } = await invokeEdgeFunction('market-data', {
            body: { action: 'ticker', symbol },
        });
        if (error) throw error;
        return (data?.data as TickerData) || null;
    } catch (err) {
        console.warn('[marketData] Edge Function single ticker failed, falling back:', err);
        return fetchBybitTickerDirect(symbol);
    }
}

// ─── Direct Bybit fetch (fallback when Supabase not configured) ─────

async function fetchBybitTickerDirect(symbol: string): Promise<TickerData | null> {
    try {
        const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`);
        if (!res.ok) return null;
        const json = await res.json();
        const item = json?.result?.list?.[0];
        if (!item) return null;
        return { lastPrice: item.lastPrice, price24hPcnt: item.price24hPcnt };
    } catch {
        return null;
    }
}

async function fetchBybitTickersDirect(symbols: string[]): Promise<Record<string, TickerData>> {
    const results: Record<string, TickerData> = {};
    try {
        const res = await fetch('https://api.bybit.com/v5/market/tickers?category=spot');
        if (!res.ok) {
            showNetworkErrorToast();
            return results;
        }
        const json = await res.json();
        const list: Array<{ symbol: string; lastPrice: string; price24hPcnt: string }> = json?.result?.list || [];
        const symbolSet = new Set(symbols);
        for (const item of list) {
            if (symbolSet.has(item.symbol)) {
                results[item.symbol] = { lastPrice: item.lastPrice, price24hPcnt: item.price24hPcnt };
            }
        }
    } catch (err) {
        console.warn('[marketData] Bybit bulk fetch failed:', err);
        showNetworkErrorToast();
    }
    return results;
}

// ─── Unified fetch layer (Edge Function → Direct fallback) ──

async function fetchTickers(symbols: string[]): Promise<Record<string, TickerData>> {
    if (isSupabaseConfigured) {
        return fetchTickersViaEdge(symbols);
    }
    return fetchBybitTickersDirect(symbols);
}

async function fetchSingleTicker(symbol: string): Promise<TickerData | null> {
    if (isSupabaseConfigured) {
        return fetchSingleTickerViaEdge(symbol);
    }
    return fetchBybitTickerDirect(symbol);
}

// ─── Helpers ─────────────────────────────────────────────────

let lastErrorToastTime = 0;

function showNetworkErrorToast() {
    const now = Date.now();
    if (now - lastErrorToastTime < 30_000) return;
    lastErrorToastTime = now;
    import('sonner').then(({ toast }) => {
        toast.error('Unable to fetch market data. Showing cached prices.', { duration: 4000 });
    }).catch(() => {});
}

function toCoinData(coinId: string, ticker: TickerData): CoinData {
    const meta = COIN_META[coinId] || { name: coinId, image: '' };
    return {
        id: coinId,
        symbol: BYBIT_SYMBOL_MAP[coinId]?.replace('USDT', '').toLowerCase() || coinId,
        name: meta.name,
        current_price: parseFloat(ticker.lastPrice),
        price_change_percentage_24h: parseFloat(ticker.price24hPcnt) * 100,
        image: meta.image,
    };
}

// ─── Public API (unchanged interface) ────────────────────────

export const getCryptoPrice = async (coinId: string): Promise<CoinData | null> => {
    const now = Date.now();
    if (priceCache[coinId] && now - priceCache[coinId].timestamp < CACHE_DURATION) {
        return priceCache[coinId].data;
    }

    const symbol = BYBIT_SYMBOL_MAP[coinId];
    if (!symbol) {
        console.warn(`[marketData] Unknown coinId: ${coinId}`);
        return null;
    }

    const ticker = await fetchSingleTicker(symbol);
    if (!ticker) return priceCache[coinId]?.data ?? null;

    const coinData = toCoinData(coinId, ticker);
    priceCache[coinId] = { data: coinData, timestamp: now };
    return coinData;
};

export const getTopMarketCoins = async (limit = 10): Promise<CoinData[]> => {
    const now = Date.now();
    if (topCoinsCache && now - topCoinsCache.timestamp < CACHE_DURATION) {
        return topCoinsCache.data.slice(0, limit);
    }

    const knownIds = Object.keys(BYBIT_SYMBOL_MAP).slice(0, limit);
    const symbols = knownIds.map(id => BYBIT_SYMBOL_MAP[id]);
    const tickers = await fetchTickers(symbols);

    const coins: CoinData[] = [];
    for (const id of knownIds) {
        const sym = BYBIT_SYMBOL_MAP[id];
        const ticker = tickers[sym];
        if (ticker) coins.push(toCoinData(id, ticker));
    }

    if (coins.length > 0) {
        topCoinsCache = { data: coins, timestamp: now };
    }
    return coins.slice(0, limit);
};

export const getMarketData = async (coinIds: string[]): Promise<CoinData[]> => {
    const now = Date.now();
    const needsFetch: string[] = [];
    const cached: CoinData[] = [];

    for (const id of coinIds) {
        if (priceCache[id] && now - priceCache[id].timestamp < CACHE_DURATION) {
            cached.push(priceCache[id].data);
        } else if (BYBIT_SYMBOL_MAP[id]) {
            needsFetch.push(id);
        }
    }

    if (needsFetch.length === 0) return cached;

    const symbols = needsFetch.map(id => BYBIT_SYMBOL_MAP[id]);
    const tickers = await fetchTickers(symbols);

    const freshData: CoinData[] = [];
    for (const id of needsFetch) {
        const sym = BYBIT_SYMBOL_MAP[id];
        const ticker = tickers[sym];
        if (ticker) {
            const coinData = toCoinData(id, ticker);
            priceCache[id] = { data: coinData, timestamp: now };
            freshData.push(coinData);
        }
    }

    return [...cached, ...freshData];
};
