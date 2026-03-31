import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import {
  Wallet, RefreshCw, TrendingUp, TrendingDown, Link2,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map common coin symbols to CoinGecko image URLs
const COIN_IMAGES: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
};

function BalanceSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveBalanceCard() {
  const navigate = useNavigate();
  const { data, isLoading, isRefreshing, error, status, refresh } = useExchangeBalance();

  // Loading state
  if (isLoading) return <BalanceSkeleton />;

  // No credentials — show connect CTA
  if (status === 'no_credentials') {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5">Connect Your Exchange</p>
              <p className="text-xs text-muted-foreground">
                Link your Bybit account to see real balances and track your portfolio live.
              </p>
            </div>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => navigate('/settings')}
            >
              Connect Bybit
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <Card className="border-red-500/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-400">Connection Error</p>
              <p className="text-xs text-muted-foreground truncate">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="text-xs shrink-0">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected — show real balance
  if (!data) return null;

  const pnlPositive = data.totalUnrealizedPnL >= 0;
  const topHoldings = data.holdings.slice(0, 6);
  const othersValue = data.holdings.slice(6).reduce((sum, h) => sum + h.usdValue, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Exchange Balance</span>
            </div>
            <div className="flex items-center gap-2">
              {data.testnet && (
                <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-400">
                  TESTNET
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[11px] gap-1 border-green-500/30 text-green-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Total Balance */}
          <div>
            <p className="text-2xl font-bold tracking-tight">
              ${data.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                pnlPositive ? 'text-green-400' : 'text-red-400'
              )}>
                {pnlPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {pnlPositive ? '+' : ''}
                ${Math.abs(data.totalUnrealizedPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground">unrealized P&L</span>
            </div>
          </div>

          {/* Holdings List */}
          {topHoldings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Holdings</p>
              {topHoldings.map((holding) => {
                const pct = data.totalEquity > 0 ? (holding.usdValue / data.totalEquity) * 100 : 0;
                return (
                  <div key={holding.coin} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {COIN_IMAGES[holding.coin] ? (
                        <img
                          src={COIN_IMAGES[holding.coin]}
                          alt={holding.coin}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold">
                          {holding.coin.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium">{holding.coin}</span>
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        ${holding.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
              {othersValue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Others ({data.holdings.length - 6})</span>
                  <span className="text-xs text-muted-foreground">
                    ${othersValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Available Balance */}
          <div className="pt-2 border-t border-border/40">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Available to withdraw</span>
              <span className="font-medium">
                ${data.totalAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
