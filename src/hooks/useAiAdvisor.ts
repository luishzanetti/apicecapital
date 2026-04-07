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

  if (msg.includes('portfolio') || msg.includes('doing') || msg.includes('how is') || msg.includes('status')) {
    if (plans.length === 0)
      return `You don't have any active DCA plans yet. As a ${type} profile, I recommend starting with a BTC/ETH base. Open the DCA Planner and build your first strategy.`;
    return `You have ${plans.length} active DCA plan${plans.length > 1 ? 's' : ''} with $${total.toLocaleString()} invested. As a ${type} profile, your biggest edge is consistency.`;
  }

  if (msg.includes('invest') || msg.includes('buy') || msg.includes('this week') || msg.includes('what should')) {
    if (type === 'Conservative Builder')
      return 'For your conservative profile, I recommend BTC (60-70%) and ETH (30-40%). A weekly DCA of $15-$25 is a solid starting point.';
    if (type === 'Growth Seeker')
      return 'For your growth profile: BTC 35%, ETH 25%, SOL 20%, and the remaining 20% split among high-conviction alts like ARB or INJ. Weekly DCA of $50-$100.';
    return 'For a balanced approach: BTC 45%, ETH 30%, SOL 15%, and LINK 10%. A weekly DCA of $25-$50 gives consistent exposure to major ecosystems.';
  }

  if (msg.includes('btc') || msg.includes('bitcoin'))
    return 'BTC remains the anchor asset of any crypto portfolio. In the Apice methodology, it deserves the central position with consistent DCA execution.';

  if (msg.includes('eth') || msg.includes('ethereum'))
    return 'ETH is the second pillar of a solid portfolio. It complements BTC and powers the major infrastructure and DeFi ecosystems.';

  if (msg.includes('sol') || msg.includes('solana'))
    return 'SOL has established itself as a relevant Layer 1 ecosystem. For Balanced/Growth profiles, 10-20% is usually a reasonable range, preferably via DCA.';

  if (msg.includes('dca') || msg.includes('dollar cost') || msg.includes('strateg'))
    return 'DCA is the foundation of the Apice methodology. You invest fixed amounts at regular intervals, removing emotion from decisions and gaining consistency across the cycle.';

  if (msg.includes('risk') || msg.includes('safe') || msg.includes('protect'))
    return `As a ${type} profile: 1) never invest more than you can sustain, 2) keep 60%+ in BTC/ETH, 3) use DCA to reduce timing risk, 4) diversify across 3-5 assets maximum.`;

  if (msg.includes('time') || msg.includes('when') || msg.includes('now a good'))
    return 'The best time to start a DCA was yesterday. The second best is now. Timing the market is nearly impossible; consistency is still the real edge.';

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    return `Hello! I'm your Apice AI Advisor. I can help with DCA strategies, portfolio analysis, and market insights based on your ${type} profile.`;

  if (msg.includes('rebalance'))
    return `Rebalancing keeps your portfolio aligned with your ${type} strategy. Review allocations periodically and use your next DCA buy to correct deviations.`;

  if (msg.includes('market'))
    return 'The crypto market is volatile by nature. The Apice methodology focuses on long-term wealth building with consistent DCA, not emotional reactions to daily swings.';

  return `Great question. As a ${type} profile, the Apice methodology recommends consistent DCA into high-quality crypto assets. I can help with portfolio strategy, allocation, DCA, and market analysis.`;
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
    title: 'Consistency beats market timing',
    content: 'Investors who keep DCA active during volatility tend to outperform most discretionary traders. Your automated plan removes emotion from the equation and lets time work for you.',
    type: 'discipline',
    action: 'Review your DCA plan and confirm this week\'s execution.',
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
