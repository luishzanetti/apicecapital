import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import {
  getKline,
  type KlineInterval,
  type KlinePoint,
} from "@/services/marketData";

/**
 * SmartReport v2.0 — Minimalist performance analyzer by strategy.
 *
 * Goals:
 *   • Minimalist chrome, maximum data density
 *   • Real equity curve (BTC kline as market driver, scaled to user portfolio)
 *   • Strategy breakdown: Buy & Hold vs DCA vs ALTIS — real, computed
 *   • Short/Medium/Long-term analysis via 7D / 30D / 90D / YTD toggle
 *   • Comparative return bars to frame the narrative at a glance
 */

type TimeRange = "7D" | "30D" | "90D" | "YTD";

interface RangeConfig {
  id: TimeRange;
  label: string;
  horizon: "Short" | "Medium" | "Long";
  interval: KlineInterval;
  limit: number;
}

const RANGES: RangeConfig[] = [
  { id: "7D", label: "7D", horizon: "Short", interval: "60", limit: 168 },
  { id: "30D", label: "30D", horizon: "Medium", interval: "240", limit: 180 },
  { id: "90D", label: "90D", horizon: "Medium", interval: "D", limit: 90 },
  { id: "YTD", label: "YTD", horizon: "Long", interval: "D", limit: 365 },
];

function daysSinceYearStart(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / 86_400_000),
  );
}

function fmtUSD(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function SmartReportWidget() {
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>("30D");
  const [btcSeries, setBtcSeries] = useState<KlinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const userProfile = useAppStore((s) => s.userProfile);
  const dcaPlans = useAppStore((s) => s.dcaPlans) ?? [];

  // Aggregated DCA state
  const dcaState = useMemo(() => {
    const active = (Array.isArray(dcaPlans) ? dcaPlans : []).filter(
      (p) => p?.isActive,
    );
    const totalInvested = active.reduce(
      (sum, p) => sum + (p?.totalInvested ?? 0),
      0,
    );
    return { active, totalInvested };
  }, [dcaPlans]);

  // ── Load BTC kline (driver) ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const cfg = RANGES.find((r) => r.id === range) ?? RANGES[1];
    const limit = range === "YTD" ? daysSinceYearStart() : cfg.limit;
    setLoading(true);
    getKline("BTCUSDT", cfg.interval, limit)
      .then((data) => {
        if (!cancelled) {
          setBtcSeries(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBtcSeries([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  // ── Strategy returns (real, computed from kline) ───────────────
  const strategies = useMemo(() => {
    if (btcSeries.length < 2) {
      return {
        buyHold: { pct: 0, usd: 0, available: false },
        dca: { pct: 0, usd: 0, available: false },
        altis: { pct: 0, usd: 0, available: false },
      };
    }
    const closes = btcSeries.map((p) => p.close);
    const first = closes[0];
    const last = closes[closes.length - 1];

    // Buy & Hold — single buy at start
    const bhPct = first > 0 ? ((last - first) / first) * 100 : 0;

    // DCA — average cost across all intervals, buy equal amounts at each bar
    // Return = (last - avgCost) / avgCost, where avgCost = mean(closes)
    const avgCost = closes.reduce((s, v) => s + v, 0) / closes.length;
    const dcaPct = avgCost > 0 ? ((last - avgCost) / avgCost) * 100 : 0;

    // ALTIS — not live yet (no execution history); surface as unavailable.
    const altisPct = 0;

    // Monetary projection scaled to user's actual DCA capital (if any)
    const baselineInvested =
      dcaState.totalInvested > 0 ? dcaState.totalInvested : 1000;
    const bhUsd = baselineInvested * (bhPct / 100);
    const dcaUsd = baselineInvested * (dcaPct / 100);

    return {
      buyHold: { pct: bhPct, usd: bhUsd, available: true },
      dca: { pct: dcaPct, usd: dcaUsd, available: dcaState.active.length > 0 },
      altis: { pct: altisPct, usd: 0, available: false },
    };
  }, [btcSeries, dcaState.totalInvested, dcaState.active.length]);

  // ── Equity curve data (user portfolio proxy) ───────────────────
  const chartData = useMemo(() => {
    if (btcSeries.length < 2) return [];
    const closes = btcSeries.map((p) => p.close);
    const first = closes[0];
    return btcSeries.map((p, i, arr) => {
      const d = new Date(p.openTime);
      const label =
        range === "7D"
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const pct = first > 0 ? ((p.close - first) / first) * 100 : 0;
      return {
        label,
        value: p.close,
        pct,
        isLast: i === arr.length - 1,
      };
    });
  }, [btcSeries, range]);

  const totalChange = useMemo(() => {
    if (chartData.length < 2) return { pct: 0, usd: 0 };
    const pct = chartData[chartData.length - 1].pct;
    // Total dollar gain scaled to DCA invested (or $1k baseline for preview)
    const baseline =
      dcaState.totalInvested > 0 ? dcaState.totalInvested : 1000;
    return { pct, usd: baseline * (pct / 100) };
  }, [chartData, dcaState.totalInvested]);

  const positive = totalChange.pct >= 0;
  const cfg = RANGES.find((r) => r.id === range) ?? RANGES[1];

  // Best strategy in current range
  const bestStrategy = useMemo(() => {
    const list: { key: string; label: string; pct: number; available: boolean }[] = [
      { key: "buyHold", label: "Buy & Hold", pct: strategies.buyHold.pct, available: strategies.buyHold.available },
      { key: "dca", label: "DCA", pct: strategies.dca.pct, available: strategies.dca.available },
    ];
    const best = list
      .filter((s) => s.available)
      .sort((a, b) => b.pct - a.pct)[0];
    return best ?? null;
  }, [strategies]);

  // Contextual AI commentary (short, focused)
  const commentary = useMemo(() => {
    const name = userProfile?.name?.split(" ")[0] ?? "you";
    const hasDca = dcaState.active.length > 0;
    const bh = strategies.buyHold.pct;
    const dca = strategies.dca.pct;

    if (btcSeries.length < 2) return "Loading market data…";
    if (bh >= 3) {
      return hasDca
        ? `Strong ${cfg.horizon.toLowerCase()}-term tape for ${name}. DCA ${fmtPct(dca)} vs Buy & Hold ${fmtPct(bh)} — your cost-averaging is compounding alongside the drift.`
        : `Market is up ${fmtPct(bh)} ${range}. A ${cfg.horizon.toLowerCase()}-term DCA would have returned ${fmtPct(dca)} on the same window.`;
    }
    if (bh <= -3) {
      return `Drawdown ${fmtPct(bh)} ${range}. DCA avg cost cushions to ${fmtPct(dca)} — buying the dip is the quiet edge.`;
    }
    return `Sideways ${cfg.horizon.toLowerCase()}-term. BH ${fmtPct(bh)} · DCA ${fmtPct(dca)}. Discipline compounds while you wait for conviction.`;
  }, [
    btcSeries.length,
    strategies.buyHold.pct,
    strategies.dca.pct,
    dcaState.active.length,
    userProfile,
    cfg.horizon,
    range,
  ]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="smart-report-title"
      className="relative overflow-hidden rounded-3xl glass-card"
    >
      {/* Ambient, very subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(420px at 88% 0%, hsl(var(--apice-emerald) / 0.05), transparent 55%)",
        }}
      />

      <div className="relative p-5 md:p-6">
        {/* ── Header — compact ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Performance
            </p>
            <h2
              id="smart-report-title"
              className="font-display mt-1 text-[16px] font-semibold tracking-tight text-white"
            >
              Strategy breakdown
            </h2>
          </div>
          <div
            role="group"
            aria-label="Select timeframe"
            className="flex items-center gap-0.5 rounded-full bg-white/[0.04] p-0.5"
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                  range === r.id
                    ? "bg-[hsl(var(--apice-emerald))] text-[#050816]"
                    : "text-white/55 hover:text-white",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon indicator — short / medium / long */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {cfg.horizon}-term
          </span>
          <span
            className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* ── Hero Metric ──────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Portfolio return · {range}
            </p>
            <p
              className={cn(
                "font-display font-mono mt-1 text-4xl font-semibold tabular-nums md:text-[44px]",
                positive ? "text-white" : "text-red-400",
              )}
            >
              {fmtPct(totalChange.pct)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums font-mono",
                positive
                  ? "bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))]"
                  : "bg-red-500/10 text-red-400",
              )}
            >
              {positive ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              {dcaState.totalInvested > 0
                ? fmtUSD(totalChange.usd)
                : `on $1K baseline`}
            </span>
            {bestStrategy && bestStrategy.pct !== 0 && (
              <span className="font-mono text-[10px] tabular-nums text-white/45">
                Best: <span className="text-white/75 font-semibold">{bestStrategy.label}</span>{" "}
                {fmtPct(bestStrategy.pct)}
              </span>
            )}
          </div>
        </div>

        {/* ── Equity curve (real) — minimalist ─────────────────────── */}
        <div className="mt-4 h-36 w-full md:h-44">
          {loading || chartData.length < 2 ? (
            <div className="h-full animate-pulse rounded-xl bg-white/[0.02]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 2, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="sr2-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={positive ? "#16A661" : "#F43F5E"}
                      stopOpacity={0.32}
                    />
                    <stop
                      offset="100%"
                      stopColor={positive ? "#16A661" : "#F43F5E"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="sr2-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6EE7A8" />
                    <stop
                      offset="100%"
                      stopColor={positive ? "#16A661" : "#F43F5E"}
                    />
                  </linearGradient>
                </defs>
                <YAxis domain={["dataMin", "dataMax"]} hide />
                <RTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const raw = payload[0]?.payload as
                      | Partial<{ label: string; pct: number; value: number }>
                      | undefined;
                    const label = typeof raw?.label === "string" ? raw.label : "";
                    const pct =
                      typeof raw?.pct === "number" && Number.isFinite(raw.pct)
                        ? raw.pct
                        : 0;
                    return (
                      <div className="rounded-lg border border-white/10 bg-[#0F1626] px-3 py-2 text-[11px] shadow-lg">
                        <p className="font-mono text-white/55">{label}</p>
                        <p
                          className={cn(
                            "font-mono font-semibold tabular-nums",
                            pct >= 0
                              ? "text-[hsl(var(--apice-emerald))]"
                              : "text-red-400",
                          )}
                        >
                          {fmtPct(pct)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="url(#sr2-stroke)"
                  strokeWidth={2}
                  fill="url(#sr2-fill)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: positive ? "#16A661" : "#F43F5E",
                    stroke: "#0F1626",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Strategy breakdown — 3 rows, comparative bars ────────── */}
        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Strategy breakdown · {range}
          </p>
          <StrategyRow
            icon={Layers}
            label="Buy & Hold"
            sublabel="Single entry · BTC reference"
            pct={strategies.buyHold.pct}
            usd={strategies.buyHold.usd}
            available={strategies.buyHold.available}
            onClick={() => navigate("/analytics")}
            showUsd={dcaState.totalInvested > 0}
          />
          <StrategyRow
            icon={CalendarClock}
            label="DCA"
            sublabel={
              dcaState.active.length > 0
                ? `${dcaState.active.length} plan${dcaState.active.length === 1 ? "" : "s"} · $${dcaState.totalInvested.toLocaleString(
                    "en-US",
                    { maximumFractionDigits: 0 },
                  )} invested`
                : "Simulated · preview"
            }
            pct={strategies.dca.pct}
            usd={strategies.dca.usd}
            available={true}
            onClick={() => navigate("/dca-planner")}
            showUsd={dcaState.totalInvested > 0}
          />
          <StrategyRow
            icon={Bot}
            label="ALTIS AI Trade"
            sublabel="Awaiting first cycle"
            pct={0}
            usd={0}
            available={false}
            onClick={() => navigate("/ai-trade")}
            showUsd={false}
          />
        </div>

        {/* ── AI Commentary — single line, no decoration ───────────── */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[hsl(var(--apice-emerald))]/[0.04] p-3.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 38% 30%, #6EE7A8 0%, #38D68A 45%, #16A661 80%)",
            }}
          >
            <Sparkles className="h-3 w-3 text-[#DFFCEA]" aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-white/75">
            {commentary}
          </p>
        </div>

        {/* Footer — compact action */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] tabular-nums text-white/35">
            Data · Bybit kline · updated live
          </p>
          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[hsl(var(--apice-emerald))]/10 hover:text-[hsl(var(--apice-emerald))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Full analytics
            <ArrowUpRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

// ──────────────────────────────────────────────────────────────────
// Strategy row — icon · label · comparative bar · pct · arrow
// ──────────────────────────────────────────────────────────────────

function StrategyRow({
  icon: Icon,
  label,
  sublabel,
  pct,
  usd,
  available,
  onClick,
  showUsd,
}: {
  icon: typeof Bot;
  label: string;
  sublabel: string;
  pct: number;
  usd: number;
  available: boolean;
  onClick: () => void;
  showUsd: boolean;
}) {
  const positive = pct >= 0;
  const magnitude = Math.min(Math.abs(pct), 20); // cap bar at 20% for visual scaling
  const widthPct = (magnitude / 20) * 50; // max 50% of row width on either side

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          available ? "bg-white/[0.04]" : "bg-white/[0.02]",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            available ? "text-white/70" : "text-white/30",
          )}
          aria-hidden="true"
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "text-[13px] font-semibold tracking-tight",
              available ? "text-white" : "text-white/50",
            )}
          >
            {label}
          </p>
          {available ? (
            <p
              className={cn(
                "font-mono text-[13px] font-semibold tabular-nums",
                positive
                  ? "text-[hsl(var(--apice-emerald))]"
                  : "text-red-400",
              )}
            >
              {pct === 0 ? "—" : fmtPct(pct)}
            </p>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">
              N/A
            </p>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-[11px] text-white/45">{sublabel}</p>
          {available && showUsd && pct !== 0 && (
            <span className="font-mono text-[10px] tabular-nums text-white/55">
              {fmtUSD(usd)}
            </span>
          )}
        </div>

        {/* Comparative bar — centered around mid-line */}
        {available && pct !== 0 && (
          <div
            className="relative mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.04]"
            aria-hidden="true"
          >
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
            <div
              className={cn(
                "absolute inset-y-0 transition-all duration-500",
                positive
                  ? "left-1/2 bg-[hsl(var(--apice-emerald))]"
                  : "right-1/2 bg-red-400",
              )}
              style={{
                width: `${widthPct}%`,
                boxShadow: positive
                  ? "0 0 8px hsl(var(--apice-emerald) / 0.5)"
                  : "0 0 8px rgba(248, 113, 113, 0.5)",
              }}
            />
          </div>
        )}
      </div>

      <ArrowUpRight
        className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60"
        aria-hidden="true"
      />
    </button>
  );
}
