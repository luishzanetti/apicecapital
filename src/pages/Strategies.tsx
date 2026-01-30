import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore, recommendedStrategy } from '@/store/appStore';
import { strategies } from '@/data/sampleData';
import { ArrowRight, Shield, TrendingUp } from 'lucide-react';

export default function Strategies() {
  const navigate = useNavigate();
  const investorType = useAppStore((s) => s.investorType);
  const unlockState = useAppStore((s) => s.unlockState);

  const recommended = investorType ? recommendedStrategy[investorType] : 'balanced';

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'default';
    }
  };

  const isLocked = (strategyId: string) => {
    if (strategyId === 'conservative') return false;
    if (strategyId === 'balanced') return !unlockState.basicStrategies;
    return !unlockState.advancedStrategies;
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-headline">Strategies</h1>
          </div>
          <p className="text-muted-foreground text-caption">
            Curated portfolios for every risk profile
          </p>
        </div>

        {/* Trust Banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-micro text-muted-foreground">
            All strategies include risk controls. Your funds stay on your exchange.
          </p>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-4">
          {strategies.map((strategy, i) => {
            const locked = isLocked(strategy.id);
            const isRecommended = strategy.id === recommended;

            return (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <LockedOverlay
                  isLocked={locked}
                  message="Upgrade to unlock"
                  onUnlock={() => navigate('/upgrade')}
                >
                  <Card
                    variant={isRecommended ? 'premium' : 'interactive'}
                    className="overflow-hidden"
                    onClick={() => !locked && navigate(`/strategies/${strategy.id}`)}
                  >
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{strategy.name}</h3>
                            <Badge variant={getRiskVariant(strategy.risk)} size="sm">
                              {strategy.risk.charAt(0).toUpperCase() + strategy.risk.slice(1)} Risk
                            </Badge>
                          </div>
                          {isRecommended && (
                            <Badge variant="recommended" size="sm" className="mb-2">
                              Recommended for You
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>

                      <p className="text-caption text-muted-foreground mb-4">
                        {strategy.objective}
                      </p>

                      <div className="flex items-center justify-between text-micro">
                        <span className="text-muted-foreground">Expected range</span>
                        <span className="font-medium text-foreground">{strategy.expectedRange}</span>
                      </div>
                      <div className="flex items-center justify-between text-micro mt-1">
                        <span className="text-muted-foreground">Min. capital</span>
                        <span className="font-medium text-foreground">{strategy.minCapital}</span>
                      </div>
                    </CardContent>
                  </Card>
                </LockedOverlay>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-micro text-muted-foreground pt-4">
          Past performance does not guarantee future results.
          <br />
          Crypto involves risk. Allocate responsibly.
        </p>
      </motion.div>
    </div>
  );
}
