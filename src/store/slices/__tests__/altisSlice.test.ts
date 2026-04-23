import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/appStore';
import type { StrategyConfig } from '@/store/types';

const baseStrategy: StrategyConfig = {
  id: 'strat-1',
  strategyType: 'mean-reversion',
  isActive: true,
  allocationPct: 100,
  maxLeverage: 3,
  assets: ['BTCUSDT'],
};

describe('altisSlice — addBot (Sprint 0 hotfix)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ bots: [], activeBotId: null });
  });

  it('appends new bot to state.bots and returns its id', () => {
    const id = useAppStore
      .getState()
      .addBot('Bot A', 1000, 'balanced', [baseStrategy]);
    expect(typeof id).toBe('string');
    expect(useAppStore.getState().bots.length).toBe(1);
    expect(useAppStore.getState().bots[0].id).toBe(id);
  });

  it('sets activeBotId to the newly created bot id', () => {
    const id = useAppStore
      .getState()
      .addBot('Bot B', 500, 'conservative', [baseStrategy]);
    expect(useAppStore.getState().activeBotId).toBe(id);
  });

  it('supports multiple sequential creations', () => {
    useAppStore.getState().addBot('B1', 100, 'balanced', [baseStrategy]);
    useAppStore.getState().addBot('B2', 200, 'balanced', [baseStrategy]);
    useAppStore.getState().addBot('B3', 300, 'balanced', [baseStrategy]);
    expect(useAppStore.getState().bots.length).toBe(3);
  });

  it('defends against corrupted state where bots is not an array', () => {
    useAppStore.setState({ bots: null as unknown as never[] });
    const id = useAppStore
      .getState()
      .addBot('Bot C', 100, 'balanced', [baseStrategy]);
    const bots = useAppStore.getState().bots;
    expect(Array.isArray(bots)).toBe(true);
    expect(bots.length).toBe(1);
    expect(bots[0].id).toBe(id);
  });

  it('applies default options when not provided', () => {
    const id = useAppStore
      .getState()
      .addBot('Bot D', 1000, 'balanced', [baseStrategy]);
    const bot = useAppStore.getState().bots.find((b) => b.id === id);
    expect(bot?.maxLeverage).toBe(5);
    expect(bot?.riskPerTradePct).toBe(33);
    expect(bot?.selectedAssets).toEqual(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
  });

  it('overrides defaults when options are provided', () => {
    const id = useAppStore
      .getState()
      .addBot('Bot E', 2000, 'aggressive', [baseStrategy], {
        maxLeverage: 10,
        riskPerTradePct: 50,
        maxPositions: 8,
        autoExecute: false,
        selectedAssets: ['BTCUSDT'],
      });
    const bot = useAppStore.getState().bots.find((b) => b.id === id);
    expect(bot?.maxLeverage).toBe(10);
    expect(bot?.riskPerTradePct).toBe(50);
    expect(bot?.maxPositions).toBe(8);
    expect(bot?.autoExecute).toBe(false);
    expect(bot?.selectedAssets).toEqual(['BTCUSDT']);
  });

  it('persists bot to localStorage under apice-storage key', () => {
    const id = useAppStore
      .getState()
      .addBot('Persisted Bot', 1000, 'balanced', [baseStrategy]);

    const raw = localStorage.getItem('apice-storage');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    const persistedBots = parsed?.state?.bots;
    expect(Array.isArray(persistedBots)).toBe(true);
    expect(persistedBots.some((b: { id: string }) => b.id === id)).toBe(true);
  });

  // ─── Regression: selectedAssets & per-strategy assets survive activation ──
  //
  // Before this fix, AiTradeSetup.handleActivate looped `enableStrategy(...)`
  // AFTER `addBot(...)`, and enableStrategy hardcoded `assets: ['BTCUSDT','ETHUSDT']`,
  // silently overwriting the user's selection for every strategy.
  it('preserves per-strategy assets exactly as passed to addBot', () => {
    const customStrategies: StrategyConfig[] = [
      { id: 'local-grid', strategyType: 'grid', isActive: true, allocationPct: 40, maxLeverage: 3, assets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT'] },
      { id: 'local-mean', strategyType: 'mean_reversion', isActive: true, allocationPct: 60, maxLeverage: 3, assets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT'] },
    ];
    const id = useAppStore
      .getState()
      .addBot('Bot F', 3000, 'balanced', customStrategies, {
        selectedAssets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT'],
      });
    const bot = useAppStore.getState().bots.find((b) => b.id === id);
    expect(bot?.selectedAssets).toEqual(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT']);
    expect(bot?.strategies).toHaveLength(2);
    for (const s of bot?.strategies ?? []) {
      expect(s.assets).toEqual(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT']);
    }
  });

  // Regression: updateStrategies must not wipe bot identity / other fields
  it('updateStrategies mutates only strategies array, preserves other bot fields', () => {
    const id = useAppStore.getState().addBot('Bot G', 5000, 'balanced', [baseStrategy], {
      maxLeverage: 7,
      riskPerTradePct: 40,
    });
    const before = useAppStore.getState().bots.find((b) => b.id === id)!;

    useAppStore.getState().updateStrategies(() => [
      { ...baseStrategy, allocationPct: 100, assets: ['BTCUSDT'] },
    ]);

    const after = useAppStore.getState().bots.find((b) => b.id === id)!;
    expect(after.id).toBe(before.id);
    expect(after.name).toBe(before.name);
    expect(after.capital).toBe(before.capital);
    expect(after.maxLeverage).toBe(7);
    expect(after.riskPerTradePct).toBe(40);
    expect(after.strategies).toHaveLength(1);
    expect(after.strategies[0].assets).toEqual(['BTCUSDT']);
    expect(useAppStore.getState().bots).toHaveLength(1);
  });
});
