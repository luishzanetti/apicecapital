# Apice Capital — Logo Concepts v2

> **Author:** @ux-design-expert (Uma)
> **For:** Jarvis → CEO
> **Date:** 2026-04-17
> **Status:** v2 exploration — replaces Apex-A (D3 superseded by D3b)
> **Benchmarks:** Apple · Claude (Anthropic) · Nike
> **Deliverable:** 3 directions, one recommendation

---

## 0. The restart, in one page

The previous round (Apex-A) tried to do too many jobs with one mark: a custom letter, a summit tick, a foundation shelf. Three ideas in one glyph is the signature of a student portfolio, not a brand.

The CEO's three benchmarks all teach the same lesson from different angles:

- **Apple** — one shape, zero ornament, the mark carries the brand alone.
- **Claude** — one gesture, hand-made warmth, asymmetric by intent.
- **Nike** — one stroke, pure motion, no metaphor required.

The common denominator is **one move**. One shape. One stroke. One gesture. Everything else is decoration, and decoration is what made Apex-A read as design-school.

The three directions below each commit to **one move**. They differ in posture (Nike-leaning, Apple-leaning, Claude-leaning), not in amount of craft. All three can ship as a favicon tomorrow. All three can stand without the wordmark.

The palette and wordmark decisions from the prior round stand: Warm Indigo `#8B5CF6` primary, Warm Amber `#F59E0B` ceremonial, Geist wordmark. Only the mark changes.

---

## Direction 1 — "Ascent"

> The gesture of going up, captured in a single unbroken stroke.

### Benchmark lean — Nike

Nike leans on this direction most directly. The Swoosh is not a bird, not a checkmark, not a wing — it is the feeling of speed rendered as a single curve. Ascent is the same principle applied to a different verb: not speed, but rise. One stroke, one meaning, no decoding.

### Strategic rationale

Apice's product thesis is weekly DCA compounding into long-horizon wealth. Every feature — streaks, the Learning Map, level-up, Capital Game — expresses the same idea: **a line going up, slowly, on purpose**. Ascent makes that thesis the mark. It is the journey line from Atlas's audit (§5.5) promoted from signature motif to primary identity.

Where Apex-A read as "the letter A tries hard," Ascent reads as motion first. There is no letter to decode, no summit to point at, no metaphor to justify. A user sees a rising curve and feels rise. That is the whole job.

The direction is also defensible commercially. Nike did not own "swoosh." Nike owned "a single stroke that feels like movement." The category here (crypto + DCA + AI) is crowded with logos that decorate — gradient spheres, 3D coins, geometric letters. A single ink-weight curve is the rarest posture in the category, and scarcity is brand equity.

### Visual description

A single stroke with variable weight. It starts heavy and low on the left, thins as it sweeps upward and rightward, and terminates in a sharp but not aggressive taper at the top-right. The curve is not a circle-arc — it is a **tensioned bezier** whose mass lives in the lower-left third and releases into the upper-right.

**Construction grid:**
- 24-unit artboard.
- Stroke starts at `(2, 18)` with weight 4.5u, reaches its apex of weight at `(6, 15)` (weight 5u), then begins to thin.
- The midpoint sits at `(13, 9)` with weight 3u.
- The stroke terminates at `(22, 3)` with weight 0.8u — sharp, but angled not pointed.
- The inner (concave) edge of the curve is a pure bezier; the outer (convex) edge is a parallel bezier offset by the variable weight. No calligraphic bulge, no brush texture.
- Optical balance: the visual center of mass sits at roughly `(10, 13)`, slightly below and left of the geometric center — the same trick Nike uses to make the Swoosh feel like it is "launching" out of the frame.

**The inflection point** (where the curve transitions from lower-left mass to upper-right release) is the mark's signature. It sits at roughly 40% of the stroke's length, not the midpoint. That offset is what makes the gesture feel like an ascent rather than a symmetric arc.

### Sketch

```
                                        .
                                      .
                                    .
                                  ..
                                .`
                             ..`
                          ..`
                       ..``
                    ..``
                ...``
            ....``
       .....``
    ....``
 ...``
....
```

Conceptual SVG (single path, variable-weight):

```
<svg viewBox="0 0 24 24">
  <path d="
    M 2 18
    C 4 17, 5 16, 6 15
    C 9 13, 11 11, 13 9
    C 16 7, 19 5, 22 3
    L 22 3.6
    C 19 5.6, 16 7.6, 13 9.6
    C 11 11.6, 9 13.6, 6 15.8
    C 5 16.6, 4 17.4, 2 18.6 Z"
    fill="currentColor" />
</svg>
```

(The final production SVG replaces the two parallel beziers with a properly tapered filled shape — the code above is directional.)

### Why it is not derivative

- **Not the Nike Swoosh** — the Swoosh sits flat on a baseline, curves *under* itself, and has a horizontal read. Ascent rises diagonally and never returns to the baseline. Swoosh reads as "across." Ascent reads as "up."
- **Not the Apple apple** — Apple is a filled organic silhouette with a bite. Ascent is an open stroke with no closed volume.
- **Not the Claude asterisk** — Claude is radial and 8-fold symmetric (roughly). Ascent is directional and asymmetric.
- **Not the Coinbase C / Revolut R** — both are letter-derived monograms. Ascent derives from no letter.
- **Not the Apex-A** — Apex-A was a constructed letterform. Ascent has no glyph DNA.
- **Not a chart line** — no node, no data point, no grid implied. A chart line has texture of measurement. Ascent has the texture of gesture.

### Scalability read

- **1024px:** The variable weight is clearly visible. The inflection point sings. Use as hero mark.
- **180px (app icon):** Still reads as a rising stroke. The taper at the top simplifies to a clean diagonal end.
- **32px:** Variable weight compresses but holds. The curve reads as a single slash-like rise.
- **16px (favicon):** At this size, the variable weight becomes hinting-dependent. We commit to a **hinted favicon variant** (see favicon treatment) where the stroke is uniform 2u weight.

### Favicon treatment

- At 16px and below, **drop the variable weight**. Ship a dedicated uniform-stroke SVG (`favicon-16.svg`) where the curve is a single 2u-weight bezier following the same path.
- At 16px the mark is effectively **a rising slash with a bend** — still recognizable, still Apice.
- For iOS/Android app icon (180px, 1024px), use the full variable-weight mark centered on a warm-cream background `#F5F1E8`, or a warm-indigo background `#8B5CF6` for dark mode.

### Wordmark relationship

Ascent **can stand alone** — that is the design goal. On first-touch surfaces where Apice has no awareness yet (ads, app store thumbnails, press photos), the mark is paired with the Geist wordmark to the right, same cap-height as the mark's visual height, with the mark's visual center aligned to the wordmark's cap-line. On owned surfaces (app icon, splash, in-app navigation, the Club physical card), the mark stands alone.

This is the Nike model. In 2024, Nike rarely pairs Swoosh with the word "Nike" in owned brand contexts. Apice graduates to that over 18–24 months.

### Color application

- **Monochromatic-first.** Primary use is Warm Indigo `#8B5CF6` on warm-cream `#F5F1E8`, or warm-cream on Warm Indigo.
- **Never use gradient inside the mark.** The variable weight IS the visual richness. Adding gradient on top makes it look like every Web3 logo.
- **Ceremonial amber:** Warm Amber `#F59E0B` is reserved for **one** usage — the Founding Member certificate, Club physical card embossing, and the splash animation's final frame. Amber Ascent appears maybe 12 times per year, total, across all surfaces.
- **Dark mode:** Warm Cream `#F5F1E8` mark on Warm Indigo `#4C1D95` (deeper indigo) background. Never pure white on pure black.

### What this direction rejects

- Any "up-and-to-the-right arrow" literalism.
- Any node, dot, or gem at the top of the stroke — which would turn it into a chart.
- Any second stroke crossing the first (like a checkmark) — which would turn it into a verify-glyph.
- The previous Apex-A mistake: **ornamenting a core gesture with additional elements to "prove" meaning.** Ascent carries meaning in its single curve or it fails.
- Crypto clichés from Atlas's audit §5.4: no neon glow, no laser-beam terminals, no holographic fill.

### Pros · Cons · Execution risk

**Pros**
- Strongest "one gesture" purity of the three directions.
- Scales beautifully at hero sizes — the variable weight is a joy to render.
- Embodies the journey-line thesis directly. Unifies brand mark with product's recurring motif.
- Dead simple to animate (splash screen: the stroke draws itself in 900ms).
- Rarest posture in the competitive set — no fintech has committed to a pure variable-weight single-stroke mark.

**Cons**
- At 16px the variable weight needs a dedicated hinted variant. Adds one asset to the pipeline.
- Without the wordmark for the first 12 months, some users may not register it as "a brand" — it will feel like a graphic element. This is Nike's decade-one problem. We accept it.
- Horizontal-reading asymmetry makes vertical/circular lockups harder. Lockup system requires a custom stacked variant.

**Execution risk:** LOW. The mark is one bezier. Geometry is defensible. Production is 5–7 days for a complete SVG set (hero, favicon, lockup, dark, amber ceremonial).

---

## Direction 2 — "Summit"

> One filled shape. A peak, asymmetric by one degree, no stroke, no ornament.

### Benchmark lean — Apple

Apple is the anchor for this direction. The Apple mark is one filled silhouette with one deliberate asymmetry (the bite) inserted for optical and mnemonic reasons. Summit applies the same grammar: one filled shape, with one intentional asymmetry that turns a geometric form into a specific mark.

### Strategic rationale

Where Ascent captures the motion of wealth-building, Summit captures its destination. A filled geometric form carries more gravitas than an open stroke — and Apice's pricing ($49.90 Pro, $149.90 Club) and positioning (Revolut-register, 65% premium) demand gravitas.

The direction also solves a practical problem that Ascent does not. A filled solid shape is the easiest mark to reproduce across every medium — embroidery on a Club jacket, etched into a physical card, debossed on letterhead, printed in one-color newspaper ink. Ascent is a digital-native mark. Summit is a mark that survives five centuries of reproduction methods.

Most importantly, Summit is the direction with the **lowest cognitive cost**. There is nothing to decode. You see a filled shape, you recognize it, you move on. Apple's apple is not clever. Summit should aspire to the same non-cleverness. If someone asks "what does it mean?" we have failed.

### Visual description

A filled geometric form that is a **convex rounded triangle with one deliberately shortened left side**. Not an isoceles triangle, not a perfect equilateral. The asymmetry is the point.

**Construction grid:**
- 24-unit artboard.
- Three anchor points:
  - **Peak:** `(14, 3)` — slightly right of center. This is the single most important geometric decision. Peak-at-center reads as a generic mountain icon. Peak-at-14-of-24 reads as *a specific mark*.
  - **Lower left:** `(4, 20)`
  - **Lower right:** `(21, 19)` — intentionally 1 unit higher than lower-left, creating a subtle baseline tilt
- All three corners are rounded with a radius of 2u — not sharp. This is what separates Summit from a play-button triangle or a generic peak icon.
- The three edges between corners are NOT straight lines. They are **very gentle convex curves** (bezier control points pushed out by 0.6u from the straight-line midpoint), making the form look slightly inflated, slightly alive. Like a river stone, not a knife.
- Total visual volume fills roughly 62% of the bounding box — dense, anchored, present.

**The one asymmetry:** the peak is offset right by 2u, AND the lower-right anchor is 1u higher than the lower-left. Read together, these two small offsets make the mark feel like it is *leaning into* its rise, rather than standing static. This is Summit's version of the Apple bite: a deliberate imperfection that makes a geometric form feel authored.

### Sketch

```
                        .
                      .  .
                     .    ..
                    .       .
                   .         .
                  .           ..
                 .              .
                .                ..
               .                   .
              .                     ..
             .                        ..
            .                           ..
           .                              ..
          .                                  ..
         .                                     ..
        .                                        ..
       ...............................................
```

Conceptual SVG:

```
<svg viewBox="0 0 24 24">
  <path d="
    M 14 3
    C 14 3, 16 4, 17 5.5
    C 19 9, 20 13, 21 19
    C 21 19, 20 20, 18 20
    C 12 20.5, 7 20.5, 4 20
    C 4 20, 3 19, 4 17.5
    C 6 13, 9 8, 11.5 4.5
    C 12.5 3.2, 13.5 3, 14 3 Z"
    fill="currentColor" />
</svg>
```

### Why it is not derivative

- **Not the Nike Swoosh** — Swoosh is an open stroke with negative space carrying the gesture. Summit is a closed filled volume.
- **Not the Apple apple** — Apple is organic (a real-world object), has a bite, and sits on a leaf. Summit is geometric, has no notch, and has no additional elements.
- **Not the Claude asterisk** — radial vs. directional, open vs. filled.
- **Not the Coinbase C / Revolut R** — no letter DNA.
- **Not a generic mountain icon** — those are symmetric, sharp-cornered, and often doubled (two peaks). Summit is one peak, asymmetric, rounded.
- **Not a play-button triangle** — play buttons have a sharp right-angle at the playback direction. Summit's corners are all rounded.
- **Not the Apex-A** — Apex-A was a letter. Summit is a shape. No glyph DNA.

### Scalability read

- **1024px:** The gentle convex curves and rounded corners are felt, not seen. The asymmetry is visible but not announced.
- **180px (app icon):** Ideal size. The mark fills the icon confidently with the warm-indigo surround.
- **32px:** Still clearly a rounded asymmetric peak.
- **16px (favicon):** Perfect performance. A filled geometric shape is the single best form factor for 16×16. This is Summit's strongest argument.

### Favicon treatment

- Summit is the only direction of the three that requires **zero simplification** at 16px. The mark is a single filled path — rasterizes cleanly at any size.
- For 16×16 favicons, we may slightly thicken the corner radii (from 2u to 2.5u proportionally) to compensate for anti-aliasing mush, but this is a pixel-hinting refinement, not a design change.

### Wordmark relationship

Summit **can stand alone** on owned surfaces from day one. This is its competitive advantage against Ascent. A filled shape registers as "a brand" faster than a single stroke does, because filled shapes are how brand marks have looked for 200 years.

Wordmark lockup: Summit to the left, Geist "Apice" wordmark to the right, vertical centerline of Summit aligned to the baseline of the wordmark (not the cap-line — Summit's visual weight sits lower). Spacing between mark and wordmark = 0.75x the mark's width.

### Color application

- **Monochromatic-first.** Warm Indigo `#8B5CF6` solid fill is the default. Warm Cream `#F5F1E8` solid fill on indigo background is the inverse.
- **No gradient, ever, inside the fill.** This is the Apple rule. If someone wants "visual interest," it goes in the typography, the layout, or the photography — never the mark.
- **Ceremonial amber:** Warm Amber `#F59E0B` solid fill for the same three surfaces as Ascent (Founding Member cert, Club card emboss, splash last frame). Amber Summit reads as "the Gold Standard" — appropriate for Club tier ceremony, wrong for daily app.
- **Dark mode:** Warm Cream fill on Warm Indigo `#4C1D95` deep background.

### What this direction rejects

- Any attempt to add a "base" or "shelf" below the peak — that was Apex-A's mistake.
- Any second peak, crease, or facet — this is one shape, not a faceted gem.
- Any outline / stroke variant — Summit is filled or it is nothing. No ghost/outline version exists in the spec.
- Any rotation — Summit never appears sideways, upside down, or mirrored. It is monumental and fixed.
- Crypto clichés: no faceted gem rendering, no 3D depth, no metallic gradient.

### Pros · Cons · Execution risk

**Pros**
- Best favicon performance of the three directions.
- Easiest reproduction across physical media (embroidery, emboss, foil, engrave).
- Lowest cognitive cost — instantly memorable without explanation.
- Most "wealth-coded" of the three posture options — peaks have 2,000 years of gravitas behind them.
- Aligns with Atlas's "accessible premium" positioning — a rounded filled shape reads as warmer and more premium than a hard geometric one.

**Cons**
- Least differentiated at the concept level. "Peak-shaped logo for a wealth brand" is not rare — the differentiation lives entirely in the specific asymmetry and the specific roundness. Execution has to be flawless or it reads generic.
- Does not visualize motion. Where Ascent embodies the thesis of compounding, Summit only implies the destination.
- More vulnerable to the Apex-A critique than the other two directions — because it IS a peak, it has to work very hard to not read as "mountain logo."

**Execution risk:** MEDIUM. The geometry is simple but the asymmetry tolerance is tight — a 1u offset in any anchor point breaks the mark. Production is 4–6 days.

---

## Direction 3 — "Compass"

> A 4-point star, hand-drawn rather than compass-drawn. Asymmetric on purpose. Warm.

### Benchmark lean — Claude

Claude leans on this direction. Anthropic's asterisk is a radial mark with eight petals that are *not* mechanically equal. That asymmetry is a deliberate warmth signal. Compass applies the same principle to a different count: a 4-point star whose four arms are each slightly different, rounded at some terminals and pointed at others.

### Strategic rationale

This direction bets that Apice's warmth differentiation (the one Atlas calls defensible in §4) should live primarily in the mark itself, not just in the palette and copy. A hand-drawn feel in the logo carries a semantic promise the app can then fulfill: "we are not a trading-bot template, we are made by people who think about wealth."

The compass-point reading matters strategically. Users are asking Apice to guide them from novice to Elite across the Learning Map. A compass is the oldest metaphor for guidance — but a literal compass with North-East-South-West labels is a cliché. A 4-point star that *implies* compass-without-stating-it threads the needle: the meaning is there for those who want it; the mark stands on its own for those who do not.

Compass also solves a specific product problem. Apice has **6 AI Experts** (Nora, Kai, Elena, Dante, Maya, Omar). A radial mark with 4 distinct arms becomes a natural framework for the AI Experts' visual identity: each expert can occupy a quadrant-direction of the mark, with a small sigil that completes the system. A directional mark like Ascent or a singular mark like Summit cannot do this.

### Visual description

A 4-point star with **deliberate asymmetry across all four arms**. Two arms terminate in sharp points, two terminate in rounded nubs. The vertical arm is longer than the horizontal. The star has no outer ring, no inner stroke, no ornament.

**Construction grid:**
- 24-unit artboard. Center at `(12, 12)`.
- **North arm:** extends from center to `(12, 2)`. 10u long. Terminates in a sharp point. Width at base 3u, tapering to 0u at tip.
- **South arm:** extends from center to `(12, 22)`. 10u long. Terminates in a **rounded nub** (radius 1.5u). Width at base 3u.
- **East arm:** extends from center to `(22, 11.5)`. 10u long, visually shorter due to weight. Terminates in a sharp point. Width at base 2.5u, offset slightly high (y=11.5 not 12) — this is the signature asymmetry.
- **West arm:** extends from center to `(2, 12.5)`. 10u long. Terminates in a rounded nub (radius 1.2u). Width at base 2.5u.
- **Center intersection:** the four arms meet at a slightly-larger-than-geometric center (a 1u radius "heartbeat" where the arms overlap), giving the mark a sense of dimensional solidity.
- **The four concave curves between arms** are gentle beziers pulled into the center, not straight lines. This is what distinguishes Compass from a plus-sign or a cardinal cross.

**The asymmetry rules:**
1. Sharp points on opposite arms (North + East), rounded nubs on the other opposite pair (South + West). Creates a quiet diagonal tension.
2. Vertical pair (N+S) has slightly more weight than horizontal pair (E+W) — 3u vs. 2.5u at base. Reinforces the feeling of an upright mark, not a windmill.
3. East arm sits 0.5u above true center; West arm sits 0.5u below. This 1u total tilt is almost imperceptible individually but makes the whole mark feel *alive* rather than stamped.

### Sketch

```
                      .
                     ...
                    .. ..
                   ..   ..
                  ..     ..
                 ..       ..
                ..         ..
               ..           ..
          .....               .....
         ......               ......
          .....                .....
               ..           ..
                ..         ..
                 ..       ..
                  ..     ..
                   ..   ..
                    .. ..
                     ...
                    (   )
                     ~~~
```

(Ascii can only hint at the asymmetry — imagine the top and right arm tips as sharp, the bottom and left as rounded.)

Conceptual SVG:

```
<svg viewBox="0 0 24 24">
  <path d="
    M 12 2
    L 13.5 10.5
    L 22 11.5
    L 13.5 13.2
    L 12 22
    C 11.5 22.8, 10.5 22.8, 10.5 22
    L 10.5 13.2
    L 2 12.5
    C 1.2 12.7, 1.2 11.3, 2 11.5
    L 10.5 10.5
    L 12 2 Z"
    fill="currentColor" />
  <circle cx="12" cy="12" r="1.1" fill="currentColor" />
</svg>
```

(Production SVG replaces straight `L` segments with refined beziers for the hand-drawn terminal treatment.)

### Why it is not derivative

- **Not the Claude asterisk** — Claude has 8 petals, all roughly equal-length, all with rounded terminals. Compass has 4 arms with intentionally mixed terminals (sharp/rounded) and asymmetric lengths.
- **Not the Nike Swoosh** — radial vs. directional.
- **Not the Apple apple** — geometric vs. organic, open vs. closed.
- **Not the Coinbase C / Revolut R** — no letter DNA.
- **Not a standard compass-rose** — compass roses have 8 or 16 points and explicit N/S/E/W labels. Compass has 4 points and no labels.
- **Not the Nexo "x" prism** — Nexo's x is two stacked triangles creating a 2D prism shape. Compass is a 4-armed radial star with a center intersection.
- **Not the Apex-A** — Apex-A was a letter-A derivative with a summit tick. Compass has no letter DNA and no tick element.
- **Not a sparkle / star / "new feature" glyph** — those are uniform 4-point stars with equal arms. Compass's asymmetry is precisely what prevents the "AI sparkle" reading.

### Scalability read

- **1024px:** The sharp/rounded terminal contrast is clearly visible. The center intersection reads as a subtle volumetric heartbeat.
- **180px (app icon):** Asymmetry is still readable. The mark sits beautifully on warm-indigo ground.
- **32px:** Asymmetry starts to compress. Sharp and rounded terminals blur into "sharp-ish everywhere." This is the first warning zone.
- **16px (favicon):** At this size, the asymmetry is lost. The mark reads as a generic 4-point star. **This is Compass's critical weakness.**

### Favicon treatment

- At 16px and below, we ship a **simplified favicon variant** (`favicon-compass-16.svg`) where all four arms have equal length, equal width, and matching terminals. Essentially a symmetric 4-point star at small sizes.
- This means the favicon is *not* the primary mark — it is a reduced sibling. We have to accept that the warmth signature lives at display sizes only.
- Alternative: we can ship the favicon as the **center intersection element only** (a small 4-point sparkle fragment) — but this risks confusion with AI "sparkle" icons. Not recommended.

### Wordmark relationship

Compass is the direction most likely to **need** a wordmark lockup for the first 24 months. Radial 4-point stars are semantically polyvalent — they can read as compass, sparkle, asterisk, flower, or religious symbol depending on context. The wordmark anchors the meaning as "Apice Capital" until the mark builds its own equity.

Lockup: Compass to the left, Geist wordmark to the right. Compass's visual center aligned to the wordmark's x-height midpoint. Spacing = 0.8x the mark's width.

Standalone use is restricted for the first 24 months to: app icon, in-app navigation, and the AI Experts' badge system.

### Color application

- **Monochromatic-first.** Warm Indigo `#8B5CF6` solid fill on warm-cream.
- **The one exception where color is structural, not ceremonial:** the AI Experts system. Each of the 6 experts is assigned a color cast within the warm-indigo family (per Atlas's recommendation §5.3), and their expert-badge overlays a tinted Compass mark. This is the only place where the mark appears in anything other than the canonical two colors.
- **Ceremonial amber:** Warm Amber `#F59E0B` solid fill for the same three surfaces (cert, card, splash). Amber Compass reads as "guidance" — appropriate for the Elite Mindset completion ceremony.
- **Dark mode:** Warm Cream fill on Warm Indigo `#4C1D95` background.

### What this direction rejects

- Any mechanical 4-point star with identical arms. If it could be drawn with a compass, it is wrong.
- Any outer circle / ring framing the star. The mark is radial enough without containment.
- Any N/S/E/W labels or cardinal indicators. The compass reading is a *latent* metaphor, not a literal one.
- Any "sparkle" motion animation (twinkle, rotate, pulse) — those are AI-glyph tropes and would recategorize Apice as an AI product first. Apice is a wealth product with AI features, not an AI product.
- The Apex-A mistake: do not add a tick, a shelf, or a secondary element to "explain" the mark.

### Pros · Cons · Execution risk

**Pros**
- Richest semantic surface — carries guidance, expertise, and warmth in one glyph.
- Only direction of the three that natively extends to the AI Experts system (4 arms = 4 directional axes for expert tinting).
- Hand-drawn feel is the clearest warmth signal — supports Atlas's differentiation strategy.
- Quietly Apice-coded: compass + star is a metaphor for "where do I go, who do I follow" — the exact product question.

**Cons**
- Worst favicon performance of the three. Requires a separate 16px variant.
- Most likely to be read as "sparkle" or "asterisk" in AI-saturated contexts. Some users will round-trip Apice's mark as "oh, AI," which undersells the wealth positioning.
- Needs wordmark lockup longer than the other two directions.
- Tightest production tolerance — the asymmetry has to be *just* enough to read as hand-drawn, not so much as to read as sloppy. This is Claude-level craft, and Claude had a team of 6 designers working for months on theirs.

**Execution risk:** HIGH. The asymmetry tolerance is the narrowest of the three directions. Production is 10–14 days including iterated review rounds to lock the hand-drawn feel.

---

## Head-to-head matrix

| Criterion | D1 Ascent | D2 Summit | D3 Compass |
|---|---|---|---|
| **Apple-test** — would this stand alone on a product, no wordmark? | Yes, within 12 months | Yes, from day one | Only after 24+ months |
| **Claude-test** — does it feel made by a human, not a compass? | Partial — the variable weight carries the hand, but the gesture is mathematical | Partial — the rounded corners and convex edges carry the hand, but the form is formal | Yes — this is the direction built specifically on hand-made warmth |
| **Nike-test** — one gesture, recognizable without a wordmark? | Yes — strongest of the three on pure gestural economy | Strong — one shape reads as one thought | Weaker — radial marks need more decoding than directional ones |
| **Favicon readability at 16px** | Good (with dedicated uniform-stroke variant) | Excellent (no variant needed) | Poor (requires simplified variant, loses warmth signature) |
| **Ownability** (search-test, visual uniqueness) | Highest — no fintech owns a variable-weight single-stroke rising mark | Medium — peak-as-logo is a crowded metaphor; differentiation lives entirely in execution | High — the specific asymmetry pattern is rare, though 4-point stars are common |
| **Execution cost** (days to ship production SVGs) | 5–7 days | 4–6 days | 10–14 days |

---

## Uma's v2 recommendation — **Direction 1: Ascent**

Ascent is the mark Apice should ship. It is the only one of the three that carries the product's thesis inside its geometry: Apice is not a peak to reach (Summit) and not a star to follow (Compass) — Apice is the *rise itself*, week by week, one DCA deposit at a time. The mark and the tagline ("Build Wealth. One Week at a Time.") tell the same story in two languages.

Ascent also passes the benchmark tests most purely. Apple-test: it stands alone because a single variable-weight stroke needs no wordmark to announce itself as an authored mark. Nike-test: it is one uninterrupted gesture, exactly the posture Nike inhabits. Claude-test: the variable weight is where the human hand lives — the thick-to-thin taper is a calligraphic decision, not a geometric one.

What do the other two do better? **Summit** wins on favicon readability and on physical-medium reproduction — if the CEO's priorities bias toward "brand must survive embroidery, engraving, and foreign print shops," Summit is the safer choice. **Compass** wins on AI Experts extensibility — if the AI personas become the marketing centerpiece (more than the DCA product itself), Compass is the mark that natively scales into that system.

But the CEO's brief said: make this look effortless, make it survive five years unchanged, make it feel inevitable. Ascent meets those three tests with the least effort on the user's end. It is a rising curve for a rising wealth product. Nothing to decode. Nothing to explain. Nothing to outgrow.

That is the posture the CEO asked for. That is why Ascent.

---

## Appendix — What this round refuses to repeat from Apex-A

Apex-A's failures, catalogued so we do not drift back:

1. **It tried to be a letter and a symbol at the same time.** The custom-A was neither a pure letterform nor a pure mark. It lived in between and felt like both.
2. **It stacked three ideas** (letter + tick + shelf) when the benchmarks all use one.
3. **It required a paragraph of explanation** to read "correctly." Apple does not explain the bite.
4. **It optimized for "clever" over "inevitable."** The CEO's word was "design-school." That word means: the mark wanted to show you how much thought went into it.
5. **It was difficult to animate** because it had three elements that needed to resolve together.

All three v2 directions reject all five failures by construction. If the mark cannot be drawn in one continuous idea, it is not one of these three directions.

---

*— Uma, @ux-design-expert. Awaiting CEO call on D1/D2/D3 to start production SVG set.*
