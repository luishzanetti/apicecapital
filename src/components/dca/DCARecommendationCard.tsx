import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { dcaAssets } from '@/data/sampleData';
import { useAiAdvisor, type AiRecommendation } from '@/hooks/useAiAdvisor';
import {
  Sparkles, ChevronDown, ChevronUp, Zap, RefreshCw,
  Loader2, Brain, Shield, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DCARecommendationCardProps {
  onApply: (assets: { symbol: string; allocation: number }[], amount: number, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void;
}

const CONFIDENCE_CONFIG = {
  high: { color: 'text-green-400', bg: 'border-green-500/30', icon: Shield, label: 'High Confidence' },
  medium: { color: 'text-amber-400', bg: 'border-amber-500/30', icon: TrendingUp, label: 'Medium Confidence' },
  low: { color: 'text-orange-400', bg: 'border-orange-500/30', icon: AlertTriangle, label: 'Low Confidence' },
};

export function DCARecommendationCard({ onApply }: DCARecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [isAiPowered, setIsAiPowered] = useState(false);

  const userProfile = useAppStore((s) => s.userProfile);
  const investorType = useAppStore((s) => s.investorType);
  const { getRecommendation, isLoading } = useAiAdvisor();

  const loadRecommendation = async (force = false) => {
    const rec = await getRecommendation(force);
    setRecommendation(rec);
    // If recommendation has marketInsight with real data, it's AI-powered
    setIsAiPowered(
      rec.marketInsight !== undefined &&
      !rec.marketInsight.includes('dominance protects') && // not fallback text
      !rec.marketInsight.includes('Diversification across')
    );
  };

  useEffect(() => {
    loadRecommendation();
  }, [investorType, userProfile.capitalRange]);

  if (!recommendation) {
    return (
      <Card variant="premium" className="overflow-hidden">
        <CardContent className="pt-5 flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Generating recommendation...</span>
        </CardContent>
      </Card>
    );
  }

  const confidenceConfig = CONFIDENCE_CONFIG[recommendation.confidence] || CONFIDENCE_CONFIG.medium;
  const ConfidenceIcon = confidenceConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="premium" className="overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardContent className="pt-5 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl apice-gradient-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">AI Recommendation</p>
                  {isAiPowered && (
                    <Badge variant="outline" className="text-[7px] px-1 py-0 border-green-500/30 text-green-400">
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-sm">Personalized for You</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn('text-[8px] gap-0.5', confidenceConfig.color, confidenceConfig.bg)}>
                <ConfidenceIcon className="w-2.5 h-2.5" />
                {confidenceConfig.label}
              </Badge>
              <button
                onClick={() => loadRecommendation(true)}
                disabled={isLoading}
                className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <RefreshCw className={cn('w-3 h-3 text-muted-foreground', isLoading && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Main Recommendation */}
          <div className="p-4 rounded-xl bg-secondary/50 mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-primary">${recommendation.suggestedAmount}</span>
              <span className="text-sm text-muted-foreground">/{recommendation.frequency}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">into</span>
              {recommendation.assets.map((asset) => (
                <Badge key={asset.symbol} variant="outline" size="sm">
                  {asset.symbol} ({asset.allocation}%)
                </Badge>
              ))}
            </div>
          </div>

          {/* Visual Allocation */}
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            {recommendation.assets.map((asset, i) => {
              const assetData = dcaAssets.find(a => a.symbol === asset.symbol);
              return (
                <motion.div
                  key={asset.symbol}
                  initial={{ width: 0 }}
                  animate={{ width: `${asset.allocation}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="h-full"
                  style={{ backgroundColor: assetData?.color || 'hsl(var(--primary))' }}
                />
              );
            })}
          </div>

          {/* Market Insight (always visible when AI-powered) */}
          {isAiPowered && recommendation.marketInsight && (
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Market Context</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {recommendation.marketInsight}
              </p>
            </div>
          )}

          {/* Adjustments Banner */}
          {recommendation.adjustments && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">AI Adjustment</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {recommendation.adjustments}
              </p>
            </div>
          )}

          {/* Expand for Details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary font-medium mb-4"
          >
            Why this recommendation?
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-2 overflow-hidden"
              >
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Rationale:</span> {recommendation.rationale}
                </p>
                {!isAiPowered && recommendation.marketInsight && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Market Context:</span> {recommendation.marketInsight}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Risk:</span> {recommendation.riskNote}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Your Profile:</span> {investorType || 'Balanced Optimizer'} with {userProfile.capitalRange?.replace('-', '-$') || 'unset'} capital range.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Apply Button */}
          <Button
            variant="premium"
            className="w-full"
            onClick={() => onApply(recommendation.assets, recommendation.suggestedAmount, recommendation.frequency)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Apply This Plan
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
