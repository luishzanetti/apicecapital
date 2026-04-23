/**
 * Strategy Intelligence — thesis, regime fit, live entry conditions, and
 * AI-adaptive guidance for each ALTIS strategy.
 *
 * Augments `src/constants/strategies.ts` (which has visual + sizing defaults)
 * with the copy and heuristics the Command Center + AI Recommendations
 * layer consume. Deterministic — no LLM calls.
 */

export type MarketRegime =
  | 'BULL'
  | 'BEAR'
  | 'SIDEWAYS'
  | 'HIGH_VOLATILITY'
  | 'UNKNOWN';

export type InvestorProfile =
  | 'Conservative Builder'
  | 'Balanced Optimizer'
  | 'Growth Seeker';

export type StrategyKey =
  | 'grid'
  | 'mean_reversion'
  | 'funding_arb'
  | 'trend_following'
  | 'ai_signal'
  | 'micro_scalp';

export interface StrategyIntelligence {
  key: StrategyKey;
  /** 1-line plain-English value prop. */
  oneLiner: string;
  /** How it works — 2-3 short paragraphs, no jargon. */
  thesis: string;
  /** Bullet list of entry triggers / rules. */
  entryTriggers: string[];
  /** Bullet list of exit triggers / risk guards. */
  exitRules: string[];
  /** How much capital each trade uses, in plain words. */
  sizingGuide: string;
  /** Regimes where this strategy historically shines. */
  thrivesIn: MarketRegime[];
  /** Regimes where this strategy struggles / should be paused. */
  strugglesIn: MarketRegime[];
  /** Expected win rate band (historical reference — backtest will override). */
  expectedWinRate: [number, number];
  /** Expected hold time per trade (plain English). */
  avgHoldTime: string;
  /** Typical edge per trade in %. */
  edgePerTrade: string;
  /** What goes wrong and how ALTIS protects. */
  riskNotes: string;
  /** Minimum capital recommended for it to be worth turning on. */
  minRecommendedCapital: number;
}

export const STRATEGY_INTELLIGENCE: Record<StrategyKey, StrategyIntelligence> = {
  grid: {
    key: 'grid',
    oneLiner: 'Turns sideways chop into steady yield.',
    thesis:
      'Places a ladder of buy orders below and sell orders above the current price. When the market oscillates inside a range, each bounce between two levels books a small profit. The strategy does not predict direction — it monetizes volatility in a bounded range. When the market breaks out trending, the outermost orders become a drag until trend following takes over.',
    entryTriggers: [
      'Regime detected as SIDEWAYS (no strong trend on BTC/ETH)',
      'Realized volatility inside grid amplitude (default ±5% from mid)',
      'Funding rate neutral (no one-sided pressure)',
    ],
    exitRules: [
      'Regime flips to BULL or BEAR — grid pauses, legacy orders close',
      'Price breaks outside the outer grid edge — max-drawdown stop',
      'Capital reallocated — cancel + rebuild at new levels',
    ],
    sizingGuide: 'Each grid level uses 1/N of strategy allocation (N = number of levels).',
    thrivesIn: ['SIDEWAYS', 'HIGH_VOLATILITY'],
    strugglesIn: ['BULL', 'BEAR'],
    expectedWinRate: [55, 72],
    avgHoldTime: '4h – 2 days per grid cycle',
    edgePerTrade: '0.3 – 0.8%',
    riskNotes:
      'The biggest failure mode is a one-directional breakout that traps orders on the losing side. ALTIS caps this with a hard stop at ±7% from entry range and auto-pauses when regime flips.',
    minRecommendedCapital: 50,
  },
  mean_reversion: {
    key: 'mean_reversion',
    oneLiner: 'Buys the dip when RSI is extreme — scientifically.',
    thesis:
      'Oversold is a statistical condition, not an opinion. When a liquid asset\'s RSI(14) on the 1h chart drops below ~30, historical data shows a high probability of a bounce in the next 4–24 hours. Mean Reversion opens a small leveraged long on that trigger, with a tight 3% stop-loss so the downside is bounded if the dip deepens.',
    entryTriggers: [
      'RSI(14) on 1h < 32 for oversold → long',
      'RSI(14) on 1h > 68 for overbought → short',
      'Volume confirmation on the candle that triggered',
      'No active position already open on the symbol',
    ],
    exitRules: [
      'RSI crosses back to neutral (45–55) → take profit',
      '3% adverse move from entry → stop loss',
      'Max hold 36h — if no bounce, exit flat',
    ],
    sizingGuide: 'Each trade risks ≤2% of strategy capital after the stop.',
    thrivesIn: ['SIDEWAYS', 'HIGH_VOLATILITY'],
    strugglesIn: ['BEAR'],
    expectedWinRate: [58, 68],
    avgHoldTime: '6 – 18 hours',
    edgePerTrade: '1.5 – 3%',
    riskNotes:
      'Can underperform in sustained downtrends — oversold stays oversold. ALTIS pauses this strategy automatically when regime classifier reports BEAR.',
    minRecommendedCapital: 30,
  },
  funding_arb: {
    key: 'funding_arb',
    oneLiner: 'Collect funding rate 3x/day with zero market exposure.',
    thesis:
      'When perpetual futures trade above spot, longs pay shorts a funding rate every 8 hours. By holding spot (long) and the perpetual (short) in equal size, your net market exposure is zero but you still collect the funding payment. Best opportunity when funding is positive and above fees (~0.01% per period).',
    entryTriggers: [
      'BTC or ETH funding rate > 0.01% (annualized > 10%)',
      'Spot + perp liquidity on both sides',
      'No extreme basis divergence between spot and perp',
    ],
    exitRules: [
      'Funding rate drops below breakeven → unwind both legs',
      'Spot/perp basis spikes > 0.5% → risk of forced unwind, exit',
    ],
    sizingGuide: 'Equal USD on spot (long) and perp (short) — true delta-neutral.',
    thrivesIn: ['BULL', 'HIGH_VOLATILITY'],
    strugglesIn: ['BEAR'],
    expectedWinRate: [85, 95],
    avgHoldTime: '1 – 14 days',
    edgePerTrade: '0.01 – 0.04% per 8h period',
    riskNotes:
      'Near risk-free, but consumes capital on both legs. Not viable below ~$200 because fees eat the edge.',
    minRecommendedCapital: 200,
  },
  trend_following: {
    key: 'trend_following',
    oneLiner: 'Rides strong trends with a simple moving-average cross.',
    thesis:
      'When the 7-period SMA crosses above the 30-period SMA on the 4h chart and price is within 2% of the crossover, we\'re early in a new upward trend. Trend Following opens long and rides it with a trailing stop. Rare but profitable setups — the edge is "few trades, big winners".',
    entryTriggers: [
      'SMA7 crosses above SMA30 on 4h → long',
      'SMA7 crosses below SMA30 → short',
      'Volume confirms the crossover (vs previous 24h avg)',
    ],
    exitRules: [
      'Trailing stop at 3% from highest close',
      'SMAs re-cross (trend exhausted) → close',
      'Circuit breaker: 5% daily drawdown on this strategy → pause',
    ],
    sizingGuide: 'Larger position (3% risk) because win-rate is low but payoff is high.',
    thrivesIn: ['BULL', 'BEAR'],
    strugglesIn: ['SIDEWAYS'],
    expectedWinRate: [40, 55],
    avgHoldTime: '2 – 10 days',
    edgePerTrade: '4 – 12%',
    riskNotes:
      'Whipsaws in sideways markets are the main loss vector. ALTIS auto-pauses when regime classifier reports SIDEWAYS.',
    minRecommendedCapital: 30,
  },
  ai_signal: {
    key: 'ai_signal',
    oneLiner: 'Claude AI reads the tape and flags high-conviction plays.',
    thesis:
      'Every 4 hours, Claude receives the full market snapshot (prices, RSI, funding, fear/greed, regime) and generates a trading signal with a conviction score and narrative rationale. Only signals with conviction ≥ 70% and approved by the risk layer are executed. This is a flexible overlay — good at spotting regime-specific opportunities the rule-based strategies miss.',
    entryTriggers: [
      'Claude conviction score ≥ 0.70',
      'Risk layer approves (heat cap, leverage, daily loss)',
      'No conflicting signal from rule-based strategies',
    ],
    exitRules: [
      'TP/SL set by Claude per-signal (typical: +3% / -2%)',
      'Max hold 48h — if thesis hasn\'t played out, exit flat',
    ],
    sizingGuide: 'Sized by Claude in proportion to conviction.',
    thrivesIn: ['BULL', 'BEAR', 'SIDEWAYS', 'HIGH_VOLATILITY'],
    strugglesIn: ['UNKNOWN'],
    expectedWinRate: [55, 72],
    avgHoldTime: '6 – 36 hours',
    edgePerTrade: '2 – 5%',
    riskNotes:
      'Model drift risk — every backtest is re-run monthly to detect degradation. If win-rate drops below 52% in a 30d window, the strategy is auto-paused pending review.',
    minRecommendedCapital: 20,
  },
  micro_scalp: {
    key: 'micro_scalp',
    oneLiner: 'High-frequency micro-wins — 0.5-2% captured repeatedly.',
    thesis:
      'Opens and closes positions within an hour, capturing small repeatable edges on liquid perpetuals. Uses multiple simultaneous positions to diversify across symbols. High win rate, tight stops, disciplined risk per trade. Based on CoinTech2U methodology.',
    entryTriggers: [
      'Volatility above 1h ATR minimum threshold',
      'Price near intraday support/resistance',
      'No slow-moving rule-based position conflicting',
    ],
    exitRules: [
      '0.8–1.5% take profit on each position',
      '0.6% stop-loss per trade (tight)',
      'Max hold 2h — forced exit if no TP',
    ],
    sizingGuide: 'Smaller per-trade size (0.5% capital) but many trades per day.',
    thrivesIn: ['HIGH_VOLATILITY', 'SIDEWAYS'],
    strugglesIn: ['UNKNOWN'],
    expectedWinRate: [62, 74],
    avgHoldTime: '30 min – 2 hours',
    edgePerTrade: '0.5 – 1.5%',
    riskNotes:
      'Fees are the main enemy. ALTIS requires a minimum 0.8% edge after fees before entering.',
    minRecommendedCapital: 50,
  },
};

// ──────────────────────────────────────────────────────────────────
// AI Recommendations — rule-based, deterministic, per strategy.
// ──────────────────────────────────────────────────────────────────

export type RecommendationTone = 'increase' | 'decrease' | 'hold' | 'pause' | 'activate';

export interface StrategyRecommendation {
  key: StrategyKey;
  tone: RecommendationTone;
  /** 1-sentence action (e.g. "Increase allocation to 40%"). */
  action: string;
  /** Short reason citing regime, capital, win-rate, or profile. */
  reason: string;
  /** 0-100 strength — used to prioritize which recs to show first. */
  confidence: number;
}

export interface RecommendationContext {
  regime: MarketRegime;
  profile: InvestorProfile | null;
  /** Total capital allocated to ALTIS, in USD. */
  capital: number;
  /** Current allocation percentage per strategy, 0–100. */
  allocations: Partial<Record<StrategyKey, number>>;
  /** Whether the strategy is currently active. */
  activeMap: Partial<Record<StrategyKey, boolean>>;
}

/**
 * Given the user context, compute a list of strategy recommendations,
 * sorted by confidence descending.
 */
export function computeStrategyRecommendations(
  ctx: RecommendationContext,
): StrategyRecommendation[] {
  const recs: StrategyRecommendation[] = [];
  const { regime, profile, capital, allocations, activeMap } = ctx;

  for (const intel of Object.values(STRATEGY_INTELLIGENCE)) {
    const alloc = allocations[intel.key] ?? 0;
    const active = activeMap[intel.key] ?? false;
    const belowMinCapital = capital > 0 && capital < intel.minRecommendedCapital;
    const thrives = intel.thrivesIn.includes(regime);
    const struggles = intel.strugglesIn.includes(regime);

    // Under-capitalized → pause recommendation
    if (alloc > 0 && belowMinCapital) {
      recs.push({
        key: intel.key,
        tone: 'pause',
        action: `Pause ${intel.oneLiner.split('.')[0].toLowerCase()}`,
        reason: `Capital $${capital.toFixed(0)} below the ~$${intel.minRecommendedCapital} minimum for this strategy — fees erode the edge.`,
        confidence: 85,
      });
      continue;
    }

    // Regime struggles → reduce or pause
    if (alloc > 5 && struggles) {
      recs.push({
        key: intel.key,
        tone: alloc > 20 ? 'decrease' : 'pause',
        action: alloc > 20
          ? `Reduce allocation (currently ${alloc}%) — regime is ${regime}`
          : `Pause until regime changes away from ${regime}`,
        reason: `Historically underperforms in ${regime} markets. Capital is better deployed elsewhere right now.`,
        confidence: 80,
      });
      continue;
    }

    // Regime thrives AND under-allocated → increase
    if (thrives && alloc < 30 && !belowMinCapital) {
      const target = profile === 'Conservative Builder' ? 30 : profile === 'Growth Seeker' ? 45 : 35;
      recs.push({
        key: intel.key,
        tone: alloc === 0 ? 'activate' : 'increase',
        action: alloc === 0
          ? `Activate and size to ${target}%`
          : `Increase allocation from ${alloc}% to ${target}%`,
        reason: `${regime} is this strategy\'s prime regime (win-rate ${intel.expectedWinRate[0]}–${intel.expectedWinRate[1]}%).`,
        confidence: 78,
      });
      continue;
    }

    // Active in neutral regime with healthy alloc → hold
    if (active && alloc > 0 && !belowMinCapital && !struggles) {
      recs.push({
        key: intel.key,
        tone: 'hold',
        action: `Hold at ${alloc}%`,
        reason: `Running efficiently in current regime. No adjustment needed.`,
        confidence: 35,
      });
    }
  }

  return recs.sort((a, b) => b.confidence - a.confidence);
}

// ──────────────────────────────────────────────────────────────────
// Regime narrative — one-liner copy for the dashboard
// ──────────────────────────────────────────────────────────────────

export function regimeDescription(regime: MarketRegime): string {
  switch (regime) {
    case 'BULL':
      return 'Strong uptrend — trend-following & AI signal favored.';
    case 'BEAR':
      return 'Strong downtrend — defensive mode, reduce longs.';
    case 'SIDEWAYS':
      return 'Range-bound — grid & mean reversion thrive.';
    case 'HIGH_VOLATILITY':
      return 'High volatility — scalping & mean reversion favored.';
    case 'UNKNOWN':
    default:
      return 'Regime still forming — conservative posture recommended.';
  }
}
