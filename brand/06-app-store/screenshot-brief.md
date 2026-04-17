# App Store Screenshot Brief — Apice Capital

> **Author:** @analyst (Atlas)
> **Consumers:** @ux-design-expert (Uma) for direction + @media-engineer for production
> **Date:** 2026-04-17
> **Critical context:** Apple's June 2025 algorithm shift means **screenshot caption text is now indexed for ASO**. Every caption here is engineered to hit a specific keyword cluster AND convert on impression. This is not a visual brief only — it is an ASO brief.
> **Voice:** brand-voice.md §1 — Confident · Warm · Disciplined · Clear. Every caption passes the §7 checklist.
> **Logo:** V3.01 "The Dot, Plain" (per DECISIONS-LOG.md D5) — Geist 700, title case, tracking −30, bright emerald #16A661 dot. Base palette `#0E0E12` near-black + `#F7F3ED` warm cream + `#16A661` emerald signature.

---

## 0. Asset matrix — what we are shipping

Apple App Store requires multiple device sizes for App Store Connect upload. Priorities:

| Device | Resolution | Required? | Priority |
|---|---|---|---|
| **iPhone 6.9" (15/16 Pro Max)** | 1290 × 2796 | YES — primary | P0 |
| iPhone 6.5" (older Max) | 1284 × 2778 | Inherits from 6.9" by default | P1 |
| iPhone 5.5" (legacy) | 1242 × 2208 | Historically required for ≤iOS 13 | P1 (Apple no longer hard-requires since 2024) |
| iPad 12.9" | 2048 × 2732 | Required if app runs on iPad | P1 |
| iPad 11" / 10.2" | 1668 × 2388 / 1620 × 2160 | Optional | P2 |

Google Play additional:

| Device | Resolution | Priority |
|---|---|---|
| Android phone | 1080 × 1920 min (FHD), 16:9 typical | P0 |
| Android 7" tablet | 1200 × 1920 | P2 |
| Android 10" tablet | 1920 × 1200 | P2 |

**Recommendation:** Design at iPhone 6.9" resolution (1290 × 2796) and cascade down via @ux-design-expert's responsive frame library. 7 hero screens × 5 device sizes = **35 screenshot deliverables for launch**.

---

## 1. Visual system — shared across all screenshots

### Device treatment
- **iOS primary:** iPhone 15 Pro frame in **Titanium Black**. No hand / no workspace. Just the device floating on the branded background.
- **Android primary:** Pixel 8 Pro frame in **Obsidian**. Same floating treatment.
- **Dark mode default** for all screenshots (matches premium 65% positioning; matches Public.com pattern)
- **No light-mode variants in launch set** — add in month 2 as A/B test variant (Apple Custom Product Pages allow this)

### Background system
- **Primary background:** gradient from `#0E0E12` (top) → `#18181F` (bottom) — subtle depth
- **Accent glow:** soft emerald radial `#16A661` at 8% opacity, positioned per screen focus (see each screen)
- **NO confetti, NO glow auras, NO emoji, NO neon** — per D2 (65% premium positioning)

### Typography system for captions
- **Headline caption (primary):** Geist 700, 96pt at 1290px width (scales proportionally)
- **Subcaption (secondary, optional):** Geist 500, 40pt
- **Color:** `#F7F3ED` (warm cream) for headlines on dark background
- **Accent color:** `#16A661` (emerald) for numbers and single-word emphasis
- **Line height:** 1.05 for headlines (tight, editorial)
- **Letterspacing:** −30 for headlines (matches wordmark spec)

### Caption placement
- **Top-third** of the frame, leaving device mockup in the bottom two-thirds
- Consistent across all 7 screens for rhythm
- First caption must be visible in App Store search thumbnail (top ~15% of asset)

### Screenshot order in App Store Connect
Screens 1–3 drive 90% of install decisions (per ASO 2026 data). Caption keywords here are load-bearing.

---

## 2. The 7 screenshots — detailed briefs

### Screenshot 1 — HERO (must convert 50% of scrolls)

**Purpose:** Convert the scroll. Establish brand voice. Plant the primary keyword cluster ("wealth weekly").

**Caption (primary):**
> **Build wealth. Every week.**

**Subcaption (small, under headline):**
> Automated DCA. Six AI experts. One discipline.

**Product surface shown:**
The **Portfolio Home screen** — dark mode hero showing:
- Current total portfolio value (editorial-quality number treatment, e.g., `$12,487.50`)
- A small green delta pill `+$42.18 this week`
- Weekly DCA status card: "Next contribution: Monday • $25.00 • Plan active"
- A subtle sparkline across 12 weeks showing consistent weekly ticks (no dramatic volatility shown — we sell discipline, not fireworks)
- Bottom nav bar with 5 icons (Home · DCA · Academy · AI · Profile)

**Key UI element highlighted:**
The `$42.18 this week` pill — positioned with subtle emerald accent glow at `#16A661` 12% opacity. This teaches that "every week compounds" visually.

**Visual treatment:**
- Device in frame (iPhone 15 Pro Titanium)
- Background: base gradient, emerald glow centered behind device top-third
- No device reflection, no hand

**ASO keywords engineered into this frame:**
- Caption: `build, wealth, week, weekly`
- Subcaption: `dca, ai, experts`
- Screen UI visible text: `portfolio, plan, active`

**Order in listing:** Position 1 (mandatory — appears in search results)

---

### Screenshot 2 — DCA PLANNER

**Purpose:** Show the activation event. Communicate "this is easy to start." Own the keyword `DCA`.

**Caption (primary):**
> **$25 a week. Automatic.**

**Subcaption:**
> Start, pause, or adjust anytime. No lockups.

**Product surface shown:**
The **DCA Plan creation flow, Step 2 of 3** — the commitment step:
- Large number input showing `$25` with tap-to-edit affordance
- Frequency selector (segmented control): `Daily · Weekly ● Biweekly · Monthly` (Weekly selected)
- Asset selector preview: "BTC 60% · ETH 30% · USDC 10%"
- "Next Execution: Monday, April 20" with calendar glyph
- Primary CTA button: `Activate Plan` in emerald
- Secondary: `Customize Allocation`

**Key UI element highlighted:**
The `$25` input number — rendered in 84pt Geist, centered, emerald outline on focus. This is the "$25 is enough to start" moment.

**Visual treatment:**
- Same device frame
- Emerald glow shifts to center of device (where the $25 input sits)
- Optional: subtle animation cue (static in screenshot, but signals "tap to change")

**ASO keywords:**
- Caption: `weekly, automatic`
- Subcaption: `start, pause, adjust`
- Screen UI: `dca, plan, bitcoin, eth, usdc, execution, activate`

**Order in listing:** Position 2

---

### Screenshot 3 — APICE ACADEMY

**Purpose:** Establish the education moat. Own the differentiator no competitor has (7 tracks + 52 lessons + gamified progression).

**Caption (primary):**
> **Learn as you earn.**

**Subcaption:**
> 7 tracks. 52 lessons. Built by operators, not influencers.

**Product surface shown:**
The **Learning Map** — the Duolingo-style vertical path (per V2-MASTER-PLAN §3.1):
- Vertical zig-zag path with 6 visible nodes (not all 52 — just enough to show structure)
- Top node: "Foundation" completed with 3-star badge (gold)
- Second: "DCA Mastery" in progress, half-ring
- Third: "Portfolio Architecture" available, emerald pulse
- Fourth–Sixth: Locked with faint silhouette
- Top of screen: progress pill `Level 2 — Apprentice · 580 / 800 XP`
- Bottom: subtle hexagon hint for "Boss Challenge" at track end

**Key UI element highlighted:**
The `Level 2 — Apprentice` progress pill AND the emerald-pulsing "Portfolio Architecture" node — two focal points connected by the caption's "learn as you earn" promise.

**Visual treatment:**
- Same device frame
- Emerald glow at the "current node" position
- Warmth: subtle gold accent only on the earned badge (rarity signal — per V2 rarity tokens)
- Do NOT show confetti or celebration — that's for Screen 7

**ASO keywords:**
- Caption: `learn, earn`
- Subcaption: `tracks, lessons, operators`
- Screen UI: `foundation, dca, mastery, portfolio, architecture, level, apprentice, xp`

**Order in listing:** Position 3

---

### Screenshot 4 — SIX AI EXPERTS

**Purpose:** The defensible feature. No competitor has six named AI experts with distinct personas.

**Caption (primary):**
> **Six AI experts. One team.**

**Subcaption:**
> Nora builds your thesis. Dante names your risk. And four more.

**Product surface shown:**
The **AI Experts picker screen** — a 2×3 grid (or carousel) showing:
- Nora (portrait illustration from F7, warm editorial style), label: "Thesis Builder"
- Kai, label: "Pattern Reader"
- Elena, label: "Patient Compounder" (locked with faint emerald key icon → Pro)
- Dante, label: "Risk Architect" (locked → Pro)
- Maya, label: "Deep Researcher" (locked → Pro)
- Omar, label: "Mentor" (locked → Club)

Each card: portrait top, name bottom, role subtitle, tier badge if locked.

**Key UI element highlighted:**
Nora's card in the top-left — slight emerald emphasis (she is the Free tier default, per V2 funnel). This plants "you can start with an AI expert for free."

**Visual treatment:**
- Full device frame preserved
- Background emerald glow split between the six cards (soft, no individual highlights — reads as "they work as a team")
- Portrait illustrations must match F7 brand style (flat minimalist + warm gradients per proposed illustration style — see DECISIONS-LOG pending decisions)

**ASO keywords:**
- Caption: `ai, experts, team`
- Subcaption: `thesis, risk` (high-intent investing keywords)
- Screen UI: 6 persona names (unique branded) + role labels (`thesis builder, pattern reader, patient compounder, risk architect, deep researcher, mentor`)

**Order in listing:** Position 4

---

### Screenshot 5 — PORTFOLIO ANALYTICS

**Purpose:** Satisfy the "show me the numbers" user. Signal premium/Pro tier.

**Caption (primary):**
> **Your portfolio, with receipts.**

**Subcaption:**
> Tax lots, drawdowns, and the numbers that actually matter.

**Product surface shown:**
The **Portfolio Analytics screen** (Pro tier):
- 12-month performance chart with clean area fill (emerald line, no gradient noise)
- KPI row: `Total Return +18.4% · Avg Cost Basis $42,180 · Max Drawdown −12.3%`
- Allocation donut: BTC / ETH / USDC / SOL (muted colors, no neon)
- "Tax lots visible" table preview (2–3 rows) with lot date, cost basis, current value, unrealized gain
- Small "Pro" badge top-right

**Key UI element highlighted:**
The `Max Drawdown −12.3%` KPI — the **honest number that other apps hide**. This lives up to brand-voice rule #4: "We name the risk." It is the single most trust-building number we can show in a listing.

**Visual treatment:**
- Device frame
- Emerald glow neutral/centered (this is a "data" screen, no emotional focus needed)
- Numbers rendered in mono-spaced typographic treatment per brand-voice rule #2

**ASO keywords:**
- Caption: `portfolio`
- Subcaption: `tax, drawdowns, numbers`
- Screen UI: `analytics, return, cost basis, drawdown, allocation, btc, eth, sol, tax lots`

**Order in listing:** Position 5

---

### Screenshot 6 — CASHBACK DASHBOARD

**Purpose:** Surface the secondary revenue mechanic (cashback that compounds), reveal Apice is more than DCA + Academy.

**Caption (primary):**
> **Cashback that reinvests itself.**

**Subcaption:**
> Every purchase. Every week. Back into the plan.

**Product surface shown:**
The **Cashback Dashboard** (per V2-MASTER-PLAN — if cashback is implemented in V2 scope; if not, swap for Streak Dashboard):

Option A (cashback, preferred):
- Monthly cashback total `$18.42 this month` (mid-hero number)
- Weekly breakdown bars (4 weeks, emerald gradient)
- "Auto-reinvest into DCA: ON" toggle card
- "Total reinvested since start: $243.10" stat pill
- List of 3 recent eligible transactions with small merchant logos

Option B (streak — fallback if cashback not ready for V1):
- Fire emoji replaced with Apice's streak glyph (not a meme emoji — a custom gesture per V2 rarity system)
- "14-day streak" large number
- Progressive tier display showing the Blue Flame at Day 30 unlock
- XP multiplier callout: `1.5× XP active`
- Next milestone: "Day 30 → Premium streak theme"

**Key UI element highlighted:**
The `Auto-reinvest: ON` toggle (Option A) — communicates "this mechanic compounds automatically." This is the proof of the "consistency compounds" thesis.

**Visual treatment:**
- Device frame
- Emerald glow on the active toggle
- Warm gold accent only on "total reinvested" stat (subtle rarity signal)

**ASO keywords:**
- Caption: `cashback, reinvests`
- Subcaption: `purchase, weekly, plan`
- Screen UI: `cashback, reinvest, monthly, weekly, dca`

**Order in listing:** Position 6

**Content dependency flagged to @pm:** Confirm cashback ships in V1 App Store release or falls back to streak. If streak, retune caption to: `14 days. And counting.` with subcaption `Every week in builds the habit.`

---

### Screenshot 7 — MANIFESTO MOMENT (closer)

**Purpose:** The ideology close. Convert the premium reader who scrolled through screens 1–6. Plant the brand in memory.

**Caption (primary):**
> **You are not late.**

**Subcaption:**
> You are on time the moment you start.

**Product surface shown (this is the DEPARTURE from the device-frame pattern):**
A **full-bleed editorial frame** — NO device mockup. This is the one "manifesto" slide competitors do not do.

- Background: same base gradient but extended edge-to-edge
- Centered: a single emerald dot (the V3.01 signature, enlarged to 48pt)
- Above the dot: caption in Geist 700 at 128pt (larger than other screens)
- Below the dot: subcaption + a whisper-small wordmark `Apice.`
- No UI chrome. Pure statement.

**Key UI element highlighted:**
The **emerald dot as the manifest** — the same dot that is the brand's entire signature. This is the "brand moment" that leaves the user with something to remember after swiping.

**Visual treatment:**
- No device frame — editorial / poster register
- Respects Stefan's rule: "We borrow the weight of old money. Write as if the copy will be printed and framed."
- This slide could literally be printed and framed. That is the brief.

**ASO keywords:**
- Caption: `late, time, start` (intent verbs; low competition but high emotional convert)
- NOTE: this slide has the least keyword density by design. It is placed as Position 7 (not 1) specifically because screens 1–6 carry the keyword load; screen 7 carries the emotional close.

**Order in listing:** Position 7 (final)

---

## 3. Caption copy — all 7 collected

For quick copy/paste into App Store Connect and for @ux-design-expert's Figma layer text:

| # | Primary caption | Subcaption |
|---|---|---|
| 1 | Build wealth. Every week. | Automated DCA. Six AI experts. One discipline. |
| 2 | $25 a week. Automatic. | Start, pause, or adjust anytime. No lockups. |
| 3 | Learn as you earn. | 7 tracks. 52 lessons. Built by operators, not influencers. |
| 4 | Six AI experts. One team. | Nora builds your thesis. Dante names your risk. And four more. |
| 5 | Your portfolio, with receipts. | Tax lots, drawdowns, and the numbers that actually matter. |
| 6 | Cashback that reinvests itself. | Every purchase. Every week. Back into the plan. |
| 7 | You are not late. | You are on time the moment you start. |

**Combined keyword coverage across all 7 captions:**
`build, wealth, every, week, weekly, dca, automatic, 25, start, pause, adjust, learn, earn, tracks, lessons, operators, ai, experts, team, thesis, risk, portfolio, receipts, tax, drawdowns, numbers, cashback, reinvests, purchase, plan, time`

This set of ~30 indexed caption keywords effectively **triples** the Apice ASO surface (from 160 → ~450+ indexed characters) while reinforcing the primary Name+Subtitle+Keyword field strategy.

---

## 4. Google Play variations

Google Play indexes the **long description** (4,000 chars), so screenshot captions carry slightly less ASO weight there, but they remain primary conversion drivers.

**Caption adjustments for Google Play:**

| # | iOS caption | Google Play caption (identical or tuned) |
|---|---|---|
| 1 | Build wealth. Every week. | Same |
| 2 | $25 a week. Automatic. | Same |
| 3 | Learn as you earn. | Same |
| 4 | Six AI experts. One team. | Same |
| 5 | Your portfolio, with receipts. | Same |
| 6 | Cashback that reinvests itself. | Same |
| 7 | You are not late. | Same |

No tuning needed. The caption system is stack-agnostic. Only device frame (Pixel on Google Play) and background gradient (unchanged) vary.

**Google Play Feature Graphic (1024 × 500) — required separately:**
- Full-bleed warm-cream-on-near-black composition
- Centered: wordmark `Apice.` with emerald dot at 1024px width
- Below: single caption "Build wealth. One week at a time." in Geist 500 at 64pt
- **This is NOT a screenshot — it is Google Play's equivalent of a title banner.** Coordinate with @media-engineer.

---

## 5. Localization pipeline

Spanish variants use the captions from `listing-copy-ES.md §8`:

| # | EN-US | ES-LATAM | ES-ES |
|---|---|---|---|
| 1 | Build wealth. Every week. | Construye riqueza. Cada semana. | Construye riqueza. Cada semana. |
| 2 | $25 a week. Automatic. | $25 semanales. Automático. | 25€ semanales. Automático. |
| 3 | Learn as you earn. | Aprende mientras inviertes. | Aprende mientras inviertes. |
| 4 | Six AI experts. One team. | Seis expertos de IA. Un equipo. | Seis expertos de IA. Un equipo. |
| 5 | Your portfolio, with receipts. | Tu portafolio, con receipts. | Tu cartera, con datos. |
| 6 | Cashback that reinvests itself. | Cashback que se reinvierte solo. | Cashback que se reinvierte solo. |
| 7 | You are not late. | No estás tarde. Estás a tiempo. | No llegas tarde. Llegas a tiempo. |

**Screenshot device UI** in Spanish variants requires the app's UI to render Spanish strings — coordinate with @dev for locale files before screenshot capture.

---

## 6. Production checklist (handoff to @ux-design-expert + @media-engineer)

### @ux-design-expert (Uma) — direction
- [ ] Validate visual treatment vs. brand system V3.01
- [ ] Confirm illustration style for AI Expert portraits (Screen 4) matches F7 pending decision
- [ ] Approve the "manifesto moment" Screen 7 as non-device frame (this is a bet)
- [ ] Sign off on 7-screenshot order for launch

### @media-engineer — production
- [ ] Capture live app UI at iPhone 6.9" resolution (1290 × 2796) for screens 1–6
- [ ] Apply device frame mockups (iPhone 15 Pro Titanium Black, Pixel 8 Pro Obsidian)
- [ ] Render captions at Geist 700, −30 tracking, specified sizes
- [ ] Produce 5 device size variants per screen (iOS 6.9", 6.5", 5.5"; iPad 12.9", 11")
- [ ] Produce Android 1080 × 1920 primary variant
- [ ] Produce Google Play Feature Graphic 1024 × 500
- [ ] Produce Spanish localized variants (LATAM + ES) — 35 assets × 3 locales = **~105 final deliverables**
- [ ] Deliver as PNG-24 + organized folder structure for App Store Connect upload

### Timeline estimate
- Visual direction lock (Uma): 2 days
- Production (media-engineer): 4–5 days including locale variants
- QA review (Apple HIG, brand voice audit): 1 day
- **Total: 7–8 business days** from approval to App Store Connect ready

---

## 7. Open questions flagged to @pm / CEO

1. **Cashback vs. Streak for Screen 6** — does V1 launch include cashback dashboard or fallback to streak? (See dependency flag in §2.6.)
2. **Screen 7 "manifesto moment"** — this is a departure from competitor patterns (no device frame). Confidence: HIGH this is the right call for premium positioning, but it is a design bet CEO should sign off on explicitly.
3. **Illustration style for Screen 4 AI experts** — per DECISIONS-LOG pending decisions, illustration style library is unconfirmed. Screen 4 capture blocked until Uma ships an F7 sample.
4. **Spanish variant — one or two?** — LATAM-only vs. LATAM + separate España variant (per `listing-copy-ES.md §10`).

---

*Brief by @analyst (Atlas). Handoff to @ux-design-expert (Uma) for direction, then @media-engineer for production. ASO integration validated against `aso-strategy.md`.*
