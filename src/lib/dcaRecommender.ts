/**
 * DCA Recommender — Apice methodology distilled.
 *
 *   1. Continuous (infinite) DCA on the curated 5-asset core
 *      → BTC · ETH · SOL · UNI · USDC (war-chest fuel)
 *      Personalized by InvestorType + capital range.
 *
 *   2. A *second* recommended portfolio with different ratios + cadence so
 *      the user can run two complementary engines in parallel
 *      (e.g. weekly Core + biweekly Growth Diversifier).
 *
 *   3. Dip-Buy plans — opportunistic time-boxed bursts that intensify
 *      buying during sharp pullbacks. Apice's edge: be GREEDY when the
 *      market is fearful, in a structured way.
 *
 * All functions are pure & synchronous so they can be unit-tested and
 * later swapped for an Edge Function feed without UI changes.
 */

import type { InvestorType, UserProfile } from '@/store/types';
import type { DCAPlanKind } from '@/store/types';

// ── Types ────────────────────────────────────────────────────────────────

export type CapitalBand = 'under-200' | '200-1k' | '1k-5k' | '5k-plus';

export type DcaCadence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecommendedAllocation {
  symbol: string;
  /** percentage (0-100) of each interval purchase routed to this asset */
  allocation: number;
  /** display color reused from sampleData where possible */
  color?: string;
  /** human role label so UI can badge War Chest / Core / Growth, etc. */
  role?: 'core' | 'growth' | 'war-chest' | 'defi';
}

export interface RecommendedDcaPlan {
  id: string;
  /** which slot in the 2-plan strategy this is */
  slot: 'primary' | 'diversifier';
  label: string;
  rationale: string;
  amountPerInterval: number;
  frequency: DcaCadence;
  /** Always 'continuous' (infinite). Dip-buy plans have their own type. */
  kind: Extract<DCAPlanKind, 'continuous'>;
  durationDays: null;
  assets: RecommendedAllocation[];
}

export type DipTrigger = 'sharp_drop_5d' | 'confirmed_bear_leg' | 'manual';

export interface DipPlanTemplate {
  id: string;
  kind: Exclude<DCAPlanKind, 'continuous'>;
  label: string;
  /** short pitch shown above the CTA */
  rationale: string;
  /** how many days the burst lasts */
  durationDays: number;
  /** how often the burst buys */
  frequency: DcaCadence;
  /** multiplier applied on top of user's base weekly amount */
  intensityMultiplier: number;
  /** what the bot watches to recommend this */
  trigger: DipTrigger;
  /** which assets the burst concentrates on */
  assets: RecommendedAllocation[];
}

// ── Asset palette (kept local so the recommender is independent) ─────────

const PALETTE: Record<string, string> = {
  BTC:  'hsl(33, 100%, 50%)',
  ETH:  'hsl(217, 100%, 60%)',
  SOL:  'hsl(280, 100%, 60%)',
  UNI:  'hsl(330, 100%, 60%)',
  USDC: 'hsl(210, 100%, 55%)',
  AVAX: 'hsl(0, 100%, 60%)',
  ARB:  'hsl(210, 100%, 55%)',
  LINK: 'hsl(220, 100%, 55%)',
  MATIC: 'hsl(270, 100%, 60%)',
};

// ── Capital → suggested weekly amounts ───────────────────────────────────

const BASE_WEEKLY: Record<CapitalBand, number> = {
  'under-200': 15,
  '200-1k':    35,
  '1k-5k':     80,
  '5k-plus':   200,
};

const DIVERSIFIER_DISCOUNT = 0.6; // second plan runs at 60% of primary amount

/**
 * Map a UserProfile.capitalRange to our internal band. Defaults to 200-1k
 * so brand-new users get a sensible suggestion before completing onboarding.
 */
export function inferCapitalBand(
  profile: UserProfile | null | undefined,
  liveBalance?: number,
): CapitalBand {
  if (typeof liveBalance === 'number' && liveBalance > 0) {
    if (liveBalance < 200)  return 'under-200';
    if (liveBalance < 1000) return '200-1k';
    if (liveBalance < 5000) return '1k-5k';
    return '5k-plus';
  }
  return profile?.capitalRange ?? '200-1k';
}

// ── Primary plan blueprints by InvestorType ──────────────────────────────
//
// All include USDC explicitly — the war-chest fuel — per CEO directive.
// Allocations always sum to 100. Frequency = weekly (Apice canonical
// rhythm); the diversifier shifts to biweekly to spread execution risk.

interface Blueprint {
  label: string;
  rationale: string;
  assets: RecommendedAllocation[];
  frequency: DcaCadence;
}

const PRIMARY_BLUEPRINTS: Record<InvestorType, Blueprint> = {
  'Conservative Builder': {
    label: 'Conservative Core',
    rationale:
      'Heavier BTC/ETH base with a real USDC reserve so you can deploy on dips. Built for patience that compounds.',
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC',  allocation: 45, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 25, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'SOL',  allocation: 10, color: PALETTE.SOL,  role: 'growth' },
      { symbol: 'UNI',  allocation: 5,  color: PALETTE.UNI,  role: 'defi' },
      { symbol: 'USDC', allocation: 15, color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
  'Balanced Optimizer': {
    label: 'Balanced Core',
    rationale:
      'BTC/ETH backbone, SOL & UNI for asymmetric growth, USDC kept dry to attack drawdowns.',
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC',  allocation: 38, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 24, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'SOL',  allocation: 18, color: PALETTE.SOL,  role: 'growth' },
      { symbol: 'UNI',  allocation: 8,  color: PALETTE.UNI,  role: 'defi' },
      { symbol: 'USDC', allocation: 12, color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
  'Growth Seeker': {
    label: 'Growth Core',
    rationale:
      'Lean into SOL/UNI alpha while keeping BTC/ETH ballast and a tighter — but still meaningful — USDC reserve.',
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC',  allocation: 30, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 22, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'SOL',  allocation: 25, color: PALETTE.SOL,  role: 'growth' },
      { symbol: 'UNI',  allocation: 13, color: PALETTE.UNI,  role: 'defi' },
      { symbol: 'USDC', allocation: 10, color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
};

// ── Diversifier (slot 2) — different mix + cadence to complement slot 1 ──

const DIVERSIFIER_BLUEPRINTS: Record<InvestorType, Blueprint> = {
  'Conservative Builder': {
    label: 'Stability Plus',
    rationale:
      'Biweekly companion that doubles down on BTC/ETH and tops up the USDC reserve faster.',
    frequency: 'biweekly',
    assets: [
      { symbol: 'BTC',  allocation: 50, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 30, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'USDC', allocation: 20, color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
  'Balanced Optimizer': {
    label: 'Layered Growth',
    rationale:
      'Biweekly add-on that spreads exposure into AVAX/ARB and lifts UNI weighting — captures L1/L2/DeFi rotations.',
    frequency: 'biweekly',
    assets: [
      { symbol: 'BTC',  allocation: 25, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 20, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'AVAX', allocation: 18, color: PALETTE.AVAX, role: 'growth' },
      { symbol: 'ARB',  allocation: 15, color: PALETTE.ARB,  role: 'growth' },
      { symbol: 'UNI',  allocation: 12, color: PALETTE.UNI,  role: 'defi' },
      { symbol: 'USDC', allocation: 10, color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
  'Growth Seeker': {
    label: 'Alpha Stack',
    rationale:
      'Monthly heavier hit into SOL/AVAX with LINK as oracle backbone — for when conviction calls for chunkier deployments.',
    frequency: 'monthly',
    assets: [
      { symbol: 'SOL',  allocation: 30, color: PALETTE.SOL,  role: 'growth' },
      { symbol: 'AVAX', allocation: 22, color: PALETTE.AVAX, role: 'growth' },
      { symbol: 'BTC',  allocation: 18, color: PALETTE.BTC,  role: 'core' },
      { symbol: 'ETH',  allocation: 12, color: PALETTE.ETH,  role: 'core' },
      { symbol: 'LINK', allocation: 10, color: PALETTE.LINK, role: 'defi' },
      { symbol: 'USDC', allocation: 8,  color: PALETTE.USDC, role: 'war-chest' },
    ],
  },
};

/** Generate the two recommended infinite plans for a profile + capital. */
export function recommendDcaPlans(
  profile: UserProfile | null | undefined,
  investorType: InvestorType | null | undefined,
  liveBalance?: number,
): RecommendedDcaPlan[] {
  const type: InvestorType = investorType ?? 'Balanced Optimizer';
  const band = inferCapitalBand(profile, liveBalance);
  const baseWeekly = BASE_WEEKLY[band];

  const primaryBp = PRIMARY_BLUEPRINTS[type];
  const diversifierBp = DIVERSIFIER_BLUEPRINTS[type];

  const primary: RecommendedDcaPlan = {
    id: `rec-primary-${type.replace(/\s+/g, '-').toLowerCase()}-${band}`,
    slot: 'primary',
    label: primaryBp.label,
    rationale: primaryBp.rationale,
    amountPerInterval: baseWeekly,
    frequency: primaryBp.frequency,
    kind: 'continuous',
    durationDays: null,
    assets: primaryBp.assets,
  };

  // Diversifier amount adjusts to its cadence so total monthly outflow is
  // sensible: biweekly halves vs weekly, monthly quarters.
  const cadenceFactor =
    diversifierBp.frequency === 'biweekly' ? 1
    : diversifierBp.frequency === 'monthly' ? 1.6
    : diversifierBp.frequency === 'daily' ? 0.18
    : 1;
  const diversifierAmount = Math.max(
    10,
    Math.round(baseWeekly * DIVERSIFIER_DISCOUNT * cadenceFactor),
  );

  const diversifier: RecommendedDcaPlan = {
    id: `rec-diversifier-${type.replace(/\s+/g, '-').toLowerCase()}-${band}`,
    slot: 'diversifier',
    label: diversifierBp.label,
    rationale: diversifierBp.rationale,
    amountPerInterval: diversifierAmount,
    frequency: diversifierBp.frequency,
    kind: 'continuous',
    durationDays: null,
    assets: diversifierBp.assets,
  };

  return [primary, diversifier];
}

// ── Dip-Buy Plans ────────────────────────────────────────────────────────

/**
 * Returns the dip-buy templates the AI is willing to fire RIGHT NOW.
 * `marketRegime` will eventually come from `apex_ai_regime_state`; for now
 * the function is regime-aware via an optional hint and otherwise returns
 * both templates so the user can manually opt in.
 */
export function recommendDipPlans(opts: {
  baseWeeklyUsd: number;
  marketHint?: 'sharp_drop' | 'bear_leg' | 'neutral';
}): DipPlanTemplate[] {
  const base = Math.max(15, opts.baseWeeklyUsd || 35);

  // 7-day burst — daily buys, 1.6× the base spread across BTC/ETH/SOL.
  const burst7d: DipPlanTemplate = {
    id: 'dip-burst-7d',
    kind: 'dip_burst_7d',
    label: '7-Day Burst',
    rationale:
      'Activated when BTC drops sharply over a week. Triple-pace daily buys for 7 days into the bluechip core.',
    durationDays: 7,
    frequency: 'daily',
    intensityMultiplier: 1.6,
    trigger: 'sharp_drop_5d',
    assets: [
      { symbol: 'BTC', allocation: 55, color: PALETTE.BTC, role: 'core' },
      { symbol: 'ETH', allocation: 30, color: PALETTE.ETH, role: 'core' },
      { symbol: 'SOL', allocation: 15, color: PALETTE.SOL, role: 'growth' },
    ],
  };

  // 21-day intensive — heavy 3-week accumulation in confirmed bear legs.
  const intensive21d: DipPlanTemplate = {
    id: 'dip-intensive-21d',
    kind: 'dip_intensive_21d',
    label: '21-Day Deep Discount',
    rationale:
      'Activated in confirmed bear legs (>15% drawdown, sustained). Daily buys for 21 days — pay the discount the market is offering.',
    durationDays: 21,
    frequency: 'daily',
    intensityMultiplier: 2.4,
    trigger: 'confirmed_bear_leg',
    assets: [
      { symbol: 'BTC', allocation: 50, color: PALETTE.BTC, role: 'core' },
      { symbol: 'ETH', allocation: 28, color: PALETTE.ETH, role: 'core' },
      { symbol: 'SOL', allocation: 14, color: PALETTE.SOL, role: 'growth' },
      { symbol: 'UNI', allocation: 8,  color: PALETTE.UNI, role: 'defi' },
    ],
  };

  // Mark each template with a recommended badge given the regime hint.
  if (opts.marketHint === 'sharp_drop') {
    return [burst7d, intensive21d];
  }
  if (opts.marketHint === 'bear_leg') {
    return [intensive21d, burst7d];
  }
  return [burst7d, intensive21d];

  // Future: when marketHint = 'neutral' we may return [] to hide both,
  // but during MVP we always show them as opt-in education for the user.
  // Kept explicit so the call-site handles arrays consistently.
  void base;
}

/**
 * Translate a DipPlanTemplate + a base weekly amount into the daily
 * `amountPerInterval` actually persisted on the DCAPlan.
 */
export function dipDailyAmount(template: DipPlanTemplate, baseWeeklyUsd: number): number {
  // weekly → per-day baseline = weekly / 7
  const perDayBase = baseWeeklyUsd / 7;
  return Math.max(5, Math.round(perDayBase * template.intensityMultiplier));
}
