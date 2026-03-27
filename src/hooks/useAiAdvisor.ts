import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
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
    title: 'Consistency Beats Timing Every Time',
    content: 'Studies show that DCA investors who stay consistent through volatility outperform 90% of traders. Your automated plan removes emotional decisions from the equation. Keep your schedule and let time work for you.',
    type: 'discipline',
    action: 'Review your DCA plan and ensure it runs this week.',
    urgency: 'low',
    sentiment: 'neutral',
    relatedAssets: ['BTC', 'ETH'],
  };
}

// ─── Hook ───────────────────────────────────────────────────

export function useAiAdvisor() {
  const { user } = useAuth();
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
      const { data, error: fnError } = await supabase.functions.invoke('ai-advisor', {
        body: { action, userContext, ...extra },
      });

      if (fnError) throw fnError;
      if (data?.fallback) return null; // AI not configured
      if (data?.error) throw new Error(data.error);

      return data?.data || null;
    } catch (err: any) {
      console.warn(`[useAiAdvisor] ${action} failed:`, err.message);
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
      const result = await callAi('chat', { message });
      const response = result?.message || 'I apologize, I could not process your request. Please try again.';

      const assistantMsg: AiChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      return response;
    } catch (err: any) {
      setError(err.message);
      const fallbackMsg = 'Connection issue. Your DCA plans continue running automatically regardless.';
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: fallbackMsg, timestamp: new Date().toISOString() },
      ]);
      return fallbackMsg;
    } finally {
      setIsLoading(false);
    }
  }, [callAi]);

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
