# AI Experts — Visual System Specification

> **Author:** @media-engineer
> **Status:** v1 DRAFT — concepts + production brief for handoff to Uma / illustrator
> **Locale:** EN-first (visual language is locale-agnostic)
> **Depends on:** `personas-concept.md` (Stefan), `competitive-visual-audit.md` (Atlas), `REDESIGN-SPEC.md` (design system)
> **Last updated:** 2026-04-17

---

## 0. Purpose

This document is the **production specification** for the 6 AI Expert avatars of Apice Capital. It freezes the constraints (palette, canvas, construction, motifs), defines the consistency rules that make 6 separate portraits read as a single family, and ships an AI-prompt library + placement matrix that a final illustrator (Uma) or an AI-assisted pipeline can execute against without ambiguity.

It does **not** ship final production art — the 6 SVGs at `/brand/assets/experts/*-concept.svg` are intentionally schematic. They exist to direct the final illustrator, not to replace her.

---

## 1. Style Philosophy — the 3-word DNA

> **Geometric humanism, warm-analytical, quietly confident.**

Expanded:

- **Geometric humanism.** Faces and silhouettes are built from simple geometric primitives (circles, rounded rectangles, soft curves) — never photo-real, never cartoon-exaggerated. This is the Stripe-illustration / Anthropic-portrait register. The viewer reads *style*, not *identity*.
- **Warm-analytical.** The palette is warm (indigo-red side of purple, amber, cream, emerald — never neon, never cyberpunk) but the composition is disciplined (no ornament, no overlapping graphics, no decorative flourishes). This is what separates Apice from Cleo on one side and Kraken on the other.
- **Quietly confident.** Expressions are thoughtful, not smiling-stock-photo. Mouths closed or barely parted. Eyes calm, forward-looking. These are experts, not hosts.

**If you can describe a proposed avatar with any of the following, reject it:** playful, quirky, cute, edgy, luxurious (Nexo), cyberpunk, sassy (Cleo), corporate-stock, "AI assistant with headset."

---

## 2. Technical Constraints

### 2.1 Canvas & sizing

| Rendering context | Size | Aspect | Notes |
|---|---|---|---|
| Master source | 1024 × 1024 | 1:1 | SVG / vector preferred. Raster fallback at 2x density (2048 PNG). |
| High-res (profile hero, lesson hero, marketing) | 512 × 512 | 1:1 | — |
| Standard card (ExpertCard, DCA planner review, Risk Check modal) | 128 × 128 | 1:1 | — |
| Inline (tooltip, chat avatar, insight card) | 48 × 48 | 1:1 | — |
| Favicon of expert (rare, for shareable lesson links) | 32 × 32 | 1:1 | Silhouette reads at this size. |

**Rule:** All sizes rendered from the same master. Never re-draw per size — use vector scaling + (if needed) a hinted 48px SVG variant where the motif is omitted for legibility.

### 2.2 Frame

- **Shape:** rounded-square with `radius = 24%` of the canvas edge (at 256 viewBox = 60px radius). This is the "Apple photo bubble" frame — not a circle (too generic), not a hard square (too cold).
- **Alternate:** circular frame permitted in inline 48px context only, where rounded-square corners collapse visually.
- **Safe area:** keep all figure-critical content (face, accent motif) within an inner 88% square. Do not place eyes or accent symbols within 12% of the frame edge — they get clipped by circular masks in some contexts (chat bubbles, Bybit-style inline avatars).

### 2.3 Background treatment

Two-stop linear gradient at 135°, from the expert's signature accent hue (upper-left, 18-22% saturation) to a warm neutral (lower-right). The neutral is `--neutral-50` in light mode, `--surface-raised` in dark mode.

Do NOT use:
- Mesh gradients (reserved for onboarding hero per REDESIGN-SPEC)
- Multi-stop rainbow gradients
- Radial gradients (read as "glow," which REDESIGN-SPEC explicitly rejects)

### 2.4 File format & weight

- **SVG concepts (v1):** < 4 KB each. No embedded raster. Inline `<defs>` gradients.
- **Production SVG (v2, from Uma):** < 40 KB each. One inline `<defs>` block per avatar, reusable paths where possible.
- **Raster fallback (for App Store, OG images):** PNG-24 with alpha at 2x density. < 200 KB at 1024px.

---

## 3. Palette Rules

Every expert gets **exactly one signature accent color**, pulled directly from `REDESIGN-SPEC` tokens. The accent appears in:

1. The upper-left stop of the background gradient (at low saturation)
2. One single element on or near the figure (a scarf, collar, tiny motif, or background chip) — NOT the whole wardrobe, NOT the hair, NOT the skin

All other colors come from the neutral scale (skin rendered in warm cream/tan, hair in warm-brown/charcoal, wardrobe in neutral-600 to neutral-800, background gradient ending in neutral-50).

### 3.1 Color assignment (consolidated from Stefan's briefs)

| Expert | Role | Token | Hex | Semantic justification |
|---|---|---|---|---|
| **Nora** | Analyst | `--primary-500` | `#8B5CF6` (Warm Indigo) | Primary brand color = primary intellectual voice. Nora is the "thesis" expert — the brand's analytical spine. |
| **Kai** | Momentum | `--info-500` | `#0EA5E9` (Sky) | Information, alertness, pattern-reading. Cool accent intentionally contrasts Nora to show the two analytical modes. |
| **Elena** | DCA Master | `--success-500` | `#10B981` (Emerald) | Compounding = growth = success-green. Elena is the conversion-driver expert; her color must read as "wealth accumulating." |
| **Dante** | Risk Guardian | `--error-500` | `#F43F5E` (Rose) | Risk = stop-loss color. Used SPARINGLY on Dante — Stefan's brief specifies "sparingly (shield highlight)." Base wardrobe is graphite (`--neutral-800`), rose is a single accent dot. |
| **Maya** | Researcher | `--chart-5` | `hsl(270 55% 45%)` (Purple) | Data visualization purple. Maya is on-chain research — her color lives in the chart palette, not the brand palette, signaling "data first, brand second." |
| **Omar** | Mentor | `--accent-400` | `#FBBF24` (Warm Amber) | Brand accent = pedagogical warmth. Omar is the first face users see; amber is the warmest, most welcoming color in the system. |

### 3.2 Why no green duplication?

Apice competitors own green at retail (Robinhood, Cash App). Elena's emerald is **success-green**, not Robinhood-green — it is hue 160 (cool-emerald), not hue 140 (lime-bright). In isolation on an avatar, this reads distinctly as "compounding wealth" rather than "trading app."

### 3.3 Background gradient recipes

```
Nora    : 135deg, hsl(245 45% 88%) → hsl(240 17% 97%)
Kai     : 135deg, hsl(199 55% 88%) → hsl(240 17% 97%)
Elena   : 135deg, hsl(160 45% 88%) → hsl(240 17% 97%)
Dante   : 135deg, hsl(240 10% 88%) → hsl(240 17% 97%)   /* neutral, not rose — rose is accent only */
Maya    : 135deg, hsl(270 45% 90%) → hsl(240 17% 97%)
Omar    : 135deg, hsl(38  65% 90%) → hsl(240 17% 97%)
```

All six backgrounds resolve to the same `--neutral-50` lower-right, which is what creates visual family even when the upper-left hues diverge.

---

## 4. Construction Style

### 4.1 Shape language

- **Flat 2D, no skeuomorphic texture.** No attempts at hair strand detail, no skin pores, no fabric weave. Everything rendered as solid geometric fills with soft curves.
- **Outline stroke:** 1.5px (at 256 viewBox) in a shade 20% darker than the adjacent fill. Outlines define silhouette and give the avatars weight against the soft gradient background. Do NOT outline every internal shape — only the silhouette and the one or two load-bearing facial features (jaw line, hair edge).
- **No gradients on the figure itself.** Gradients live only in the background. Skin, hair, wardrobe are flat fills. This is the rule that prevents drift toward "3D Memoji" or "Duolingo render."

### 4.2 Composition

Head + shoulders portrait, centered horizontally, vertically biased so that the eye-line sits at approximately 42% down from the top (classical portrait proportion). Shoulders crop at the lower frame edge, suggesting a torso without committing to wardrobe detail.

### 4.3 Proportions (the critical consistency rule)

All 6 experts share **identical head-to-canvas proportion:** head circle occupies 46-50% of canvas width. This is what makes them look like a family. Without this constraint, a more angular face + a softer face will read as "different sizes of person," breaking the set.

### 4.4 The one accent element

Every expert gets exactly ONE small graphic element that hints at their archetype. It is placed in the background, behind or to the side of the figure — **never on the figure, never in the foreground**. Scale: 15-20% of canvas width. Opacity: 60-80% (visible, but clearly secondary to the portrait).

| Expert | Motif | Placement |
|---|---|---|
| Nora | A simple 3-point line chart (not candlesticks — a thesis curve) | Upper-right behind head |
| Kai | An upward sine-wave / momentum waveform | Lower-right behind shoulder |
| Elena | A gentle rising curve (confidence-shallow, not steep) | Lower-right behind shoulder |
| Dante | A minimalist shield silhouette | Upper-right behind head, subtly |
| Maya | A 3-node constellation / graph fragment | Upper-right behind head |
| Omar | An open-book outline OR a soft chat-bubble | Lower-right behind shoulder |

**Why behind, not on:** Characters in Apice are *Apple-restrained*. The motif is a whisper of archetype, not a prop. The expert carries no signage.

---

## 5. Face Style Rules

This is the section that makes or breaks the "premium register." Cleo-style exaggerated features kill the $149.90/mo price point instantly.

### 5.1 Eyes

- **Shape:** simple horizontal ellipse or slight almond. No eyelashes rendered. No pupils with highlights (that's Pixar). A single dark fill dot inside the eye shape suffices.
- **Gaze:** forward, calm. NOT looking sideways (reads as evasive). NOT looking down (reads as shy). NOT looking up (reads as distracted).
- **Eye spacing:** slightly wider than photo-real — this is the one place where the "stylized" register is enforced. Roughly 1.5× eye-width between the two eyes.

### 5.2 Mouth

- Closed or *barely* parted. A single short horizontal line, or a very shallow arc.
- Zero teeth. Zero full smiles.
- Elena gets the "smallest smile" — a 2% upward curve on the line. Omar gets a 3% upward curve (he is the most welcoming). Everyone else is flat or barely-up. Dante is flat.

### 5.3 Nose

Optional. If included, render as a single short soft curve (like a comma), not as a full triangle. Can be omitted entirely for Maya and Kai (the younger / more neutral-leaning experts) without harm.

### 5.4 Ears

Hinted, not detailed. A single curved stroke at each side of the head, partially hidden by hair. Do not render ear internals.

### 5.5 Skin tones

Diverse but intentionally un-photorealistic. All six are rendered in warm tones pulled from a limited cream-to-warm-brown palette (hue 20-35, low-to-mid saturation):

| Expert | Skin tone (HSL) | Rationale (Stefan's brief alignment) |
|---|---|---|
| Nora | `hsl(28 35% 82%)` — warm light | Scandinavian / senior analyst register |
| Kai | `hsl(30 40% 72%)` — warm tan | Japanese/Hawaiian neutral-leaning |
| Elena | `hsl(25 40% 75%)` — warm honey | Mediterranean |
| Dante | `hsl(25 35% 70%)` — warm mid | Italian / ex-military |
| Maya | `hsl(30 45% 62%)` — warm brown | South Asian / Hebrew curious-researcher |
| Omar | `hsl(28 42% 58%)` — warm deep | Arabic / North African / broadly international |

**Rule:** Never render skin as gray, pink, or cool-olive. The warm-neutral requirement extends to skin tones — it is what holds the "warm" promise of the brand all the way into the human depiction.

---

## 6. Age & Wardrobe Signaling

Age is signaled through **three levers only**: hair style/volume, presence of glasses/jewelry, and posture angle. NEVER through wrinkles or skin detail (that breaks the flat style).

| Expert | Age (Stefan) | Hair | Wardrobe | Posture |
|---|---|---|---|---|
| Nora | Late 30s–mid 40s | Shoulder-length, structured, warm-brown | Dark neutral-700 sweater or soft-collared shirt. No blazer. | Slight 5° tilt — thoughtful |
| Kai | Early 30s | Short, crisp, charcoal | Crew neck or zip top in cool neutral-700 | Square, alert — 0° tilt |
| Elena | Mid 40s–early 50s | Shoulder-length, softer, warm-brown with one hint of silver near temple | Warm cream or oatmeal knit, higher neckline than Nora | Slight 3° tilt — welcoming |
| Dante | Late 40s | Short, slight receding hairline, dark charcoal | Dark neutral-800 jacket, no collar visible | Square, 0° tilt — solid |
| Maya | Mid-to-late 20s | Chin-length or slightly longer, dark (warm-black), may have one streak of color — keep subtle | Casual crew neck or hoodie in neutral-600 | Slight 7° tilt — curious |
| Omar | Mid 30s | Short-to-medium, slight wave, warm-brown | Open collar shirt in warm-neutral, no tie, possibly a thin silver chain | Slight 3° tilt, shoulders slightly forward — engaged |

### 6.1 Glasses rule

Optional for Maya only (Stefan's brief: "glasses optional"). If used, thin round-to-slightly-square frame in `--neutral-800`, not thick or oversized. For all other experts: no glasses in v1 (prevents the set from reading as "we gave every older expert glasses," which is an ageism cliché).

### 6.2 Jewelry / ornament rule

None on v1. Omar's thin chain in Section 6 is a future v2 consideration, not v1.

---

## 7. Consistency Test — "Do these 6 look like a family?"

The set passes if, when placed side-by-side at 128×128, a viewer can confirm **all five** of the following without being told:

1. **Same stroke weight.** Silhouette outlines match across all 6.
2. **Same head-to-frame ratio.** No expert's head looks noticeably bigger/smaller than the others.
3. **Same background resolution.** All 6 gradients resolve to the same neutral in the lower-right.
4. **Same mouth register.** No one is laughing. No one is frowning. Range: flat to 3% smile.
5. **Same frame radius.** All rounded-square at 24% radius, or all circular in 48px contexts. Never mixed.

If any of those fail, the set reads as "we hired 6 different illustrators," and the entire point of the expert system (a unified brain-trust) collapses.

---

## 8. Prompt Library — AI-assisted production

Prompts below are tuned for **Midjourney v6 / Firefly / SDXL-class models**. For Midjourney, append `--style raw --ar 1:1 --s 250 --v 6.1`. Use `/imagine` for MJ; use as system prompt for Firefly.

**Universal negative prompt (append to EVERY expert):**

```
--no photorealistic, photograph, photo, 3d render, octane, cgi, cartoon, anime, manga,
chibi, cute, kawaii, sticker, emoji, meme, crypto bro, laser eyes, diamond hands,
sunglasses, hoodie with logo, headset, AI assistant, robot, cyborg, neon glow, holographic,
gradient overload, rainbow, glitter, sparkles, multiple people, hands, text, watermark,
logo, signature, brand name, dark goth, horror, distressed, grunge, graffiti, stickers,
tattoo visible, cleavage, low-cut, bare skin below collarbone, jewelry heavy, makeup heavy,
lipstick bright, eyeshadow, blush visible, beard long, mustache curly, hat, cap, scarf large
```

### 8.1 NORA — the Thesis Builder

```
Flat 2D vector portrait illustration, head and shoulders, of a composed woman in her
early 40s, shoulder-length structured warm-brown hair, calm forward gaze, mouth closed,
wearing a dark charcoal fine-knit sweater with a simple round neckline, warm light skin
tone, minimal facial features rendered as simple geometric shapes, thin 1.5px dark
outline on silhouette only, rounded-square portrait frame with 135-degree warm-indigo to
cream linear gradient background, a small subtle thin-line 3-point upward chart fragment
sitting behind the upper right of her head at 70% opacity, Stripe illustration style
meets Anthropic portrait style, quiet intellectual authority, private banking warmth,
editorial premium fintech, flat color fills only no gradients on figure, no texture, no
photo, no cartoon, no crypto visual cliches
```

### 8.2 KAI — the Pattern Reader

```
Flat 2D vector portrait illustration, head and shoulders, of a calm neutral-leaning
person in their early 30s, short crisp dark charcoal hair, alert forward gaze, mouth
flat and closed, wearing a mid-charcoal cool-neutral crew-neck top, warm tan skin tone,
angular-but-soft geometric features, thin 1.5px dark outline on silhouette only,
rounded-square portrait frame with 135-degree sky-blue to cream linear gradient
background, a small subtle upward sine-wave momentum waveform sitting behind their lower
right shoulder at 70% opacity, pattern-recognition researcher energy not trading-floor
energy, disciplined alertness, quiet confidence, Stripe illustration style meets
Anthropic portrait style, flat color fills only no gradients on figure, no texture, no
photo, no cartoon, no crypto visual cliches
```

### 8.3 ELENA — the Patient Compounder

```
Flat 2D vector portrait illustration, head and shoulders, of a warm grounded woman in
her late 40s, shoulder-length soft warm-brown hair with a single very subtle silver
strand near the temple, direct calm forward gaze with the smallest kind smile, wearing a
warm cream oatmeal-toned fine-knit sweater with a higher soft neckline, warm honey skin
tone, flat geometric features, thin 1.5px dark outline on silhouette only, rounded
square portrait frame with 135-degree soft emerald to cream linear gradient background,
a gentle shallow rising curve sitting behind her lower right shoulder at 70% opacity,
private-client advisor who refuses to play tricks, senior steady trustworthy elder of
the group, Stripe illustration style meets Anthropic portrait style, flat color fills
only no gradients on figure, no texture, no photo, no cartoon, no crypto visual cliches
```

### 8.4 DANTE — the Risk Guardian

```
Flat 2D vector portrait illustration, head and shoulders, of a solid composed man in his
late 40s, short dark charcoal hair with slight receding hairline, serious but not harsh
forward gaze, mouth flat and closed, wearing a dark graphite neutral-800 structured
jacket with no visible collar detail, warm mid skin tone, geometric features with a
defined jawline, thin 1.5px dark outline on silhouette only, rounded-square portrait
frame with 135-degree neutral-graphite to cream linear gradient background, a
minimalist thin-line shield silhouette sitting behind the upper right of his head at
50% opacity with a single small rose-red accent dot on the shield highlight, ex-military
risk officer turned prop firm partner energy, quiet protective intensity, Stripe
illustration style meets Anthropic portrait style, flat color fills only no gradients
on figure, no texture, no photo, no cartoon, no crypto visual cliches, no aggression
no scowl no frown
```

### 8.5 MAYA — the Ground-Truth Finder

```
Flat 2D vector portrait illustration, head and shoulders, of a curious sharp woman in
her late 20s, chin-length warm-black hair possibly with one subtle streak of color, thin
round-to-slightly-square neutral-800 glasses (optional), engaged curious forward gaze,
mouth flat and barely closed, wearing a casual mid-neutral crew-neck or soft hoodie in
neutral-600, warm brown skin tone, flat geometric features, thin 1.5px dark outline on
silhouette only, rounded-square portrait frame with 135-degree soft purple to cream
linear gradient background, a small 3-node constellation graph fragment sitting behind
the upper right of her head at 70% opacity, PhD candidate who runs a Dune dashboard
energy, creative-researcher aesthetic, Stripe illustration style meets Anthropic
portrait style, flat color fills only no gradients on figure, no texture, no photo,
no cartoon, no crypto visual cliches
```

### 8.6 OMAR — the Guide

```
Flat 2D vector portrait illustration, head and shoulders, of a warm approachable man in
his mid 30s, short-to-medium warm-brown hair with a slight wave, direct welcoming
forward gaze, mouth with the softest kind smile (3% upward curve), wearing an open
collar shirt in warm-neutral tones with no tie, broadly international-leaning features,
warm deep skin tone, flat geometric features, thin 1.5px dark outline on silhouette
only, rounded-square portrait frame with 135-degree soft warm-amber to cream linear
gradient background, a subtle minimalist open-book outline sitting behind his lower
right shoulder at 70% opacity, favorite-professor-who-invests-seriously energy, patient
translator of complex ideas, Stripe illustration style meets Anthropic portrait style,
flat color fills only no gradients on figure, no texture, no photo, no cartoon, no
crypto visual cliches
```

### 8.7 Prompt iteration protocol

For each expert:
1. Generate 4 candidates at the base prompt.
2. Reject any that include: a smile showing teeth, jewelry beyond the spec, facial wrinkles, hands, any text, or a motif that overpowers the figure.
3. Select the 1 candidate closest to the adjacent avatars in the set (consistency > individual brilliance).
4. Pass the selected 6 to Uma for vectorization + harmonization. Do not ship AI raster output directly to production — the "family" constraint requires a human hand to normalize silhouettes and palette.

---

## 9. Placement Context — where each expert lives

Cross-referenced from Stefan's persona file against the current app navigation (REDESIGN-SPEC F1–F5 + V2-MASTER-PLAN Pillars). Asset size is the *minimum* Retina-2x target; larger is fine.

### 9.1 NORA — Thesis Builder

| Surface | Context | Asset size |
|---|---|---|
| Portfolio Architecture track (Pro) | Track hero | 512 × 512 |
| Market Intelligence track (Pro) | Track hero | 512 × 512 |
| Portfolio → any holding → "Why this asset?" tooltip | Inline avatar | 48 × 48 |
| Home → Daily Insight card (when fundamentals-driven) | Card avatar | 128 × 128 |
| Academy lesson intro (Nora-narrated) | Lesson hero | 512 × 512 |
| Attribution badge in Portfolio analytics view | Inline | 48 × 48 |
| Expert roster screen (full 6-grid) | Card | 128 × 128 |

### 9.2 KAI — Pattern Reader

| Surface | Context | Asset size |
|---|---|---|
| Market Intelligence track (Pro) | Track hero | 512 × 512 |
| ALTIS Trading track (Club) | Track hero | 512 × 512 |
| Portfolio Performance view → chart annotations | Inline | 48 × 48 |
| ALTIS dashboard → "What's moving" section | Card | 128 × 128 |
| Academy lesson intro (Kai-narrated) | Lesson hero | 512 × 512 |
| Expert roster screen | Card | 128 × 128 |

### 9.3 ELENA — Patient Compounder

| Surface | Context | Asset size |
|---|---|---|
| DCA Mastery track (Free) | Track hero + conversion driver | 512 × 512 |
| DCA Planner wizard → review step ("Elena recommends…") | Card | 128 × 128 |
| Streak celebration sheets ("Elena says: week 8…") | Card hero | 256 × 256 |
| Fund-alert messaging ("Elena spotted this…") | Inline | 48 × 48 |
| Academy lesson intro (Elena-narrated) | Lesson hero | 512 × 512 |
| Expert roster screen | Card | 128 × 128 |

### 9.4 DANTE — Risk Guardian

| Surface | Context | Asset size |
|---|---|---|
| Portfolio Architecture track (Pro) | Track hero | 512 × 512 |
| ALTIS Trading track (Club) | Track hero | 512 × 512 |
| ALTIS config save → "Risk Check" confirmation step | Card | 128 × 128 |
| Drawdown alerts ("Dante flagged this…") | Inline | 48 × 48 |
| Challenge 7 (Crash-responder) copy | Card | 128 × 128 |
| Academy lesson intro (Dante-narrated) | Lesson hero | 512 × 512 |
| Expert roster screen | Card | 128 × 128 |

### 9.5 MAYA — Ground-Truth Finder

| Surface | Context | Asset size |
|---|---|---|
| Market Intelligence track (Pro) | Track hero | 512 × 512 |
| ALTIS Trading track (Club) | Track hero | 512 × 512 |
| Home → "Research Spotlight" daily card | Card hero | 256 × 256 |
| Portfolio → on-chain flag ("Maya noticed unusual flows…") | Inline | 48 × 48 |
| Academy lesson intro (Maya-narrated) | Lesson hero | 512 × 512 |
| Expert roster screen | Card | 128 × 128 |

### 9.6 OMAR — the Guide

| Surface | Context | Asset size |
|---|---|---|
| Foundation track (Free) — user's FIRST face in the app | Onboarding hero | 512 × 512 |
| DCA Mastery track intro screens | Screen hero | 256 × 256 |
| Onboarding Quiz — narrator of the 3 questions | Inline-persistent | 96 × 96 |
| Any empty-state with "I don't understand this yet" | Card | 128 × 128 |
| Elite Mindset track L1 ("Here is what you are about to learn") | Lesson hero | 512 × 512 |
| Academy lesson intro (Omar-narrated) | Lesson hero | 512 × 512 |
| Expert roster screen | Card | 128 × 128 |
| Splash sign-in (occasional) — tertiary use | 256 × 256 |

### 9.7 Global asset inventory

At v1 ship, each expert needs AT MINIMUM:
- 1 × 512 (master for hero contexts)
- 1 × 128 (card contexts)
- 1 × 48 (inline contexts — may omit motif for legibility)

Total asset count v1: **18 files** (6 experts × 3 sizes). If produced in SVG, one master file per expert can serve all 3 sizes via scaling — target 6 SVG files + 6 optional 48px SVG hinted variants.

---

## 10. Versioning & change control

- **v1 concept (this doc + 6 SVG concepts):** 2026-04-17, @media-engineer
- **v1 production (Uma-finalized SVGs):** blocked on handoff — see `production-handoff.md`
- **v2 considerations (not for this phase):**
  - Seasonal variants (Dante with subtle holiday palette shift)
  - Animated entrance micro-interactions (Framer Motion, per REDESIGN-SPEC)
  - Optional 7th expert (room reserved in the framework; palette slot = `--chart-7` teal)
  - Accessibility dark-mode variants (backgrounds shift to surface-raised, figures retain same skin/hair/wardrobe colors)

Any new expert added to the system MUST pass Section 7's consistency test against the existing 6 before shipping. The test is the gate.

---

*Visual System Spec v1 — @media-engineer, for Apice Capital*
