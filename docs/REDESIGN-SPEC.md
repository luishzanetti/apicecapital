# Apice Capital — Complete Design System Redesign Specification

> Inspired by: Apple (warmth, clarity), Shopify (grid discipline, density), Claude/Anthropic (human warmth, typography), Premium Fintech (trust, sophistication)
>
> Target: Mobile-first crypto investment app (430px max-width container)

---

## AUDIT SUMMARY — Current State Issues

### What works
- HSL CSS variable system is well-structured
- Card variant system (CVA) is flexible
- Glassmorphism utilities exist
- Animation system is extensive
- Safe area handling is present

### Critical problems to fix
1. **Color system is cold and generic** — The blue primary (222 89% 55%) is standard Tailwind blue. No brand warmth, no personality. The gold accent feels disconnected.
2. **Too many competing visual effects** — Glow, glassmorphism, gradients, shimmer, orb-drift all coexist. The result is visual noise, not premium.
3. **Typography lacks hierarchy** — `Outfit` for display + `Inter` for body is fine in theory but not leveraged consistently. No optical sizing, no semantic weight rules.
4. **Spacing is ad-hoc** — `px-5`, `pt-6`, `pb-4`, `mb-4`, `p-5` everywhere with no rhythm. Padding inside cards is p-5/pt-0 which is unusual.
5. **Shadows are theme-colored** — `apice-shadow-soft` uses primary blue tint. This is a dated 2022 pattern. Modern premium uses neutral shadows.
6. **Button heights are too tall for mobile** — `h-12` default, `h-14` lg, `h-16` xl. These eat valuable viewport real estate.
7. **Border radius `1rem` (16px) default is too aggressive** — Cards at `rounded-2xl` (24px+) look inflated. Premium apps use tighter radii.
8. **Overuse of emojis as icons** — Widget definitions use emoji (skull, target, chart) instead of a consistent icon system.
9. **No data visualization palette** — Charts need a dedicated sequential/categorical color scale.
10. **Dark mode is decent but surfaces lack depth** — Only 2 surface levels. Premium dark UIs need 4-5 elevation layers.

---

## A. COLOR SYSTEM

### Philosophy
Move from "cold fintech blue + disconnected gold" to a **warm, confident, trust-forward palette** inspired by Apple's recent warmth (iOS 18 tinted backgrounds) and Claude's approachable neutrals.

### Primary Palette

```css
:root {
  /* Brand Primary — Warm Indigo (not cold blue) */
  --primary-50:  243 50% 97%;    /* #F5F3FF — tinted backgrounds */
  --primary-100: 245 47% 93%;    /* #EDE9FE */
  --primary-200: 244 47% 85%;    /* #DDD6FE */
  --primary-300: 244 55% 73%;    /* #C4B5FD */
  --primary-400: 244 63% 62%;    /* #A78BFA */
  --primary-500: 245 58% 51%;    /* #8B5CF6 — PRIMARY ACTION */
  --primary-600: 249 66% 45%;    /* #7C3AED — hover/pressed */
  --primary-700: 250 66% 38%;    /* #6D28D9 */
  --primary-800: 252 60% 31%;    /* #5B21B6 */
  --primary-900: 254 50% 24%;    /* #4C1D95 */

  /* Brand Accent — Warm Amber (refined gold) */
  --accent-50:  48 96% 97%;      /* #FFFBEB */
  --accent-100: 48 96% 89%;      /* #FEF3C7 */
  --accent-200: 48 97% 77%;      /* #FDE68A */
  --accent-300: 46 97% 65%;      /* #FCD34D */
  --accent-400: 43 96% 56%;      /* #FBBF24 — ACCENT ACTION */
  --accent-500: 38 92% 50%;      /* #F59E0B */
  --accent-600: 32 95% 44%;      /* #D97706 */
  --accent-700: 26 90% 37%;      /* #B45309 */
}
```

**Why warm indigo?** It sits between blue (trust/finance) and purple (premium/aspiration). Apple uses this range in their premium tiers. It reads as sophisticated without being corporate-cold. It pairs naturally with amber/gold for accent moments.

### Semantic Colors

```css
:root {
  /* Success — Emerald (profit, positive) */
  --success-50:  152 81% 96%;
  --success-500: 160 84% 39%;    /* #10B981 */
  --success-600: 161 94% 30%;    /* #059669 */

  /* Warning — Amber (caution, attention) */
  --warning-50:  48 96% 97%;
  --warning-500: 38 92% 50%;     /* #F59E0B */
  --warning-600: 32 95% 44%;

  /* Error — Rose (loss, danger) */
  --error-50:  356 100% 97%;
  --error-500: 350 89% 60%;      /* #F43F5E */
  --error-600: 347 77% 50%;      /* #E11D48 */

  /* Info — Sky (neutral information) */
  --info-50:  204 94% 94%;
  --info-500: 199 89% 48%;       /* #0EA5E9 */
  --info-600: 200 98% 39%;
}
```

**Profit/Loss convention:** Always use `success-500` for gains and `error-500` for losses. Never swap these. Gray for flat/unchanged.

### Neutral Scale (Light Mode)

```css
:root {
  --neutral-0:   0 0% 100%;        /* #FFFFFF — card surface */
  --neutral-25:  240 20% 99%;      /* #FDFDFE — page background */
  --neutral-50:  240 17% 97%;      /* #F8F8FB — elevated bg, input bg */
  --neutral-100: 240 14% 95%;      /* #F0F0F4 — subtle borders, dividers */
  --neutral-200: 240 10% 90%;      /* #E4E4EA — borders, separators */
  --neutral-300: 240 8% 82%;       /* #CFCFD6 — disabled state */
  --neutral-400: 240 5% 65%;       /* #A1A1AA — placeholder text */
  --neutral-500: 240 4% 46%;       /* #71717A — secondary text */
  --neutral-600: 240 5% 34%;       /* #52525B — body text */
  --neutral-700: 240 6% 20%;       /* #3F3F46 — emphasized text */
  --neutral-800: 240 6% 14%;       /* #27272A — headings */
  --neutral-900: 240 6% 10%;       /* #18181B — high-emphasis */
  --neutral-950: 240 10% 4%;       /* #09090B — maximum contrast */
}
```

**Note:** The subtle warm-purple tint (hue 240) in the neutral scale creates visual harmony with the warm indigo primary. This is the Apple approach — neutrals are never truly gray; they are tinted toward the brand.

### Dark Mode Overrides

```css
.dark {
  /* Surface system — 5 elevation layers */
  --surface-base:       240 15% 6%;     /* #0E0E12 — page background */
  --surface-raised:     240 12% 9%;     /* #141418 — card level 1 */
  --surface-overlay:    240 10% 12%;    /* #1C1C22 — card level 2, modals */
  --surface-elevated:   240 8% 16%;     /* #262630 — popovers, tooltips */
  --surface-spotlight:  240 6% 20%;     /* #303040 — active/selected items */

  /* Dark mode borders are subtle, not visible lines */
  --border-subtle:      240 10% 14%;    /* barely visible separation */
  --border-default:     240 8% 18%;     /* standard card border */
  --border-emphasis:    240 6% 24%;     /* interactive borders */

  /* Dark mode text */
  --text-primary:       0 0% 95%;       /* #F2F2F2 */
  --text-secondary:     240 5% 65%;     /* #A1A1AA */
  --text-tertiary:      240 4% 46%;     /* #71717A */
  --text-quaternary:    240 5% 34%;     /* #52525B */
}
```

### Gradient System

```css
/* RULE: Use gradients sparingly. Maximum 2 gradient elements per viewport. */

/* Primary gradient — hero CTAs, premium badges only */
.gradient-primary {
  background: linear-gradient(135deg,
    hsl(245 58% 51%) 0%,
    hsl(258 65% 48%) 50%,
    hsl(270 55% 45%) 100%
  );
}

/* Accent gradient — achievement moments, upgrade prompts */
.gradient-accent {
  background: linear-gradient(135deg,
    hsl(38 92% 50%) 0%,
    hsl(28 90% 48%) 100%
  );
}

/* Surface gradient — subtle depth on page backgrounds */
.gradient-surface-light {
  background: linear-gradient(180deg,
    hsl(var(--neutral-50)) 0%,
    hsl(var(--neutral-25)) 100%
  );
}

.gradient-surface-dark {
  background: linear-gradient(180deg,
    hsl(var(--surface-raised)) 0%,
    hsl(var(--surface-base)) 100%
  );
}

/* Mesh gradient — onboarding hero, splash only */
.gradient-mesh {
  background:
    radial-gradient(ellipse at 20% 50%, hsl(245 58% 51% / 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, hsl(270 55% 45% / 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, hsl(38 92% 50% / 0.08) 0%, transparent 50%);
}

/* REMOVE: apice-gradient-card, apice-gradient-surface, glow-primary, glow-gold,
   text-glow-primary, animate-orb-drift, animate-gradient.
   These create visual noise. */
```

### Data Visualization Palette (Charts)

```css
:root {
  --chart-1: 245 58% 51%;    /* Primary — BTC, main allocation */
  --chart-2: 199 89% 48%;    /* Sky — ETH */
  --chart-3: 160 84% 39%;    /* Emerald — SOL */
  --chart-4: 38 92% 50%;     /* Amber — stablecoins */
  --chart-5: 270 55% 45%;    /* Purple — alt-coins */
  --chart-6: 350 89% 60%;    /* Rose — overflow category */
  --chart-7: 172 66% 50%;    /* Teal */
  --chart-8: 25 95% 53%;     /* Orange */
}
```

---

## B. TYPOGRAPHY SYSTEM

### Font Stack

```css
/* PRIMARY: Geist (by Vercel) — the modern Inter successor
   WHY: Same clarity as Inter but with more personality.
   Better number rendering for financial data.
   Tabular figures by default. Tighter, more contemporary. */

--font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;

/* DISPLAY: Geist at heavier weights
   WHY: Eliminate the Outfit dependency. One font family = one personality.
   Outfit's rounded terminals conflict with Geist/Inter's geometric precision. */

/* MONOSPACE (for financial figures): Geist Mono or JetBrains Mono */
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', monospace;
```

**Alternative if Geist is not viable:** Stay with Inter but upgrade to Inter Display for headings (same family, optical sizing for large text). This eliminates the Outfit mismatch while keeping a single system.

### Type Scale

| Token | Size | Line Height | Weight | Letter Spacing | Use Case |
|-------|------|-------------|--------|----------------|----------|
| `display-lg` | 36px / 2.25rem | 1.1 | 700 | -0.025em | Splash hero, total balance |
| `display` | 30px / 1.875rem | 1.15 | 700 | -0.02em | Page hero numbers |
| `h1` | 24px / 1.5rem | 1.2 | 600 | -0.015em | Page titles |
| `h2` | 20px / 1.25rem | 1.25 | 600 | -0.01em | Section headings |
| `h3` | 17px / 1.0625rem | 1.3 | 600 | -0.005em | Card titles |
| `h4` | 15px / 0.9375rem | 1.35 | 600 | 0 | Sub-headings |
| `body` | 15px / 0.9375rem | 1.5 | 400 | 0 | Default body text |
| `body-sm` | 13px / 0.8125rem | 1.45 | 400 | 0.005em | Compact body, table cells |
| `caption` | 12px / 0.75rem | 1.4 | 500 | 0.01em | Labels, metadata |
| `overline` | 11px / 0.6875rem | 1.3 | 600 | 0.06em | Section labels, categories (UPPERCASE) |
| `micro` | 10px / 0.625rem | 1.2 | 500 | 0.02em | Badges, timestamps |

### Weight Rules
- **400 (Regular):** Body text only. Never for headings.
- **500 (Medium):** Captions, labels, secondary emphasis. Button text for secondary/ghost variants.
- **600 (Semibold):** All headings (h1-h4), card titles, primary button text, tab labels.
- **700 (Bold):** Display sizes only (hero numbers, total balance). Never for body text.

### Number Display Rules
- **Financial amounts:** Always use `font-variant-numeric: tabular-nums` for alignment. Use monospace font for portfolio values.
- **Positive changes:** `success-500` color + "+" prefix
- **Negative changes:** `error-500` color + "-" prefix (no custom minus, use hyphen)
- **Currency:** Always show 2 decimal places for USD. Show up to 8 for crypto amounts.
- **Large numbers:** Use compact notation above 10,000 (e.g., $12.4K, $1.2M)

---

## C. SPACING & LAYOUT SYSTEM

### Base Unit: 4px

All spacing values must be multiples of 4px. The primary rhythm is 8px (2 units).

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `space-0` | 0 | Reset |
| `space-0.5` | 2px | Inline icon-to-text nudge |
| `space-1` | 4px | Tight gaps (badge padding-y) |
| `space-1.5` | 6px | Compact element spacing |
| `space-2` | 8px | Default inline gap, icon padding |
| `space-3` | 12px | Between related elements |
| `space-4` | 16px | Card internal padding, element groups |
| `space-5` | 20px | Section internal padding |
| `space-6` | 24px | Between sections within a page |
| `space-8` | 32px | Major section breaks |
| `space-10` | 40px | Page top padding |
| `space-12` | 48px | Page bottom (above nav) |
| `space-16` | 64px | Hero spacing |

### Page Layout

```
Max width: 430px (mobile container — keep current)
Page horizontal padding: 20px (space-5)
Page top padding: 24px (space-6) — after header/nav
Page bottom padding: 96px (space-24) — clearance for bottom nav

Between page sections: 24px (space-6)
Between section heading and content: 12px (space-3)
```

### Card Layout

```
Card padding: 16px (space-4) — REDUCE from current 20px (p-5)
Card header padding: 16px 16px 12px (top/sides/bottom)
Card content padding: 0 16px 16px (flush top, sides, bottom)
Card internal gap: 12px (space-3)
Card-to-card gap: 12px (space-3) — tighter than current for mobile density
```

### Component Gaps

```
Button group gap: 8px (space-2)
Form field gap: 16px (space-4)
Badge inline gap: 6px (space-1.5)
Icon + text gap: 8px (space-2)
List item gap: 1px (border separator) or 8px (with spacing)
Tab bar item gap: 0 (full-bleed segments)
```

---

## D. COMPONENT DESIGN TOKENS

### Border Radius Scale

```css
:root {
  --radius-none: 0;
  --radius-sm: 6px;          /* Badges, small chips, inline tags */
  --radius-md: 8px;          /* Buttons (default), inputs, small cards */
  --radius-lg: 12px;         /* Cards, modals, sheets */
  --radius-xl: 16px;         /* Hero cards, prominent CTAs */
  --radius-2xl: 20px;        /* Bottom sheet, splash elements */
  --radius-full: 9999px;     /* Pills, avatars, circular buttons */
}
```

**Key change:** Current `--radius: 1rem` (16px) makes everything feel puffy. The new default for cards is 12px, buttons 8px. This matches Apple's iOS 18 direction of slightly tighter radii that still feel soft.

### Shadow / Elevation Scale

```css
/* RULE: Shadows are ALWAYS neutral. Never tinted with brand color. */

:root {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  /* Use: Subtle separation for inputs, badges */

  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03);
  /* Use: Default card resting state */

  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03);
  /* Use: Card hover state, elevated cards */

  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.03);
  /* Use: Modals, sheets, dropdown menus */

  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.03);
  /* Use: Active drag targets, focused elements */
}

/* Dark mode: NO visible box shadows. Use border + background color for elevation. */
.dark {
  --shadow-xs: none;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: 0 0 0 1px hsl(var(--border-default));
  --shadow-xl: 0 0 0 1px hsl(var(--border-emphasis));
}
```

**REMOVE:** `apice-shadow-soft`, `apice-shadow-gold`, `apice-shadow-card`, `apice-shadow-elevated`, `glow-primary`, `glow-gold`, `glow-success`. These contribute to visual noise. Elevation in dark mode should come from surface color, not shadow.

### Animation / Transition Standards

```css
/* Timing functions */
--ease-default: cubic-bezier(0.2, 0, 0, 1);      /* Apple's default curve */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot for micro-interactions */
--ease-exit:    cubic-bezier(0.4, 0, 1, 1);         /* Quick exit */

/* Duration tokens */
--duration-instant:  100ms;   /* Hover color change, opacity toggle */
--duration-fast:     150ms;   /* Button press, checkbox toggle */
--duration-normal:   250ms;   /* Card expansion, sheet slide */
--duration-slow:     350ms;   /* Page transitions, modal entrance */
--duration-gentle:   500ms;   /* Hero animations, onboarding */
```

**Transition rules:**
- Color changes: `--duration-instant` with `--ease-default`
- Transform changes (scale, translate): `--duration-fast` with `--ease-spring`
- Layout changes (height, width): `--duration-normal` with `--ease-default`
- Entrance animations: `--duration-slow` with `--ease-default`
- Exit animations: `--duration-fast` with `--ease-exit`

**REMOVE these animations:** `orb-drift`, `gradient-shift`, `float`, `bar-glow`, `shimmer` (for general use). Keep shimmer only for skeleton loading states. Remove `pulse-ring` (use CSS `:focus-visible` ring instead).

### Icon Standards

| Context | Size | Stroke Width |
|---------|------|-------------|
| Navigation bar | 24px | 1.5px |
| Button inline icon | 16px | 2px |
| Card section icon | 20px | 1.75px |
| Feature icon (in circle) | 20px icon in 40px circle | 1.75px |
| Empty state illustration | 48px | 1.25px |
| Badge inline icon | 14px | 2px |

**Rule:** Always use Lucide icons. Remove all emoji usage from widget definitions. Replace with Lucide equivalents:
- `target` -> `<Target />`, `map` -> `<Map />`, `trophy` -> `<Trophy />`, `chart` -> `<TrendingUp />`, `lightbulb` -> `<Lightbulb />`, `zap` -> `<Zap />`, `gamepad` -> `<Gamepad2 />`, `analytics` -> `<BarChart3 />`, `robot` -> `<Bot />`

---

## E. INTERACTION PATTERNS

### Hover States (Desktop)
```css
/* Cards */
.card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: hsl(var(--primary-200));
  transition: all var(--duration-fast) var(--ease-default);
}

/* Buttons — primary */
.btn-primary:hover {
  filter: brightness(1.08);
  transition: filter var(--duration-instant) var(--ease-default);
}

/* List items */
.list-item:hover {
  background: hsl(var(--neutral-50));
  transition: background var(--duration-instant) var(--ease-default);
}
```

### Press/Active States
```css
/* Universal press feedback */
.interactive:active {
  transform: scale(0.97);
  transition: transform var(--duration-instant) var(--ease-spring);
}

/* Buttons get slightly darker */
.btn:active {
  filter: brightness(0.92);
}
```

### Focus States
```css
/* Keyboard navigation — visible ring */
:focus-visible {
  outline: 2px solid hsl(var(--primary-500));
  outline-offset: 2px;
  border-radius: inherit;
}

/* Touch — no visible ring */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Page Transitions

Use Framer Motion `AnimatePresence` with these defaults:

```tsx
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: {
    duration: 0.25,
    ease: [0.2, 0, 0, 1],
  },
};

// Forward navigation: slide from right
const forwardTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

// Backward navigation: slide from left
const backwardTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};
```

### Loading States — Skeleton Pattern

```tsx
/* Skeleton base — single shimmer animation, subtle */
.skeleton {
  background: hsl(var(--neutral-100));
  background-image: linear-gradient(
    90deg,
    hsl(var(--neutral-100)) 0%,
    hsl(var(--neutral-50)) 40%,
    hsl(var(--neutral-100)) 60%,
    hsl(var(--neutral-100)) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Skeleton rules:**
- Match the exact layout of the loaded content
- Financial amounts: use a 80px wide skeleton block
- Text lines: use varying widths (100%, 75%, 60%) for realism
- Charts: use a single rectangular skeleton matching chart dimensions
- Show skeleton for minimum 300ms to avoid flash

### Empty States

Every empty state MUST have:
1. An illustration icon (48px, `neutral-300` color)
2. A title (h3 weight, `neutral-800`)
3. A description (body-sm, `neutral-500`)
4. A primary action button

```tsx
<div className="flex flex-col items-center text-center py-12 px-6">
  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
    <WalletIcon className="w-6 h-6 text-neutral-400" />
  </div>
  <h3 className="text-h3 font-semibold text-neutral-800 mb-1">No assets yet</h3>
  <p className="text-body-sm text-neutral-500 mb-6 max-w-[260px]">
    Start your investment journey by connecting your exchange account.
  </p>
  <Button variant="default" size="default">Connect Exchange</Button>
</div>
```

### Error States

```tsx
/* Inline error (form validation) */
<p className="text-micro text-error-500 mt-1 flex items-center gap-1">
  <AlertCircle className="w-3 h-3" />
  Amount must be at least $5
</p>

/* Card-level error (data fetch failure) */
<Card className="border-error-500/20 bg-error-50">
  <CardContent className="flex items-center gap-3 py-3">
    <AlertTriangle className="w-5 h-5 text-error-500" />
    <div>
      <p className="text-body-sm font-medium">Failed to load portfolio</p>
      <button className="text-caption text-primary-500 mt-0.5">Retry</button>
    </div>
  </CardContent>
</Card>

/* Full-page error (critical failure) */
/* Same pattern as empty state but with error icon and retry action */
```

---

## F. PAGE-BY-PAGE REDESIGN RECOMMENDATIONS

### F1. HOME PAGE

**Current problems:**
- Widget system with emoji icons looks amateurish
- Too many widgets competing for attention (9 widget types)
- Greeting + time-based welcome is nice but underdeveloped
- No clear visual hierarchy between primary and secondary content

**Redesign approach:**

```
LAYOUT (top to bottom):
------------------------------------------------------
[Status Bar — system]
------------------------------------------------------
  Greeting + Avatar                    [Settings gear]
  "Good morning, Luis"
------------------------------------------------------
  BALANCE HERO CARD  (24px border-radius, gradient bg)
  ┌──────────────────────────────────────────────┐
  │  Total Balance                               │
  │  $12,847.32          +2.4% (24h)            │
  │  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔ mini sparkline ▔▔▔▔▔▔▔▔   │
  │                                              │
  │  [Deposit]  [Withdraw]  [DCA]                │
  └──────────────────────────────────────────────┘
------------------------------------------------------
  WEEKLY STREAK BANNER (subtle, dismissible)
  "Week 7 streak — $175 invested this month"
------------------------------------------------------
  SECTION: Your Journey          [See all ->]
  ┌─────────────┐ ┌─────────────┐
  │ Mission 1   │ │ Mission 2   │  <- horizontal scroll
  │ ████░░ 60%  │ │ ░░░░░░ 0%  │
  └─────────────┘ └─────────────┘
------------------------------------------------------
  SECTION: Quick Actions
  [Connect Exchange] [Start DCA] [Invite Friend]
  <- icon + label chips, horizontal row
------------------------------------------------------
  SECTION: Market Movers          [View all ->]
  ┌────────────────────────────────────────────┐
  │ BTC  $67,234   +1.2%                      │
  │ ETH  $3,456    -0.8%                      │
  │ SOL  $142      +5.3%                      │
  └────────────────────────────────────────────┘
------------------------------------------------------
  SECTION: Daily Insight
  ┌────────────────────────────────────────────┐
  │ 💡 "BTC holding above 200-day MA..."      │
  │      [Read more]                           │
  └────────────────────────────────────────────┘
------------------------------------------------------
  [96px bottom nav clearance]
```

**Key changes:**
1. **Reduce widgets from 9 to 5 visible sections.** The widget customizer is premature for an early-stage product. Ship a curated experience first.
2. **Balance hero gets the prime position** with inline quick actions (Deposit, Withdraw, DCA).
3. **Streak banner** replaces the separate weekly deposit widget. It is contextual and dismissible.
4. **Missions** become horizontal scroll cards, not vertical stack. This saves vertical space.
5. **Market Movers** is a simple list, not a full component. Coin logos + price + 24h change.
6. **Remove:** Gamification widget from home (move to dedicated Profile/Levels page), Portfolio Analytics (belongs in Portfolio), Copy Trading Status (belongs in Automations).

### F2. PORTFOLIO PAGE

**Current problems:**
- Tabs (overview/strategies/history) add cognitive load before the user sees value
- Weekly investment editing inline is cluttered
- Too many sub-components pulled in (AllocationEngine, ActionPlanWidget, etc.)

**Redesign approach:**

```
LAYOUT:
------------------------------------------------------
  "Portfolio"                      [Flame] 7-week streak
------------------------------------------------------
  BALANCE CARD (same design language as Home hero)
  ┌──────────────────────────────────────────────┐
  │  Portfolio Value                              │
  │  $8,432.18            +12.4% all time        │
  │                                              │
  │  Weekly DCA: $25/week    [Edit]              │
  └──────────────────────────────────────────────┘
------------------------------------------------------
  DONUT CHART (allocation visualization)
  ┌──────────────────────────────────────────────┐
  │        ╭──────╮                              │
  │       ╱  BTC   ╲     BTC  45%  $3,794       │
  │      │  45%    │     ETH  30%  $2,530       │
  │       ╲       ╱     SOL  15%  $1,265       │
  │        ╰──────╯     USDT 10%    $843       │
  └──────────────────────────────────────────────┘
------------------------------------------------------
  SECTION: Holdings
  ┌────────────────────────────────────────────┐
  │ [BTC logo] Bitcoin                         │
  │ 0.0565 BTC    $3,794    +8.2%             │
  ├────────────────────────────────────────────┤
  │ [ETH logo] Ethereum                        │
  │ 0.732 ETH     $2,530    +15.1%            │
  ├────────────────────────────────────────────┤
  │ ...                                        │
  └────────────────────────────────────────────┘
------------------------------------------------------
  SECTION: Performance
  ┌────────────────────────────────────────────┐
  │ [1D] [1W] [1M] [3M] [1Y] [All]           │
  │                                            │
  │ ~~~~~ area chart with gradient fill ~~~~~  │
  │                                            │
  │ Total invested: $6,200                     │
  │ Current value:  $8,432   (+$2,232)        │
  └────────────────────────────────────────────┘
------------------------------------------------------
  SECTION: DCA Plans                [Manage ->]
  ┌────────────────────────────────────────────┐
  │ Weekly BTC+ETH     Active                  │
  │ $25/week   Next: Monday                    │
  └────────────────────────────────────────────┘
------------------------------------------------------
```

**Key changes:**
1. **Remove tabs.** All important information is on one scrollable page, organized into clear sections.
2. **Donut chart** is the anchor visualization. Clean, Apple Fitness-inspired ring chart.
3. **Holdings table** is straightforward: logo + name + amount + value + change.
4. **Performance chart** with time-range toggle. Area chart with subtle gradient fill using `primary-500` with 10% opacity.
5. **DCA Plans** summary at bottom links to DCA Planner page.

### F3. DCA PLANNER

**Current problems:**
- Wizard pattern (amount -> assets -> schedule -> review) is solid but the steps feel disconnected
- Too much UI chrome per step

**Redesign approach:**

```
WIZARD FLOW (4 steps with progress indicator):

Step indicator: ● ● ○ ○  "Step 2 of 4"

STEP 1: Amount
  "How much per week?"
  ┌──────────────────────────────────────────┐
  │     ←  [ $25 ]  →                       │  <- large stepper
  │                                          │
  │  $10   $25   $50   $100   Custom        │  <- quick-select chips
  │                                          │
  │  "That's $100/month or $1,200/year"     │  <- contextual math
  └──────────────────────────────────────────┘
  [Continue]

STEP 2: Assets
  "What would you like to invest in?"
  ┌──────────────────────────────────────────┐
  │  [BTC] Bitcoin          [60%] ████████░░ │
  │  [ETH] Ethereum         [30%] █████░░░░░ │
  │  [SOL] Solana           [10%] ██░░░░░░░░ │
  │                                          │
  │  [+ Add asset]                           │
  └──────────────────────────────────────────┘
  "Recommended: 60/30/10 for moderate risk"
  [Continue]

STEP 3: Schedule
  ┌──────────────────────────────────────────┐
  │  Frequency:  [Weekly ▾]                  │
  │  Day:        [Monday ▾]                  │
  │  Duration:   [Forever] / [90 days]       │
  └──────────────────────────────────────────┘
  [Continue]

STEP 4: Review
  ┌──────────────────────────────────────────┐
  │  YOUR DCA PLAN                           │
  │                                          │
  │  $25/week on Mondays                     │
  │  BTC 60% • ETH 30% • SOL 10%           │
  │  Running forever                         │
  │                                          │
  │  First purchase: Next Monday             │
  │  Monthly total: ~$100                    │
  │  Annual total: ~$1,200                   │
  └──────────────────────────────────────────┘
  [Start DCA Plan]  <- gradient-primary button
```

**Key changes:**
1. **Numbered progress dots** at the top, not a complex stepper.
2. **Each step is a single focused question.** No secondary content.
3. **Quick-select chips** for amount reduce friction.
4. **Allocation sliders** are visual (progress bar style), not just numbers.
5. **Review step** shows human-readable summary. Confirm and done.

### F4. SETTINGS PAGE

**Current problems:**
- Long flat list of options with no grouping
- Bybit connection modal is complex but critical
- Too many icons fighting for attention

**Redesign approach:**

```
LAYOUT:
------------------------------------------------------
  [Avatar circle]
  "Luis Zanetti"
  "Free Plan"   [Upgrade to Pro ->]
------------------------------------------------------
  SECTION: Account
  ┌────────────────────────────────────────────┐
  │ Personal Information              [>]     │
  ├────────────────────────────────────────────┤
  │ Investor Profile                  [>]     │
  ├────────────────────────────────────────────┤
  │ Connected Exchanges               [>]     │  <- Bybit connection lives here
  └────────────────────────────────────────────┘

  SECTION: Preferences
  ┌────────────────────────────────────────────┐
  │ Notifications                     [>]     │
  ├────────────────────────────────────────────┤
  │ Appearance         Dark mode  [toggle]    │
  ├────────────────────────────────────────────┤
  │ Language                   English [>]    │
  └────────────────────────────────────────────┘

  SECTION: Support
  ┌────────────────────────────────────────────┐
  │ Help Center                       [>]     │
  ├────────────────────────────────────────────┤
  │ Contact Support                   [>]     │
  ├────────────────────────────────────────────┤
  │ About Apice Capital               [>]     │
  └────────────────────────────────────────────┘

  SECTION: Danger Zone
  ┌────────────────────────────────────────────┐
  │ Reset All Data                    [>]     │  <- destructive-foreground text
  ├────────────────────────────────────────────┤
  │ Sign Out                          [>]     │
  └────────────────────────────────────────────┘
------------------------------------------------------
```

**Key changes:**
1. **Profile card at top** with avatar, name, plan badge. Upgrade CTA is prominent.
2. **Grouped into 4 sections** with clear labels: Account, Preferences, Support, Danger Zone.
3. **Consistent list item pattern:** label on left, chevron-right or toggle on right. No icons in the list items (the section headings provide context).
4. **Bybit connection** is nested under "Connected Exchanges" rather than being a button on the main settings page.
5. **Danger zone** is visually separated (last section, subtle destructive text color).

### F5. ONBOARDING FLOW

**Current onboarding pages:** Splash, Welcome, Quiz, ProfileResult, InvestmentOnboarding, ApiceOnboarding

**Redesign approach:**

```
FLOW (5 screens, ~90 seconds total):

SCREEN 1: Splash (auto-advance after 2s)
  ┌──────────────────────────────────────────┐
  │                                          │
  │          [Apice Logo]                    │
  │                                          │
  │     gradient-mesh background             │
  │     fade-in animation                    │
  └──────────────────────────────────────────┘

SCREEN 2: Welcome (value proposition)
  ┌──────────────────────────────────────────┐
  │                                          │
  │  "Build wealth with                      │
  │   consistent investing"                  │
  │                                          │
  │  • Automated DCA strategies              │
  │  • Portfolio tracking                    │
  │  • Learn as you invest                   │
  │                                          │
  │  [Get Started]                           │
  │  Already have an account? [Sign in]      │
  └──────────────────────────────────────────┘

SCREEN 3: Quiz (3 questions, one per sub-screen)
  ┌──────────────────────────────────────────┐
  │  ● ● ○  Question 2 of 3                 │
  │                                          │
  │  "How would you react to a 20%           │
  │   drop in your portfolio?"               │
  │                                          │
  │  ┌───────────────────────────────┐       │
  │  │  Buy more at lower prices     │       │
  │  └───────────────────────────────┘       │
  │  ┌───────────────────────────────┐       │
  │  │  Hold and wait                │       │
  │  └───────────────────────────────┘       │
  │  ┌───────────────────────────────┐       │
  │  │  Sell some to reduce risk     │       │
  │  └───────────────────────────────┘       │
  └──────────────────────────────────────────┘

SCREEN 4: Profile Result
  ┌──────────────────────────────────────────┐
  │                                          │
  │  "You're a                               │
  │   Balanced Investor"                     │
  │                                          │
  │  [Profile icon in accent circle]         │
  │                                          │
  │  "You blend growth potential with        │
  │   measured risk management."             │
  │                                          │
  │  Suggested allocation:                   │
  │  BTC 50% / ETH 30% / SOL 20%           │
  │                                          │
  │  [Start Investing]                       │
  └──────────────────────────────────────────┘

SCREEN 5: Connect Exchange (optional, skippable)
  ┌──────────────────────────────────────────┐
  │                                          │
  │  "Connect your Bybit account"            │
  │                                          │
  │  [Shield icon]                           │
  │  "Read-only access. We never trade       │
  │   without your confirmation."            │
  │                                          │
  │  [Connect Bybit]                         │
  │  [Skip for now]                          │
  └──────────────────────────────────────────┘
```

**Key changes:**
1. **Reduce to 5 focused screens.** Current flow has too many intermediate states.
2. **Quiz is 3 questions max** (risk tolerance, investment experience, goal). One question per screen with large tap targets.
3. **Profile result** immediately provides a concrete portfolio suggestion. This bridges quiz to action.
4. **Exchange connection** is a soft CTA. "Skip for now" is equally prominent to avoid pressure.
5. **Trust signals** on the exchange connection screen: read-only badge, no-trade-without-confirmation text.

---

## G. IMPLEMENTATION PRIORITY

### Phase 1 — Foundation (Week 1)
1. Replace CSS variable system with new color tokens
2. Update tailwind.config.ts with new spacing, radius, shadow scales
3. Swap font from Outfit to Geist (or Inter Display)
4. Update Card, Button, Badge components with new tokens

### Phase 2 — Core Pages (Week 2)
5. Redesign Home page layout (remove widget customizer, implement hero card)
6. Redesign Portfolio page (single scroll, no tabs)
7. Redesign Settings page (grouped sections)

### Phase 3 — Flows (Week 3)
8. Redesign DCA Planner wizard
9. Redesign Onboarding flow (5 screens)
10. Add skeleton loading states to all data-dependent pages

### Phase 4 — Polish (Week 4)
11. Implement page transitions (Framer Motion)
12. Add empty states to all list/data views
13. Replace all emoji icons with Lucide components
14. Audit and remove unused CSS (glow, orb-drift, etc.)
15. Accessibility pass: focus states, color contrast (WCAG AA), touch targets (44px min)

---

## H. CSS CLEANUP CHECKLIST

### REMOVE from index.css:
- [ ] `.glow-primary`, `.glow-gold`, `.glow-success`
- [ ] `.text-glow-primary`
- [ ] `.apice-shadow-soft`, `.apice-shadow-gold`
- [ ] `.apice-gradient-card`, `.apice-gradient-surface`
- [ ] `@keyframes orb-drift`, `@keyframes gradient-shift`, `@keyframes float`
- [ ] `@keyframes bar-glow`
- [ ] `.animate-orb-drift`, `.animate-float`, `.animate-gradient`
- [ ] `.animate-pulse-ring`, `.animate-pulse-dot` (replace with CSS focus ring)
- [ ] `.stagger-children` (replace with Framer Motion staggerChildren)

### KEEP (refined):
- [x] `.glass-card`, `.glass-nav` (but reduce blur from 24px/28px to 16px/20px)
- [x] `.press-scale` (keep but simplify timing)
- [x] `.scrollbar-hide`, `.scroll-smooth`
- [x] `.safe-bottom`, `.safe-top`
- [x] `@keyframes fade-in`, `fade-up`, `scale-in`, `slide-up`
- [x] `.progress-ring-circle`

### ADD:
- [ ] `.skeleton` with `skeleton-shimmer` keyframe
- [ ] New shadow scale CSS variables
- [ ] New surface elevation CSS variables (dark mode)
- [ ] Tabular number utility: `.tabular-nums { font-variant-numeric: tabular-nums; }`
- [ ] Monospace number utility: `.mono-nums { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }`

---

*This specification should be treated as the single source of truth for the Apice Capital redesign. All implementation work references this document.*
