# Apice Capital Brand — Decisions Log

> **Status:** Live document. Every CEO decision that shapes the brand ecosystem is recorded here with date, rationale, and impact.
> **Last updated:** 2026-04-17

---

## Governance Principle

**Iteration over perfection.** All decisions here are v1 commitments. Refinements are expected and welcomed as the brand matures. A decision is not a lock-in; it is a direction.

---

## 2026-04-17 — Checkpoint 1 Decisions (CEO approved in block)

### D1. Tagline evolution — APPROVED

- **From:** *"Build Crypto Wealth. One Week at a Time."*
- **To:** *"Build Wealth. One Week at a Time."*
- **Rationale:** Removing "Crypto" elevates the brand ceiling from "crypto app" to "wealth platform." Convergent recommendation from Stefan (copy) and Atlas (competitive positioning). Apice's product roadmap (V2-MASTER-PLAN) spans DCA, AI trade, education, cashback — too broad to anchor in crypto alone.
- **Impact:** Update og-image.svg, all marketing copy, onboarding hero. Log update order in F8/F9.

### D2. Brand positioning — APPROVED

- **Decision:** 65% premium / 35% accessible — *Revolut-register*, not Robinhood-register.
- **Rationale:** Aligns with CEO's "elite investor" ideology (per V2 Elite Mindset track + Apice Code Manifesto). Atlas recommendation after scanning 10 competitors. Opens the "warm premium + educational" white space (only Kraken purple is nearby, and they target pro-traders, not wealth-builders).
- **Impact:** Every visual decision biases premium — muted palettes over neon, quiet gradients over glow, editorial over meme.

### D3. Logo direction — ~~APPROVED: Direction C (Apex-A)~~ **SUPERSEDED 2026-04-17**

- **~~Original decision:~~** Direction C (Apex-A) — custom *A* glyph with summit tick.
- **Superseded by D3b** after visual review. Rationale for pivot: Apex-A read as "design-school conceptual" — too many elements (letter + tick + shelf) competing against the Apple/Claude/Nike benchmark the CEO aspires to.
- **Artifacts preserved:** SVGs and spec remain in `/assets/logos/` for historical reference. Do not delete — future brand audit may revisit.

### D7. **BRAND V2 FINAL APPROVED — Sprint 0 executed** (2026-04-17, 18:00)

**Final approved visual system:**
- Triangle mark: v6 final (stroke 4u, outline-only, rounded joins) — `apice-triangle-v6-final.svg`
- Triangle in circle (dark hero): matches Landing screenshot exactly, translucent white + #528FFF blue glow
- Wordmark: "Apice" Geist 700 + emerald dot `#16A661` signature
- Palette: Ink `#0E0E12` · Cream `#F7F3ED` · Emerald `#16A661` · Emerald Deep `#0F5D3F` · Blue Glow `#528FFF` (Landing only)
- Typography: Geist sans/display/mono — weights 400 / 500 / 700

**Sprint 0 executed (2026-04-17 auto mode):**
- ✅ 75 assets copied to `src/assets/brand/` (logos, experts, clients, abstract, ai-apice, badges)
- ✅ 6 experts post-processed: 512×512 crop + emerald signature dot overlay with white ring → `{name}-final.png`
- ✅ 20 clients post-processed: 512×512 + 256×256 variants · split `men/` vs `women/` · renamed `{country}-{name}.png`
- ✅ Feature flag system `src/lib/featureFlags.ts` with 4 flags (ENABLE_BRAND_V2, ENABLE_AI_EXPERTS, ENABLE_TESTIMONIALS_V2, ENABLE_APICE_AI_VIZ)
- ✅ Data modules: `src/data/experts.ts` (6 experts with bio/voice/screens) + `src/data/clients.ts` (20 clients with country/plan)
- ✅ Components v1 created: `<ApiceLogo/>` (6 variants), `<ExpertAvatar/>`, `<ClientAvatar/>`, `<Testimonial/>`, barrel `index.ts`
- ✅ Brand Book v2.0 + V2 Action Plan committed to repository
- ✅ Favicon + OG image copied to `public/apice-favicon-v2.svg` + `public/apice-og-v2.svg`

**Pending decisions (still blocking full V2 launch):**
1. 🔴 CEO: Rotate API key `AIzaSyA...dwzGs` (exposed in chat)
2. CEO: App Store pricing path (A single tier $49.90/$149.90 vs B mobile split $4.99/$14.99 + web $49.90/$149.90)
3. CEO: Manifesto sign-off (read `apice-code-manifesto-FINAL.md`, edit 1-3 lines if any does not ring true)
4. CEO: Paid vs organic Month 1–3 strategy (media-head recommended organic-first)

**Next: Sprint 1 ready to start** — `<ApiceLogo/>` swap in `Landing.tsx:110`, favicon+OG in `index.html`, iOS icon generation via `xcassetgen`.

### D6. Refinements after CEO review of final system (2026-04-17, 16:30)

After reviewing PREVIEW-FINAL.html, CEO requested five refinements:

1. **Dark-mode wordmark:** must be WHITE/CREAM on dark surface (not ink) — Uma to fix `apice-wordmark-primary.svg` and derivatives to use `currentColor` or explicit cream fill on dark themes
2. **App icon primary:** REVERT decision D5 internal — use **wordmark "Apice" centered** (not dot-only). CEO: "dot-only is too simple; Apice is better"
3. **Abstract visual identity system:** design motifs/patterns that represent GROWTH **indirectly and artistically** (not charts, not arrows, not literal graphs). Musical/poetic abstraction. Will become system primitives for marketing + product backgrounds + onboarding.
4. **AI Apice visual identity:** design a separate visual system for the Apice AI itself (distinct from the 6 individual experts). Should cover: idle state, thinking state, speaking state, transitional moments. Apple Intelligence-adjacent register.
5. **Experts via nano-banana:** produce a complete prompt package for Google Gemini 2.5 Flash Image ("nano-banana") to generate the 6 experts as photorealistic/semi-photorealistic portraits. Package must be copy-paste ready for @media-engineer or CEO to execute externally.

**Impact:** Uma patches existing SVGs + designs abstract growth system. Media-engineer designs AI Apice identity + nano-banana prompt library.

### ~~D5. FINAL LOGO DIRECTION APPROVED — V3.01 "The Dot, Plain"~~ (core kept, two tweaks per D6)

- **Decision:** Ship V3.01 — the baseline.
- **System specification:**
  - **Wordmark:** "Apice" in Geist 700, title case, tracking -30 (tight)
  - **Signature:** A single period (dot) after "Apice" in **bright emerald #16A661**
  - **Base palette:** Near-black `#0E0E12` + Warm cream `#F7F3ED` + bright emerald `#16A661` signature
  - **NO descriptor** — no "CAPITAL", no "HOLDINGS", no "RESERVE"
  - **NO custom letterforms** — Geist refined, not redrawn
  - **NO peak mark** — wordmark-only with dot
  - **Register:** Stripe / Linear / Plaid (tech-professional minimalism)
- **Rationale:** CEO chose the simplest and most restrained of the 10 variations. "A arrogância silenciosa do mínimo viável com craft perfeito." Survives 5-year horizon because nothing to date it. Favicon = dot alone.
- **Supersedes:** all prior rounds (v1 Apex-A, v2 Ascent/Summit/Compass, v3 CIFRA/CAPITELLO, v5 Monumental/Flow/Split/Neon, v6 variations 02–10).
- **Impact:** Immediate delegation to 6 agents in parallel for complete high-tier asset system.

### ~~D4. Logo direction v4/v5/v6 evolution~~ **SUPERSEDED by D5**

- **v4 (evidence-based research):** Pivoted away from heritage-luxury references after CEO rejected v3 ("horrível, não faz sentido"). Conducted EXA research on 10 real competitors in "global investment platform" category. Produced `visual-research-category-DNA.md` with patterns, quadrant map, and two evidence-based directions (A: Refined Serif / B: Modern Sans + Pop).
- **v4 CEO decision:** **Option B (Modern Sans + Pop)** — peer register Nexo 2024 / Robinhood 2024 / Wise / Plaid.
- **v5 (5 variations inside Option B):** Monumental / Flow Mark / The Dot / Split Weight / Neon Tittle.
- **v5 CEO decision:** **V3 "The Dot"** — title case "Apice." with signature dot, but:
  - Switch signature color from amber to GREEN
  - Replace "CAPITAL" with something more elaborate
  - Produce 10 progressively more refined variations
- **v6 (current round):** Stefan produced 12 descriptor alternatives (top picks: HOLDINGS / RESERVE / NO-DESCRIPTOR). Uma produced 10 progressively elaborated variations (pick: V3.10 master with 5 custom letterforms + peak mark + green system). All artifacts in `01-brand-foundation/apice-descriptor-alternatives.md` + `01-brand-foundation/apice-v3-green-evolution.md`.

### ~~D3c. Logo direction v3~~ **SUPERSEDED by D4**

- **CEO feedback:** v2 shapes (Ascent/Summit/Compass) read as minimalist-correct but **lack craft, weight, and cultural presence**. Apple/Claude/Nike were only the floor — the ceiling needs heritage-grade brands.
- **Expanded reference set for v3:**
  - **Apple** — still present, but only for geometric discipline
  - **Claude** — still present, for warmth
  - **Nike** — still present, for one-gesture economy
  - **Stripe** — for the sophistication of wordmark + system typography
  - **Linear** — for tech-premium craft
  - **Hermès** — for heritage/timelessness in a modern mark
  - **Cartier** — for custom wordmark craft that screams luxury without words
  - **Rolex** — for mark+wordmark+heritage as a complete system
- **Brief for v3:** ship a **complete brand system**, not an isolated mark. Mark + custom wordmark + typography treatment must work as one. Craft must be detectable — small details that reveal quality on inspection. "Premium timeless" over "modern minimal."
- **Impact:** v2 SVGs preserved as historical reference. Uma runs a new exploration with 2–3 richer directions focused on system-completeness and heritage posture.

### ~~D3b. Logo direction v2~~ **SUPERSEDED 2026-04-17 by D3c**

Reason: CEO judged v2 directions (Ascent/Summit/Compass) too simple, lacking cultural weight.

- **Decision:** Restart logo exploration guided by three benchmarks — **Apple, Claude (Anthropic), Nike**.
- **Distilled brief:**
  - *Apple* → Pure minimalism. A single shape. Zero ornament. Monochromatic by default.
  - *Claude* → Organic-geometric warmth. Custom gesture made by hand, not compass. Human-humane, not corporate-cold.
  - *Nike* → One gesture. Memorable without a wordmark. Attitude and movement in a single stroke.
- **Common denominator:** a singular, abstract, scalable mark that carries the brand alone. No letters, no mountain metaphors, no literal "apex" imagery.
- **Paleta + tipografia:** preserved (Warm Indigo `#8B5CF6` + Warm Amber `#F59E0B`, Geist wordmark). Only the mark changes.
- **Impact:** Uma produces 3 new directions v2. CEO selects. Apex-A artifacts parked as reference only.

### D4. AI Experts naming — APPROVED in block

- **The Six:**
  1. **Nora, the Thesis Builder** (Analyst)
  2. **Kai, the Pattern Reader** (Momentum)
  3. **Elena, the Patient Compounder** (DCA Master)
  4. **Dante, the Risk Architect** (Risk Manager)
  5. **Maya, the Deep Researcher** (Researcher)
  6. **Omar, the Mentor** (Mentor)
- **Rationale:** International names, 5–7 letters, gender-diverse (3F / 2M / 1 neutral-leaning), no fintech-cliché conflicts, each passes search-ownability test. Full philosophy in `03-ai-experts/personas-concept.md`.
- **Impact:** Uma + media-engineer start visual production in F7. Future rename = high cost (ilustrações, copy, DB seeds).

### D5. Apice Code Manifesto — APPROVED: CEO polishes Stefan's draft

- **Path:** CEO takes `01-brand-foundation/apice-code-manifesto-DRAFT.md` and edits to own voice. Stefan's 7 tenets are scaffolding — keep what resonates, rewrite what does not.
- **Rationale:** Draft already carries the ideological spine ("wealth is discipline, not event"). CEO's voice is non-negotiable for the final — this is the document that becomes Elite Mindset L7 and the tattoo-worthy initiation line.
- **Impact:** Blocked by CEO's own calendar. No blocker for F5–F7 (other assets). Blocks Academy Track 6 content (V2 Pillar 2).

### D6. Pricing (inherited from V2-MASTER-PLAN) — CONFIRMED

- **Pro:** $49.90/month
- **Club:** $149.90/month
- **Rationale:** Matches cohort projections ($234K Year 1 per 10K signups). No changes.
- **Impact:** Lock into marketing copy, upgrade screens, manifesto references.

---

## Pending decisions (to be resolved in later checkpoints)

From V2-MASTER-PLAN (unresolved):

- **ALTIS risk discipline** — enforce 30-day lock if user breaks 2% risk rule? (Product decision, not brand)
- **Challenge 6 reward** — Founding Member 25% lifetime discount? (Brand/marketing impact — determines badge tier)
- **Challenge 10 reward** — Elite Challenge → Club lifetime free? (Brand/marketing impact — determines the "Elite" ceiling narrative)
- **Video hosting** — YouTube embed start → Mux in Q2? (Affects player asset design)
- **Content ownership** — CEO writes Elite Mindset + ALTIS narrative, contractor writes Foundation + DCA? (Affects copy pipeline for F8)

New decisions from brand ecosystem (to surface when relevant):

- **Illustration style library** — commit to one style for onboarding + experts + empty states + badges (proposed: flat minimalist + warm gradients — pending confirmation after first avatars ship)
- **Motion language** — confetti intensity, level-up choreography, signature transition (proposed in REDESIGN-SPEC section E, awaiting production validation)
- **Photography vs. illustration for marketing** — Swan uses photo, Robinhood uses none, Cleo uses illustration. Apice default: illustration-first, photo sparingly (to be validated in F9)

---

## Change log

| Date | Event | Source |
|---|---|---|
| 2026-04-17 | Initial 6 decisions approved in block | CEO via Jarvis checkpoint 1 |
| 2026-04-17 | Iteration principle codified | CEO: "tudo vai ser lapidado e evoluido ao longo do tempo" |

---

*This log is maintained by Jarvis. Append-only. Past decisions are never deleted — only superseded, with reference to the superseding decision.*
