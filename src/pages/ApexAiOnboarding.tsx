import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createApexAiPortfolio } from '@/lib/apexAi/createPortfolio';
import {
  CheckCircle2,
  KeyRound,
  Wallet,
  ArrowLeft,
  Shield,
  Bot,
  Award,
  Sparkles,
  Rocket,
  Loader2,
} from 'lucide-react';
import type { ApexAiRiskProfile } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Onboarding (single-step, validated config)
//
// CEO directive 2026-04-25: a única configuração é a validada
// (BTC/USDT, Moderado, backtest 3y · 100% win rate · +543% · DD 40.7%).
// Página /apex-ai/setup foi eliminada — este Onboarding cria o portfolio
// direto e navega ao dashboard. Sem escolha de pares, leverage ou perfil.
// ═════════════════════════════════════════════════════════════════

const VALIDATED_PROFILE: ApexAiRiskProfile = 'balanced'; // Moderado (config validada)

const VALIDATED_CONFIG = {
  symbols: [{ symbol: 'BTCUSDT', allocation_pct: 100, leverage: 3 }],
  max_leverage: 3,
  max_positions: 5, // 5 Martingale layers max
  risk_per_trade_pct: 2.0,
};

export default function ApexAiOnboarding() {
  const nav = useNavigate();
  const { session } = useAuth();
  const wizard = useAppStore((s) => s.apexAiWizard);
  const setApexAiActivePortfolio = useAppStore((s) => s.setApexAiActivePortfolio);
  const resetWizard = useAppStore((s) => s.resetApexAiWizard);
  const { data: balance, status: balanceStatus, isLoading: balanceLoading } = useExchangeBalance();

  const [capitalInput, setCapitalInput] = useState<string>(
    wizard.capitalUsdt?.toString() ?? ''
  );
  const [isCreating, setIsCreating] = useState(false);

  const hasBybitConnected = balanceStatus === 'connected';
  const isCheckingBybit = balanceStatus === 'loading' || balanceLoading;
  const bybitBalance = balance?.grandTotal ?? balance?.totalEquity ?? 0;

  function goBack() {
    nav('/apex-ai');
  }

  async function handleActivate() {
    const capital = parseFloat(capitalInput);
    if (!isFinite(capital) || capital < 100) {
      toast({
        title: 'Capital mínimo $100',
        description: 'Apex AI precisa de pelo menos 100 USDT alocados.',
        variant: 'destructive',
      });
      return;
    }
    if (!session?.user?.id) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const portfolioName = `Apex Bot #${Math.floor(Date.now() / 1000) % 1000}`;
      let portfolioId: string | null = null;

      // Try Edge Function first (canonical); fall back to client-side
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'apex-ai-create-portfolio',
          {
            body: {
              name: portfolioName,
              capital_usdt: capital,
              risk_profile: VALIDATED_PROFILE,
              max_leverage: VALIDATED_CONFIG.max_leverage,
              max_positions: VALIDATED_CONFIG.max_positions,
              risk_per_trade_pct: VALIDATED_CONFIG.risk_per_trade_pct,
              symbols: VALIDATED_CONFIG.symbols,
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
            '[apex-ai] create-portfolio edge fn unreachable, using client fallback',
            fnErr
          );
        }
        const result = await createApexAiPortfolio(
          {
            name: portfolioName,
            capital_usdt: capital,
            risk_profile: VALIDATED_PROFILE,
            max_leverage: VALIDATED_CONFIG.max_leverage,
            max_positions: VALIDATED_CONFIG.max_positions,
            risk_per_trade_pct: VALIDATED_CONFIG.risk_per_trade_pct,
            symbols: VALIDATED_CONFIG.symbols,
          },
          session.user.id
        );
        portfolioId = result.portfolio_id;
      }

      if (!portfolioId) throw new Error('Portfolio ID ausente após criação');

      setApexAiActivePortfolio(portfolioId);
      resetWizard();

      toast({
        title: 'Apex AI ativado',
        description: `BTC/USDT · 3x · Moderado validado · $${capital.toLocaleString()} alocados`,
      });

      nav('/apex-ai/dashboard');
    } catch (err) {
      toast({
        title: 'Falha ao ativar Apex AI',
        description: err instanceof Error ? err.message : 'Erro desconhecido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  // ── Loading state: waiting for Bybit balance fetch ──
  if (isCheckingBybit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 md:px-6 lg:px-8 py-5 safe-top">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Verificando conexão Bybit…</p>
        </div>
      </div>
    );
  }

  // ── Blocker: genuinely NOT connected ──
  if (!hasBybitConnected) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
        <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <div className="max-w-md mx-auto pt-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Conecte sua Bybit</h1>
            <p className="text-sm text-muted-foreground">
              Apex AI precisa de acesso de leitura e trade na sua conta Bybit para operar
              automaticamente. Suas credenciais ficam criptografadas e o saque permanece bloqueado.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => nav('/settings?tab=exchange')}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600"
          >
            Conectar Bybit
          </Button>

          <PermissionsInfo />
        </div>
      </div>
    );
  }

  // ── Normal flow: Bybit connected, single capital step ──
  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="text-xs text-muted-foreground">Configuração validada</div>
      </div>

      {/* Bybit status — always visible (pre-confirmed) */}
      <div className="max-w-xl mx-auto mb-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Bybit conectada</p>
              <p className="text-xs text-muted-foreground">
                Saldo disponível: $
                {bybitBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content — single capital step + validated config preview */}
      <div className="max-w-xl mx-auto">
        <motion.div
          key="capital"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Quanto deseja alocar?</h1>
            <p className="text-sm text-muted-foreground">
              Apex AI vai operar com a configuração validada do backtest oficial.
            </p>
          </div>

          {/* Capital input */}
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Capital alocado (USDT)</Label>
                <Input
                  id="capital"
                  type="number"
                  inputMode="decimal"
                  placeholder="500"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  min={100}
                  step={50}
                  className="text-lg h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo $100 · Saldo Bybit disponível: $
                  {bybitBalance.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setCapitalInput(amt.toString())}
                  >
                    ${amt.toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Validated config card */}
          <Card className="border-emerald-500/40 bg-emerald-500/5 relative overflow-hidden">
            <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow z-10">
              <Sparkles className="w-3 h-3" />
              Configuração Validada
            </div>
            <CardContent className="p-5 pt-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Modo Moderado</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Martingale DCA inteligente · SMA-20 · ATR dinâmico · Smart
                    Reserve Protocol. A configuração que rendeu{' '}
                    <span className="font-semibold text-emerald-400">
                      100% win rate em 250 ciclos
                    </span>{' '}
                    no backtest oficial.
                  </p>
                </div>
              </div>

              {capitalInput && parseFloat(capitalInput) >= 100 && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                    📊 Backtest oficial Apice (3 anos · BTC/USDT)
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Capital projetado:
                    </span>
                    <span className="font-bold">
                      <span className="text-muted-foreground">
                        ${parseFloat(capitalInput).toLocaleString()}
                      </span>
                      {' → '}
                      <span className="text-emerald-400">
                        $
                        {(parseFloat(capitalInput) * 6.43).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                      </span>
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Win rate 100% · 0 CB triggers · Sharpe 1.19 · referência
                    histórica
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
                  <span className="text-muted-foreground">Alavancagem:</span>{' '}
                  <span className="font-semibold">3x</span>
                </div>
                <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
                  <span className="text-muted-foreground">Camadas:</span>{' '}
                  <span className="font-semibold">5 max</span>
                </div>
                <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
                  <span className="text-muted-foreground">TP:</span>{' '}
                  <span className="font-semibold">1.2% blended</span>
                </div>
                <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
                  <span className="text-muted-foreground">Reserve:</span>{' '}
                  <span className="font-semibold">10% lucro</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-md bg-blue-500/5 border border-blue-500/20 p-2.5">
                <Bot className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Bot nunca fecha em prejuízo · 10% de cada ciclo lucrativo
                  alimenta o Reserve Fund automaticamente · Filtro SMA-20
                  bloqueia abertura em downtrends fortes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20"
            disabled={
              isCreating || !capitalInput || parseFloat(capitalInput) < 100
            }
            onClick={handleActivate}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ativando Apex AI…
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Ativar Apex AI
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            Portfolio inicia pausado · ativação manual no dashboard · circuit breaker
            automático em 24h drawdown &gt; 20% · kill switch sempre disponível
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function PermissionsInfo() {
  return (
    <Card className="border-border/50 text-left">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Permissões necessárias</p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Leitura — saldo, posições e ordens</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trade — abrir e fechar posições no mercado de futuros</span>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400">Saque permanece bloqueado (segurança)</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
