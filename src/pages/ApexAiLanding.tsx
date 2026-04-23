import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import {
  Bot,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Brain,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Activity,
  Percent,
} from 'lucide-react';

// ═════════════════════════════════════════════════════════════════
// Apex AI — Landing page / pitch
// Strategy: Clone otimizado da CoinTech2u com fee de 10% (vs 20% mercado).
// Trading IA 24/7 em futuros USDT-perpetual via Bybit.
// ═════════════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: Bot,
    title: 'IA 24/7',
    description: 'Bot que opera futuros na sua Bybit enquanto você dorme. Grid + DCA em hedge mode.',
  },
  {
    icon: Shield,
    title: 'Zero-Custody',
    description: 'Seu dinheiro fica na Bybit. Apex AI nunca toca nos seus fundos — apenas executa ordens via API.',
  },
  {
    icon: Percent,
    title: '10% de taxa',
    description: 'Cobramos apenas 10% do lucro líquido. Sem lucro, sem cobrança. Metade do mercado.',
  },
  {
    icon: Brain,
    title: 'Quick Setup IA',
    description: 'IA analisa seu capital e risk profile e gera uma configuração otimizada em segundos.',
  },
  {
    icon: Activity,
    title: 'Circuit Breaker',
    description: 'Drawdown > 20% em 24h? Bot pausa automaticamente e te avisa. Segurança em primeiro lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Real-time',
    description: 'Posições, P&L e trades ao vivo via Supabase Realtime. Você vê tudo, sempre.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Conecte sua Bybit',
    description: 'API Key com permissões apenas de trading (sem saque). AES-256 encryption.',
  },
  {
    num: '02',
    title: 'Quick Setup IA',
    description: 'Escolha capital e perfil. A IA gera sua configuração otimizada.',
  },
  {
    num: '03',
    title: 'Ative e monitore',
    description: 'Bot opera 24/7. Você acompanha pelo dashboard. Kill switch a qualquer momento.',
  },
];

export default function ApexAiLanding() {
  const nav = useNavigate();
  const markApexAiLandingViewed = useAppStore((s) => s.markApexAiLandingViewed);

  useEffect(() => {
    markApexAiLandingViewed();
  }, [markApexAiLandingViewed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 px-5">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto text-center space-y-6"
        >
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Nova estratégia Ápice
          </Badge>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Apex <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xl sm:text-2xl font-medium text-foreground">
              Trading 24/7 com IA.
              <br />
              <span className="text-muted-foreground">Só 10% do lucro.</span>
            </p>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Bot de IA que opera futuros na sua Bybit automaticamente. Taxa de apenas 10% sobre
            profit líquido — metade do que o mercado cobra. Sem custódia, sem burocracia.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              onClick={() => nav('/apex-ai/onboarding')}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            >
              Ativar Apex AI
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => nav('/strategies')}>
              Ver outras estratégias
            </Button>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto">
            <TrustStat value="10%" label="Taxa por profit" />
            <TrustStat value="24/7" label="Operação" />
            <TrustStat value="0%" label="Custódia" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-5 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Como funciona</h2>
          <p className="text-sm text-muted-foreground">
            Tudo que você precisa para renda passiva em crypto, sem complicação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
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
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="px-5 py-12 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">3 passos para começar</h2>
          <p className="text-sm text-muted-foreground">Menos de 5 minutos.</p>
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
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-5 py-12 max-w-2xl mx-auto">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg">Por que Apex AI?</h3>
            </div>

            <div className="space-y-3">
              <CompareRow label="Taxa sobre profit" apex="10%" competitor="20%" highlight />
              <CompareRow label="Tempo de ativação" apex="< 5 min" competitor="15-30 min" />
              <CompareRow label="Integração ao app Ápice" apex="✓" competitor="App separado" />
              <CompareRow label="Zero-Custody" apex="✓" competitor="✓" />
              <CompareRow label="Suporte em PT-BR" apex="✓" competitor="Limitado" />
            </div>

            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Compare lado a lado com plataformas internacionais. Apex AI entrega o mesmo
                core tech com fee de 10% e integração nativa ao ecossistema Ápice.
              </p>
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
            <h2 className="text-2xl font-bold">Pronto para começar?</h2>
            <p className="text-sm text-muted-foreground">
              Conecte sua Bybit, escolha seu perfil e deixe a IA trabalhar.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => nav('/apex-ai/onboarding')}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
          >
            Começar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sem taxa de setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Cancele a qualquer momento
            </span>
          </div>
        </div>
      </section>

      <div className="pb-8" />
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-2xl font-bold text-emerald-400">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CompareRow({
  label,
  apex,
  competitor,
  highlight,
}: {
  label: string;
  apex: string;
  competitor: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-foreground flex-1">{label}</span>
      <div className="flex items-center gap-3">
        <span
          className={
            highlight
              ? 'text-sm font-bold text-emerald-400 w-20 text-right'
              : 'text-sm font-semibold text-foreground w-20 text-right'
          }
        >
          {apex}
        </span>
        <span className="text-xs text-muted-foreground w-20 text-right line-through opacity-60">
          {competitor}
        </span>
      </div>
    </div>
  );
}
