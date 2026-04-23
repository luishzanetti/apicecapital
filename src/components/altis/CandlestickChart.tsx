import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  ISeriesApi,
} from 'lightweight-charts';

interface Props {
  symbol?: string;
  interval?: string;
  height?: number;
  positions?: Array<{
    side: 'long' | 'short';
    entryPrice: number;
    takeProfitPrice: number | null;
    stopLossPrice: number | null;
  }>;
  /** Bybit product category — 'linear' (USDT perps) or 'spot'. Default linear. */
  category?: 'linear' | 'spot' | 'inverse';
}

const INTERVALS: Record<string, { label: string; bybitInterval: string; limit: number }> = {
  '1m':  { label: '1m', bybitInterval: '1',   limit: 120 },
  '5m':  { label: '5m', bybitInterval: '5',   limit: 120 },
  '15m': { label: '15m', bybitInterval: '15', limit: 96 },
  '1h':  { label: '1H', bybitInterval: '60', limit: 168 },
  '4h':  { label: '4H', bybitInterval: '240', limit: 120 },
  '1d':  { label: '1D', bybitInterval: 'D', limit: 90 },
};

type BybitKlineRaw = [
  string, // 0 start (ms)
  string, // 1 open
  string, // 2 high
  string, // 3 low
  string, // 4 close
  string, // 5 volume
  string, // 6 turnover
];

export function CandlestickChart({
  symbol = 'BTCUSDT',
  interval: initialInterval = '1h',
  height = 300,
  positions = [],
  category = 'linear',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeInterval, setActiveInterval] = useState(initialInterval);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  // ─── Chart lifecycle ─────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 3 },
        horzLine: { color: 'rgba(255, 255, 255, 0.1)', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.08)' },
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e80',
      wickDownColor: '#ef444480',
    });
    seriesRef.current = candleSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // ─── Data load + WebSocket subscription ──────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    const cfg = INTERVALS[activeInterval] || INTERVALS['1h'];
    let cancelled = false;
    let seededCandles: CandlestickData<Time>[] = [];

    setIsLoading(true);
    setError(null);
    setWsStatus('connecting');

    // 1) REST seed — historical candles for initial render
    fetch(
      `https://api.bybit.com/v5/market/kline?category=${category}&symbol=${symbol}&interval=${cfg.bybitInterval}&limit=${cfg.limit}`,
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.retCode !== 0 || !json.result?.list) {
          setError('Failed to load chart data');
          setIsLoading(false);
          return;
        }
        const candles: CandlestickData<Time>[] = (json.result.list as BybitKlineRaw[])
          .slice()
          .reverse()
          .map((k) => ({
            time: Math.floor(parseInt(k[0], 10) / 1000) as Time,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
          }));
        seededCandles = candles;
        series.setData(candles);
        if (candles.length > 0) setLastPrice(candles[candles.length - 1].close);

        // Overlay position lines
        for (const pos of positions) {
          if (pos.entryPrice) {
            series.createPriceLine({
              price: pos.entryPrice,
              color: pos.side === 'long' ? '#22c55e' : '#ef4444',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: `${pos.side.toUpperCase()} Entry`,
            });
          }
          if (pos.takeProfitPrice) {
            series.createPriceLine({
              price: pos.takeProfitPrice,
              color: '#22c55e80',
              lineWidth: 1,
              lineStyle: 3,
              axisLabelVisible: true,
              title: 'TP',
            });
          }
          if (pos.stopLossPrice) {
            series.createPriceLine({
              price: pos.stopLossPrice,
              color: '#ef444480',
              lineWidth: 1,
              lineStyle: 3,
              axisLabelVisible: true,
              title: 'SL',
            });
          }
        }

        chart.timeScale().fitContent();
        setIsLoading(false);

        // 2) WebSocket — subscribe after seed so the first live update
        //    cleanly merges with the historical tail.
        openWebSocket(cfg.bybitInterval);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Network error');
          setIsLoading(false);
          setWsStatus('offline');
        }
      });

    // ─── WebSocket connection manager (public, no auth) ─────
    function openWebSocket(wsInterval: string) {
      if (cancelled) return;
      const wsUrl =
        category === 'spot'
          ? 'wss://stream.bybit.com/v5/public/spot'
          : category === 'inverse'
            ? 'wss://stream.bybit.com/v5/public/inverse'
            : 'wss://stream.bybit.com/v5/public/linear';
      const topic = `kline.${wsInterval}.${symbol}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setWsStatus('live');
          ws.send(JSON.stringify({ op: 'subscribe', args: [topic] }));
          // Ping every 20s to keep the connection alive per Bybit guidance
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          pingTimerRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 'ping' }));
            }
          }, 20_000);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const msg = JSON.parse(event.data);
            // Kline push frames: { topic: 'kline.<int>.<symbol>', data: [ {...} ] }
            if (!msg?.topic?.startsWith('kline.') || !Array.isArray(msg.data)) return;
            for (const k of msg.data) {
              const close = parseFloat(k.close);
              const candle: CandlestickData<Time> = {
                time: Math.floor(Number(k.start) / 1000) as Time,
                open: parseFloat(k.open),
                high: parseFloat(k.high),
                low: parseFloat(k.low),
                close,
              };
              // `update()` either amends the in-progress candle or appends a
              // new one when `k.confirm === true` (period closed).
              series.update(candle);

              // Price flash — green tick if up, red if down
              setLastPrice((prev) => {
                if (prev !== null) {
                  if (close > prev) setPriceFlash('up');
                  else if (close < prev) setPriceFlash('down');
                  setTimeout(() => setPriceFlash(null), 400);
                }
                return close;
              });
            }
          } catch {
            /* ignore malformed frame */
          }
        };

        ws.onclose = () => {
          if (cancelled) return;
          setWsStatus('offline');
          if (pingTimerRef.current) clearInterval(pingTimerRef.current);
          // Reconnect with exponential backoff (3s initial)
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => openWebSocket(wsInterval), 3000);
        };

        ws.onerror = () => {
          /* onclose fires right after; handle recovery there */
        };
      } catch {
        setWsStatus('offline');
      }
    }

    return () => {
      cancelled = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
      // Note: we reset data by calling setData on the same series next time;
      // avoid recreating the chart instance.
      void seededCandles; // keep reference for eventual replay if needed
    };
  }, [symbol, activeInterval, positions, category]);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground">
            {symbol.replace('USDT', '')}/USDT
          </span>
          {lastPrice !== null && (
            <span
              className={`font-mono tabular-nums text-sm font-semibold transition-colors duration-200 ${
                priceFlash === 'up'
                  ? 'text-[#22c55e]'
                  : priceFlash === 'down'
                    ? 'text-[#ef4444]'
                    : 'text-foreground'
              }`}
            >
              ${lastPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          {isLoading && (
            <span className="text-[10px] text-muted-foreground animate-pulse">Loading…</span>
          )}
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          {!isLoading && !error && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                wsStatus === 'live'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : wsStatus === 'connecting'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-white/5 text-white/40'
              }`}
              title={
                wsStatus === 'live'
                  ? 'Live stream · Bybit WebSocket'
                  : wsStatus === 'connecting'
                    ? 'Connecting to live stream'
                    : 'Offline — reconnecting'
              }
            >
              <span
                className={`h-1 w-1 rounded-full ${
                  wsStatus === 'live'
                    ? 'bg-[#22c55e] animate-pulse shadow-[0_0_6px_#22c55e]'
                    : wsStatus === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-white/30'
                }`}
              />
              {wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? '…' : 'Offline'}
            </span>
          )}
        </div>
        {/* Interval selector */}
        <div className="flex gap-1">
          {Object.entries(INTERVALS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveInterval(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                activeInterval === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}
