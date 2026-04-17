# Apice Capital — Abstract Visual Identity System (v1.0)

> **Status:** Production v1 — 5 motif families, seeded construction, theme-aware.
> **Author:** Uma (@ux-design-expert) — 2026-04-17
> **Derived from:** DECISIONS-LOG D6.3 (CEO directive: growth as poetic abstraction, not charts).

---

## 1. Philosophy

Apice sells wealth as a **discipline that accumulates over time**. A literal growth chart would betray that message — charts communicate volatility, not patience. Rocket ships communicate speculation. Mountain peaks communicate a finish line that doesn't exist.

The abstract visual system represents growth **indirectly and artistically**. Every motif is a metaphor for an underlying natural process: tide, ripple, weave, network, sediment. The user reads the motif and **feels** growth without having it explained — the same way Plaid's guilloche feels like precision without drawing a gear, or Stripe's gradient feels like momentum without drawing an arrow.

**Three rules:**

1. **Growth is not arrival.** No summits, no peaks, no finish lines. The motifs show process, not destination.
2. **Growth is compounding, not explosion.** The signature element is always *one quiet emerald line* inside a system of neutral strokes — the same signature-dot logic as the wordmark. Loud is retail-degen. Quiet is Apice.
3. **Growth is geometry, not illustration.** Every motif is reducible to a few equations or a seed. No hand-drawn paths. No textures. No rendered 3D. The system must be regeneratable in a future generative tool.

---

## 2. The 5 Motif Families

Each family is one file in `/brand/assets/abstract/abstract-{family}-01.svg`. Numbered `-01` so future variants (`-02`, `-03`) can share the family's rules.

### 2.1 Currents — growth as tide

- **Metaphor:** Parallel sine waves whose amplitude builds left to right. Still water on the left, open ocean on the right. Time moves, the surface rises.
- **Construction:** 8 horizontal baselines at 80u spacing; each is a sine path `y(x) = baseline + A(x)·sin(k·x)` where `A(x) = 0.02·(x+100)·(1 - 0.18·band_index)` and wavelength `2π/k = 240u`. Baseline stroke 1.5u. Band #6 is the signature — emerald #16A661 at 1.8u.
- **Palette usage:** currentColor for 7 quiet bands + locked emerald for signature.
- **Use when:** hero banners, marketing video intros, onboarding "let's start" screens, meditative moments.
- **Don't use when:** dense UI (waves are too soft to read at <300px width), dashboards with their own time-series data (visual double-metaphor).

### 2.2 Constellations — growth as network formation

- **Metaphor:** 36 points scattered on a jittered 6×6 grid. Some are connected by threads (distance-based rule). One emerald node at center-right anchors the pattern — the network has a signature participant, the way each investor is the anchor of their own wealth network.
- **Construction:** Grid cell 213u, jitter ±40u via seeded xorshift PRNG (seed `0x16A661`). Edges drawn where `dist(a,b) < 280u`. Node radius 2.5u. Edges at stroke 0.75u opacity 0.35. Signature: one emerald r=4 node + 4 emerald r=1 connections.
- **Palette usage:** currentColor for neutral graph + locked emerald for signature node & its threads.
- **Use when:** community/social features, referral programs, "your network" onboarding, AI-expert introduction screens (each expert = a node), Club tier marketing.
- **Don't use when:** pure financial/data contexts (reads as "data graph"), small <200px thumbnails (nodes merge).

### 2.3 Rings — growth as ripple

- **Metaphor:** Three origins (pebbles dropped in still water) each generate 5 concentric rings. The rings overlap — the emergent interference pattern is the growth. No single ring is the hero; the composition *is* the hero.
- **Construction:** Origins A(320,640), B(800,380), C(1080,780). Each emits rings at r∈{60, 120, 200, 300, 420} — non-linear spacing (ripples slow as they expand). Stroke 1.5u, opacity descends 0.70→0.18 with radius. Signature: one emerald ring on origin B at r=240, 2u stroke.
- **Palette usage:** currentColor for 15 quiet rings + locked emerald for signature.
- **Use when:** "your first week" celebration, DCA rhythm visualization (each deposit = a ripple), weekly digest emails, calm editorial backdrops.
- **Don't use when:** motion-heavy interfaces (rings + other animation competes), print at small scales (overlaps muddy).

### 2.4 Threads — growth as fabric

- **Metaphor:** Two thread families weave at ±60° across the canvas. Density sparse on the left, tightening to a weave on the right — you can see the fabric form in real time. Wealth as a tapestry woven one week at a time.
- **Construction:** Family +60° (slope +1.732) and family −60° (slope −1.732). Spacing function `s(x) = 120 − 0.07x` → 120u at x=0, tightens to ~30u at x=1280. Stroke 1.5u, opacity 0.4. Signature: one emerald diagonal through the densest zone at 2u stroke.
- **Palette usage:** currentColor for 36 quiet threads + locked emerald for signature.
- **Use when:** tall side panels, splash / launch screens, full-page marketing sections, Elite Mindset manifesto page backgrounds, educational track intros.
- **Don't use when:** accessibility-sensitive content (dense patterns can interfere with low-vision users — apply opacity 0.2 or hide in reduced-motion mode), mobile cards <320px wide.

### 2.5 Strata — growth as sediment / time

- **Metaphor:** Horizontal bands stacked from top to bottom. Upper bands are thin (recent weeks). Lower bands are thick (years of compounding). Each band slightly translated from the one above — geologic time made visible.
- **Construction:** 12 bands on a 720u-tall canvas. Thickness pattern top→bottom in u: `[22, 14, 38, 10, 54, 18, 72, 24, 90, 30, 118, 230]` — older layers thicker. Horizontal translation -12u cumulative per band. Fill opacity ladder 0.04→0.16. Top-of-band hairline at 0.5u opacity 0.25 (the "horizon"). Signature: one emerald 2u line at y=458 — the "growth milestone."
- **Palette usage:** currentColor fills + hairlines + locked emerald signature.
- **Use when:** editorial page dividers, marketing footers, manifesto page atmospheres, empty states ("you haven't started yet, but layers form over time"), retirement-planning sections.
- **Don't use when:** interactive surfaces (bands suggest navigability but aren't), short stacks <200px tall (pattern collapses to stripes).

---

## 3. System primitives

Every motif family shares these two primitives:

| Primitive | Value | Reason |
|---|---|---|
| **Baseline stroke weight** | 1.5u | Matches wordmark dot-stem relationship (dot diameter ≈ 6u at reference scale, stroke 1.5u = 25%). Reads as a "family" with the logo. |
| **Signature weight** | 2u | The emerald signature is always 33% thicker than the baseline — the same ratio the dot gains against the wordmark's letterforms. Creates a consistent accent ratio across the system. |

Secondary shared primitives:

- **Emerald is always `#16A661` at opacity ≥0.85** — the signature must dominate. Never softened below 0.85 or it loses its role.
- **Neutrals are always via `currentColor`** — theme-switchable. Light bg → ink strokes. Dark bg → cream strokes. Same SVG, different parent `color`.
- **Opacity ladder for multi-element families** (Currents bands, Rings radii, Strata fills): bottom/end = darkest, top/start = lightest, monotonically descending. No band in the middle is more opaque than a neighbor.
- **viewBox discipline:** square (Constellations) for social/avatar contexts, 16:9 (Currents, Rings, Strata) for banners/desktop hero, tall (Threads 4:5) for splash/vertical.

---

## 4. Motion rules

v1 ships **static SVGs only** (CEO asked for v1 production, not animated). Motion is planned for v2 following these rules:

| Motif | Animates | Transform | Duration | Easing |
|---|---|---|---|---|
| Currents | Yes | Slow horizontal drift of wave phase | 18s loop | `cubic-bezier(.4, 0, .6, 1)` |
| Constellations | Yes | Signature node pulses; edges fade in over 2s on mount | 4s + 2s mount | `ease-out` |
| Rings | Yes | Each origin emits a new ring every 4s (expanding outward, fading) | 12s loop | linear |
| Threads | No | Static (weaving motion would be literal) | — | — |
| Strata | No | Static (geologic time is not visible to the eye) | — | — |

**Reduced-motion rule:** `@media (prefers-reduced-motion: reduce)` — all animations disabled, static version shown. This is non-negotiable.

---

## 5. Do / Don't gallery

### Do

- ✅ Use Currents as the onboarding hero background on the "Start Your First Week" screen.
- ✅ Use Constellations on the AI-expert roster page (each expert is a node).
- ✅ Use Rings on the weekly digest email header (the ripple of another week completed).
- ✅ Use Threads on the manifesto page at 8% opacity, tall format, right-edge panel.
- ✅ Use Strata in the retirement-projection empty state, with the emerald line at the target date.
- ✅ Pair a motif with text by placing text in a clear zone (≥20% of canvas area) where the motif's density is lowest.

### Don't

- ❌ Recolor the emerald signature to any semantic color (red for bearish, yellow for warning) — the signature is brand, not data.
- ❌ Combine two motif families in the same composition — each motif is a standalone statement, not a remix.
- ❌ Use a motif as a logo replacement or primary brand mark — the wordmark + dot is the only brand mark.
- ❌ Animate Threads or Strata — both communicate stillness / accumulation. Motion breaks the metaphor.
- ❌ Use motifs on photographic backgrounds — they need solid canvas (cream or ink) to breathe.
- ❌ Crop a motif so that the emerald signature falls outside the visible canvas — the signature must remain visible in every use.

---

## 6. Integration

### 6.1 CSS classes (marketing / static pages)

```css
/* Container that theme-switches the motif via currentColor */
.apice-motif {
  color: var(--surface-ink);              /* Light theme → ink strokes */
  display: block;
  width: 100%;
  height: 100%;
}

[data-theme="dark"] .apice-motif {
  color: var(--apice-cream);              /* Dark theme → cream strokes */
}

/* Bright-emerald surface override (Club hero / manifesto): force cream strokes */
.apice-surface--emerald .apice-motif {
  color: var(--apice-cream);
}

/* Opacity scaling for quiet backdrop use */
.apice-motif--backdrop { opacity: 0.12; }  /* behind text */
.apice-motif--panel    { opacity: 0.35; }  /* side panel */
.apice-motif--hero     { opacity: 0.85; }  /* hero stage */
.apice-motif--signature { opacity: 1; }    /* featured composition */
```

Usage:

```html
<div class="apice-surface apice-surface--canvas">
  <object class="apice-motif apice-motif--backdrop" type="image/svg+xml"
          data="/brand/assets/abstract/abstract-currents-01.svg"
          aria-hidden="true"></object>
</div>
```

> Use `<object>` or inline `<svg>` (not `<img>`) so `currentColor` and the class chain are honored. `aria-hidden` is mandatory when the motif is decorative backdrop.

### 6.2 React component API (product)

```tsx
<ApiceMotif
  family="currents" | "constellations" | "rings" | "threads" | "strata"
  variant="01"                      // v1 ships -01 for each family
  tone="ink" | "cream" | "auto"     // "auto" follows [data-theme]
  intensity="backdrop" | "panel" | "hero" | "signature"
  animate={boolean}                  // default true, respects prefers-reduced-motion
  aria-hidden="true"                 // default when decorative
  className={string}
/>
```

Implementation note for @dev: component loads the SVG via inline `<svg>` injection (so `currentColor` cascades from the `tone` prop via CSS custom property), not as `<img>`. See Integration Blocker section in the Jarvis report.

---

## 7. File reference index

| File | viewBox | Family | Primary use | Size |
|---|---|---|---|---|
| `abstract-currents-01.svg` | 1280×720 | Currents | Banners, onboarding, video intros | 1.8KB |
| `abstract-constellations-01.svg` | 1280×1280 | Constellations | Social, AI roster, network features | 2.7KB |
| `abstract-rings-01.svg` | 1440×900 | Rings | Hero backdrops, weekly digest, editorial | 2.1KB |
| `abstract-threads-01.svg` | 1280×1600 | Threads | Splash, tall panels, manifesto | 3.2KB |
| `abstract-strata-01.svg` | 1280×720 | Strata | Footers, empty states, dividers | 2.7KB |

All under the 4KB budget. All use `currentColor` for theme-adaptive strokes + hardcoded `#16A661` for signature.

---

## 8. Governance

- **Any new motif family** (v2+) requires CEO approval via DECISIONS-LOG and must follow the 2 primitives rule (baseline 1.5u + signature 2u in emerald).
- **Any new variant within a family** (`-02`, `-03`, ...) may be shipped by Uma without CEO approval provided it preserves the family's metaphor and construction rules.
- **No new palette colors** may be introduced into motifs. Only `currentColor` + `#16A661`.
- **Motion / animated variants** require a separate v2 decision cycle.

---

*Uma — @ux-design-expert · 2026-04-17 · Abstract Visual System v1.0*
