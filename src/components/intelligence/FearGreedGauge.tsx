import { useMemo } from 'react';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';

const FEAR_GREED_COLORS = [
  { max: 20, color: '#dc2626', label: 'Medo Extremo' },
  { max: 40, color: '#ef4444', label: 'Medo' },
  { max: 60, color: '#eab308', label: 'Neutro' },
  { max: 80, color: '#22c55e', label: 'Ganância' },
  { max: 100, color: '#16a34a', label: 'Ganância Extrema' },
];

export function FearGreedGauge() {
  const { fearGreedValue, fearGreedLabel } = useMarketIntelligence();

  const colorInfo = useMemo(() => {
    return FEAR_GREED_COLORS.find(c => fearGreedValue <= c.max) || FEAR_GREED_COLORS[2];
  }, [fearGreedValue]);

  const rotation = useMemo(() => {
    return -90 + (fearGreedValue / 100) * 180;
  }, [fearGreedValue]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Semi-circular gauge */}
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Gradient arc segments */}
          <path d="M 5 50 A 45 45 0 0 1 23 14" fill="none" stroke="#dc2626" strokeWidth="8" strokeLinecap="round" />
          <path d="M 23 14 A 45 45 0 0 1 50 5" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
          <path d="M 50 5 A 45 45 0 0 1 77 14" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" />
          <path d="M 77 14 A 45 45 0 0 1 95 50" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          {/* Needle */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="12"
            stroke={colorInfo.color}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation}, 50, 50)`}
            className="transition-transform duration-1000"
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill={colorInfo.color} />
        </svg>
      </div>

      {/* Value and label */}
      <div className="text-center">
        <span
          className="text-2xl font-bold"
          style={{ color: colorInfo.color }}
        >
          {fearGreedValue}
        </span>
        <p className="text-xs text-zinc-400 mt-0.5">
          {colorInfo.label}
        </p>
      </div>
    </div>
  );
}
