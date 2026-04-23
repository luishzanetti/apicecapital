import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Wallet, RefreshCw, TrendingUp, TrendingDown, Link2,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <CardContent className="space-y-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
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
  const { language } = useTranslation();
  const { data, isLoading, isRefreshing, error, status, refresh } = useExchangeBalance();

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            connectTitle: 'Conecte sua corretora',
            connectBody: 'Conecte sua conta Bybit para ver saldos reais e acompanhar seu portfólio ao vivo.',
            connectCta: 'Conectar Bybit',
            errorTitle: 'Erro de conexão',
            retry: 'Tentar novamente',
            title: 'Saldo da corretora',
            live: 'Ao vivo',
            unrealized: 'P&L não realizado',
            positions: 'Posições',
            others: 'Outras',
            available: 'Disponível para saque',
          }
        : {
            connectTitle: 'Connect your exchange',
            connectBody: 'Connect your Bybit account to see real balances and follow your portfolio live.',
            connectCta: 'Connect Bybit',
            errorTitle: 'Connection error',
            retry: 'Retry',
            title: 'Exchange balance',
            live: 'Live',
            unrealized: 'Unrealized P&L',
            positions: 'Positions',
            others: 'Others',
            available: 'Available to withdraw',
          },
    [language]
  );

  if (isLoading) return <BalanceSkeleton />;

  if (status === 'no_credentials') {
    return (
      <Card className="border-dashed border-primary/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="mb-0.5 text-sm font-semibold">{copy.connectTitle}</p>
              <p className="text-xs text-muted-foreground">{copy.connectBody}</p>
            </div>
            <Button size="sm" className="text-xs" onClick={() => navigate('/settings')}>
              {copy.connectCta}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-red-500/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-400">{copy.errorTitle}</p>
              <p className="truncate text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="shrink-0 text-xs">
              {copy.retry}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const pnlPositive = data.totalUnrealizedPnL >= 0;
  const topHoldings = data.holdings.slice(0, 6);
  const othersValue = data.holdings.slice(6).reduce((sum, holding) => sum + holding.usdValue, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <CardContent className="space-y-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{copy.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {data.testnet && (
                <Badge variant="outline" className="border-amber-500/30 text-[11px] text-amber-400">
                  TESTNET
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 border-green-500/30 text-[11px] text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {copy.live}
              </Badge>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold tracking-tight">
              ${data.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  pnlPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {pnlPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pnlPositive ? '+' : ''}
                ${Math.abs(data.totalUnrealizedPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground">{copy.unrealized}</span>
            </div>
          </div>

          {topHoldings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{copy.positions}</p>
              {topHoldings.map((holding) => {
                const pct = data.totalEquity > 0 ? (holding.usdValue / data.totalEquity) * 100 : 0;
                return (
                  <div key={holding.coin} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {COIN_IMAGES[holding.coin] ? (
                        <img src={COIN_IMAGES[holding.coin]} alt={holding.coin} loading="lazy" decoding="async" className="h-5 w-5 rounded-full" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-bold">
                          {holding.coin.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium">{holding.coin}</span>
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
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
                  <span className="text-xs text-muted-foreground">{copy.others} ({data.holdings.length - 6})</span>
                  <span className="text-xs text-muted-foreground">
                    ${othersValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-border/40 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{copy.available}</span>
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
