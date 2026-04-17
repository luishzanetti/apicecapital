// Transfer slice — Bybit inter-account transfer implementation
// Backed by edge function: bybit-transfer
//
// Actions supported by the edge function:
//   - { action: 'execute', fromAccount, toAccount, coin, amount, initiatedFrom }
//   - { action: 'history', limit? }
//
// The UI layer consumes this slice via `useAccountTransfer` (src/hooks/useAccountTransfer.ts).

import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import type { SliceCreator, Transfer, TransferSlice } from '../types';

export const createTransferSlice: SliceCreator<TransferSlice> = (set, get) => ({
  transfers: [],
  isTransferring: false,
  transferError: null,

  executeTransfer: async (input) => {
    set({ isTransferring: true, transferError: null });

    try {
      const { data, error } = await invokeEdgeFunction<{ data: Transfer }>(
        'bybit-transfer',
        {
          body: {
            action: 'execute',
            fromAccount: input.fromAccount,
            toAccount: input.toAccount,
            coin: input.coin,
            amount: input.amount,
            initiatedFrom: input.initiatedFrom ?? 'manual',
          },
        }
      );

      if (error) {
        throw error;
      }

      const transfer = data?.data ?? null;
      if (!transfer) {
        throw new Error('No transfer data returned from server');
      }

      // Prepend new transfer to history, keeping list bounded.
      set((state) => ({
        transfers: [transfer, ...state.transfers].slice(0, 50),
      }));

      return transfer;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown transfer error';
      set({ transferError: message });
      return null;
    } finally {
      set({ isTransferring: false });
    }
  },

  fetchTransferHistory: async (limit = 20) => {
    try {
      const { data, error } = await invokeEdgeFunction<{ data: Transfer[] }>(
        'bybit-transfer',
        {
          body: { action: 'history', limit },
        }
      );

      if (error) {
        // Non-fatal: keep prior transfers in store.
        set({ transferError: error.message });
        return;
      }

      const history = data?.data;
      if (Array.isArray(history)) {
        set({ transfers: history.slice(0, 50), transferError: null });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transfer history';
      set({ transferError: message });
    }
  },

  clearTransferError: () => set({ transferError: null }),
});

// Helper re-export for consumers that want to reference the Transfer type directly.
export type { Transfer };
