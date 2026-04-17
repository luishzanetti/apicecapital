import { forwardRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountTransferModal } from './AccountTransferModal';
import type { BybitAccountType } from './accountTypes';

interface QuickTransferButtonProps
  extends Omit<ButtonProps, 'children' | 'onClick'> {
  label?: string;
  iconOnly?: boolean;
  initiatedFrom?: string;
  defaultFrom?: BybitAccountType;
  defaultTo?: BybitAccountType;
  defaultCoin?: string;
  onViewHistory?: () => void;
}

/**
 * QuickTransferButton — inline trigger that opens the AccountTransferModal.
 * Can be dropped into Portfolio header, Settings rows, or anywhere a transfer
 * shortcut is relevant.
 */
export const QuickTransferButton = forwardRef<
  HTMLButtonElement,
  QuickTransferButtonProps
>(function QuickTransferButton(
  {
    label = 'Transfer',
    iconOnly = false,
    className,
    variant = 'outline',
    size,
    initiatedFrom = 'manual',
    defaultFrom,
    defaultTo,
    defaultCoin,
    onViewHistory,
    ...buttonProps
  },
  ref
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        size={size ?? (iconOnly ? 'icon' : 'sm')}
        onClick={() => setOpen(true)}
        className={cn('gap-1.5', className)}
        aria-label={iconOnly ? label : undefined}
        {...buttonProps}
      >
        <ArrowLeftRight className={cn(iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
        {!iconOnly && <span>{label}</span>}
      </Button>

      <AccountTransferModal
        isOpen={open}
        onClose={() => setOpen(false)}
        initiatedFrom={initiatedFrom}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
        defaultCoin={defaultCoin}
        onViewHistory={onViewHistory}
      />
    </>
  );
});
