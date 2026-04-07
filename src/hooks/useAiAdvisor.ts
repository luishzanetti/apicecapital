import { useState, useCallback, useRef } from 'react';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/supabaseFunction';
import { useAuth } from '@/components/AuthProvider';
import { useAppStore } from '@/store/appStore';

// ─── Types ──────────────────────────────────────────────────

export interface AiRecommendation {
  suggestedAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  assets: Array<{ symbol: string; allocation: number }>;
  rationale: string;
  marketInsight: string;
  riskNote: string;
  confidence: 'high' | 'medium' | 'low';
  adjustments: string | null;
}

export interface AiInsight {
  title: string;
  content: string;
  type: 'market' | 'portfolio' | 'education' | 'discipline' | 'opportunity';
  action: string | null;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'cautious';
  relatedAssets: string[];
}

export interface AiPortfolioAnalysis {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  rebalanceNeeded: boolean;
  rebalanceSuggestion: string | null;
  riskAssessment: string;
  outlook: string;
  nextAction: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Cache ──────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 min cache

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ─── User Context Builder ───────────────────────────────────

function buildUserContext() {
  const state = useAppStore.getState();
  return {
    investorType: state.investorType,
    riskTolerance: state.userProfile.riskTolerance,
    capitalRange: state.userProfile.capitalRange,
    goal: state.userProfile.goal,
    experience: state.userProfile.experience,
    currentPlans: state.dcaPlans.filter(p => p.isActive).map(p => ({
      assets: p.assets,
      amountPerInterval: p.amountPerInterval,
      frequency: p.frequency,
      totalInvested: p.totalInvested,
    })),
    totalInvested: state.dcaPlans.reduce((sum, p) => sum + (p.totalInvested || 0), 0),
  };
}

// ─── Local Chat Fallback ────────────────────────────────────

function getLocalChatResponse(message: string): string {
  const msg = message.toLowerCase();
  const state = useAppStore.getState();
  const type = state.investorType || 'Balanced Optimizer';
  const plans = state.dcaPlans.filter(p => p.isActive);
  const total = plans.reduce((s, p) => s + (p.totalInvested || 0), 0);

  if (msg.includes('portfolio') || msg.includes('doing') || msg.includes('como está') || msg.includes('carteira')) {
    if (plans.length === 0)
      return `Você ainda não tem planos DCA ativos. Como perfil ${type}, recomendo começar por uma base BTC/ETH. Abra o Planejador DCA e monte sua primeira estratégia.`;
    return `Você tem ${plans.length} plano${plans.length > 1 ? 's' : ''} DCA ativo${plans.length > 1 ? 's' : ''}, com $${total.toLocaleString()} investidos. Como perfil ${type}, sua maior vantagem é a consistência.`;
  }

  if (msg.includes('invest') || msg.includes('buy') || msg.includes('comprar') || msg.includes('investir') || msg.includes('this week')) {
    if (type === 'Conservative Builder')
      return 'Pelo seu perfil conservador, recomendo BTC (60-70%) e ETH (30-40%). Um DCA semanal entre $15 e $25 é um ponto de partida sólido.';
    if (type === 'Growth Seeker')
      return 'Para o seu perfil de crescimento: BTC 35%, ETH 25%, SOL 20% e os 20% restantes entre alts de maior convicção como ARB ou INJ. DCA semanal entre $50 e $100.';
    return 'Para uma abordagem equilibrada: BTC 45%, ETH 30%, SOL 15% e LINK 10%. Um DCA semanal entre $25 e $50 oferece exposição consistente aos principais ecossistemas.';
  }

  if (msg.includes('btc') || msg.includes('bitcoin'))
    return 'BTC continua sendo o ativo âncora de qualquer portfolio cripto. Na metodologia Apice, ele merece espaço central e execução via DCA consistente.';

  if (msg.includes('eth') || msg.includes('ethereum'))
    return 'ETH é o segundo pilar de um portfolio sólido. Ele complementa BTC e sustenta os principais ecossistemas de infraestrutura e DeFi.';

  if (msg.includes('sol') || msg.includes('solana'))
    return 'SOL se consolidou como um ecossistema de Layer 1 relevante. Para perfis Balanced/Growth, 10-20% costuma ser uma faixa razoável, preferencialmente via DCA.';

  if (msg.includes('dca') || msg.includes('dollar cost') || msg.includes('strateg') || msg.includes('estratég'))
    return 'DCA é a base da metodologia Apice. Você investe valores fixos em intervalos regulares, remove emoção da decisão e ganha consistência ao longo do ciclo.';

  if (msg.includes('risk') || msg.includes('risco') || msg.includes('safe') || msg.includes('seguro'))
    return `Como perfil ${type}: 1) nunca invista acima do que consegue sustentar, 2) mantenha 60%+ em BTC/ETH, 3) use DCA para reduzir risco de timing, 4) diversifique entre 3 e 5 ativos no máximo.`;

  if (msg.includes('time') || msg.includes('when') || msg.includes('quando') || msg.includes('hora') || msg.includes('now a good'))
    return 'A melhor hora para começar um DCA era ontem. A segunda melhor é agora. Timing de mercado é quase impossível; consistência ainda é a vantagem real.';

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('olá') || msg.includes('oi') || msg.includes('hey'))
    return `Olá. Sou seu AI Advisor da Apice. Posso ajudar com estratégias de DCA, análise de portfolio e leitura de mercado com base no seu perfil ${type}.`;

  if (msg.includes('rebalance') || msg.includes('rebalanc'))
    return `Rebalancear mantém o portfolio alinhado à sua estratégia ${type}. Revise alocações periodicamente e use a próxima compra do DCA para corrigir desvios.`;

  if (msg.includes('market') || msg.includes('mercado'))
    return 'O mercado cripto é volátil por natureza. A metodologia Apice foca em construção de patrimônio no longo prazo com DCA consistente, não em reação emocional a oscilações diárias.';

  return `Boa pergunta. Como perfil ${type}, a metodologia Apice recomenda DCA consistente em ativos cripto de maior qualidade. Posso ajudar com estratégia de portfolio, alocação, DCA e leitura de mercado.`;
}

// ─── Fallback Data ──────────────────────────────────────────

function getFallbackRecommendation(): AiRecommendation {
  const state = useAppStore.getState();
  const type = state.investorType;

  if (type === 'Conservative Builder') {
    return {
      suggestedAmount: 25,
      frequency: 'weekly',
      assets: [
        { symbol: 'BTC', allocation: 65 },
        { symbol: 'ETH', allocation: 35 },
      ],
      rationale: 'Conservative approach with BTC/ETH core. DCA weekly to minimize volatility impact and build wealth steadily.',
      marketInsight: 'Blue-chip crypto dominance remains strong for conservative portfolios.',
      riskNote: 'Lower volatility exposure, but crypto is inherently volatile. Only invest what you can afford.',
      confidence: 'high',
      adjustments: null,
    };
  }
  if (type === 'Growth Seeker') {
    return {
      suggestedAmount: 50,
      frequency: 'weekly',
      assets: [
        { symbol: 'BTC', allocation: 35 },
        { symbol: 'ETH', allocation: 25 },
        { symbol: 'SOL', allocation: 20 },
        { symbol: 'ARB', allocation: 10 },
        { symbol: 'INJ', allocation: 10 },
      ],
      rationale: 'Aggressive growth with high-conviction alts. SOL and ARB offer L1/L2 exposure, INJ for DeFi narrative.',
      marketInsight: 'Alt season potential with strong BTC base. Higher risk, higher potential.',
      riskNote: 'Volatile allocation. Prepare for 30-50% drawdowns during market corrections.',
      confidence: 'medium',
      adjustments: null,
    };
  }
  // Balanced default
  return {
    suggestedAmount: 35,
    frequency: 'weekly',
    assets: [
      { symbol: 'BTC', allocation: 45 },
      { symbol: 'ETH', allocation: 30 },
      { symbol: 'SOL', allocation: 15 },
      { symbol: 'LINK', allocation: 10 },
    ],
    rationale: 'Balanced allocation across proven ecosystems. BTC anchor with ETH and selected L1/DeFi exposure.',
    marketInsight: 'Diversification across major ecosystems provides risk-adjusted returns.',
    riskNote: 'Moderate volatility. DCA consistency is your biggest edge.',
    confidence: 'high',
    adjustments: null,
  };
}

function getFallbackInsight(): AiInsight {
  return {
    title: 'Consistência vence timing de mercado',
    content: 'Investidores que mantêm o DCA ativo durante a volatilidade tendem a superar a maioria dos traders discricionários. Seu plano automático remove emoção da equação e deixa o tempo trabalhar.',
    type: 'discipline',
    action: 'Revise seu plano DCA e confirme a execução desta semana.',
    urgency: 'low',
    sentiment: 'neutral',
    relatedAssets: ['BTC', 'ETH'],
  };
}

// ─── Hook ───────────────────────────────────────────────────

export function useAiAdvisor() {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const callAi = useCallback(async (action: string, extra?: Record<string, any>) => {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const userContext = buildUserContext();
      const { data, error: fnError } = await invokeEdgeFunction('ai-advisor', {
        body: { action, userContext, ...extra },
        token: session?.access_token,
      });

      if (fnError) throw fnError;
      if (data?.fallback) return null; // AI not configured
      if (data?.error) throw new Error(data.error);

      return data?.data || null;
    } catch {
      return null;
    }
  }, []);

  // ─── Get personalized DCA recommendation
  const getRecommendation = useCallback(async (forceRefresh = false): Promise<AiRecommendation> => {
    const cacheKey = 'ai-recommendation';
    if (!forceRefresh) {
      const cached = getCached<AiRecommendation>(cacheKey);
      if (cached) return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callAi('recommend');
      if (result) {
        setCache(cacheKey, result);
        return result as AiRecommendation;
      }
      // Fallback
      const fallback = getFallbackRecommendation();
      setCache(cacheKey, fallback);
      return fallback;
    } catch (err: any) {
      setError(err.message);
      return getFallbackRecommendation();
    } finally {
      setIsLoading(false);
    }
  }, [callAi]);

  // ─── Get personalized daily insight
  const getInsight = useCallback(async (forceRefresh = false): Promise<AiInsight> => {
    const cacheKey = 'ai-insight';
    if (!forceRefresh) {
      const cached = getCached<AiInsight>(cacheKey);
      if (cached) return cached;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await callAi('insight');
      if (result) {
        setCache(cacheKey, result);
        return result as AiInsight;
      }
      const fallback = getFallbackInsight();
      setCache(cacheKey, fallback);
      return fallback;
    } catch (err: any) {
      setError(err.message);
      return getFallbackInsight();
    } finally {
      setIsLoading(false);
    }
  }, [callAi]);

  // ─── Analyze current portfolio
  const analyzePortfolio = useCallback(async (): Promise<AiPortfolioAnalysis | null> => {
    const cacheKey = 'ai-portfolio-analysis';
    const cached = getCached<AiPortfolioAnalysis>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);

    try {
      const result = await callAi('analyze-portfolio');
      if (result) {
        setCache(cacheKey, result);
        return result as AiPortfolioAnalysis;
      }
      return null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [callAi]);

  // ─── Chat with AI advisor
  const sendMessage = useCallback(async (message: string): Promise<string> => {
    const userMsg: AiChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);

    setIsLoading(true);
    setError(null);

    try {
      // Send last 10 messages as history for context
      const history = chatMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await callAi('chat', { message, history });
      const response = result?.message || getLocalChatResponse(message);

      const assistantMsg: AiChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      return response;
    } catch (err: any) {
      setError(err.message);
      const fallbackMsg = getLocalChatResponse(message);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: fallbackMsg, timestamp: new Date().toISOString() },
      ]);
      return fallbackMsg;
    } finally {
      setIsLoading(false);
    }
  }, [callAi, chatMessages]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  return {
    getRecommendation,
    getInsight,
    analyzePortfolio,
    sendMessage,
    clearChat,
    chatMessages,
    isLoading,
    error,
  };
}
