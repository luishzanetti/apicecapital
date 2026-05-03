import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert, ExternalLink, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Apex AI — Exchange Status Banner
 *
 * Monitors recent `live_order_failed` logs to surface when real-money
 * trading is blocked by the exchange (regulatory rejection, account
 * permission, etc). Without this banner the user sees the bot "active"
 * forever without understanding that orders aren't reaching the exchange.
 *
 * Threshold: when ≥ 3 `live_order_failed` events with the same error code
 * happened in the last 1 hour, surface the banner. Otherwise stay quiet.
 */

interface BotLog {
  id: string;
  created_at: string;
  event: string;
  payload_json: Record<string, unknown> | null;
}

interface ApexAiExchangeStatusBannerProps {
  portfolioId: string | null | undefined;
}

export function ApexAiExchangeStatusBanner({ portfolioId }: ApexAiExchangeStatusBannerProps) {
  const { data: failures = [] } = useQuery({
    queryKey: ['apex-ai-live-failures', portfolioId],
    queryFn: async (): Promise<BotLog[]> => {
      if (!portfolioId) return [];
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('apex_ai_bot_logs')
        .select('id, created_at, event, payload_json')
        .eq('portfolio_id', portfolioId)
        .eq('event', 'live_order_failed')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as BotLog[];
    },
    enabled: !!portfolioId,
    refetchInterval: 60_000,
  });

  const summary = useMemo(() => {
    if (failures.length < 2) return null;
    const codes = new Map<string, number>();
    for (const f of failures) {
      const errStr = String((f.payload_json ?? {}).error ?? '');
      const m = errStr.match(/Bybit (\d+):/);
      const code = m ? m[1] : 'unknown';
      codes.set(code, (codes.get(code) ?? 0) + 1);
    }
    const dominantCode = Array.from(codes.entries()).sort((a, b) => b[1] - a[1])[0];
    return {
      total: failures.length,
      code: dominantCode?.[0] ?? 'unknown',
      latestErr: String((failures[0].payload_json ?? {}).error ?? ''),
    };
  }, [failures]);

  if (!summary) return null;

  // Customize the message per known error code
  let title: string;
  let body: string;
  if (summary.code === '10024') {
    title = 'Real-money trading blocked by Bybit (10024)';
    body =
      'Your Bybit account is rejecting every futures order due to regulatory restrictions in the registered country/region. Apex AI is running the validated strategy against real BTC market data, but in simulation mode — PnL is tracked but no real funds are deployed.';
  } else if (summary.code === '110074') {
    title = 'Exchange contract unavailable';
    body =
      'The configured futures contract is delisted or paused on Bybit. Strategy is running in SIM mode while we surface the right contract.';
  } else {
    title = `Exchange rejecting orders (Bybit ${summary.code})`;
    body = `Last error: ${summary.latestErr.slice(0, 200)}`;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Exchange status warning"
      className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
          <ShieldAlert className="h-4 w-4 text-amber-300" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-amber-300">{title}</p>
          <p className="mt-1 text-[12px] leading-snug text-amber-200/85">{body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-300/80">
            <span className="font-mono tabular-nums">{summary.total} rejections in last 60min</span>
            <span>·</span>
            <a
              href="https://www.bybit.com/help-center/article/Frequently-Asked-Questions-on-Restricted-Jurisdictions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline decoration-amber-400/40 underline-offset-2 hover:decoration-amber-300"
            >
              Bybit jurisdiction policy
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <details className="mt-2 group">
            <summary className="inline-flex cursor-pointer select-none items-center gap-1 text-[11px] font-semibold text-amber-300/85 hover:text-amber-200">
              Resolution paths
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-1.5 space-y-1 text-[11.5px] text-amber-200/75 pl-4 list-disc">
              <li>
                <span className="font-semibold">A.</span> Open a sub-account in a permitted jurisdiction (Singapore, UAE, etc) and migrate the API key here.
              </li>
              <li>
                <span className="font-semibold">B.</span> Migrate to an exchange that accepts your region (OKX, Bitget, KuCoin) — we&rsquo;ll add the adapter.
              </li>
              <li>
                <span className="font-semibold">C.</span> Stay in SIM mode (validated config, real BTC data, real PnL tracking) until A or B is in place.
              </li>
            </ul>
          </details>
        </div>
      </div>
    </motion.section>
  );
}

export default ApexAiExchangeStatusBanner;
