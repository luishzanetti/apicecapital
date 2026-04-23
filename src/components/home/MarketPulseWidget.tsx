import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Snowflake, Waves } from "lucide-react";
import { getTopMarketCoins, type CoinData } from "@/services/marketData";
import { cn } from "@/lib/utils";

type Pulse = "bullish" | "neutral" | "bearish";
type Volatility = "low" | "normal" | "high";

function classifyPulse(avg24h: number): Pulse {
  if (avg24h > 1.5) return "bullish";
  if (avg24h < -1.5) return "bearish";
  return "neutral";
}

function classifyVolatility(stddev: number): Volatility {
  if (stddev > 6) return "high";
  if (stddev < 2) return "low";
  return "normal";
}

function stddev(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function MarketPulseWidget() {
  const [coins, setCoins] = useState<CoinData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getTopMarketCoins(10);
        if (!cancelled) {
          setCoins(data);
          setError(data.length === 0);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    if (!coins || coins.length === 0) {
      return null;
    }
    const changes = coins
      .map((c) => c.price_change_percentage_24h ?? 0)
      .filter((v) => Number.isFinite(v));
    const avg =
      changes.reduce((sum, v) => sum + v, 0) / (changes.length || 1);
    const spread = stddev(changes);
    const sentiment = clampScore(50 + avg * 5); // avg 10% → 100, avg -10% → 0
    const breadth =
      (changes.filter((v) => v > 0).length / (changes.length || 1)) * 100;
    return {
      avg,
      spread,
      sentiment,
      breadth: Math.round(breadth),
      pulse: classifyPulse(avg),
      volatility: classifyVolatility(spread),
    };
  }, [coins]);

  if (loading && !coins) {
    return (
      <div className="rounded-3xl glass-card p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-white/[0.05]" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    const retry = () => {
      setError(false);
      setLoading(true);
      getTopMarketCoins(10)
        .then((data) => {
          setCoins(data);
          setError(data.length === 0);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    };
    return (
      <div className="rounded-3xl glass-card p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 text-white/45 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/55">
              Market pulse
            </p>
            <p className="text-xs text-white/60 mt-0.5 truncate">
              Offline — tap retry
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={loading}
          className="shrink-0 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
        >
          {loading ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  const pulseCopy: Record<Pulse, { label: string; tone: string; glow: string }> = {
    bullish: {
      label: "Bullish tilt",
      tone: "text-[hsl(var(--apice-emerald))]",
      glow: "0 0 14px rgba(56,214,138,0.45)",
    },
    neutral: {
      label: "Neutral drift",
      tone: "text-white/70",
      glow: "0 0 14px rgba(245,181,68,0.35)",
    },
    bearish: {
      label: "Bearish tilt",
      tone: "text-rose-300",
      glow: "0 0 14px rgba(251,113,133,0.45)",
    },
  };

  const pulseInfo = pulseCopy[stats.pulse];
  const gaugeColor =
    stats.sentiment >= 60
      ? "#16A661"
      : stats.sentiment >= 40
      ? "#F5B544"
      : "#F43F5E";
  const gaugeFillPct = stats.sentiment;

  const VolIcon =
    stats.volatility === "high"
      ? Flame
      : stats.volatility === "low"
      ? Snowflake
      : Waves;
  const volLabel =
    stats.volatility === "high"
      ? "High vol"
      : stats.volatility === "low"
      ? "Calm"
      : "Normal";
  const volTone =
    stats.volatility === "high"
      ? "text-rose-300"
      : stats.volatility === "low"
      ? "text-sky-300"
      : "text-white/70";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl glass-card p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(500px at 100% 0%, ${gaugeColor}22, transparent 60%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04]"
              style={{ boxShadow: pulseInfo.glow }}
            >
              <Activity className="h-3 w-3 text-white/70" />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
              Market pulse
            </p>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-white/40">
            Top 10 \u00b7 24h
          </span>
        </div>

        {/* Gauge */}
        <div className="mt-4 flex items-end gap-5">
          <div className="relative h-[88px] w-[88px] shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <linearGradient id="pulse-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="50%" stopColor="#F5B544" />
                  <stop offset="100%" stopColor="#16A661" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#pulse-grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 42 * (1 - gaugeFillPct / 100),
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display font-mono text-2xl font-semibold tabular-nums text-white"
                style={{ textShadow: `0 0 18px ${gaugeColor}55` }}
              >
                {stats.sentiment}
              </span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-white/40">
                sentiment
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-1.5">
            <p
              className={cn(
                "font-display text-[15px] font-semibold",
                pulseInfo.tone
              )}
            >
              {pulseInfo.label}
            </p>
            <p className="text-[11px] font-mono tabular-nums text-white/55">
              Avg {stats.avg >= 0 ? "+" : ""}
              {stats.avg.toFixed(2)}% · {stats.breadth}% advancing
            </p>
            <p className="text-[10px] text-white/40">
              Updated every minute
            </p>
          </div>
        </div>

        {/* Footer badges */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <VolIcon className={cn("h-3.5 w-3.5", volTone)} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Volatility
              </span>
            </div>
            <p
              className={cn(
                "mt-1 font-display text-sm font-semibold tabular-nums",
                volTone
              )}
            >
              {volLabel}
            </p>
            <p className="text-[10px] font-mono tabular-nums text-white/40">
              σ {stats.spread.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: gaugeColor,
                  boxShadow: `0 0 6px ${gaugeColor}`,
                }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Breadth
              </span>
            </div>
            <p className="mt-1 font-display font-mono text-sm font-semibold tabular-nums text-white">
              {stats.breadth}%
            </p>
            <p className="text-[10px] font-mono tabular-nums text-white/40">
              of top 10 advancing
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
