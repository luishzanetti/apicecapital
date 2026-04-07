import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { getAiTradeSetupContent } from '@/data/aiTradeSetup';
import {
  ArrowRight,
  Brain,
  ChartCandlestick,
  Clock3,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function AiTradeLanding() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const setupContent = useMemo(() => getAiTradeSetupContent(language), [language]);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            heroBadge: 'Estratégia. Setup. Crescimento contínuo.',
            heroTitle:
              'O jeito Apice de transformar IA, diversificação e operação 24/7 em patrimônio inteligente.',
            heroBody:
              'Aqui a IA não entra como espetáculo. Ela entra como método: filtra cenário, organiza execução, protege disciplina e ajuda você a crescer com mais clareza em um mercado que nunca dorme.',
            primaryCta: 'Iniciar experiência Apice',
            secondaryCta: 'Ver como funciona',
            heroStats: [
              { label: 'Metodologia', value: '3 camadas' },
              { label: 'Leitura operacional', value: '24/7' },
              { label: 'Custódia', value: 'Você no controle' },
            ],
            insightCards: [
              {
                icon: Brain,
                title: 'IA como filtro de decisão',
                body: 'A Apice transforma leitura de mercado em direção prática, para você operar com menos ruído e mais intenção.',
              },
              {
                icon: Layers3,
                title: 'Diversificação com propósito',
                body: 'Cada camada do portfólio cumpre um papel: proteger, sustentar e acelerar o crescimento quando o cenário permite.',
              },
              {
                icon: Clock3,
                title: 'Rotina que continua sem pausa',
                body: 'O mercado roda o tempo inteiro. O setup certo precisa acompanhar o ritmo sem depender de impulso.',
              },
            ],
            commandFlowEyebrow: 'Visão Apice',
            commandFlowTitle: 'Command Flow',
            controlTitle: 'Você continua no controle.',
            controlBody:
              'A Apice estrutura o método e orienta a execução. Os recursos continuam na sua corretora e as decisões seguem amarradas ao seu perfil.',
            methodBadge: 'Como a estratégia funciona',
            methodTitle:
              'Diversificar com IA não é fazer mais coisas. É fazer as coisas certas, na ordem certa.',
            methodBody:
              'A metodologia Apice combina leitura inteligente, distribuição estratégica de capital e operação contínua para transformar disciplina em uma vantagem real.',
            growthBadge: 'Fluxo de crescimento',
            growthTitle: 'Primeiro entendemos. Depois configuramos. Então escalamos.',
            growthBody:
              'O AI Trade Setup da Apice foi desenhado para reduzir improviso e colocar você dentro de uma rotina de evolução.',
            dailyBadge: 'Crescimento diário',
            dailyTitle: 'O objetivo não é operar mais. É crescer melhor todos os dias.',
            dailyBody:
              'A Apice fecha o ciclo com recomendações estratégicas, leitura de contexto e próximos passos claros para fazer o portfólio amadurecer.',
            nextEyebrow: 'Próximo passo',
            nextTitle: 'Entre no onboarding da Apice e monte seu setup com visão, método e execução.',
            nextBody:
              'A apresentação mostra o porquê. O onboarding traduz isso em perfil, plano semanal, estrutura de setup e rota de acompanhamento.',
            finalCta: 'Começar agora',
          }
        : {
            heroBadge: 'Strategy. Setup. Continuous growth.',
            heroTitle:
              'The Apice way to turn AI, diversification, and 24/7 execution into intelligent wealth.',
            heroBody:
              'AI is not here for theater. It is here as method: reading context, organizing execution, protecting discipline, and helping your capital grow in a market that never sleeps.',
            primaryCta: 'Start the Apice experience',
            secondaryCta: 'See how it works',
            heroStats: [
              { label: 'Methodology', value: '3 layers' },
              { label: 'Market read', value: '24/7' },
              { label: 'Custody', value: 'You stay in control' },
            ],
            insightCards: [
              {
                icon: Brain,
                title: 'AI as a decision filter',
                body: 'Apice turns noisy market data into practical direction, so every move starts with more clarity and less impulse.',
              },
              {
                icon: Layers3,
                title: 'Diversification with purpose',
                body: 'Each layer of the portfolio has a role: protect the base, sustain the routine, and accelerate when the backdrop allows it.',
              },
              {
                icon: Clock3,
                title: 'A routine that keeps going',
                body: 'Crypto moves all the time. The right setup has to match that rhythm without depending on emotional reactions.',
              },
            ],
            commandFlowEyebrow: 'Apice view',
            commandFlowTitle: 'Command Flow',
            controlTitle: 'You stay in control.',
            controlBody:
              'Apice structures the method and guides execution. Your capital stays on your exchange, and every decision stays tied to your profile.',
            methodBadge: 'How the strategy works',
            methodTitle:
              'Diversifying with AI is not about doing more things. It is about doing the right things in the right order.',
            methodBody:
              'The Apice methodology combines intelligent reads, strategic capital distribution, and continuous execution to turn discipline into a real edge.',
            growthBadge: 'Growth flow',
            growthTitle: 'First we understand. Then we configure. Then we scale.',
            growthBody:
              'Apice AI Trade Setup is designed to remove improvisation and place you inside an operating rhythm built for continuous improvement.',
            dailyBadge: 'Daily growth',
            dailyTitle: 'The goal is not to trade more. It is to grow better every day.',
            dailyBody:
              'Apice closes the loop with strategic recommendations, context reads, and clear next steps so the portfolio can mature with intention.',
            nextEyebrow: 'Next step',
            nextTitle: 'Enter the Apice onboarding and build your setup with vision, method, and execution.',
            nextBody:
              'The presentation explains the why. The onboarding turns it into profile, weekly plan, setup structure, and a clear follow-through route.',
            finalCta: 'Start now',
          },
    [language]
  );

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative flex min-h-screen items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.24),transparent_34%),radial-gradient(circle_at_85%_20%,hsl(var(--apice-gold)/0.18),transparent_22%),linear-gradient(180deg,hsl(225_30%_10%),hsl(225_22%_7%))]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:110px_110px]" />
        <motion.div
          className="absolute right-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/20 blur-[110px]"
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-8rem] left-[-4rem] h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]"
          animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 w-full px-6 py-16 md:px-10 lg:px-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-end"
          >
            <div className="space-y-8">
              <motion.div variants={fadeUp} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl apice-gradient-primary shadow-lg shadow-primary/30">
                    <ChartCandlestick className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">Apice</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">AI Trade Setup</p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70"
                >
                  {copy.heroBadge}
                </Badge>

                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl lg:text-7xl">
                  {copy.heroTitle}
                </h1>

                <p className="max-w-2xl text-base leading-7 text-white/68 md:text-lg">{copy.heroBody}</p>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
                <Button variant="gold" size="xl" onClick={() => navigate('/onboarding')}>
                  {copy.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="glass"
                  size="xl"
                  className="border-white/15 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('method')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {copy.secondaryCta}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
                {copy.heroStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md"
                  >
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="relative">
              <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] p-6 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">{copy.commandFlowEyebrow}</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{copy.commandFlowTitle}</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>

                <div className="space-y-4 py-6">
                  {copy.insightCards.map((card) => (
                    <div key={card.title} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                          <card.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/58">{card.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{copy.controlTitle}</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">{copy.controlBody}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="method" className="relative px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              {copy.methodBadge}
            </Badge>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">{copy.methodTitle}</h2>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">{copy.methodBody}</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {setupContent.pillars.map((pillar, index) => (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08 }}
                className="space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{pillar.eyebrow}</p>
                <h3 className="text-2xl font-bold leading-tight">{pillar.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{pillar.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20 px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              {copy.growthBadge}
            </Badge>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">{copy.growthTitle}</h2>
            <p className="text-base leading-7 text-muted-foreground">{copy.growthBody}</p>
          </div>

          <div className="space-y-6">
            {setupContent.stages.map((stage, index) => (
              <motion.div
                key={stage.step}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08 }}
                className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-card px-5 py-6 md:grid-cols-[auto_1fr_auto]"
              >
                <div className="text-4xl font-black text-primary/70">{stage.step}</div>
                <div>
                  <h3 className="text-xl font-bold">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{stage.description}</p>
                </div>
                <div className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {stage.outcome}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              {copy.dailyBadge}
            </Badge>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">{copy.dailyTitle}</h2>
            <p className="text-base leading-7 text-muted-foreground">{copy.dailyBody}</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {setupContent.dailyLoop.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08 }}
                className="space-y-4 rounded-[1.75rem] border border-border/60 bg-card px-5 py-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{item.eyebrow}</p>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
              </motion.article>
            ))}
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.1),transparent_55%)] px-6 py-8 md:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{copy.nextEyebrow}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{copy.nextTitle}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{copy.nextBody}</p>
              </div>

              <Button variant="premium" size="xl" onClick={() => navigate('/onboarding')}>
                {copy.finalCta}
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
