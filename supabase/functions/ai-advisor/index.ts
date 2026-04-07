// Supabase Edge Function: ai-advisor
// Real AI-powered investment advisor using Claude API + live market data
// Actions: "recommend", "insight", "analyze-portfolio", "chat"

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

## Risk Framework
- under-200 capital: Focus on BTC/ETH only, $5-15/week
- 200-1k capital: Add 1-2 L1s, $15-50/week
- 1k-5k capital: Full diversification allowed, $25-100/week
- 5k-plus capital: Advanced strategies, $50-200+/week

## Response Style
- Concise and actionable — no fluff
- Data-driven with market context
- Encouraging but realistic — never promise specific returns
- Use percentages and dollar amounts for clarity
- Include confidence level (high/medium/low) for each recommendation
`;

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
  maxTokens = 1024
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const messages = typeof userMessageOrMessages === 'string'
    ? [{ role: 'user', content: userMessageOrMessages }]
    : userMessageOrMessages;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
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
  return data.content?.[0]?.text || '';
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

async function handleRecommend(userContext: UserContext): Promise<any> {
  const market = await fetchMarketData();
  const marketContext = formatMarketContext(market);

  const userPrompt = `
${marketContext}

## User Profile
- Investor Type: ${userContext.investorType || 'Not set'}
- Risk Tolerance: ${userContext.riskTolerance || 'medium'}
- Capital Range: ${userContext.capitalRange || 'Not set'}
- Goal: ${userContext.goal || 'balanced'}
- Experience: ${userContext.experience || 'new'}
- Current total invested: $${userContext.totalInvested || 0}
- Active DCA plans: ${userContext.currentPlans?.length || 0}

Based on this user's profile and current market conditions, provide a personalized DCA recommendation.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "suggestedAmount": <number>,
  "frequency": "daily" | "weekly" | "biweekly" | "monthly",
  "assets": [{"symbol": "<TICKER>", "allocation": <number>}],
  "rationale": "<2-3 sentences explaining why>",
  "marketInsight": "<1-2 sentences about current market conditions>",
  "riskNote": "<1 sentence about risks>",
  "confidence": "high" | "medium" | "low",
  "adjustments": "<specific adjustments based on current market, or null>"
}
`;

  const response = await callClaude(APICE_METHODOLOGY, userPrompt, 800);

  try {
    // Try to parse JSON from response (handle potential markdown wrapping)
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return {
      suggestedAmount: 25,
      frequency: 'weekly',
      assets: [{ symbol: 'BTC', allocation: 60 }, { symbol: 'ETH', allocation: 40 }],
      rationale: response.slice(0, 300),
      marketInsight: 'Market data analyzed.',
      riskNote: 'Past performance does not guarantee future results.',
      confidence: 'medium',
      adjustments: null,
    };
  }
}

async function handleInsight(userContext: UserContext): Promise<any> {
  const market = await fetchMarketData();
  const marketContext = formatMarketContext(market);

  const userPrompt = `
${marketContext}

## User Profile
- Investor Type: ${userContext.investorType || 'Balanced Optimizer'}
- Risk Tolerance: ${userContext.riskTolerance || 'medium'}
- Goal: ${userContext.goal || 'balanced'}
- Total invested: $${userContext.totalInvested || 0}
- Active plans: ${userContext.currentPlans?.length || 0}
${userContext.currentPlans?.length ? `- Current allocations: ${userContext.currentPlans.map(p => p.assets.map(a => `${a.symbol}(${a.allocation}%)`).join(',')).join(' | ')}` : ''}

Generate a personalized daily insight for this investor. Consider their profile, current market conditions, and investment goals.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "title": "<catchy 5-8 word title>",
  "content": "<3-4 sentences of actionable insight>",
  "type": "market" | "portfolio" | "education" | "discipline" | "opportunity",
  "action": "<specific recommended action or null>",
  "urgency": "low" | "medium" | "high",
  "sentiment": "bullish" | "bearish" | "neutral" | "cautious",
  "relatedAssets": ["<TICKER1>", "<TICKER2>"]
}
`;

  const response = await callClaude(APICE_METHODOLOGY, userPrompt, 600);

  try {
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return {
      title: 'Stay Consistent With Your DCA',
      content: response.slice(0, 400),
      type: 'discipline',
      action: 'Keep your weekly DCA schedule active.',
      urgency: 'low',
      sentiment: 'neutral',
      relatedAssets: ['BTC', 'ETH'],
    };
  }
}

async function handleAnalyzePortfolio(userContext: UserContext): Promise<any> {
  const market = await fetchMarketData();
  const marketContext = formatMarketContext(market);

  const plans = userContext.currentPlans || [];
  const planDetails = plans.map((p, i) =>
    `Plan ${i + 1}: $${p.amountPerInterval}/${p.frequency} → ${p.assets.map(a => `${a.symbol}(${a.allocation}%)`).join(', ')} | Total: $${p.totalInvested}`
  ).join('\n');

  const userPrompt = `
${marketContext}

## User Profile
- Investor Type: ${userContext.investorType || 'Balanced Optimizer'}
- Risk Tolerance: ${userContext.riskTolerance || 'medium'}
- Capital Range: ${userContext.capitalRange || 'Not set'}
- Total invested across all plans: $${userContext.totalInvested || 0}

## Current DCA Plans
${planDetails || 'No active plans'}

Analyze this portfolio and provide specific, actionable feedback.

Respond in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "score": <1-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "rebalanceNeeded": <boolean>,
  "rebalanceSuggestion": "<specific rebalance suggestion or null>",
  "riskAssessment": "<1-2 sentences>",
  "outlook": "<2-3 sentences about expected performance>",
  "nextAction": "<single most important next step>"
}
`;

  const response = await callClaude(APICE_METHODOLOGY, userPrompt, 800);

  try {
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return {
      score: 70,
      grade: 'B',
      strengths: ['Active DCA strategy'],
      improvements: ['Consider diversifying'],
      rebalanceNeeded: false,
      rebalanceSuggestion: null,
      riskAssessment: response.slice(0, 200),
      outlook: 'Consistent DCA will build wealth over time.',
      nextAction: 'Maintain your current DCA schedule.',
    };
  }
}

async function handleChat(userContext: UserContext, message: string, history?: Array<{role: string; content: string}>): Promise<any> {
  const market = await fetchMarketData();
  const marketContext = formatMarketContext(market);

  const systemPrompt = `${APICE_METHODOLOGY}

## Current Market Context
${marketContext}

## User Profile
- Investor Type: ${userContext.investorType || 'Not set'}
- Risk Tolerance: ${userContext.riskTolerance || 'medium'}
- Capital Range: ${userContext.capitalRange || 'Not set'}
- Goal: ${userContext.goal || 'balanced'}
- Total invested: $${userContext.totalInvested || 0}
- Active DCA plans: ${userContext.currentPlans?.length || 0}

Respond concisely (max 3-4 sentences). Be helpful, use market data when relevant, and stay aligned with the Apice methodology. If the user asks about specific assets, provide data-driven responses. Never provide financial advice — frame as education and strategy suggestions within the Apice framework. Respond in the same language the user writes in.`;

  // Build messages array with conversation history
  const messages: Array<{role: string; content: string}> = [];

  // Add last 10 messages of history
  if (history && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  const response = await callClaude(systemPrompt, messages, 500);

  return {
    message: response,
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
        JSON.stringify({ error: 'Missing action. Use: recommend, insight, analyze-portfolio, chat' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any;

    switch (action) {
      case 'recommend':
        result = await handleRecommend(userContext || {});
        break;
      case 'insight':
        result = await handleInsight(userContext || {});
        break;
      case 'analyze-portfolio':
        result = await handleAnalyzePortfolio(userContext || {});
        break;
      case 'chat':
        if (!message) {
          return new Response(
            JSON.stringify({ error: 'Missing message for chat action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleChat(userContext || {}, message, body.history);
        break;
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
