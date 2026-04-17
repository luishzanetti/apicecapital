# Apice Capital — Motion Spec (FINAL v1.0)

> **Status:** Production-ready · Signature motion for V3.01 "The Dot, Plain"
> **Author:** Uma (@ux-design-expert) · 2026-04-17
> **Scope:** Logo animation for splash, Club welcome, Manifesto load, Elite unlock
> **Total duration:** 1200ms (optional pulse extends to ~1400ms)

---

## 1. Signature motion — the beat

The animation is in three movements, in this order:

1. **Letters arrive** (0–600ms) — the wordmark "Apice" fades in letter by letter
2. **Dot lands** (600–900ms) — the signature dot scales from 0 to 1 with a subtle overshoot
3. **Liveness pulse** (900–1200ms, optional) — the dot breathes once

This structure maps directly to the brand narrative: *the word is built with discipline; the dot is the signature of intent.*

---

## 2. Phase 1 — Letters (0–600ms)

### 2.1 Mechanics

- Each letter of **A · p · i · c · e** fades in independently.
- **Offset:** 80ms between letter starts.
- **Per-letter duration:** 240ms.
- **Easing:** `cubic-bezier(0.2, 0.6, 0.2, 1)` — ease-out, brand-feel (slow arrival, confident settle).
- **Transform:** `translateY(4px) → 0`, `opacity 0 → 1`.

### 2.2 Timing table

| Letter | Start | End | Overlap with next |
|---|---|---|---|
| A | 0ms | 240ms | A still arriving when p starts |
| p | 80ms | 320ms | overlap 160ms |
| i | 160ms | 400ms | overlap 160ms |
| c | 240ms | 480ms | overlap 160ms |
| e | 320ms | 560ms | ends 560ms total |

### 2.3 Rationale

80ms offset creates a **cascade without feeling sequential** — the letters overlap so the eye perceives "Apice" forming as a single typographic event, not as five individual reveals. `translateY(4px)` is subtle enough to feel like the letters "drop into place" rather than slide.

---

## 3. Phase 2 — Dot (600–900ms)

### 3.1 Mechanics

- **Delay from animation start:** 600ms (starts 40ms after "e" completes).
- **Duration:** 300ms.
- **Easing:** Spring — `mass: 1, stiffness: 180, damping: 14`.
- **Transform:** `scale(0) → scale(1)` with natural overshoot (~1.08 peak, settles to 1.0).
- **Opacity:** `0 → 1` on first 80ms of phase (fast fade-in before scale takes over).
- **Transform origin:** center of the dot.

### 3.2 Why spring physics

CSS cubic-bezier can fake an overshoot, but spring easing delivers a more organic "landing" — the dot feels *placed*, not *animated*. The values `stiffness 180, damping 14` produce one overshoot bounce (peak ~1.08) and settle in under 300ms. Framer Motion, react-spring, and Rive all honor these values natively.

### 3.3 CSS fallback (cubic-bezier approximation)

If spring engine is unavailable (Lottie on older runtimes, pure CSS), use:

```css
animation: dot-land 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms both;
@keyframes dot-land {
  0% { transform: scale(0); opacity: 0; }
  50% { opacity: 1; }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
```

The `cubic-bezier(0.34, 1.56, 0.64, 1)` is the closest fixed-curve match to the spring — back-out easing with a single overshoot.

---

## 4. Phase 3 — Pulse (900–1200ms, optional)

### 4.1 Mechanics

- **Delay:** 900ms.
- **Duration:** 300ms.
- **Easing:** `cubic-bezier(0.4, 0, 0.6, 1)` — ease-in-out.
- **Transform:** `scale(1) → scale(1.06) → scale(1)`.
- **Times:** 100% (single breath).

### 4.2 When to include the pulse

**Include** when the animation is a standalone focal event:
- First launch splash (user's first encounter with the brand)
- Club welcome screen (moment of status elevation)
- Manifesto page load (narrative entry point)
- Elite unlock (gamified milestone)

**Omit** when the animation is part of a denser UI context:
- Page header reload (would read as nervous)
- Modal open (would compete with modal entrance)
- Background / ambient use

### 4.3 Rationale

The pulse signals "**alive**" — the brand just arrived and is now breathing. It's the difference between a static logo and a mark-with-presence. 6% scale is imperceptible as a scale change but measurable as a beat.

---

## 5. Complete CSS reference implementation

```css
@keyframes apice-letter-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes apice-dot-land {
  0%   { opacity: 0; transform: scale(0); }
  30%  { opacity: 1; }
  70%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes apice-dot-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.apice-logo.animated .letter {
  opacity: 0;
  display: inline-block;
  animation: apice-letter-in 240ms cubic-bezier(0.2, 0.6, 0.2, 1) both;
}
.apice-logo.animated .letter:nth-child(1) { animation-delay: 0ms;   }
.apice-logo.animated .letter:nth-child(2) { animation-delay: 80ms;  }
.apice-logo.animated .letter:nth-child(3) { animation-delay: 160ms; }
.apice-logo.animated .letter:nth-child(4) { animation-delay: 240ms; }
.apice-logo.animated .letter:nth-child(5) { animation-delay: 320ms; }

.apice-logo.animated .dot {
  opacity: 0;
  transform-origin: center;
  animation:
    apice-dot-land  300ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms both,
    apice-dot-pulse 300ms ease-in-out 900ms;
}

@media (prefers-reduced-motion: reduce) {
  .apice-logo.animated .letter,
  .apice-logo.animated .dot {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### 5.1 Required HTML structure

```html
<span class="apice-logo animated">
  <span class="wordmark">
    <span class="letter">A</span>
    <span class="letter">p</span>
    <span class="letter">i</span>
    <span class="letter">c</span>
    <span class="letter">e</span>
  </span>
  <span class="dot" aria-hidden="true"></span>
</span>
```

---

## 6. Lottie export spec

**For production-grade motion (splash, onboarding), export to Lottie JSON from After Effects or Rive.**

### 6.1 Composition

| Parameter | Value |
|---|---|
| Composition size | 560×160 (2× wordmark primary) |
| Frame rate | 60fps |
| Duration | 72 frames (1200ms) / 84 frames with pulse (1400ms) |
| Background | Transparent |

### 6.2 Layers (bottom → top)

1. **Letter A** — text layer, position (56, 108), opacity + translateY keyframes (0f → 14f)
2. **Letter p** — keyframes start 5f, end 19f
3. **Letter i** — keyframes start 10f, end 24f
4. **Letter c** — keyframes start 14f, end 29f
5. **Letter e** — keyframes start 19f, end 34f
6. **Dot** — shape layer (ellipse 8.6×8.6), position (321, 103), fill `#16A661`
   - Scale keyframes: (36f, 0%) → (54f, 108%) → (60f, 100%)
   - Opacity keyframes: (36f, 0) → (42f, 100)
   - Pulse: (60f, 100%) → (70f, 106%) → (80f, 100%)

### 6.3 Export settings

- **Format:** Lottie JSON (bodymovin 5.9+)
- **Glyphs:** Convert text to shapes (so Geist font does not need to load)
- **Output size target:** <40KB
- **Colors:** Embed as hex (no theme tokens inside the Lottie — consumers override via CSS if needed)

---

## 7. GIF fallback (for email)

**Use case:** Corporate email signatures, newsletter hero, HTML-limited clients.

| Parameter | Value |
|---|---|
| Dimensions | 560×160 (at 2× scale for retina) |
| Duration | 1400ms (one cycle) |
| Loop | **No** — play once. Looping animated logos feel spammy. |
| Framerate | 24fps (keeps filesize down) |
| Colors | 64 palette (covers dark/cream/emerald with smooth gradients) |
| Target filesize | <80KB |
| Last frame | Full logo static — ensures non-animated clients still show the brand |

**Tool:** Export Lottie → MP4 → GIF via ffmpeg with palette optimization. Template:

```bash
ffmpeg -i apice-motion.mp4 -vf "fps=24,scale=560:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i apice-motion.mp4 -i palette.png -lavfi "fps=24,scale=560:-1:flags=lanczos [x]; [x][1:v] paletteuse" apice-motion.gif
```

---

## 8. Usage mapping

| Surface | Variant | Pulse? | Loop? |
|---|---|---|---|
| First launch splash (iOS/Android) | Lottie | Yes | No |
| Web splash / landing hero load | CSS animation | Yes | No |
| Club welcome screen | Lottie | Yes | No |
| Manifesto page load | CSS animation | Yes | No |
| Elite unlock celebration | Lottie + particle overlay (separate spec) | Yes | No |
| Email newsletter header | GIF | No (static preferred) | No |
| LinkedIn/X header image | Static PNG (no motion) | — | — |
| Product dashboard header | Static (no motion) | — | — |
| Loading state (skeleton) | Pulse only on dot | — | Yes (2s cycle) |

---

## 9. Reduced-motion behavior

For users with `prefers-reduced-motion: reduce`:
- **Letters:** appear instantly (no fade, no translate).
- **Dot:** appears instantly (no scale, no overshoot).
- **Pulse:** disabled entirely.
- **Total duration:** 0ms.

This is accessibility compliance (WCAG 2.3.3) but also brand coherence — we would never animate on a user who asked for stillness.

---

## 10. Do's and don'ts

### Do
- Honor the three-phase rhythm (letters → dot → pulse). Never swap order.
- Use 60fps export for Lottie to match CSS fidelity on retina.
- Respect `prefers-reduced-motion`.

### Don't
- **Don't loop the signature animation** outside of skeleton/loading contexts. A brand logo breathing on repeat reads as insecure.
- **Don't animate color.** The dot enters as green and stays green. Any hue change breaks the brand primitive.
- **Don't add particle effects, sparkles, or trails** to the signature motion. Those belong to the Elite unlock choreography (separate spec — coordinated with @media-engineer).
- **Don't change ease curves mid-project.** The curves above are calibrated; alternatives will feel "off" without explanation.

---

## 11. Assets delivered

- **This spec** — `motion-spec-FINAL.md`
- **CSS implementation** — inlined above (§5)
- **Lottie JSON export** — **TODO** (@media-engineer to produce from After Effects/Rive based on §6)
- **GIF fallback** — **TODO** (@media-engineer to produce from Lottie, per §7)

---

*Uma — @ux-design-expert · 2026-04-17 · Motion v1.0 FINAL*
