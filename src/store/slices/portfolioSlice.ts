import { supabase } from '@/integrations/supabase/client';
import type { SliceCreator, PortfolioSlice, SetupProgress } from '../types';
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
        supabase.auth.getUser().then(async ({ data: { user } }) => {
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
        }).catch(console.error);
      } catch (e) {
        console.error('Supabase set portfolio error', e);
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
});
