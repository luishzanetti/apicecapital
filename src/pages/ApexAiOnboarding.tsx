import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { toast } from '@/components/ui/use-toast';
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
  AlertCircle,
} from 'lucide-react';
import type { ApexAiRiskProfile } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Onboarding (state-aware wizard)
//
// If user has Bybit connected: skip step 1 (shows as pre-confirmed "step 0" check)
// If user doesn't: step 1 is "confirm connection" but redirects to Settings.
// Steps 2 (capital) and 3 (risk) are always shown.
// ═════════════════════════════════════════════════════════════════

type Step = 'capital' | 'risk';
const TOTAL_STEPS_WITH_BYBIT = 2;

export default function ApexAiOnboarding() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const wizard = useAppStore((s) => s.apexAiWizard);
  const updateWizard = useAppStore((s) => s.updateApexAiWizard);
  // The hook returns { data, status, isLoading, ... }. Use `status==='connected'`
  // — NOT a naive balance check. The balance field is `grandTotal`, not `total`.
  // Bug fix: previous version always returned hasBybitConnected=false. [2026-04-23]
  const { data: balance, status: balanceStatus, isLoading: balanceLoading } = useExchangeBalance();

  const [step, setStep] = useState<Step>('capital');
  const [capitalInput, setCapitalInput] = useState<string>(
    wizard.capitalUsdt?.toString() ?? ''
  );

  const hasBybitConnected = balanceStatus === 'connected';
  const isCheckingBybit = balanceStatus === 'loading' || balanceLoading;
  const bybitBalance = balance?.grandTotal ?? balance?.totalEquity ?? 0;

  function goBack() {
    if (step === 'risk') setStep('capital');
    else nav('/apex-ai');
  }

  function handleCapitalConfirm() {
    const capital = parseFloat(capitalInput);
    if (!isFinite(capital) || capital < 100) {
      toast({
        title: t('apexAi.onboardingStep2MinError'),
        variant: 'destructive',
      });
      return;
    }
    updateWizard({ capitalUsdt: capital });
    setStep('risk');
  }

  function handleRiskConfirm(profile: ApexAiRiskProfile) {
    updateWizard({ riskProfile: profile, step: 'confirm' });
    nav('/apex-ai/setup');
  }

  // ── Loading state: waiting for Bybit balance fetch ──
  // CRITICAL: Don't show "Connect Bybit" blocker while we're still checking.
  // This prevents a flash of false-negative state for connected users.
  if (isCheckingBybit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 md:px-6 lg:px-8 py-5 safe-top">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg">
            <svg
              className="w-6 h-6 text-white animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="30 60"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('apexAi.dashboardLoading')}
          </p>
        </div>
      </div>
    );
  }

  // ── Blocker: genuinely NOT connected (status === 'no_credentials' or 'error') ──
  if (!hasBybitConnected) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
        <Button variant="ghost" size="sm" onClick={() => nav('/apex-ai')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>

        <div className="max-w-md mx-auto pt-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{t('apexAi.onboardingStep1TitleAlt')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('apexAi.onboardingStep1NotConnectedDesc')}
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => nav('/settings?tab=exchange')}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600"
          >
            {t('apexAi.onboardingStep1NotConnectedCta')}
          </Button>

          <PermissionsInfo />
        </div>
      </div>
    );
  }

  // ── Normal flow: Bybit connected, show 2-step wizard ──
  const currentStepNum = step === 'capital' ? 1 : 2;
  const stepLabel = t('apexAi.onboardingStepLabel')
    .replace('{{current}}', String(currentStepNum))
    .replace('{{total}}', String(TOTAL_STEPS_WITH_BYBIT));

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-5 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="text-xs text-muted-foreground">{stepLabel}</div>
      </div>

      {/* Bybit status — always visible (pre-confirmed) */}
      <div className="max-w-xl mx-auto mb-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{t('apexAi.onboardingStep1ConnectedTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('apexAi.onboardingStep1ConnectedDesc').replace(
                  '{{balance}}',
                  `$${bybitBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar (2 steps only since Bybit is pre-confirmed) */}
      <div className="max-w-xl mx-auto mb-8 flex gap-1.5">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              s < currentStepNum
                ? 'bg-emerald-400'
                : s === currentStepNum
                ? 'bg-emerald-500'
                : 'bg-border/40'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step: Capital */}
          {step === 'capital' && (
            <motion.div
              key="capital"
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
                <h1 className="text-2xl font-bold">{t('apexAi.onboardingStep2Title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('apexAi.onboardingStep2Desc')}
                </p>
              </div>

              <Card className="border-border/50">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="capital">{t('apexAi.onboardingStep2CapitalLabel')}</Label>
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
                      {t('apexAi.onboardingStep2CapitalHint').replace(
                        '{{balance}}',
                        `$${bybitBalance.toLocaleString()}`
                      )}
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
                    {t('apexAi.onboardingStep2Note')}
                  </p>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                disabled={!capitalInput || parseFloat(capitalInput) < 100}
                onClick={handleCapitalConfirm}
              >
                {t('common.continue')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step: Risk Profile */}
          {step === 'risk' && (
            <motion.div
              key="risk"
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
                <h1 className="text-2xl font-bold">{t('apexAi.onboardingStep3Title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('apexAi.onboardingStep3Desc')}
                </p>
              </div>

              <div className="space-y-3">
                <RiskCard
                  profile="conservative"
                  title={t('apexAi.onboardingStep3Conservative')}
                  description={t('apexAi.onboardingStep3ConservativeDesc')}
                  expectedReturn={t('apexAi.onboardingStep3ConservativeReturn')}
                  maxLeverage={3}
                  color="text-blue-400 border-blue-500/30 bg-blue-500/5"
                  onClick={() => handleRiskConfirm('conservative')}
                />
                <RiskCard
                  profile="balanced"
                  title={t('apexAi.onboardingStep3Balanced')}
                  description={t('apexAi.onboardingStep3BalancedDesc')}
                  expectedReturn={t('apexAi.onboardingStep3BalancedReturn')}
                  maxLeverage={5}
                  color="text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                  onClick={() => handleRiskConfirm('balanced')}
                />
                <RiskCard
                  profile="aggressive"
                  title={t('apexAi.onboardingStep3Aggressive')}
                  description={t('apexAi.onboardingStep3AggressiveDesc')}
                  expectedReturn={t('apexAi.onboardingStep3AggressiveReturn')}
                  maxLeverage={8}
                  color="text-orange-400 border-orange-500/30 bg-orange-500/5"
                  onClick={() => handleRiskConfirm('aggressive')}
                />
              </div>

              <Card className="border-border/50">
                <CardContent className="p-4 flex gap-3">
                  <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('apexAi.onboardingStep3Tip')}
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

// ─── Subcomponents ──────────────────────────────────────────

function RiskCard({
  profile,
  title,
  description,
  expectedReturn,
  maxLeverage,
  color,
  onClick,
}: {
  profile: ApexAiRiskProfile;
  title: string;
  description: string;
  expectedReturn: string;
  maxLeverage: number;
  color: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const leverageLabel = t('apexAi.onboardingStep3MaxLeverage').replace(
    '{{leverage}}',
    String(maxLeverage)
  );

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 p-5 transition-all hover:scale-[1.02] ${color}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <span className="text-sm font-semibold">{expectedReturn}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">{leverageLabel}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{t('apexAi.onboardingStep3FeeNote')}</span>
      </div>
    </button>
  );
}

function PermissionsInfo() {
  const { t } = useTranslation();
  return (
    <Card className="border-border/50 text-left">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">{t('apexAi.onboardingStep1PermissionsTitle')}</p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('apexAi.onboardingStep1PermissionsRead')}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('apexAi.onboardingStep1PermissionsTrade')}</span>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400">{t('apexAi.onboardingStep1PermissionsWithdraw')}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
