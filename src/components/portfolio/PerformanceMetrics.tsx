import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioAnalytics } from '@/hooks/usePortfolioAnalytics';
import {
  Activity, Shield, TrendingUp, AlertTriangle,
  Sparkles, Target, Percent, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'];

interface Insight {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'tip';
}

export function PerformanceMetrics() {
  const analytics = usePortfolioAnalytics();

  const insights = useMemo<Insight[]>(() => {
    if (!analytics.isConnected) return [];

    const list: Insight[] = [];
    const { totalEquity, stablecoinsPct, btcPct, ethPct, spotCount, activeDCAPlans } = analytics;

    // Portfolio health score
    const diversification = Math.min(spotCount / 5, 1) * 25;
    const hasCore = (btcPct > 10 ? 1 : 0) + (ethPct > 5 ? 1 : 0);
    const coreScore = hasCore * 12.5;
    const dcaScore = activeDCAPlans > 0 ? 25 : 0;
    const stableScore = stablecoinsPct >= 10 && stablecoinsPct <= 40 ? 25 : (stablecoinsPct < 10 ? 10 : 15);
    const healthScore = Math.round(diversification + coreScore + dcaScore + stableScore);

    // Concentration risk
    const topHolding = analytics.spotHoldings[0];
    if (topHolding && analytics.totalEquity > 0) {
      const topPct = (topHolding.usdValue / totalEquity) * 100;
      if (topPct > 70 && !STABLECOINS.includes(topHolding.coin)) {
        list.push({
          icon: <AlertTriangle className="w-4 h-4" />,
          title: 'High Concentration',
          description: `${topHolding.coin} represents ${topPct.toFixed(0)}% of your portfolio. Consider diversifying to reduce risk.`,
          type: 'warning',
        });
      }
    }

    // Stablecoin ratio
    if (stablecoinsPct > 60) {
      list.push({
        icon: <Shield className="w-4 h-4" />,
        title: 'Heavy on Stablecoins',
        description: `${stablecoinsPct.toFixed(0)}% in stablecoins. Great for safety, but consider deploying some via DCA for growth.`,
        type: 'tip',
      });
    } else if (stablecoinsPct < 5 && totalEquity > 50) {
      list.push({
        icon: <Shield className="w-4 h-4" />,
        title: 'Low Cash Reserve',
        description: 'Consider keeping 10-20% in stablecoins for buying opportunities during dips.',
        type: 'warning',
      });
    }

    // DCA recommendation
    if (activeDCAPlans === 0 && totalEquity > 0) {
      list.push({
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Enable DCA',
        description: 'Set up automated buying to grow your portfolio consistently without emotional decisions.',
        type: 'tip',
      });
    } else if (activeDCAPlans > 0) {
      list.push({
        icon: <Sparkles className="w-4 h-4" />,
        title: 'DCA Active',
        description: `${activeDCAPlans} plan${activeDCAPlans > 1 ? 's' : ''} running. Consistency beats timing — keep it up.`,
        type: 'success',
      });
    }

    // Diversification
    if (spotCount >= 5) {
      list.push({
        icon: <Target className="w-4 h-4" />,
        title: 'Well Diversified',
        description: `${spotCount} different assets. Good diversification reduces overall risk.`,
        type: 'success',
      });
    } else if (spotCount < 3 && totalEquity > 50) {
      list.push({
        icon: <Target className="w-4 h-4" />,
        title: 'Low Diversification',
        description: 'Only ${spotCount} asset${spotCount > 1 ? "s" : ""}. Consider spreading across 5+ assets for better risk management.',
        type: 'warning',
      });
    }

    return list;
  }, [analytics]);

  if (!analytics.isConnected) return null;

  // Calculate health score
  const { spotCount, btcPct, ethPct, activeDCAPlans, stablecoinsPct } = analytics;
  const diversification = Math.min(spotCount / 5, 1) * 25;
  const hasCore = (btcPct > 10 ? 1 : 0) + (ethPct > 5 ? 1 : 0);
  const coreScore = hasCore * 12.5;
  const dcaScore = activeDCAPlans > 0 ? 25 : 0;
  const stableScore = stablecoinsPct >= 10 && stablecoinsPct <= 40 ? 25 : (stablecoinsPct < 10 ? 10 : 15);
  const healthScore = Math.round(diversification + coreScore + dcaScore + stableScore);

  const healthColor = healthScore >= 75 ? 'text-green-400' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const healthBg = healthScore >= 75 ? 'bg-green-500/10' : healthScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10';
  const healthLabel = healthScore >= 75 ? 'Strong' : healthScore >= 50 ? 'Moderate' : 'Needs Work';

  const typeColors = {
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
    tip: 'border-primary/20 bg-primary/5',
  };
  const typeTextColors = {
    success: 'text-green-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
    tip: 'text-primary',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card>
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Portfolio Health</span>
            </div>
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg', healthBg)}>
              <span className={cn('text-sm font-bold', healthColor)}>{healthScore}</span>
              <span className={cn('text-[10px] font-medium', healthColor)}>/100</span>
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground mb-1.5">
              <span>{healthLabel}</span>
              <span>{healthScore}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${healthScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', healthScore >= 75 ? 'bg-green-500' : healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500')}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              {[
                { label: 'Diversity', score: Math.round(diversification), max: 25 },
                { label: 'Core', score: Math.round(coreScore), max: 25 },
                { label: 'DCA', score: Math.round(dcaScore), max: 25 },
                { label: 'Reserves', score: Math.round(stableScore), max: 25 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[8px] text-muted-foreground">{item.label}</p>
                  <p className="text-[10px] font-semibold">{item.score}/{item.max}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Insights</p>
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn('flex items-start gap-2.5 p-2.5 rounded-xl border', typeColors[insight.type])}
                >
                  <div className={cn('mt-0.5 shrink-0', typeTextColors[insight.type])}>
                    {insight.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{insight.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
