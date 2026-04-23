import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { useAppStore } from '@/store/appStore';
import type { Transfer, TransferInput } from '@/store/types';

/**
 * useAccountTransfer — hook abstraction for Bybit inter-account transfers.
 *
 * Thin wrapper over:
 *   - transferSlice.executeTransfer  (state + network side-effects)
 *   - bybit-transfer edge function   (history fetch)
 *
 * Exposes toast notifications and a local loading flag so callers can bind to
 * buttons without touching global state directly.
 */
export function useAccountTransfer() {
  const transfers = useAppStore((s) => s.transfers);
  const isTransferring = useAppStore((s) => s.isTransferring);
  const transferError = useAppStore((s) => s.transferError);
  const executeFromStore = useAppStore((s) => s.executeTransfer);
  const fetchHistoryFromStore = useAppStore((s) => s.fetchTransferHistory);
  const clearTransferError = useAppStore((s) => s.clearTransferError);

  const [isLoading, setIsLoading] = useState(false);

  const executeTransfer = useCallback(
    async (input: TransferInput): Promise<Transfer | null> => {
      setIsLoading(true);
      try {
        const result = await executeFromStore(input);

        if (!result) {
          const message =
            useAppStore.getState().transferError || 'Transfer failed';
          toast.error(message);
          return null;
        }

        toast.success(
          `Transferred ${input.amount} ${input.coin} to ${input.toAccount}`
        );
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Transfer failed';
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [executeFromStore]
  );

  const fetchHistory = useCallback(
    async (limit = 20): Promise<Transfer[]> => {
      try {
        const { data, error } = await invokeEdgeFunction<{
          data?: Transfer[] | { transfers?: Transfer[] };
          transfers?: Transfer[];
        }>('bybit-transfer', {
          body: { action: 'history', limit },
        });

        if (error) return [];

        const payload = data?.data;
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray((payload as { transfers?: Transfer[] }).transfers)) {
          return (payload as { transfers: Transfer[] }).transfers;
        }
        if (Array.isArray(data?.transfers)) return data.transfers;
        return [];
      } catch {
        return [];
      }
    },
    []
  );

  const refreshHistory = useCallback(
    async (limit = 20) => {
      await fetchHistoryFromStore(limit);
    },
    [fetchHistoryFromStore]
  );

  // Auto-clear stale errors so subsequent attempts start fresh.
  useEffect(() => {
    return () => {
      clearTransferError();
    };
  }, [clearTransferError]);

  return {
    executeTransfer,
    fetchHistory,
    refreshHistory,
    clearError: clearTransferError,
    transfers,
    isLoading: isLoading || isTransferring,
    error: transferError,
  };
}
