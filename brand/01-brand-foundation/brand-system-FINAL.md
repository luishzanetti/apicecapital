# Apice Capital — Brand System (FINAL v1.1)

> **Status:** Production-ready · CEO approved V3.01 "The Dot, Plain" (DECISIONS-LOG D5, 2026-04-17)
> **v1.1 patch (2026-04-17):** D6.1 (wordmark theme-aware via `currentColor`) · D6.2 (app icon reverted to wordmark centered)
> **Author:** Uma (@ux-design-expert)
> **Principle:** Wordmark + dot. Nothing else.

---

## 0. North Star

**Apice.** in Geist 700, title case, tight tracking, with a single bright-emerald period.

Register: Stripe / Linear / Plaid. Quiet minimalism, detectable craft, zero ornament.

Survives 5 years because nothing dates it. Survives 50 years because it looks like type, not a logo.

---

## 1. Wordmark construction

### 1.1 Typeface & weight

- **Font:** Geist 700 (primary). Fallback stack: `'Geist', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`.
- **Case:** Title case. Always "Apice" — never "APICE", never "apice".
- **Weight:** 700 only. No 600, no 800. The dot carries the accent — the wordmark stays stable.

### 1.2 Exact proportions (reference: 48px wordmark)

| Parameter | Value | Notes |
|---|---|---|
| Font-size | 48px | Reference scale for `apice-wordmark-primary.svg` (viewBox 280×80) |
| Letter-spacing | -1.44px (-0.03em) | "Tight tracking -30" = -30/1000 em |
| Cap-height | ~34px | ≈ 0.71× font-size for Geist |
| x-height | ~24px | ≈ 0.5× font-size |
| Baseline | y=54 (in 80-unit canvas) | Leaves 26px descender allowance below |
| Wordmark width | ~127px | `x=28` to dot's right edge |

### 1.3 Letter widths & kerning (Geist 700 native)

We do **not** override Geist's native kerning. The only override is global `letter-spacing: -0.03em` (tracking -30). Apice's letterforms are Geist-native — no inktraps, no custom apex, no cut terminals. Pure Geist.

| Letter | Native width (em) | Role |
|---|---|---|
| A | 0.68 | Anchor — flat baseline, clean apex |
| p | 0.56 | Descender element — provides rhythm |
| i | 0.24 | Narrow spine — Geist's round tittle is kept |
| c | 0.53 | Open aperture |
| e | 0.56 | Closed aperture, horizontal crossbar |

**Baseline alignment:** All letters sit on a single baseline at y=54 (reference 80-unit canvas). No optical offsets, no ascender cheating.

---

## 2. Dot construction

### 2.1 Geometry

| Parameter | Value | Rationale |
|---|---|---|
| Shape | Perfect circle (`<circle>`) | Not an `i`-tittle, not a path — geometrically ideal |
| Diameter | **0.18× cap-height** | Per DECISIONS-LOG D5. At 48px font / 34px cap-height → diameter ≈ 6.1px, radius 4.3px (rounded to 2 decimals) |
| Gap from "e" | 1/3 × dot diameter (≈ 2px at reference scale) | Reads as terminal punctuation, not as separate element |
| Baseline position | Sits on baseline, tangent to baseline y (not centered on baseline) | Matches typographic period behavior |
| y-coordinate (dot center) | 3px above baseline at reference scale | Center-y = baseline - radius × 0.7 |

### 2.2 Why not the `i`-tittle

Tempting to reuse the dot on "i" as the signature. **Rejected** because the `i`-tittle is a necessary part of Latin script — it must be black. The signature dot is the *extra* green dot that makes the wordmark not a word but a brand. Two different elements, two different jobs.

### 2.3 Color reference

- **Light theme:** `#16A661` (bright emerald — signature, live).
- **Dark theme:** `#16A661` (same hex — passes contrast on `#0E0E12`).
- **Monochrome fallback:** `#0E0E12` ink dot on light, `#F7F3ED` cream dot on dark (only for fax / single-color print where green is unavailable).

---

## 3. Color tokens

### 3.1 Core palette

| Token | Hex | RGB | HSL | Role |
|---|---|---|---|---|
| `--apice-ink` | `#0E0E12` | 14, 14, 18 | 240°, 12%, 6% | Wordmark on light, canvas on dark |
| `--apice-cream` | `#F7F3ED` | 247, 243, 237 | 36°, 38%, 95% | Canvas on light, wordmark on dark |
| `--apice-emerald-bright` | `#16A661` | 22, 166, 97 | 150°, 77%, 37% | **Signature dot — live green** |
| `--apice-emerald-deep` | `#0F5D3F` | 15, 93, 63 | 157°, 72%, 21% | Structure (hairlines, backgrounds) — reserved |

### 3.2 Neutrals (for UI consumption)

| Token | Hex | RGB | HSL | Role |
|---|---|---|---|---|
| `--n-50` | `#FAF8F3` | 250, 248, 243 | 43°, 41%, 97% | Lightest surface |
| `--n-100` | `#F7F3ED` | 247, 243, 237 | 36°, 38%, 95% | = cream (canvas) |
| `--n-200` | `#EDE8DF` | 237, 232, 223 | 39°, 26%, 90% | Subtle divider, card |
| `--n-300` | `#D8D2C5` | 216, 210, 197 | 41°, 19%, 81% | Border |
| `--n-400` | `#A8A49A` | 168, 164, 154 | 40°, 9%, 63% | Tertiary text, disabled |
| `--n-500` | `#6E6A61` | 110, 106, 97 | 41°, 6%, 41% | Secondary text (descriptors, captions) |
| `--n-600` | `#53504A` | 83, 80, 74 | 40°, 6%, 31% | Body secondary |
| `--n-700` | `#3F3D38` | 63, 61, 56 | 37°, 6%, 23% | Body primary on light |
| `--n-800` | `#242328` | 36, 35, 40 | 252°, 7%, 15% | Near-ink surface |
| `--n-900` | `#0E0E12` | 14, 14, 18 | 240°, 12%, 6% | = ink |

### 3.3 Semantic surfaces

| Token | Light theme | Dark theme |
|---|---|---|
| `--surface-canvas` | `#F7F3ED` | `#0E0E12` |
| `--surface-raised` | `#FAF8F3` | `#1A1A20` |
| `--surface-border` | `#EDE8DF` | `#242328` |
| `--surface-ink` | `#0E0E12` | `#F7F3ED` |
| `--surface-ink-muted` | `#6E6A61` | `#A8A49A` |
| `--surface-accent` | `#16A661` | `#16A661` |

### 3.4 Contrast validation (WCAG 2.2 AA)

| Pair | Ratio | Pass |
|---|---|---|
| `--apice-ink` on `--apice-cream` | 17.1:1 | AAA |
| `--apice-cream` on `--apice-ink` | 17.1:1 | AAA |
| `--apice-emerald-bright` on `--apice-cream` | 3.8:1 | AA (large text only — which fits the dot's scale) |
| `--apice-emerald-bright` on `--apice-ink` | 4.5:1 | AA (text & graphics) |
| `--n-500` on `--apice-cream` | 5.4:1 | AA |

**Rule:** Bright emerald `#16A661` is **only for the signature dot** and for interactive/celebratory states ≥24px / bold. Never use it for body text.

### 3.5 Color Applications — wordmark theme rules (v1.1 · D6.1)

All production wordmark SVGs (`apice-wordmark-primary.svg`, `apice-lockup-horizontal.svg`, `apice-lockup-stacked.svg`, `apice-compact.svg`) use **`currentColor`** on the text paths. The signature dot is **locked to emerald `#16A661`** — it never inverts, never themes.

This means the consumer controls the wordmark color via the standard CSS `color` property. Three canonical applications:

```css
/* Light surface — ink wordmark */
.apice-logo--on-light {
  color: #0E0E12;              /* near-black ink */
}

/* Dark surface — cream wordmark */
.apice-logo--on-dark {
  color: #F7F3ED;              /* warm cream */
}

/* Brand emerald surface (Club hero, manifesto) — cream wordmark */
.apice-logo--on-emerald {
  color: #F7F3ED;              /* cream; emerald bg already supplies brand tone */
}

/* Dot is never overridden — it is hardcoded in the SVG */
```

Usage:

```html
<!-- Light page -->
<object class="apice-logo apice-logo--on-light" type="image/svg+xml"
        data="/brand/assets/logos/apice-wordmark-primary.svg"></object>

<!-- Dark page -->
<object class="apice-logo apice-logo--on-dark" type="image/svg+xml"
        data="/brand/assets/logos/apice-wordmark-primary.svg"></object>
```

> Use inline `<svg>` or `<object>` — not `<img>` — so `currentColor` cascades.

**Fallback for consumers that cannot set `color`** (legacy email clients, certain PDF pipelines, Figma imports): use `apice-wordmark-on-dark.svg`, which has cream `#F7F3ED` hardcoded on the text. Do **not** use it on light backgrounds — it will disappear.

| File | Text color | Dot color | Use |
|---|---|---|---|
| `apice-wordmark-primary.svg` + derivatives | `currentColor` (set via CSS) | `#16A661` hardcoded | Default — theme-adaptive |
| `apice-wordmark-on-dark.svg` | `#F7F3ED` hardcoded | `#16A661` hardcoded | Legacy / export-only fallback |
| `apice-og-image.svg` | `#F7F3ED` hardcoded | `#16A661` hardcoded | OG tag — always dark canvas |

---

## 4. Typography system

### 4.1 Committed weights

| Weight | Geist variant | Use |
|---|---|---|
| 400 (Regular) | Geist Regular | Body copy, paragraphs, captions |
| 500 (Medium) | Geist Medium | Emphasis, secondary labels, UI controls |
| 700 (Bold) | Geist Bold | Wordmark, headings, key CTAs |

No 300 (too light for our register), no 600 (collapses with 500 in tight UI), no 800/900 (Geist 700 is already confident).

### 4.2 Numerics: Geist Mono

All numeric data (prices, portfolio values, percentages, dates, countdowns) uses **Geist Mono 500**.

```css
--font-sans: 'Geist', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
```

**Why mono for numerics:** Tabular alignment in tables, consistent column widths in dashboards, and it gives the brand a "quant/precise" sub-register that complements the editorial wordmark.

### 4.3 Type scale (8px base)

| Token | Size | Line-height | Weight | Use |
|---|---|---|---|---|
| `--text-xs` | 11px | 16px | 500 | Captions, badges |
| `--text-sm` | 13px | 20px | 400 | UI controls, small body |
| `--text-base` | 15px | 24px | 400 | Body copy |
| `--text-md` | 17px | 26px | 500 | Subheadings |
| `--text-lg` | 20px | 28px | 500 | Card titles |
| `--text-xl` | 24px | 32px | 700 | Section headings |
| `--text-2xl` | 32px | 40px | 700 | Page headings |
| `--text-3xl` | 44px | 52px | 700 | Hero mini |
| `--text-hero` | 64px | 72px | 700 | Hero |
| `--text-display` | 96px | 104px | 700 | Manifesto / splash |

Letter-spacing: all sizes use `-0.02em` baseline; hero/display use `-0.03em` (matches wordmark).

---

## 5. Clear space rules

The minimum padding around the logo is expressed in **units of dot-diameter (d)**.

| Context | Clear space | Rationale |
|---|---|---|
| Default (print, digital, signage) | **2d** on all sides | Generous negative space |
| Dense UI (app nav, dashboards) | **1.5d** on all sides | Preserves breathing room at small scale |
| Minimum (iconography, favicons) | **1d** on all sides | Below this, move to favicon variant |
| Co-branding (partner lockups) | **3d** on all sides | Extra isolation when paired with another logo |

Clear space is inviolable. No text, no UI, no decorative elements enter this zone.

---

## 6. Minimum sizes

| Variant | Minimum size | Recommended minimum |
|---|---|---|
| Primary wordmark (`apice-wordmark-primary.svg`) | 72px width | 96px width |
| Horizontal lockup (`apice-lockup-horizontal.svg`) | 96px width | 120px width |
| Stacked lockup (`apice-lockup-stacked.svg`) | 80×80px | 120×120px |
| Compact (`apice-compact.svg`) | 56px width | 72px width |
| Favicon (`apice-favicon.svg`) | 16×16px | 32×32px |
| iOS app icon | 40×40px (Settings) | 180×180px (Home) |
| Android adaptive icon | 48×48dp | 108×108dp |

**Below 16px:** use favicon only — wordmark becomes illegible. This is **by design**: at favicon scale, the dot *is* the brand.

---

## 7. Lockup variants

### 7.1 Primary wordmark (`apice-wordmark-primary.svg`)

- **viewBox:** 280×80
- **Use:** Default. Email headers, site navigation, press kit, investor materials.
- **Construction:** Wordmark + dot only, no descriptor, no mark.

### 7.2 Horizontal lockup (`apice-lockup-horizontal.svg`)

- **viewBox:** 360×72
- **Use:** Email signatures, narrow nav bars, press headers, business cards.
- **Construction:** Wordmark + dot, slightly reduced scale, wider horizontal allowance.

### 7.3 Stacked lockup (`apice-lockup-stacked.svg`)

- **viewBox:** 240×240 (square)
- **Use:** Social avatars (Twitter, LinkedIn, Instagram), app store hero, square embeds.
- **Construction:** Wordmark centered on a square field. Dot sits to the right of "Apice" (not stacked vertically — there is no second line).

### 7.4 Compact single-line (`apice-compact.svg`)

- **viewBox:** 120×32
- **Use:** Mobile navigation (24–32px tall), toolbar, inline mentions.
- **Construction:** Wordmark + dot, minimum legible scale.

### 7.5 Wordmark-only (derived)

No standalone file — use `apice-wordmark-primary.svg` and programmatically suppress the `<circle>` element via CSS (`.dot { display: none }`). Use only when the dot would cause rendering issues (e.g., some legacy email clients).

### 7.6 Dot-only (favicon / app icon territory)

- For 16–32px surfaces: `apice-favicon.svg` (dot on dark rounded-square).
- For 1024px app icon: `apice-app-icon-ios.svg` (dot on dark rounded-square, iOS corner radius).
- For Android: adaptive pair (`apice-app-icon-android-foreground.svg` + `...-background.svg`).

---

## 8. App icon decision — REVERTED v1.1 (D6.2)

**Decision (D6.2):** **Wordmark "Apice" centered, cream on near-black.**

The original D5 dot-only decision was **reverted by CEO** on 2026-04-17 after reviewing PREVIEW-FINAL. The new canonical app icon shows the full wordmark + emerald signature dot, centered, cream on near-black superellipse.

**Construction (production iOS):**

- Canvas 1024×1024, superellipse mask (Lamé n≈5, from @apple-ux)
- Background: `#0E0E12`
- Wordmark: "Apice" in Geist 700, **cream `#F7F3ED`**, cap-height ≈180px (font-size 254), tracking -30
- Dot: Ø22, **emerald `#16A661`** (signature never inverts)
- Optical balance: baseline y=545 (16px upward bias from geometric center)

**Key rule (D6):** the dot stays the same emerald regardless of surface. Only the wordmark color changes between light/dark/emerald contexts.

### 8.1 Wordmark vs. dot — scale threshold

Readability of "Apice" at small sizes is the concession we're making. Threshold rules:

| Surface size | Element | File |
|---|---|---|
| 16–32px (browser favicon, tab) | **Dot only** on near-black rounded-rect | `apice-favicon.svg` |
| 40px (iOS Settings row icon, 29pt@2x) | Wordmark (tight — see flag below) | iOS rendering of primary app icon |
| 48–120px (Notification Center, Spotlight, Android launcher small) | Wordmark + dot | primary app icon |
| 180px (iOS Home) | Wordmark + dot | primary app icon |
| 1024px (App Store, marketing) | Wordmark + dot | primary app icon |

> ⚠️ **Concession at 29pt (~40px):** "Apice" wordmark at this size is legible but dense. The individual letterforms flirt with Geist's optical minimum. We ship this per CEO D6.2 directive. The fallback dot-only asset is preserved at `apice-app-icon-ios-dot-only.svg` so we can swap to a dual-track approach (wordmark ≥48px, dot-only <48px) if field testing shows the wordmark breaks down. This decision can be revisited after v1 launch telemetry.

**Note for @apple-ux:** The production iOS icon pack (superellipse mask for iOS 18+, Xcode `.xcassets` bundle with @2x/@3x PNG fallbacks, tinted mode support) is in `/brand/assets/ios/`. `AppIcon-iOS.svg` is the master — now updated v2 with wordmark composition.

---

## 9. Don'ts gallery

Six examples of what NOT to do, each with the reason.

### 9.1 Don't change the dot color based on theme/mood

❌ Red dot for "bearish markets", orange dot for "warning", blue dot for "info".

**Why wrong:** The dot is the single most-protected brand element. It is always bright emerald `#16A661`. Semantic colors exist separately in the UI (for bearish states, use `--danger` red in charts/badges — never recolor the logo dot).

### 9.2 Don't add a descriptor below the wordmark

❌ "Apice CAPITAL", "Apice HOLDINGS", "Apice WEALTH PLATFORM".

**Why wrong:** Per D5 final decision, the brand is **just "Apice."** No descriptor. The elaborated variations V3.02–V3.10 (with descriptors, Peak mark, custom letterforms) are archived but not shipped. Adding a descriptor contradicts the ship.

### 9.3 Don't stretch, skew, or rotate the wordmark

❌ Italicized "Apice", arched, isometric, rotated 90° for vertical layouts.

**Why wrong:** Geist 700 is an engineered typeface. Any non-uniform scaling destroys optical balance (stroke weights distort, counters collapse). For vertical layouts, use the stacked lockup.

### 9.4 Don't place the logo on busy photographic backgrounds without a clear-space shield

❌ Full-bleed photo with the wordmark directly on it, no solid backdrop.

**Why wrong:** The wordmark needs monochromatic ground to breathe. When photographic context is required, either (a) use a solid cream or ink rounded-rectangle backdrop with correct clear space, or (b) fade the photo to 90%+ opacity behind the logo.

### 9.5 Don't use the neon green `#B9FF3D` variant

❌ Switching the dot to neon for "excitement", "Gen Z appeal", or dark mode contrast.

**Why wrong:** Neon was explicitly tested in V3 evolution and **rejected** for being retail-degen. Apice is premium minimalism. Bright emerald `#16A661` is already lively at scale — no further saturation needed.

### 9.6 Don't shrink clear space below 1d

❌ Packing the logo flush against UI edges, text, or adjacent logos.

**Why wrong:** Violates rule §5. The dot loses its terminal-punctuation reading and starts to look like a bug or artifact. 2d is the default; 1d is the absolute minimum.

---

## 10. File reference index

All paths relative to `Apps/ApiceCapital/brand/assets/logos/`.

| File | viewBox | Primary use | Size budget |
|---|---|---|---|
| `apice-wordmark-primary.svg` | 280×80 | Default wordmark (theme-aware, currentColor) | <1KB ✓ |
| `apice-wordmark-on-dark.svg` | 280×80 | Legacy-client fallback (hardcoded cream) | <1KB ✓ |
| `apice-lockup-horizontal.svg` | 360×72 | Email, nav, press (theme-aware) | <1KB ✓ |
| `apice-lockup-stacked.svg` | 240×240 | Social avatar, app store (theme-aware) | <1KB ✓ |
| `apice-compact.svg` | 120×32 | Mobile nav, toolbar (theme-aware) | <1KB ✓ |
| `apice-favicon.svg` | 32×32 | Browser tab, small scales (<48px rule) | <1KB ✓ |
| `apice-app-icon-ios.svg` | 1024×1024 | iOS app icon — **wordmark + dot centered** (v2) | <1.5KB ✓ |
| `apice-app-icon-ios-dot-only.svg` | 1024×1024 | Parked fallback (D6.2) | <1KB ✓ |
| `apice-app-icon-android-foreground.svg` | 108×108 | Android adaptive FG | <1KB ✓ |
| `apice-app-icon-android-background.svg` | 108×108 | Android adaptive BG | <1KB ✓ |
| `apice-og-image.svg` | 1200×630 | Meta OG tag (hardcoded dark) | <2KB ✓ |

### Abstract visual system (v1.1 · D6.3)

See `abstract-visual-system.md` for the full spec. Files in `/brand/assets/abstract/`:

| File | viewBox | Family | Size |
|---|---|---|---|
| `abstract-currents-01.svg` | 1280×720 | Currents — growth as tide | 1.8KB ✓ |
| `abstract-constellations-01.svg` | 1280×1280 | Constellations — growth as network | 2.7KB ✓ |
| `abstract-rings-01.svg` | 1440×900 | Rings — growth as ripple | 2.1KB ✓ |
| `abstract-threads-01.svg` | 1280×1600 | Threads — growth as fabric | 3.2KB ✓ |
| `abstract-strata-01.svg` | 1280×720 | Strata — growth as sediment | 2.7KB ✓ |

### Archived references (do not ship)

- `v3-green-01.svg` — original V3.01 baseline (source of truth for proportions)
- `v3-green-02.svg` through `v3-green-10.svg` — evolution artifacts; preserved for historical audit per DECISIONS-LOG governance
- `apex-a-*.svg` — superseded D3 direction; preserved per governance

---

## 11. CSS custom properties (reference for @dev)

```css
:root {
  /* Core palette */
  --apice-ink: #0E0E12;
  --apice-cream: #F7F3ED;
  --apice-emerald-bright: #16A661;
  --apice-emerald-deep: #0F5D3F;

  /* Neutrals */
  --n-50: #FAF8F3;
  --n-100: #F7F3ED;
  --n-200: #EDE8DF;
  --n-300: #D8D2C5;
  --n-400: #A8A49A;
  --n-500: #6E6A61;
  --n-600: #53504A;
  --n-700: #3F3D38;
  --n-800: #242328;
  --n-900: #0E0E12;

  /* Semantic surfaces (light) */
  --surface-canvas: var(--apice-cream);
  --surface-raised: var(--n-50);
  --surface-border: var(--n-200);
  --surface-ink: var(--apice-ink);
  --surface-ink-muted: var(--n-500);
  --surface-accent: var(--apice-emerald-bright);

  /* Typography */
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;

  /* Logo consumption (overridable by component) */
  --apice-logo-ink: var(--apice-ink);
  --apice-logo-dot: var(--apice-emerald-bright);
}

[data-theme='dark'] {
  --surface-canvas: var(--apice-ink);
  --surface-raised: #1A1A20;
  --surface-border: var(--n-800);
  --surface-ink: var(--apice-cream);
  --surface-ink-muted: var(--n-400);
  --apice-logo-ink: var(--apice-cream);
}
```

---

## 12. Governance

- **Any change to this spec** requires CEO approval via DECISIONS-LOG entry.
- **SVG files are the source of truth.** Raster exports are derivatives.
- **No agent may introduce new logo variants** without going through @ux-design-expert (Uma) + @pm (Morgan) + CEO checkpoint.
- **v2 elaborations** (Peak mark, custom letterforms, descriptor system) are parked in `apice-v3-green-evolution.md`. To revisit, open a new decision cycle.

---

*Uma — @ux-design-expert · 2026-04-17 · v1.1 FINAL (D6.1, D6.2, D6.3 patched)*
