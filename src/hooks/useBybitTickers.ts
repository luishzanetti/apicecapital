import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to Bybit's public WebSocket `tickers.<symbol>` stream for a
 * list of perpetual/spot symbols. Returns a live map of symbol → lastPrice.
 *
 * Why: allows the UI to update `markPrice` + `unrealizedPnl` on every tick
 * without depending on a backend cron (which the ALTIS stack does not
 * currently deploy). Effectively replaces REST polling with push delivery.
 *
 * @param symbols  Bybit spot/linear symbols, e.g. ['BTCUSDT','ETHUSDT']
 * @param category 'linear' (default, USDT perps), 'spot', or 'inverse'
 */
export function useBybitTickers(
  symbols: string[],
  category: 'linear' | 'spot' | 'inverse' = 'linear',
): { prices: Record<string, number>; isLive: boolean } {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable key so effect re-runs only when the symbol set actually changes.
  const symbolsKey = symbols.slice().sort().join(',');

  useEffect(() => {
    const uniqSymbols = Array.from(new Set(symbolsKey.split(',').filter(Boolean)));
    if (uniqSymbols.length === 0) {
      setIsLive(false);
      return;
    }

    let cancelled = false;

    const endpoint =
      category === 'spot'
        ? 'wss://stream.bybit.com/v5/public/spot'
        : category === 'inverse'
          ? 'wss://stream.bybit.com/v5/public/inverse'
          : 'wss://stream.bybit.com/v5/public/linear';

    const topics = uniqSymbols.map((s) => `tickers.${s}`);

    const connect = () => {
      if (cancelled) return;
      try {
        const ws = new WebSocket(endpoint);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setIsLive(true);
          ws.send(JSON.stringify({ op: 'subscribe', args: topics }));
          if (pingRef.current) clearInterval(pingRef.current);
          pingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 'ping' }));
          }, 20_000);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const msg = JSON.parse(event.data);
            // tickers frames: { topic: 'tickers.BTCUSDT', type: 'snapshot'|'delta', data: {...} }
            const topic: string | undefined = msg?.topic;
            if (!topic?.startsWith('tickers.')) return;
            const symbol = topic.slice('tickers.'.length);
            const raw = msg?.data?.lastPrice ?? msg?.data?.markPrice;
            const price = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
            if (!Number.isFinite(price)) return;
            setPrices((prev) => (prev[symbol] === price ? prev : { ...prev, [symbol]: price }));
          } catch {
            /* ignore malformed frame */
          }
        };

        ws.onclose = () => {
          if (cancelled) return;
          setIsLive(false);
          if (pingRef.current) clearInterval(pingRef.current);
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
          reconnectRef.current = setTimeout(connect, 3_000);
        };

        ws.onerror = () => {
          /* onclose will fire right after; recovery handled there */
        };
      } catch {
        setIsLive(false);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
    };
  }, [symbolsKey, category]);

  return { prices, isLive };
}
