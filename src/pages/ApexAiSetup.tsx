import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
import type { ApexAiQuickSetupProposal } from '@/types/apexAi';
import { APEX_AI_FEE_RATE_PCT } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Quick Setup
// Invoca Edge Function apex-ai-quick-setup para obter proposta da IA,
// exibe para o usuário, e ao confirmar cria o portfolio via
// apex-ai-create-portfolio.
// ═════════════════════════════════════════════════════════════════

export default function ApexAiSetup() {
  const nav = useNavigate();
  const wizard = useAppStore((s) => s.apexAiWizard);
  const setApexAiActivePortfolio = useAppStore((s) => s.setApexAiActivePortfolio);
  const resetWizard = useAppStore((s) => s.resetApexAiWizard);

  const [proposal, setProposal] = useState<ApexAiQuickSetupProposal | null>(null);
  const [portfolioName, setPortfolioName] = useState('Apex Bot #1');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirecionar se wizard não tem dados
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
      const { data, error: fnError } = await supabase.functions.invoke('apex-ai-quick-setup', {
        body: {
          capital_usdt: wizard.capitalUsdt,
          risk_profile: wizard.riskProfile,
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error ?? 'Unknown error');

      setProposal(data.data as ApexAiQuickSetupProposal);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar proposta';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!proposal || !portfolioName.trim()) return;

    setIsCreating(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('apex-ai-create-portfolio', {
        body: {
          name: portfolioName.trim(),
          capital_usdt: proposal.capital_usdt,
          risk_profile: proposal.risk_profile,
          max_leverage: proposal.max_leverage,
          max_positions: proposal.max_positions,
          risk_per_trade_pct: proposal.risk_per_trade_pct,
          symbols: proposal.symbols.map(({ symbol, allocation_pct, leverage }) => ({
            symbol,
            allocation_pct,
            leverage,
          })),
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error ?? 'Erro ao criar portfolio');

      const newId: string = data.data.portfolio_id;
      setApexAiActivePortfolio(newId);
      resetWizard();

      toast({
        title: 'Portfolio criado ✨',
        description: 'Seu Apex AI está pronto. Ative no dashboard para começar.',
      });

      nav('/apex-ai/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar portfolio';
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai/onboarding')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="text-xs text-muted-foreground">Quick Setup IA</div>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Analisando seu perfil…</p>
              <p className="text-sm text-muted-foreground">
                A IA está calibrando a melhor configuração para você.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold">Erro ao gerar proposta</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={loadProposal} variant="outline" size="sm">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Proposal */}
        {proposal && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Sua configuração está pronta</h1>
              <p className="text-sm text-muted-foreground">
                Revise antes de ativar. Pode ajustar os parâmetros manualmente se quiser.
              </p>
            </div>

            {/* Portfolio name */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <Label htmlFor="name">Nome do portfolio</Label>
                <Input
                  id="name"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  maxLength={50}
                />
              </CardContent>
            </Card>

            {/* AI rationale */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold">Análise da IA</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {proposal.ai_rationale}
                </p>
              </CardContent>
            </Card>

            {/* Config summary */}
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ConfigStat label="Capital alocado" value={`$${proposal.capital_usdt.toLocaleString()}`} />
                  <ConfigStat label="Perfil" value={capitalize(proposal.risk_profile)} />
                  <ConfigStat label="Alavancagem máx." value={`${proposal.max_leverage}x`} />
                  <ConfigStat label="Posições simultâneas" value={`até ${proposal.max_positions}`} />
                  <ConfigStat label="Risco por trade" value={`${proposal.risk_per_trade_pct}%`} />
                  <ConfigStat label="Fee" value={`${APEX_AI_FEE_RATE_PCT}% profit`} highlight />
                </div>
              </CardContent>
            </Card>

            {/* Symbols */}
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Pares selecionados</span>
                  <span className="text-xs text-muted-foreground">
                    {proposal.symbols.length} símbolos
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
                          <span className="font-semibold text-sm">{s.symbol.replace('USDT', '')}</span>
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

            {/* Safety info */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Circuit breaker ativo: drawdown 24h &gt; 20% pausa automaticamente</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kill switch disponível a qualquer momento no dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Portfolio inicia pausado — você ativa manualmente</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              disabled={isCreating || !portfolioName.trim()}
              onClick={handleCreate}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Criar portfolio Apex AI
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
