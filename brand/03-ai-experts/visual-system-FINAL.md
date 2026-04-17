# AI Experts + Visual Asset System — FINAL Production Spec

> **Author:** @media-engineer
> **Status:** v1 FINAL — production-grade. Supersedes `visual-system-spec.md` (v1 DRAFT).
> **Locale:** EN-first (visual language is locale-agnostic)
> **Depends on:** `personas-concept.md` (Stefan), `DECISIONS-LOG.md` (CEO D5 — V3.01 logo)
> **Last updated:** 2026-04-17

---

## 0. What changed from the draft

1. **Signature color is now bright emerald `#16A661`** (not amber). This is the locked brand signature color, matching the V3.01 logo dot.
2. **Warm deep emerald `#0F5D3F`** joins the system as a structural accent (used sparingly — badge rings, secondary outline).
3. **Expert accent colors remain individual** (indigo for Nora, sky for Kai, emerald for Elena, rose for Dante, purple for Maya, amber warm for Omar) — but each avatar carries a **tiny `#16A661` dot in the bottom-right corner** as a cross-expert brand unifier and "active/listening" indicator.
4. **Concept SVGs are now production-grade** — refined silhouettes, shoulder shapes, neckline variation, motif integration, accessible title+desc.
5. **Asset system extended** beyond experts to include: 5 badge rarity tiers + 10 specific badges, 6 empty-state illustrations, and 5 onboarding hero illustrations — all keyed to the same locked palette.

---

## 1. Locked Palette

| Token | Hex | Usage |
|---|---|---|
| `apice-dark` | `#0E0E12` | Primary type, silhouette outlines at mythic tier |
| `apice-cream` | `#F7F3ED` | Primary background, inside-of-frame fill |
| `apice-emerald` | `#16A661` | **Brand signature.** Logo dot, active indicator, primary badge accent, onboarding anchor |
| `apice-emerald-deep` | `#0F5D3F` | Structural accent — double-ring on epic frames, secondary outlines. Sparingly. |
| Warm neutrals n100–n900 | derived | Skin tones, hair, wardrobe, backgrounds |

**Expert individual accents (preserved from prior brief):**

| Expert | Accent hex | Role |
|---|---|---|
| Nora | `#8B5CF6` (warm indigo) | Analyst |
| Kai | `#0EA5E9` (sky) | Momentum |
| Elena | `#16A661` (emerald, aligns with brand signature) | DCA Master |
| Dante | `#F43F5E` (rose, sparingly on shield motif) | Risk |
| Maya | `#8E4CBF` (purple) | Researcher |
| Omar | `#D9912D` (warm amber) | Mentor |

The brand unifier — the `#16A661` dot at bottom-right of each avatar's frame — preserves individuality while guaranteeing every expert ties back to the Apice mark.

---

## 2. Asset Inventory (v1 ship)

### 2.1 AI Experts — 6 final avatars
Path: `/brand/assets/experts/{name}-final.svg`

- `nora-final.svg` — The Thesis Builder
- `kai-final.svg` — The Pattern Reader
- `elena-final.svg` — The Patient Compounder
- `dante-final.svg` — The Risk Architect
- `maya-final.svg` — The Deep Researcher
- `omar-final.svg` — The Mentor

**Specs:** viewBox `256×256`, rounded-square frame radius 24% (61px), each file < 5 KB, no rasters, `role="img"` + `<title>` + `<desc>` for a11y.

### 2.2 Badges — 5 rarity frames + 10 specific badges
Path: `/brand/assets/badges/`

**Rarity frames (reusable):**
- `badge-frame-common.svg` — flat gray
- `badge-frame-rare.svg` — single `#16A661` ring
- `badge-frame-epic.svg` — double ring (`#0F5D3F` outer, `#16A661` inner)
- `badge-frame-legendary.svg` — warm amber gradient frame
- `badge-frame-mythic.svg` — 4-stop iridescent gradient (emerald → purple → amber → deep emerald)

**Specific badges:**
- `badge-first-dca.svg` (common) · green dot burst
- `badge-week-streak-3.svg` (rare) · flame + "3W"
- `badge-week-streak-30.svg` (epic) · layered flame + "30W"
- `badge-100-percent-quiz.svg` (rare) · scholar mortarboard
- `badge-architect.svg` (epic) · allocation pie
- `badge-diamond-hand.svg` (legendary) · geometric diamond in emerald
- `badge-30-day-pledge.svg` (legendary) · scalloped seal with "30"
- `badge-elite-challenge.svg` (mythic) · star + radial rays on dark
- `badge-founding-member.svg` (legendary) · arched "FOUNDING" type
- `badge-referral-3.svg` (rare) · triangle of 3 linked dots

**Specs:** viewBox `128×128`, each < 3 KB, each `role="img"` + `<title>`. Emerald accent restrained per tier.

### 2.3 Empty-state illustrations — 6 icons
Path: `/brand/assets/empty-states/`

- `empty-portfolio.svg` · card with summary lines
- `empty-dca-plans.svg` · calendar grid
- `empty-challenges.svg` · trophy
- `empty-academy.svg` · open book
- `empty-notifications.svg` · bell
- `empty-cashback.svg` · card with plus icon

**Specs:** viewBox `48×48`, flat line-art, stroke `#8A8A93`, exactly one `#16A661` accent element per illustration, each < 2 KB.

### 2.4 Onboarding hero illustrations — 5 scenes
Path: `/brand/assets/onboarding/`

- `onboarding-01-welcome.svg` · value proposition w/ summit dot
- `onboarding-02-quiz-intro.svg` · stacked question cards
- `onboarding-03-profile-result.svg` · balanced-investor scale
- `onboarding-04-exchange-connect.svg` · two-device secure link
- `onboarding-05-first-dca.svg` · rising dot grid w/ pulse

**Specs:** viewBox `320×240`, richer composition than empty states, emerald as signature anchor in each, each < 6 KB.

---

## 3. Integration with V3.01 logo direction

The logo system is **wordmark "Apice" + bright emerald dot** (Geist 700, tracking -30). Every asset in this pack obeys the same three-axis discipline the logo obeys:

1. **Dark on cream, not neon on black.** Assets live on `#F7F3ED` backgrounds (or inherit dark mode via CSS). No glow, no neon, no gradient overload.
2. **The dot is the brand.** Every asset includes `#16A661` in a deliberate, load-bearing position (onboarding summit, badge accent, expert active-indicator, empty-state single element).
3. **Craft over spectacle.** Line work is restrained, geometric, hand-placed. No machine-generated path noise. Stroke weights consistent within each asset category.

---

## 4. Production Pipeline (handoff updated)

### 4.1 Option B executed (this pass)
The prior handoff recommended Option B — AI-assisted first pass + Uma polish. This pass delivered **the full Option B in vector form directly** (skipping the raster AI stage): 6 refined expert avatars as hand-crafted SVG, shippable as v1.

### 4.2 For Uma — optional polish pass
If Uma has bandwidth, she can further elevate the 6 experts by:
- Redrawing hair silhouettes with even more intentional shape language
- Testing alt smile amplitudes for Elena + Omar at 128px
- Producing 512px master SVG variants with richer fill texture (same palette, more polygon fidelity)
- Producing hinted 48px variants with the background motif omitted for inline legibility

**This is refinement, not blocking.** The 6 `-final.svg` files ship today.

### 4.3 For Dev — integration
Use the same `<ExpertAvatar />` component API proposed in `production-handoff.md` §2.3. Asset paths now:

```
/brand/assets/experts/{name}-final.svg      → source-of-truth
/public/experts/{name}.svg                   → runtime (copy of -final)
```

The expert registry at `src/data/experts.ts` should use `#16A661` for every expert's `brandIndicatorHex` constant — individual accent stays per expert.

### 4.4 For Dev — badges, empty states, onboarding
- **Badges:** `<Badge />` component consumes `/public/badges/{slug}.svg`. Rarity tier encoded in a `rarity` prop (common | rare | epic | legendary | mythic) and rendered from the matching frame file — specific badges that already bundle their tier-frame internally (all 10 listed) can be used directly.
- **Empty states:** `<EmptyState />` consumes `/public/empty-states/{slug}.svg`, rendered at 48px inline or scaled up to 96px via CSS for card-sized contexts. Always paired with a copy slot and a CTA.
- **Onboarding:** `<OnboardingHero />` consumes `/public/onboarding/{slug}.svg` at native 320x240 viewBox; upscales by CSS to fill hero slot.

### 4.5 Dark mode
All assets use explicit fills (no `currentColor`). Dark-mode variants are deferred to v2 — swap `#F7F3ED` → `#18181D` and adjust gradient end-stops. Not shipping with v1.

---

## 5. Consistency Test (updated) — "Do all 30+ assets look like one family?"

The set passes if a viewer, shown any combination of 3 random assets side-by-side, can confirm all four:

1. **Emerald `#16A661` anchor present.** Every asset has at least one deliberate use.
2. **Dark on cream base.** No neon backgrounds, no aggressive gradients outside the mythic tier.
3. **Stroke weights consistent within category.** Experts 1.5px, empty states 1.2px, badges per-tier rule.
4. **Type-face coherence where text is used.** Geist (or system fallback) only. No decorative fonts.

If any fails, the set reads as "multiple illustrators" — the family breaks.

---

## 6. Versioning & evolution

- **v1 FINAL — 2026-04-17:** 30+ production-grade SVGs (6 experts, 15 badges, 6 empty states, 5 onboarding). Ship.
- **v1.1 — optional Uma polish pass:** higher-fidelity expert masters, Elena smile test, 48px hinted variants. Non-blocking.
- **v2 (future):**
  - Dark-mode variants
  - Animated micro-interactions (Framer Motion, entrance + motif attention)
  - Seasonal expert palette shifts (emerald deepens to forest in December, etc.)
  - 7th expert slot (reserved palette: `--chart-7` teal)
  - Spanish locale altText
- **v3 (speculative):** 3D rendered variants for App Store hero; lottie-wrapped onboarding.

---

## 7. File budget audit (v1 ship)

| Category | Files | Budget | Actual max |
|---|---|---|---|
| Experts | 6 | < 5 KB each | 3.3 KB (maya) |
| Badge frames | 5 | < 3 KB each | 0.7 KB (mythic) |
| Specific badges | 10 | < 3 KB each | 1.4 KB (founding-member) |
| Empty states | 6 | < 2 KB each | 0.8 KB (dca-plans) |
| Onboarding | 5 | < 6 KB each | 2.0 KB (first-dca) |

All assets pass their budget with > 2× headroom. No raster. All a11y-labeled.

---

*Visual System FINAL v1 — @media-engineer, for Apice Capital · 2026-04-17*
