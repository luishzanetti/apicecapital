# Apice Capital — Logo Specification (Apex-A, Direction C)

> **Author:** @ux-design-expert (Uma)
> **Phase:** F5 — Vector production + specification package
> **Status:** v1.0 — CEO approved (DECISIONS-LOG D3, 2026-04-17)
> **Governance principle:** Iteration over perfection. This is the v1 commitment; lapidation is expected.
> **Reference tokens:** `docs/REDESIGN-SPEC.md` — Warm Indigo `#8B5CF6`, Warm Amber `#F59E0B`, Geist typeface
> **SVG assets:** `brand/assets/logos/apex-a-*.svg`

---

## 0. Design intent

The letter *A* is the symbol. A custom capital-A, drawn on the Geist Bold skeleton, with three signature modifications:

1. **Summit tick** — the right leg extends 8% of cap-height above the apex meeting point, creating a small upward flag that reads as peak + uptrend.
2. **Internal shelf** — a thin horizontal stroke at 60% cap-height replaces the traditional crossbar, suggesting a horizon / plateau reached.
3. **Flat feet** — optically-corrected flat baseline terminals, no serifs, aligned with Geist's terminal language.

The same glyph serves as both the standalone monogram (app icon, favicon, avatar) and the first letter of the wordmark ("Apice Capital"). The repetition is the brand compound interest: every favicon impression reinforces the full name.

---

## 1. Construction grid

**Master canvas:** 64 × 64 units (pixels at 1× render).
**Subgrid:** 8 × 8 units (the Apice design rhythm per REDESIGN-SPEC section C).
**Padding:** 4u on all four sides → glyph fits inside a 56 × 56 inner box.
**Cap-height:** 56u (from y=4 tick-top to y=60 baseline). The apex proper sits at y=8.
**Baseline:** y=60.

### Anchor-point coordinates (64u master)

| Component | Path | Rationale |
|---|---|---|
| `#leg-left` | `M 4 60 L 24 8 L 32 8 L 32 16 L 28 16 L 16 60 Z` | 6-vertex parallelogram. Outer foot x=4, inner foot x=16, apex outer x=24 y=8, apex inner x=32 y=8. The x=32 y=16 and x=28 y=16 vertices define the internal corner that meets the right leg under the apex. |
| `#leg-right` | `M 32 8 L 36 8 L 60 60 L 48 60 L 36 16 L 32 16 Z` | Mirror of left leg, with apex-inner at x=32 y=8, apex-outer x=36 y=8. Baseline outer x=60, inner x=48. |
| `#shelf` | `rect x=14 y=34 w=36 h=2` | Spans inner counter, 36u wide, 2u thick (= 1/4 leg stroke). Positioned at y=34..36 (see §3 optical correction). |
| `#summit-tick` | `M 32 4 L 36 4 L 36 8 L 32 8 Z` | 4u × 4u rectangle extending the right leg from y=4 to y=8. 4u = 8% of 56u cap-height (rounded to subgrid). |

### Grid sketch

```
y=0   ┌──────────────────────────────────┐
y=4   │                ░░                │  ← summit tick top
y=8   │              ▓▓▓▓                │  ← apex line
y=16  │             ▓▓  ▓▓               │  ← apex inner cutline
y=26  │            ▓▓    ▓▓              │
y=34  │          ▓▓░░░░░░░░▓▓            │  ← shelf top
y=36  │          ▓▓────────▓▓            │  ← shelf bottom
y=44  │         ▓▓          ▓▓           │
y=52  │        ▓▓            ▓▓          │
y=60  │      ▓▓▓▓            ▓▓▓▓        │  ← baseline
      └──────────────────────────────────┘
       x=0  4    16 24 28 32 36 44 48  60
```

---

## 2. Geometric specifications

| Parameter | Value | Derivation |
|---|---|---|
| **Cap-height** | 56u | 64u canvas − 4u top − 4u bottom (but see tick, §3) |
| **Effective height (with tick)** | 56u | y=4 (tick top) to y=60 (baseline) |
| **Leg stroke width (outer)** | 8u | Baseline foot width: x=4..x=16 (left), x=48..x=60 (right) |
| **Apex stroke width** | 8u | At y=8: x=24..x=32 (left), x=32..x=36 (right) — asymmetric by design |
| **Leg angle (left)** | ~75.5° from horizontal | Rise 52u over run 20u (outer edge x=4→24) |
| **Leg angle (right)** | ~75.5° from horizontal | Mirrored |
| **Summit tick extension** | 4u above apex | 4u / 56u = ~7.14%, rounded to 8% narrative — lands on subgrid |
| **Summit tick width** | 4u | Matches right-leg apex width (x=32..36) |
| **Shelf position** | y=34..36 | 60% of cap-height from baseline = 22.4u → y=37.6 mathematically; lifted to y=35-center for optical balance (see §3) |
| **Shelf thickness** | 2u | 1/4 of leg stroke (8u ÷ 4 = 2u) |
| **Shelf width** | 36u | x=14..50 — stops 2u inside each counter edge for breathing room |
| **Left counter (area)** | ~112u² | Triangular negative space left of shelf, right of left leg |
| **Right counter (area)** | ~112u² | Mirrored |
| **Apex-tip geometry** | Flat-cut at y=8 | Mathematical sharp point rounded to 0.5u radius at render (handled by stroke anti-aliasing, no explicit arc) |

---

## 3. Optical corrections

Every place where math lost to the eye. Documented so future refinements (v2) respect the reason, not the number.

| # | Where | What math said | What the eye sees | Correction |
|---|---|---|---|---|
| 1 | **Apex meeting point** | Two diagonals meet at a mathematically sharp vertex at y=8 | Hairline artifacts at render sizes <=32px; vertex appears blunted anyway due to anti-aliasing | Apex is drawn flat-cut at y=8 across 12u (x=24..36) — 4u wider than strict geometry requires. The eye reads the wider flat as "sharp" once the cut is narrower than ~6% of cap-height. |
| 2 | **Shelf vertical position** | 60% from baseline = y=37.6 (using 56u cap-height, baseline y=60) | At y=37.6 the shelf looks visually *below* center and drags the A's mass downward | Shelf lifted to y=34..36 (center at y=35). This is ~45% from baseline mathematically but reads as 50% optically because the apex triangle has more visual weight than the leg flanks. |
| 3 | **Shelf terminal shape** | Full-width 40u rectangle (x=12..52) | Terminals appeared to touch the legs, creating tension | Shelf shortened to 36u (x=14..50), leaving 2u air on each side. Reads as "shelf inside the counters", not "crossbar attached to the legs". |
| 4 | **Summit tick width** | Mathematically 4u extension at the apex-outer x=36 only | Looked like a single-pixel spike, not a flag | Tick is drawn as a 4×4 square (x=32..36, y=4..8), giving it visible mass at app icon sizes. At favicon sizes it is dropped (see §5). |
| 5 | **Baseline feet** | Pointed feet where diagonal meets baseline | Optical thinning at feet, A appears to float | Flat horizontal cut at y=60. Outer corners left mathematically sharp (render engine handles anti-aliasing). |
| 6 | **Right-leg inner corner under apex** | Strict mirror at x=36, y=16 | A tiny "kink" visible on the inside of the right leg when rendered at 128px+ | Kept as-is in v1 — at production display sizes (16–128px) the kink is invisible. Flagged for v2 refinement if ever needed above 256px rendering. |

---

## 4. Variations matrix

All 12 required variations. File paths assume `brand/assets/logos/` prefix.

| # | Variant | File | Color state | Canvas | Primary use |
|---|---|---|---|---|---|
| 1 | Symbol — full color on light | `apex-a-symbol.svg` | indigo `#8B5CF6` on `#FDFDFE` | 64×64 | Default mark, UI nav brand |
| 2 | Symbol — full color on dark | `apex-a-symbol.svg` (override `--apex-a-fill: #A78BFA`) | indigo-400 on `#0E0E12` | 64×64 | Dark-mode UI |
| 3 | Symbol — indigo monochrome | `apex-a-symbol.svg` (inherit color) | `#8B5CF6` single-ink | 64×64 | Single-color co-brand |
| 4 | Symbol — amber monochrome | `apex-a-symbol.svg` (fill #F59E0B) | `#F59E0B` single-ink | 64×64 | Founding-member / ceremony badges (rare) |
| 5 | Symbol — black | `apex-a-symbol.svg` (fill neutral-900) | `#18181B` | 64×64 | Print, invoices, legal docs |
| 6 | Symbol — white | `apex-a-symbol.svg` (fill #FFFFFF) | `#FFFFFF` | 64×64 | Dark surfaces, video overlay |
| 7 | Symbol — reversed knockout | `apex-a-symbol.svg` (fill #FFFFFF on brand fill) | white on indigo/mesh | 64×64 | Hero splash, photography |
| 8 | Horizontal lockup | `apex-a-lockup-horizontal.svg` | indigo + neutral-900 | 320×64 | Site header, email signature |
| 9 | Stacked lockup | `apex-a-lockup-stacked.svg` | indigo + neutral-900 | 240×160 | Square avatars, splash |
| 10 | Wordmark-only | (derivative of horizontal — omit standalone symbol group) | indigo + neutral-900 | 224×64 | Footer, tight horizontal spaces |
| 11 | Favicon | `apex-a-favicon.svg` | indigo `#8B5CF6`, transparent bg | 32×32 | Browser tab, bookmark |
| 12 | App icon | `apex-a-app-icon.svg` | white A on indigo `#8B5CF6` rounded square | 1024×1024 | iOS / Android home screen |
| 13 | Ceremonial (amber tick) | `apex-a-symbol.svg` + CSS `.summit-tick{fill:#F59E0B}` | indigo A + amber tick | 64×64 | Pro/Club upgrade, level-up L7, founding-member badge |
| 14 | OG image | `apex-a-og-image.svg` | indigo mesh on `#0E0E12` | 1200×630 | Social share card, link previews |

**Note on variant #10 (wordmark-only):** Not shipped as a standalone SVG in v1. To produce, consumers can inline the horizontal lockup SVG and set `#symbol { display: none }`. Flagged for v2: ship as discrete asset.

---

## 5. Minimum sizes

| Context | Minimum size | Notes |
|---|---|---|
| **Symbol (favicon variant)** | 16 × 16 px | Uses `apex-a-favicon.svg` — summit tick and shelf dropped, solid A silhouette. Legitimate simplified variant, not a failure mode. |
| **Symbol (standard)** | 24 × 24 px | Full geometry. Below this, shelf and tick start to alias. |
| **Symbol (optimal)** | 48 × 48 px+ | All optical details legible. Target size for UI nav brand. |
| **Horizontal lockup** | 128 px wide | Below this, switch to symbol-only. |
| **Stacked lockup** | 72 px tall | Below this, switch to symbol-only. |
| **App icon** | 60 × 60 px (iOS home-screen min) | Uses `apex-a-app-icon.svg` scaled. Do not rasterize below 60px; recompose using favicon variant. |
| **Wordmark alone** | 96 px wide | Custom A legible at ~14px cap-height. Below this, drop "Capital" (use "Apice" alone). |

---

## 6. Clear space rule

**Formula:** clear space = 1 × cap-height of the A (measured from y=8 apex to y=60 baseline — the 52u core, excluding summit tick).

**Practical application:**
- Symbol at 64u master → clear space = 52u on all four sides
- Symbol at 24px render → clear space = ~20px
- App icon context → clear space baked into the 20% internal margin (x=205..819 inside 1024 canvas)

**What MAY NOT enter the clear zone:**
- Other logos (including CEO signatures, partner marks, regulator badges)
- Body copy, headlines, taglines
- UI chrome (search bars, nav items, buttons)
- Photography subjects or illustration focal points

**Exception:** The summit tick is allowed to protrude 4u above the nominal cap-height zone. Clear space is measured from the nominal 52u box; the tick is considered part of the mark's internal geometry, not a protrusion for clearance purposes.

---

## 7. Color applications

| Background | Symbol color | Wordmark color | Use case |
|---|---|---|---|
| Neutral-25 `#FDFDFE` (light page) | Indigo-500 `#8B5CF6` | Neutral-900 `#18181B` | Default on light UI |
| Surface-base `#0E0E12` (dark page) | Indigo-400 `#A78BFA` | Neutral-0 `#F2F2F2` | Default on dark UI (indigo lifts one step for contrast) |
| Indigo-500 `#8B5CF6` (brand field) | White `#FFFFFF` | White `#FFFFFF` | Hero sections, CTAs, feature cards |
| Gradient-mesh (light or dark) | White `#FFFFFF` | White `#FFFFFF` | Onboarding splash, marketing hero |
| Photography (>=40% luminosity) | White `#FFFFFF` | White `#FFFFFF` | OG overrides, campaign visuals |
| Print / invoice / legal | Neutral-900 `#18181B` | Neutral-900 `#18181B` | Single-ink contexts |
| Ceremonial context (Pro upgrade, L7, founding member) | Indigo-500 body + Amber-500 `#F59E0B` summit tick | Neutral-900 | See §9 |

**Hard rules:**
- Amber-500 never colors anything except the summit tick (4u × 4u region). Never the full symbol, never the wordmark.
- Never place the mark on backgrounds in the 20–40% luminosity range without a solid shape behind it — the contrast breaks.
- Never apply gradient inside the symbol itself. The symbol is single-color. Background can be gradient; symbol stays flat.
- Never drop-shadow, outer-glow, or bevel the mark. Flat only.

---

## 8. Typography pairing (wordmark)

**Font:** Geist Semibold (600). Fallback stack: `'Geist','Inter',system-ui,-apple-system,sans-serif`.
**Why Geist:** Matches REDESIGN-SPEC section B. Tabular numerals, flat terminals, and geometric construction pair naturally with the Apex-A's flat-cut apex and vertical leg angles.

| Token | Weight | Size rule | Letter-spacing | Use |
|---|---|---|---|---|
| "Apice" (primary) | 600 (Semibold) | Match symbol cap-height (1:1) | -0.01em | First word, sits next to or under the symbol |
| "Capital" (secondary) | 600 (Semibold) | 72% of "Apice" cap-height | -0.01em | Sub-title, same baseline or below |
| OG tagline — primary line | 600 (Semibold) | 56px at 1200×630 | -0.02em | "Build Wealth." |
| OG tagline — secondary line | 500 (Medium) | 40px at 1200×630 | -0.01em | "One Week at a Time." |

**Kerning note:** Because the first letter of "Apice" IS the custom Apex-A (same glyph, just smaller), there is no standard "Ap" kerning pair — the custom A's right-leg angle naturally cradles the *p* with no adjustment needed. The `pice Capital` text string starts immediately after the custom-A's baseline-right foot. No extra letter-spacing is added between custom-A and *p*.

**Ligatures:** Disabled (`font-variant-ligatures:none`) on all wordmark renderings to prevent Geist's automatic *fi*, *fl* ligatures from intruding on the "pical" stretch of "Capital".

---

## 9. Ceremonial usage (amber summit tick)

The amber summit tick is a rare-use variant. It appears ONLY in these approved contexts:

| # | Moment | Placement | Duration |
|---|---|---|---|
| 1 | **Pro upgrade confirmation screen** | Indigo A with amber tick, centered in success modal. Accompanied by "Welcome to Pro" headline. | Ship at launch. |
| 2 | **Club (founding-member) onboarding** | Indigo A with amber tick, on welcome card. Paired with member number (e.g., "Founding Member #042"). | Ship at Club tier launch. |
| 3 | **Elite Mindset Level 7 unlock** | Indigo A with amber tick, in the level-up confetti moment. Amber tick flashes from indigo to amber in sync with the level reveal animation. | Ship with Academy Track 6 (post-manifesto). |
| 4 | **Yearly anniversary moments** | Indigo A with amber tick in the "1 year with Apice" / "2 years with Apice" email + in-app celebration cards. | Ship in Year 2. |
| 5 | **Apice Code Manifesto tattoo moment** | Indigo A with amber tick on the printable/exportable manifesto certificate given after Academy Track 6 completion. | Ship with manifesto (CEO-polished). |

**Forbidden ceremonial uses:**
- Never use the amber tick on marketing landing pages or paid-ad creative (dilutes the rarity signal)
- Never use on the app icon (home-screen consistency trumps ceremony)
- Never in the OG image (social share = public-facing, ceremonial = in-product reward)
- Never on invoices, legal docs, or regulator-facing surfaces (ceremony has no place in compliance contexts)

---

## 10. Don'ts gallery

Eight incorrect uses, each with the principle it violates.

| # | Don't | Why it's wrong |
|---|---|---|
| 1 | **Don't rotate or skew the A** | The asymmetric summit tick is the fingerprint. Rotating the mark makes the tick read as random, not signature. The mark is always upright, at 0°. |
| 2 | **Don't add a drop shadow, outer glow, bevel, or 3D effect** | The mark is flat. Adding FX moves it into 2015 crypto vocabulary (the exact aesthetic REDESIGN-SPEC section D removes from the product). |
| 3 | **Don't put a gradient inside the symbol legs** | The mark is single-color. Gradient treatment is reserved for backgrounds (gradient-primary for CTAs, gradient-mesh for splash). A gradient-filled A loses the architectural read. |
| 4 | **Don't use amber on the full A, ever** | Amber is the summit-tick-only color. A full amber A reads as "warning state" or "promo tag", not as the brand. |
| 5 | **Don't change the summit-tick side (left leg vs right leg)** | The tick is always on the RIGHT leg. Mirroring the mark (for, e.g., a right-aligned layout) is forbidden. Right-leg extension is the cognitive anchor — flipping it resets the user's recognition to zero. |
| 6 | **Don't close the counters (fill the triangular negative spaces)** | The open counters are what make the mark a letter A instead of a solid triangle. Filling them collapses the mark into a generic peak icon (Direction A's territory, rejected). |
| 7 | **Don't replace the internal shelf with a traditional crossbar (horizontal line between legs)** | The shelf is a *detail* (2u thin), the crossbar would be a *bar* (8u thick, leg-stroke-matched). A standard A crossbar reads as "default Geist bolded", erasing the Apex-A signature. |
| 8 | **Don't surround the mark with a ring, box, or badge container** | The A stands alone. Putting it in a Ⓐ circle or squared-off badge is the bolted-on-chrome move rejected in the original Direction C concept. The app icon's rounded square is the ONLY approved container, and only for that context. |

---

## 11. File inventory

| File | Purpose | Canvas |
|---|---|---|
| `logo-spec-apex-a.md` | This spec document | — |
| `assets/logos/apex-a-symbol.svg` | Primary symbol | 64×64 |
| `assets/logos/apex-a-lockup-horizontal.svg` | Horizontal lockup | 320×64 |
| `assets/logos/apex-a-lockup-stacked.svg` | Stacked lockup | 240×160 |
| `assets/logos/apex-a-app-icon.svg` | iOS/Android icon | 1024×1024 |
| `assets/logos/apex-a-favicon.svg` | Favicon (simplified) | 32×32 |
| `assets/logos/apex-a-og-image.svg` | OG / social share card | 1200×630 |

---

## 12. v2 refinement backlog (acknowledged limitations of v1)

Per governance principle "iteration over perfection". These are not bugs; they are known rough edges to revisit in v2.

1. **Ship discrete wordmark-only SVG** — Currently derived from horizontal lockup by hiding the symbol group. v2: produce `apex-a-wordmark.svg` as standalone asset.
2. **True custom wordmark letters** — Currently the wordmark's *p, i, c, e, C, a, p, i, t, a, l* render via Geist Semibold fallback. v2: hand-draw the remaining 11 glyphs as a bespoke Apice Display variant so the whole wordmark is path-outlined (no font dependency).
3. **iOS superellipse squircle** — App icon currently uses standard `rx="180"` rounded square. v2: ship superellipse path for pixel-perfect iOS home-screen continuity with Apple's icon mask.
4. **PNG raster fallback set** — Deliver hand-hinted 16/32/48/180/192/512 PNG exports for platforms that cannot consume SVG (legacy Android, Windows taskbar).
5. **Dark-mode color tokens in SVG** — Currently color overrides happen at consumer level (CSS `--apex-a-fill` variable). v2: ship a `@media (prefers-color-scheme: dark)` block inside the SVG for drop-in auto-theming.
6. **Brand guidelines PDF** — This markdown is the source of truth. v2: export to a printable PDF for partner / investor decks.
7. **Motion lockup** — A 2-second animated entrance of the A (left leg draws, right leg draws, shelf fades in, tick pops) for splash and onboarding hero. v2.
8. **Right-leg inner-corner smoothing** (§3 correction #6) — Revisit if ever rendering above 256px.

---

*End of logo-spec-apex-a.md v1.0. Maintained by @ux-design-expert (Uma). Append to Change Log in DECISIONS-LOG on any revision.*
