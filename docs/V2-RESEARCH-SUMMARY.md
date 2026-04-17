# V2 Research — Resumo Executivo

> **Autor:** @analyst (Atlas) | **Data:** 2026-04-17 | **Consumo:** @architect (Aria), @dev (Dex)
> **Fonte detalhada:** `V2-RESEARCH.json` (mesmo diretório)
> **Objetivo:** Fundamentar V2 do Apice (real-money launch em 5-7 semanas) com docs reais, endpoints verificados, parâmetros corretos.

---

## Decisões Técnicas Principais

1. **Bybit V5 como base única.** REST + WebSocket privada (canal `wallet`, `order`, `execution`) cobrem todas necessidades. SDK `bybit-api` (tiagosiebler, ^4.x) é TS-native, Deno-compatível via esm.sh, mantido ativamente — usar em vez de re-implementar HMAC signing.
2. **HMAC signing canônico.** `timestamp + apiKey + recvWindow + (queryString|jsonBodyRaw)` com `recvWindow=5000ms`. Headers `X-BAPI-*`. Assinar exatamente a string que sai na requisição (nunca re-serialize body depois de assinar).
3. **Idempotency em mutações Bybit.** `orderLinkId` em order/create (formato `apice-{planId}-{ts}`) e `transferId=UUID v4` em inter-transfer. NUNCA reusar UUIDs — erro `10014` se repetido.
4. **Stripe Embedded Checkout** (`ui_mode: 'embedded'`) via `@stripe/react-stripe-js` ^4.x. Mantém user no domínio Apice, PCI offloaded, +3-8% conversão vs hosted redirect (dado Stripe 2025).
5. **Webhook canônico:** `invoice.paid` é o PRIMARY event para unlock de access (dispara em 1ª compra e todos renewals). `checkout.session.completed` para provisioning inicial. Verificação obrigatória via `stripe.webhooks.constructEventAsync` com raw body + `STRIPE_WEBHOOK_SECRET`.
6. **Supabase Edge Functions (Deno) com limites paid plan:** 400s wall-clock, 200ms CPU ativo, 256MB RAM. Cold start ~50-200ms. Para Apice V2: 6 functions (bybit-transfer, balance-monitor, education-progress, challenge-engine, stripe-webhook, dca-executor).
7. **Cron via pg_cron + pg_net** (nativo Supabase) — `timeout_milliseconds` em `net.http_post` precisa ser 60000+ para chamadas Bybit multi-step (default 5000ms é insuficiente).
8. **Encryption API keys:** AES-256-GCM + HKDF-SHA256 per-user (`salt=user_id`, `info='bybit_api_v1'`). Storage via Supabase Vault (`pgsodium`). NUNCA plaintext em client/cookies.
9. **Rate limiting app-level:** Upstash Redis + `@upstash/ratelimit` (sliding-window 10/min por user em endpoints sensíveis). Supabase Edge Functions não tem rate limit built-in granular.
10. **Bybit Broker ID (X-Referer)** obrigatório pre-launch para rev-share 15-30% fee rebate — crítico para unit economics. Approval leva 5-7 dias úteis.

---

## Riscos Técnicos + Mitigações

| # | Risco | Severidade | Mitigação |
|---|-------|-----------|-----------|
| 1 | User conecta Bybit key sem scope `Wallet.AccountTransfer` → fluxo transfer quebra silenciosamente | HIGH | Capability check obrigatório em `GET /v5/user/query-api` imediatamente após onboarding key. Bloquear fluxo + deep-link para re-auth. |
| 2 | Stripe webhook sem signature verification → attacker fabrica `invoice.paid` → access grátis | CRITICAL | `constructEventAsync` com raw body + secret em Vault. Tabela `stripe_events(event_id PK)` para idempotency. Integration test com fake signature → 400. |
| 3 | Race entre `dca-executor` cron e balance stale → ordem sem fundos → erro 110004 + frustração user | HIGH | Fresh `wallet-balance` call ANTES de cada order. Se insuficiente → `fund_alerts.status='BLOCKED'` em vez de retry. Circuit breaker 3 falhas → pause plan. |
| 4 | BR billing complexo: Stripe não é MoR no BR; SPSAV BCB 519/520/521 vigor 2026-02-02 | MEDIUM | Launch Stripe US-only como "serviço internacional". Abrir billing BR sprint 10+ com legal opinion + parceria SPSAV autorizada. |
| 5 | Clock drift Deno isolate → erro 10002 (timestamp fora janela) | MEDIUM | Calibrar via `GET /v5/market/time` no boot + recvWindow=5000ms (seguro). Aumentar para 10000ms se VPN. |
| 6 | Edge Function timeout 400s vs `dca-executor` para milhares de users | HIGH (scale) | pgmq (Supabase queue nativa) quando scale > 500 users concorrentes. Batch workers drenam fila. |
| 7 | IP ban Bybit (HTTP 403) por burst requests | MEDIUM | Circuit breaker global 10min. IP limit: 600 req / 5s. UID limit: 10 req/s trading, 50 req/s read. Exponential backoff em 10006/429. |

---

## Recomendações Acionáveis

### Para @architect (Aria)
- **Edge Function template unificado** com: HMAC Bybit helper, Stripe signature verifier, Upstash rate limiter, structured logger (JSON), Sentry capture. Compartilhado via `_shared/` dir.
- **Schema `stripe_events(event_id text pk, payload jsonb, received_at timestamptz, processed boolean)`** para idempotency hard.
- **Schema `bybit_audit(id, user_id, endpoint, request_id, order_link_id, transfer_id, status, ret_code, latency_ms)`** — immutable audit log. RLS read-only user.
- **pgmq vs cron decisão:** Para V2 launch (< 500 users), cron pg_net suficiente. Documentar migration path para pgmq em ADR.
- **Feature flag testnet/mainnet per-user** (não per-build) — permite beta controlado sem rebuild.
- **Data residency:** Supabase us-east-1 default. Se EU base cresce → projeto dedicado EU region pós-MiCA (2026-07-01 full enforcement).

### Para @dev (Dex)
- **SDK Bybit:** instalar `bybit-api@^4.x` via npm. Import em Edge Function: `import { RestClientV5 } from 'npm:bybit-api'`. Ou ESM Deno: `https://esm.sh/bybit-api@4`.
- **Stripe SDK:** `npm:stripe@^19` com `apiVersion: '2026-03-25.preview'`. React: `@stripe/react-stripe-js@^4` + `@stripe/stripe-js@^8`.
- **Retry policy:** `p-retry` (npm) com `retries: 5, factor: 2, minTimeout: 500, maxTimeout: 30000`. Apenas em códigos `10006`, `10000`, HTTP 429/500/502/503.
- **Logging:** sempre `console.log(JSON.stringify({ level, event, fn, user_id, ctx }))` para Supabase Logs parseáveis.
- **Unit/Integration tests:** mock Bybit via `msw` em testes. E2E real via `api-demo.bybit.com` (testnet-demo faucet: 1 BTC + 10k USDT).
- **Error mapping UI-friendly:** Map `{ retCode → userMessage }` centralizado. Ex: `110004` → "Saldo insuficiente na conta UNIFIED. Transferir do SPOT?" com CTA.

### Para Security/Compliance
- **Legal opinion pre-launch** ($8-15k, firm crypto/SaaS especializada). Bloqueio para real-money. Questões: MSB US, MiCA EU, SPSAV BR, Stripe billing BR.
- **Stripe Tax** habilitado antes de launch público. US + EU cobertos. BR via Stripe Atlas US-Corp approach.
- **Bybit broker ID** aplicar HOJE — 5-7 dias úteis para approval. Sem isso unit economics quebra (rev-share ausente).
- **Threat model STRIDE** por endpoint sensível antes de ship. Mandatório em `docs/security/threat-model-v2.md`.

---

## Open Questions (Requer Decisão CEO / PM)

1. **Master API key vs user-supplied keys?** V1.5 é user-supplied (zero custody, argumento anti-MSB). V2 mantém? Decisão impacta compliance framing.
2. **Billing BR no launch?** Recomendação: NÃO — começar Stripe US-only, abrir BR em sprint 10+ pós-SPSAV strategy.
3. **Trial 7d Pro default OU só via ad CTA?** Impacta LTV / CAC.
4. **Annual plans** (Pro $499/y, Club $1499/y = -17%)? Decisão de growth + PM.
5. **Promotional codes** do V2-MASTER-PLAN (Challenge 6 25% lifetime, Challenge 9 1mo free, Challenge 10 Club lifetime) habilitados no launch ou post-MVP?
6. **SPSAV BR** registration até 2026-10-30 OU operar como "serviço internacional" longer-term?

---

## Fontes Consultadas (Top 15)

1. https://bybit-exchange.github.io/docs/v5/intro
2. https://bybit-exchange.github.io/docs/v5/order/create-order
3. https://bybit-exchange.github.io/docs/v5/order/batch-place
4. https://bybit-exchange.github.io/docs/v5/account/wallet-balance
5. https://bybit-exchange.github.io/docs/v5/asset/transfer/create-inter-transfer
6. https://bybit-exchange.github.io/docs/v5/user/apikey-info
7. https://bybit-exchange.github.io/docs/v5/rate-limit
8. https://bybit-exchange.github.io/docs/v5/error
9. https://github.com/tiagosiebler/bybit-api
10. https://docs.stripe.com/billing/subscriptions/overview
11. https://docs.stripe.com/billing/subscriptions/webhooks
12. https://docs.stripe.com/billing/subscriptions/build-subscriptions
13. https://supabase.com/docs/guides/functions/limits
14. https://supabase.com/docs/guides/functions/schedule-functions
15. https://supabase.com/docs/guides/database/vault

**Regulatórias:**
- https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica (MiCA)
- https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering (FinCEN MSB)
- https://notabene.id/post/brazils-central-bank-regulates-virtual-asset-service-providers-what-bcb-resolutions-mean-for-crypto-compliance (BCB 519/520/521)

---

*Handoff: @architect pode começar ADRs + `implementation.yaml` com base neste research. @dev pode começar spike em `bybit-transfer` Edge Function usando o example_nodejs de V2-RESEARCH.json.*
