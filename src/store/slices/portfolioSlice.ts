import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, PortfolioSlice, UserPortfolio } from '../types';
import { defaultSetupProgress } from '../defaults';

export const createPortfolioSlice: SliceCreator<PortfolioSlice> = (set, get) => ({
  selectedPortfolio: {
    portfolioId: null,
    allocations: [],
    selectedAt: null,
  },
  setupProgress: defaultSetupProgress,
  setupProgressPercent: 0,
  portfolioAccepted: false,
  userPortfolios: [],

  updateSetupProgress: (updates) =>
    set((state) => {
      const newProgress = { ...state.setupProgress, ...updates };
      const completed = Object.values(newProgress).filter(Boolean).length;
      const total = Object.keys(newProgress).length;
      const setupProgressPercent = Math.round((completed / total) * 100);
      return { setupProgress: newProgress, setupProgressPercent };
    }),

  setSelectedPortfolio: (portfolioId, allocations) =>
    set((state) => {
      const newSetup = { ...state.setupProgress, corePortfolioSelected: true };
      const completed = Object.values(newSetup).filter(Boolean).length;
      const total = Object.keys(newSetup).length;

      try {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          const user = session?.user;
          if (user) {
            await supabase
              .from('portfolios')
              .update({ is_selected: false })
              .eq('user_id', user.id);
            await supabase.from('portfolios').insert({
              user_id: user.id,
              name: portfolioId,
              allocations: allocations,
              is_selected: true,
              created_at: new Date().toISOString(),
            });
          }
        }).catch(() => {});
      } catch {
        // Supabase sync failed; local state is authoritative
      }

      return {
        selectedPortfolio: {
          portfolioId,
          allocations,
          selectedAt: new Date().toISOString(),
        },
        portfolioAccepted: true,
        setupProgress: newSetup,
        setupProgressPercent: Math.round((completed / total) * 100),
      };
    }),

  selectPortfolio: (portfolioId, allocations) => {
    get().setSelectedPortfolio(portfolioId, allocations);
  },

  setPortfolioAccepted: (accepted) => set({ portfolioAccepted: accepted }),

  // ─── Multi-Portfolio Management ────────────────────────────

  addPortfolio: (portfolio) => {
    const newPortfolio: UserPortfolio = {
      ...portfolio,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      totalInvested: 0,
    };
    set((state) => ({
      userPortfolios: [...state.userPortfolios, newPortfolio],
    }));

    try {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
          const user = session?.user;
        if (user) {
          await supabase.from('portfolios').insert({
            user_id: user.id,
            name: newPortfolio.name,
            allocations: newPortfolio.allocations,
            is_selected: newPortfolio.isActive,
            created_at: newPortfolio.createdAt,
          });
        }
      }).catch(() => {});
    } catch {
      // Supabase sync failed; local state is authoritative
    }
  },

  removePortfolio: (portfolioId) => {
    set((state) => ({
      userPortfolios: state.userPortfolios.filter((p) => p.id !== portfolioId),
    }));
  },

  updatePortfolio: (portfolioId, updates) => {
    set((state) => ({
      userPortfolios: state.userPortfolios.map((p) =>
        p.id === portfolioId ? { ...p, ...updates } : p
      ),
    }));
  },

  setActivePortfolio: (portfolioId) => {
    set((state) => {
      const target = state.userPortfolios.find((p) => p.id === portfolioId);
      return {
        userPortfolios: state.userPortfolios.map((p) => ({
          ...p,
          isActive: p.id === portfolioId,
        })),
        selectedPortfolio: {
          portfolioId,
          allocations: target?.allocations || [],
          selectedAt: new Date().toISOString(),
        },
      };
    });
  },
});
