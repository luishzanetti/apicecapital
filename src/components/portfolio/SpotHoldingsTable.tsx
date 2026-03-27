import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, Wallet } from 'lucide-react';
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
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/aave.png',
};

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];

function CoinIcon({ coin }: { coin: string }) {
  if (COIN_IMAGES[coin]) {
    return <img src={COIN_IMAGES[coin]} alt={coin} className="w-7 h-7 rounded-full" />;
  }
  return (
    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold">
      {coin.slice(0, 2)}
    </div>
  );
}

export function SpotHoldingsTable() {
  const analytics = usePortfolioAnalytics();
  const [expanded, setExpanded] = useState(false);
  const [expandedUnifiedRow, setExpandedUnifiedRow] = useState<string | null>(null);
  const [expandedFundingRow, setExpandedFundingRow] = useState<string | null>(null);
  const [fundingExpanded, setFundingExpanded] = useState(false);

  if (!analytics.isConnected || analytics.spotHoldings.length === 0) return null;

  const displayHoldings = expanded
    ? analytics.spotHoldings
    : analytics.spotHoldings.slice(0, 5);

  const hasMore = analytics.spotHoldings.length > 5;
  const hasFunding = analytics.fundingHoldings.length > 0;

  const displayFunding = fundingExpanded
    ? analytics.fundingHoldings
    : analytics.fundingHoldings.slice(0, 5);
  const hasFundingMore = analytics.fundingHoldings.length > 5;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card>
        <CardContent className="pt-4 pb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Unified Account</span>
              <Badge variant="secondary" className="text-[9px]">{analytics.spotCount}</Badge>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="h-2 rounded-full overflow-hidden flex mb-4">
            {analytics.spotHoldings.map((h) => {
              const pct = analytics.totalEquity > 0 ? (h.usdValue / analytics.totalEquity) * 100 : 0;
              if (pct < 0.5) return null;
              const isStable = STABLECOINS.includes(h.coin);
              const color = h.coin === 'BTC' ? '#F7931A'
                : h.coin === 'ETH' ? '#627EEA'
                : isStable ? '#26A17B'
                : `hsl(${(h.coin.charCodeAt(0) * 37) % 360}, 60%, 55%)`;
              return (
                <div
                  key={h.coin}
                  className="h-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: color }}
                />
              );
            })}
          </div>

          {/* Holdings Table */}
          <div className="space-y-0.5">
            {/* Header Row */}
            <div className="flex items-center text-[9px] text-muted-foreground uppercase tracking-wider font-semibold px-1 pb-1">
              <div className="flex-1">Asset</div>
              <div className="w-20 text-right">Balance</div>
              <div className="w-20 text-right">Value</div>
              <div className="w-12 text-right">%</div>
            </div>

            <AnimatePresence initial={false}>
              {displayHoldings.map((holding, i) => {
                const pct = analytics.totalEquity > 0 ? (holding.usdValue / analytics.totalEquity) * 100 : 0;
                const isStable = STABLECOINS.includes(holding.coin);
                const dcaMatch = analytics.allocationMap.find(a => a.coin === holding.coin);
                const hasDCA = dcaMatch?.source === 'both';
                const isRowExpanded = expandedUnifiedRow === holding.coin;

                return (
                  <motion.div
                    key={holding.coin}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <div
                      className={cn(
                        'flex items-center py-2 px-1 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer',
                        isRowExpanded && 'bg-secondary/20'
                      )}
                      onClick={() => setExpandedUnifiedRow(isRowExpanded ? null : holding.coin)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <CoinIcon coin={holding.coin} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">{holding.coin}</span>
                            {hasDCA && (
                              <Badge variant="outline" className="text-[7px] px-1 py-0 border-primary/30 text-primary gap-0.5">
                                <TrendingUp className="w-2 h-2" />
                                DCA
                              </Badge>
                            )}
                            {isStable && (
                              <Badge variant="outline" className="text-[7px] px-1 py-0 border-green-500/20 text-green-400">
                                Stable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs font-semibold">
                          ${holding.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isRowExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-1 mb-1 px-3 py-2.5 rounded-lg bg-secondary/20 border border-border/30">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Balance</span>
                                <span className="font-mono">{holding.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Equity</span>
                                <span className="font-mono">{holding.equity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">USD Value</span>
                                <span className="font-semibold">${holding.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Unrealised P&L</span>
                                <span className={cn('font-semibold', holding.unrealisedPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                                  {holding.unrealisedPnl >= 0 ? '+' : ''}{holding.unrealisedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between col-span-2">
                                <span className="text-muted-foreground">Available to Withdraw</span>
                                <span className="font-mono">{holding.availableToWithdraw.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Show More/Less */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1 w-full py-2 mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show All {analytics.spotCount} Assets <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Funding Holdings Section */}
      {hasFunding && (
        <Card className="mt-4 border-amber-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">Funding Holdings</span>
                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                  {analytics.fundingHoldings.length}
                </Badge>
              </div>
              <span className="text-xs font-semibold text-amber-400">
                ${analytics.fundingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-0.5">
              {/* Header Row */}
              <div className="flex items-center text-[9px] text-muted-foreground uppercase tracking-wider font-semibold px-1 pb-1">
                <div className="flex-1">Asset</div>
                <div className="w-24 text-right">Balance</div>
                <div className="w-24 text-right">Value</div>
              </div>

              <AnimatePresence initial={false}>
                {displayFunding.map((fh, i) => {
                  const isRowExpanded = expandedFundingRow === fh.coin;

                  return (
                    <motion.div
                      key={fh.coin}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <div
                        className={cn(
                          'flex items-center py-2 px-1 rounded-lg hover:bg-amber-500/5 transition-colors cursor-pointer',
                          isRowExpanded && 'bg-amber-500/5'
                        )}
                        onClick={() => setExpandedFundingRow(isRowExpanded ? null : fh.coin)}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <CoinIcon coin={fh.coin} />
                          <span className="text-xs font-semibold">{fh.coin}</span>
                        </div>
                        <div className="w-24 text-right">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {fh.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </span>
                        </div>
                        <div className="w-24 text-right">
                          <span className="text-xs font-semibold">
                            ${fh.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isRowExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-1 mb-1 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Balance</span>
                                  <span className="font-mono">{fh.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">USD Value</span>
                                  <span className="font-semibold">${fh.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasFundingMore && (
              <button
                onClick={() => setFundingExpanded(!fundingExpanded)}
                className="flex items-center justify-center gap-1 w-full py-2 mt-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {fundingExpanded ? (
                  <>Show Less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Show All {analytics.fundingHoldings.length} Assets <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
