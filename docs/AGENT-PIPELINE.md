# Apice Capital — Intelligent Agent Pipeline v2

> Sistema de evolucao continua onde agentes AIOS colaboram em equipe.
> Cada feature passa por um pipeline completo: Plan → Build → Review → Polish → Ship.
> O sistema aprende e melhora com o tempo.

---

## Filosofia

**Nenhuma linha de codigo entra no app sem passar por pelo menos 3 agentes.**

```
Ideia → @po planeja → @architect valida → @dev implementa → @qa revisa
     → @apple-ux lapida → @bybit valida API → @qa final → CEO aprova → Ship
```

Isso garante que cada feature e:
- **Bem planejada** (nao so codigo jogado)
- **Tecnicamente solida** (arquitetura validada)
- **Bonita e usavel** (UX revisada)
- **Segura e funcional** (QA testado)
- **Lapidada** (multiplas passadas de melhoria)

---

## Os 8 Agentes

| Agente | Papel | Especialidade |
|--------|-------|--------------|
| **@jarvis** | Orchestrator Master | Coordena tudo, prioriza, decide rota |
| **@po** | Product Owner | Define O QUE construir e POR QUE |
| **@architect** | System Architect | Define COMO construir, valida viabilidade |
| **@dev** | Developer | IMPLEMENTA o codigo |
| **@qa** | Quality Assurance | TESTA e encontra bugs |
| **@apple-ux** | UX Designer | LAPIDA visual, usabilidade, acessibilidade |
| **@bybit-fintech** | Fintech Expert | Valida integracoes exchange, API, seguranca |
| **@design-system** | Visual Design | Consistencia visual, tokens, componentes |

---

## O Pipeline (6 Fases)

Cada feature, melhoria, ou bug fix passa por TODAS as fases:

### Fase 1: PLAN (@po + @architect)

```
Input: Ideia ou problema identificado
```

**@po analisa:**
- Qual o valor de negocio?
- Quem e o usuario afetado?
- Qual a prioridade (P0-P3)?
- Como medir sucesso?
- Dependencias com outras features?

**@architect valida:**
- E viavel tecnicamente?
- Qual o impacto na arquitetura?
- Quais arquivos serao modificados?
- Existe algo reutilizavel?
- Estimativa de esforco?

**Output:** Feature Brief (markdown com scope, criterios de aceite, arquivos)

---

### Fase 2: BUILD (@dev)

```
Input: Feature Brief aprovado
```

**@dev implementa:**
- Segue o brief exatamente
- Usa padroes existentes do codebase
- Cria/modifica apenas os arquivos necessarios
- Todo texto em ingles
- Sem console.log em producao
- Sem `any` no TypeScript
- Build deve passar (npx vite build)

**Output:** Codigo implementado + commit local (NAO push)

---

### Fase 3: REVIEW (@qa + @bybit-fintech)

```
Input: Codigo implementado
```

**@qa verifica:**
- Build passa sem erros?
- Funcionalidade funciona como descrito no brief?
- Edge cases tratados? (empty state, error state, loading state)
- Seguranca: sem secrets expostos, inputs validados
- Performance: sem re-renders desnecessarios
- Acessibilidade: aria-labels, contraste, keyboard nav

**@bybit-fintech verifica (se envolve exchange):**
- API calls corretos? Endpoints certos?
- Rate limits respeitados?
- Error handling para todos os codigos de erro Bybit?
- Dados sensíveis apenas server-side (Edge Functions)?
- Retry logic implementada?

**Output:** Lista de issues (PASS / NEEDS_FIX / BLOCK)

---

### Fase 4: POLISH (@apple-ux + @design-system)

```
Input: Codigo que passou na review
```

**@apple-ux lapida:**
- Typography: hierarquia clara, tamanhos corretos (min 12px)
- Spacing: ritmo consistente (8px grid)
- Touch targets: minimo 44px
- Animations: suaves, nao bloqueiam interacao
- Information hierarchy: o que o usuario ve primeiro?
- Mobile: funciona bem em 375px?
- Micro-interacoes: feedback ao clicar, hover states

**@design-system valida:**
- Cores: usa tokens CSS (nao hex hardcoded)
- Cards: segue anatomia padrao (header, body, footer)
- Charts: segue style guide (gradients, tooltips, axis)
- Glass-morphism: aplicado consistentemente
- Dark theme: contraste adequado

**Output:** Lista de refinamentos aplicados

---

### Fase 5: FINAL CHECK (@qa)

```
Input: Codigo polido
```

**@qa faz verificacao final:**
- Build passa?
- Tudo que foi pedido no brief foi entregue?
- Nenhum regression em outras paginas?
- Bundle size nao aumentou mais de 10%?
- Pronto para producao?

**Output:** APPROVED ou NEEDS_REVISION (volta para fase adequada)

---

### Fase 6: SHIP (@jarvis)

```
Input: Codigo aprovado
```

**@jarvis finaliza:**
- Commit com mensagem clara (conventional commits)
- Tag de versao se necessario
- Atualiza docs/changelog
- Notifica CEO para push

**Output:** Commit pronto para CEO aprovar e dar push

---

## Ciclo de Evolucao Diario

```
06:00  @jarvis    Analisa estado do app, prioriza tarefas do dia
07:00  @po        Refina briefs para features do dia
08:00  @architect Valida viabilidade tecnica
09:00  @dev       Comeca implementacao (feature 1)
10:00  @qa        Review do trabalho da manha
11:00  @apple-ux  Polish do que passou na review
12:00  @dev       Implementa feature 2
13:00  @qa        Review feature 2
14:00  @design    Consistencia visual global
15:00  @qa        Final check de tudo
16:00  @jarvis    Commit, report, notifica CEO

CEO chega → ve relatorio → aprova push ou corrige rota
```

---

## Ciclo Semanal

### Segunda — Sprint Planning
```
@po       → Propoe 5-7 features para a semana (baseado no V2 roadmap)
@architect → Valida viabilidade de cada uma
@jarvis   → Prioriza e distribui
CEO       → Aprova o sprint
```

### Terca a Quinta — Execucao
```
Pipeline completo para cada feature:
Plan → Build → Review → Polish → Final → Ship
```

### Sexta — Retrospectiva
```
@jarvis   → Gera relatorio da semana
@qa       → Metricas de qualidade
@po       → Avalia progresso vs roadmap
CEO       → Ajusta prioridades para proxima semana
```

---

## Sistema de Aprendizado

O pipeline fica mais inteligente com o tempo:

### 1. Feedback Loop

Cada task completada gera um registro:
```markdown
## Task: [nome]
- Tempo estimado vs real
- Quantas revisoes foram necessarias
- Quais issues @qa encontrou
- Quais issues @apple-ux encontrou
- O que o CEO corrigiu
```

### 2. Pattern Library

Padroes que funcionam sao documentados:
```
docs/patterns/
├── card-anatomy.md          (como fazer cards)
├── empty-state-pattern.md   (como fazer empty states)
├── loading-pattern.md       (como fazer loading)
├── error-handling.md        (como tratar erros)
├── form-validation.md       (como validar forms)
├── chart-design.md          (como fazer graficos)
├── mobile-first.md          (como fazer responsivo)
└── api-integration.md       (como integrar APIs)
```

### 3. Quality Gates Automaticos

Hooks que rodam automaticamente:
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

### 4. Scoreboard

Cada agente tem um score baseado na qualidade:
```
@dev   — % de builds que passam na primeira tentativa
@qa    — % de bugs encontrados ANTES do CEO
@apple — % de issues de UX corrigidos no primeiro polish
@po    — % de features que nao precisaram re-scope
```

---

## Backlog Organizado por Pipeline

### READY TO PLAN (esperando @po + @architect)

| # | Feature | Prioridade | Origem |
|---|---------|-----------|--------|
| 1 | WebSocket live prices | P1 | V2 Roadmap Phase 1 |
| 2 | Stripe payment integration | P0 | Launch blocker |
| 3 | OHLCV data pipeline | P1 | V2 Roadmap Phase 1 |
| 4 | Portfolio daily snapshots | P1 | V2 Roadmap Phase 1 |
| 5 | Sentry error tracking | P1 | V2 Roadmap Phase 1 |
| 6 | PostHog analytics | P1 | V2 Roadmap Phase 1 |
| 7 | GitHub Actions CI/CD | P1 | V2 Roadmap Phase 1 |
| 8 | AI Agent Trading | P2 | V2 Roadmap Phase 2 |
| 9 | Copy Trading execution | P2 | V2 Roadmap Phase 2 |
| 10 | Daily AI Briefing | P2 | V2 Roadmap Phase 2 |

### IN PIPELINE (passando pelas fases)

| # | Feature | Fase Atual | Agente Ativo |
|---|---------|-----------|-------------|
| — | (nenhuma agora) | — | — |

### SHIPPED (completadas)

| # | Feature | Data | Commits |
|---|---------|------|---------|
| 1 | Dashboard redesign | Apr 10 | a163ac0..793824b |
| 2 | DCA Planner rewrite | Apr 10 | f8d2f35 |
| 3 | QuickDCA activation | Apr 10 | f8d2f35 |
| 4 | Explosive List | Apr 10 | f8d2f35 |
| 5 | Referral Dashboard | Apr 10 | 4bd986b |
| 6 | Academy gating | Apr 10 | 4bd986b |
| 7 | Support page rewrite | Apr 11 | c44d36d |
| 8 | Sparklines coin cards | Apr 11 | c44d36d |
| 9 | Auth forgot password | Apr 11 | 1f1f7a6 |

---

## Todas as Paginas — Status do Pipeline

Cada pagina existente tambem passa pelo pipeline de revisao:

| Pagina | Plan | Build | Review | Polish | Final | Status |
|--------|------|-------|--------|--------|-------|--------|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ | SHIPPED |
| Portfolio | ✅ | ✅ | ✅ | ✅ | ⬜ | POLISH |
| DCA Planner | ✅ | ✅ | ✅ | ✅ | ✅ | SHIPPED |
| Quick DCA | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Analytics | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Explosive List | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Strategies | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Learn | ✅ | ✅ | ✅ | ✅ | ⬜ | POLISH |
| Lesson Detail | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Settings | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Upgrade | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Referrals | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Support | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Asset Detail | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Cashback Dashboard | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Cashback Machine | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| AI Trade Dashboard | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| AI Trade Setup | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Automations | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Auth | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Quiz | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Profile Result | ✅ | ✅ | ✅ | ⬜ | ⬜ | REVIEW |
| Onboarding | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Welcome | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Splash | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |
| Portfolio Detail | ✅ | ✅ | ⬜ | ⬜ | ⬜ | BUILD |

**Meta: todas as paginas em SHIPPED antes do lancamento.**

---

## Prompt Template para Executar Pipeline

Quando Jarvis inicia uma feature no pipeline, usa este template:

```
PIPELINE EXECUTION: [Feature Name]

## Context
[O que e esta feature e por que importa]

## Current State
[O que existe hoje, links para arquivos]

## Fase 1: PLAN
@po: Define scope, acceptance criteria, success metrics
@architect: Validate feasibility, identify files, estimate effort

## Fase 2: BUILD
@dev: Implement following the brief. Files to create/modify:
- [file1.tsx] — [what to do]
- [file2.ts] — [what to do]

## Fase 3: REVIEW
@qa: Verify build, test functionality, check edge cases
@bybit: Validate API usage (if applicable)

## Fase 4: POLISH
@apple-ux: Typography, spacing, touch targets, animations
@design-system: Color tokens, card anatomy, chart styling

## Fase 5: FINAL CHECK
@qa: Final verification, no regressions, ready to ship

## Fase 6: SHIP
@jarvis: Commit with conventional message, update pipeline status
```

---

## Como Usar

### Para o CEO (Luis):

1. **Definir prioridade:** "Quero que foquem em WebSocket esta semana"
2. **Aprovar sprint:** Ver sprint plan na segunda, aprovar ou ajustar
3. **Revisar trabalho:** Ver commits pendentes, aprovar push
4. **Corrigir rota:** "Isso nao ficou bom, refazer com X abordagem"

### Para Jarvis (na sessao Claude):

1. **Iniciar feature:** Seguir o template de pipeline
2. **Chamar agentes:** Usar Agent tool com subagent_type especifico
3. **Coordenar:** Garantir que cada fase completa antes da proxima
4. **Reportar:** Manter docs/daily-reports/ atualizado

### Para executar via CLI:

```bash
# Pedir para Jarvis iniciar o pipeline de uma feature
"@jarvis execute pipeline for WebSocket live prices"

# Pedir revisao de uma pagina especifica
"@jarvis run review+polish pipeline on Portfolio.tsx"

# Pedir sprint planning
"@jarvis plan this week's sprint"
```

---

## Metricas de Evolucao

| Metrica | Semana 1 | Meta Semana 4 | Meta Semana 12 |
|---------|----------|---------------|----------------|
| Features shipped/semana | 3-5 | 5-8 | 8-12 |
| First-pass build success | 70% | 85% | 95% |
| Issues found by @qa | 5+/feature | 3/feature | 1/feature |
| Polish iterations needed | 2-3 | 1-2 | 1 |
| Pages at SHIPPED status | 3/26 | 15/26 | 26/26 |
| CEO corrections needed | 5/semana | 2/semana | 0-1/semana |
| Time per feature (avg) | 4h | 2h | 1h |

O sistema fica mais rapido porque:
- Pattern library cresce (menos decisoes de design)
- Agentes aprendem com feedback do CEO
- Quality gates automaticos pegam mais coisas
- Menos retrabalho (mais acerto de primeira)
