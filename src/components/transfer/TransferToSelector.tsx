import { ArrowDownToLine, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExchangeBalance } from '@/hooks/useExchangeBalance';
import {
  ACCOUNT_OPTIONS,
  getAccountCoinBalance,
  getAccountTotalUsd,
  type BybitAccountType,
} from './accountTypes';

interface TransferToSelectorProps {
  value: BybitAccountType;
  coin: string;
  balance: ExchangeBalance | null;
  excludeAccount: BybitAccountType;
  onChange: (value: BybitAccountType) => void;
  disabled?: boolean;
}

export function TransferToSelector({
  value,
  coin,
  balance,
  excludeAccount,
  onChange,
  disabled,
}: TransferToSelectorProps) {
  const options = ACCOUNT_OPTIONS.filter((opt) => opt.value !== excludeAccount);
  const selected = options.find((opt) => opt.value === value) ?? options[0];
  const coinBalance = getAccountCoinBalance(balance, value, coin);
  const usdTotal = getAccountTotalUsd(balance, value);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        To
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as BybitAccountType)}
        disabled={disabled}
      >
        <SelectTrigger className="h-14 rounded-xl bg-secondary/50 border-border/40 px-4 text-left">
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <SelectValue placeholder="Select destination">
                <p className="text-sm font-semibold truncate">{selected?.label}</p>
              </SelectValue>
              <p className="text-[11px] text-muted-foreground truncate">
                Current:{' '}
                {coinBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8,
                })}{' '}
                {coin}
                {usdTotal > 0 && (
                  <> · ${usdTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</>
                )}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {options.map((opt) => {
            const accountBalance = getAccountCoinBalance(balance, opt.value, coin);
            return (
              <SelectItem key={opt.value} value={opt.value} className="py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {opt.description} ·{' '}
                    {accountBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{' '}
                    {coin}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
