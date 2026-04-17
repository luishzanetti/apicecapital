# Apice Capital — V3 "The Dot" · Green Evolution

> **Author:** Uma (@ux-design-expert)
> **Date:** 2026-04-17
> **Status:** CEO-approved V3 direction · signature shifts from amber to green · descriptor to be finalized by Stefan in parallel
> **Progression principle:** V3.01 is the baseline; every variation refines what came before. **V3.10 is the production master** — the variation that should ship.

---

## 0. Context recap

V3 "The Dot" won: title-case *Apice* with a signature period, Stripe/Linear/Plaid register. The CEO asked for two moves forward:

1. **Color:** amber → green. Explore emerald, deep emerald, bright emerald, neon, forest. Do not commit — use range to find the right temperature per craft layer.
2. **Descriptor:** "CAPITAL" is out. Stefan is producing alternatives in parallel. These 10 variations assume the descriptor can be **none / HOLDINGS / RESERVE / STANDARD / WEALTH / PRIVATE** — the system works with or without, and switches gracefully.

All green values used:

| Token | Hex | Role |
|---|---|---|
| `--emerald-deep` | `#0F5D3F` | Institutional — hairline, mark, separator motif (text-quiet green) |
| `--emerald-bright` | `#16A661` | Signature — the dot itself (live green) |
| `--jade` | `#00A86B` | Alternate signature (explored briefly, V3.03) |
| `--neon` | `#B9FF3D` | Explored but **not used in production** — too retail-degen for Apice's register |

**Base palette (unchanged):** `--dark #0E0E12` wordmark, `--cream #F7F3ED` canvas.

---

## 1. The 10 variations

### V3.01 — The Dot, Plain

- **What's new:** Baseline. Green dot replaces amber. No descriptor. Nothing else.
- **Wordmark:** *Apice* · Geist 700 · 72px · tracking -30 (`letter-spacing: -2.16px` at 72px)
- **Green application:** Dot only · `#16A661` bright emerald · radius 6.5px (≈ 0.18× cap-height 52px) · sits on baseline
- **Descriptor:** None. The wordmark stands alone.
- **Craft detail:** Color calibration only — established that `#16A661` (not `#B9FF3D` neon) is the right register for Apice. Bright emerald is lively but not degen.
- **Markup:**
  ```html
  <span class="wm">Apice<span class="dot">.</span></span>
  ```
  ```css
  .wm { font-family: Geist, Inter, system-ui; font-weight: 700; font-size: 72px; letter-spacing: -0.03em; color: #0E0E12; }
  .dot { color: #16A661; font-weight: 800; margin-left: 2px; }
  ```
- **SVG mark:** `<circle cx="224" cy="76" r="6.5" fill="#16A661"/>`
- **Why more elaborate than the v5 amber baseline:** it's not — it's the zero-point. The green itself is the move.

---

### V3.02 — The Dot + Descriptor (HOLDINGS)

- **What's new:** Adds descriptor beneath the wordmark in tracked caps. Lockup becomes two-tier.
- **Wordmark:** *Apice* · Geist 700 · 64px (downsized to make room for descriptor) · tracking -30
- **Green application:** Dot only, `#16A661`, radius 5.75px
- **Descriptor:** **HOLDINGS** · Geist 600 · 10.5px · tracking +0.4em · color `#6E6A61` (n500, neutral)
- **Craft detail:** Descriptor is **half the weight and a quarter the size** of the wordmark. Tracking +0.4em prevents optical clumping. Color is neutral, not green — the dot stays the only green anchor.
- **Markup:**
  ```html
  <div class="lockup">
    <div class="wm">Apice<span class="dot">.</span></div>
    <div class="desc">HOLDINGS</div>
  </div>
  ```
  ```css
  .lockup { display: inline-flex; flex-direction: column; gap: 6px; }
  .desc { font: 600 10.5px/1 Geist; letter-spacing: 0.4em; color: #6E6A61; text-transform: uppercase; }
  ```
- **Why more elaborate than V3.01:** adds a second typographic register, proving the wordmark scales into a lockup without competing with the dot.

---

### V3.03 — Flat-Apex A

- **What's new:** First custom letterform — the capital A gets a **flat apex** (2.2px plateau) instead of a pointed tip. This is the first craft commitment to a custom wordmark.
- **Wordmark:** *Apice* · Geist 700 base · A is drawn as `<path>` with flat apex; "pice" uses Geist
- **Green application:** Dot only, but switches to `#0F5D3F` **deep emerald** to test a quieter register. Conclusion from this variation: deep emerald reads as too institutional/corporate — we go back to bright emerald from V3.04 onward.
- **Descriptor:** None (pulled back to isolate the flat-apex detail)
- **Craft detail:** Flat-apex A references Geist's default but with a deliberate 2.2px horizontal top stroke. The apex plateau is the quietest possible custom-wordmark signal — nobody notices it consciously, everybody feels it.
- **SVG snippet:**
  ```xml
  <!-- Flat-apex A -->
  <path d="M 40 74 L 62 26 L 71 26 L 93 74 L 82 74 L 76.5 62 L 56.5 62 L 51 74 Z
           M 60 54 L 73 54 L 66.5 38 Z" fill="#0E0E12"/>
  ```
- **Why more elaborate than V3.02:** descriptor is now replaceable (we removed it) without breaking the lockup. Typography starts to be *ours*, not Geist's.

---

### V3.04 — The Signature (diagonal terminal)

- **What's new:** The dot evolves. It's no longer a circle — it becomes a **short 14° diagonal stroke** (a "cut signature") that still reads as terminal punctuation but feels hand-placed, not system-default.
- **Wordmark:** Flat-apex A from V3.03 + Geist "pice"
- **Green application:** Diagonal stroke in `#0F5D3F` deep emerald (16×4px parallelogram). *Not* a dot anymore — this is the variation that tests abandoning the dot entirely.
- **Descriptor:** **RESERVE** · tracking +0.4em · `#6E6A61`
- **Craft detail:** The diagonal stroke has a 14° angle — slow enough to feel like a deliberate punctuation mark, not so steep it reads as a slash or italic. Width 4px to match the stem weight of Geist 700.
- **SVG snippet:**
  ```xml
  <path d="M 200 62 L 216 74 L 212 78 L 196 66 Z" fill="#0F5D3F"/>
  ```
- **Why more elaborate than V3.03:** the dot is a found object (a period). The diagonal is an *invented* mark — it commits more. Tested, and the conclusion is: **the dot wins** (V3.05 returns to it). The diagonal is too demonstrative for Apice's quiet register. But the exercise is informative.

---

### V3.05 — Hairline Divider

- **What's new:** Adds a **32px green hairline** (1px, deep emerald) between wordmark and descriptor. Dot returns (lesson learned from V3.04). Wordmark shrinks to 60px to fit lockup proportions.
- **Wordmark:** Flat-apex A + Geist "pice" · 60px
- **Green application:** **Dual layer** — dot in `#0F5D3F` deep emerald (institutional pass), hairline rule in `#0F5D3F` same color. No bright emerald yet.
- **Descriptor:** **RESERVE** · 10px · tracking +0.44em · `#3F3D38` (n700, slightly darker than V3.02 for better hairline relationship)
- **Craft detail:** The hairline is **32px wide** (half the wordmark width, aligned to A's left edge). Stroke 1px. Thin enough to whisper, present enough to be a deliberate system element. Echoes JPMorgan 2024's use of rules between brand and product units.
- **Markup:**
  ```css
  .rule { width: 32px; height: 1px; background: #0F5D3F; margin: 6px 0; }
  ```
- **SVG snippet:**
  ```xml
  <line x1="40" y1="84" x2="72" y2="84" stroke="#0F5D3F" stroke-width="1"/>
  ```
- **Why more elaborate than V3.04:** adds a second brand primitive (the rule) that can be reused in product UI — section dividers, card headers, signature blocks. The system is starting to have multiple green parts that agree with each other.

---

### V3.06 — Dual-Green Palette

- **What's new:** Establishes the **two-green rule**. Bright emerald is *live* (dot, interactive states). Deep emerald is *quiet* (structure — hairlines, descriptor when green). Descriptor experiments with being green itself.
- **Wordmark:** Same as V3.05
- **Green application:**
  - Dot: `#16A661` **bright emerald** (signature, live)
  - Hairline: `#0F5D3F` deep emerald (structural)
  - Descriptor: `#0F5D3F` deep emerald (test — tints the label green)
- **Descriptor:** **STANDARD** · deep emerald · tracking +0.44em
- **Craft detail:** This is the variation that established the **palette rule** that carries through V3.07-10: bright emerald is reserved for the signature dot and any brand moment that should feel alive (CTA hover states, streak counters, confirmation). Deep emerald is for structure that needs to feel quiet and confident (rules, descriptor when it must echo the brand color, favicon backgrounds).
- **Why more elaborate than V3.05:** the system now distinguishes *live green* from *structure green*. One color has become two. The dot still owns bright emerald — everything else steps back.

---

### V3.07 — Cut-c Terminals

- **What's new:** Second custom letterform. The **c gets a 5° biased terminal cut** (both upper and lower arc terminals cut on the same 5° bias). Nexo 2024 used this same move — it's the category's current refinement signal.
- **Wordmark:** Flat-apex A + Geist "pi" + custom c + Geist "e" · 60px
- **Green application:** Dot `#16A661` bright emerald (locked). Hairline `#0F5D3F`. Descriptor returns to neutral `#6E6A61` because the letterforms are now carrying the craft weight.
- **Descriptor:** None (to isolate the c detail)
- **Craft detail:** The c is drawn as a 15px-radius arc with both terminals cut on a 5° bias. At small sizes (under 24px) the bias is imperceptible but reads as a subtly tighter, more tailored c than Geist's default. At 60px+ it becomes a signature.
- **SVG snippet:**
  ```xml
  <path d="M 168 42
           A 15 15 0 1 0 168 72
           L 176 65.4
           A 8 8 0 1 1 176 48.6 Z" fill="#0E0E12"/>
  ```
- **Why more elaborate than V3.06:** we now have **two custom letterforms** (A, c) and a two-green system. The wordmark is 40% custom by visual weight.

---

### V3.08 — Peak Mark + Lockup

- **What's new:** Adds a **small symbolic mark** to the left of the wordmark — a 3-segment ascending stroke ("the Peak") at ~20% of wordmark height. Mark + wordmark become a horizontal lockup.
- **Wordmark:** Same as V3.07 (custom A + c) · downsized to 54px to accommodate mark
- **Green application:**
  - Mark: `#0F5D3F` deep emerald (structural)
  - Dot: `#16A661` bright emerald
  - Hairline: `#0F5D3F`
- **Descriptor:** **WEALTH** · tracking +0.45em · `#3F3D38`
- **Craft detail:** The Peak is a stylized ascending stroke — three descending-then-ascending zigzag steps, 11px tall, 34px wide. It reads as a summit/mountain at 16-24px, abstract at larger sizes. Crucially, it is *not a literal pyramid* (Fidelity already owns that) — it's a stroke, not a filled shape, which keeps it in the modern-fintech register.
- **SVG snippet:**
  ```xml
  <path d="M 32 76 L 44 56 L 52 62 L 62 44 L 66 48 L 56 66 L 48 60 L 38 80 Z" fill="#0F5D3F"/>
  ```
- **Why more elaborate than V3.07:** the system gains a **third brand asset** beyond wordmark and dot — the Peak mark. It's favicon-ready at 16px (just the mark, no wordmark). It gives the brand a pictorial anchor without forcing one onto the wordmark.

---

### V3.09 — Dot Motif Extended

- **What's new:** The signature dot becomes a **recurring motif**. A tiny deep-emerald dot (1.1px radius) appears as a **separator between descriptor phrases**. The brand primitive now lives in at least three places: the main signature, the favicon, and descriptor tracking.
- **Wordmark:** Same as V3.08 (peak + custom A + custom c · 54px)
- **Green application:** Same dual-green as V3.08, plus **motif dots** in descriptor row in `#0F5D3F` (1.1px radius — tiny enough to feel like punctuation, large enough to read as intentional).
- **Descriptor:** **PRIVATE** · motif-dot · **EST MMXXVI** — two phrases separated by a tiny deep-emerald dot. First explicit extension of the dot primitive into the descriptor system.
- **Craft detail:** The motif dot is exactly 1.1px radius — calculated as 1/5 the size of the main signature dot. The size ratio (5:1) is deliberate: it's small enough that the main dot still dominates, but consistent enough that the eye recognizes the relationship.
- **Markup pattern (reusable primitive):**
  ```html
  <div class="desc-row">
    <span>PRIVATE</span>
    <span class="motif-dot"></span>
    <span>EST MMXXVI</span>
  </div>
  ```
  ```css
  .motif-dot { width: 2.2px; height: 2.2px; border-radius: 50%; background: #0F5D3F; display: inline-block; vertical-align: middle; margin: 0 6px; }
  ```
- **Why more elaborate than V3.08:** the dot stops being a one-time signature element and becomes a **reusable primitive** — a design DNA molecule that can appear anywhere in the system.

---

### V3.10 — Production Master

- **What's new:** Full system refinement. **5 custom letterforms** (A, p with descender lean, i with square-cut tittle, c with 5° cut, e with optical-thinned bar), Peak mark with a finishing dot at the summit tying it to the signature, green hairline, dot motif extended, descriptor system.
- **Wordmark:** Full custom Apice · 54px · tracking -30
  - **A** — flat 2.4px apex, inktrap at inner junction
  - **p** — subtle -8° baseline correction on descender (visual lean, not geometric italic)
  - **i** — **square-cut tittle** (6×6px square, not Geist's default round dot) — this is the deepest craft move because it contradicts the very signature (round dot). The logic: the signature dot is the *only* round dot; every other dot-shape in the system is square. It makes the signature dot feel earned.
  - **c** — 5° biased terminal cut (inherited V3.07)
  - **e** — horizontal bar with 0.5px optical thinning at aperture
- **Green application (full system):**
  - Signature dot: `#16A661` bright emerald · 5.25px radius
  - Peak mark: `#0F5D3F` deep emerald + a tiny 1.4px deep emerald dot at the summit (ties mark to signature language)
  - Hairline divider: `#0F5D3F` · 1px · 48px wide (extends to match Peak + A combined)
  - Motif dot separator in descriptor: `#0F5D3F` · 1.1px
- **Descriptor:** **HOLDINGS** · motif-dot · **EST MMXXVI** · tracking +0.48em
- **Craft details:**
  1. **Square tittle on i** vs round signature dot — the single most sophisticated move. Creates a hierarchy where the signature dot is the *only* circular element, making it feel precious.
  2. **Peak mark with terminal dot** — the Peak ends with a deep-emerald dot, so the peak motif visually rhymes with the signature dot. System coherence.
  3. **Inktrap in A** — at the inner junction of the A's crossbar with the legs, a 0.5px inktrap prevents optical thickening at small sizes. Invisible at 60px, essential at 14px.
  4. **p descender lean** — -8° visual correction (not a true italic, just enough that the p feels like it has weight). Pairs with the flat-apex A to give the wordmark rhythm.
  5. **e aperture thinning** — the horizontal crossbar of the e is 0.5px thinner than the stem to optically compensate for the closed aperture. The kind of detail only type designers usually add.
- **Product surfaces using the system:**
  - **App icon (favicon):** just the Peak mark + signature dot on cream, cream rounded-square background. 16×16 to 1024×1024 scalable.
  - **Splash screen:** full lockup (Peak + Apice. + descriptor) centered, 380px wide on 430px mobile canvas, cream background.
  - **Streak/level pills in product UI:** inherits the bright emerald `#16A661` as fill color. The signature dot becomes the visual language of "active/alive" throughout the app — every confirmation toast, every positive state, every streak marker uses the same hex.
- **SVG:** See `/brand/assets/logos/v3-green-10.svg` for the full production master.
- **Why more elaborate than V3.09:** this is the variation where every decision is load-bearing. Nothing is ornamental. Every custom letterform, every green value, every separator is justified by a system rule. It survives 50-year scrutiny (BlackRock/Vanguard test) while staying digitally native (Nexo/Plaid test).

---

## 2. Variation summary table

| # | Name | Descriptor | Green on | Craft detail added | Elaborate-vs-previous |
|---|---|---|---|---|---|
| 01 | The Dot, Plain | — | dot | color shift to bright emerald | baseline |
| 02 | + Descriptor | HOLDINGS | dot | 2-tier lockup | typography scales |
| 03 | + Flat-Apex A | — | dot (deep) | custom A | first custom letterform |
| 04 | + Diagonal Signature | RESERVE | diagonal | invented mark | tests abandoning dot (fails) |
| 05 | + Hairline Divider | RESERVE | dot + rule | 32px green rule | second brand primitive |
| 06 | + Dual-Green Palette | STANDARD | dot + rule + desc | live vs structural green | color system emerges |
| 07 | + Cut-c Terminals | — | dot + rule | custom c (5° bias) | second custom letterform |
| 08 | + Peak Mark | WEALTH | dot + rule + mark | pictorial anchor | third brand asset |
| 09 | + Motif Extended | PRIVATE · EST | dot + rule + mark + motif | dot as separator | dot becomes primitive |
| 10 | Production Master | HOLDINGS · EST | full system | 5 custom letterforms, square tittle, Peak w/ dot, inktrap | every decision load-bearing |

---

## 3. System rules that emerge from this progression

### 3.1 The Two-Green Rule
- **Bright emerald `#16A661`** — signature, live, interactive, celebratory. Only the **signature dot** uses it in the logo. In product, it is reserved for: streak counters, positive-state confirmations, active selections, CTA hover glow, success toasts.
- **Deep emerald `#0F5D3F`** — structural, quiet, institutional. Used for: hairline dividers, Peak mark, motif dots, descriptor when green-tinted is required, favicon background (with bright dot as center).

**Never** use both greens on the same surface without the dark/cream neutrals between them. They are not siblings — they are a hierarchy.

### 3.2 The Dot Primitive
The signature dot is the **single most-protected brand element**. It appears in exactly three sizes:

| Context | Size | Color |
|---|---|---|
| Signature dot (on wordmark) | 0.18× cap-height | `#16A661` |
| Motif dot (in descriptor, separator) | 1/5 of signature | `#0F5D3F` |
| Tittle on "i" (V3.10) | **Square** 6×6px (not a dot) — contradicts the primitive so the primitive feels earned | `#0E0E12` |

### 3.3 Descriptor Modularity
Every variation from V3.02 onward works with descriptor ∈ {none, HOLDINGS, RESERVE, STANDARD, WEALTH, PRIVATE}. The lockup does not break. Stefan can choose any of them (or none) without forcing a wordmark redesign.

---

## 4. Usage guidance

| Surface | Recommended variation | Rationale |
|---|---|---|
| App icon / favicon | V3.10 (Peak mark alone, bright dot) | Peak is favicon-ready at 16px |
| Product splash | V3.10 full lockup | Maximum craft |
| Product UI header | V3.05 or V3.06 (wordmark + hairline) | Quieter, doesn't compete with product |
| Investor deck cover | V3.10 | Shows the full system |
| Email signature | V3.02 or V3.05 | Reads at small sizes |
| Social avatar | V3.10 Peak only (in cream circle) | Recognizable at 32px |
| T-shirt / merch | V3.08 or V3.10 | Peak + wordmark carries well at size |

---

## 5. Known limitations (honesty)

- **V3.04 diagonal signature was a dead end.** Tested, informative, not carried forward. The dot wins.
- **V3.07 cut-c** is subtle enough that at small sizes (< 18px) it is imperceptible. Fine — subtle craft is the goal.
- **V3.10 square tittle on i** is the riskiest move. Some viewers may read it as "broken type" at very small sizes (< 12px). Mitigation: at sizes below 14px, fall back to Geist's default round tittle (system rule: signature dot is the only round dot *when legibility allows*).
- **The Peak mark** must never rotate, skew, or be filled with a gradient. The only approved states are: deep emerald, cream (on dark), dark (on cream), and with or without summit dot.

---

## 6. What ships (recommendation)

**V3.10** is the production master. Every other variation is a stepping stone that justifies one of V3.10's decisions. V3.10 does not invent anything that wasn't earned by V3.01–09.

**If CEO wants to defer the Peak mark** (fair — it adds a symbol to a brand whose current direction is wordmark-primary), drop to **V3.09 minus mark** = wordmark with all 5 custom letterforms + dual-green hairline + motif descriptor. That version is equally production-worthy and even more wordmark-focused.

---

*Uma — @ux-design-expert · 2026-04-17*
*Drawings in `/brand/assets/logos/v3-green-{01..10}.svg`*
