import { motion } from 'framer-motion';
import { Coins, TrendingUp, ExternalLink } from 'lucide-react';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';

const BYBIT_EARN_URL = 'https://www.bybit.com/earn/flexible-savings';
const MIN_IDLE_THRESHOLD = 50; // Only show card if idle stablecoins >= $50

export function EarnSuggestionCard() {
  const { stablecoinsValue, fundingHoldings, isLoading, isConnected } = usePortfolioAnalytics();

  // Calculate idle stablecoins in the Funding account
  const fundingStablecoins = fundingHoldings
    .filter((h) => ['USDT', 'USDC', 'DAI', 'FDUSD'].includes(h.coin))
    .reduce((sum, h) => sum + (h.usdValue ?? 0), 0);

  // Use the larger of funding stablecoins or total stablecoins value
  const idleAmount = fundingStablecoins > 0 ? fundingStablecoins : stablecoinsValue;

  // Don't render if not connected, still loading, or below threshold
  if (!isConnected || isLoading || idleAmount < MIN_IDLE_THRESHOLD) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card rounded-xl p-4 space-y-3 border border-border/20"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Coins className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Earn yield on idle stablecoins
        </h3>
      </div>

      {/* Idle amount */}
      <div className="glass-light rounded-lg p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Idle stablecoins detected</p>
        <p className="text-lg font-bold text-foreground">
          ${idleAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
        </p>
      </div>

      {/* APY info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <span>
          <span className="text-green-400 font-medium">~3-5% APY</span> on Bybit Flexible Savings
        </span>
      </div>

      {/* CTA */}
      <a
        href={BYBIT_EARN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-[0.98]"
      >
        Set Up Earn
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Withdraw anytime. No lock period.
      </p>
    </motion.div>
  );
}
