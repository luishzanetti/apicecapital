import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import {
  CheckCircle2,
  KeyRound,
  Wallet,
  Target,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap,
  Bot,
} from 'lucide-react';
import type { ApexAiRiskProfile } from '@/types/apexAi';
import { APEX_AI_FEE_RATE_PCT } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Onboarding (3 steps)
// Step 1: Confirma conexão Bybit (reuso se já conectado via Altis)
// Step 2: Define capital alocado
// Step 3: Escolhe perfil de risco → vai pro Setup
// ═════════════════════════════════════════════════════════════════

type Step = 1 | 2 | 3;

const RISK_PROFILES: Array<{
  id: ApexAiRiskProfile;
  label: string;
  description: string;
  expectedReturn: string;
  maxLeverage: number;
  color: string;
}> = [
  {
    id: 'conservative',
    label: 'Conservador',
    description: 'Foco em BTC/ETH/BNB. Alavancagem até 3x. Drawdown limitado.',
    expectedReturn: '1-3% ao mês',
    maxLeverage: 3,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Top 5 cryptos. Alavancagem até 5x. Equilíbrio risco/retorno.',
    expectedReturn: '3-8% ao mês',
    maxLeverage: 5,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  },
  {
    id: 'aggressive',
    label: 'Agressivo',
    description: 'Top 7 + altcoins com momentum. Alavancagem até 8x.',
    expectedReturn: '8-20% ao mês',
    maxLeverage: 8,
    color: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  },
];

export default function ApexAiOnboarding() {
  const nav = useNavigate();
  const wizard = useAppStore((s) => s.apexAiWizard);
  const updateWizard = useAppStore((s) => s.updateApexAiWizard);
  const { data: balance } = useExchangeBalance();

  const [step, setStep] = useState<Step>(1);
  const [capitalInput, setCapitalInput] = useState<string>(
    wizard.capitalUsdt?.toString() ?? ''
  );

  const hasBybitConnected = Boolean(balance && balance.total > 0);
  const bybitBalance = balance?.total ?? 0;

  const goNext = () => {
    if (step < 3) setStep((s) => (s + 1) as Step);
  };
  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else nav('/apex-ai');
  };

  const handleCapitalConfirm = () => {
    const capital = parseFloat(capitalInput);
    if (!isFinite(capital) || capital < 100) {
      alert('Capital mínimo: 100 USDT');
      return;
    }
    updateWizard({ capitalUsdt: capital });
    goNext();
  };

  const handleRiskConfirm = (profile: ApexAiRiskProfile) => {
    updateWizard({ riskProfile: profile, step: 'confirm' });
    nav('/apex-ai/setup');
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="text-xs text-muted-foreground">
          Passo {step} de 3
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              s < step
                ? 'bg-emerald-400'
                : s === step
                ? 'bg-emerald-500'
                : 'bg-border/40'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Bybit Connection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Conecte sua Bybit</h1>
                <p className="text-sm text-muted-foreground">
                  Apex AI precisa de uma API Key com permissão de trading para operar.
                </p>
              </div>

              {hasBybitConnected ? (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Bybit conectada</p>
                        <p className="text-sm text-muted-foreground">
                          Saldo disponível: <span className="font-semibold text-emerald-400">
                            ${bybitBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground">
                      Reutilizando conexão do Altis Trading. A API key permanece encriptada
                      (AES-256) e nunca sai do servidor.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <p className="text-sm">
                        Você ainda não conectou sua Bybit no app. Conecte primeiro em Configurações →
                        Exchange para continuar.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => nav('/settings?tab=exchange')}
                    >
                      Conectar Bybit
                    </Button>
                  </CardContent>
                </Card>
              )}

              <PermissionsInfo />

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                disabled={!hasBybitConnected}
                onClick={goNext}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Capital */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Quanto alocar?</h1>
                <p className="text-sm text-muted-foreground">
                  Defina o capital que o bot Apex AI vai gerenciar. Pode ser menor que seu saldo total.
                </p>
              </div>

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
                      Mínimo: 100 USDT · Saldo Bybit disponível: ${bybitBalance.toLocaleString()}
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

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4 flex gap-3">
                  <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode ajustar este valor depois. Fundos continuam na sua Bybit —
                    Apex AI apenas define o limite operacional do bot.
                  </p>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                disabled={!capitalInput || parseFloat(capitalInput) < 100}
                onClick={handleCapitalConfirm}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Risk Profile */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Qual seu perfil?</h1>
                <p className="text-sm text-muted-foreground">
                  A IA gera configurações diferentes para cada perfil. Escolha com calma.
                </p>
              </div>

              <div className="space-y-3">
                {RISK_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleRiskConfirm(p.id)}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all hover:scale-[1.02] ${p.color}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-lg">{p.label}</h3>
                      <span className="text-sm font-semibold">
                        {p.expectedReturn}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        Alavancagem máx.: <span className="font-semibold text-foreground">{p.maxLeverage}x</span>
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        Fee: <span className="font-semibold text-emerald-400">{APEX_AI_FEE_RATE_PCT}%</span> do profit
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <Card className="border-border/50">
                <CardContent className="p-4 flex gap-3">
                  <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Dica:</strong> Você pode trocar de perfil
                    a qualquer momento. O primeiro portfolio é sempre revisável antes de ativar.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PermissionsInfo() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Permissões da API Key</p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Read — posições, saldo, histórico</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Derivatives Trade — abrir/fechar posições</span>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400">Withdraw — NÃO (nunca acessamos)</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
