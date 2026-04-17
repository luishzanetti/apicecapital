# Apice Capital V2 — Master Plan

> Plano unificado das analises de @bybit-fintech, @po, @apple-ux + @design-system, @architect + @dev.
> Objetivo final: **escala e alto rendimento** com educacao como driver principal de conversao.
> Data: 2026-04-11 | Status: AGUARDANDO APROVACAO DO CEO

---

## Os 4 Pilares

```
┌─────────────────────────────────────────────────────────┐
│  PILAR 1: BUGS + FUNDAMENTOS OPERACIONAIS               │
│  → ALTIS config loop (race condition)                   │
│  → Fundos insuficientes (avisos proativos)              │
│  → Transferencia Spot → Unified nativa                  │
├─────────────────────────────────────────────────────────┤
│  PILAR 2: APICE ACADEMY (DRIVER PRINCIPAL)              │
│  → 7 trilhas, 52 licoes, 208 min                        │
│  → Funil: ad → free → pro → club                        │
│  → Content de elite investidor (ideologia CEO)          │
├─────────────────────────────────────────────────────────┤
│  PILAR 3: UX SILICON VALLEY-GRADE                       │
│  → Learning Map estilo Duolingo                         │
│  → Lesson reader Masterclass                            │
│  → Celebracoes Apple-grade (level up, badges)           │
│  → Streaks com fogo progressivo                         │
├─────────────────────────────────────────────────────────┤
│  PILAR 4: ARQUITETURA DE ESCALA                         │
│  → Nova migration 006_v2_foundation.sql                 │
│  → 4 Edge Functions (transfer, balance, education, chall)│
│  → 4 novos slices no store (education, balance, transfer, altis)│
│  → React Query + Zustand persist v3                     │
└─────────────────────────────────────────────────────────┘
```

---

## PILAR 1 — Bugs + Fundamentos Operacionais (Semana 1-2)

### 1.1 Fix ALTIS Config Loop (P0 - 1 dia)

**Root cause identificado por @bybit + @dev:**
- `useLeveragedTrading.ts` usa `useState + localStorage` com 3 race conditions
- `setTimeout(() => navigate, 300)` em `AiTradeSetup.tsx` mascara o problema
- `fetchStrategies` sobrescreve estado fresco com Supabase stale

**Fix:**
1. Criar `src/store/slices/altisSlice.ts` — bot state dentro do Zustand+persist
2. Refatorar `useLeveragedTrading` para consumir do store (remove useState interno)
3. Remover setTimeout em `AiTradeSetup.tsx` linha 120 — navegar sync
4. Hardening: `AiTradeDashboard` usa selector `selectIsAltisSetupComplete`
5. Migration one-time: lê `altis-bots` localStorage antigo e seeda no store

**Tempo:** 4-6h | **Impact:** User abre dashboard e ve direto

### 1.2 Sistema de Avisos de Fundos (P1 - 3 dias)

**Design por @bybit-fintech:**

**Forecast por plano DCA:**
```
executionsPerMonth = frequency (daily:30, weekly:4, biweekly:2, monthly:1)
monthlyRequired    = amount * executionsPerMonth
remainingMonths    = available / monthlyRequired

GREEN    rm >= 3.0     "All good" (no alert)
YELLOW   1.5 <= rm < 3 "2-3 months of funds remaining"
RED      0.5 <= rm <1.5 "Top up $X before [date]"
BLOCKED  rm < 0.5       Auto-pause plan + big alert
```

**Onde aparece:**
- Home: banner RED/BLOCKED com CTA "Add funds"
- DCA Plan card: status badge (green/yellow/red)
- Push notification: dia antes da execucao se YELLOW
- Email: se RED por 48h+

**Edge Function:** `balance-monitor/index.ts`
- Cron: daily 08:00 UTC
- On-demand: `POST { action: 'refresh' }` do client
- Upsert `fund_alerts` table com snooze de 72h

**Componentes:**
- `BalanceHealthBadge.tsx` — pill colorido
- `InsufficientFundsAlert.tsx` — banner full-width
- `FundForecast.tsx` — "X executions remaining" card
- `LowFundsCTA.tsx` — "Add Funds" com amount suggestion

### 1.3 Transfer Spot → Unified Nativa (P1 - 4 dias)

**Design por @bybit-fintech:**

**Edge Function:** `bybit-transfer/index.ts`
- Endpoint Bybit: `POST /v5/asset/transfer/inter-transfer`
- Params: fromAccountType, toAccountType, coin, amount, transferId (uuid)
- Permissoes necessarias: Transfer (capability check no primeiro uso)
- Idempotency key para evitar double-transfer

**Fluxo:**
1. User clica "Transfer" (Portfolio, Settings, ou banner Home)
2. Modal abre: seleciona source (SPOT), dest (UNIFIED), coin, amount
3. Review screen mostra: fees (Bybit cobra 0 inter-conta), tempo (~instant)
4. User confirma com 2FA-like (se enabled)
5. Edge Function executa com retry logic
6. Success screen com transfer ID + link para historico

**Error handling (15+ codigos Bybit):**
- `170222` Invalid transfer amount → "Minimum $1"
- `170223` Insufficient balance → "Available: $X"
- `10005` Permission denied → "Re-auth API key with Transfer scope"
- `10006` Rate limit → auto-retry com backoff

**Componentes:**
- `AccountTransferModal.tsx` (main)
- `TransferFromSelector.tsx` + `TransferToSelector.tsx`
- `TransferAmountInput.tsx` (com max/50%/25% quick-fills)
- `TransferConfirmStep.tsx`
- `TransferSuccessScreen.tsx`
- `TransferHistoryList.tsx`
- `QuickTransferButton.tsx` (inline em Portfolio/Settings)

**Tabela DB:**
```sql
create table public.account_transfers (
  id uuid primary key,
  user_id uuid references profiles,
  from_account text, to_account text,
  coin text, amount numeric,
  status text, bybit_txn_id text,
  error_code text, error_message text,
  initiated_from text,
  created_at timestamptz, completed_at timestamptz
);
```

---

## PILAR 2 — Apice Academy (Semana 3-6)

### 2.1 Estrutura das 7 Trilhas

| Trilha | Tier | Licoes | Min | Proposito |
|--------|------|--------|-----|-----------|
| 1. Foundation | Free | 8 | 28 | Hook — mata medo, vende worldview Apice |
| 2. DCA Mastery | Free | 10 | 40 | Ativacao — primeiro DCA real (conversao!) |
| 3. Portfolio Architecture | Pro | 8 | 36 | Depth — justifica $49/mo |
| 4. Market Intelligence | Pro | 7 | 32 | Edge — morning ritual |
| 5. ALTIS Trading | Club | 8 | 44 | Elite — content premium, $149/mo |
| 6. Elite Investor Mindset | Club | 7 | 32 | Ideology — a voz do CEO |
| 7. Capital Game | Club | 4+ | 20+ | Meta — quarterly, retention infinita |

**Total: 52 licoes, ~232 minutos de conteudo**

### 2.2 Funil de Conversao (Education → Revenue)

```
AD "Earn extra income with Bitcoin DCA"
    ↓ 35% convert
SIGNUP + Quiz (3 perguntas, 45s)
    ↓ Auto-enroll Foundation
FOUNDATION (8 licoes, 28min)
    ├── L5: Bybit signup link (commission)
    ├── L7: First $10 buy (ACTIVATION)
    └── L8: Apice Framework reveal
    ↓ 60% complete
DCA MASTERY (10 licoes, 40min)
    ├── L3: CREATE FIRST DCA PLAN ⚡ XP celebration
    ├── L8: LOCKED → Pro trial modal
    ↓ 12% → Pro trial → 35% → Pro paid
PRO ($49.90/mo)
    ├── Portfolio Architecture full
    ├── Market Intelligence full
    └── Level 4 → ALTIS preview
    ↓ 15% → Club (90-day)
CLUB ($149.90/mo)
    ├── ALTIS full
    ├── Elite Mindset
    └── Capital Game (retention infinita)
```

**Projecao por cohort de 10K signups (Year 1):**
- Pro paid: 250 × $49.90 × 5.5mo avg = **$68,000**
- Club paid: 38 × $149.90 × 11mo = **$62,000**
- Bybit referrals: 4,000 × $26 avg = **$104,000**
- **Total Year 1: ~$234,000 por cohort**

**Year 2+ LTV compounds:**
- Pro LTV: $220+
- Club LTV: $2,100+
- Challenge 6 (30-day pledge): 25% lifetime discount
- Challenge 10 (Elite Challenge): free lifetime Club

### 2.3 Sistema de Progressao (6 Niveis)

| Lvl | Title | XP Req | Unlocks |
|-----|-------|--------|---------|
| 1 | Novice | 0 | Foundation |
| 2 | Apprentice | 300 | DCA Mastery full |
| 3 | Navigator | 800 | Portfolio Architecture preview |
| 4 | Strategist | 1,800 | ALTIS preview (Club gate) |
| 5 | Master | 3,500 | Elite Mindset |
| 6 | **Elite** ✦ | 6,000 | Special theme + leaderboard + Capital Game |

**XP Rules:**
- Licao easy: 25 | medium: 50 | hard: 75-100 | ceremony: 100-250
- Quiz bonus: +30 (se 80%+)
- Streak multiplier: 3d 1.2x, 7d 1.5x, 30d 2x
- Weekly challenge: 500-1000
- Track completion: +250-500 + badge

### 2.4 Sistema de Desafios (10 designs)

| # | Desafio | Reward | Dificuldade |
|---|---------|--------|-------------|
| 1 | **DCA Discipline Week** — 3 execucoes em 7d | 500 XP + badge | Easy |
| 2 | **Market Reader** — F&G 7 dias | 400 XP | Easy |
| 3 | **Portfolio Architect** — criar custom portfolio | 750 XP + Architect badge | Medium |
| 4 | **Rebalance Master** — executar se drift >10% | 600 XP | Medium |
| 5 | **Study Streak** — 1 licao/dia x 7 dias | 500 XP + 1.5x multiplier | Easy |
| 6 | **30-Day Pledge** — 30 dias consecutivos | 2000 XP + **25% Pro desconto vitalicio** | Hard |
| 7 | **Crash Responder** — market <-15%, nao pausa | 800 XP + Diamond Hand | Very Hard |
| 8 | **Knowledge Quest** — 100% em 3 quizzes | 600 XP + Scholar | Medium |
| 9 | **Referral Challenge** — 3 amigos completam Foundation L3 | 1000 XP + **1 mes Pro free** | Medium |
| 10 | **Elite Challenge** — todas trilhas + 30-day streak | 5000 XP + **Club vitalicio free** | Legendary |

---

## PILAR 3 — UX Silicon Valley-Grade (Semana 3-5)

### 3.1 Learning Map (Duolingo-style)

**Substitui o current accordion list em Learn.tsx**

- Visual PATH vertical com nodes em zig-zag
- Cada trilha e um "World" com cor propria (Foundations=Azure, DCA=Emerald, etc)
- Nodes:
  - **Locked**: cinza, lock icon, 30% opacity
  - **Available**: gradient, glow pulsante, "START" tooltip
  - **In progress**: ½ ring
  - **Completed**: verde check + 1-3 stars (based on quiz score)
  - **Boss Challenge**: hexagono dourado (fim de world)
- Path SVG desenha conforme progresso (path-draw animation)
- Auto camera-track para o node ativo on mount

**Arquivo:** `src/components/academy/LearningMap.tsx`

### 3.2 Lesson Player (Masterclass-style)

**Substitui LessonDetail.tsx (rewrite)**

Anatomia:
1. **Hero** (40-50vh) — gradient world + illustration + titulo serif display
2. **Video** 16:9 com controles minimais + playback speed + captions + PiP
3. **Reader** serif typography (Literata) — 17px, 1.72 line-height, 38ch max-width
4. **Content blocks** — paragraph/lead/highlight/stat/quote/diagram/callout/code
5. **Interactive diagrams** — componentes embedados (CompoundingCalculator, AllocationPie)
6. **Quiz** — uma questao por vez, celebration correct, explanation wrong
7. **Apply It** — deep-link para a ferramenta do app (ex: DCA Simulator)
8. **Next Lesson Card** com preview thumbnail

**Scroll progress bar** sticky no topo (gradient fill)
**Drop cap** na primeira paragraph (font-display 4rem)

**Arquivo:** `src/components/academy/LessonPlayer.tsx`

### 3.3 Celebrations (Apple-grade)

**Level Up Modal (5s sequence):**
```
t=0.0  Backdrop fade-in + haptic heavy
t=0.2  Radial light burst (scale 0→3)
t=0.4  "LEVEL UP" gradient text scales in
t=0.9  New level number crashes from above (spring bounce)
t=1.4  Title reveals with underline draw
t=1.8  Unlocks list staggered fade-in
t=2.6  Confetti burst (60 particles)
t=3.2  Share + Continue buttons
```

**Badge Earned Modal:**
- 3D-style badge render com rarity frame
- Shimmer sweep em legendary+
- Haptic medium x2 + unlock.mp3
- Orbiting particles em mythic

**Streak Flame (progressive):**
- 0: cold ember
- 1-6: orange flame
- 7-29: deeper orange + sparks
- 30-99: **blue flame** premium
- 100+: **purple flame** aura
- 365+: **rainbow flame** with orbiting

### 3.4 Design Tokens Adicionados

```css
/* World gradients */
--world-foundations: 212 100% 62%;  /* Azure */
--world-dca:         152 72% 52%;   /* Emerald */
--world-portfolio:   265 90% 68%;   /* Violet */
--world-automation:  190 95% 60%;   /* Cyan */
--world-altis:       348 90% 62%;   /* Crimson */
--world-mindset:     38 92% 58%;    /* Gold */

/* Badge rarities */
--rarity-common:     220 8% 60%;
--rarity-rare:       212 100% 62%;
--rarity-epic:       265 90% 68%;
--rarity-legendary:  38 92% 58%;
--rarity-mythic:     348 90% 62%;

/* Flame tiers */
--flame-cold:   210 60% 55%;
--flame-warm:   38 92% 58%;
--flame-hot:    18 95% 55%;
--flame-blue:   212 100% 62%;
--flame-purple: 265 90% 68%;

/* Reader typography */
--reader-body:     1.0625rem;    /* 17px */
--reader-lh:       1.72;
--reader-measure:  38ch;
```

---

## PILAR 4 — Arquitetura de Escala (Semana 1-6, fundacional)

### 4.1 Migration 006_v2_foundation.sql

**Novas tabelas:**

**Education:**
- `learning_tracks` (id, slug, tier, order, icon, color_theme)
- `lessons` (track_id, video_url, content_blocks jsonb, quiz jsonb, xp, required_tier)
- `lesson_progress` (user_id, lesson_id, status, score, completed_at)
- `challenges` (rules_json, reward_xp, badge_id, active_from/to)
- `challenge_progress` (user_id, challenge_id, progress_json)
- `badges` (rarity, unlock_condition_json)
- `user_badges` (user_id, badge_id, earned_at)
- `user_xp` (total_xp, level, title, streak, longest_streak)

**Balance monitoring:**
- `balance_snapshots` (account_type, total_usd, available_usd, holdings_json)
- `fund_alerts` (severity, code, context_json, triggered_at, resolved_at)

**Transfers:**
- `account_transfers` (from/to_account, coin, amount, status, bybit_txn_id, error_code)

**Todas com RLS + indexes + triggers auto-init**

### 4.2 Edge Functions (4 novas)

| Function | Trigger | Action |
|----------|---------|--------|
| `bybit-transfer` | HTTP | Execute Spot→Unified transfer, audit trail |
| `balance-monitor` | Cron 08:00 UTC + HTTP | Snapshot + forecast + alert |
| `education-progress` | HTTP | Complete lesson, award XP, update level, check badges |
| `challenge-engine` | Cron + internal | Evaluate rules, award badges |

### 4.3 Store Slices (4 novas)

- `altisSlice.ts` — bot state (fix ALTIS bug)
- `educationSlice.ts` — tracks, lessons, progress, XP, streak, badges
- `balanceSlice.ts` — balances, fund alerts
- `transferSlice.ts` — transfer history, active transfer

**Persist version bump: 2 → 3** com migration helper

### 4.4 Hooks (5 novos)

- `useBalanceHealth(planId)` → health status per plan
- `useEducationProgress()` → user's learning state
- `useChallenge(challengeId)` → single challenge progress
- `useAccountTransfer()` → transfer mutation
- `useLearningMap()` → derived data for visual path

### 4.5 Componentes (25+ novos)

Organizados em:
- `src/components/education/` (15 files)
- `src/components/balance/` (5 files)
- `src/components/transfer/` (8 files)

---

## CRONOGRAMA EXECUTIVO (6 Semanas)

### Semana 1 — Foundation
- [ ] Migration 006 aplicada (staging)
- [ ] Seed: 2 tracks + 10 lessons + 8 badges
- [ ] Edge Functions scaffolded (4)
- [ ] **FIX ALTIS BUG** (altisSlice + gate hardening)
- [ ] balance-monitor cron setup

### Semana 2 — Transfer System
- [ ] bybit-transfer full implementation
- [ ] transferSlice + useAccountTransfer
- [ ] AccountTransferModal + sub-components
- [ ] Mount em Portfolio + Settings + Home
- [ ] Playwright E2E test

### Semanas 3-4 — Education Foundation
- [ ] educationSlice + useEducationProgress + useLearningMap
- [ ] LearningMap + LessonNode (visual path)
- [ ] LessonPlayer + ContentBlocks + QuizEngine
- [ ] education-progress edge function
- [ ] Rewrite /learn page
- [ ] 2 tracks completas (Foundation + DCA Mastery)

### Semana 5 — Gamification
- [ ] challenge-engine
- [ ] BadgeEarnedModal, LevelUpModal, StreakFlame, XPCounter
- [ ] 3 seed challenges
- [ ] LearnHomeWidget
- [ ] Push streak-break warning

### Semana 6 — Polish + Launch
- [ ] PostHog analytics integration
- [ ] Content para 3 tracks extras
- [ ] A/B test framework
- [ ] Full QA gate (7 checks)
- [ ] CodeRabbit scan
- [ ] Production deploy

---

## DELIVERABLES POR FASE

### Fase 1 (Semanas 1-2) — Operations Fixed
- ALTIS bug zerado
- Usuario transfere entre contas nativamente
- Sistema avisa antes de faltar dinheiro

### Fase 2 (Semanas 3-4) — Academy MVP
- 2 trilhas completas jogaveis
- Learning Map funcionando
- XP + level + streak
- Conversion triggers ativos

### Fase 3 (Semanas 5-6) — Full Experience
- Gamification completo
- Push notifications
- 5+ tracks com conteudo
- Launch ready

---

## METRICAS DE SUCESSO

| Metrica | Semana 6 | Mes 3 | Mes 6 |
|---------|----------|-------|-------|
| Lesson completion rate | 45% | 60% | 75% |
| Free → Pro conversion | 1.8% | 2.4% | 3.0% |
| Pro → Club conversion (90d) | 8% | 12% | 15% |
| 7-day streak rate | 15% | 22% | 30% |
| Challenge completion | 12% | 18% | 25% |
| Transfer success rate | 99% | 99.5% | 99.9% |
| Fund alert dismiss→resolve | 60% | 75% | 85% |
| ALTIS dashboard load success | 99% | 99.9% | 99.99% |

---

## RISCOS PRINCIPAIS

| # | Risco | Mitigacao |
|---|-------|-----------|
| 1 | Bybit API key sem Transfer scope | Capability check na primeira vez, deep-link para re-auth |
| 2 | Content creation bottleneck (52 licoes) | Leverage sampleData.ts (30 ja escritas), contractor writer para video scripts |
| 3 | Video hosting costs | Start text-only, video via YouTube unlisted, Mux apenas quando CAC validado |
| 4 | "Silicon Valley scope creep" | Strict Phase 3 scope, NO social/AI tutor ate Phase 6+ |
| 5 | RLS leak em lesson_progress | Integration test 2 users no migration, @qa blocks merge sem ele |
| 6 | Migration localStorage → DB | Idempotent migration em educationSlice hydrate |

---

## DECISOES QUE O CEO PRECISA TOMAR

1. **Pricing**: Pro $49.90, Club $149.90 (matches projecao) — CONFIRMAR
2. **Apice Code Manifesto**: Elite Mindset L7 precisa de manifesto de 1 pagina na voz do CEO — ESCREVER
3. **ALTIS risk discipline**: Lock 30 dias se user quebrar regra de 2% risk — ENFORCE ou NAO?
4. **Founding Member 25% vitalicio**: Challenge 6 reward — APROVAR?
5. **Elite Challenge (Challenge 10)**: Club vitalicio free para quem completar tudo — APROVAR?
6. **Video hosting**: YouTube embed inicial, Mux em Q2? — OK?
7. **Content ownership**: CEO escreve Elite Mindset + ALTIS narrative; contractor escreve Foundation/DCA — OK?

---

## PROXIMOS PASSOS APOS APROVACAO

```
CEO aprova
    ↓
@sm cria 20+ stories (organizadas em 6 sprints)
    ↓
Semana 1: Fix ALTIS + migrations + scaffolds
    ↓
Semana 2: Transfer system ship
    ↓
Semanas 3-4: Academy MVP
    ↓
Semana 5: Gamification
    ↓
Semana 6: Launch polish + CodeRabbit + PostHog
    ↓
V2 LAUNCH → comeca ads → cohort analysis
```

---

**Este plano unifica 4 analises de agentes especializados em um blueprint executavel.**
**Tempo total: 6 semanas. Equipe: 3-4 engenheiros. Investimento: ~$80K-120K.**
**ROI projetado: Year 1 cohort $234K por 10K signups. Year 2+ compounds para $450K+ por cohort.**

Aguardando aprovacao do CEO para comecar execucao.
