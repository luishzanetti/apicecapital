import type {
  SliceCreator,
  WarChestSlice,
  WarChestRecommendation,
  WarChestRecType,
} from '../types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Curated seed set so the widget renders meaningful recommendations even
// before a real backend feed is wired up. Each recommendation is time-boxed
// so the UX stays honest about market conditions changing.
function seedRecommendations(now: number): WarChestRecommendation[] {
  const make = (
    asset: string,
    amountUsdc: number,
    type: WarChestRecType,
    rationale: string,
    confidence: number,
    expectedHoldDays: number,
    expiresInHours: number,
  ): WarChestRecommendation => ({
    id: uid(`wcr-${asset.toLowerCase()}`),
    asset,
    amountUsdc,
    type,
    rationale,
    confidence,
    expectedHoldDays,
    createdAt: now,
    expiresAt: now + expiresInHours * HOUR,
    status: 'pending',
  });

  return [
    make(
      'BTC',
      400,
      'dip-buy',
      'BTC −7.4% over 5d · weekly RSI 32 · historically a high-probability bounce zone.',
      82,
      14,
      36,
    ),
    make(
      'SOL',
      250,
      'momentum',
      'SOL breaking 30d high on rising volume · Bitcoin dominance softening.',
      71,
      10,
      24,
    ),
    make(
      'ETH',
      300,
      'rebalance',
      'ETH/BTC ratio at 6-month low · mean-reversion edge favors a tactical add.',
      66,
      21,
      48,
    ),
  ];
}

export const createWarChestSlice: SliceCreator<WarChestSlice> = (set, get) => ({
  warChestMode: 'manual',
  warChestRecommendations: [],
  warChestDeployments: [],
  warChestLastSyncAt: null,

  setWarChestMode: (mode) => {
    set({ warChestMode: mode });
    if (mode === 'auto') {
      // When user opts into auto-deploy, immediately consume any pending
      // recommendations in priority order (confidence DESC). This mirrors
      // what a real autonomous bot would do at the moment the gate flips.
      const now = Date.now();
      const pending = get()
        .warChestRecommendations
        .filter((r) => r.status === 'pending' && r.expiresAt > now)
        .sort((a, b) => b.confidence - a.confidence);
      for (const rec of pending) {
        get().applyWarChestRecommendation(rec.id, 'auto');
      }
    }
  },

  applyWarChestRecommendation: (id, by = 'manual') => {
    const now = Date.now();
    const rec = get().warChestRecommendations.find((r) => r.id === id);
    if (!rec || rec.status !== 'pending') return;

    set({
      warChestRecommendations: get().warChestRecommendations.map((r) =>
        r.id === id
          ? { ...r, status: 'applied', appliedAt: now, appliedBy: by }
          : r,
      ),
      warChestDeployments: [
        {
          id: uid('wcd'),
          recommendationId: rec.id,
          asset: rec.asset,
          amountUsdc: rec.amountUsdc,
          appliedAt: now,
          appliedBy: by,
          type: rec.type,
        },
        ...get().warChestDeployments,
      ].slice(0, 50), // cap history
    });
  },

  dismissWarChestRecommendation: (id) => {
    set({
      warChestRecommendations: get().warChestRecommendations.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' } : r,
      ),
    });
  },

  refreshWarChestRecommendations: () => {
    const now = Date.now();
    const existing = get().warChestRecommendations;
    // Mark expired
    const aged = existing.map((r) =>
      r.status === 'pending' && r.expiresAt <= now
        ? { ...r, status: 'expired' as const }
        : r,
    );
    // If we have <2 fresh pending recs, top up with seeded ones (idempotent
    // by virtue of unique ids; old ones stay in history).
    const freshPending = aged.filter(
      (r) => r.status === 'pending' && r.expiresAt > now,
    );
    if (freshPending.length < 2) {
      const seeds = seedRecommendations(now);
      // Avoid duplicating an asset already pending
      const pendingAssets = new Set(freshPending.map((r) => r.asset));
      const additions = seeds.filter((s) => !pendingAssets.has(s.asset));
      set({
        warChestRecommendations: [...aged, ...additions],
        warChestLastSyncAt: now,
      });
    } else {
      set({
        warChestRecommendations: aged,
        warChestLastSyncAt: now,
      });
    }

    // If user is in auto mode, apply the new pending ones
    if (get().warChestMode === 'auto') {
      const stillPending = get()
        .warChestRecommendations
        .filter((r) => r.status === 'pending' && r.expiresAt > now)
        .sort((a, b) => b.confidence - a.confidence);
      for (const rec of stillPending) {
        get().applyWarChestRecommendation(rec.id, 'auto');
      }
    }
  },
});
