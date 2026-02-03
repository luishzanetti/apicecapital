import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore, recommendedPath } from '@/store/appStore';
import { portfolios } from '@/data/sampleData';
import { ArrowRight, Shield, PieChart, Lock, Sparkles } from 'lucide-react';

export default function Portfolio() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const unlockState = useAppStore((s) => s.unlockState);
  const selectedPortfolio = useAppStore((s) => s.selectedPortfolio);

  const recommended = investorType ? recommendedPath[investorType] : 'balanced';

  const corePortfolios = portfolios.filter(p => p.type === 'core');
  const optimizedPortfolios = portfolios.filter(p => p.type === 'optimized');

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'low';
      case 'balanced': return 'medium';
      case 'growth': return 'high';
      default: return 'default';
    }
  };

  const isLocked = (portfolio: typeof portfolios[0]) => {
    if (portfolio.type === 'core') return false;
    return !unlockState.optimizedPortfolios;
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-24 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Portfolio</h1>
          </div>
          <p className="text-muted-foreground text-xs">
            Curated allocations for every risk profile
          </p>
        </div>

        {/* Trust Banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            All portfolios are frameworks. Your funds stay on your exchange.
          </p>
        </div>

        {/* Core Portfolios */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Core Portfolios
          </h2>
          <div className="space-y-3">
            {corePortfolios.map((portfolio, i) => {
              const isRecommended = portfolio.risk === recommended;
              const isSelected = selectedPortfolio.portfolioId === portfolio.id;

              return (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/20'
                    }`}
                    onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                  >
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{portfolio.name}</h3>
                            <Badge variant={getRiskVariant(portfolio.risk)} size="sm">
                              {portfolio.riskLabel}
                            </Badge>
                          </div>
                          {isRecommended && (
                            <Badge variant="recommended" size="sm" className="mb-2">
                              Recommended for You
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="low" size="sm" className="mb-2">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>

                      <p className="text-xs text-muted-foreground mb-4">
                        {portfolio.description}
                      </p>

                      {/* Allocation Preview */}
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3">
                        {portfolio.allocations.map((alloc, j) => (
                          <div
                            key={j}
                            className="h-full"
                            style={{ 
                              width: `${alloc.percentage}%`, 
                              backgroundColor: alloc.color 
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex gap-2">
                          {portfolio.allocations.slice(0, 3).map((alloc, j) => (
                            <span key={j} className="text-muted-foreground">
                              {alloc.asset} {alloc.percentage}%
                            </span>
                          ))}
                        </div>
                        <span className="text-muted-foreground">Min: {portfolio.minCapital}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Optimized Portfolios */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            Optimized Portfolios
            <Badge variant="premium" size="sm">Pro</Badge>
          </h2>
          <div className="space-y-3">
            {optimizedPortfolios.map((portfolio, i) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <LockedOverlay
                  isLocked={isLocked(portfolio)}
                  message="Upgrade to unlock"
                  onUnlock={() => navigate('/upgrade')}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/20 transition-colors"
                    onClick={() => !isLocked(portfolio) && navigate(`/portfolio/${portfolio.id}`)}
                  >
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{portfolio.name}</h3>
                            <Badge variant={getRiskVariant(portfolio.risk)} size="sm">
                              {portfolio.riskLabel}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {portfolio.description}
                      </p>
                    </CardContent>
                  </Card>
                </LockedOverlay>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Explosive List */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            Explosive List
            <Badge variant="premium" size="sm">Pro</Badge>
          </h2>
          <LockedOverlay
            isLocked={!unlockState.explosiveList}
            message="Unlock for advanced users"
            onUnlock={() => navigate('/upgrade')}
          >
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">High-Volatility Basket</h3>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Higher volatility assets designed for asymmetric upside. For advanced users with high risk tolerance only.
                    </p>
                    <Badge variant="high" size="sm">Very High Risk</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </LockedOverlay>
        </div>

        {/* Portfolio Builder CTA */}
        <Card 
          className="cursor-pointer hover:border-primary/20 transition-colors"
          onClick={() => navigate('/portfolio/builder')}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm mb-1">Portfolio Builder</h3>
                <p className="text-xs text-muted-foreground">
                  Create your own custom allocation
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground pt-4">
          Past performance does not guarantee future results.
          <br />
          Crypto involves risk. Allocate responsibly.
        </p>
      </motion.div>
    </div>
  );
}
