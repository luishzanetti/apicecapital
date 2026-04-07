import type { InvestorType, UserProfile } from '@/store/types';

export type AppLanguage = 'en' | 'pt';

export interface NarrativeItem {
  eyebrow: string;
  title: string;
  description: string;
}

export interface StageItem {
  step: string;
  title: string;
  description: string;
  outcome: string;
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface StrategyBlueprint {
  title: string;
  allocation: Array<{ label: string; percentage: number }>;
  note: string;
}

interface AiTradeSetupContent {
  pillars: NarrativeItem[];
  stages: StageItem[];
  dailyLoop: NarrativeItem[];
  goalOptions: ChoiceOption<NonNullable<UserProfile['goal']>>[];
  experienceOptions: ChoiceOption<NonNullable<UserProfile['experience']>>[];
  riskOptions: ChoiceOption<NonNullable<UserProfile['riskTolerance']>>[];
  capitalOptions: ChoiceOption<NonNullable<UserProfile['capitalRange']>>[];
  investorTypeLabels: Record<InvestorType, string>;
  strategyBlueprints: Record<InvestorType, StrategyBlueprint>;
}

const aiTradeSetupContent: Record<AppLanguage, AiTradeSetupContent> = {
  en: {
    pillars: [
      {
        eyebrow: 'Intelligent reads',
        title: 'AI crosses market context, investor profile, and discipline before it suggests the next move.',
        description:
          'This is not about picking random coins. The Apice method weighs goal, risk tolerance, available capital, and market context to guide execution with clarity.',
      },
      {
        eyebrow: 'Active diversification',
        title: 'Diversifying with AI means distributing conviction, not scattering capital.',
        description:
          'The setup starts with a core base in primary assets and only expands into growth layers when the investor profile supports it.',
      },
      {
        eyebrow: '24/7 operations',
        title: 'The market never closes, so the routine has to keep working even when you are not watching.',
        description:
          'Apice organizes a continuous operating rhythm with monitoring, triggers, and strategic recommendations that reduce impulse and protect consistency.',
      },
    ],
    stages: [
      {
        step: '01',
        title: 'We map your current moment',
        description:
          'We translate your objective, experience, risk profile, and capital range into a realistic setup framework.',
        outcome: 'Outcome: a clear operating profile.',
      },
      {
        step: '02',
        title: 'We build and configure the tool',
        description:
          'You follow the Apice method to assemble the plan, connect the required infrastructure, and activate the workflow with clarity.',
        outcome: 'Outcome: a setup aligned with your profile.',
      },
      {
        step: '03',
        title: 'We analyze the result and optimize',
        description:
          'AI reads what happened, surfaces imbalances, and proposes strategic recommendations to grow the portfolio intelligently.',
        outcome: 'Outcome: continuous improvement backed by data.',
      },
    ],
    dailyLoop: [
      {
        eyebrow: 'Every day',
        title: 'Read the market without getting lost in noise.',
        description:
          'AI condenses context, risk, and opportunity into practical signals so you know what deserves attention first.',
      },
      {
        eyebrow: 'Every week',
        title: 'Consistency compounds harder than hunting the perfect trade.',
        description:
          'The Apice operating routine protects contribution discipline, avoids overconcentration, and keeps the setup alive.',
      },
      {
        eyebrow: 'Every cycle',
        title: 'Growth comes from refinement, not improvisation.',
        description:
          'A portfolio matures when strategy is reviewed with method instead of being abandoned on every swing.',
      },
    ],
    goalOptions: [
      {
        value: 'passive-income',
        label: 'Smart income',
        description: 'Build cash flow and upside through a disciplined operating routine.',
      },
      {
        value: 'growth',
        label: 'Multiply capital',
        description: 'Prioritize long-term expansion with a clear strategic framework.',
      },
      {
        value: 'balanced',
        label: 'Balanced growth',
        description: 'Blend defense, diversification, and upside in a single structure.',
      },
      {
        value: 'protection',
        label: 'Protect then scale',
        description: 'Build a strong base first, then accelerate risk with intention.',
      },
    ],
    experienceOptions: [
      {
        value: 'new',
        label: 'Starting now',
        description: 'I need clarity, direction, and simple language.',
      },
      {
        value: 'intermediate',
        label: 'Already investing',
        description: 'I want a smarter system to organize execution.',
      },
      {
        value: 'experienced',
        label: 'Advanced profile',
        description: 'I am looking for structure, speed, and better daily reads.',
      },
    ],
    riskOptions: [
      {
        value: 'low',
        label: 'Conservative',
        description: 'More weight on protection, predictability, and core assets.',
      },
      {
        value: 'medium',
        label: 'Balanced',
        description: 'Mix growth with defense to perform with discipline.',
      },
      {
        value: 'high',
        label: 'Aggressive',
        description: 'Accept more volatility in pursuit of higher upside.',
      },
    ],
    capitalOptions: [
      {
        value: 'under-200',
        label: 'Up to $200',
        description: 'A lean structure to start with method.',
      },
      {
        value: '200-1k',
        label: '$200 to $1k',
        description: 'A strong band for a core base and first diversification layer.',
      },
      {
        value: '1k-5k',
        label: '$1k to $5k',
        description: 'Enough capital for a more robust, purposeful structure.',
      },
      {
        value: '5k-plus',
        label: '$5k+',
        description: 'Room for a more strategic and scalable setup.',
      },
    ],
    investorTypeLabels: {
      'Conservative Builder': 'Conservative Builder',
      'Balanced Optimizer': 'Balanced Optimizer',
      'Growth Seeker': 'Growth Seeker',
    },
    strategyBlueprints: {
      'Conservative Builder': {
        title: 'Defensive base with disciplined growth',
        allocation: [
          { label: 'BTC', percentage: 60 },
          { label: 'ETH', percentage: 25 },
          { label: 'Tactical reserve', percentage: 15 },
        ],
        note: 'The priority here is protecting the base while using AI to buy with more consistency across the cycle.',
      },
      'Balanced Optimizer': {
        title: 'Balanced portfolio with AI as co-pilot',
        allocation: [
          { label: 'BTC', percentage: 40 },
          { label: 'ETH', percentage: 30 },
          { label: 'Growth layer', percentage: 20 },
          { label: 'Reserve', percentage: 10 },
        ],
        note: 'A balanced mix makes it easier to grow while keeping room for strategic rebalancing through the cycle.',
      },
      'Growth Seeker': {
        title: 'Expansion structure with controlled upside',
        allocation: [
          { label: 'BTC', percentage: 30 },
          { label: 'ETH', percentage: 25 },
          { label: 'L1 / Infra', percentage: 25 },
          { label: 'Opportunities', percentage: 20 },
        ],
        note: 'Aggression only works when it rests on method: a strong base funds asymmetry in the growth layers.',
      },
    },
  },
  pt: {
    pillars: [
      {
        eyebrow: 'Leitura inteligente',
        title: 'A IA cruza cenário, perfil e disciplina antes de sugerir o próximo movimento.',
        description:
          'Não é só escolher moedas. A metodologia Apice considera objetivo, tolerância a risco, capital disponível e contexto de mercado para orientar a execução com mais clareza.',
      },
      {
        eyebrow: 'Diversificação ativa',
        title: 'Diversificar com IA significa distribuir convicção, não pulverizar capital.',
        description:
          'A construção do setup parte de uma base sólida em ativos principais e abre espaço para camadas de crescimento de acordo com o perfil do investidor.',
      },
      {
        eyebrow: 'Operação 24/7',
        title: 'O mercado não fecha. Por isso a rotina precisa funcionar mesmo quando você não está olhando.',
        description:
          'A Apice organiza uma operação contínua com acompanhamento, gatilhos e recomendações para reduzir impulsividade e manter constância durante todo o ciclo.',
      },
    ],
    stages: [
      {
        step: '01',
        title: 'Entendemos seu momento',
        description:
          'Mapeamos seu objetivo, experiência, perfil de risco e faixa de capital para transformar intenção em um setup realista.',
        outcome: 'Saída: perfil operacional claro.',
      },
      {
        step: '02',
        title: 'Criamos e configuramos a ferramenta',
        description:
          'Você segue o método Apice para montar o plano, conectar a estrutura necessária e ativar a rotina com clareza de execução.',
        outcome: 'Saída: setup alinhado ao seu perfil.',
      },
      {
        step: '03',
        title: 'Analisamos o resultado e ajustamos',
        description:
          'A IA lê o que aconteceu, destaca desalinhamentos e propõe recomendações estratégicas para crescer o portfólio de forma inteligente.',
        outcome: 'Saída: evolução contínua orientada por dados.',
      },
    ],
    dailyLoop: [
      {
        eyebrow: 'Todos os dias',
        title: 'Ler o mercado sem se perder no ruído.',
        description:
          'A IA resume contexto, risco e oportunidade em linguagem acionável para você saber o que observar primeiro.',
      },
      {
        eyebrow: 'Toda semana',
        title: 'Executar com constância vale mais do que caçar o trade perfeito.',
        description:
          'A rotina operacional da Apice protege a disciplina de aporte, evita concentração excessiva e mantém o setup vivo.',
      },
      {
        eyebrow: 'Todo ciclo',
        title: 'Crescimento vem de ajuste fino, não de improviso.',
        description:
          'O portfólio amadurece quando a estratégia é revisada com método, sem abandonar a tese a cada oscilação.',
      },
    ],
    goalOptions: [
      {
        value: 'passive-income',
        label: 'Renda inteligente',
        description: 'Buscar fluxo e crescimento com rotina operacional consistente.',
      },
      {
        value: 'growth',
        label: 'Multiplicar patrimônio',
        description: 'Priorizar expansão de capital com visão estratégica de longo prazo.',
      },
      {
        value: 'balanced',
        label: 'Crescer com equilíbrio',
        description: 'Combinar defesa, diversificação e upside em uma mesma estrutura.',
      },
      {
        value: 'protection',
        label: 'Proteger e escalar',
        description: 'Construir base forte antes de acelerar a tomada de risco.',
      },
    ],
    experienceOptions: [
      {
        value: 'new',
        label: 'Começando agora',
        description: 'Preciso de clareza, direção e linguagem simples.',
      },
      {
        value: 'intermediate',
        label: 'Já invisto',
        description: 'Quero um método mais inteligente para organizar a execução.',
      },
      {
        value: 'experienced',
        label: 'Perfil avançado',
        description: 'Busco estrutura, velocidade e leitura estratégica diária.',
      },
    ],
    riskOptions: [
      {
        value: 'low',
        label: 'Conservador',
        description: 'Mais peso em proteção, previsibilidade e ativos base.',
      },
      {
        value: 'medium',
        label: 'Equilibrado',
        description: 'Mistura crescimento com defesa para performar com disciplina.',
      },
      {
        value: 'high',
        label: 'Agressivo',
        description: 'Aceita volatilidade maior para buscar upside acima da média.',
      },
    ],
    capitalOptions: [
      {
        value: 'under-200',
        label: 'Até US$200',
        description: 'Estrutura enxuta para começar com método.',
      },
      {
        value: '200-1k',
        label: 'US$200 a US$1k',
        description: 'Boa faixa para montar base e diversificação inicial.',
      },
      {
        value: '1k-5k',
        label: 'US$1k a US$5k',
        description: 'Capital suficiente para uma construção mais robusta.',
      },
      {
        value: '5k-plus',
        label: 'US$5k+',
        description: 'Amplitude para uma estrutura mais estratégica e escalável.',
      },
    ],
    investorTypeLabels: {
      'Conservative Builder': 'Construtor Conservador',
      'Balanced Optimizer': 'Otimizador Balanceado',
      'Growth Seeker': 'Buscador de Crescimento',
    },
    strategyBlueprints: {
      'Conservative Builder': {
        title: 'Base defensiva com crescimento disciplinado',
        allocation: [
          { label: 'BTC', percentage: 60 },
          { label: 'ETH', percentage: 25 },
          { label: 'Tactical reserve', percentage: 15 },
        ],
        note: 'O foco aqui é proteger a base, usar a IA para manter constância e comprar melhor ao longo do tempo.',
      },
      'Balanced Optimizer': {
        title: 'Portfólio balanceado com IA como copiloto',
        allocation: [
          { label: 'BTC', percentage: 40 },
          { label: 'ETH', percentage: 30 },
          { label: 'Camada de growth', percentage: 20 },
          { label: 'Reserva', percentage: 10 },
        ],
        note: 'A composição equilibrada permite crescer sem perder a capacidade de reajuste estratégico durante o ciclo.',
      },
      'Growth Seeker': {
        title: 'Estrutura de expansão com upside controlado',
        allocation: [
          { label: 'BTC', percentage: 30 },
          { label: 'ETH', percentage: 25 },
          { label: 'L1 / Infra', percentage: 25 },
          { label: 'Oportunidades', percentage: 20 },
        ],
        note: 'A agressividade entra com método: uma base forte sustenta a busca por assimetria nas camadas de crescimento.',
      },
    },
  },
};

export const weeklyAmountPresets = [25, 50, 100, 250, 500];

export function getAiTradeSetupContent(language: AppLanguage = 'en'): AiTradeSetupContent {
  return aiTradeSetupContent[language];
}

export function deriveInvestorType(
  goal: UserProfile['goal'],
  riskTolerance: UserProfile['riskTolerance']
): InvestorType {
  if (riskTolerance === 'low' || goal === 'protection') {
    return 'Conservative Builder';
  }
  if (riskTolerance === 'high' || goal === 'growth') {
    return 'Growth Seeker';
  }
  return 'Balanced Optimizer';
}

export function getInvestorTypeLabel(
  investorType: InvestorType,
  language: AppLanguage = 'en'
): string {
  return aiTradeSetupContent[language].investorTypeLabels[investorType];
}

export function getAnnualRate(investorType: InvestorType): number {
  switch (investorType) {
    case 'Conservative Builder':
      return 0.15;
    case 'Growth Seeker':
      return 0.6;
    default:
      return 0.35;
  }
}

export function getStrategyBlueprint(
  investorType: InvestorType,
  language: AppLanguage = 'en'
): StrategyBlueprint {
  return aiTradeSetupContent[language].strategyBlueprints[investorType];
}

export function projectWeeklyPlan(weeklyAmount: number, annualRate: number, years: number): number {
  const weeks = years * 52;
  const weeklyRate = annualRate / 52;
  let total = 0;

  for (let index = 0; index < weeks; index += 1) {
    total = (total + weeklyAmount) * (1 + weeklyRate);
  }

  return Math.round(total);
}

export function formatUsd(
  value: number,
  language: AppLanguage = 'en',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);
}
