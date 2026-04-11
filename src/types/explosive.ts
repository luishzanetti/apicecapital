// ─── Explosive Picks — AI-Powered Crypto Scoring Types ─────────────────────

export type ExplosiveSector =
  | 'defi'
  | 'l1'
  | 'l2'
  | 'ai'
  | 'gaming'
  | 'meme'
  | 'rwa'
  | 'infra';

export type ExplosiveRiskLevel = 'conservative' | 'balanced' | 'high' | 'extreme';

export type BuyMethod = 'dca' | 'lump_dip' | 'scaled_entry';

export type TimeHorizon = '3-6m' | '6-12m' | '1-2y';

export interface BuyingStrategy {
  method: BuyMethod;
  rationale: string;
  suggestedAllocation: number;
  timeHorizon: TimeHorizon;
}

export interface ExplosiveScorePillars {
  fundamental: number;     // 0-25
  momentum: number;        // 0-20
  marketPosition: number;  // 0-15
  risk: number;            // 0-15  (inverted — higher = safer)
  narrative: number;       // 0-15
  timing: number;          // 0-10
}

export interface ExplosiveCoin {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  sector: ExplosiveSector;
  currentPrice: number;
  change24h: number;
  totalScore: number;      // 0-100
  pillars: ExplosiveScorePillars;
  riskLevel: ExplosiveRiskLevel;
  rationale: string;
  buyingStrategy: BuyingStrategy;
  rawMetrics: Record<string, unknown>;
  computedAt: string;      // ISO timestamp
}

export type ExplosiveSortKey = 'score' | 'risk' | 'change24h' | 'marketCap';

export type ExplosiveFilterSector = ExplosiveSector | 'all';

// ─── Universe seed entry (for the Supabase table) ─────────────────────────

export interface ExplosiveUniverseEntry {
  coinId: string;
  symbol: string;
  name: string;
  defillamaSlug: string | null;
  bybitSymbol: string | null;
  sector: ExplosiveSector;
  isActive: boolean;
}

// ─── Profile-based recommendation config ──────────────────────────────────

export interface ExplosiveProfileConfig {
  maxRiskLevel: number;        // max risk score (1-10 scale) to show
  minFundamentalScore: number; // min fundamental pillar to include
  maxAllocationPerCoin: number; // % cap per coin
  allowedSectors: ExplosiveSector[];
  explosiveAllocationCap: number; // % cap for risk >7 coins
}

export const PROFILE_CONFIGS: Record<string, ExplosiveProfileConfig> = {
  'Conservative Builder': {
    maxRiskLevel: 5,
    minFundamentalScore: 15,
    maxAllocationPerCoin: 15,
    allowedSectors: ['defi', 'l1', 'l2', 'infra'],
    explosiveAllocationCap: 0,
  },
  'Balanced Optimizer': {
    maxRiskLevel: 7,
    minFundamentalScore: 10,
    maxAllocationPerCoin: 10,
    allowedSectors: ['defi', 'l1', 'l2', 'ai', 'gaming', 'rwa', 'infra'],
    explosiveAllocationCap: 15,
  },
  'Growth Seeker': {
    maxRiskLevel: 10,
    minFundamentalScore: 5,
    maxAllocationPerCoin: 8,
    allowedSectors: ['defi', 'l1', 'l2', 'ai', 'gaming', 'meme', 'rwa', 'infra'],
    explosiveAllocationCap: 30,
  },
};
