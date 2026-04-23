import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateQuickSetupProposal } from '@/lib/apexAi/quickSetup';
import { createApexAiPortfolio } from '@/lib/apexAi/createPortfolio';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  Rocket,
} from 'lucide-react';
import type { ApexAiQuickSetupProposal, ApexAiRiskProfile } from '@/types/apexAi';

export default function ApexAiSetup() {
  const nav = useNavigate();
  const { t, language } = useTranslation();
  const { session } = useAuth();
  const wizard = useAppStore((s) => s.apexAiWizard);
  const setApexAiActivePortfolio = useAppStore((s) => s.setApexAiActivePortfolio);
  const resetWizard = useAppStore((s) => s.resetApexAiWizard);

  const [proposal, setProposal] = useState<ApexAiQuickSetupProposal | null>(null);
  const [portfolioName, setPortfolioName] = useState('Apex Bot #1');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wizard.capitalUsdt || !wizard.riskProfile) {
      nav('/apex-ai/onboarding');
      return;
    }
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProposal() {
    setIsLoading(true);
    setError(null);
    try {
      // First try the Edge Function (canonical path for production).
      // If it isn't deployed yet, fall back to deterministic client-side logic.
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'apex-ai-quick-setup',
          {
            body: {
              capital_usdt: wizard.capitalUsdt,
              risk_profile: wizard.riskProfile,
            },
          }
        );
        if (!fnError && data?.success && data.data) {
          setProposal(data.data as ApexAiQuickSetupProposal);
          return;
        }
        throw fnError ?? new Error(data?.error ?? 'edge_function_failed');
      } catch (fnErr) {
        // Graceful degradation — Edge Function not deployed or unreachable.
        // Deterministic proposal computed locally. Same result as server.
        if (import.meta.env.DEV) {
          console.warn(
            '[apex-ai] Edge Function unreachable, using client-side fallback',
            fnErr
          );
        }
        const localProposal = generateQuickSetupProposal({
          capital_usdt: wizard.capitalUsdt!,
          risk_profile: wizard.riskProfile!,
          locale: language === 'pt' ? 'pt' : 'en',
        });
        setProposal(localProposal);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!proposal || !portfolioName.trim()) return;
    if (!session?.user?.id) {
      toast({
        title: t('apexAi.setupToastErrorTitle'),
        description: 'Not authenticated. Please sign in again.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const symbols = proposal.symbols.map(({ symbol, allocation_pct, leverage }) => ({
        symbol,
        allocation_pct,
        leverage,
      }));

      let portfolioId: string | null = null;

      // Try Edge Function first
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'apex-ai-create-portfolio',
          {
            body: {
              name: portfolioName.trim(),
              capital_usdt: proposal.capital_usdt,
              risk_profile: proposal.risk_profile,
              max_leverage: proposal.max_leverage,
              max_positions: proposal.max_positions,
              risk_per_trade_pct: proposal.risk_per_trade_pct,
              symbols,
            },
          }
        );
        if (!fnError && data?.success && data.data?.portfolio_id) {
          portfolioId = data.data.portfolio_id as string;
        } else {
          throw fnError ?? new Error(data?.error ?? 'edge_function_failed');
        }
      } catch (fnErr) {
        if (import.meta.env.DEV) {
          console.warn(
            '[apex-ai] create-portfolio Edge Function unreachable, using client-side fallback',
            fnErr
          );
        }
        // Client-side fallback via supabase-js (RLS protects)
        const result = await createApexAiPortfolio(
          {
            name: portfolioName.trim(),
            capital_usdt: proposal.capital_usdt,
            risk_profile: proposal.risk_profile,
            max_leverage: proposal.max_leverage,
            max_positions: proposal.max_positions,
            risk_per_trade_pct: proposal.risk_per_trade_pct,
            symbols,
          },
          session.user.id
        );
        portfolioId = result.portfolio_id;
      }

      if (!portfolioId) throw new Error('Portfolio ID missing');

      setApexAiActivePortfolio(portfolioId);
      resetWizard();

      toast({
        title: t('apexAi.setupToastCreatedTitle'),
        description: t('apexAi.setupToastCreatedDesc'),
      });

      nav('/apex-ai/dashboard');
    } catch (err) {
      toast({
        title: t('apexAi.setupToastErrorTitle'),
        description:
          err instanceof Error
            ? err.message
            : t('apexAi.setupToastErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  const riskLabel = (p: ApexAiRiskProfile) =>
    p === 'conservative'
      ? t('apexAi.riskConservative')
      : p === 'balanced'
      ? t('apexAi.riskBalanced')
      : t('apexAi.riskAggressive');

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/onboarding')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="text-xs text-muted-foreground">{t('apexAi.setupLabel')}</div>
      </div>

      <div className="max-w-xl mx-auto">
        {isLoading && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold">{t('apexAi.setupLoadingTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('apexAi.setupLoadingDesc')}</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold">{t('apexAi.setupErrorTitle')}</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={loadProposal} variant="outline" size="sm">
                {t('apexAi.setupErrorRetry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {proposal && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">{t('apexAi.setupHeroTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('apexAi.setupHeroDesc')}</p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <Label htmlFor="name">{t('apexAi.setupNameLabel')}</Label>
                <Input
                  id="name"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  maxLength={50}
                />
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold">{t('apexAi.setupAiAnalysis')}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {proposal.ai_rationale}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ConfigStat
                    label={t('apexAi.setupStatCapital')}
                    value={`$${proposal.capital_usdt.toLocaleString()}`}
                  />
                  <ConfigStat
                    label={t('apexAi.setupStatProfile')}
                    value={riskLabel(proposal.risk_profile)}
                  />
                  <ConfigStat
                    label={t('apexAi.setupStatMaxLeverage')}
                    value={`${proposal.max_leverage}x`}
                  />
                  <ConfigStat
                    label={t('apexAi.setupStatMaxPositions')}
                    value={t('apexAi.setupStatMaxPositionsValue').replace(
                      '{{count}}',
                      String(proposal.max_positions)
                    )}
                  />
                  <ConfigStat
                    label={t('apexAi.setupStatRiskPerTrade')}
                    value={`${proposal.risk_per_trade_pct}%`}
                  />
                  <ConfigStat
                    label={t('apexAi.setupStatFee')}
                    value={t('apexAi.setupStatFeeValue')}
                    highlight
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t('apexAi.setupSymbolsTitle')}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('apexAi.setupSymbolsCount').replace(
                      '{{count}}',
                      String(proposal.symbols.length)
                    )}
                  </span>
                </div>
                <div className="space-y-2">
                  {proposal.symbols.map((s) => (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {s.symbol.replace('USDT', '')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.leverage}x · {s.allocation_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {s.rationale}
                        </p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <SafetyItem text={t('apexAi.setupSafetyItem1')} />
                <SafetyItem text={t('apexAi.setupSafetyItem2')} />
                <SafetyItem text={t('apexAi.setupSafetyItem3')} />
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              disabled={isCreating || !portfolioName.trim()}
              onClick={handleCreate}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('apexAi.setupCreating')}
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  {t('apexAi.setupCreateCta')}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ConfigStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={highlight ? 'font-bold text-emerald-400' : 'font-semibold text-foreground'}>
        {value}
      </p>
    </div>
  );
}

function SafetyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
