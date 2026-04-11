import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

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
}

const INTERVALS: Record<string, { label: string; bybitInterval: string; limit: number }> = {
  '15m': { label: '15m', bybitInterval: '15', limit: 96 },
  '1h':  { label: '1H', bybitInterval: '60', limit: 168 },
  '4h':  { label: '4H', bybitInterval: '240', limit: 120 },
  '1d':  { label: '1D', bybitInterval: 'D', limit: 90 },
};

export function CandlestickChart({
  symbol = 'BTCUSDT',
  interval: initialInterval = '1h',
  height = 300,
  positions = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeInterval, setActiveInterval] = useState(initialInterval);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
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
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
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

    // Fetch kline data from Bybit
    const intervalConfig = INTERVALS[activeInterval] || INTERVALS['1h'];

    setIsLoading(true);
    setError(null);

    fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${intervalConfig.bybitInterval}&limit=${intervalConfig.limit}`)
      .then(r => r.json())
      .then(json => {
        if (json.retCode !== 0 || !json.result?.list) {
          setError('Failed to load chart data');
          return;
        }

        // Bybit returns newest first — reverse for chart
        const candles: CandlestickData<Time>[] = json.result.list
          .reverse()
          .map((k: string[]) => ({
            time: Math.floor(parseInt(k[0]) / 1000) as Time,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
          }));

        candleSeries.setData(candles);

        // Add position markers (entry lines)
        for (const pos of positions) {
          if (pos.entryPrice) {
            candleSeries.createPriceLine({
              price: pos.entryPrice,
              color: pos.side === 'long' ? '#22c55e' : '#ef4444',
              lineWidth: 1,
              lineStyle: 2, // dashed
              axisLabelVisible: true,
              title: `${pos.side.toUpperCase()} Entry`,
            });
          }
          if (pos.takeProfitPrice) {
            candleSeries.createPriceLine({
              price: pos.takeProfitPrice,
              color: '#22c55e80',
              lineWidth: 1,
              lineStyle: 3, // dotted
              axisLabelVisible: true,
              title: 'TP',
            });
          }
          if (pos.stopLossPrice) {
            candleSeries.createPriceLine({
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
      })
      .catch(() => {
        setError('Network error');
        setIsLoading(false);
      });

    // Resize handler
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
    };
  }, [symbol, activeInterval, height, positions]);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{symbol.replace('USDT', '')}/USDT</span>
          {isLoading && <span className="text-[10px] text-muted-foreground animate-pulse">Loading...</span>}
          {error && <span className="text-[10px] text-red-400">{error}</span>}
        </div>
        {/* Interval selector */}
        <div className="flex gap-1">
          {Object.entries(INTERVALS).map(([key, { label }]) => (
            <button key={key} onClick={() => setActiveInterval(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                activeInterval === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
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
