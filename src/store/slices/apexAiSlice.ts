import type { SliceCreator, ApexAiSlice, ApexAiWizardState } from '../types';

const DEFAULT_WIZARD: ApexAiWizardState = {
  step: 'exchange',
  capitalUsdt: null,
  riskProfile: null,
  lastProposal: null,
};

export const createApexAiSlice: SliceCreator<ApexAiSlice> = (set) => ({
  apexAiActivePortfolioId: null,
  apexAiWizard: { ...DEFAULT_WIZARD },
  apexAiHasViewedLanding: false,

  setApexAiActivePortfolio: (id) => set({ apexAiActivePortfolioId: id }),

  resetApexAiWizard: () => set({ apexAiWizard: { ...DEFAULT_WIZARD } }),

  updateApexAiWizard: (updates) =>
    set((state) => ({
      apexAiWizard: { ...state.apexAiWizard, ...updates },
    })),

  markApexAiLandingViewed: () => set({ apexAiHasViewedLanding: true }),
});
