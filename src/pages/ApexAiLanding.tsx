import { useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useExchangeBalance } from '@/hooks/useExchangeBalance';
import { useApexAiPortfolios } from '@/hooks/useApexAiData';
import {
  Bot,
  Zap,
  Shield,
  TrendingUp,
  Brain,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Activity,
  Wallet,
  Target,
  Eye,
} from 'lucide-react';
import type { ApexAiPortfolio } from '@/types/apexAi';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Landing page
// Benefit-first messaging. State-aware CTA (new user / has portfolio / bot running).
// Fee is mentioned as a feature, NEVER as the hero stat.
// ═════════════════════════════════════════════════════════════════

type UserState =
  | 'new_no_bybit'        // Never connected Bybit
  | 'new_has_bybit'       // Bybit connected, no Apex AI portfolio yet
  | 'has_paused_portfolio' // Portfolio created but bot is paused/stopped
  | 'has_active_portfolio'; // Bot is running

export default function ApexAiLanding() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const markApexAiLandingViewed = useAppStore((s) => s.markApexAiLandingViewed);
  // useExchangeBalance() returns { data, status, isLoading, ... }. The correct
  // way to know if user is connected is status === 'connected'. The balance
  // field is `grandTotal`, not `total`. Previous version had a bug that made
  // `hasBybit` ALWAYS false, even for connected users. [CEO feedback 2026-04-23]
  const { status: balanceStatus } = useExchangeBalance();
  const { data: portfolios } = useApexAiPortfolios();

  useEffect(() => {
    markApexAiLandingViewed();
  }, [markApexAiLandingViewed]);

  const hasBybit = balanceStatus === 'connected';
  const isBalanceLoading = balanceStatus === 'loading';
  const portfoliosLoading = portfolios === undefined;
  const hasPortfolios = Boolean(portfolios && portfolios.length > 0);
  const activePortfolios = portfolios?.filter((p) => p.status === 'active') ?? [];
  const hasActive = activePortfolios.length > 0;

  // Skip landing entirely for returning users — landing exists only to
  // onboard newcomers. The moment a user has any portfolio (active OR
  // paused), the landing becomes friction. Send them straight to the
  // dashboard. Onboarding is reachable from there if they want to add a
  // second portfolio.
  if (!portfoliosLoading && hasPortfolios) {
    return <Navigate to="/apex-ai/dashboard" replace />;
  }

  const userState: UserState = useMemo(() => {
    // While balance is loading, optimistically assume user is connected if
    // they already have a portfolio (saves a flash of "connect Bybit" banner
    // for returning users). New users see neutral state.
    if (hasActive) return 'has_active_portfolio';
    if (hasPortfolios) return 'has_paused_portfolio';
    if (isBalanceLoading || hasBybit) return 'new_has_bybit';
    return 'new_no_bybit';
  }, [hasActive, hasPortfolios, hasBybit, isBalanceLoading]);

  // State-aware primary CTA
  const primaryCta = useMemo(() => {
    switch (userState) {
      case 'has_active_portfolio':
      case 'has_paused_portfolio':
        return { label: t('apexAi.landingCtaOpenDashboard'), target: '/apex-ai/dashboard' };
      case 'new_has_bybit':
        // Skip Bybit step — go straight to capital selection
        return { label: t('apexAi.landingCtaActivate'), target: '/apex-ai/onboarding' };
      case 'new_no_bybit':
      default:
        return { label: t('apexAi.landingCtaActivate'), target: '/apex-ai/onboarding' };
    }
  }, [userState, t]);

  const FEATURES = [
    { icon: Wallet, titleKey: 'apexAi.landingFeature1Title', descKey: 'apexAi.landingFeature1Desc' },
    { icon: Bot, titleKey: 'apexAi.landingFeature2Title', descKey: 'apexAi.landingFeature2Desc' },
    { icon: Shield, titleKey: 'apexAi.landingFeature3Title', descKey: 'apexAi.landingFeature3Desc' },
    { icon: Brain, titleKey: 'apexAi.landingFeature4Title', descKey: 'apexAi.landingFeature4Desc' },
    { icon: Target, titleKey: 'apexAi.landingFeature5Title', descKey: 'apexAi.landingFeature5Desc' },
    { icon: Eye, titleKey: 'apexAi.landingFeature6Title', descKey: 'apexAi.landingFeature6Desc' },
  ];

  const STEPS = [
    { num: '01', titleKey: 'apexAi.landingStep1Title', descKey: 'apexAi.landingStep1Desc' },
    { num: '02', titleKey: 'apexAi.landingStep2Title', descKey: 'apexAi.landingStep2Desc' },
    { num: '03', titleKey: 'apexAi.landingStep3Title', descKey: 'apexAi.landingStep3Desc' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-14 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto text-center space-y-6"
        >
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('apexAi.landingBadge')}
          </Badge>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              {t('apexAi.landingHeroTitle')}{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                {t('apexAi.landingHeroTitleAccent')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl font-medium text-muted-foreground max-w-xl mx-auto">
              {t('apexAi.landingHeroSubtitle')}
            </p>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t('apexAi.landingHeroDescription')}
          </p>

          {/* State-aware status banner */}
          <StateBanner
            userState={userState}
            portfolios={portfolios ?? []}
            activeCount={activePortfolios.length}
          />

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              onClick={() => nav(primaryCta.target)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {primaryCta.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => nav('/strategies')}>
              {t('apexAi.landingCtaOther')}
            </Button>
          </div>

          {/* Trust stats — NO fee here, only outcome-focused */}
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto">
            <TrustStat
              value={t('apexAi.landingTrustOperationValue')}
              label={t('apexAi.landingTrustOperation')}
            />
            <TrustStat
              value={t('apexAi.landingTrustCustodyValue')}
              label={t('apexAi.landingTrustCustody')}
            />
            <TrustStat
              value={t('apexAi.landingTrustSetupValue')}
              label={t('apexAi.landingTrustSetup')}
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-5 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">{t('apexAi.landingFeaturesTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('apexAi.landingFeaturesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="border-border/50 hover:border-emerald-500/30 transition-colors h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{t(feature.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(feature.descKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="px-5 py-12 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">{t('apexAi.landingStepsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('apexAi.landingStepsSubtitle')}</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {step.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{t(step.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(step.descKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison — fee is ONE row among 5, not the hero */}
      <section className="px-5 py-12 max-w-2xl mx-auto">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg">{t('apexAi.landingCompareTitle')}</h3>
            </div>

            <div className="space-y-2">
              <CompareHeader
                apex={t('apexAi.landingCompareApex')}
                others={t('apexAi.landingCompareOthers')}
              />
              <CompareRow
                label={t('apexAi.landingCompareRowSetup')}
                apex={t('apexAi.landingCompareSetupApex')}
                competitor={t('apexAi.landingCompareSetupOthers')}
              />
              <CompareRow
                label={t('apexAi.landingCompareRowCustody')}
                apex={t('apexAi.landingCompareCustodyApex')}
                competitor={t('apexAi.landingCompareCustodyOthers')}
              />
              <CompareRow
                label={t('apexAi.landingCompareRowFee')}
                apex={t('apexAi.landingCompareFeeApex')}
                competitor={t('apexAi.landingCompareFeeOthers')}
              />
              <CompareRow
                label={t('apexAi.landingCompareRowLanguage')}
                apex={t('apexAi.landingCompareLanguageApex')}
                competitor={t('apexAi.landingCompareLanguageOthers')}
              />
              <CompareRow
                label={t('apexAi.landingCompareRowTransparency')}
                apex={t('apexAi.landingCompareTransparencyApex')}
                competitor={t('apexAi.landingCompareTransparencyOthers')}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-16">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('apexAi.landingFinalCtaTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('apexAi.landingFinalCtaDesc')}</p>
          </div>

          <Button
            size="lg"
            onClick={() => nav(primaryCta.target)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
          >
            {primaryCta.label}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
            <TrustPill>{t('apexAi.landingFinalCtaTrust1')}</TrustPill>
            <TrustPill>{t('apexAi.landingFinalCtaTrust2')}</TrustPill>
            <TrustPill>{t('apexAi.landingFinalCtaTrust3')}</TrustPill>
          </div>
        </div>
      </section>

      <div className="pb-8" />
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function StateBanner({
  userState,
  portfolios,
  activeCount,
}: {
  userState: UserState;
  portfolios: ApexAiPortfolio[];
  activeCount: number;
}) {
  const { t } = useTranslation();

  if (userState === 'new_no_bybit' || userState === 'new_has_bybit') return null;

  if (userState === 'has_active_portfolio') {
    const desc = t('apexAi.landingBotRunningDesc')
      .replace('{{count}}', String(activeCount))
      .replace('{{plural}}', activeCount > 1 ? 's' : '');
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="p-4 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-0.5 flex-1">
              <p className="font-semibold text-sm">{t('apexAi.landingBotRunningTitle')}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (userState === 'has_paused_portfolio') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-0.5 flex-1">
              <p className="font-semibold text-sm">{t('apexAi.landingBotCreatedTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('apexAi.landingBotCreatedDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-2xl font-bold text-emerald-400">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      {children}
    </span>
  );
}

function CompareHeader({ apex, others }: { apex: string; others: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
      <span className="text-xs text-muted-foreground flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-emerald-400 w-24 text-right">{apex}</span>
        <span className="text-xs text-muted-foreground w-24 text-right">{others}</span>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  apex,
  competitor,
}: {
  label: string;
  apex: string;
  competitor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-foreground flex-1">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-emerald-400 w-24 text-right">{apex}</span>
        <span className="text-xs text-muted-foreground w-24 text-right opacity-70">{competitor}</span>
      </div>
    </div>
  );
}
