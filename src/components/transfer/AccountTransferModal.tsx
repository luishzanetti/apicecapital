import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  History,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAccountTransfer } from '@/hooks/useAccountTransfer';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import type { Transfer } from '@/store/types';
import {
  ACCOUNT_OPTIONS,
  SUPPORTED_COINS,
  getAccountCoinBalance,
  type BybitAccountType,
} from './accountTypes';
import { TransferFromSelector } from './TransferFromSelector';
import { TransferToSelector } from './TransferToSelector';
import { TransferAmountInput } from './TransferAmountInput';

type Step = 'form' | 'review' | 'success';

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiatedFrom?: string;
  defaultFrom?: BybitAccountType;
  defaultTo?: BybitAccountType;
  defaultCoin?: string;
  onViewHistory?: () => void;
}

/**
 * Produce a contextual warning message when the selected accounts have
 * implications the user should acknowledge (e.g. moving funds out of DCA reserves).
 */
function buildWarning(from: BybitAccountType, to: BybitAccountType): string | null {
  if (from === 'FUND' && to !== 'FUND') {
    return 'This will move funds away from your DCA reserves (Funding wallet).';
  }
  if (from === 'UNIFIED' && to !== 'UNIFIED') {
    return 'Moving capital out of Unified may reduce AI Trade margin.';
  }
  if (from === 'CONTRACT' && to !== 'CONTRACT') {
    return 'Reducing Contract margin may liquidate open futures positions.';
  }
  return null;
}

export function AccountTransferModal({
  isOpen,
  onClose,
  initiatedFrom = 'manual',
  defaultFrom = 'SPOT',
  defaultTo = 'UNIFIED',
  defaultCoin = 'USDT',
  onViewHistory,
}: AccountTransferModalProps) {
  const { executeTransfer, isLoading } = useAccountTransfer();
  const { data: balance, refresh: refreshBalance } = useExchangeBalance();

  const [step, setStep] = useState<Step>('form');
  const [fromAccount, setFromAccount] = useState<BybitAccountType>(defaultFrom);
  const [toAccount, setToAccount] = useState<BybitAccountType>(defaultTo);
  const [coin, setCoin] = useState<string>(defaultCoin);
  const [amountInput, setAmountInput] = useState<string>('');
  const [completedTransfer, setCompletedTransfer] = useState<Transfer | null>(null);

  // Reset internal state whenever the modal opens fresh.
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFromAccount(defaultFrom);
      setToAccount(defaultTo);
      setCoin(defaultCoin);
      setAmountInput('');
      setCompletedTransfer(null);
    }
  }, [isOpen, defaultFrom, defaultTo, defaultCoin]);

  // Ensure from/to never collide — flip to next available if user picks same.
  useEffect(() => {
    if (fromAccount === toAccount) {
      const alternative = ACCOUNT_OPTIONS.find(
        (opt) => opt.value !== fromAccount
      );
      if (alternative) setToAccount(alternative.value);
    }
  }, [fromAccount, toAccount]);

  const maxAmount = useMemo(
    () => getAccountCoinBalance(balance, fromAccount, coin),
    [balance, fromAccount, coin]
  );

  const amountNumber = Number(amountInput) || 0;
  const isFormValid =
    fromAccount !== toAccount &&
    amountNumber > 0 &&
    amountNumber <= maxAmount &&
    coin.trim().length > 0;

  const warning = buildWarning(fromAccount, toAccount);

  const handleReview = () => {
    if (!isFormValid) return;
    setStep('review');
  };

  const handleConfirm = async () => {
    const transfer = await executeTransfer({
      fromAccount,
      toAccount,
      coin,
      amount: amountNumber,
      initiatedFrom,
    });

    if (transfer) {
      setCompletedTransfer(transfer);
      setStep('success');
      // Refresh balance snapshot so the next transfer sees updated funds.
      refreshBalance();
    }
  };

  const handleNewTransfer = () => {
    setStep('form');
    setAmountInput('');
    setCompletedTransfer(null);
  };

  const handleDone = () => {
    onClose();
  };

  const handleViewHistory = () => {
    onClose();
    onViewHistory?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 rounded-3xl p-0 overflow-hidden',
          'max-h-[95vh] sm:max-h-[90vh] flex flex-col',
          // Mobile fullscreen
          'max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none'
        )}
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step === 'review' && (
                <button
                  onClick={() => setStep('form')}
                  className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <DialogTitle className="text-lg font-bold tracking-tight">
                {step === 'form' && 'Transfer Funds'}
                {step === 'review' && 'Review Transfer'}
                {step === 'success' && 'Transfer Complete'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {step === 'form' &&
                'Move funds between your Bybit accounts. Transfers are instant and free.'}
              {step === 'review' && 'Confirm the details before executing.'}
              {step === 'success' && 'Your funds are now available in the destination account.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <TransferFromSelector
                  value={fromAccount}
                  coin={coin}
                  balance={balance}
                  onChange={setFromAccount}
                  disabled={isLoading}
                />

                <TransferToSelector
                  value={toAccount}
                  coin={coin}
                  balance={balance}
                  excludeAccount={fromAccount}
                  onChange={setToAccount}
                  disabled={isLoading}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Asset
                  </label>
                  <Select value={coin} onValueChange={setCoin} disabled={isLoading}>
                    <SelectTrigger className="h-12 rounded-xl bg-secondary/50 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {SUPPORTED_COINS.map((c) => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          <span className="font-semibold mr-2">{c.symbol}</span>
                          <span className="text-muted-foreground text-xs">{c.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <TransferAmountInput
                  value={amountInput}
                  coin={coin}
                  maxAmount={maxAmount}
                  onChange={setAmountInput}
                  disabled={isLoading}
                />

                {warning && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300 leading-relaxed">{warning}</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="rounded-2xl glass-card p-5 text-center space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    You are sending
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {amountNumber.toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })}{' '}
                    <span className="text-primary">{coin}</span>
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className="flex-1 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase">From</p>
                      <p className="text-sm font-semibold mt-0.5">
                        {ACCOUNT_OPTIONS.find((o) => o.value === fromAccount)?.label}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[11px] text-muted-foreground uppercase">To</p>
                      <p className="text-sm font-semibold mt-0.5">
                        {ACCOUNT_OPTIONS.find((o) => o.value === toAccount)?.label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Estimated fee</span>
                    <span className="text-xs font-semibold text-green-500">Free (instant)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Processing time</span>
                    <span className="text-xs font-semibold">Instant</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <span className="text-xs text-muted-foreground">Available after</span>
                    <span className="text-xs font-semibold">
                      {(maxAmount - amountNumber).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}{' '}
                      {coin}
                    </span>
                  </div>
                </div>

                {warning && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300 leading-relaxed">{warning}</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-500/15 flex items-center justify-center relative"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="absolute inset-0 rounded-full border-2 border-green-500/30"
                  />
                </motion.div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold">Transfer successful!</h3>
                  <p className="text-xs text-muted-foreground">
                    {completedTransfer?.amount.toLocaleString(undefined, {
                      maximumFractionDigits: 8,
                    })}{' '}
                    {completedTransfer?.coin} moved to{' '}
                    {ACCOUNT_OPTIONS.find((o) => o.value === (completedTransfer?.toAccount ?? toAccount))?.label
                      ?? completedTransfer?.toAccount
                      ?? toAccount}
                  </p>
                </div>

                {completedTransfer && (
                  <div className="p-3 rounded-xl bg-secondary/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Transfer ID</span>
                      <span className="font-mono font-semibold truncate ml-2 max-w-[180px]">
                        {completedTransfer.bybitTxnId || completedTransfer.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-green-500 capitalize">
                        {completedTransfer.status}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-border/30 shrink-0 bg-card/50">
          {step === 'form' && (
            <Button
              onClick={handleReview}
              disabled={!isFormValid || isLoading}
              className="w-full h-12 rounded-xl"
              variant="premium"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Review Transfer
            </Button>
          )}

          {step === 'review' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
                variant="premium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Processing
                  </>
                ) : (
                  'Confirm Transfer'
                )}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col gap-2">
              {onViewHistory && (
                <Button
                  variant="outline"
                  onClick={handleViewHistory}
                  className="w-full h-12 rounded-xl"
                >
                  <History className="w-4 h-4 mr-1" />
                  View History
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleNewTransfer}
                  className="flex-1 h-12 rounded-xl"
                >
                  New Transfer
                </Button>
                <Button
                  onClick={handleDone}
                  className="flex-1 h-12 rounded-xl"
                  variant="premium"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
