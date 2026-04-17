import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TransferAmountInputProps {
  value: string;
  coin: string;
  maxAmount: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const QUICK_PERCENTAGES = [25, 50, 75] as const;

export function TransferAmountInput({
  value,
  coin,
  maxAmount,
  onChange,
  disabled,
}: TransferAmountInputProps) {
  const numericValue = Number(value) || 0;
  const exceedsMax = numericValue > maxAmount;

  const handlePercent = (pct: number) => {
    if (maxAmount <= 0) return;
    const calculated = (maxAmount * pct) / 100;
    // Round to 8 decimals (crypto precision), trim trailing zeros.
    onChange(calculated.toFixed(8).replace(/\.?0+$/, ''));
  };

  const handleMax = () => {
    if (maxAmount <= 0) return;
    onChange(maxAmount.toFixed(8).replace(/\.?0+$/, ''));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Amount
        </label>
        <span className="text-[11px] text-muted-foreground">
          Max: {maxAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {coin}
        </span>
      </div>

      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'h-14 rounded-xl bg-secondary/50 border-border/40 pr-28 text-lg font-bold',
            exceedsMax && 'border-destructive/50'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">{coin}</span>
          <button
            type="button"
            onClick={handleMax}
            disabled={disabled || maxAmount <= 0}
            className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Max
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_PERCENTAGES.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => handlePercent(pct)}
            disabled={disabled || maxAmount <= 0}
            className="h-9 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/30 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pct}%
          </button>
        ))}
      </div>

      {exceedsMax && (
        <p className="text-[11px] text-destructive font-medium">
          Amount exceeds available balance
        </p>
      )}
    </div>
  );
}
