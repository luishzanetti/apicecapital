import { useState } from 'react';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Stethoscope, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Runs the full balance-fetch diagnostic and shows the server's exact
 * response envelope. Gives the operator evidence to root-cause why the
 * app is stuck on "Connect Bybit" (auth? credentials? edge function? key mismatch?).
 */
export function BalanceDiagnostic({ compact = false }: { compact?: boolean }) {
  const { diagnose } = useExchangeBalance();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof diagnose>> | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await diagnose();
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) run();
    if (!next) {
      setResult(null);
      setCopied(false);
    }
  };

  const verdict = (() => {
    if (!result) return null;
    if (!result.supabaseConfigured) return { tone: 'warn', msg: 'Supabase not configured in .env' };
    if (result.authLoading) return { tone: 'info', msg: 'Auth still loading — wait a moment' };
    if (!result.hasSession || !result.userId) return { tone: 'warn', msg: 'No user session — sign in again' };
    if (result.credentialsError) return { tone: 'err', msg: `Credentials query error: ${result.credentialsError}` };
    if (!result.credentialsRow) return { tone: 'warn', msg: 'No bybit_credentials row for this user — Connect Bybit in Settings' };
    if (result.edgeFunctionError) return { tone: 'err', msg: `Edge function error: ${result.edgeFunctionError}` };
    if (!result.edgeFunctionResponse) return { tone: 'err', msg: 'Edge function returned no data' };
    return { tone: 'ok', msg: 'Connection is healthy' };
  })();

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className={cn(
          'gap-1.5 text-[11px]',
          compact ? 'h-7 px-2' : 'h-8 px-2.5',
        )}
        aria-label="Diagnose Bybit connection"
      >
        <Stethoscope className="h-3 w-3" aria-hidden="true" />
        Diagnose
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bybit connection diagnostic</DialogTitle>
            <DialogDescription>
              Step-by-step check of auth → credentials → edge function.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">
              Running diagnostic…
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              {verdict && (
                <div
                  className={cn(
                    'rounded-lg border p-3 text-xs',
                    verdict.tone === 'ok' && 'border-[#22c55e]/25 bg-[#22c55e]/5 text-[#22c55e]',
                    verdict.tone === 'info' && 'border-sky-400/25 bg-sky-400/5 text-sky-300',
                    verdict.tone === 'warn' && 'border-amber-400/25 bg-amber-400/5 text-amber-300',
                    verdict.tone === 'err' && 'border-red-500/25 bg-red-500/5 text-red-400',
                  )}
                >
                  <p className="font-semibold">{verdict.msg}</p>
                </div>
              )}

              <ul className="space-y-1.5 text-xs">
                <Row label="Supabase configured" value={String(result.supabaseConfigured)} />
                <Row label="Auth loading" value={String(result.authLoading)} />
                <Row label="Has session" value={String(result.hasSession)} />
                <Row label="User ID" value={result.userId ?? '—'} mono truncate />
                <Row
                  label="Credentials row"
                  value={
                    result.credentialsRow
                      ? `${result.credentialsRow.apiKeyPrefix} (testnet=${result.credentialsRow.testnet})`
                      : '—'
                  }
                  mono
                />
                <Row label="Credentials error" value={result.credentialsError ?? '—'} mono />
                <Row label="Edge function error" value={result.edgeFunctionError ?? '—'} mono />
              </ul>

              {/* Balance envelope — what the server actually returned */}
              {(() => {
                const env = result.edgeFunctionResponse as { data?: Record<string, unknown> } | null;
                const data = env?.data;
                if (!data) return null;
                const fmt = (v: unknown) => {
                  if (typeof v === 'number') return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
                  return String(v);
                };
                const holdingsCount = Array.isArray(data.holdings) ? data.holdings.length : 0;
                const fundingCount = Array.isArray(data.fundingHoldings) ? data.fundingHoldings.length : 0;
                const futuresCount = Array.isArray(data.futuresPositions) ? data.futuresPositions.length : 0;
                return (
                  <div className="rounded-lg bg-white/[0.03] p-3 text-xs">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                      Balance breakdown
                    </p>
                    <ul className="space-y-1">
                      <Row label="Grand total" value={fmt(data.grandTotal)} mono />
                      <Row label="Funding balance" value={fmt(data.fundingBalance)} mono />
                      <Row label="Funding coins" value={String(fundingCount)} mono />
                      <Row label="Unified · totalEquity" value={fmt(data.totalEquity)} mono />
                      <Row label="Unified · walletBalance" value={fmt(data.totalWalletBalance)} mono />
                      <Row label="Unified · marginBalance" value={fmt(data.totalMarginBalance)} mono />
                      <Row label="Unified · availableBalance" value={fmt(data.totalAvailableBalance)} mono />
                      <Row label="Unified · unrealizedPnL" value={fmt(data.totalUnrealizedPnL)} mono />
                      <Row label="Spot holdings count" value={String(holdingsCount)} mono />
                      <Row label="Futures balance" value={fmt(data.futuresBalance)} mono />
                      <Row label="Futures positions" value={String(futuresCount)} mono />
                      <Row label="Account type" value={String(data.accountType ?? '—')} mono />
                      <Row label="Testnet" value={String(data.testnet ?? false)} mono />
                    </ul>
                  </div>
                );
              })()}

              <details className="rounded-lg bg-white/[0.03] p-3 text-xs">
                <summary className="cursor-pointer select-none font-semibold text-white/80">
                  Raw edge function response
                </summary>
                <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-white/70">
                  {JSON.stringify(result.edgeFunctionResponse, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="gap-1.5 text-[11px]"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" /> Copy JSON
                  </>
                )}
              </Button>
            )}
            <Button size="sm" onClick={run} disabled={loading}>
              Run again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md bg-white/[0.02] px-2.5 py-1.5">
      <span className="text-white/50">{label}</span>
      <span
        className={cn(
          'text-right text-white/90',
          mono && 'font-mono tabular-nums text-[11px]',
          truncate && 'max-w-[60%] truncate',
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </li>
  );
}
