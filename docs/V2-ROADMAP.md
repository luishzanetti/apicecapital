# Apice Capital V2 — Roadmap Completo

> De app de DCA para sistema operacional financeiro powered by AI Agents.
> Gerado: 2026-04-10 | Agentes: @dev, @po, @architect, @apple-ux, @bybit-fintech, @design-system

---

## Visao Estrategica

**V1** = App educacional de DCA com Bybit integration (35 paginas, funcional, demo-ready)
**V2** = Plataforma financeira completa com AI agents que executam trades, copy trading real, mobile nativo, e social layer

**One-liner:** "Apice V2 e o Robinhood de DCA + Wealthfront de AI trading + Substack de estrategias crypto — onde riqueza se compoe automaticamente enquanto voce dorme."

---

## Metricas de Sucesso V2

| Metrica | V1 Atual | V2 Target | Como Medir |
|---------|----------|-----------|------------|
| MAU (Monthly Active Users) | 0 (pre-launch) | 10,000 | PostHog |
| D7 Retention | ~30% | 45% | PostHog cohorts |
| Free → Pro Conversion | ~5% | 15% | Stripe + store |
| Pro → Club Conversion | ~2% | 8% | Stripe |
| MRR | $0 | $150K | Stripe Dashboard |
| LCP (Largest Contentful Paint) | ~3.5s | <2.5s | Lighthouse |
| Test Coverage | ~0% | 80% | Vitest |
| Uptime | ~98% | 99.95% | Better Stack |
| API P95 Latency | ~800ms | <500ms | Datadog |
| Price Data Freshness | 30s polling | <5s WebSocket | Custom metric |

---

## Pricing V2

| Tier | Preco | Features Chave | Custo Marginal | Margem |
|------|-------|----------------|----------------|--------|
| **Free** | $0 | 1 portfolio, DCA basico, 10 lessons, Explosive top 10, demo AI | $0 | N/A |
| **Pro** | $49.90/mo | AI Conversations (Claude), all portfolios, copy 1 trader, mobile push, Explosive full, cashback tracking | ~$5/user (Claude API) | 90% |
| **Club** | $149.90/mo | AI Agent Trading (execucao automatica), 5 traders, coach access, cashback real, marketplace, priority support | ~$15/user | 90% |
| **Institutional** | Custom | API access, white-label DCA engine, anonymized data intelligence, 24/7 support | Variable | 70% |

---

## Revenue Streams V2

| Stream | Mecanismo | Year 1 Projecao |
|--------|-----------|-----------------|
| Pro Subscriptions | 5,000 users x $49.90/mo | $2.99M |
| Club Subscriptions | 1,000 users x $149.90/mo | $1.80M |
| Copy Trading AUM | 2% de $60M AUM | $1.20M |
| B2B API + Data | 10 enterprise x $15K/mo avg | $1.80M |
| Cashback Volume | 0.5% de $100M volume | $500K |
| Marketplace | 30% take rate de $400K GMV | $120K |
| **TOTAL** | | **$8.4M** |

---

## Arquitetura V2

```
FRONTEND (Monorepo)
├── apps/web (React + Vite)
├── apps/mobile (React Native)
├── packages/core (shared hooks, store, types)
├── packages/ui (shared components)
└── packages/config (shared configs)

REALTIME LAYER
├── Bybit WebSocket (public: prices, trades)
├── Supabase Realtime (private: portfolio updates)
└── Push Notifications (Firebase/APNs)

AI ENGINE
├── Claude API (advisor, analysis, briefings)
├── Signal Generator (trend, grid, mean-reversion)
├── Risk Assessor (pre-trade validation)
└── Content Generator (lessons, reports)

MICROSERVICES (Supabase Edge Functions v2)
├── dca/ (execute, smart-allocation, analytics)
├── trading/ (spot, leveraged, batch, copy)
├── ai/ (advisor, signals, briefing)
├── risk/ (monitor, liquidation, circuit-breaker)
├── portfolio/ (rebalance, performance, attribution)
├── social/ (profiles, followers, challenges)
└── webhooks/ (bybit, stripe, resend)

DATA PIPELINE
├── Redis/Upstash (price cache, sessions)
├── PostgreSQL (core data, RLS)
├── TimescaleDB (OHLCV, performance timeseries)
└── S3/R2 (reports, exports, backups)

EXCHANGE ADAPTERS
├── Bybit (primary — spot, derivatives, earn)
├── Binance (Phase 2 — spot, margin)
├── Coinbase (Phase 3 — spot, USD)
└── Kraken (Phase 3 — advanced orders)

OBSERVABILITY
├── Sentry (error tracking)
├── PostHog (product analytics)
├── Datadog/Grafana (metrics, APM)
└── Better Stack (uptime, alerts)
```

---

## Fase 1: Foundation (Semanas 1-8)

> Objetivo: Tornar o app production-ready com dados reais em tempo real.

### 1.1 WebSocket Real-Time Data (Semanas 1-2)

**O que:** Substituir polling 30s por WebSocket live para precos.

**Bybit API:**
- Public WebSocket: `wss://stream.bybit.com/v5/public/spot`
- Topics: `tickers.BTCUSDT`, `tickers.ETHUSDT`, etc.
- Sem autenticacao necessaria (dados publicos)

**Implementacao:**
- Criar `src/lib/websocketManager.ts` — singleton que gerencia conexao
- Criar `src/hooks/useRealtimePrice.ts` — hook que retorna preco live
- Reconnection com exponential backoff (3s, 6s, 12s, max 60s)
- Heartbeat a cada 20s (Bybit exige ping/pong)
- `visibilitychange` — pause quando tab em background
- Fallback: se WebSocket falhar, volta para polling 30s

**Arquivos:**
```
src/lib/websocketManager.ts (novo, ~150 linhas)
src/hooks/useRealtimePrice.ts (novo, ~60 linhas)
src/components/TopCoinsList.tsx (modificar — usar live prices)
src/components/home/ExecutivePortfolioBoard.tsx (modificar)
```

**Metricas:**
- Price freshness: 30s → <3s
- API calls: -80% (WebSocket vs polling)

---

### 1.2 Data Pipeline — OHLCV + Snapshots (Semanas 2-4)

**O que:** Armazenar historico de precos e snapshots de portfolio para analytics reais.

**Novas tabelas:**
```sql
-- Price history (15-min candles)
CREATE TABLE ohlcv_15m (
  id bigserial PRIMARY KEY,
  symbol text NOT NULL,
  time_bucket timestamptz NOT NULL,
  open decimal, high decimal, low decimal, close decimal,
  volume decimal,
  UNIQUE(symbol, time_bucket)
);
CREATE INDEX idx_ohlcv_lookup ON ohlcv_15m(symbol, time_bucket DESC);

-- Daily portfolio snapshots
CREATE TABLE portfolio_snapshots (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  total_value decimal,
  allocations jsonb,
  daily_pnl decimal,
  cumulative_return_pct decimal,
  UNIQUE(user_id, date)
);
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_snapshots" ON portfolio_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- Order execution log
CREATE TABLE order_executions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  exchange text DEFAULT 'bybit',
  order_id text,
  symbol text NOT NULL,
  side text NOT NULL,
  quantity decimal,
  price decimal,
  fee decimal,
  strategy text,
  status text DEFAULT 'filled',
  executed_at timestamptz DEFAULT now()
);
ALTER TABLE order_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_orders" ON order_executions
  FOR ALL USING (auth.uid() = user_id);

-- Performance daily (computed)
CREATE TABLE performance_daily (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  nav decimal,
  daily_return_pct decimal,
  sharpe_ytd decimal,
  max_drawdown_pct decimal,
  UNIQUE(user_id, date)
);
ALTER TABLE performance_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_perf" ON performance_daily
  FOR ALL USING (auth.uid() = user_id);
```

**Edge Functions (cron):**
- `collect-ohlcv` — a cada 15min, busca candles do Bybit, salva em ohlcv_15m
- `snapshot-portfolios` — diario 00:00 UTC, snapshot de cada user com Bybit conectado
- `compute-performance` — diario, calcula returns, Sharpe, drawdown

**Impacto:**
- Habilita backtesting real (nao mais dados fake)
- Habilita performance charts reais (nao mais simulados)
- Habilita comparacao peer (benchmark)

---

### 1.3 Observability (Semanas 3-4)

**O que:** Visibilidade total do que acontece em producao.

**Stack:**
- **Sentry** — error tracking (frontend + Edge Functions)
- **PostHog** — product analytics (funnels, retention, feature adoption)
- **Structured Logging** — JSON logs em todas Edge Functions

**Implementacao:**
```
npm install @sentry/react posthog-js
```

- `src/lib/sentry.ts` — init Sentry com DSN
- `src/lib/posthog.ts` — init PostHog com project key
- Wrap App.tsx com `<Sentry.ErrorBoundary>`
- Track events: signup, quiz_complete, bybit_connected, first_dca, upgrade
- Edge Functions: structured JSON logging com correlation ID

**Metricas possiveis:**
- Funnel: Signup → Quiz → Connect Bybit → First DCA → Upgrade
- Feature adoption: % users com AI Trade ativo
- Error rate por endpoint
- P95 latency por funcao

---

### 1.4 CI/CD Pipeline (Semanas 3-4)

**O que:** Deploy automatizado com quality gates.

**GitHub Actions:**
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - npm ci
      - npm run lint
      - npm run test -- --coverage
      - npm run build
      - npx bundlesize # warn on +10%

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: quality
    steps:
      - vercel deploy --prebuilt
      - supabase functions deploy --project-ref $STAGING_REF

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: quality
    steps:
      - vercel deploy --prod
      - supabase db push --project-ref $PROD_REF
      - supabase functions deploy --project-ref $PROD_REF
```

**Branching:**
- `main` — producao (deploy automatico)
- `develop` — staging (preview deploys)
- `feature/*` — PRs para develop

---

### 1.5 Testing Foundation (Semanas 5-8)

**Target:** 80% coverage nos modulos criticos.

**Prioridade de testes:**
```
1. src/lib/dca.ts (calculo de datas, frequencias)
2. src/lib/bybit-errors.ts (error mapping, retry)
3. src/hooks/useDCAStats.ts (computed stats)
4. src/store/slices/dcaSlice.ts (CRUD de planos)
5. supabase/functions/dca-execute/ (execucao real)
6. supabase/functions/ai-advisor/ (Claude integration)
```

**E2E (Playwright):**
```
e2e/
├── auth.spec.ts (signup → login → logout)
├── onboarding.spec.ts (quiz → profile → home)
├── dca.spec.ts (create plan → execute → history)
├── portfolio.spec.ts (select → view → rebalance)
└── upgrade.spec.ts (free → pro → feature unlock)
```

---

## Fase 2: Intelligence (Semanas 9-16)

> Objetivo: AI que analisa, recomenda e EXECUTA.

### 2.1 AI Agent Trading (Semanas 9-12)

**O que:** Claude-powered agent que executa trades com confirmacao do usuario.

**Fluxo:**
```
User: "Rebalance my portfolio to 40% BTC, 30% ETH, 30% SOL"
   ↓
AI Agent analisa portfolio atual:
   - BTC: 55% (precisa vender 15%)
   - ETH: 25% (precisa comprar 5%)
   - SOL: 10% (precisa comprar 20%)
   - USDT: 10% (usar para compras)
   ↓
AI mostra plano:
   "Sell 0.02 BTC ($1,400) → Buy 0.8 ETH ($350) + Buy 3.5 SOL ($1,050)
    Estimated fees: $2.80 | Slippage: <0.1%
    Risk impact: Volatility increases 8%"
   ↓
User confirma (thumbprint/2FA)
   ↓
Edge Function executa batch orders via Bybit
   ↓
Resultado: "Rebalance complete. New allocation: BTC 40.1%, ETH 30.2%, SOL 29.7%"
```

**Edge Function:** `ai-agent-execute/index.ts`
- Recebe intent do usuario (natural language)
- Claude analisa portfolio + market context
- Gera plano de execucao (orders array)
- User confirma
- Executa via `/v5/order/create-batch`
- Retorna resultado

**Gating:** Club tier only ($149.90/mo)

---

### 2.2 Copy Trading com Execucao Real (Semanas 11-14)

**O que:** Copiar portfolios de traders verificados com execucao automatica.

**Arquitetura:**
```
Trader publica portfolio:
  BTC 40% | ETH 30% | SOL 20% | LINK 10%
   ↓
User clica "Copy This" (aloca $1,000)
   ↓
Sistema calcula ordens:
  Buy 0.006 BTC ($400) | Buy 0.15 ETH ($300) | Buy 1.5 SOL ($200) | Buy 7 LINK ($100)
   ↓
Edge Function executa batch order
   ↓
Rebalance automatico quando trader muda alocacao
   ↓
User recebe notificacao: "Your copy portfolio rebalanced. +$45 today."
```

**Novas tabelas:**
```sql
CREATE TABLE copy_portfolios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES auth.users,
  name text, description text,
  allocations jsonb,
  min_investment decimal DEFAULT 100,
  is_public boolean DEFAULT false,
  sharpe_ytd decimal, total_return_pct decimal,
  copiers_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE copy_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  portfolio_id uuid REFERENCES copy_portfolios,
  amount_allocated decimal,
  auto_rebalance boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, portfolio_id)
);
```

**Revenue:** 2% AUM fee (split 70% trader / 30% Apice)

---

### 2.3 Daily AI Briefing (Semanas 13-14)

**O que:** Briefing personalizado toda manha.

**Conteudo:**
```
Good morning, Luis. Here's your crypto briefing:

MARKET: BTC +3.2% overnight. Fear & Greed at 65 (Greed).
Regime: Bull market continues (92% confidence).

YOUR PORTFOLIO: $78,450 (+$1,240 today, +1.6%)
- Best performer: SOL +8.2%
- Underperformer: LINK -1.3%

DCA STATUS: Next execution in 2 days ($50 → BTC 35%, ETH 25%, SOL 20%)
Recommendation: Market is greedy. Consider keeping your DCA steady.

ACTION ITEMS:
1. Your portfolio is 5% overweight BTC. Consider rebalancing.
2. SOL broke above $180 resistance. Set stop-loss at $165.
3. New coin on Explosive List: SUI (+45% this week)
```

**Entrega:** Push notification (mobile) + email + in-app card

---

### 2.4 Performance Analytics Real (Semanas 15-16)

**O que:** Dashboard com metricas reais de performance.

**Metricas:**
- Time-Weighted Return (TWR)
- Sharpe Ratio (risk-adjusted return)
- Max Drawdown (worst peak-to-trough)
- Win Rate (% of profitable trades)
- Profit Factor (gross profit / gross loss)
- Alpha vs Bitcoin (benchmark)
- Fee Impact (total fees / total returns)

**Visualizacao:**
- Equity curve (portfolio value over time)
- Drawdown chart
- Attribution chart (which asset contributed most)
- Heatmap: strategy x market regime
- Peer comparison: "You're in top 15% of Growth Seekers"

---

## Fase 3: Scale (Semanas 17-24)

> Objetivo: Mobile nativo + social + multi-exchange.

### 3.1 Mobile App — React Native (Semanas 17-22)

**Monorepo:**
```
apice/
├── apps/
│   ├── web/ (current React app)
│   └── mobile/ (React Native)
├── packages/
│   ├── core/ (hooks, store, types — shared)
│   ├── ui/ (shared component logic)
│   └── config/ (shared configs)
└── package.json (workspace root)
```

**Mobile-specific:**
- Push notifications (Firebase Cloud Messaging)
- Biometric auth (Face ID, fingerprint)
- Offline-first (local cache, sync queue)
- Haptic feedback em trades
- Widget iOS/Android (portfolio value)
- Deep links: `apice://dca/create`

### 3.2 Social Layer (Semanas 19-22)

**Features:**
- Perfis publicos com username
- Follow/unfollow traders
- Public portfolio (opt-in)
- Social DCA challenges ("30-Day Hodl Challenge")
- Leaderboard mensal (Sharpe ratio ranking)
- Badge sharing (Twitter/Instagram cards)
- Community feed (trade signals, insights)

### 3.3 Multi-Exchange (Semanas 21-24)

**Exchange Adapter Pattern:**
```typescript
interface ExchangeAdapter {
  name: string;
  getBalance(): Promise<Balance[]>;
  placeOrder(order: OrderRequest): Promise<OrderResult>;
  getPositions(): Promise<Position[]>;
  subscribePrices(symbols: string[]): WebSocket;
}

class BybitAdapter implements ExchangeAdapter { ... }
class BinanceAdapter implements ExchangeAdapter { ... }
class CoinbaseAdapter implements ExchangeAdapter { ... }
```

**Unified Portfolio:**
- Aggrega balances de todas as exchanges
- Smart routing: executa no exchange com menor fee
- Cross-exchange rebalancing
- Consolidated tax reporting

---

## Fase 4: Revenue (Semanas 25-32)

> Objetivo: Diversificar receita alem de subscriptions.

### 4.1 Cashback Engine Real (Semanas 25-28)

**Integracao:** Stripe (card transactions) + Bybit (fee rebates)
- Cada compra gera cashback em BTC
- Auto-compound mensal no DCA
- Dashboard: "This month you earned 0.003 BTC ($240) in cashback"

### 4.2 Strategy Marketplace (Semanas 27-30)

**Creator Economy:**
- Traders publicam estrategias ($9.99 - $99.99)
- Apice take rate: 30%
- Coaches oferecem 1:1 ($99-$299/sessao)
- Research reports trimestrais

### 4.3 B2B API (Semanas 29-32)

**Produtos:**
- DCA Engine API (white-label para exchanges)
- Market Intelligence API (regime detection, signals)
- Anonymized User Data (trends, allocations)
- Pricing: $5K-$50K/mo por enterprise

---

## Bugs Criticos V1 para Resolver Antes de V2

| # | Bug | Arquivo | Prioridade |
|---|-----|---------|-----------|
| 1 | PWA icons faltando (192px, 512px) | public/ | Bloqueia install |
| 2 | Bybit affiliate code hardcoded "APICE" | sampleData.ts | Perde revenue |
| 3 | .env com keys no git history | .env | Rotacionar ASAP |
| 4 | Edge Function `bybit-account` tem crypto duplicado | supabase/functions/ | Consolidar |
| 5 | `marketData.ts` faz fallback direto pro Bybit do browser | src/services/ | Rota via Edge Fn |
| 6 | Sem retry em nenhuma chamada Bybit | Edge Functions | Implementar withRetry |
| 7 | 1s hardcoded sleep apos market order | dca-execute | Polling fill status |
| 8 | ASSET_TO_SYMBOL limitado a 27 coins | marketData.ts | Dynamic instruments |
| 9 | Stripe nao integrado (subscription e local-only) | Upgrade.tsx | Precisa para revenue |
| 10 | Supabase cron jobs nao configurados | config.toml | Deploy Edge Fns |

---

## Stack Tecnico V2

| Layer | Tecnologia | Justificativa |
|-------|-----------|---------------|
| Frontend Web | React 18 + Vite + TypeScript | Ja estabelecido, performante |
| Frontend Mobile | React Native + Expo | Compartilha logica com web |
| State | Zustand + React Query | Ja funciona bem, cache automatico |
| Styling | Tailwind + shadcn/ui | Design system consistente |
| Charts | Recharts + D3 (custom) | Recharts para dashboards, D3 para candlesticks |
| Animation | Framer Motion | Ja estabelecido |
| Backend | Supabase (PostgreSQL + Edge Functions) | Ja estabelecido, escala bem |
| Cache | Upstash Redis | Serverless Redis, integra com Edge Functions |
| AI | Anthropic Claude API (Sonnet 4.6) | Melhor para analise financeira |
| Auth | Supabase Auth + 2FA (TOTP) | Ja funciona, adicionar 2FA |
| Payments | Stripe | Standard para SaaS |
| Email | Resend | Developer-friendly, React Email |
| Push | Firebase Cloud Messaging | Cross-platform |
| Error Tracking | Sentry | Industry standard |
| Analytics | PostHog | Open-source, self-hostable |
| CI/CD | GitHub Actions | Integrado com repo |
| Hosting | Vercel (web) + EAS (mobile) | Edge deployment |
| Monitoring | Better Stack | Uptime + incidents |

---

## Timeline Visual

```
Semana  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
        ├──FASE 1: FOUNDATION──┤  ├────FASE 2: INTELLIGENCE────┤  ├──FASE 3: SCALE──┤
        │                      │  │                             │  │                  │
   1.1  ████ WebSocket         │  │                             │  │                  │
   1.2  ░░████ Data Pipeline   │  │                             │  │                  │
   1.3     ████ Observability  │  │                             │  │                  │
   1.4     ████ CI/CD          │  │                             │  │                  │
   1.5        ████████ Testing │  │                             │  │                  │
        │                      │  │                             │  │                  │
   2.1  │                      │  ████████ AI Agent             │  │                  │
   2.2  │                      │  ░░████████ Copy Trading       │  │                  │
   2.3  │                      │        ████ Daily Briefing     │  │                  │
   2.4  │                      │            ████ Analytics      │  │                  │
        │                      │  │                             │  │                  │
   3.1  │                      │  │                             │  ████████████ Mobile│
   3.2  │                      │  │                             │  ░░████████ Social  │
   3.3  │                      │  │                             │     ░░████████ Multi│
```

---

## Equipe Necessaria

| Funcao | Quantidade | Foco |
|--------|-----------|------|
| Senior Frontend | 1 | React + React Native, WebSocket, charts |
| Senior Backend | 1 | Edge Functions, data pipeline, Bybit API |
| AI/ML Engineer | 1 | Claude integration, signal generation |
| DevOps | 0.5 | CI/CD, monitoring, infrastructure |
| Product Designer | 0.5 | Mobile UX, new features |
| **Total** | **3-4 pessoas** | **6 meses para V2 completa** |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Bybit API breaking changes | Media | Alto | Adapter pattern, versioned endpoints |
| Claude API rate limits | Alta | Medio | Cache responses, fallback local |
| Regulatory (KYC/AML) | Media | Alto | Compliance-first, legal review |
| Security breach | Baixa | Critico | Pen testing, bug bounty, audit |
| User churn | Alta | Alto | Push notifications, streaks, social |
| Competition (Binance/Coinbase) | Alta | Medio | AI Agent = differentiator unico |
| Scale issues | Media | Medio | Load testing, Redis cache, CDN |

---

## Conclusao

Apice Capital V1 e uma base solida com 35 paginas funcionais, DCA automation real, e Bybit integration completa. V2 transforma isso em uma plataforma de $8.4M ARR atacando 3 gaps criticos:

1. **AI Agent Trading** — ninguem no mercado tem Claude executando trades
2. **Copy Trading Real** — competidores so oferecem guias, nos executamos
3. **Mobile + Social** — stickiness via push notifications e community

O roadmap de 24 semanas com 3-4 engenheiros entrega uma plataforma que compete diretamente com Binance Earn, Wealthfront, e Acorns — mas com crypto-native AI que nenhum deles tem.

**Proximo passo:** Executar Fase 1 (Foundation) — WebSocket + Data Pipeline + Observability + CI/CD.
