import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAiAdvisor, type AiPortfolioAnalysis } from '@/hooks/useAiAdvisor';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Brain, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, TrendingUp, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AiPortfolioScore() {
  const { analyzePortfolio, isLoading } = useAiAdvisor();
  const { language } = useTranslation();
  const [analysis, setAnalysis] = useState<AiPortfolioAnalysis | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            grades: {
              A: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Excelente' },
              B: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Bom' },
              C: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Regular' },
              D: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Precisa melhorar' },
              F: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Crítico' },
            },
            title: 'Análise de Portfólio por IA',
            subtitle: 'Receba uma nota e recomendações',
            analyzing: 'Analisando com IA...',
            analyze: 'Analisar meu portfólio',
            empty: 'Não há planos DCA ativos para analisar. Crie um plano primeiro.',
            retry: 'Tentar novamente',
            score: 'Score do portfólio',
            refresh: 'Atualizar',
            strengths: 'Pontos fortes',
            improve: 'Melhorar',
            detailsOpen: 'Menos detalhes',
            detailsClosed: 'Análise completa',
            risk: 'Avaliação de risco',
            outlook: 'Perspectiva',
            rebalance: 'Rebalanceamento sugerido',
          }
        : {
            grades: {
              A: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Excellent' },
              B: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Good' },
              C: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Fair' },
              D: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Needs improvement' },
              F: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critical' },
            },
            title: 'AI Portfolio Analysis',
            subtitle: 'Get a score and clear recommendations',
            analyzing: 'Analyzing with AI...',
            analyze: 'Analyze my portfolio',
            empty: 'There are no active DCA plans to analyze yet. Create one first.',
            retry: 'Try again',
            score: 'Portfolio score',
            refresh: 'Refresh',
            strengths: 'Strengths',
            improve: 'Improve',
            detailsOpen: 'Fewer details',
            detailsClosed: 'Full analysis',
            risk: 'Risk assessment',
            outlook: 'Outlook',
            rebalance: 'Suggested rebalance',
          },
    [language]
  );

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
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{copy.title}</p>
              <p className="text-[11px] text-muted-foreground">{copy.subtitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                {copy.analyzing}
              </>
            ) : (
              <>
                <Brain className="mr-1.5 h-3 w-3" />
                {copy.analyze}
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
          <p className="text-xs text-muted-foreground">{copy.empty}</p>
          <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setHasAnalyzed(false)}>
            {copy.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const gradeConfig = copy.grades[analysis.grade as keyof typeof copy.grades] || copy.grades.C;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-primary/10">
        <CardContent className="pt-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', gradeConfig.bg)}>
                  <span className={cn('text-2xl font-black', gradeConfig.color)}>{analysis.grade}</span>
                </div>
                <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card">
                  <span className="text-[11px] font-bold">{analysis.score}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold">{copy.score}</p>
                <p className={cn('text-[11px] font-semibold', gradeConfig.color)}>{gradeConfig.label}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : copy.refresh}
            </Button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl glass-light border-green-500/10 p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-400" />
                <span className="text-[11px] font-bold uppercase text-green-400">{copy.strengths}</span>
              </div>
              {analysis.strengths.slice(0, 2).map((item, index) => (
                <p key={index} className="text-[11px] leading-tight text-muted-foreground">{item}</p>
              ))}
            </div>
            <div className="rounded-xl glass-light border-amber-500/10 p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] font-bold uppercase text-amber-400">{copy.improve}</span>
              </div>
              {analysis.improvements.slice(0, 2).map((item, index) => (
                <p key={index} className="text-[11px] leading-tight text-muted-foreground">{item}</p>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-xl glass-light border-primary/10 p-2.5">
            <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] font-medium text-primary">{analysis.nextAction}</p>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {expanded ? copy.detailsOpen : copy.detailsClosed}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-3">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{copy.risk}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{analysis.riskAssessment}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{copy.outlook}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{analysis.outlook}</p>
                  </div>

                  {analysis.rebalanceNeeded && analysis.rebalanceSuggestion && (
                    <div className="rounded-xl glass-light border-orange-500/10 p-2.5">
                      <div className="mb-1 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-orange-400" />
                        <span className="text-[11px] font-bold uppercase text-orange-400">{copy.rebalance}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{analysis.rebalanceSuggestion}</p>
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
