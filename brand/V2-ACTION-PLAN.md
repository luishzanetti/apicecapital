# Apice V2 — Action Plan

> **From:** Brand system v2.0 approved
> **To:** App launched with new visual identity
> **Duration:** 4 sprints (~4 semanas)
> **Approach:** Sprint-based · incremental · zero-downtime
> **Owner:** Jarvis (orchestrator) delegando a @dev, @devops, @qa, @ux-design-expert, @media-engineer, @media-head

---

## Meta

Migrar a Apice do visual atual para o novo Brand System v2 **sem breaking changes** na produção. Cada sprint entrega valor visível e reversível.

---

## Sprint 0 — Prep (3 dias · antes de começar)

### Objetivo
Garantir que tudo está no lugar antes do primeiro commit de produção.

### Entregas

| # | Tarefa | Owner | Dependências |
|---|---|---|---|
| 0.1 | Copiar assets aprovados para `Apps/ApiceCapital/src/assets/brand/` | @dev | brand/ finalizado ✅ |
| 0.2 | Criar branch `feature/brand-v2` a partir de `main` | @devops | — |
| 0.3 | Feature flag `ENABLE_BRAND_V2` em `src/lib/featureFlags.ts` | @dev | — |
| 0.4 | Setup Storybook com brand v2 components isolados | @dev | — |
| 0.5 | Rotacionar API key exposta (`AIzaSyA...dwzGs`) | CEO | — |
| 0.6 | Post-process dos 6 expert portraits: crop 512² · dot overlay · rename `{name}-final.png` | @media-engineer | Gemini experts ✅ |
| 0.7 | Post-process dos 20 client portraits: crop 512² · rename por `{country}-{name}.png` | @media-engineer | Gemini clients ✅ |

### Acceptance criteria
- [ ] `Apps/ApiceCapital/src/assets/brand/` existe com todos os SVGs + PNGs
- [ ] Branch `feature/brand-v2` criada com commit inicial vazio
- [ ] Storybook sobe com 3 componentes placeholder
- [ ] Key rotacionada e nova colocada em `.env` do creativeos

---

## Sprint 1 — Logo Swap + Core Components (5 dias)

### Objetivo
Substituir o logo atual pelo triangle v6 + wordmark em todas as telas. Zero impacto em funcionalidade.

### Entregas

| # | Tarefa | Owner | Arquivos tocados |
|---|---|---|---|
| 1.1 | Criar `<ApiceLogo/>` component com variants `primary-light` / `primary-dark` / `triangle-only` / `wordmark-only` | @dev | `src/components/brand/ApiceLogo.tsx` |
| 1.2 | Substituir triangle SVG em `Landing.tsx:110-116` por `<ApiceLogo variant="triangle-in-circle" theme="dark"/>` | @dev | `src/pages/Landing.tsx` |
| 1.3 | Trocar favicon: copiar `apice-favicon-final.svg` → `public/favicon.svg` e atualizar `index.html` | @dev | `public/favicon.svg`, `index.html` |
| 1.4 | Trocar OG image: copiar `apice-og-image.svg` → `public/og-image.svg` + renderizar PNG 1200×630 via svgexport | @dev | `public/og-image.png` |
| 1.5 | Atualizar favicon nos meta tags do `index.html` | @dev | `index.html` |
| 1.6 | Trocar logo no `Splash.tsx` e `Welcome.tsx` | @dev | `src/pages/Splash.tsx`, `Welcome.tsx` |
| 1.7 | Trocar logo no `BottomNav.tsx` (ícone central) | @dev | `src/components/BottomNav.tsx` |
| 1.8 | Atualizar app icon: rodar `xcrun xcassetgen` para gerar PNG pack do iOS a partir de `apice-app-icon-final.svg` | @devops | `ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| 1.9 | Atualizar Android adaptive icon em `android/app/src/main/res/mipmap-*/` | @devops | Android res dirs |
| 1.10 | Adicionar fonte Geist via `@fontsource/geist-sans` + `@fontsource/geist-mono` | @dev | `package.json`, `main.tsx` |
| 1.11 | Testes visuais em Chrome/Safari/Firefox/iOS Safari/Android Chrome | @qa | — |

### Acceptance criteria
- [ ] `<ApiceLogo/>` renderiza nas 4 variants sem erros TypeScript
- [ ] Landing page mostra novo logo dark-hero (screenshot match)
- [ ] Favicon aparece em todas as tabs do browser
- [ ] OG image preview no Twitter Card Validator / Facebook Debugger
- [ ] iOS app icon aparece na home screen em 60px, 76px, 120px, 180px
- [ ] QA aprova em 5 browsers + 2 OS mobile

### Rollback plan
Se algo quebrar, basta reverter commits do branch. Feature flag não é necessária nesse sprint (swap visual é seguro).

---

## Sprint 2 — Color & Typography System (3 dias)

### Objetivo
Atualizar CSS variables + Tailwind config para refletir a paleta oficial da Brand v2. Zero breaking.

### Entregas

| # | Tarefa | Owner | Arquivos tocados |
|---|---|---|---|
| 2.1 | Atualizar `tailwind.config.ts` com novos tokens: ink, cream, emerald, emerald-deep, etc. | @dev | `tailwind.config.ts` |
| 2.2 | Adicionar CSS custom properties no `src/styles/tokens.css` | @dev | `src/styles/tokens.css` (novo) |
| 2.3 | Importar `tokens.css` no `main.tsx` | @dev | `src/main.tsx` |
| 2.4 | Atualizar `font-family` em `tailwind.config.ts` para Geist stack | @dev | `tailwind.config.ts` |
| 2.5 | Definir type scale customizado (display-lg, display, h1-h3, body, caption, overline) | @dev | `tailwind.config.ts` |
| 2.6 | Migrar `Button` component para weight 700 sempre | @dev | `src/components/ui/button.tsx` |
| 2.7 | Migrar tabular numerics nos valores financeiros (Portfolio, Balance, DCA) | @dev | `src/pages/Portfolio.tsx`, `Home.tsx`, etc. |
| 2.8 | QA visual: checar que nenhuma tela ficou quebrada | @qa | — |

### Acceptance criteria
- [ ] Tailwind `theme.colors.apice-*` acessível em JSX
- [ ] Geist carrega em prod sem FOUT
- [ ] Todos os valores financeiros usam `tabular-nums`
- [ ] Screenshots antes/depois de Home, Portfolio, Settings validados

---

## Sprint 3 — AI Experts Integration (5 dias)

### Objetivo
Integrar os 6 experts photorealistic no app — Academy, AI Trade, daily insights, etc.

### Entregas

| # | Tarefa | Owner | Arquivos tocados |
|---|---|---|---|
| 3.1 | Criar `src/data/experts.ts` com 6 experts (id, name, title, archetype, accentHex, imagePath, bio, voiceMarkers) | @dev | novo |
| 3.2 | Criar `<ExpertAvatar/>` component com variants size 32/48/64/96/128 + `showDot={true}` | @dev | `src/components/brand/ExpertAvatar.tsx` |
| 3.3 | Criar `<ExpertCard/>` — avatar + name + title + archetype + accent | @dev | `src/components/brand/ExpertCard.tsx` |
| 3.4 | Criar `<ExpertQuote/>` — avatar + quote + expert attribution | @dev | `src/components/brand/ExpertQuote.tsx` |
| 3.5 | Atualizar `Academy.tsx` / `Learn.tsx`: cada lesson assina com o expert correspondente | @dev | `src/pages/Learn.tsx` |
| 3.6 | Atualizar `Home.tsx` daily insight: rotacionar entre os 6 experts por dia da semana | @dev | `src/pages/Home.tsx` |
| 3.7 | Criar página `/experts` que lista os 6 com bios e voice markers | @dev | `src/pages/Experts.tsx` (nova) |
| 3.8 | Integrar Apice AI state (idle/thinking/speaking) em `<ApiceAI/>` | @dev | `src/components/brand/ApiceAI.tsx` |
| 3.9 | QA: experts carregam em 5 contextos sem flash de conteúdo | @qa | — |

### Acceptance criteria
- [ ] 6 experts aparecem em `/experts` com bios
- [ ] Daily insight na Home rotaciona por dia
- [ ] Academy lessons têm o expert correspondente no header
- [ ] ApiceAI mark aparece em estado thinking quando LLM está respondendo
- [ ] Nenhuma imagem faltando (QA visual completa)

---

## Sprint 4 — Social Proof + Testimonials (3 dias)

### Objetivo
Integrar os 20 client portraits como sistema de testimonials — Landing, marketing pages, share cards.

### Entregas

| # | Tarefa | Owner | Arquivos tocados |
|---|---|---|---|
| 4.1 | Stefan escreve 20 quotes (1 por cliente) em EN + subset em ES/PT | @stefan (delegado) | `src/data/testimonials.ts` (novo) |
| 4.2 | Criar `<Testimonial/>` component (avatar 64px + stars + quote + attribution) | @dev | `src/components/brand/Testimonial.tsx` |
| 4.3 | Criar `<TestimonialMarquee/>` — carrossel horizontal auto-scroll | @dev | `src/components/brand/TestimonialMarquee.tsx` |
| 4.4 | Substituir `TestimonialsMarquee` atual do `Landing.tsx` pelo novo com 20 clients | @dev | `src/pages/Landing.tsx` |
| 4.5 | Adicionar testimonials section na Club upsell page | @dev | `src/pages/Upgrade.tsx` |
| 4.6 | Adicionar testimonials na página de onboarding após Quiz | @dev | `src/pages/Quiz.tsx` |
| 4.7 | Criar endpoint placeholder `/api/reviews` que retorna os 20 como mock (para futuro replace com reviews reais) | @dev | `api/reviews.ts` |
| 4.8 | QA: testimonials carregam em 3 locations sem layout shift | @qa | — |

### Acceptance criteria
- [ ] 20 quotes escritas e aprovadas por CEO
- [ ] Marquee scrolla suavemente no Landing
- [ ] Testimonials aparecem em Landing + Upgrade + Quiz
- [ ] Lighthouse score não cai (imagens lazy-loaded)

---

## Sprint 5 — Launch & Polish (3 dias)

### Objetivo
Deploy da v2 na produção com rollout gradual + monitoring.

### Entregas

| # | Tarefa | Owner |
|---|---|---|
| 5.1 | Merge `feature/brand-v2` → `main` via PR com review completa | @devops |
| 5.2 | Deploy staging → QA completa cross-browser + mobile | @qa |
| 5.3 | Deploy production com feature flag `ENABLE_BRAND_V2=true` para 10% dos users | @devops |
| 5.4 | Monitor: Sentry, Vercel Analytics, PostHog — checar erro rate vs baseline | @devops |
| 5.5 | Se erro rate OK em 24h → rollout 100% | @devops |
| 5.6 | Atualizar App Store listing com screenshots novos (após swap de logo) | @analyst (Atlas) |
| 5.7 | Atualizar Play Store listing | @analyst |
| 5.8 | Post mortem + learnings | Jarvis |

### Acceptance criteria
- [ ] Produção rodando com brand v2 para 100% dos users
- [ ] App Store + Play Store atualizados
- [ ] Zero crash rate acima do baseline
- [ ] Core Web Vitals não regrediram

---

## Dependências Externas

| Dependência | Quem resolve | Quando | Impact se não resolver |
|---|---|---|---|
| CEO polir o manifesto final (1-3 linhas) | CEO | Antes do Sprint 3 | Academy Track 6 L7 não lança |
| Pricing App Store decidido (Path A ou B) | CEO | Sprint 5 | Submissão App Store bloqueada |
| Meta Pixel + TikTok Events API + PostHog | @devops | Antes do Sprint 5 | Ads tracking cego |
| Legal: privacy policy + ToS publicados | @devops | Antes do Sprint 5 | App Store rejeita |
| API key rotacionada | CEO | Antes do Sprint 0 | Segurança comprometida |
| Domain custom `apice.capital` DNS | @devops | Antes do Sprint 1 | OG image em produção falha |

---

## Timeline

```
Semana 1:  [ Sprint 0 · 3d ][    Sprint 1 · 5d         ]
Semana 2:  [   Sprint 2 · 3d  ][    Sprint 3 · 5d       ]
Semana 3:  [                                   ]
Semana 4:  [ Sprint 4 · 3d  ][ Sprint 5 · 3d          ]
```

**Total:** 22 dias úteis · ~4 semanas. Pode compactar para 3 semanas se @dev trabalhar em paralelo em Sprint 3 + Sprint 4.

---

## Métricas de Sucesso V2

### Launch (Dia 1)
- [ ] Zero crash rate spike
- [ ] Lighthouse score ≥ baseline em todas as 5 páginas críticas
- [ ] App Store listing atualizado em < 24h após merge

### Semana 2 pós-launch
- [ ] NPS score da nova UI ≥ 8/10 (survey in-app)
- [ ] Conversion free → Pro aumentou ≥ 15% vs baseline
- [ ] Engagement Academy (lessons/user) aumentou ≥ 20% (experts são novos)

### Mês 1 pós-launch
- [ ] 10+ reviews mencionando "design", "visual", "professional"
- [ ] Brand recall em pesquisas aumentou 2x (brand tests)
- [ ] Club tier signups aumentou ≥ 30% (new testimonials + aspirational hero)

---

## Riscos & Mitigações

| # | Risco | Probabilidade | Mitigação |
|---|---|---|---|
| R1 | Geist font não carrega em alguns devices | Baixa | Fallback Inter + system fonts já stackados |
| R2 | Novo logo confunde users existentes ("mudou app?") | Média | Email pre-launch anunciando refresh + in-app onboarding modal no primeiro login pós-update |
| R3 | Experts photoreal parecem "AI generated" e quebram trust | Baixa | QA manual de cada avatar pelo CEO antes de Sprint 3 |
| R4 | App icon iOS 29pt ilegível com triangle small | Média | Dot-only fallback já preservado em `apice-app-icon-ios-dot-only.svg` — swap em 5min se telemetria justificar |
| R5 | Testimonials com AI-generated portraits violam termos de App Store | Baixa | Usar disclaimer "Illustrative · representing real Apice users" no Landing |

---

## Responsabilidades

| Role | Owner Humano (você vai precisar) |
|---|---|
| Product owner / approval final | CEO |
| Dev (React/Vite/Tailwind/TypeScript) | @dev humano — ou Jarvis delega a agent dev para tasks específicas |
| DevOps (deploy, iOS/Android build, analytics) | @devops humano |
| QA (cross-browser, cross-device) | @qa humano ou Playwright automation + manual spot-check |
| Copy (20 testimonial quotes) | @stefan-georgi agent (entrega em 1 rodada) |
| Design QA (avatar approval, visual polish) | @ux-design-expert agent (Uma) |

---

## Post-V2 (backlog futuro)

Não escopo do V2 mas mapeado:

- **V2.1:** Motion spec applied — Apice mark draw-in, expert card hover, testimonial scroll parallax
- **V2.2:** AI Apice full integration — orbe animado respondendo ao LLM real
- **V2.3:** Abstract motifs integration — currents/constellations em empty states e onboarding heroes
- **V2.4:** Club certificate generator — PDF/PNG gerado dinamicamente com triangle seal
- **V2.5:** Brand guidelines PDF oficial (designed, not markdown) para partners/press

---

*V2 Action Plan · Apice Capital · 2026-04-17 · Jarvis orchestration*
