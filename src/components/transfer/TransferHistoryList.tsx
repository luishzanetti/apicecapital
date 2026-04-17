import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transfer } from '@/store/types';

interface TransferHistoryListProps {
  transfers: Transfer[];
  emptyMessage?: string;
  limit?: number;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function statusMeta(status: Transfer['status']) {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        label: 'Success',
      };
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        label: 'Failed',
      };
    case 'cancelled':
      return {
        icon: XCircle,
        color: 'text-muted-foreground',
        bg: 'bg-muted/30',
        label: 'Cancelled',
      };
    case 'pending':
    default:
      return {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        label: 'Pending',
      };
  }
}

export function TransferHistoryList({
  transfers,
  emptyMessage = 'No transfers yet.',
  limit,
}: TransferHistoryListProps) {
  const visible = typeof limit === 'number' ? transfers.slice(0, limit) : transfers;

  if (visible.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((transfer) => {
        const meta = statusMeta(transfer.status);
        const Icon = meta.icon;
        return (
          <li
            key={transfer.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                meta.bg
              )}
            >
              <Icon className={cn('w-4 h-4', meta.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span>{transfer.fromAccount}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span>{transfer.toAccount}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {transfer.amount.toLocaleString(undefined, {
                  maximumFractionDigits: 8,
                })}{' '}
                {transfer.coin} · {formatRelative(transfer.createdAt)}
              </p>
            </div>

            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                meta.bg,
                meta.color
              )}
            >
              {meta.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
