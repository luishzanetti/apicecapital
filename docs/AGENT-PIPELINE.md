# Apice Capital — Agent Pipeline System

> Sistema estilo Trello/ClickUp onde agentes AIOS trabalham diariamente sob direcao do Jarvis.
> CEO aprova e corrige a rota. Agentes executam de forma independente.

---

## Como Funciona

```
┌─────────────────────────────────────────────────────────┐
│                    CEO (Luis)                            │
│         Aprova PRs, corrige rota, define prioridades    │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ JARVIS  │ (Orchestrator)
                    │ Master  │
                    └────┬────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
     │  @dev   │   │  @qa    │   │  @po    │
     │  Daily  │   │  Daily  │   │ Weekly  │
     └─────────┘   └─────────┘   └─────────┘
```

### Ciclo Diario
1. **Jarvis** analisa o estado do app (build, TODOs, bugs, metricas)
2. **Jarvis** prioriza tarefas para o dia
3. **Agentes** executam suas tarefas especializadas
4. **Jarvis** faz code review e verifica qualidade
5. **CEO** recebe resumo e aprova/corrige

### Ciclo Semanal
1. **@po** propoe features para a semana (baseado no roadmap V2)
2. **@architect** valida viabilidade tecnica
3. **CEO** aprova o sprint
4. **Agentes** executam durante a semana
5. **Sexta-feira**: retrospectiva e planejamento

---

## Tarefas Agendadas

### DIARIAS (executam toda manha)

#### 1. Daily Health Check (@dev)
```
Frequencia: Diaria, 9:00 AM
Prompt: Analyze the Apice Capital app and:
1. Run build (npx vite build) - report errors
2. Search for TODO/FIXME/HACK comments - prioritize
3. Check for unused imports or dead code
4. Verify no console.log in production code
5. Check bundle size (warn if >3MB)
6. Report: what broke, what needs attention, what improved
Output: Create /docs/daily-reports/YYYY-MM-DD.md
```

#### 2. Daily Code Quality (@qa)
```
Frequencia: Diaria, 10:00 AM
Prompt: Review the last 24h of commits in Apice Capital:
1. Check for security issues (hardcoded secrets, XSS, injection)
2. Check for TypeScript 'any' usage
3. Check for accessibility issues (missing aria labels, contrast)
4. Check for performance anti-patterns (unnecessary re-renders)
5. Verify all new components have error boundaries
Output: Create issues or fix directly if < 10 lines
```

### SEMANAIS (executam toda segunda)

#### 3. Weekly Sprint Planning (@po)
```
Frequencia: Segunda, 8:00 AM
Prompt: Review V2-ROADMAP.md and current app state:
1. What was completed last week?
2. What are the top 5 priorities for this week?
3. Any blockers or dependencies?
4. Update the roadmap with progress
Output: Create /docs/sprints/YYYY-WXX-plan.md
```

#### 4. Weekly Architecture Review (@architect)
```
Frequencia: Segunda, 9:00 AM
Prompt: Review Apice Capital architecture:
1. Bundle size analysis (compare with last week)
2. Component complexity audit (files > 500 lines)
3. Dependency health (outdated packages, vulnerabilities)
4. Database schema review (missing indexes, RLS gaps)
5. Edge Function performance review
Output: Create /docs/architecture/YYYY-WXX-review.md
```

#### 5. Weekly UX Audit (@apple-ux)
```
Frequencia: Quarta, 9:00 AM
Prompt: Audit UX quality of Apice Capital:
1. Check all pages for visual consistency
2. Verify mobile responsiveness (375px, 768px, 1440px)
3. Check loading states, empty states, error states
4. Verify touch targets (44px minimum)
5. Check typography hierarchy
6. Test critical user flows end-to-end
Output: Create /docs/ux-audits/YYYY-WXX-audit.md
```

---

## Board de Tarefas (Pipeline)

### Colunas

| Backlog | To Do (Sprint) | In Progress | Review | Done |
|---------|---------------|-------------|--------|------|
| Ideas do roadmap V2 | Tarefas desta semana | Agente executando | CEO revisando | Merged |

### Labels

| Label | Significado | Cor |
|-------|------------|-----|
| `security` | Vulnerabilidade | Vermelho |
| `bug` | Algo quebrado | Laranja |
| `feature` | Feature nova | Azul |
| `polish` | UX/visual | Roxo |
| `perf` | Performance | Verde |
| `infra` | CI/CD, deploy | Cinza |
| `docs` | Documentacao | Branco |

### Prioridades

| Prioridade | Significado | SLA |
|-----------|------------|-----|
| P0 - Critical | Bloqueia lancamento | Mesmo dia |
| P1 - High | Afeta UX principal | 2 dias |
| P2 - Medium | Melhoria importante | 1 semana |
| P3 - Low | Nice-to-have | Sprint seguinte |

---

## Backlog Atual (V1.5 → V2)

### P0 - Critical
- [ ] PWA icons (192px, 512px) — design needed
- [ ] Bybit affiliate code real — business decision
- [ ] Stripe integration — payments reais
- [ ] Deploy Edge Functions — supabase CLI

### P1 - High (V2 Phase 1)
- [ ] WebSocket live prices — replace polling
- [ ] OHLCV data pipeline — price history storage
- [ ] Portfolio daily snapshots — real performance tracking
- [ ] Order execution logging — every trade recorded
- [ ] Sentry integration — error tracking
- [ ] PostHog integration — product analytics
- [ ] GitHub Actions CI/CD — automated deploys

### P2 - Medium (V2 Phase 2)
- [ ] AI Agent Trading — Claude executes trades
- [ ] Copy Trading execution — real orders
- [ ] Daily AI Briefing — personalized morning report
- [ ] Performance analytics — Sharpe, drawdown, attribution
- [ ] Mobile app (React Native) — iOS + Android

### P3 - Low (V2 Phase 3-4)
- [ ] Multi-exchange support — Binance, Coinbase
- [ ] Social layer — profiles, leaderboards
- [ ] Cashback engine — Stripe card integration
- [ ] Strategy marketplace — creator economy
- [ ] B2B API — white-label DCA engine

---

## Como Configurar

### Opcao 1: Cloud Scheduled Tasks (Recomendado)

Acesse `claude.ai/code/scheduled` e crie:

**Task: Daily Health Check**
- Repo: luishzanetti/apicecapital
- Frequency: Daily (9:00 AM)
- Prompt: (usar prompt acima)

**Task: Weekly Sprint Planning**
- Repo: luishzanetti/apicecapital
- Frequency: Weekly (Monday 8:00 AM)
- Prompt: (usar prompt acima)

### Opcao 2: Desktop Scheduled Tasks

No Claude Code desktop app:
1. Sidebar → Schedule → New Local Task
2. Configure nome, prompt, frequencia
3. Definir permission mode (automatic para daily checks)

### Opcao 3: CLI com /schedule

```bash
# Criar tarefa diaria
/schedule create "Daily Health Check" --cron "0 9 * * *" --prompt "..."

# Listar tarefas
/schedule list

# Executar manualmente
/schedule run <task-id>

# Atualizar
/schedule update <task-id>
```

---

## Hooks Automaticos

Adicionar em `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd /Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital && npx tsc --noEmit 2>&1 | head -5"
          }
        ]
      }
    ]
  }
}
```

Isso roda TypeScript check automaticamente apos cada edit — pega erros antes de commitar.

---

## Metricas do Pipeline

| Metrica | Target | Como Medir |
|---------|--------|------------|
| Tasks completed/week | 10+ | Count completed items |
| Build success rate | 100% | Daily health check |
| Bug fix time (P0) | < 4h | Time from report to fix |
| Feature delivery | 2-3/week | Count new features |
| Code quality score | > 85% | Weekly QA audit |
| Bundle size | < 2.5MB | Daily check |
| Test coverage | > 80% | Weekly report |

---

## Template: Sprint Report

```markdown
# Sprint Report — Week XX

## Completed
- [x] Feature: description
- [x] Bug fix: description
- [x] Polish: description

## In Progress
- [ ] Feature: description (X% done)

## Blocked
- [ ] Feature: blocked by (reason)

## Metrics
- Build: PASS/FAIL
- Bundle: X.XX MB
- Tests: XX% coverage
- Bugs fixed: X
- Features shipped: X

## Next Week Priorities
1. ...
2. ...
3. ...
```
