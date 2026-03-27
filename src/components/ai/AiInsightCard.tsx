import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAiAdvisor, type AiInsight } from '@/hooks/useAiAdvisor';
import {
  Sparkles, TrendingUp, BookOpen, Target, Zap, AlertTriangle,
  RefreshCw, Loader2, ArrowRight, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  market: { icon: TrendingUp, color: 'text-blue-400', label: 'Market' },
  portfolio: { icon: Target, color: 'text-purple-400', label: 'Portfolio' },
  education: { icon: BookOpen, color: 'text-green-400', label: 'Learn' },
  discipline: { icon: Zap, color: 'text-amber-400', label: 'Discipline' },
  opportunity: { icon: AlertTriangle, color: 'text-orange-400', label: 'Opportunity' },
};

const SENTIMENT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  bullish: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Bullish' },
  bearish: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Bearish' },
  neutral: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Neutral' },
  cautious: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Cautious' },
};

export function AiInsightCard() {
  const { getInsight, isLoading } = useAiAdvisor();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadInsight = async (force = false) => {
    const data = await getInsight(force);
    setInsight(data);
    setLoaded(true);
  };

  useEffect(() => {
    loadInsight();
  }, []);

  if (!loaded && isLoading) {
    return (
      <Card className="border-none" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="flex-1">
              <div className="h-3 bg-secondary/50 rounded-full w-32 mb-2 animate-pulse" />
              <div className="h-2 bg-secondary/30 rounded-full w-48 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  const typeConfig = TYPE_CONFIG[insight.type] || TYPE_CONFIG.market;
  const sentimentConfig = SENTIMENT_CONFIG[insight.sentiment] || SENTIMENT_CONFIG.neutral;
  const Icon = typeConfig.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-none overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">AI Insight</p>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0">
                    <Sparkles className="w-2 h-2 mr-0.5" />
                    Live
                  </Badge>
                </div>
                <h3 className="text-sm font-bold mt-0.5">{insight.title}</h3>
              </div>
            </div>
            <button
              onClick={() => loadInsight(true)}
              disabled={isLoading}
              className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
          </div>

          {/* Content */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {insight.content}
          </p>

          {/* Tags Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="outline" className={cn('text-[8px] gap-1', typeConfig.color)}>
              <Icon className="w-2.5 h-2.5" />
              {typeConfig.label}
            </Badge>
            <Badge variant="outline" className={cn('text-[8px]', sentimentConfig.text)}>
              {sentimentConfig.label}
            </Badge>
            {insight.urgency === 'high' && (
              <Badge variant="outline" className="text-[8px] text-red-400 border-red-500/30">
                Urgent
              </Badge>
            )}
            {insight.relatedAssets.map(asset => (
              <span key={asset} className="text-[9px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                {asset}
              </span>
            ))}
          </div>

          {/* Action */}
          {insight.action && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-primary font-medium flex-1">{insight.action}</p>
              <ArrowRight className="w-3 h-3 text-primary/60" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
