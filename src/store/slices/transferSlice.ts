// Transfer slice — Bybit inter-account transfer scaffold (Week 2)
// Backed by edge function: bybit-transfer
// Current implementation returns placeholder values; real logic lands in Week 2.

import type { SliceCreator, TransferSlice } from '../types';

export const createTransferSlice: SliceCreator<TransferSlice> = (set, _get) => ({
  transfers: [],
  isTransferring: false,
  transferError: null,

  executeTransfer: async (_input) => {
    // TODO: Week 2 — invoke bybit-transfer edge function
    // - set isTransferring=true, transferError=null
    // - call function with { action: 'transfer', fromAccount, toAccount, coin, amount, initiatedFrom }
    // - on success: prepend Transfer row into state.transfers, refresh balances
    // - on failure: set transferError = err.message
    set({ isTransferring: true, transferError: null });
    try {
      // placeholder — returns null until the real implementation exists
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown transfer error';
      set({ transferError: message });
      return null;
    } finally {
      set({ isTransferring: false });
    }
  },

  fetchTransferHistory: async (_limit) => {
    // TODO: Week 2 — select from `account_transfers` for the authenticated user, ordered desc.
    return;
  },

  clearTransferError: () => set({ transferError: null }),
});
