# Apice Brand Book

> **Versão:** v2.0 FINAL
> **Data:** 2026-04-17
> **Autores:** Jarvis (orchestrator) · Uma (design) · Stefan (voice) · Media-engineer (production) · Atlas (research) · Apple-UX (iOS) · Media-head (marketing)
> **Status:** Aprovado para implementação V2 do app

---

## Índice

1. [O que a Apice é](#1-o-que-a-apice-é)
2. [Identidade Visual — Logo System](#2-identidade-visual--logo-system)
3. [Paleta de Cores](#3-paleta-de-cores)
4. [Tipografia](#4-tipografia)
5. [Brand Voice](#5-brand-voice)
6. [AI Experts System](#6-ai-experts-system)
7. [Apice AI (a IA da plataforma)](#7-apice-ai-a-ia-da-plataforma)
8. [Client Testimonials Library](#8-client-testimonials-library)
9. [Marketing System](#9-marketing-system)
10. [Don'ts — What We Never Do](#10-donts--what-we-never-do)
11. [File Index](#11-file-index)

---

## 1. O que a Apice é

**Apice** é uma plataforma global profissional de investimento — DCA + AI Trade (ALTIS) + Academy + Gamification — que se posiciona no quadrante **Modern Fintech Professional** (vizinhos: Nexo 2024, Wise, Robinhood 2024 premium, Plaid).

- **EN-first** (global), Spanish secondary, Portuguese deprioritized
- **Target:** investidor sério 28–55 anos — não day-trader, não crypto-degen
- **Pricing:** Free / Pro $49.90/mo / Club $149.90/mo
- **Tagline:** *"Build Wealth. One Week at a Time."*
- **Philosophy:** Wealth is a discipline, not an event

---

## 2. Identidade Visual — Logo System

### 2.1 Elementos Principais

O sistema Apice é composto por **4 elementos que operam como um conjunto único**:

| Elemento | Função | Quando usar |
|---|---|---|
| **Triangle Mark** (ícone) | Símbolo autônomo, ápice/peak | Favicon, app icon, hero visual |
| **"Apice" Wordmark** | Nome da marca | Sempre presente em composição institucional |
| **Signature Dot** (emerald `#16A661`) | Ponto após "Apice" = period | Sempre acompanha o wordmark |
| **Tagline "GLOBAL AI INVESTING"** | Categoria / posicionamento | Em composições institucionais (primeira impressão, press, hero) |

### 2.2 Logo Unificada — Anatomia Completa

A **logo oficial** integra os 4 elementos em uma única composição. É essa a marca que representa Apice em lockups institucionais:

```
  [Triangle]    Apice  (+ emerald dot)
                ─────────────────
                GLOBAL AI INVESTING
```

- **Triangle** à esquerda (ou acima no stacked) — DNA aprovado (outline + inner fill 0.20)
- **Wordmark "Apice"** em Geist 700 tracking `-0.03em`
- **Emerald dot** `#16A661` imediatamente após o "e" (funciona como period)
- **Hairline separator** — linha de 0.6u opacity 0.30 separando nome e tagline
- **Tagline "GLOBAL AI INVESTING"** em Geist 600 caps tracked `0.3em` opacity 0.60

**Dark-mode adicionais:** o triangle aparece dentro de um **circle container** translúcido com ambient **blue glow** `#528FFF` (mantém a referência Landing).

### 2.2 Triangle Mark — Especificação

**Geometria:**
- ViewBox: `64 × 64`
- Stroke weight: **4u** (escala com tamanho)
- Stroke joins/caps: **rounded** em todos os cantos
- Apex: `x=32, y=10`
- Base esquerda: `x=8, y=52`
- Base direita: `x=56, y=52`
- Sem fill interno (outline only)

**Variantes:**

| Variante | Arquivo | Uso |
|---|---|---|
| Standalone light | `apice-triangle-v6-final.svg` | Light backgrounds, body copy |
| In-circle dark | `apice-triangle-in-circle-dark.svg` | Dark hero surfaces (Landing, Splash) |
| App icon | `apice-app-icon-final.svg` | iOS/Android launcher |
| Favicon | `apice-favicon-final.svg` | Browser tab |

**Cores:**
- Em light bg: `currentColor` (herda texto, geralmente `#0E0E12`)
- Em dark bg: cream `#F7F3ED`
- Em circle container: triangle cream + circle translucent white + soft blue glow

**Regras críticas:**
- NÃO adicionar inner fill (mantém só outline)
- NÃO rotacionar
- NÃO preencher com cor sólida
- NUNCA usar triangle sem o circle container em dark surfaces hero
- NUNCA usar outros triângulos (removidos do sistema: v2/v3/v4/v5 são variantes descartadas)

### 2.3 Variações Finais da Logo

| Variante | Arquivo | Uso |
|---|---|---|
| **Unified horizontal light** ★ | `apice-logo-unified-horizontal-light.svg` | Primary institutional — light bg (web headers, docs, email) |
| **Unified horizontal dark** ★ | `apice-logo-unified-horizontal-dark.svg` | Primary institutional — dark bg (Landing hero, Club page) |
| **Unified stacked light** | `apice-logo-unified-stacked-light.svg` | Square avatars (social, app store hero) |
| **Unified stacked dark** | `apice-logo-unified-stacked-dark.svg` | Square dark avatars, certificates |
| **Primary light (no tagline)** | `apice-logo-primary-light.svg` | Light bg · tight contexts, nav sem tagline |
| **Primary dark (AI TRADE SETUP subtitle)** | `apice-logo-primary-dark.svg` | Landing exact (subtítulo legado) |
| **Wordmark + tagline** | `apice-logo-wordmark-with-tagline.svg` | Editorial, press, onde só o nome entra |
| **Compact nav** | `apice-logo-compact-nav.svg` | Mobile nav, bottom bar, 24–40px |
| **Triangle in circle** | `apice-triangle-in-circle-dark.svg` | Landing nav badge (apenas o círculo + triângulo) |
| **Triangle standalone** | `apice-triangle-final.svg` | Favicon, app icon, contextos minimalistas |
| **Favicon** | `apice-favicon-final.svg` | 16-48px |
| **App Icon** | `apice-app-icon-final.svg` | iOS/Android launcher 1024² |

### 2.4 Tagline — "GLOBAL AI INVESTING"

**Regra de ouro:** a tagline é **categoria**, não slogan. Define em 3 palavras o que a Apice é: um investimento **global**, movido a **AI**.

- ✅ Aparece em composições institucionais (primeira impressão, hero, press, onboarding)
- ✅ Aparece em all-caps · Geist 600 · tracked `0.3em`
- ❌ NUNCA em body copy, slogan position, ou no lugar de "Build Wealth. One Week at a Time." (que continua sendo o slogan de marketing)

**Variações de tagline autorizadas (caso `GLOBAL AI INVESTING` não caiba):**
- `AI INVESTING PLATFORM` (mais tech-focused)
- `GLOBAL · AI · INVESTING` (tight contexts, separadores)
- Apenas `AI INVESTING` (mobile nav compact extremo)

### 2.4 Clear Space

Margem mínima em torno do logo = altura do triângulo. Nunca coloque outros elementos dentro desse espaço.

### 2.5 Tamanhos Mínimos

| Contexto | Mínimo |
|---|---|
| Favicon | 16px |
| Nav mobile | 24px |
| App icon launcher | 76px (iPad) / 60px (iPhone) |
| Hero Landing | 44px (triangle diameter) |
| Print/press | 24px |

---

## 3. Paleta de Cores

### 3.1 Core Palette

| Token | Hex | HSL | Uso |
|---|---|---|---|
| **Ink** | `#0E0E12` | 240 15% 6% | Texto principal, backgrounds dark |
| **Cream** | `#F7F3ED` | 40 40% 95% | Background light, texto em dark |
| **Emerald** | `#16A661` | 152 78% 37% | Signature dot, active/live states |
| **Emerald Deep** | `#0F5D3F` | 155 72% 21% | Hairlines, structural accents |

### 3.2 Landing Accent Palette (dark hero only)

| Token | Hex | Uso |
|---|---|---|
| Blue glow | `#528FFF` | Soft ambient glow no circle container |
| Gradient start | `#050816` | Deep background do Landing |
| Gradient end | `#0E1220` | Gradient mid-tone |

### 3.3 Expert Accent Colors (cada expert tem sua cor)

| Expert | Accent |
|---|---|
| Nora | Indigo `#8B5CF6` |
| Kai | Sky `#0EA5E9` |
| Elena | Emerald `#16A661` (aligned) |
| Dante | Rose `#F43F5E` |
| Maya | Purple `#A855F7` |
| Omar | Amber `#D9912D` |

### 3.4 Regras de Cor

- **Base sempre:** ink + cream (2 neutrals)
- **Signature sempre:** emerald (UMA cor)
- **Accent só para experts:** cada expert tem sua cor, aparece 1x por avatar
- **Blue glow:** SOMENTE no dark Landing hero container
- **NUNCA:** gradient no logo, neon colors, laser eyes, gold corrente, purples para a marca (só para Maya expert)

---

## 4. Tipografia

### 4.1 Font Stack

**Primary:** Geist (display + sans + mono)
```css
font-family: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
```

### 4.2 Weights Committed

| Weight | Uso |
|---|---|
| **400 Regular** | Body copy, Academy long-form |
| **500 Medium** | UI labels, row headers |
| **700 Bold** | Headlines, wordmark, section titles |

Weights abaixo de 400 **proibidos** (Thin/Light). Wealth platform não sussurra.

### 4.3 Numeric Typography

**Sempre** Geist Mono para valores financeiros. Sempre `font-variant-numeric: tabular-nums`. Ex: `$1,249.00` não `$1,249.00`.

### 4.4 Type Scale

| Token | Size | Weight | Uso |
|---|---|---|---|
| display-lg | 88px | 700 | Landing hero |
| display | 60px | 800 | Marketing hero |
| h1 | 36px | 800 | Page titles |
| h2 | 28px | 800 | Section heads |
| h3 | 20px | 700 | Card titles |
| body | 15px | 400 | Default |
| body-sm | 13px | 400 | Compact |
| caption | 12px | 500 | Labels |
| overline | 11px | 700 | Section labels (UPPERCASE tracked 0.12em) |

---

## 5. Brand Voice

### 5.1 Voice DNA

**4 adjetivos:** Confident · Warm · Disciplined · Clear

### 5.2 Tone Spectrum

| Contexto | Register |
|---|---|
| Onboarding | Inviting |
| Education | Illuminating |
| Celebration | Proud, never gaudy |
| Caution | Calm, reassuring |
| Upgrade | Aspirational, never pushy |
| Marketing | Confident without hype |

### 5.3 Tagline (approved)

**Main:** *"Build Wealth. One Week at a Time."*

**Cold ad hook:** *"Stop trading. Start building."*

**Club tier:** *"Wealth is a discipline, not an event."*

### 5.4 NEVER Say

- moon · lambo · ape · degen · YOLO · pump · shill · bag
- get rich quick · life-changing · financial freedom (overused)
- guaranteed returns · risk-free
- exclamation points stacking !!!

### 5.5 The Apice Code (Manifesto)

Ver `01-brand-foundation/apice-code-manifesto-FINAL.md` — 7 tenets · 355 words · ready for CEO sign-off.

Closing: *"Welcome to Apice."*

---

## 6. AI Experts System

### 6.1 Os 6 Experts

| # | Nome | Archetype | Accent | Real Portrait |
|---|---|---|---|---|
| 1 | **Nora** the Thesis Builder | Analyst | Warm Indigo | `AD-01-nora-enhanced.png` |
| 2 | **Kai** the Pattern Reader | Momentum | Sky Blue | `AD-02-kai-enhanced.png` |
| 3 | **Elena** the Patient Compounder | DCA Master | Emerald | `AD-03-elena-enhanced.png` |
| 4 | **Dante** the Risk Architect | Risk Manager | Rose | `AD-04-dante-enhanced.png` |
| 5 | **Maya** the Deep Researcher | Researcher | Purple | `AD-05-maya-enhanced.png` |
| 6 | **Omar** the Mentor | Mentor | Warm Amber | `AD-06-omar-enhanced.png` |

### 6.2 Production Specs

- **Modelo de geração:** Gemini 3 Pro Image Preview (via CreativeOS)
- **Estilo:** Semi-photorealistic editorial + ENHANCE layer (poros visíveis, fly-away hairs, subsurface scattering)
- **Resolução:** 1024×1024 PNG
- **Framing:** Chest-up portrait, soft bokeh background
- **Lighting:** Single warm key camera-left 35°, subtle rim

### 6.3 Regras de Uso

- **Dot overlay:** cada avatar ganha um pequeno dot emerald `#16A661` no canto inferior direito (signature "active/listening" indicator)
- **Formato de entrega:** PNG 512×512 (card grande) + 256×256 (inline) + 128×128 (list item)
- **Accent color:** cada expert tem SUA cor individual, que aparece 1x no avatar (scarf, sweater, accessory)
- **Brand-green unifier:** o dot emerald `#16A661` aparece em todos como signature brand

---

## 7. Apice AI (a IA da plataforma)

Sistema visual separado para a IA meta (orquestra os 6 experts). Conceito: **"o dot da logo, vivo"**.

### 7.1 Estados

| Estado | Visual |
|---|---|
| Idle | Orbe emerald estático com halo suave |
| Listening | Halo sutil pulsa |
| Thinking | Conic gradient sweep rotacionando 1.6s + prism rainbow 30% opacity counter-rotating 3.2s |
| Speaking | Halo pulse sincronizado com output |
| Handoff | Orbe expande para frame do expert invocado |

### 7.2 Arquivos

- `apice-ai-mark.svg` — primary (128×128)
- `apice-ai-thinking.svg` — animado thinking state
- `apice-ai-inline.svg` — tiny 24×24 para "Apice is thinking..." labels

---

## 8. Client Testimonials Library

### 8.1 20 Client Portraits

Biblioteca de retratos para social proof — testimonials, reviews, landing grids, ad creatives.

**10 Mulheres:** Sarah (US) · Emma (UK) · Yuki (JP) · Maria (ES) · Amara (NG) · Isabella (BR) · Priya (IN) · Anna (DE) · Mei (CN) · Sofia (IT)

**10 Homens:** James (US) · Oliver (UK) · Carlos (MX) · Kenji (JP) · Marcus (DE) · Rafael (BR) · Samir (IN) · Hugo (FR) · Daniel (ZA) · Alex (AU)

**Style:** Casual candid portraits — não editorial, não stock photo. Parecem gente real.

**Pasta:** `brand/assets/clients/criativos/`

### 8.2 Uso em Testemunhos

Cada client vira um card `<Testimonial>`:
```
[Avatar 64×64] [★★★★★]
               "Quote..."
               Nome, Idade · Cidade · "Apice user since YYYY"
```

---

## 9. Marketing System

### 9.1 Templates Disponíveis (em `brand/assets/marketing/`)

- OG Images (default, homepage, Academy, Club) · 1200×630
- Instagram Post (3 variants) · 1080×1080
- Instagram Story · 1080×1920
- Twitter Card · 1200×675
- LinkedIn Post · 1200×628
- Meta Ads (feed, square, story)
- TikTok Cover · 1080×1920
- Email Header + Footer
- Web Heroes (homepage + Club page)

### 9.2 Campanha Archetypes

1. **The Weekly Habit** — targets DCA-curious retail
2. **The Elite Investor** — targets Club subscribers
3. **The Capital Game** — targets Gen Z/Millennial

### 9.3 Weekly Content System

| Dia | Voz | Expert |
|---|---|---|
| Segunda | Market Intelligence | Kai |
| Terça | Education Snippet | Omar |
| Quarta | DCA Discipline | Elena |
| Quinta | Thesis Spotlight | Nora |
| Sexta | Market Close Insights | Maya |
| Sábado | Risk Reflection | Dante |
| Domingo | Apice Code Quote | (manifesto) |

---

## 10. Don'ts — What We Never Do

### Visual

- ❌ Gradient filled dentro do triangle logo
- ❌ Laser eyes, neon glow, 3D rendered mark
- ❌ Ornamento heritage-luxury (Hermès/Rolex style) — errado pra categoria
- ❌ Script/cursive wordmark
- ❌ Weight tipográfico abaixo de 400
- ❌ Amber/gold como cor signature principal (só expert Omar)
- ❌ Purple como cor da marca (só expert Maya)
- ❌ Stock photo de executivo sorrindo em laptop
- ❌ Crypto clichês: coins, Bitcoin logos, dólares cobrindo tela

### Voice

- ❌ "Moon" "lambo" "ape" "degen" "YOLO" "pump"
- ❌ "Guaranteed returns" "risk-free" "get rich quick"
- ❌ Emojis empilhados (🚀🔥💰💎)
- ❌ ALL CAPS em body copy
- ❌ Exclamation points em series
- ❌ Contar benefício sem citar a disciplina por trás

---

## 11. File Index

### Logo System (`brand/assets/logos/`)

| Arquivo | Descrição |
|---|---|
| `apice-triangle-v6-final.svg` | Triangle standalone (light bg) |
| `apice-triangle-in-circle-dark.svg` | Triangle + circle container + glow (dark hero) |
| `apice-logo-primary-light.svg` | Triangle + wordmark + dot (light) |
| `apice-logo-primary-dark.svg` | Container + wordmark + AI TRADE SETUP (dark) |
| `apice-favicon-final.svg` | 32×32 favicon |
| `apice-app-icon-final.svg` | 1024² app icon |

### Experts (`brand/assets/experts/real/criativos/`)

| Arquivo | Descrição |
|---|---|
| `AD-01-nora-enhanced.png` | Nora — Analyst (enhanced photoreal) |
| `AD-02-kai-enhanced.png` | Kai — Momentum |
| `AD-03-elena-enhanced.png` | Elena — DCA Master |
| `AD-04-dante-enhanced.png` | Dante — Risk Manager |
| `AD-05-maya-enhanced.png` | Maya — Researcher |
| `AD-06-omar-enhanced.png` | Omar — Mentor |

### Clients (`brand/assets/clients/criativos/`)

20 arquivos `AD-01-w01-sarah-us.png` → `AD-20-m10-alex-au.png`

### AI Apice (`brand/assets/ai-apice/`)

- `apice-ai-mark.svg` · `apice-ai-thinking.svg` · `apice-ai-inline.svg`

### Abstract Motifs (`brand/assets/abstract/`)

- `abstract-currents-01.svg` · `constellations` · `rings` · `threads` · `strata`

### Marketing (`brand/assets/marketing/`)

18 SVG templates (social + ads + email + web heroes)

### Foundation Docs (`brand/01-brand-foundation/`)

- `brand-system-FINAL.md`
- `brand-voice-FINAL.md`
- `apice-code-manifesto-FINAL.md`
- `taglines-library.md`
- `feature-naming-guide.md`
- `abstract-visual-system.md`
- `motion-spec-FINAL.md`
- `integration-guide.md`
- `visual-research-category-DNA.md`

### Execution Docs

- `creativeos/engines/image/configs/apice/apice-experts-enhanced.yaml` (6 experts)
- `creativeos/engines/image/configs/apice/apice-clients.yaml` (20 clients)
- `creativeos/engines/image/configs/apice/apice-experts-photoreal.yaml` (v2 photoreal)
- `brand/03-ai-experts/creativeos-execution-guide.md`
- `brand/03-ai-experts/nano-banana-prompt-package.md`

### Plans & History

- `brand/00-MASTER-PLAN.md` — orquestrador original
- `brand/DECISIONS-LOG.md` — histórico de todas as decisões (v1→v6)
- `brand/05-marketing/campaign-playbook.md`
- `brand/05-marketing/weekly-content-system.md`
- `brand/05-marketing/asset-production-guide.md`
- `brand/06-app-store/listing-copy-EN-US.md` (+ `-ES.md`)
- `brand/06-app-store/screenshot-brief.md`
- `brand/06-app-store/aso-strategy.md`
- `brand/06-app-store/launch-readiness.md`
- `brand/06-app-store/competitor-listing-research.md`

---

*Brand Book v2.0 · Apice Capital · 2026-04-17 · Orquestrado por Jarvis*
