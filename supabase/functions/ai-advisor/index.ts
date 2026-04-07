// Supabase Edge Function: ai-advisor
// Real AI-powered investment advisor using Claude API + live market data
// Enhanced with Apice Intelligence System (AIS) context:
//   - Market regime awareness (BULL/BEAR/SIDEWAYS/etc.)
//   - User behavioral score & confidence index
//   - Portfolio performance history
//   - Strategy performance by regime
//   - Feedback loop (recommendation acceptance tracking)
// Actions: "recommend", "insight", "analyze-portfolio", "chat"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Model selection: Sonnet for deep analysis, Haiku for fast responses
const MODEL_SONNET = "claude-sonnet-4-5-20241022";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:8080', 'http://localhost:8081',
    'http://localhost:5173', 'http://localhost:3000',
  ].filter(Boolean) as string[];
  const origin = req?.headers.get('origin') || '';
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const BYBIT_TICKERS_URL = 'https://api.bybit.com/v5/market/tickers?category=spot';

// ─── Rate Limiting ───────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ─── Apice Capital Methodology (system context for Claude) ─────

const APICE_METHODOLOGY = `
You are the AI Investment Advisor for Apice Capital, a crypto wealth-building platform.

## Apice Core Philosophy
- DCA (Dollar-Cost Averaging) is the foundation — systematic, emotion-free investing
- Long-term wealth building over short-term speculation
- Risk-adjusted returns based on individual investor profiles
- Education-first approach — every recommendation includes the "why"

## Apice Strategy Tiers
1. **Conservative Builder** (~15% annual target)
   - 60-70% BTC, 20-30% ETH, 0-10% stablecoins
   - Weekly DCA, minimum volatility exposure
   - Focus on capital preservation + steady growth

2. **Balanced Optimizer** (~35% annual target)
   - 40-50% BTC, 25-30% ETH, 15-25% top L1/L2 alts (SOL, AVAX, LINK)
   - Weekly/biweekly DCA with strategic rebalancing
   - Diversified across proven ecosystems

3. **Growth Seeker** (~60%+ annual target)
   - 30-40% BTC, 20-25% ETH, 30-40% high-conviction alts (SOL, ARB, SUI, INJ, etc.)
   - Daily/weekly DCA with aggressive allocation to emerging narratives
   - Higher risk tolerance, larger upside potential

## Key Principles
- Never recommend more than 5 assets per DCA plan (simplicity)
- Minimum allocation per asset: 10% (meaningful exposure)
- Always include BTC as the anchor asset (minimum 30%)
- Stablecoins only for Conservative profiles or during extreme fear
- Market timing is discouraged — consistency wins
- Always consider the user's capital range for appropriate amounts

## Capital de Guerra (War Chest Strategy)
Every portfolio MUST include a stablecoin reserve (USDT/USDC) called "Capital de Guerra".
This is NOT idle money — it's strategic ammunition deployed during market opportunities.

- Conservative: 15-20% reserve (adjusts by regime)
- Balanced: 10-15% reserve
- Growth: 8-12% reserve

DEPLOYMENT RULES:
- CAPITULATION (Fear & Greed < 15): Deploy 60-75% of reserve into BTC/ETH
- ALTSEASON: Deploy 30-50% into top-performing alts
- BEAR: INCREASE reserve (accumulate more stablecoins)
- BULL: DECREASE reserve to minimum (capital should be working)
- ALWAYS keep minimum 5% in stablecoins (emergency floor)

When recommending, ALWAYS mention the Capital de Guerra allocation and explain WHY.

## Risk Framework
- under-200 capital: Focus on BTC/ETH only, $5-15/week, 15% war chest
- 200-1k capital: Add 1-2 L1s, $15-50/week, 12% war chest
- 1k-5k capital: Full diversification allowed, $25-100/week, 10% war chest
- 5k-plus capital: Advanced strategies, $50-200+/week, 8-10% war chest

## Response Style
- Concise and actionable — no fluff
- Data-driven with market context
- Encouraging but realistic — never promise specific returns
- Use percentages and dollar amounts for clarity
- Include confidence level (high/medium/low) for each recommendation
- ALWAYS respond in Portuguese BR
- Frame everything as education, NEVER as financial advice

## Intelligence-Enhanced Decision Making
When intelligence context is available, use it to:
- Adjust recommendations based on current MARKET REGIME (BULL/BEAR/SIDEWAYS/HIGH_VOLATILITY/ALTSEASON/CAPITULATION)
- Personalize based on user's BEHAVIORAL SCORE (0-100) and CONFIDENCE INDEX (0-100)
- Reference STRATEGY PERFORMANCE data when recommending strategy tiers
- Consider user's EVOLVED PROFILE (may differ from initial quiz result)
- Factor in portfolio ALLOCATION DEVIATION when suggesting rebalance
- Account for user's DCA CONSISTENCY (streak, execution rate)
`;

// ─── Intelligence Context Fetcher ─────────────────────────────

interface IntelligenceContext {
  regime: string;
  regimeConfidence: number;
  regimeReason: string;
  behavioralScore: number;
  confidenceIndex: number;
  evolvedProfile: string;
  consistencyScore: number;
  currentStreak: number;
  executionRate: number;
  portfolioValue: number;
  portfolioPnl: number;
  allocationDeviation: number;
  smartDCAEnabled: boolean;
  fearGreed: number;
  fearGreedLabel: string;
  strategyPerformance: Record<string, any>;
  recentFeedback: { accepted: number; rejected: number; ignored: number };
}

async function fetchIntelligenceContext(userId: string): Promise<IntelligenceContext | null> {
  try {
    const supabase = getServiceClient();

    const [
      { data: regime },
      { data: intel },
      { data: portfolio },
      { data: btcData },
      { data: stratPerf },
      { data: feedback },
    ] = await Promise.all([
      supabase.from("market_regimes").select("regime, confidence, transition_reason").is("ended_at", null).order("created_at", { ascending: false }).limit(1),
      supabase.from("user_intelligence").select("*").eq("user_id", userId).single(),
      supabase.from("portfolio_snapshots").select("total_value_usd, pnl_pct, allocation_deviation, market_regime").eq("user_id", userId).order("captured_at", { ascending: false }).limit(1),
      supabase.from("market_snapshots").select("fear_greed_index, fear_greed_label").eq("symbol", "BTCUSDT").order("captured_at", { ascending: false }).limit(1),
      supabase.from("strategy_performance").select("strategy_type, market_regime, return_pct, annualized_return_pct").order("period_end", { ascending: false }).limit(18),
      supabase.from("ai_interactions").select("feedback").eq("user_id", userId).not("feedback", "is", null).order("created_at", { ascending: false }).limit(30),
    ]);

    const currentRegime = regime?.[0];
    const intelligence = intel;
    const latestPortfolio = portfolio?.[0];
    const latestBTC = btcData?.[0];
    const strategyData = stratPerf || [];
    const feedbackData = feedback || [];

    // Aggregate strategy performance by type+regime
    const stratPerfMap: Record<string, any> = {};
    for (const sp of strategyData) {
      const key = `${sp.strategy_type}_${sp.market_regime}`;
      if (!stratPerfMap[key]) stratPerfMap[key] = sp;
    }

    // Count feedback
    const feedbackCounts = { accepted: 0, rejected: 0, ignored: 0 };
    for (const f of feedbackData) {
      if (f.feedback === "accepted") feedbackCounts.accepted++;
      else if (f.feedback === "rejected") feedbackCounts.rejected++;
      else if (f.feedback === "ignored") feedbackCounts.ignored++;
    }

    const totalDCA = (intelligence?.total_dca_executed || 0) + (intelligence?.total_dca_skipped || 0);

    return {
      regime: currentRegime?.regime || "SIDEWAYS",
      regimeConfidence: currentRegime?.confidence || 50,
      regimeReason: currentRegime?.transition_reason || "",
      behavioralScore: intelligence?.behavioral_score || 0,
      confidenceIndex: intelligence?.confidence_index || 0,
      evolvedProfile: intelligence?.evolved_investor_type || "",
      consistencyScore: intelligence?.consistency_score || 0,
      currentStreak: intelligence?.current_streak_weeks || 0,
      executionRate: totalDCA > 0 ? Math.round((intelligence?.total_dca_executed || 0) / totalDCA * 100) : 0,
      portfolioValue: latestPortfolio?.total_value_usd || 0,
      portfolioPnl: latestPortfolio?.pnl_pct || 0,
      allocationDeviation: latestPortfolio?.allocation_deviation || 0,
      smartDCAEnabled: intelligence?.smart_dca_enabled !== false,
      fearGreed: latestBTC?.fear_greed_index || 50,
      fearGreedLabel: latestBTC?.fear_greed_label || "Neutral",
      strategyPerformance: stratPerfMap,
      recentFeedback: feedbackCounts,
    };
  } catch (e) {
    console.error("[ai-advisor] Intelligence context fetch failed:", e);
    return null;
  }
}

function formatIntelligenceContext(ic: IntelligenceContext): string {
  return `
## Apice Intelligence System — Contexto em Tempo Real

### Regime de Mercado
- Regime atual: **${ic.regime}** (confiança: ${ic.regimeConfidence}%)
- Motivo: ${ic.regimeReason || "N/A"}
- Fear & Greed Index: ${ic.fearGreed} (${ic.fearGreedLabel})

### Perfil do Usuário (Evolutivo)
- Perfil evoluído: ${ic.evolvedProfile || "Não calculado ainda"}
- Score comportamental: ${ic.behavioralScore}/100
- Índice de confiança: ${ic.confidenceIndex}/100
- Consistência: ${ic.consistencyScore}/100
- Streak atual: ${ic.currentStreak} semanas
- Taxa de execução DCA: ${ic.executionRate}%

### Portfolio
- Valor atual: $${ic.portfolioValue.toLocaleString()}
- PnL: ${ic.portfolioPnl > 0 ? "+" : ""}${ic.portfolioPnl.toFixed(1)}%
- Desvio de alocação: ${ic.allocationDeviation.toFixed(1)}%
- Smart DCA: ${ic.smartDCAEnabled ? "Ativado" : "Desativado"}

### Feedback Loop
- Recomendações aceitas (últimas 30): ${ic.recentFeedback.accepted}
- Recomendações rejeitadas: ${ic.recentFeedback.rejected}
- Recomendações ignoradas: ${ic.recentFeedback.ignored}

### Diretrizes por Regime
${ic.regime === "BULL" ? "- Mercado em alta: manter alocações, considerar aumentar exposição a alts com momentum" : ""}
${ic.regime === "BEAR" ? "- Mercado em baixa: aumentar proporção BTC, reduzir alts, focar em acumulação" : ""}
${ic.regime === "SIDEWAYS" ? "- Mercado lateral: DCA consistente é a melhor estratégia, acumular posições" : ""}
${ic.regime === "HIGH_VOLATILITY" ? "- Alta volatilidade: reduzir exposição, priorizar BTC, cautela com alavancagem" : ""}
${ic.regime === "ALTSEASON" ? "- Temporada de alts: oportunidade para diversificar em alts com fundamentos sólidos" : ""}
${ic.regime === "CAPITULATION" ? "- CAPITULAÇÃO: historicamente o melhor momento para DCA agressivo. Medo extremo = oportunidade" : ""}
`;
}

// ─── Market Data Fetcher ───────────────────────────────────────

interface MarketTicker {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  volume24h: string;
  highPrice24h: string;
  lowPrice24h: string;
}

const TOP_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT', 'LINKUSDT', 'DOTUSDT',
  'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'NEARUSDT', 'INJUSDT',
  'TIAUSDT', 'JUPUSDT', 'FETUSDT', 'SEIUSDT', 'UNIUSDT',
];

let marketCache: { data: MarketTicker[]; timestamp: number } | null = null;
const MARKET_CACHE_TTL = 30_000; // 30s

async function fetchMarketData(): Promise<MarketTicker[]> {
  const now = Date.now();
  if (marketCache && now - marketCache.timestamp < MARKET_CACHE_TTL) {
    return marketCache.data;
  }

  try {
    const res = await fetch(BYBIT_TICKERS_URL);
    const json = await res.json();
    const list = json?.result?.list || [];

    const topSymbolSet = new Set(TOP_SYMBOLS);
    const filtered: MarketTicker[] = list
      .filter((t: any) => topSymbolSet.has(t.symbol))
      .map((t: any) => ({
        symbol: t.symbol,
        lastPrice: t.lastPrice,
        price24hPcnt: t.price24hPcnt,
        volume24h: t.volume24h,
        highPrice24h: t.highPrice24h,
        lowPrice24h: t.lowPrice24h,
      }));

    marketCache = { data: filtered, timestamp: now };
    return filtered;
  } catch (err) {
    console.error('[ai-advisor] Market data fetch error:', err);
    return marketCache?.data || [];
  }
}

function formatMarketContext(tickers: MarketTicker[]): string {
  if (tickers.length === 0) return 'Market data unavailable.';

  const btc = tickers.find(t => t.symbol === 'BTCUSDT');
  const eth = tickers.find(t => t.symbol === 'ETHUSDT');

  let context = `## Live Market Data (${new Date().toISOString()})\n\n`;

  if (btc) {
    const btcChange = (parseFloat(btc.price24hPcnt) * 100).toFixed(2);
    context += `BTC: $${parseFloat(btc.lastPrice).toLocaleString()} (${btcChange}% 24h)\n`;
  }
  if (eth) {
    const ethChange = (parseFloat(eth.price24hPcnt) * 100).toFixed(2);
    context += `ETH: $${parseFloat(eth.lastPrice).toLocaleString()} (${ethChange}% 24h)\n`;
  }

  context += '\nAll tickers (24h change):\n';
  for (const t of tickers) {
    const name = t.symbol.replace('USDT', '');
    const change = (parseFloat(t.price24hPcnt) * 100).toFixed(2);
    const price = parseFloat(t.lastPrice);
    context += `- ${name}: $${price < 1 ? price.toFixed(6) : price.toLocaleString()} (${change}%)\n`;
  }

  // Market sentiment
  const avgChange = tickers.reduce((sum, t) => sum + parseFloat(t.price24hPcnt), 0) / tickers.length;
  const sentiment = avgChange > 0.02 ? 'bullish' : avgChange < -0.02 ? 'bearish' : 'neutral';
  context += `\nOverall market sentiment: ${sentiment} (avg 24h change: ${(avgChange * 100).toFixed(2)}%)\n`;

  return context;
}

// ─── Claude API Call ───────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessageOrMessages: string | Array<{role: string; content: string}>,
  maxTokens = 1024,
  model: string = MODEL_HAIKU
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const messages = typeof userMessageOrMessages === 'string'
    ? [{ role: 'user', content: userMessageOrMessages }]
    : userMessageOrMessages;

  const startTime = Date.now();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[ai-advisor] Claude API error:', res.status, errBody);
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  const latency = Date.now() - startTime;
  console.log(`[ai-advisor] Claude ${model} responded in ${latency}ms`);

  return {
    text: data.content?.[0]?.text || '',
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

// Helper to log AI interaction for feedback loop
async function logAIInteraction(
  userId: string,
  action: string,
  model: string,
  context: any,
  responseSummary: string,
  responseData: any,
  latencyMs: number,
  inputTokens: number,
  outputTokens: number
): Promise<string | null> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("ai_interactions")
      .insert({
        user_id: userId,
        action,
        model,
        request_context: context,
        response_summary: responseSummary.slice(0, 500),
        response_data: responseData,
        latency_ms: latencyMs,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
      })
      .select("id")
      .single();
    return data?.id || null;
  } catch (e) {
    console.error("[ai-advisor] Failed to log interaction:", e);
    return null;
  }
}

// ─── Action Handlers ───────────────────────────────────────────

interface UserContext {
  investorType: string | null;
  riskTolerance: string | null;
  capitalRange: string | null;
  goal: string | null;
  experience: string | null;
  currentPlans?: Array<{
    assets: Array<{ symbol: string; allocation: number }>;
    amountPerInterval: number;
    frequency: string;
    totalInvested: number;
  }>;
  totalInvested?: number;
}

async function handleRecommend(userContext: UserContext, userId: string): Promise<any> {
  const startTime = Date.now();
  const [market, intelligence] = await Promise.all([
    fetchMarketData(),
    fetchIntelligenceContext(userId),
  ]);
  const marketContext = formatMarketContext(market);
  const intelligenceBlock = intelligence ? formatIntelligenceContext(intelligence) : '';

  const userPrompt = `
${marketContext}

${intelligenceBlock}

## Perfil do Usuário
- Tipo de investidor: ${intelligence?.evolvedProfile || userContext.investorType || 'Não definido'}
- Tolerância a risco: ${userContext.riskTolerance || 'medium'}
- Faixa de capital: ${userContext.capitalRange || 'Não definido'}
- Objetivo: ${userContext.goal || 'balanced'}
- Experiência: ${userContext.experience || 'new'}
- Total investido: $${userContext.totalInvested || 0}
- Planos DCA ativos: ${userContext.currentPlans?.length || 0}
- Score comportamental: ${intelligence?.behavioralScore || 'N/A'}/100
- Streak de consistência: ${intelligence?.currentStreak || 0} semanas

Com base no perfil deste usuário, condições atuais de mercado e regime de mercado (${intelligence?.regime || 'SIDEWAYS'}), forneça uma recomendação de DCA personalizada.

IMPORTANTE: Ajuste a recomendação baseado no regime de mercado atual.
${intelligence?.regime === 'CAPITULATION' ? 'REGIME DE CAPITULAÇÃO: Este é historicamente o melhor momento para DCA. Considere recomendar aumento de aporte.' : ''}
${intelligence?.regime === 'BEAR' ? 'REGIME DE BAIXA: Priorize BTC e reduza alocação em altcoins de menor capitalização.' : ''}
${intelligence?.regime === 'ALTSEASON' ? 'ALTSEASON: Considere aumentar exposição a altcoins com fundamentos sólidos e momentum.' : ''}

Responda neste formato JSON exato (sem markdown, sem code blocks, apenas JSON puro):
{
  "suggestedAmount": <number>,
  "frequency": "daily" | "weekly" | "biweekly" | "monthly",
  "assets": [{"symbol": "<TICKER>", "allocation": <number>}],
  "rationale": "<2-3 frases explicando por quê em português>",
  "marketInsight": "<1-2 frases sobre condições atuais do mercado>",
  "riskNote": "<1 frase sobre riscos>",
  "confidence": "high" | "medium" | "low",
  "regime": "${intelligence?.regime || 'SIDEWAYS'}",
  "adjustments": "<ajustes específicos baseados no regime e perfil, ou null>",
  "smartDCA": {
    "enabled": ${intelligence?.smartDCAEnabled !== false},
    "adjustment": "<descrição do ajuste Smart DCA aplicado>"
  }
}
`;

  // Use Haiku for fast recommendations (Sonnet as future upgrade when available)
  const result = await callClaude(APICE_METHODOLOGY, userPrompt, 1000, MODEL_HAIKU);
  const latency = Date.now() - startTime;

  let parsed;
  try {
    const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {
      suggestedAmount: 25,
      frequency: 'weekly',
      assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }],
      rationale: result.text.slice(0, 300),
      marketInsight: 'Dados de mercado analisados.',
      riskNote: 'Desempenho passado não garante resultados futuros.',
      confidence: 'medium',
      regime: intelligence?.regime || 'SIDEWAYS',
      adjustments: null,
      smartDCA: { enabled: false, adjustment: null },
    };
  }

  // Log interaction for feedback loop
  const interactionId = await logAIInteraction(
    userId, 'recommend', MODEL_SONNET,
    { regime: intelligence?.regime, profile: intelligence?.evolvedProfile, behavioralScore: intelligence?.behavioralScore },
    parsed.rationale || '', parsed, latency, result.inputTokens, result.outputTokens
  );
  if (interactionId) parsed._interactionId = interactionId;

  return parsed;
}

async function handleInsight(userContext: UserContext, userId: string): Promise<any> {
  const [market, intelligence] = await Promise.all([
    fetchMarketData(),
    fetchIntelligenceContext(userId),
  ]);
  const marketContext = formatMarketContext(market);
  const intelligenceBlock = intelligence ? formatIntelligenceContext(intelligence) : '';

  const userPrompt = `
${marketContext}

${intelligenceBlock}

## Perfil do Usuário
- Tipo de investidor: ${intelligence?.evolvedProfile || userContext.investorType || 'Balanced Optimizer'}
- Tolerância a risco: ${userContext.riskTolerance || 'medium'}
- Objetivo: ${userContext.goal || 'balanced'}
- Total investido: $${userContext.totalInvested || 0}
- Planos ativos: ${userContext.currentPlans?.length || 0}
- Streak: ${intelligence?.currentStreak || 0} semanas consecutivas
${userContext.currentPlans?.length ? `- Alocações atuais: ${userContext.currentPlans.map(p => p.assets.map(a => `${a.symbol}(${a.allocation}%)`).join(',')).join(' | ')}` : ''}

Gere um insight diário PERSONALIZADO para este investidor em PORTUGUÊS BR.
Considere o regime de mercado (${intelligence?.regime}), o perfil evolutivo, e o momento do investidor.

${intelligence?.currentStreak && intelligence.currentStreak >= 4 ? `O usuário tem uma streak de ${intelligence.currentStreak} semanas — reconheça e motive!` : ''}
${intelligence?.allocationDeviation && intelligence.allocationDeviation > 15 ? `ATENÇÃO: A alocação do portfolio desviou ${intelligence.allocationDeviation.toFixed(1)}% do target. Considere mencionar rebalanceamento.` : ''}

Responda neste formato JSON exato (sem markdown, sem code blocks, apenas JSON puro):
{
  "title": "<título chamativo de 5-8 palavras em português>",
  "content": "<3-4 frases de insight acionável em português>",
  "type": "market" | "portfolio" | "education" | "discipline" | "opportunity",
  "action": "<ação específica recomendada ou null>",
  "urgency": "low" | "medium" | "high",
  "sentiment": "bullish" | "bearish" | "neutral" | "cautious",
  "regime": "${intelligence?.regime || 'SIDEWAYS'}",
  "relatedAssets": ["<TICKER1>", "<TICKER2>"]
}
`;

  const result = await callClaude(APICE_METHODOLOGY, userPrompt, 600);

  try {
    const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    await logAIInteraction(userId, 'insight', MODEL_HAIKU,
      { regime: intelligence?.regime }, parsed.title || '', parsed, 0, result.inputTokens, result.outputTokens);

    return parsed;
  } catch {
    return {
      title: 'Mantenha a Consistência no DCA',
      content: result.text.slice(0, 400),
      type: 'discipline',
      action: 'Continue com seu cronograma de DCA semanal.',
      urgency: 'low',
      sentiment: 'neutral',
      regime: intelligence?.regime || 'SIDEWAYS',
      relatedAssets: ['BTC', 'ETH'],
    };
  }
}

async function handleAnalyzePortfolio(userContext: UserContext, userId: string): Promise<any> {
  const startTime = Date.now();
  const [market, intelligence] = await Promise.all([
    fetchMarketData(),
    fetchIntelligenceContext(userId),
  ]);
  const marketContext = formatMarketContext(market);
  const intelligenceBlock = intelligence ? formatIntelligenceContext(intelligence) : '';

  const plans = userContext.currentPlans || [];
  const planDetails = plans.map((p, i) =>
    `Plano ${i + 1}: $${p.amountPerInterval}/${p.frequency} → ${p.assets.map(a => `${a.symbol}(${a.allocation}%)`).join(', ')} | Total: $${p.totalInvested}`
  ).join('\n');

  const userPrompt = `
${marketContext}

${intelligenceBlock}

## Perfil do Usuário
- Tipo de investidor: ${intelligence?.evolvedProfile || userContext.investorType || 'Balanced Optimizer'}
- Tolerância a risco: ${userContext.riskTolerance || 'medium'}
- Faixa de capital: ${userContext.capitalRange || 'Não definido'}
- Total investido: $${userContext.totalInvested || 0}
- Score comportamental: ${intelligence?.behavioralScore || 'N/A'}/100
- Streak: ${intelligence?.currentStreak || 0} semanas

## Planos DCA Atuais
${planDetails || 'Nenhum plano ativo'}

## Dados de Inteligência
- Desvio de alocação: ${intelligence?.allocationDeviation?.toFixed(1) || 0}%
- Valor do portfolio: $${intelligence?.portfolioValue?.toLocaleString() || 'N/A'}
- PnL: ${intelligence?.portfolioPnl ? (intelligence.portfolioPnl > 0 ? '+' : '') + intelligence.portfolioPnl.toFixed(1) + '%' : 'N/A'}
- Regime: ${intelligence?.regime || 'SIDEWAYS'}

Analise este portfolio considerando o regime de mercado atual e forneça feedback específico e acionável EM PORTUGUÊS BR.

${intelligence?.allocationDeviation && intelligence.allocationDeviation > 15 ? `IMPORTANTE: Portfolio com desvio significativo de ${intelligence.allocationDeviation.toFixed(1)}% — recomende rebalanceamento.` : ''}

Responda neste formato JSON exato (sem markdown, sem code blocks, apenas JSON puro):
{
  "score": <1-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "strengths": ["<ponto forte 1 em português>", "<ponto forte 2>"],
  "improvements": ["<melhoria 1 em português>", "<melhoria 2>"],
  "rebalanceNeeded": <boolean>,
  "rebalanceSuggestion": "<sugestão específica de rebalanceamento ou null>",
  "riskAssessment": "<1-2 frases em português>",
  "outlook": "<2-3 frases sobre performance esperada dado o regime ${intelligence?.regime}>",
  "regimeImpact": "<como o regime atual afeta este portfolio>",
  "nextAction": "<próximo passo mais importante>"
}
`;

  // Use Haiku for portfolio analysis (Sonnet as future upgrade)
  const result = await callClaude(APICE_METHODOLOGY, userPrompt, 1000, MODEL_HAIKU);
  const latency = Date.now() - startTime;

  let parsed;
  try {
    const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    parsed = {
      score: 70,
      grade: 'B',
      strengths: ['Estratégia DCA ativa'],
      improvements: ['Considere diversificar'],
      rebalanceNeeded: false,
      rebalanceSuggestion: null,
      riskAssessment: result.text.slice(0, 200),
      outlook: 'DCA consistente construirá patrimônio ao longo do tempo.',
      regimeImpact: `Regime ${intelligence?.regime || 'SIDEWAYS'} atual.`,
      nextAction: 'Mantenha seu cronograma de DCA.',
    };
  }

  const interactionId = await logAIInteraction(
    userId, 'analyze-portfolio', MODEL_SONNET,
    { regime: intelligence?.regime, portfolioValue: intelligence?.portfolioValue, deviation: intelligence?.allocationDeviation },
    `Score: ${parsed.score}, Grade: ${parsed.grade}`, parsed, latency, result.inputTokens, result.outputTokens
  );
  if (interactionId) parsed._interactionId = interactionId;

  return parsed;
}

async function handleChat(userContext: UserContext, message: string, userId: string, history?: Array<{role: string; content: string}>): Promise<any> {
  const [market, intelligence] = await Promise.all([
    fetchMarketData(),
    fetchIntelligenceContext(userId),
  ]);
  const marketContext = formatMarketContext(market);
  const intelligenceBlock = intelligence ? formatIntelligenceContext(intelligence) : '';

  const systemPrompt = `${APICE_METHODOLOGY}

## Contexto de Mercado Atual
${marketContext}

${intelligenceBlock}

## Perfil do Usuário
- Tipo de investidor: ${intelligence?.evolvedProfile || userContext.investorType || 'Não definido'}
- Tolerância a risco: ${userContext.riskTolerance || 'medium'}
- Faixa de capital: ${userContext.capitalRange || 'Não definido'}
- Objetivo: ${userContext.goal || 'balanced'}
- Total investido: $${userContext.totalInvested || 0}
- Planos DCA ativos: ${userContext.currentPlans?.length || 0}
- Score comportamental: ${intelligence?.behavioralScore || 'N/A'}/100
- Streak: ${intelligence?.currentStreak || 0} semanas

Responda de forma concisa (máx 3-4 frases) em PORTUGUÊS BR. Use dados de mercado quando relevante. Mantenha-se alinhado com a metodologia Apice. Se o usuário perguntar sobre ativos específicos, forneça respostas baseadas em dados. Nunca dê conselho financeiro — enquadre como educação. Considere o regime de mercado atual (${intelligence?.regime || 'SIDEWAYS'}) em suas respostas.`;

  const messages: Array<{role: string; content: string}> = [];

  if (history && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: message });

  const result = await callClaude(systemPrompt, messages, 500);

  await logAIInteraction(userId, 'chat', MODEL_HAIKU,
    { regime: intelligence?.regime, message: message.slice(0, 100) },
    result.text.slice(0, 200), { message: result.text }, 0, result.inputTokens, result.outputTokens);

  return {
    message: result.text,
    regime: intelligence?.regime,
    timestamp: new Date().toISOString(),
  };
}

// ─── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT for rate limiting
    let userId = 'anonymous';
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || 'anonymous';
    } catch {
      // If JWT parsing fails, fall back to anonymous rate limiting
    }

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, userContext, message } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action. Use: recommend, insight, analyze-portfolio, chat, feedback' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any;

    switch (action) {
      case 'recommend':
        result = await handleRecommend(userContext || {}, userId);
        break;
      case 'insight':
        result = await handleInsight(userContext || {}, userId);
        break;
      case 'analyze-portfolio':
        result = await handleAnalyzePortfolio(userContext || {}, userId);
        break;
      case 'chat':
        if (!message) {
          return new Response(
            JSON.stringify({ error: 'Missing message for chat action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleChat(userContext || {}, message, userId, body.history);
        break;
      case 'feedback': {
        // Feedback loop: user accepts/rejects a recommendation
        const { interactionId, feedback, reason } = body;
        if (!interactionId || !feedback) {
          return new Response(
            JSON.stringify({ error: 'Missing interactionId or feedback (accepted/rejected/ignored)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const supabase = getServiceClient();
        await supabase
          .from('ai_interactions')
          .update({
            feedback,
            feedback_reason: reason || null,
            feedback_at: new Date().toISOString(),
          })
          .eq('id', interactionId)
          .eq('user_id', userId);

        // Also log as behavior event
        await supabase
          .from('user_behavior_events')
          .insert({
            user_id: userId,
            event_type: feedback === 'accepted' ? 'recommendation_accepted' : 'recommendation_rejected',
            event_data: { interaction_id: interactionId, reason },
          });

        result = { success: true };
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[ai-advisor] Error:', err);

    // If Claude API key not set, return graceful fallback
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return new Response(
        JSON.stringify({
          error: 'AI not configured',
          fallback: true,
          data: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
