import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockedOverlay } from '@/components/LockedOverlay';
import { useAppStore } from '@/store/appStore';
import { copyPortfolios, referralLinks } from '@/data/sampleData';
import {
  Zap,
  Shield,
  Calendar,
  Bot,
  Copy,
  ChevronRight,
  ExternalLink,
  Check,
  Plus,
  ArrowRight
} from 'lucide-react';

export default function Automations() {
  const navigate = useNavigate();
  const unlockState = useAppStore((s) => s.unlockState);
  const dcaPlans = useAppStore((s) => s.dcaPlans);
  const setupProgress = useAppStore((s) => s.setupProgress);
  const linkClicks = useAppStore((s) => s.linkClicks);
  const trackLinkClick = useAppStore((s) => s.trackLinkClick);

  const hasDcaPlan = dcaPlans.length > 0;

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'low';
      case 'balanced': return 'medium';
      case 'aggressive': return 'high';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Automations</h1>
          </div>
          <p className="text-muted-foreground text-xs">
            DCA plans, AI guides, and copy portfolios
          </p>
        </div>

        {/* DCA Planner */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              DCA Planner
            </h2>
            <Badge variant={hasDcaPlan ? 'low' : 'outline'} size="sm">
              {hasDcaPlan ? 'Active' : 'Not configured'}
            </Badge>
          </div>

          <Card
            className="cursor-pointer hover:border-primary/20 transition-colors"
            onClick={() => navigate('/dca-planner')}
          >
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl apice-gradient-primary flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Dollar-Cost Averaging</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {hasDcaPlan
                      ? `${dcaPlans.length} active plan${dcaPlans.length > 1 ? 's' : ''}`
                      : 'Set up recurring buys for consistent accumulation'
                    }
                  </p>
                  <Button variant="premium" size="sm">
                    {hasDcaPlan ? 'View Plans' : 'Create Plan'}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Trade Setup */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            AI Infrastructure
            {!unlockState.aiTradeGuides && <Badge variant="premium" size="sm">Pro</Badge>}
          </h2>

          <div className="space-y-3">
            <LockedOverlay
              isLocked={!unlockState.aiTradeGuides}
              message="Upgrade to Pro"
              onUnlock={() => navigate('/upgrade')}
            >
              <Card
                className="cursor-pointer hover:border-primary/20 transition-colors"
                onClick={() => navigate(unlockState.aiTradeGuides ? '/strategies' : '/upgrade')}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">AI Trade Setup</h3>
                      <p className="text-xs text-muted-foreground">
                        Guided API trading configuration
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </LockedOverlay>

            <LockedOverlay
              isLocked={!unlockState.aiBotGuides}
              message="Upgrade to Pro"
              onUnlock={() => navigate('/upgrade')}
            >
              <Card
                className="cursor-pointer hover:border-primary/20 transition-colors"
                onClick={() => navigate(unlockState.aiBotGuides ? '/strategies' : '/upgrade')}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">AI Bot (Bitradex)</h3>
                      <p className="text-xs text-muted-foreground">
                        Automation infrastructure setup
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </LockedOverlay>
          </div>
        </div>

        {/* Copy Portfolios */}
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            Copy Portfolios
            {!unlockState.copyPortfolios && <Badge variant="premium" size="sm">Pro</Badge>}
          </h2>

          <LockedOverlay
            isLocked={!unlockState.copyPortfolios}
            message="Upgrade to unlock copy trading"
            onUnlock={() => navigate('/upgrade')}
          >
            <div className="space-y-3">
              {copyPortfolios.map((portfolio, i) => (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="cursor-pointer hover:border-primary/20 transition-colors">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{portfolio.name}</h3>
                            <Badge variant={getRiskVariant(portfolio.risk)} size="sm">
                              {portfolio.riskLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{portfolio.forWho}</p>
                        </div>
                        <Copy className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        {portfolio.whatItAims}
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          const bybitLink = referralLinks.find(l => l.id === 'bybit');
                          if (bybitLink) {
                            trackLinkClick('bybit');
                            window.open(bybitLink.url, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Copy via Bybit
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </LockedOverlay>
        </div>

        {/* Trust Message */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your funds remain on your exchange. No withdrawal access.
            You can stop anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
