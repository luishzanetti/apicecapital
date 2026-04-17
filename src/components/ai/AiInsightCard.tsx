import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiAdvisor, type AiInsight } from '@/hooks/useAiAdvisor';
import {
  Sparkles, TrendingUp, BookOpen, Target, Zap, AlertTriangle,
  RefreshCw, Loader2, ArrowRight, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  market: { icon: TrendingUp, color: 'text-sky-300', label: 'Market' },
  portfolio: { icon: Target, color: 'text-violet-300', label: 'Portfolio' },
  education: { icon: BookOpen, color: 'text-[hsl(var(--apice-emerald))]', label: 'Learn' },
  discipline: { icon: Zap, color: 'text-amber-300', label: 'Discipline' },
  opportunity: { icon: AlertTriangle, color: 'text-orange-300', label: 'Opportunity' },
};

const SENTIMENT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  bullish: { bg: 'bg-[hsl(var(--apice-emerald))]/10', text: 'text-[hsl(var(--apice-emerald))]', label: 'Bullish' },
  bearish: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Bearish' },
  neutral: { bg: 'bg-white/[0.05]', text: 'text-white/55', label: 'Neutral' },
  cautious: { bg: 'bg-amber-500/10', text: 'text-amber-300', label: 'Cautious' },
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
      <Card className="border-none glass-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
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
      <Card className="border-none overflow-hidden glass-card">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--apice-emerald))]/10 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-[hsl(var(--apice-emerald))]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-white/45 uppercase tracking-[0.12em] font-semibold">AI Insight</p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[hsl(var(--apice-emerald))]/10 text-[hsl(var(--apice-emerald))] text-[10px] px-1.5 py-0.5 font-semibold tracking-[0.08em] uppercase">
                    <Sparkles className="w-2 h-2 mr-0.5" />
                    Live
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mt-0.5">{insight.title}</h3>
              </div>
            </div>
            <button
              onClick={() => loadInsight(true)}
              disabled={isLoading}
              className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors disabled:opacity-50"
              aria-label="Refresh insight"
            >
              <RefreshCw className={cn('w-3 h-3 text-white/60', isLoading && 'animate-spin')} />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-white/70 leading-relaxed mb-3">
            {insight.content}
          </p>

          {/* Tags Row */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold', typeConfig.color)}>
              <Icon className="w-2.5 h-2.5" />
              {typeConfig.label}
            </span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', sentimentConfig.bg, sentimentConfig.text)}>
              {sentimentConfig.label}
            </span>
            {insight.urgency === 'high' && (
              <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 font-semibold uppercase tracking-[0.08em]">
                Urgent
              </span>
            )}
            {insight.relatedAssets.map(asset => (
              <span key={asset} className="text-[10px] font-mono font-semibold text-white/70 bg-white/[0.04] px-1.5 py-0.5 rounded">
                {asset}
              </span>
            ))}
          </div>

          {/* Action */}
          {insight.action && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[hsl(var(--apice-emerald))]/[0.06]">
              <Zap className="w-3.5 h-3.5 text-[hsl(var(--apice-emerald))] shrink-0" />
              <p className="text-[11px] text-[hsl(var(--apice-emerald))] font-medium flex-1">{insight.action}</p>
              <ArrowRight className="w-3 h-3 text-[hsl(var(--apice-emerald))]/60" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
