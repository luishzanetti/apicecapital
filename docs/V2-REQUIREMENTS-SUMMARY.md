# Apice V2 — Requirements Summary (Executivo)

> **Spec Pipeline Phase 1 — Gather** · @pm (Morgan) · 2026-04-17
> **Fonte autoritativa:** `V2-REQUIREMENTS.json` (mesmo diretorio)

## Objetivo V2

Lançar Apice Capital operando com **dinheiro real** (DCA real + portfolio sync real + ALTIS config estável + Stripe) em **5-7 semanas** (~32 dias úteis). Cap inicial de **$500/usuário/30 dias**, rollout **testnet → mainnet** via feature flag.

## Escopo em números

- **20 FRs** (11 P0 + 9 P1) — cada um rastreia a um P0/P1 do recon ou a documento fonte (Article IV: zero invenção)
- **15 NFRs** — segurança (5), performance (2), compliance (2), UX (3), reliability/availability (2), observability (1)
- **10 Constraints** — cap $500, testnet→mainnet, no-Withdraw, WCAG AA, EN-first, stack imutável
- **10 Riscos mapeados** — 2 CRITICAL, 3 HIGH

## Os 11 P0 (dinheiro real não move sem eles)

| FR | Título | Traces-to |
|----|--------|-----------|
| FR-01 | Persistência de portfolios (race Zustand+Supabase) | P0-1 |
| FR-02 | ALTIS config loop eliminado | P0-2 |
| FR-03 | Encryption de API keys em Edge Function | P0-3 |
| FR-04 | Validação keys Bybit via /v5/user/query-api | P0-4 |
| FR-05 | balance-monitor cron + forecast por DCA plan | P0-5 |
| FR-06 | dca-execute real via /v5/order/create | P0-6 |
| FR-07 | wallet-balance sync real | P0-7 |
| FR-08 | Stripe checkout Pro $49.90 + Club $149.90 | P0-8 |
| FR-09 | Deploy 4 Edge Functions em produção | P0-9 |
| FR-10 | Transfer Spot ↔ Unified nativo | V2-MASTER-PLAN §1.3 |
| FR-11 | Feature flag testnet↔mainnet + cap $500 | CEO directive |

## Os 9 P1 (habilitam crescimento pós-launch)

- **FR-12** Rate limiting todas Edge Functions
- **FR-13** Error boundaries 100% das rotas
- **FR-14** Split appStore.ts em domain slices (9 slices)
- **FR-15** Lazy-load sampleData.ts (-50KB bundle)
- **FR-16** AI Portfolio Advisor (Claude via Edge Function)
- **FR-17** Smart Rebalancing (drift ≥ 5% → one-tap)
- **FR-18** Push notifications backend (FCM + APNs)
- **FR-19** Video lessons com conteúdo real (7 tracks)
- **FR-20** Observability stack (Sentry + PostHog)

## NFRs não-negociáveis

- **Security:** zero secrets no client (NFR-01); keys NUNCA com Withdraw scope (NFR-02); RLS ON em tudo (NFR-04)
- **Performance:** LCP < 2.5s mobile (NFR-05); p95 Edge Function < 500ms (NFR-06)
- **Reliability:** DCA success ≥ 98%; Transfer ≥ 99% (NFR-08)
- **Compliance:** zero auto-withdraw (NFR-09); disclaimer AI sempre visível (NFR-10)
- **UX:** WCAG 2.2 AA nas 5 rotas críticas (NFR-11); touch targets ≥ 44px (NFR-12)
- **Testing:** ≥ 80% coverage nos módulos que movem dinheiro (NFR-15)

## Top 5 Riscos

1. **R-04 (CRITICAL):** Bug em DCA executor causa dupla execução ou perda de fundos. → Mitigar com idempotency key, cap $500, testnet 2 semanas, kill-switch admin, cobertura 80%+, Playwright e2e mainnet-off em cada PR.
2. **R-05 (CRITICAL):** Vazamento de API keys de usuários. → Encryption dedicada (FR-03), zero Withdraw scope (CON-03), audit log, CodeRabbit obrigatório, bug bounty em soft-launch.
3. **R-01 (HIGH):** Compliance/KYC não mapeado para dinheiro real multi-jurisdição. → Revisão legal fintech pre-launch, delegação KYC ao Bybit (non-custodial), geo-block jurisdições proibidas, ToS claro.
4. **R-06 (HIGH):** Timeline 5-7 semanas apertado para 20 FRs. → Cortar P1s em semana 4 se P0 não fechou (push/video/rebalance movem p/ V2.1), paralelização via git worktrees, MVP sem AI Advisor aceitável.
5. **R-07 (HIGH):** Content bottleneck para 52 Academy lessons. → 18 já seedadas; Pro/Club tracks lançam com "Coming in N weeks"; CEO escreve Elite Mindset/ALTIS; contractor p/ Foundation/DCA; YouTube unlisted (zero custo hosting).

## Dependências críticas (ordem mínima)

```
FR-03 (encryption) → FR-04 (validation) → FR-07 (balance sync) → FR-06 (DCA exec)
                                                                     ↑
                                               FR-11 (flag + cap) ───┘
FR-09 (deploy) liberta todas as Edge Functions
FR-08 (Stripe) independente, paraleliza
```

## Fora de escopo V2 (explicitamente)

React Native mobile nativo (V3), social layer (V3), multi-exchange (V3), AI Agent Trading autônomo (V2.1), Copy Trading real (V3), Cashback engine/Marketplace/B2B API (V4), voice assistant, orderbook depth, TimescaleDB.

## Próximo passo (Spec Pipeline)

- **Phase 2 — Assess Complexity (@architect):** score 5-dim (scope/integration/infra/knowledge/risk). Preview: projeto é **COMPLEX** (≥16) — scope 5 (backend+frontend+edge+migrations+content), integration 5 (Bybit+Stripe+Supabase+Claude+FCM), infra 4 (nova encryption infra + cron + rate limit), knowledge 3, risk 5 (dinheiro real).
- **Phase 3 — Research (@analyst):** valida dependência de KYC/compliance (R-01) antes de write spec.
- **Phase 4 — Write Spec (@pm):** spec.md traceable.
- **Phase 5 — Critique (@qa):** verdict APPROVED / NEEDS_REVISION / BLOCKED.
- **Phase 6 — Plan (@architect):** implementation.yaml com 5-7 sprints.

---

*requirements.json: `/Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/docs/V2-REQUIREMENTS.json`*
*Total: 20 FRs | 15 NFRs | 10 CONs | 10 Riscos | Gerado por @pm (Morgan) AIOS Spec Pipeline Phase 1*
