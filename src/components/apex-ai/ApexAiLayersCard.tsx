import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import type {
  ApexAiPosition,
  ApexAiSymbolIntelligence,
} from '@/types/apexAi';

/**
 * ApexAiLayersCard — waterfall visualization of multi-layer DCA positions.
 *
 * For each symbol with active layers, shows:
 *   - Horizontal stacked bars at each layer's entry price
 *   - Current market price line crossing through
 *   - Blended average entry (highlighted)
 *   - Target exit price (blended TP)
 *   - Layers count (e.g. "3/5 active")
 *
 * This is the primary operational view — shows HOW the bot builds the
 * position progressively (CoinTech2u 10-layer style).
 */

interface LayerGroup {
  symbol: string;
  side: 'long' | 'short';
  layers: ApexAiPosition[];
  avgEntry: number;
  totalSize: number;
  totalUnrealizedPnl: number;
  currentPrice: number | null;
  targetExit: number | null;
}

export function ApexAiLayersCard({
  positions,
  intelligenceMap,
  maxLayers = 10,
}: {
  positions: ApexAiPosition[];
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>;
  maxLayers?: number;
}) {
  const groups = useMemo(
    () => groupByLayers(positions, intelligenceMap),
    [positions, intelligenceMap]
  );

  if (groups.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Active grid layers</h3>
            <p className="text-[11px] text-muted-foreground">
              Each bar = one DCA entry. Average entry line shows blended cost.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {groups.map((g, i) => (
            <motion.div
              key={`${g.symbol}-${g.side}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <LayerWaterfall group={g} maxLayers={maxLayers} />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Waterfall per symbol/side ──────────────────────────────

function LayerWaterfall({ group, maxLayers }: { group: LayerGroup; maxLayers: number }) {
  const { symbol, side, layers, avgEntry, currentPrice, targetExit, totalUnrealizedPnl } = group;

  // Price range for visualization: min entry, max entry, include current + avg + target
  const entries = layers.map((l) => Number(l.entry_price));
  const candidates = [
    ...entries,
    avgEntry,
    ...(currentPrice ? [currentPrice] : []),
    ...(targetExit ? [targetExit] : []),
  ];
  const min = Math.min(...candidates);
  const max = Math.max(...candidates);
  const range = Math.max(max - min, Number.EPSILON);

  // Compute y% for each price (0 = top, 100 = bottom)
  // For LONG: higher price = better (top = profit, bottom = loss, layers accumulate downward)
  // For SHORT: inverse — lower price = better
  const isLong = side === 'long';
  const priceToY = (p: number) => {
    const normalized = (p - min) / range;
    return isLong ? (1 - normalized) * 100 : normalized * 100;
  };

  const isProfit = totalUnrealizedPnl > 0;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {isLong ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {symbol.replace('USDT', '')}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                {isLong ? 'LONG' : 'SHORT'}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Layer {layers.length}/{maxLayers} · avg entry ${formatPrice(avgEntry)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              isProfit
                ? 'text-emerald-400'
                : totalUnrealizedPnl < 0
                ? 'text-rose-400'
                : 'text-foreground'
            }`}
          >
            {isProfit ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">unrealized</p>
        </div>
      </div>

      {/* Waterfall visual */}
      <div
        className="relative h-32 rounded-lg bg-muted/20 overflow-hidden"
        role="img"
        aria-label={`Layer waterfall for ${symbol} ${side}`}
      >
        {/* Target exit line (profit target) */}
        {targetExit && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-emerald-400/50 z-10"
            style={{ top: `${priceToY(targetExit)}%` }}
          >
            <div className="absolute right-1 top-0 translate-y-[-100%] flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <Target className="w-2.5 h-2.5" />
              TP ${formatPrice(targetExit)}
            </div>
          </div>
        )}

        {/* Current price line (the action) */}
        {currentPrice && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-foreground z-20"
            style={{ top: `${priceToY(currentPrice)}%` }}
          >
            <div className="absolute left-1 top-0 translate-y-[-100%] text-[10px] font-bold">
              NOW ${formatPrice(currentPrice)}
            </div>
          </div>
        )}

        {/* Avg entry (blended cost) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-amber-400/70 border-dashed z-10"
          style={{ top: `${priceToY(avgEntry)}%` }}
        >
          <div className="absolute right-1 top-1 text-[10px] text-amber-400 font-semibold">
            AVG ${formatPrice(avgEntry)}
          </div>
        </div>

        {/* Layer bars */}
        {layers.map((layer, i) => {
          const price = Number(layer.entry_price);
          const y = priceToY(price);
          const layerColor = getLayerColor(layer.layer_index ?? i + 1, maxLayers, isProfit);
          return (
            <motion.div
              key={layer.id}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="absolute left-0 flex items-center gap-1.5"
              style={{
                top: `${y}%`,
                transform: `translateY(-50%)`,
              }}
            >
              <div
                className={`h-1.5 rounded-r-sm ${layerColor.bar}`}
                style={{ width: `${Math.max(20, 20 + layer.layer_index * 8)}%` }}
              />
              <span className={`text-[9px] font-bold ${layerColor.text} whitespace-nowrap px-1`}>
                L{layer.layer_index ?? i + 1} · ${formatPrice(price)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Layer counter dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: maxLayers }).map((_, i) => {
          const isActive = i < layers.length;
          const layerNum = i + 1;
          const depth = layerNum / maxLayers;
          const color = isActive
            ? depth < 0.4
              ? 'bg-emerald-400'
              : depth < 0.7
              ? 'bg-amber-400'
              : 'bg-rose-400'
            : 'bg-border/40';
          return <div key={i} className={`h-1 flex-1 rounded-full ${color}`} />;
        })}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function groupByLayers(
  positions: ApexAiPosition[],
  intelligenceMap: Record<string, ApexAiSymbolIntelligence>
): LayerGroup[] {
  const groupMap = new Map<string, LayerGroup>();

  for (const p of positions) {
    const key = `${p.symbol}-${p.side}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        symbol: p.symbol,
        side: p.side,
        layers: [],
        avgEntry: 0,
        totalSize: 0,
        totalUnrealizedPnl: 0,
        currentPrice: null,
        targetExit: null,
      });
    }
    const g = groupMap.get(key)!;
    g.layers.push(p);
  }

  // Compute aggregates
  const result: LayerGroup[] = [];
  for (const g of groupMap.values()) {
    // sort layers by entry price (ascending for long, descending for short)
    g.layers.sort((a, b) => {
      const diff = Number(a.entry_price) - Number(b.entry_price);
      return g.side === 'long' ? -diff : diff;
    });

    const totalSize = g.layers.reduce((s, l) => s + Number(l.size), 0);
    const weightedEntry = g.layers.reduce(
      (s, l) => s + Number(l.entry_price) * Number(l.size),
      0
    );
    g.avgEntry = totalSize > 0 ? weightedEntry / totalSize : 0;
    g.totalSize = totalSize;
    g.totalUnrealizedPnl = g.layers.reduce((s, l) => s + Number(l.unrealized_pnl), 0);

    // Current price from intelligence or latest position's current_price
    g.currentPrice = intelligenceMap[g.symbol]?.current_price
      ? Number(intelligenceMap[g.symbol].current_price)
      : g.layers[0].current_price
      ? Number(g.layers[0].current_price)
      : null;

    // Target exit: use avg TP across layers (or the shallowest, safer)
    const tps = g.layers
      .map((l) => (l.take_profit_price ? Number(l.take_profit_price) : null))
      .filter((tp): tp is number => tp !== null);
    g.targetExit = tps.length > 0
      ? g.side === 'long'
        ? Math.min(...tps)
        : Math.max(...tps)
      : null;

    result.push(g);
  }

  // Sort: largest unrealized PnL (abs) first
  result.sort((a, b) => Math.abs(b.totalUnrealizedPnl) - Math.abs(a.totalUnrealizedPnl));

  return result;
}

function getLayerColor(layerIndex: number, maxLayers: number, isProfit: boolean) {
  const depth = layerIndex / maxLayers;
  if (depth < 0.3) {
    return {
      bar: 'bg-emerald-500/60',
      text: 'text-emerald-400',
    };
  }
  if (depth < 0.6) {
    return {
      bar: 'bg-amber-500/60',
      text: 'text-amber-400',
    };
  }
  return {
    bar: 'bg-rose-500/60',
    text: 'text-rose-400',
  };
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
}
