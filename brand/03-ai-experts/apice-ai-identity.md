# Apice AI — Visual Identity System (FINAL v1)

> **Author:** @media-engineer
> **Status:** v1 FINAL — production-grade. Paired with `nano-banana-prompt-package.md`.
> **Depends on:** `brand-system-FINAL.md` (D5 logo V3.01), `visual-system-FINAL.md` (6 experts), DECISIONS-LOG D6 item 4.
> **Last updated:** 2026-04-17

---

## 0. What this document covers

The **Apice AI** is the orchestrator layer — the single, unified AI voice that hosts the six experts (Nora, Kai, Elena, Dante, Maya, Omar). Users meet the Apice AI when:

- No specific expert is invoked (general Q&A, summaries, routing)
- An expert is about to be surfaced (transition moment)
- The AI is computing / thinking (before any expert speaks)
- The AI is doing meta work (scheduling, reminders, cross-expert synthesis)

**The Apice AI is NOT a seventh expert.** It has **no face**, no age, no name besides "Apice". It is an **ambient presence** — a signal, not a persona.

---

## 1. Conceptual premise

> **The Apice AI is the brand signature dot, alive.**

The V3.01 logo is "Apice" in Geist 700 + a single bright-emerald period. The AI is **that dot, breathing**. When the user speaks to the product, they speak to the dot. When the dot is thinking, it pulses. When it is about to hand off to an expert, it dilates and the expert's avatar blooms out of it.

This keeps the AI **monogrammatically tied to the brand** (not a separate mascot) and makes the logo itself the anchor of every intelligent moment in the product. The dot is no longer just a period — it is a presence.

### Core visual metaphor

**An emerald orb with a soft halo and an inner gradient flow.** Still at rest. Pulsing when listening. Rotating a light wash when thinking. Brightening when speaking. Dilating and morphing when handing off to an expert.

### What the AI is NOT

- ❌ Not a humanoid avatar (no face, no body, no hands)
- ❌ Not an anthropomorphic character (no name beyond "Apice", no gender, no age)
- ❌ Not a loud gradient spectacle (no rainbow unless strictly in thinking state — see §5)
- ❌ Not animated at all times (idle = still; motion is earned by state)
- ❌ Not larger than the experts' avatars (when both present, expert dominates)

---

## 2. Primary mark

### 2.1 Geometry

**Base form:** perfect circle, 128×128 viewBox, single radius.

**Layer stack (outer → inner):**

| Layer | Radius | Purpose | Opacity at idle |
|---|---|---|---|
| Outer halo | 60 (padded) | Soft ambient glow, radial gradient out | 0 (invisible at rest) |
| Ring | 52 | Hairline edge, `#0F5D3F` deep emerald at 0.4 opacity | 1 |
| Orb body | 48 | Core emerald, radial gradient with brighter center | 1 |
| Inner specular | 20 (offset -8, -10) | Tiny cream highlight top-left — "life" | 0.6 |
| Core highlight | 6 (centered) | Bright `#6EE7A8` dot in middle — energy source | 0.8 |

### 2.2 Color recipe (LIGHT mode)

```
Outer halo gradient:  radial, center #16A661 @0.3, edge #16A661 @0
Orb body gradient:    radial, center #38D68A, mid #16A661, edge #0F5D3F
Ring stroke:          #0F5D3F @0.4, 1px
Inner specular:       #F7F3ED @0.6
Core highlight:       #6EE7A8 @0.8
Background (frame):   #F7F3ED (or transparent when placed inline)
```

### 2.3 Color recipe (DARK mode)

```
Outer halo gradient:  radial, center #16A661 @0.5, edge #16A661 @0
Orb body gradient:    radial, center #6EE7A8, mid #16A661, edge #0F5D3F
Ring stroke:          #6EE7A8 @0.5, 1px
Inner specular:       #F7F3ED @0.5
Core highlight:       #DFFCEA @0.9
Background (frame):   #0E0E12 (or transparent when placed inline)
```

### 2.4 Sizing guide

| Context | Size | File variant |
|---|---|---|
| Avatar circle (chat) | 40×40px rendered | `apice-ai-mark.svg` (128 viewBox) |
| Inline text (Apice is thinking…) | 16×16px rendered | `apice-ai-inline.svg` (24 viewBox) |
| Thinking hero (loading) | 96×96px rendered | `apice-ai-thinking.svg` (128 viewBox, animated) |
| Notification icon | 32×32px rendered | `apice-ai-mark.svg` |
| Empty chat splash | 160×160px rendered | `apice-ai-mark.svg` |

---

## 3. State system

The AI has **five visual states**. Each state has a deterministic animation spec — no JavaScript required; all states are achievable via CSS/SVG `<animate>`.

### 3.1 IDLE — "present but not active"

**Visual:** primary mark, halo at 0 opacity. Totally still. The dot is there. It does not need to announce itself.

- **Motion:** none
- **Use when:** user is reading, scrolling, navigating — AI is available but not engaged
- **Duration:** indefinite
- **Transition in:** fade from 0 → 1 at 220ms ease-out when AI avatar enters viewport

### 3.2 LISTENING — "user is typing, AI is receiving"

**Visual:** halo appears faintly (0 → 0.3 opacity). Core highlight pulses subtly (breathing).

- **Halo:** 0 → 0.3 → 0 opacity, 2.4s cycle, `ease-in-out`
- **Core highlight:** scale 0.9 → 1.05 → 0.9, 2.4s cycle synced to halo
- **Orb body:** unchanged
- **Use when:** chat input has focus and contains text, OR voice input is active
- **Transition:** halo fades in at 180ms ease-out

### 3.3 THINKING — "AI is processing" (HERO STATE)

**Visual:** the orb body's internal radial gradient ROTATES. A conic light-wash sweeps around the circumference like a halo in motion. Halo at 0.5 opacity, breathing faster.

- **Conic sweep:** full 360° rotation, 1.6s per cycle, linear (the sweep is what reads as "thinking")
- **Halo:** pulse 0.4 → 0.6 → 0.4 at 1.2s cycle
- **Core highlight:** scale 0.95 → 1.1 → 0.95, 0.8s cycle (faster, more active than listening)
- **Inner specular:** rotates with the conic sweep (orbits the center)
- **Use when:** the AI is computing a response, fetching data, or running a tool
- **Label pairing:** appears next to "Apice is thinking…" text (Geist 500, n-500 color)

This is the **Apple-Intelligence-adjacent moment** — the part that users remember. Motion is the product.

### 3.4 SPEAKING — "AI is delivering output"

**Visual:** orb brightens (core highlight goes larger and brighter), halo stays at steady 0.2 opacity, conic sweep stops. A subtle "breath" pulse synced to output cadence.

- **Core highlight:** 1.0 → 1.15 → 1.0, 1.4s cycle (calm, confident breathing)
- **Halo:** steady 0.2 opacity (no pulse — the speaking state is stable, not searching)
- **Orb body:** the radial gradient's center brightness lifts 10% (`#38D68A` → `#6EE7A8`)
- **Use when:** text is streaming into the chat bubble, OR audio is playing back
- **Stop condition:** when streaming ends, transition to IDLE over 320ms ease-out

### 3.5 HANDING OFF — "Apice surfaces a specific expert"

**Visual:** the orb **dilates** (scales 1.0 → 1.3 → 0 over 600ms) while simultaneously the target expert's avatar **blooms** from the orb's position (opacity 0 → 1, scale 0.6 → 1 over 500ms with 100ms delay). The emerald color briefly washes through the expert's accent color for 200ms before settling.

- **Duration:** 720ms total choreography
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (smooth, decisive)
- **Use when:** routing a question to Nora, or when chat history transitions from "Apice" speaker to "Nora" speaker
- **Implementation note:** this is the ONE state that requires JS/Framer Motion — pure CSS cannot chain scale-morph + cross-fade with accent-color swap. Fallback for no-JS: hard cut with 200ms fade.

### 3.6 State transition matrix

| From → To | Trigger | Duration |
|---|---|---|
| Idle → Listening | input focus + non-empty | 180ms |
| Listening → Thinking | user submits | 120ms (halo tightens, sweep spins up) |
| Thinking → Speaking | first output token | 200ms (sweep decelerates, core brightens) |
| Speaking → Idle | stream ends | 320ms |
| Any → Handing off | expert routed | 720ms (see §3.5) |
| Handing off → Idle | expert dismissed | 400ms |

---

## 4. Motion spec — timing & easing reference

| Parameter | Value |
|---|---|
| Base breathing cycle | 2.4s (idle/listening) |
| Active breathing cycle | 1.4s (speaking) |
| Thinking breathing cycle | 0.8s (hero) |
| Conic sweep cycle | 1.6s (thinking only) |
| Halo fade curves | `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out) |
| Core highlight curves | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Expert handoff curves | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Reduced motion fallback | All animations cease; halo stays at static 0.3 opacity when "active" (listening/thinking/speaking) |

### 4.1 Benchmarks (reference)

| Product | Their signal | Apice equivalent |
|---|---|---|
| Apple Intelligence | Rainbow halo, conic sweep | Thinking state — emerald-only |
| Claude | Orange breathing dot | Idle/Listening — but monochromatic emerald |
| Gemini | Star twinkle, 4-point | Not adopted — we use circle, not star |
| ChatGPT | Three dots typing | Not adopted — the orb is our typing indicator |
| Perplexity | Pulsing square | Not adopted — we are round, per §1 |

**Key differentiator:** Apice's AI is **monochromatically emerald by default**, never rainbow, never shifting. The *motion* is the variety — not the color. This is the single most important rule for brand consistency.

---

## 5. Color strategy decision

The CEO asked for three options:

### Option A — Unified emerald-centered gradient *(recommended default)*
- Gradient stops: `#0F5D3F → #16A661 → #38D68A → #6EE7A8`
- Same palette for all five states; only motion differs
- **Pros:** airtight brand consistency, survives across 5-year horizon, compositionally calm, aligns with D5 logo
- **Cons:** less "magic" than rainbow — more restrained

### Option B — Rainbow / prism (Apple-Intelligence register) *(reserved for thinking ONLY)*
- Gradient stops: emerald → cyan → violet → amber → emerald (full spectrum loop)
- Used ONLY in the THINKING state's conic sweep, fading back to emerald at output
- **Pros:** delivers the "wow" moment users expect from AI brands in 2025–2026
- **Cons:** category-register drift (Robinhood Spark, iOS AI, Gemini all use rainbow — Apice loses premium positioning)

### Option C — Green→cream→green breathing (monochromatic brand-loyal)
- Two-tone only: `#16A661 + #F7F3ED`
- **Pros:** maximum restraint, most Stripe-register
- **Cons:** reads as "loading spinner" not as "intelligent presence"

### RECOMMENDATION: **hybrid of A + B-lite**

- **All states (idle, listening, speaking, handoff) — Option A** (emerald-centered, monochromatic)
- **Thinking state ONLY** — the conic sweep has a subtle **rainbow tint** added at 30% opacity over the emerald base. So the sweep reads as "light refracting through an emerald prism," not as "Apple rainbow."
- Result: premium-coded 95% of the time, "delightfully smart" 5% of the time.

**Defense:** The CEO's 65% premium / 35% accessible positioning (D2) says "Revolut-register, not Robinhood." Full rainbow is Robinhood-register. A green gem that catches light like a prism for a fraction of a second is Revolut with a heartbeat. The thinking-state sparkle is the *one* moment of overt magic we allow.

**CEO call:** approve hybrid (default), OR lock to pure Option A, OR promote to Option B full rainbow. Ship default = hybrid.

---

## 6. Integration — where the mark appears

| Surface | Size | State default | Behavior |
|---|---|---|---|
| Chat input placeholder (empty state) | 32px avatar | Idle | Pulses gently when user focuses |
| Chat input (user typing) | 32px avatar | Listening | — |
| Chat bubble avatar (Apice speaker) | 40px | Speaking while streaming, Idle after | — |
| Chat bubble avatar (expert speaker) | Expert avatar | — | Orb morphs into expert on handoff |
| Expert avatar handoff | 40px → expert | Handing off | One-shot animation per handoff |
| Dashboard Home — "AI Apice" card | 64px | Idle | On hover → Listening |
| Notifications — "Apice sent you…" | 24px inline | Idle | — |
| Loading state (any AI-powered surface) | 48px | Thinking | Runs until complete |
| App onboarding — "Meet the AI" slide | 160px | Thinking looped | Hero moment |
| Splash / launch screen | 200px | Idle → pulses once | 400ms cycle then still |
| Pushes & system notifications | 24px | Idle | — |
| Favicon on AI-focused pages | 32px | Idle | Static |

**Co-location rule:** when Apice AI mark and an expert avatar appear in the same surface at the same time, **expert dominates visually** (larger, in the message header) and AI mark downgrades to inline pill-label ("✨ Apice is routing…"). The AI is the infrastructure; the expert is the voice.

---

## 7. Relationship to the 6 experts — handoff choreography

### 7.1 Visual continuity rule

Every expert avatar is a rounded-square frame with the **`#16A661` active dot** in the bottom-right (per `visual-system-FINAL.md` §1). **That dot IS the Apice AI.** So: the AI mark is *already present* on every expert avatar. The handoff animation is not a replacement — it is the AI dot **expanding** into the full expert frame.

### 7.2 Handoff sequence (step-by-step)

```
Frame 0ms    : Apice orb (40px, centered in chat bubble avatar slot)
Frame 100ms  : Orb halo dilates (halo radius 1.3×, opacity spikes to 0.7)
Frame 250ms  : Orb body begins to morph — shape transitions from circle to rounded-square, 24% radius
Frame 400ms  : Expert's avatar fills the frame (opacity 0 → 1) with accent-color wash (e.g., Nora's indigo) overlaid at 30%
Frame 600ms  : Accent wash fades out, expert's accent now resides only in their signature element
Frame 720ms  : Expert fully visible. The `#16A661` dot reappears in bottom-right — that was the Apice orb, now seated as the active-indicator
```

### 7.3 Reverse choreography (expert → AI return)

- User asks a new question that doesn't need the expert → expert's avatar collapses into the bottom-right dot → dot re-inflates to full orb → Idle state.
- Duration: 480ms (faster than forward — returning to AI is less ceremonial than surfacing an expert).

### 7.4 When NOT to use handoff animation

- Respect `prefers-reduced-motion: reduce` — skip the morph, use a 200ms crossfade.
- In chat history scroll-back (viewing past exchanges), avatars are static. No retroactive animation.
- In the "Team" settings screen where all 6 experts + the Apice AI mark are listed, all are static. The animation is reserved for live conversational moments.

---

## 8. Accessibility

- **Reduced motion:** Detect via `@media (prefers-reduced-motion: reduce)` — ALL animations cease. Halo sits at static 0.3 opacity when in any non-idle state. Thinking uses static conic gradient (no rotation).
- **Screen readers:** The mark has `role="img"` + `<title>Apice AI</title>` + `<desc>The Apice artificial intelligence assistant.</desc>`. State changes are announced via `aria-live="polite"` regions in the parent component, not via the SVG itself.
- **Contrast:** Emerald `#16A661` on cream `#F7F3ED` is 3.8:1 — passes AA for graphical elements (≥3:1). The ring in deep emerald `#0F5D3F` is 4.8:1 — bolsters the edge legibility.
- **Low-vision alt rendering:** A flat two-tone variant (`apice-ai-mark-solid.svg`) ships alongside for Windows High Contrast mode detection. Solid `#16A661` fill with `#0F5D3F` 1.5px ring.
- **Color blindness:** The mark is pure hue (emerald) with gradient luminance variation — deuteranopes will see it as luminance-shifted gray with similar tonal structure. Motion still conveys state, so meaning is preserved.

---

## 9. Don'ts gallery

1. ❌ Do not change the orb's core hue based on semantic state. Error ≠ red orb. Success ≠ green orb (already green). Use chrome around the orb (toast color, border) to convey state — not the orb itself.
2. ❌ Do not place the orb on a colored/photo background without a cream or ink solid backer. The halo depends on neutral ground to read correctly.
3. ❌ Do not animate the orb during idle. Motion is earned by interaction. An idle orb that pulses is restless, not calm.
4. ❌ Do not use the orb as a button's primary content. The orb is a signal, not an action. Actions get buttons.
5. ❌ Do not scale the orb above 240px. Beyond that size, the simplicity of the mark starts to look empty. For large hero moments, pair with typography ("Apice" wordmark) — not more orb.
6. ❌ Do not combine the orb with a particle field, starfield, or additional orbital satellites. The orb is one atom, not a system.
7. ❌ Do not use the orb in app icon territory (favicon, iOS icon). The app icon is the dot-on-dark per `brand-system-FINAL.md` §8. The AI orb lives inside the product, not on the app shelf.

---

## 10. File reference index

Paths relative to `Apps/ApiceCapital/brand/assets/ai-apice/`.

| File | viewBox | Purpose | Animated? |
|---|---|---|---|
| `apice-ai-mark.svg` | 128×128 | Primary static mark — use everywhere by default | No (CSS can animate) |
| `apice-ai-thinking.svg` | 128×128 | Thinking state with embedded SVG animation | Yes (`<animateTransform>`) |
| `apice-ai-inline.svg` | 24×24 | Tiny inline variant for "Apice is thinking…" text | No |
| `apice-ai-mark-solid.svg` *(v1.1)* | 128×128 | High-contrast two-tone fallback | No |
| `apice-ai-mark-dark.svg` *(v1.1)* | 128×128 | Dark-mode gradient variant | No |

v1.1 files deferred — ship the 3 core files listed with bolded state.

---

## 11. Component API proposal (for @dev)

```tsx
type ApiceAIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'handing-off';

interface ApiceAIMarkProps {
  state: ApiceAIState;
  size?: number;                       // px, default 40
  handoffTo?: ExpertName;               // only when state='handing-off'
  theme?: 'light' | 'dark';             // default auto from CSS var
  reducedMotion?: boolean;              // default auto from media query
  className?: string;
}

<ApiceAIMark state="thinking" size={48} />
```

**Rendering rule:** `<ApiceAIMark />` internally chooses which SVG file to inline based on `state`:
- idle/listening/speaking → `apice-ai-mark.svg` + CSS animations
- thinking → `apice-ai-thinking.svg` (has embedded animation)
- handing-off → framer-motion choreography wrapping `apice-ai-mark.svg` → `<ExpertAvatar />`

---

## 12. Versioning & evolution

- **v1 FINAL (this spec, 2026-04-17):** 3 production SVGs + component contract + motion spec. Ship.
- **v1.1:** high-contrast solid variant + dark-mode variant. Non-blocking.
- **v2 (roadmap):** Lottie-wrapped thinking animation for marketing (higher fidelity than inline SVG); 3D/WebGL variant for App Store hero; seasonal accent shifts (holiday emerald deepens).

---

## 13. Governance

- Any change to this spec (geometry, palette, or motion curves) requires CEO approval via DECISIONS-LOG entry.
- SVG files are source of truth. Raster exports are derivatives.
- No agent may introduce new AI-specific variants without @media-engineer + @ux-design-expert sign-off.

---

*@media-engineer · 2026-04-17 · v1 FINAL*
