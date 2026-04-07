import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { referralLinks } from '@/data/sampleData';
import { useAppStore } from '@/store/appStore';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import {
  ArrowLeft,
  Bot,
  Brain,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function ReferralLinks() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const trackLinkClick = useAppStore((state) => state.trackLinkClick);
  const linkClicks = useAppStore((state) => state.linkClicks);

  const copy = useMemo(
    () =>
      language === 'pt'
        ? {
            categoryCopy: {
              exchange: 'Infraestrutura de execução',
              'ai-tool': 'Acesso convidado',
              infrastructure: 'Infraestrutura de automação',
            },
            back: 'Voltar',
            badge: 'Links convidados',
            title: 'Abra a infraestrutura certa para executar o método Apice com clareza.',
            body:
              'Esta tela concentra os redirecionamentos operacionais. É aqui que o link convidado da ferramenta original aparece quando necessário; no restante da jornada, a experiência permanece 100% sob a visão Apice.',
            clicked: 'Já acessado',
            open: 'Abrir link',
            securityTitle: 'Segurança da operação',
            securityBody:
              'O método Apice parte do princípio de custódia própria. Seus fundos continuam na corretora, e a estrutura operacional deve usar permissões mínimas.',
            nextTitle: 'Próximos passos sugeridos',
            nextBody:
              'Abra o parceiro necessário, volte para a Apice e siga a configuração do setup, do DCA e da rotina diária.',
            nextSteps: [
              '1. Criar ou revisar a conta na corretora.',
              '2. Acessar a ferramenta convidada quando o método pedir.',
              '3. Voltar ao app para configurar o plano e acompanhar os insights.',
            ],
            aiTradeTitle: 'Cointech2U · acesso convidado',
            aiTradeDescription:
              'Ambiente original convidado usado como referência operacional do setup da Apice. O nome aparece somente aqui, no momento do redirecionamento.',
            bybitDescription:
              'Abra a corretora parceira para conta, custódia e execução do plano dentro da metodologia Apice.',
            infraDescription:
              'Camada complementar de automação para manter consistência operacional no ecossistema Apice.',
          }
        : {
            categoryCopy: {
              exchange: 'Execution infrastructure',
              'ai-tool': 'Guest access',
              infrastructure: 'Automation infrastructure',
            },
            back: 'Back',
            badge: 'Guest links',
            title: 'Open the right infrastructure to execute the Apice method with clarity.',
            body:
              'This screen concentrates the operational redirects. The original solution name appears only here, on the guest access card, while the rest of the journey stays fully under the Apice narrative.',
            clicked: 'Opened already',
            open: 'Open link',
            securityTitle: 'Operational security',
            securityBody:
              'The Apice method starts from self-custody. Your funds stay on the exchange, and the operating structure should use minimal permissions.',
            nextTitle: 'Suggested next steps',
            nextBody:
              'Open the needed partner, return to Apice, and continue the setup, DCA configuration, and daily operating routine.',
            nextSteps: [
              '1. Create or review the exchange account.',
              '2. Open the guest tool only when the method calls for it.',
              '3. Return to the app to configure the plan and follow the insights.',
            ],
            aiTradeTitle: 'Cointech2U · guest access',
            aiTradeDescription:
              'Original invited environment used as the operational reference behind the Apice setup. The name appears only here, at the redirect moment.',
            bybitDescription:
              'Open the partner exchange for account creation, custody, and plan execution inside the Apice methodology.',
            infraDescription:
              'Complementary automation layer that helps maintain operational consistency across the Apice ecosystem.',
          },
    [language]
  );

  const links = useMemo(
    () =>
      referralLinks.map((link) => {
        const isAiTrade = link.id === 'ai-trade';
        const isClicked =
          link.id === 'bybit'
            ? linkClicks.bybitClicked
            : link.id === 'ai-bot'
              ? linkClicks.aiBotClicked
              : linkClicks.aiTradeClicked;

        return {
          ...link,
          isClicked,
          title: isAiTrade ? copy.aiTradeTitle : link.name,
          description: isAiTrade
            ? copy.aiTradeDescription
            : link.id === 'bybit'
              ? copy.bybitDescription
              : copy.infraDescription,
        };
      }),
    [copy, linkClicks]
  );

  const handleOpenLink = (linkId: string, url: string) => {
    if (linkId === 'bybit') {
      trackLinkClick('bybit');
    } else if (linkId === 'ai-bot') {
      trackLinkClick('aiBot');
    } else {
      trackLinkClick('aiTrade');
    }

    trackEvent(AnalyticsEvents.REFERRAL_LINK_CLICKED, { linkId });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background px-5 py-6 pb-28 safe-top">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-0">
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Button>
            <div className="space-y-3">
              <Badge variant="outline" className="px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                {copy.badge}
              </Badge>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{copy.title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{copy.body}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {links.map((link, index) => {
              const Icon = link.id === 'bybit' ? KeyRound : link.id === 'ai-trade' ? Brain : Bot;

              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card className="border-border/60 bg-card/95">
                    <CardContent className="pt-5">
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold">{link.title}</h2>
                            <Badge variant="outline" size="sm">
                              {copy.categoryCopy[link.category]}
                            </Badge>
                            {link.isClicked && (
                              <Badge variant="outline" size="sm" className="border-emerald-500/30 text-emerald-500">
                                {copy.clicked}
                              </Badge>
                            )}
                          </div>

                          <p className="mt-3 text-sm leading-7 text-muted-foreground">{link.description}</p>
                          <p className="mt-3 truncate text-xs text-muted-foreground/80">{link.url}</p>
                        </div>

                        <Button variant="premium" onClick={() => handleOpenLink(link.id, link.url)}>
                          {copy.open}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),transparent)]">
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-semibold">{copy.securityTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.securityBody}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-semibold">{copy.nextTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.nextBody}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {copy.nextSteps.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
