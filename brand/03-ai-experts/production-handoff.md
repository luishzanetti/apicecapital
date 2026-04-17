# AI Experts — Production Handoff

> **Author:** @media-engineer
> **Status:** v1 — handoff from concept to production
> **For:** Uma (@ux-design-expert) — final illustration · Dev team — integration · Morgan (@pm) — scheduling · Jarvis / CEO — recommendation approval
> **Dependencies:** `visual-system-spec.md` (this folder), `/brand/assets/experts/*-concept.svg` (6 files)
> **Last updated:** 2026-04-17

---

## 0. What you are receiving

- **1 visual system spec** (`visual-system-spec.md`) — palette, construction, face rules, prompt library, placement matrix.
- **6 schematic SVG concepts** (`/brand/assets/experts/{name}-concept.svg`) — rough geometric portraits for each expert. Each under 4 KB, vector, `viewBox="0 0 256 256"`.
- **1 production-handoff document** (this file) — what to refine, integration plan, production-path recommendation.

These are **directional concepts**, not shippable production art. The geometry is correct, the palette is correct, the motifs are in place — but they lack the craft of a final illustrator. That is the gap Uma closes.

---

## 1. For Uma (@ux-design-expert) — refinement checklist

For each of the 6 concepts, here is what needs elevation. Use the concept SVG as the *starting skeleton*, not a reference to copy.

### Universal refinements (apply to all 6)

1. **Hair silhouettes need craft.** The concepts use blocky path edges for hair. Uma should redraw each with a more considered silhouette — still flat, but with intentional shape language (Nora's hair should feel "structured," Elena's "soft," Kai's "crisp," etc.). Do not add strand detail.
2. **Face shape variation.** All 6 concepts use the same ellipse for face. Vary subtly: Dante's face slightly more angular, Elena's slightly softer, Maya's slightly rounder. Keep within ±8% of the base ellipse to preserve family cohesion.
3. **Neckline / wardrobe variation.** The concepts simplify wardrobe to a single path. Give each expert a slightly different collar/neckline signature (Nora: fine-knit round, Elena: soft higher neckline, Dante: structured jacket with no collar detail, Kai: crew, Maya: casual crew or hoodie hint, Omar: open-collar V).
4. **Outline weight consistency.** Concepts use 1.5px at 256 viewBox. Uma should confirm this scales cleanly to 48px (likely needs a hinted variant where the motif is dropped and the outline thickens to 2px relative).
5. **Motif integration.** The accent motifs in the concepts sit as isolated shapes. Uma should integrate them more gracefully — maybe softening the opacity to 50-60% and letting them sit deeper in the gradient, so they read as *background texture* rather than *foreground decoration*.

### Per-expert refinements

**Nora** — The thesis chart behind her head should feel more like a "thought," less like a graphic. Consider rendering the line with a slightly blurred edge or a lower contrast against the gradient so it almost disappears. The point is "she is thinking in charts," not "she is wearing a chart."

**Kai** — Concept neck/shoulders are square-blocky. Uma should soften to match the family register (still angular, but not stiff). The momentum waveform motif is correct in placement; refine the curve.

**Elena** — The "smallest kind smile" is the most difficult face in the set. Concept has a simple 2% arc; Uma should test 3-4 smile variations at 128×128 and pick the one that reads as "kind but serious" rather than "cheerful." This is the conversion-driver expert — she must feel warm without being saccharine.

**Dante** — The concept's brow lines may be too heavy; Uma should reduce to the subtlest hint or remove entirely. The shield motif with rose accent dot is the key identity marker — keep the dot, it is the only use of `--error-500` in the whole set and it is load-bearing.

**Maya** — Glasses should be optional per Stefan's brief. Uma should produce two versions (with and without glasses) and CEO picks. The purple streak in hair is in the concept as a nod to "subtle creative signal" — Uma may remove if it feels over-the-top; the purple motif behind her head carries the identity already.

**Omar** — Concept's slight lean is correct (he is the "engaged" expert, posture slightly forward). Uma should preserve the 3-5° head tilt and the slightly shorter distance between his eye-line and the top frame (he reads as "leaning toward the viewer"). The open-book motif is a v1 placeholder; a soft chat-bubble is an acceptable alternate.

### What NOT to change

- **Palette assignments.** Fixed per REDESIGN-SPEC. Do not shift Elena toward lime or Nora toward cool-purple.
- **Frame shape / radius.** 24% rounded square is fixed.
- **Gradient direction and end color.** 135°, resolves to `--neutral-50` always. This is the family glue.
- **Expression register.** Closed-to-3%-smile only. Do not broaden.
- **Age / gender assignments.** Per Stefan's brief and consolidated in `visual-system-spec.md` Section 6. No re-casting.

### Deliverable format for Uma

For each expert:
1. Master SVG at `viewBox="0 0 512 512"` — clean paths, `<defs>` gradients, accessible `<title>` + `<desc>`. Target < 40 KB.
2. Hinted SVG at `viewBox="0 0 48 48"` — motif omitted, outline thickness compensated. Target < 8 KB.
3. PNG-24 at 1024 × 1024 with transparent alpha. Target < 200 KB.

File naming: `/brand/assets/experts/{name}.svg`, `{name}-48.svg`, `{name}@2x.png`. Commit alongside (not replacing) the `-concept.svg` files — concepts stay in repo as historical reference.

---

## 2. For Dev — integration plan

### 2.1 Asset location (final)

```
/Apps/ApiceCapital/brand/assets/experts/
  ├── nora.svg              (master, scales to 512+)
  ├── nora-48.svg           (hinted for inline)
  ├── nora@2x.png           (raster fallback)
  ├── kai.svg
  ├── kai-48.svg
  ├── kai@2x.png
  ├── (...for all 6 experts)
  └── _concepts/            (archived, concept SVGs live here post-handoff)
```

### 2.2 Runtime location

Copy / symlink finalized assets into:

```
/Apps/ApiceCapital/public/experts/{name}.svg
/Apps/ApiceCapital/public/experts/{name}-48.svg
/Apps/ApiceCapital/public/experts/{name}@2x.png
```

Keep `/brand` as the authored source-of-truth; `/public/experts` is the runtime-served artifact. CI can sync on build; for v1, a one-time copy is fine.

### 2.3 Component surface

Introduce a single `<ExpertAvatar />` component. All expert renderings across the app go through it — no ad-hoc `<img src="/experts/...">` anywhere.

**Suggested API:**

```tsx
<ExpertAvatar
  expert="elena"
  size="card"        // "inline" | "card" | "hero"  (48 / 128 / 512)
  loading="lazy"
  alt                // optional override; defaults from expert record
  className          // for positional styling only, never for palette
/>
```

Size → asset resolution:
- `inline` → `{name}-48.svg`
- `card` → `{name}.svg` at CSS width 128
- `hero` → `{name}.svg` at CSS width 256-512

### 2.4 Expert registry

Create a single source of truth at `/Apps/ApiceCapital/src/data/experts.ts`:

```ts
export const EXPERTS = [
  {
    id: 'nora',
    name: 'Nora',
    title: 'the Thesis Builder',
    archetype: 'Analyst',
    accentToken: '--primary-500',
    accentHex: '#8B5CF6',
    altText: 'Nora, Apice Thesis Builder — analyst portrait illustration',
    // ... philosophy, voice markers from Stefan's persona file
  },
  // kai, elena, dante, maya, omar
] as const;
```

Any expert appearance in the app pulls from this registry — copy, palette, asset path — so CEO-approved persona changes propagate without code-touching every surface.

### 2.5 Components that consume `<ExpertAvatar />` (from placement matrix)

- `<ExpertCard />` — used in expert roster grid, DCA review, Risk Check modal, onboarding quiz narration. Size: `card`.
- `<LessonHero />` — Academy lesson intro pages. Size: `hero`.
- `<InsightCard />` — Home daily insight, Research Spotlight, Fund-alert messages. Size: `card`.
- `<TooltipAvatar />` — inline contexts (Portfolio "Why this asset?", on-chain flags, chart annotations). Size: `inline`.
- `<OnboardingNarrator />` — Omar-specific, used in quiz + welcome flow. Size: `inline` (96px via CSS scaling from `-48` or direct hero at reduced CSS size — Uma to confirm which reads better).

### 2.6 Dynamic tinting

**Do not tint avatars at runtime.** The palette is baked into the SVG. Runtime tinting (via CSS `filter` or `currentColor`) would break the family consistency and the palette discipline.

**Exception:** In dark mode, the gradient lower-right stop (currently `--neutral-50`) should switch to `--surface-raised`. This is the ONLY dynamic palette change permitted. Ship it via a second SVG variant (`{name}-dark.svg`) or via CSS variable injection inside the SVG `<defs>`.

### 2.7 Performance

- SVG is the default. Lazy-load `hero`-size renders (`loading="lazy"` on `<img>` OR React Suspense boundary for SVG imports).
- Preload Omar's `hero` asset on app boot — he is the first expert the user sees in the onboarding flow. No other expert needs preloading.
- Cache: assets are immutable per version; set `Cache-Control: public, max-age=31536000, immutable` on `/public/experts/*`.

### 2.8 Accessibility

- Every avatar render includes meaningful `alt` text pulled from the expert registry.
- SVGs include `<title>` and `<desc>` children for screen readers.
- Do not use avatars as the sole conveyor of information — always pair with the expert's name + title in UI text (per Stefan's principle: "the name is the person, the title is the job").

---

## 3. For media pipeline — scaling the system

### 3.1 Adding a 7th expert later

The system has room for one more. Reserved palette slot: `--chart-7` teal (`hsl(172 66% 50%)`). Onboarding a new expert requires:

1. Stefan (or equivalent persona author) produces a 100-word bio + 3 voice markers + visual brief in the same format as existing personas.
2. @media-engineer updates `visual-system-spec.md` to add the new expert to the palette table, placement matrix, and prompt library.
3. Concept SVG generated matching the family rules (Section 7 of visual-system-spec).
4. Uma produces final master.
5. Dev adds to `experts.ts` registry. No component changes needed.

Gate: the new expert must pass the Section 7 consistency test against the existing 6 before it ships.

### 3.2 Seasonal variants (future)

If a seasonal refresh is greenlit:
- Palette shifts live ONLY in the background gradient stop (upper-left).
- Figure (skin, hair, wardrobe, facial features) NEVER changes.
- Motif can shift slightly (e.g., Elena's rising curve gets a single snowflake endpoint in December) — but must remain secondary.
- Store as separate SVG files: `{name}-holiday.svg`. Never overwrite the master.

### 3.3 Animated versions (future)

Per REDESIGN-SPEC, animated micro-interactions are permitted via Framer Motion. Each expert can have:
- **Entrance animation:** fade-in + 8px vertical rise, 250ms, `ease-default`. Applies to hero contexts.
- **Attention animation:** subtle 2% scale pulse on motif only, 1.5s loop, pauses after 3 cycles. For "Dante flagged this" alert contexts.
- **No mouth/eye animation.** Explicitly not permitted — breaks the premium register the moment an expert "blinks" or "smiles live."

### 3.4 Localization

No localization expected — these are portraits, not text. Place names (Nora, Kai, etc.) do not translate. The only localization touchpoint is the `altText` in the registry, which should be translated into Spanish when the app ships ES.

### 3.5 App Store / marketing derivatives

For F6 (App Store assets) and F9 (marketing):
- Never use an expert alone as the primary App Store screenshot subject. Risks looking like a "meet our AI" feature pitch, which is not the product thesis.
- Expert avatars CAN appear in feature-in-use screenshots (e.g., a DCA Planner review screen with Elena's card visible) — this is their intended marketing exposure.
- For social / OG images, use the expert roster as a 6-tile grid only. Never a single expert in isolation at hero size on a marketing image.

---

## 4. Production path recommendation

Three options, per the brief. Full analysis + recommendation.

### Option A — Uma finalizes all 6 in vector

- **Effort:** ~2 weeks (she already has the spec and concepts; the lift is craft, not conception).
- **Cost:** full Uma-week allocation × 2.
- **Quality:** highest. Native vector, fully hand-harmonized, family-perfect.
- **Risk:** Uma is currently loaded with F2 (logo) and F6 (app icon). Pulling her for 2 full weeks blocks those upstream deliverables.

### Option B — AI-assisted first pass, Uma polish

- **Effort:** ~1 week total. 2 days AI generation + selection (@media-engineer), 3 days Uma vectorization + harmonization.
- **Cost:** ~40% of Option A.
- **Quality:** high — AI handles the portrait geometry, Uma enforces the family consistency. Risk of AI output drifting toward subtle photorealism or anime is real, mitigated by the aggressive negative prompt in `visual-system-spec.md` Section 8.
- **Risk:** brand drift if AI outputs are shipped without Uma's normalization. Mitigated by contract: Uma MUST re-cut every AI output to SVG; no rasters ship.

### Option C — Ship concepts as v1, upgrade in v2

- **Effort:** hours (concepts already exist; Dev just wires `<ExpertAvatar />`).
- **Cost:** trivial.
- **Quality:** acceptable for internal beta / early demo; visibly under-polished for paid-tier users.
- **Risk:** CEO iteration principle is active — shipping concepts as v1 aligns with it, BUT the concepts are *schematic*, not *styled*. They will read as "early placeholder art" against a $149.90/mo pricing register. That is a credibility cost.

### Recommendation: **Option B**, with concrete caveats.

**Why B over A:** Uma's weeks are blocked on logo + app icon, which are upstream of the experts (logo precedes icon precedes roster art). Pulling her for full 2-week expert production cascades the whole F1-F6 critical path. Option B frees her to ship the 3 most important deliverables in parallel (logo, icon, expert polish) instead of serializing.

**Why B over C:** Concept-quality avatars at 128 × 128 in a DCA review screen next to "Elena recommends…" copy will actively hurt conversion on the Pro tier. The experts are a credibility signal, not just decoration. Under-polished experts undermine the "we hired institutional analysts" premise Stefan built.

**Concrete plan for Option B:**

1. **Week 1, Days 1-2 (@media-engineer):** Run the prompt library from Section 8 through Midjourney v6 / Firefly. Generate 4 candidates per expert (24 total). Reject aggressive smiles, jewelry, any cliché catches. Select top 1 per expert closest to the family register.
2. **Week 1, Days 3-5 (@ux-design-expert / Uma):** Vectorize each selection. Normalize silhouettes, palette, frame radius, gradient recipe against `visual-system-spec.md`. Ship the 6 masters + 6 hinted 48px variants + 6 @2x PNGs.
3. **Week 1, Day 5 (Dev):** Wire `<ExpertAvatar />` + `experts.ts` registry. Replace any placeholder usages across the app.
4. **Week 2 (@qa):** Consistency review per Section 7 (5-point test). If any expert fails, 1-day iteration by Uma.

**Total lead time:** 7-10 working days. Unblocks F6, F8, F9.

---

## 5. What this unblocks

Once the experts ship (at v1 quality level, via Option B):

- **F6 — App icon.** The app icon concept may incorporate the journey-line motif (per Atlas competitive audit Section 5.5). If the icon references any expert visual (unlikely but possible via "node on a journey line" metaphor), it needs the final expert palette locked. Option B's week-1 timeline means F6 can start week 2 without blocking.
- **F8 — Badges using expert motifs.** Per V2-MASTER-PLAN, badges ladder up to rarity tiers. Mid-tier badges can use expert-signature motifs (Elena's rising curve for a DCA streak badge, Dante's shield for a risk-discipline badge). These are blocked on the final motif shapes, which Uma locks in her vectorization pass.
- **F9 — Marketing featuring experts.** Ad creatives, landing page hero, email onboarding art — all are cleared to begin the moment the 6 finals land. Until then, marketing should use the logo + neutral illustration system from REDESIGN-SPEC F2, with experts explicitly NOT appearing in marketing until they reach production quality.

Specifically **blocked today** (pending Option B execution):
- Any expert-featuring marketing creative
- Badge motif design iteration (@ux-design-expert)
- Academy lesson hero templates that render an expert portrait
- The "Meet Your Experts" onboarding screen (if one is planned in V2 per Stefan's "Omar is first face" principle, Omar's final asset is sufficient to ship a v1 of this screen even before the other 5 land)

---

## 6. Sign-off chain

1. **@media-engineer** (this document) → ships spec + concepts + handoff.
2. **Jarvis → CEO** — recommendation approval (Option A/B/C).
3. **CEO approved option flows to:**
   - If A → Uma full production, 2 weeks.
   - If B → @media-engineer AI pass (2 days), Uma polish (3 days), Dev integration (1 day), QA review (1 day).
   - If C → Dev integration on current concepts (half day), Uma v2 re-production in a later sprint.
4. **@pm (Morgan)** — schedules into sprint, blocks F6/F8/F9 as dependencies or unblocks them.
5. **@devops (Gage)** — if route B/C pushes before quality gate passes, route through `*push` with explicit waiver note in commit.

---

*Production handoff v1 — @media-engineer, for Apice Capital*
