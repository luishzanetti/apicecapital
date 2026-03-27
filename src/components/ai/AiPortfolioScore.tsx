import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAiAdvisor, type AiPortfolioAnalysis } from '@/hooks/useAiAdvisor';
import {
  Brain, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, TrendingUp, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Excellent' },
  B: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Good' },
  C: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Fair' },
  D: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Needs Work' },
  F: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critical' },
};

export function AiPortfolioScore() {
  const { analyzePortfolio, isLoading } = useAiAdvisor();
  const [analysis, setAnalysis] = useState<AiPortfolioAnalysis | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    const result = await analyzePortfolio();
    setAnalysis(result);
    setHasAnalyzed(true);
    if (result) setExpanded(true);
  };

  if (!hasAnalyzed) {
    return (
      <Card className="border-primary/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">AI Portfolio Analysis</p>
              <p className="text-[10px] text-muted-foreground">Get a score and recommendations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="w-3 h-3 mr-1.5" />
                Analyze My Portfolio
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-primary/10">
        <CardContent className="pt-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground">No active DCA plans to analyze. Create a plan first.</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs mt-2"
            onClick={() => setHasAnalyzed(false)}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const gradeConfig = GRADE_CONFIG[analysis.grade] || GRADE_CONFIG.C;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/10 overflow-hidden">
        <CardContent className="pt-4 pb-4">
          {/* Score Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center',
                  gradeConfig.bg
                )}>
                  <span className={cn('text-2xl font-black', gradeConfig.color)}>
                    {analysis.grade}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                  <span className="text-[8px] font-bold">{analysis.score}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold">Portfolio Score</p>
                <p className={cn('text-[10px] font-semibold', gradeConfig.color)}>
                  {gradeConfig.label}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-7"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
            </Button>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span className="text-[9px] font-bold text-green-400 uppercase">Strengths</span>
              </div>
              {analysis.strengths.slice(0, 2).map((s, i) => (
                <p key={i} className="text-[10px] text-muted-foreground leading-tight">{s}</p>
              ))}
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400 uppercase">Improve</span>
              </div>
              {analysis.improvements.slice(0, 2).map((s, i) => (
                <p key={i} className="text-[10px] text-muted-foreground leading-tight">{s}</p>
              ))}
            </div>
          </div>

          {/* Next Action */}
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-primary font-medium">{analysis.nextAction}</p>
          </div>

          {/* Expand Details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground font-medium w-full justify-center"
          >
            {expanded ? 'Less details' : 'Full analysis'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {/* Risk Assessment */}
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Risk Assessment</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.riskAssessment}</p>
                  </div>

                  {/* Outlook */}
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Outlook</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.outlook}</p>
                  </div>

                  {/* Rebalance */}
                  {analysis.rebalanceNeeded && analysis.rebalanceSuggestion && (
                    <div className="p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3 h-3 text-orange-400" />
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Rebalance Suggested</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{analysis.rebalanceSuggestion}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
