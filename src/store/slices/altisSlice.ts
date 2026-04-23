import type { SliceCreator, AltisSlice, BotConfig, StrategyConfig } from '../types';

// ─── Helpers ────────────────────────────────────────────────

const BOTS_KEY = 'altis-bots';
const ACTIVE_BOT_KEY = 'altis-active-bot';
const OLD_STRATS_KEY = 'altis-strategies';
const OLD_CAPITAL_KEY = 'altis-total-capital';

function createBotId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `bot-${globalThis.crypto.randomUUID()}`;
  }
  return `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Slice ──────────────────────────────────────────────────

export const createAltisSlice: SliceCreator<AltisSlice> = (set, get) => ({
  bots: [],
  activeBotId: null,

  addBot: (name, capital, profile, strategies, options) => {
    const id = createBotId();
    const newBot: BotConfig = {
      id,
      name,
      capital,
      profile,
      strategies,
      createdAt: new Date().toISOString(),
      isActive: true,
      maxLeverage: options?.maxLeverage ?? 5,
      riskPerTradePct: options?.riskPerTradePct ?? 33,
      maxPositions: options?.maxPositions ?? 5,
      autoExecute: options?.autoExecute ?? true,
      selectedAssets: options?.selectedAssets ?? ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    };

    set((state) => ({
      bots: [...(Array.isArray(state.bots) ? state.bots : []), newBot],
      activeBotId: id,
    }));

    if (import.meta.env.DEV) {
      try {
        const raw =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('apice-storage')
            : null;
        const parsed = raw ? JSON.parse(raw) : null;
        console.info('[altis] addBot persisted', {
          id,
          inMemoryCount: get().bots.length,
          inStorageCount: parsed?.state?.bots?.length ?? 'missing',
        });
      } catch {
        /* ignore — dev-only assertion */
      }
    }

    return id;
  },

  removeBot: (botId) => {
    set((state) => {
      const remaining = state.bots.filter((b) => b.id !== botId);
      const newActive = state.activeBotId === botId ? (remaining[0]?.id ?? null) : state.activeBotId;
      return { bots: remaining, activeBotId: newActive };
    });
  },

  setActiveBotId: (id) => set({ activeBotId: id }),

  updateActiveBot: (updates) => {
    set((state) => {
      if (!state.activeBotId) return state;
      return {
        bots: state.bots.map((b) =>
          b.id === state.activeBotId ? { ...b, ...updates } : b
        ),
      };
    });
  },

  updateStrategies: (updater) => {
    set((state) => {
      if (!state.activeBotId && state.bots.length === 0) return state;
      const targetId = state.activeBotId ?? state.bots[0]?.id;
      if (!targetId) return state;
      return {
        bots: state.bots.map((b) =>
          b.id === targetId ? { ...b, strategies: updater(b.strategies) } : b
        ),
      };
    });
  },

  migrateFromLocalStorage: () => {
    try {
      const state = get();
      if (state.bots.length > 0) return; // already has data

      const rawBots = typeof localStorage !== 'undefined' ? localStorage.getItem(BOTS_KEY) : null;
      const rawActive = typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_BOT_KEY) : null;

      if (rawBots) {
        const parsed = JSON.parse(rawBots);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({
            bots: parsed as BotConfig[],
            activeBotId: rawActive || parsed[0]?.id || null,
          });
          return;
        }
      }

      // Legacy v1 format: flat strategies + capital
      const oldStrats = typeof localStorage !== 'undefined' ? localStorage.getItem(OLD_STRATS_KEY) : null;
      const oldCapital = typeof localStorage !== 'undefined' ? localStorage.getItem(OLD_CAPITAL_KEY) : null;
      if (oldStrats) {
        const strats = JSON.parse(oldStrats) as StrategyConfig[];
        if (Array.isArray(strats) && strats.length > 0) {
          const migrated: BotConfig = {
            id: 'bot-1',
            name: 'ALTIS Bot #1',
            capital: Number(oldCapital) || 5000,
            profile: 'balanced',
            strategies: strats,
            createdAt: new Date().toISOString(),
            isActive: true,
            maxLeverage: 5,
            riskPerTradePct: 33,
            maxPositions: 5,
            autoExecute: true,
            selectedAssets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
          };
          set({ bots: [migrated], activeBotId: migrated.id });
        }
      }
    } catch {
      // migration failed silently, fresh state will be used
    }
  },
});

// ─── Selectors ──────────────────────────────────────────────

import type { AppState } from '../types';

export const selectActiveBot = (state: AppState): BotConfig | null =>
  state.bots.find((b) => b.id === state.activeBotId) ?? state.bots[0] ?? null;

export const selectIsAltisSetupComplete = (state: AppState): boolean =>
  state.bots.length > 0 && state.bots.some((b) => b.strategies.length > 0);
