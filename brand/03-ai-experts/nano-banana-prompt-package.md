# Nano-Banana Prompt Package — 6 Apice AI Experts

> **Author:** @media-engineer
> **Target model:** Google **Gemini 2.5 Flash Image** (codename "nano-banana")
> **Purpose:** Copy-paste ready prompt library to generate semi-photorealistic portrait avatars of Nora, Kai, Elena, Dante, Maya, Omar.
> **Status:** v1 FINAL — 2026-04-17
> **Depends on:** `personas-concept.md` (bios), `visual-system-FINAL.md` (palette), `brand-system-FINAL.md` (emerald anchor).

---

## 0. Summary

This package contains everything needed to go from "no avatars" → "6 approved PNG portraits" in one working session:

- **1 master style constraint** applied to all prompts
- **6 per-expert prompts** (150–250 words each, hyper-specific)
- **3 execution paths** — AI Studio UI, Python SDK, curl
- **1 Python runner script** (`nano-banana-runner.py`) for batch execution
- **1 post-processing recipe** — cropping, color correction, background removal, brand dot overlay
- **1 quality checklist** (10 yes/no questions per generation)
- **Cost & time estimate** — total < $5 USD for the full set

---

## 1. Art direction decision (applied to ALL prompts)

**Chosen style: Semi-photorealistic editorial portraiture with painterly warmth.**

### Why not pure photorealism?
- Pure photorealism invites uncanny-valley risk at avatar scale (40–128px) — small artifacts read as "wrong."
- The 6 experts are **archetypes, not real people.** Too-real photos break the fiction that these are "our AI experts" and tip into "stock photos."
- The CEO's REDESIGN-SPEC reference is "Claude/Anthropic warmth meets Stripe clarity" — neither Claude nor Stripe use literal photorealism.

### Why not flat illustration?
- Current concept SVGs are flat-illustrated. Upgrading to "more flat illustration" would not differentiate.
- The Atmosphere ambition is **premium** (D2 decision — Revolut-register, 65% premium). Illustration reads as "startup." Semi-photorealistic editorial reads as "private banking with personality."

### The target register

Think the portrait style of:
- **The New Yorker online editorial portraits** (Eric Comstock, Tom Bachtell — digital painterly with photographic weight)
- **MIT Tech Review feature portraits** (editorial, warm-lit, never stock-smiley)
- **Anthropic's "Meet the team" photography direction** (honest, thoughtful, single key light)
- **Stripe Sessions speaker photos** (composed, warm, individually distinctive)

Not:
- ❌ iStockphoto "finance professional smiling at laptop"
- ❌ Bloomberg Terminal headshots (too corporate-cold)
- ❌ Midjourney anime-adjacent stylization
- ❌ CNBC pundit portraits
- ❌ Disney Pixar-smooth 3D

### Recommended technical treatment

- **Medium:** digital painting with photographic reference; strokes softened but structural; skin texture realistic but not pore-level.
- **Lens feel:** 85mm portrait prime, f/2.8, slight depth-of-field fall-off.
- **Lighting:** single warm key from camera-left, soft fill, subtle rim light for shape separation.
- **Color profile:** warm-neutral base (cream/sand background), each expert carries a small accent of their signature hue.
- **Framing:** chest-up or slightly-higher, direct forward gaze for authority archetypes (Nora, Dante, Elena, Omar) or 3/4 turn for exploratory archetypes (Kai, Maya).

---

## 2. Master style constraint (PREPENDED to every expert prompt)

Copy this block and prepend it to each of the 6 per-expert prompts. **Do not modify** — consistency across the set depends on this being identical.

```
STYLE: Semi-photorealistic editorial portrait, digital painting with photographic weight. The register is private-banking-meets-Anthropic: calm confidence, quiet intelligence, human warmth without performative smile. Think New Yorker online editorial portraiture, MIT Tech Review feature photography, Stripe Sessions speaker headshots. NOT stock photography, NOT anime, NOT 3D render, NOT cartoon, NOT corporate-cold.

FRAMING: Chest-up portrait, single subject, centered with subtle weight to one side per character. Shoulders and upper torso visible. Hands not in frame.

LENS: Emulate 85mm prime lens at f/2.8. Soft depth-of-field fall-off toward background. Sharp focus on the eyes.

LIGHTING: Single warm key light from camera-left at 35°, soft fill from the right, subtle cool rim light separating shoulders from background. Cinematic, never harsh. Skin reads warm and living, not plasticky.

BACKGROUND: Soft warm-neutral gradient, sandy cream (#F7F3ED) at bottom blending to a deeper warm shadow at the edges. NO literal scenes, NO offices, NO trading floors, NO laptops, NO charts on walls, NO city windows. The background is atmosphere, not location.

PALETTE CONSTRAINT: Predominantly warm neutrals — cream, sand, soft taupe. Each subject carries ONE visible but subtle accent of their signature color (specified per expert below). The Apice brand emerald (#16A661) must appear as a tiny accent somewhere — a pin, a ring, a visible lining — but never dominant, never obvious.

EXPRESSION: Composed and thoughtful. Gentle engaged gaze with the viewer. NOT smiling wide — a faint trace of warmth at the corner of the mouth is allowed. Never laughing, never frowning, never dramatic. Interior stillness.

WARDROBE PRINCIPLE: Modern professional with personal signature. NOT a stiff suit, NOT business-casual-generic. Each expert's wardrobe expresses their archetype. Natural fabrics: wool, linen, cotton, fine knits. Neutral base with one accent touch.

NEGATIVE — do not generate any of: crypto iconography, coins, Bitcoin logos, laser eyes, neon lights, trading floor imagery, multiple monitors, stock graphs, Bloomberg orange, dollar signs, gold chains, rolex watches visible, flashy jewelry, clown colors, corporate stock-photo smile, suit-and-tie obvious banker look, messy hair, wrinkled clothes, oversaturated colors, HDR hyperrealism, grainy film look, anime proportions, exaggerated features, cartoon eyes, text, watermarks, logos.

OUTPUT: Single portrait, high quality, aspect ratio per request.
```

---

## 3. The 6 per-expert prompts

Each prompt below is self-contained and paired with the master style constraint above. Concatenate master + expert prompt with a blank line between them when sending.

### 3.1 NORA — the Thesis Builder

**Archetype:** Analyst · **Age range:** late 30s to mid 40s · **Accent:** Warm Indigo `#8B5CF6`

```
SUBJECT: Nora, the Thesis Builder. A woman in her early-to-mid 40s. European-Scandinavian features with warm undertones — think a woman whose family moved from Stockholm to Milan a generation ago. Softly angular face, intelligent grey-green eyes behind thin wire-frame reading glasses resting low on the nose. Medium-length straight chestnut-brown hair with quiet auburn highlights, pulled half-back in a loose low twist. Minimal makeup: neutral warm tone, a whisper of warm rose on the lips.

EXPRESSION: Composed, slightly inquisitive — she is listening to something she is about to thoughtfully disagree with. Tiny lift at the corner of the left side of her mouth. Direct eye contact with the viewer.

WARDROBE: A deep indigo fine merino turtleneck under an unstructured oatmeal wool blazer, collar softly rolled. NO tie. A single slim silver ring on the middle finger (hand not in frame, but implied in posture). The indigo reads as the only cool note in an otherwise warm composition — this is her signature.

POSTURE: Shoulders squared but relaxed. Slight forward lean. She is present with the viewer, not posing.

ACCENT TOUCHES: A tiny emerald pin on the blazer's left lapel — barely visible, the Apice signature. The indigo of the turtleneck is her personal accent — warm indigo, leaning toward deep violet rather than electric.

MOOD: Quiet authority. A senior analyst who has seen three crypto cycles and is unfazed. She has a thesis. She is not selling it.

FRAMING: Chest-up, slight 1/8 turn to her right (viewer's left), eyes to camera. Background: cream-to-warm-shadow gradient, painterly soft-focus.
```

---

### 3.2 KAI — the Pattern Reader

**Archetype:** Momentum Trader · **Age range:** early 30s · **Accent:** Sky Blue `#0EA5E9`

```
SUBJECT: Kai, the Pattern Reader. A person in their early 30s with a deliberately androgynous presentation — features that read as neither strongly masculine nor strongly feminine. East Asian and Pacific Islander heritage, warm golden-olive skin tone. Sharp cheekbones, alert almond-shaped dark brown eyes with a subtle underlining of minimal eyeliner. Eyebrows clean and natural. Short textured haircut with a slight sweep — jet black with a faint cool undertone, styled with a matte product so individual strands catch light.

EXPRESSION: Alert but calm — the moment just before they notice something in a chart that others missed. Brows relaxed, eyes slightly narrowed in focus. Lips neutral, closed, faint hint of a half-smile suggestion at the right corner. They are reading you the way they read a tape.

WARDROBE: A charcoal technical knit crewneck (merino-poly blend) with a fine cable texture, paired with a soft navy unstructured overshirt open at the front. A thin sky-blue silk scarf loosely tucked at the neckline — barely visible but deliberate, their signature accent. NO visible logos. No tie.

POSTURE: 3/4 turn to camera-right (their left), shoulders squared, head returning toward the viewer. Lean and composed.

ACCENT TOUCHES: The sky-blue scarf lining is the only non-neutral color in the composition. A small matte emerald stud in the left ear — the Apice signature, subtle.

MOOD: Pattern recognition. Disciplined alertness. Not a trader on a floor — a researcher in a quiet studio who happens to move markets.

FRAMING: Chest-up, 3/4 turn, eyes to camera. Background: soft gradient from warm cream to slightly cooler shadow on the subject's right side, suggesting late-afternoon north-facing window light.
```

---

### 3.3 ELENA — the Patient Compounder

**Archetype:** DCA Master · **Age range:** early to mid 40s · **Accent:** Emerald `#16A661` (aligned with brand)

```
SUBJECT: Elena, the Patient Compounder. A woman in her early-to-mid 40s. Mediterranean features — think northern Italian or southern French heritage. Warm olive-sand skin tone with natural softness. Long, gently wavy dark brown hair with sun-touched auburn lowlights, worn loose and falling just past the shoulders — uncurated but well cared for. Warm hazel eyes with faint smile lines that read as earned, not cosmetic. No heavy makeup: a warm bronze on the eyelids, natural lip.

EXPRESSION: Serene and grounded. A small, genuine half-smile that barely lifts the lips — the smile of someone who has been proven right by time and does not need to prove it again. Direct, patient eye contact. Not inviting. Steady.

WARDROBE: A soft sage-emerald fine cashmere sweater (emerald leaning toward muted, NOT neon) with a shallow V-neck. Underneath, a simple cream camisole barely visible at the collar. A small gold pendant necklace resting against the sternum — one tiny green stone at its center. Natural cotton-linen weave visible in the sweater texture.

POSTURE: Squared to camera, shoulders relaxed and open. The most anchored of the six. She does not lean forward or back.

ACCENT TOUCHES: The sweater itself IS her accent — sage-emerald aligned with the Apice brand (around #2A8F5D, slightly deeper than pure brand emerald). The tiny green stone in the pendant is the only saturated emerald on her — Apice signature. No other visible jewelry except a simple warm-gold hoop in each ear.

MOOD: Unshakeable patience. She has run the same weekly buy for 12 years. The market has panicked around her four times. She did not.

FRAMING: Chest-up, fully forward, eyes to camera. Background: warm cream that deepens to golden-taupe in the corners, suggesting late-afternoon sun.
```

---

### 3.4 DANTE — the Risk Architect

**Archetype:** Risk Manager · **Age range:** mid-to-late 40s · **Accent:** Rose `#F43F5E` (sparing)

```
SUBJECT: Dante, the Risk Architect. A man in his mid-to-late 40s. Mediterranean features — Italian heritage with a hint of Greek. Olive skin, closely-trimmed dark beard showing the first silvers at the chin and sideburns — deliberate, maintained. Short-cropped dark hair with natural graying at the temples. Direct slate-grey eyes under calm brows. Strong jawline, a small faint scar along the right eyebrow that reads as history, not threat. No rings, no watch visible.

EXPRESSION: Calm and attentive. The slightest narrowing of the eyes — he is assessing. The mouth is neutral and set. He is not suspicious of the viewer; he is measuring. The expression of a man who has told investors "no" more often than "yes" and does not apologize for it.

WARDROBE: A graphite-charcoal fine wool roll-neck (structural, not bulky), over which sits an unstructured dark slate-grey wool overshirt — buttoned halfway. NO tie. NO visible pocket square. The rose accent appears ONLY as a thin dusty-rose hairline pin on the overshirt's inside lapel fold — barely visible, deliberate. Everything else is graphite and shadow.

POSTURE: Squared to camera. Shoulders deliberately placed, spine straight but not rigid. The composition is the most vertical of the six.

ACCENT TOUCHES: The dusty-rose pin is his signature — sparing, inward, almost a secret. A small Apice emerald rivet on the overshirt's sleeve cuff — tiny, precise, easily missed.

MOOD: Protective. Not threatening. The ex-military risk officer who became a family-office partner. He would take a loss so that you would not.

FRAMING: Chest-up, full forward, eyes to camera. Background: cool-to-neutral gradient, slate grey blending to warm shadow at the edges — the coolest background of the six, reinforcing his protective register.
```

---

### 3.5 MAYA — the Deep Researcher

**Archetype:** Researcher · **Age range:** late 20s to early 30s · **Accent:** Purple `#8E4CBF`

```
SUBJECT: Maya, the Deep Researcher. A woman in her late 20s / early 30s. South Asian heritage (Indian or Indian-American), warm tan skin tone with golden undertones. Long-ish dark hair with natural waves, pulled loosely behind one ear, revealing a small silver hoop earring. Expressive deep brown eyes behind vintage round thin-frame glasses in matte black — curiosity made visible. Natural brows, a small nose ring (tiny silver stud, right nostril). Minimal makeup: skin-true base, a faint berry on the lips.

EXPRESSION: Sharp-focused curiosity — the millisecond after she sees a data point that makes her reframe an entire thesis. Eyebrows lifted a fraction, lips slightly parted with the word she is about to say, eyes direct and live. More energy than any of the other five, but still composed.

WARDROBE: A deep plum / dusty-purple oversized cashmere turtleneck (loose, comfortable, real — not photoshoot-crisp), sleeves pushed to the forearms (sleeves not in frame). Small silver chain necklace with a delicate geometric pendant — a minimalist constellation motif, three dots connected by thin lines.

POSTURE: 3/4 turn to camera-left (her right). Slight forward lean — she is engaged with the viewer, about to ask or tell something. The most energized posture of the six without being theatrical.

ACCENT TOUCHES: The plum-purple sweater is her signature. The constellation pendant is a tiny node-graph — it ties to her researcher identity. A nearly-invisible emerald dot worked into the clasp of the necklace at the back of her neck — the Apice signature, just out of focus.

MOOD: Contrarian intelligence. She reads on-chain data for fun. She is the youngest of the six and the most likely to disagree with the other five.

FRAMING: Chest-up, 3/4 turn, head returning to camera. Background: warm cream with a slightly cooler purple-grey shadow on the right, suggesting a window on her right side.
```

---

### 3.6 OMAR — the Mentor

**Archetype:** Mentor · **Age range:** 50s · **Accent:** Warm Amber `#D9912D`

```
SUBJECT: Omar, the Mentor. A man in his mid 50s. North African / Middle Eastern heritage — think Moroccan or Lebanese lineage. Warm sand-brown skin with the quiet glow of someone who spends time outdoors. Closely trimmed salt-and-pepper beard (more salt than pepper at the chin, more pepper at the jaw) — deliberate, kempt. Short curly hair, mostly silver-gray now, with black at the temples. Deep-set warm brown eyes with genuine laugh lines at the outer corners — these are his most defining feature. Gentle brows.

EXPRESSION: This is the warmest expression of the six. A genuine, soft, un-performed half-smile — the smile of a professor greeting a returning student. Eyes engaged, slightly creased at the corners. This is the single expression where "warm" crosses into "openly welcoming." Never a full grin — dignified warmth.

WARDROBE: A soft camel-and-cream natural linen shirt, collar open, top button undone — relaxed, honest. Over it, an unstructured warm-amber wool cardigan (the amber is his signature accent — earthy, not neon). Sleeves pushed to mid-forearm (out of frame). A thin brown leather cord necklace with a small wooden bead resting at the sternum.

POSTURE: Squared to camera, slightly turned 1/8 to his left. Shoulders relaxed, posture open. He is inviting the viewer in.

ACCENT TOUCHES: The amber cardigan is his signature. A small Apice emerald thread stitched along the cardigan's inside placket — the brand signature, quiet, inward. A simple open book barely visible in soft-focus at the lower edge of the frame — suggested, not literal (MUST be painterly-blurred, not a stock photo book).

MOOD: Approachable wisdom. The favorite professor who also happens to invest seriously. Patience made visible.

FRAMING: Chest-up, fully forward with slight 1/8 turn, eyes to camera. Background: rich warm cream deepening to honeyed amber at the edges — the warmest background of the six.
```

---

## 4. Generation recommendations

### 4.1 Aspect ratios

| Use case | Aspect ratio | Native render | Final crop |
|---|---|---|---|
| App avatars (chat, lists) | `1:1` | 1024×1024 | 512×512 → 256×256 |
| Chest-up hero portraits | `4:5` | 1024×1280 | for profile pages |
| Marketing hero (full bleed) | `16:9` | 1536×864 | for landing pages |

**Default for v1 ship:** generate at `1:1` × 1024 for avatars, then crop to the 256×256 spec per `visual-system-FINAL.md`.

### 4.2 Seed strategy

Gemini 2.5 Flash Image does not expose seeds in the same way Stable Diffusion does, but it does respect **iterative refinement prompts** ("Keep the same person, same lighting, same wardrobe — but change X"). Strategy:

1. **First pass — exploration.** For each expert, generate **4 variants** with identical prompt (Gemini varies naturally between runs). Pick the best of 4.
2. **Second pass — refinement.** Take the winner and do 2 refinement prompts: one for minor adjustment (e.g., "same portrait, but slightly softer key light" or "keep identical, but tighten background gradient"), and one for aspect variation if needed.
3. **Third pass — only if needed.** If first two passes haven't landed, re-read the prompt and identify what Gemini is misinterpreting — common issues: wardrobe drift, over-smiling, accent color bleeding into wrong object.

**Expected iterations per expert:** 3–6 total generations before a keeper emerges.

### 4.3 Style reference images (optional but powerful)

Gemini 2.5 Flash Image supports multi-image prompting. If you want tighter control, attach 1–2 reference images along with the text prompt:

- For Nora: upload a still from the 2014 New Yorker editorial portrait of a female economist (Google search: `"new yorker portrait female economist editorial 2014"` — pick one that matches the warm analytical vibe).
- For Kai: upload a reference from any moody pattern-recognition researcher editorial.
- For Elena: Anthropic's "Meet the Leadership" page has warm seated portraits that fit her register.
- For Dante: The "quiet intensity" reference from Stripe Sessions speaker portraits.
- For Maya: MIT Tech Review's 35 Under 35 portrait series.
- For Omar: The New York Times "Overlooked" series uses the right warm-professor register.

**Legal note:** reference images are used to anchor *style, lighting, and mood* — NOT to replicate a specific person's likeness. If Gemini refuses to produce someone resembling a named real person, the prompt is working correctly; rephrase to describe the abstract register instead.

---

## 5. Execution instructions

### 5.1 Option A — Google AI Studio UI (easiest, no code)

1. Open https://aistudio.google.com → sign in with Google account
2. Click **"Create new"** → select **Gemini 2.5 Flash Image** from the model dropdown (sometimes shown as "Gemini 2.5 Flash Image Preview" or labeled `gemini-2.5-flash-image`)
3. In the chat input, paste:
   - First: the **master style constraint** from §2
   - Blank line
   - Then: one of the 6 expert prompts from §3
   - Include at the end: `Generate as a 1:1 aspect ratio portrait.`
4. Click **Run** (or `Ctrl+Enter`)
5. Gemini returns one image. If unsatisfied, click **"Regenerate"** for a fresh variant.
6. Click the image → **Download** to save locally.
7. Rename the file per naming convention (§6.3) and save to `brand/assets/experts/real/`.
8. Repeat for each of the 6 experts.

**Approximate time:** 10–15 minutes per expert including iteration → **~90 minutes for all 6.**

### 5.2 Option B — Python SDK (best for batch)

Use the paired `nano-banana-runner.py` script (see that file). Prerequisites:

```bash
pip install google-genai pillow
export GEMINI_API_KEY="your_key_from_https://aistudio.google.com/apikey"
```

Run:

```bash
cd /Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/brand/03-ai-experts
python nano-banana-runner.py --all --variants 4
```

This will:
- Loop over all 6 experts
- Generate 4 variants per expert (24 total generations)
- Save outputs to `../assets/experts/real/{name}-v{n}-{timestamp}.png`
- Print a summary of elapsed time + cost

### 5.3 Option C — Direct curl (for CI integration or one-off calls)

```bash
# Replace $GEMINI_API_KEY with your key
# Replace $PROMPT with the master+expert concatenation, URL-escaped
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "PASTE_FULL_MASTER_PLUS_EXPERT_PROMPT_HERE"
      }]
    }],
    "generationConfig": {
      "responseModalities": ["IMAGE"],
      "temperature": 1.0
    }
  }' \
  | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' \
  | base64 --decode > nora-v1.png
```

---

## 6. Post-processing recipe

After nano-banana returns a raw image, these are the steps to make it production-ready.

### 6.1 Crop and resize

Nano-banana typically returns 1024×1024 from a `1:1` request. To hit the 256×256 app-avatar spec:

```bash
# Using ImageMagick (install via `brew install imagemagick`)
magick convert nora-raw.png -resize 512x512 -gravity center -crop 512x512+0+0 nora-512.png
magick convert nora-512.png -resize 256x256 nora-256.png
```

- **Safe margin:** before the crop, verify nothing important (ears, accent pin) is near the edge — Gemini sometimes frames tight. If so, use `-resize 612` before cropping 512 to give 10% padding.

### 6.2 Color correction

Gemini occasionally drifts warm backgrounds toward yellow. Nudge toward brand cream `#F7F3ED`:

```bash
# Very subtle hue adjustment to anchor background to brand cream
magick convert nora-256.png -modulate 100,95,100 nora-256-corrected.png
```

- If the accent color (e.g., Nora's indigo) drifts toward pure violet, pull the saturation down 5% first.
- For Elena: check that her emerald sweater doesn't drift to true pure `#16A661` — it should sit slightly muted around `#2A8F5D`.
- For Dante: the dusty-rose pin should stay muted — if it reads "hot pink," that's a regen trigger.

### 6.3 Background and artifact removal (only if needed)

If the generated background is too busy or off-palette, replace with the brand cream gradient:

```bash
# Option 1: rembg (Python)
pip install rembg
rembg i nora-256.png nora-256-transparent.png

# Then composite over a cream gradient in Photoshop/Figma
# OR use ImageMagick with a simple gradient backer:
magick convert -size 256x256 radial-gradient:"#F7F3ED"-"#EDE8DF" bg-cream.png
magick convert bg-cream.png nora-256-transparent.png -composite nora-256-final.png
```

**Decision rule:** Keep the original Gemini background if it's already warm-neutral. Only replace if it drifts into blue, green, or busy texture. 80% of the time, keep the original.

### 6.4 Emerald dot overlay (REQUIRED — the brand unifier)

Per `visual-system-FINAL.md` §1, every expert avatar carries a **tiny emerald dot in the bottom-right corner** as the Apice signature. Do NOT ask nano-banana to generate this — it will get the size and placement wrong. Overlay it in post:

```bash
# Generate dot SVG and overlay
cat > dot.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <circle cx="232" cy="232" r="14" fill="#F7F3ED"/>
  <circle cx="232" cy="232" r="10" fill="#16A661"/>
</svg>
EOF

magick convert nora-256-final.png dot.svg -composite nora-final.png
```

Or use the existing concept SVG as a reference for exact dot geometry and port the `<circle>` element over.

### 6.5 Naming convention

```
/brand/assets/experts/real/{name}-v{n}.png       # iteration candidates
/brand/assets/experts/real/{name}-final.png      # approved canonical
```

Example:
- `nora-v1.png`, `nora-v2.png`, `nora-v3.png`, `nora-v4.png` — 4 generations
- After CEO/Uma review: rename winner to `nora-final.png`

---

## 7. Quality acceptance checklist (10 questions per generation)

Before approving any generation, score it against these 10 yes/no questions. A generation must answer YES to at least 9 out of 10 to be "approved":

1. ✅ Is the expression calm and thoughtful — **not** a wide stock-photo smile?
2. ✅ Does the ethnicity / heritage match the documented persona (e.g., Maya reads South Asian, Omar reads North African/Middle Eastern)?
3. ✅ Does the age reading fall within the documented range (±5 years)?
4. ✅ Is the expert's signature accent color visible but **not** dominant (no more than 25% of the frame)?
5. ✅ Is the Apice emerald signature visible somewhere subtle (pin, stitch, earring, pendant) — present but not obvious?
6. ✅ Is the background a warm neutral gradient with **no** literal scene, office, trading floor, or text?
7. ✅ Does the lighting read as single warm key + soft fill + subtle rim (not flat, not harsh, not HDR)?
8. ✅ Is the wardrobe in natural fabrics (wool, linen, cotton, cashmere) with **no** suit-and-tie corporate stiffness?
9. ✅ Are there **no** visible logos, watermarks, text, crypto iconography, or stock financial imagery?
10. ✅ Does this portrait sit alongside the other 5 experts as a **consistent family** (same lighting register, same background atmosphere, same painterly treatment)?

**Sudden-death rejections (any one of these = regen, no debate):**
- ❌ Photorealistic to the point of uncanny-valley (pores too sharp, teeth too perfect, skin too smooth)
- ❌ Any visible text or logo
- ❌ Wide open-mouth smile with teeth showing
- ❌ Wrong age by more than a decade
- ❌ Wrong heritage interpretation
- ❌ Bright neon accent color (accent should always be muted)
- ❌ Laptop, phone, screen, chart, or financial prop visible

---

## 8. Cost & time estimate

### 8.1 Pricing (as of 2026-04-17)

Gemini 2.5 Flash Image pricing on the Gemini API:
- **$0.039 per image output** (tokenized, approx 1290 tokens per 1024×1024 image)
- **Text input** negligible for prompts of this size (< $0.001 per call)

### 8.2 Expected totals

| Stage | Count | Unit cost | Total |
|---|---|---|---|
| First pass: 4 variants × 6 experts | 24 | $0.039 | $0.94 |
| Refinement pass: 2 × 6 experts | 12 | $0.039 | $0.47 |
| Third pass buffer: 1 × 6 | 6 | $0.039 | $0.23 |
| **Total generation cost** | **42 images** | — | **~$1.64** |
| API exploration / misfires buffer (2×) | — | — | ~$3.30 |
| **Grand total (conservative ceiling)** | — | — | **< $5 USD** |

### 8.3 Time estimate

| Stage | Time |
|---|---|
| Python runner script execution (24 first-pass images) | ~3 min (API call latency, batched) |
| Manual review of first pass (pick winners) | ~15 min |
| Refinement pass + manual review | ~20 min |
| Post-processing (crop, resize, dot overlay, all 6) | ~15 min |
| CEO / Uma review + approval | depends on availability |
| **Total hands-on time** | **~60 minutes** |

---

## 9. Failure modes & mitigations

| Failure | Likely cause | Mitigation |
|---|---|---|
| All 4 Nora variants smiling | "warm" keyword over-triggered | Add: "lips closed, no teeth visible, interior stillness" |
| Accent color bleeding into skin/hair | Gemini treating accent as lighting color | Add: "accent color appears ONLY in the specified wardrobe element" |
| Background showing a trading floor | Archetype keyword pulled context | Strengthen NEGATIVE — add explicit "NO office, NO workspace" |
| Expert looks too young / too old | Gemini's internal age prior drifting | Add specific age: "She is 42 years old" directly |
| Uncanny valley in photorealism | "photorealistic" triggered too literal | Confirm "semi-photorealistic, painterly" at start |
| Multiple people in frame | "Portrait" ambiguity | Add: "SINGLE SUBJECT, one person only, no background figures" |
| Wrong ethnicity | Gemini's ambiguous prior | Strengthen ethnicity language to be more specific in the expert block |
| Glasses appearing when not requested | Gemini intellectualizing the archetype | Only Nora and Maya have glasses — explicitly negative for others: "NO glasses" |
| Apice emerald accent missing entirely | Too subtle in prompt | Bump from "tiny" to "small but visible" |

---

## 10. Handoff protocol

Once generations are complete:

1. **Media-engineer** (me): Run batch, pick 2–3 finalists per expert, push to review folder `/brand/assets/experts/real/review/`
2. **Uma (@ux-design-expert)**: Visual QA — 10-point checklist per candidate. Approves or returns with notes.
3. **CEO**: Final approval of the 6 canonical portraits.
4. **Dev**: Update `<ExpertAvatar />` component to support both SVG (concept/fallback) and PNG (final real).

See §11 of the paired file `apice-ai-identity.md` for the component API proposal.

---

## 11. Versioning

- **v1 FINAL (2026-04-17):** 6 prompts + master style + runner script + post-processing recipe + checklist. Ship.
- **v1.1 (roadmap):** alt-pose variants for hero marketing (3/4 body, seated), seasonal wardrobe palettes, dark-mode backgrounds.
- **v2 (roadmap):** retraining the prompts against feedback from production usage — what works at 40px avatar scale is different from what works at 1024px hero scale.

---

*@media-engineer · 2026-04-17 · v1 FINAL*
