/**
 * Apex AI — Insights engine
 *
 * Computes portfolio health, recommendations and risk alerts from real
 * portfolio data. The MVP uses deterministic heuristics (no LLM) to keep
 * the feedback deterministic, cheap and offline-capable.
 *
 * Future: swap to Claude/GPT via the `apex-ai-insights` Edge Function for
 * richer natural-language analysis. The interface stays the same.
 */

import type {
  ApexAiPortfolio,
  ApexAiPosition,
  ApexAiTrade,
  ApexAiUserCredits,
  ApexAiPortfolioStats,
} from '@/types/apexAi';

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface ApexAiRecommendation {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface ApexAiAlert {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
}

export interface ApexAiPortfolioHealth {
  score: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D';
  summary: string;
  factors: Array<{ label: string; value: string; tone: InsightSeverity }>;
}

export interface ApexAiInsightsReport {
  health: ApexAiPortfolioHealth;
  recommendations: ApexAiRecommendation[];
  alerts: ApexAiAlert[];
  generatedAt: string;
}

interface BuildInsightsInput {
  portfolio: ApexAiPortfolio;
  stats: ApexAiPortfolioStats | null;
  openPositions: ApexAiPosition[];
  recentTrades: ApexAiTrade[];
  credits: ApexAiUserCredits | null;
}

export function buildApexAiInsights(input: BuildInsightsInput): ApexAiInsightsReport {
  const { portfolio, stats, openPositions, recentTrades, credits } = input;

  const health = computeHealth(portfolio, stats, openPositions, recentTrades);
  const recommendations = computeRecommendations(
    portfolio,
    stats,
    openPositions,
    recentTrades,
    credits
  );
  const alerts = computeAlerts(portfolio, stats, openPositions, credits);

  return {
    health,
    recommendations,
    alerts,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Health score (0–100) ──────────────────────────────────

function computeHealth(
  portfolio: ApexAiPortfolio,
  stats: ApexAiPortfolioStats | null,
  openPositions: ApexAiPosition[],
  trades: ApexAiTrade[]
): ApexAiPortfolioHealth {
  const factors: Array<{ label: string; value: string; tone: InsightSeverity }> = [];

  // 1. PnL trend (35 pts)
  let pnlScore = 20;
  const totalPnl = stats?.total_pnl ?? 0;
  const capital = portfolio.capital_usdt;
  const pnlPct = capital > 0 ? (totalPnl / capital) * 100 : 0;
  if (pnlPct >= 10) pnlScore = 35;
  else if (pnlPct >= 5) pnlScore = 30;
  else if (pnlPct >= 0) pnlScore = 22;
  else if (pnlPct >= -5) pnlScore = 12;
  else pnlScore = 4;
  factors.push({
    label: 'Return',
    value: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`,
    tone: pnlPct >= 5 ? 'success' : pnlPct >= 0 ? 'info' : pnlPct >= -5 ? 'warning' : 'critical',
  });

  // 2. Win rate (25 pts)
  let winScore = 10;
  const winRate = stats?.win_rate ?? 0;
  if (winRate >= 65) winScore = 25;
  else if (winRate >= 55) winScore = 20;
  else if (winRate >= 45) winScore = 14;
  else if (winRate >= 35) winScore = 8;
  else winScore = 3;
  factors.push({
    label: 'Win rate',
    value: `${winRate.toFixed(0)}%`,
    tone: winRate >= 55 ? 'success' : winRate >= 45 ? 'info' : 'warning',
  });

  // 3. Status & safety (20 pts)
  let statusScore = 15;
  if (portfolio.status === 'circuit_breaker') statusScore = 2;
  else if (portfolio.status === 'error') statusScore = 5;
  else if (portfolio.status === 'stopped') statusScore = 10;
  else if (portfolio.status === 'paused') statusScore = 14;
  else if (portfolio.status === 'active') statusScore = 20;
  factors.push({
    label: 'Status',
    value: portfolio.status.replace('_', ' '),
    tone:
      portfolio.status === 'active'
        ? 'success'
        : portfolio.status === 'circuit_breaker' || portfolio.status === 'error'
        ? 'critical'
        : 'info',
  });

  // 4. Concentration risk (20 pts)
  const symbolMap = new Map<string, number>();
  for (const p of openPositions) {
    const current = symbolMap.get(p.symbol) ?? 0;
    symbolMap.set(p.symbol, current + Math.abs(Number(p.size) * Number(p.entry_price)));
  }
  const symbolCount = symbolMap.size;
  let concentrationScore = 10;
  if (symbolCount >= 5) concentrationScore = 20;
  else if (symbolCount >= 3) concentrationScore = 16;
  else if (symbolCount >= 2) concentrationScore = 12;
  else if (symbolCount === 1) concentrationScore = 8;
  else concentrationScore = openPositions.length === 0 ? 14 : 6;
  factors.push({
    label: 'Diversification',
    value: `${symbolCount} symbols`,
    tone: symbolCount >= 3 ? 'success' : symbolCount >= 1 ? 'info' : 'warning',
  });

  const total = pnlScore + winScore + statusScore + concentrationScore;
  const score = Math.max(0, Math.min(100, Math.round(total)));

  const grade: 'A' | 'B' | 'C' | 'D' =
    score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D';

  const summary = buildHealthSummary(score, grade, pnlPct, winRate, portfolio.status);

  return { score, grade, summary, factors };
}

function buildHealthSummary(
  score: number,
  grade: string,
  pnlPct: number,
  winRate: number,
  status: string
): string {
  if (status === 'circuit_breaker') {
    return 'Circuit breaker engaged. Review recent trades before restarting the bot.';
  }
  if (score >= 80) {
    return `Strong performance across the board. Win rate ${winRate.toFixed(0)}%, return ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% — keep this configuration.`;
  }
  if (score >= 65) {
    return `Solid health. Return at ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% with ${winRate.toFixed(0)}% wins. Minor tweaks could push to grade A.`;
  }
  if (score >= 45) {
    return `Performance is below average. Consider reviewing risk profile and symbol allocation.`;
  }
  return `Performance is poor. Evaluate pausing the bot and reviewing configuration before continuing.`;
}

// ─── Recommendations ──────────────────────────────────────

function computeRecommendations(
  portfolio: ApexAiPortfolio,
  stats: ApexAiPortfolioStats | null,
  openPositions: ApexAiPosition[],
  trades: ApexAiTrade[],
  credits: ApexAiUserCredits | null
): ApexAiRecommendation[] {
  const recs: ApexAiRecommendation[] = [];

  const winRate = stats?.win_rate ?? 0;
  const totalPnl = stats?.total_pnl ?? 0;
  const capital = portfolio.capital_usdt;

  // 1. Low win rate → consider switching to conservative
  if (winRate < 45 && (stats?.total_trades ?? 0) >= 10) {
    if (portfolio.risk_profile !== 'conservative') {
      recs.push({
        id: 'switch-conservative',
        severity: 'warning',
        title: 'Consider a more conservative profile',
        description: `Win rate is ${winRate.toFixed(0)}% — below the 50% comfort zone. Switching to a conservative profile would reduce leverage and focus on blue-chip pairs, improving consistency.`,
      });
    }
  }

  // 2. High win rate + aggressive → suggest aggressive for more return
  if (winRate >= 65 && (stats?.total_trades ?? 0) >= 10) {
    if (portfolio.risk_profile === 'conservative') {
      recs.push({
        id: 'upgrade-balanced',
        severity: 'info',
        title: 'Your strategy is ready for more',
        description: `Win rate of ${winRate.toFixed(0)}% is excellent. A balanced profile would capture more upside without drastically raising risk.`,
      });
    }
  }

  // 3. Low credits → top up
  if (credits && credits.balance < credits.low_balance_threshold) {
    recs.push({
      id: 'topup-credits',
      severity: 'warning',
      title: 'Top up Credits',
      description: `You have ${credits.balance.toFixed(0)} Credits remaining. The bot will auto-pause when credits run out. Top up to keep the bot running.`,
      actionLabel: 'Top up now',
    });
  }

  // 4. No open positions but bot active → bot may be waiting for entry
  if (openPositions.length === 0 && portfolio.status === 'active') {
    recs.push({
      id: 'no-positions-active',
      severity: 'info',
      title: 'Bot is waiting for setup',
      description:
        'No open positions right now. The AI is monitoring the market for ideal entry points. If this persists longer than expected, check symbol liquidity or risk profile.',
    });
  }

  // 5. Big drawdown → consider pause
  const drawdown24h = Number(portfolio.total_pnl) < 0
    ? Math.abs((Number(portfolio.total_pnl) / capital) * 100)
    : 0;
  if (drawdown24h > 10 && drawdown24h < portfolio.drawdown_24h_trigger_pct) {
    recs.push({
      id: 'approaching-circuit-breaker',
      severity: 'warning',
      title: 'Approaching circuit breaker',
      description: `Current drawdown is ${drawdown24h.toFixed(1)}%, close to the ${portfolio.drawdown_24h_trigger_pct}% trigger. Consider pausing manually to review before auto-pause kicks in.`,
    });
  }

  // 6. Single-symbol concentration
  const symbols = new Set(openPositions.map((p) => p.symbol));
  if (symbols.size === 1 && openPositions.length > 0) {
    recs.push({
      id: 'concentration-risk',
      severity: 'warning',
      title: 'Single-symbol exposure',
      description: `All current positions are on one symbol. Consider diversifying across 3+ symbols to reduce idiosyncratic risk.`,
    });
  }

  // 7. Profitable + many trades → suggest increasing capital
  if (totalPnl > 0 && (stats?.total_trades ?? 0) >= 30 && winRate >= 55) {
    const roi = (totalPnl / capital) * 100;
    if (roi > 5) {
      recs.push({
        id: 'scale-up',
        severity: 'success',
        title: 'Consider scaling up',
        description: `You're at +${roi.toFixed(1)}% return with ${stats?.total_trades} trades and a ${winRate.toFixed(0)}% win rate. The strategy is proven — scaling the allocated capital could compound results.`,
      });
    }
  }

  return recs;
}

// ─── Alerts (red flags) ────────────────────────────────────

function computeAlerts(
  portfolio: ApexAiPortfolio,
  stats: ApexAiPortfolioStats | null,
  openPositions: ApexAiPosition[],
  credits: ApexAiUserCredits | null
): ApexAiAlert[] {
  const alerts: ApexAiAlert[] = [];

  if (portfolio.status === 'circuit_breaker') {
    alerts.push({
      id: 'circuit-breaker-active',
      severity: 'critical',
      title: 'Circuit breaker engaged',
      description: `Drawdown exceeded the ${portfolio.drawdown_24h_trigger_pct}% threshold. The bot has been auto-paused for safety.`,
    });
  }

  if (portfolio.status === 'error') {
    alerts.push({
      id: 'bot-error',
      severity: 'critical',
      title: 'Bot error',
      description:
        'The bot encountered an error during its last tick. Check logs or reactivate to retry.',
    });
  }

  if (credits && credits.balance === 0 && portfolio.status === 'active') {
    alerts.push({
      id: 'zero-credits',
      severity: 'critical',
      title: 'Out of Credits',
      description:
        'Credits balance is zero. The next profitable trade will auto-pause the bot. Top up immediately to keep it running.',
    });
  }

  // Dangerous leverage
  const highLeveragePositions = openPositions.filter((p) => p.leverage >= 10);
  if (highLeveragePositions.length > 0) {
    alerts.push({
      id: 'high-leverage',
      severity: 'warning',
      title: `${highLeveragePositions.length} position(s) above 10x leverage`,
      description:
        'High-leverage positions amplify both gains and losses. Verify that this aligns with your risk tolerance.',
    });
  }

  return alerts;
}
