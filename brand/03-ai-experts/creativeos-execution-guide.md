# Apice Experts · Creative OS Execution Guide

> **Author:** Jarvis (Chief of Staff AI)
> **Date:** 2026-04-17
> **Replaces:** `nano-banana-runner.py` (now an alternative, not the primary path)
> **Primary execution tool:** **CreativeOS** (CEO's platform) — already integrates Google Gemini 3 Pro Image + Veo 2.

---

## 0. What's in place

The 6 experts are now ready to generate **via CreativeOS** — the CEO's intelligent media creation platform at `/Users/luiszanetti/Documents/Atmosphere/creativeos/`.

**Why CreativeOS over a standalone script:**
- ✅ Already integrates `@google/genai` SDK (Gemini 3 Pro Image, codename "nano-banana" lineage)
- ✅ Built-in retry with exponential backoff
- ✅ API budget tracker records cost per generation
- ✅ Quality checks (file size, completion validation)
- ✅ Batch execution with delay throttling
- ✅ Auto-opens output folder
- ✅ Unified with product/avatar/video pipelines — same env, same key, same conventions

**Config produced:**
`creativeos/engines/image/configs/apice/apice-experts.yaml`

Contains the 6 expert prompts as `ads.concepts` (CreativeOS's pattern for fully-custom prompts). Each prompt is self-contained: master style constraint + expert-specific subject + wardrobe + accents + negative prompts.

---

## 1. One-command execution

### Prerequisites

```bash
# One-time: install creativeos dependencies (if not already)
cd /Users/luiszanetti/Documents/Atmosphere/creativeos
npm install

# Set the Gemini API key (get one at https://aistudio.google.com/apikey)
export GOOGLE_GENAI_API_KEY="your_api_key_here"
```

### Run (all 6 experts)

```bash
cd /Users/luiszanetti/Documents/Atmosphere/creativeos

node engines/image/scripts/generate-assets.mjs \
  --config engines/image/configs/apice/apice-experts.yaml \
  --only ads \
  --delay 4000
```

What happens:
- Loops over the 6 expert concepts
- Calls Gemini 3 Pro Image once per expert
- Saves each output to `brand/assets/experts/real/criativos/AD-{NN}-{slug}.png`
- 4-second delay between calls to respect rate limits
- Prints budget summary at the end
- Opens the output folder automatically

**Expected output:**
```
brand/assets/experts/real/criativos/
├── AD-01-nora-thesis-builder.png
├── AD-02-kai-pattern-reader.png
├── AD-03-elena-patient-compounder.png
├── AD-04-dante-risk-architect.png
├── AD-05-maya-deep-researcher.png
└── AD-06-omar-mentor.png
```

**Total cost:** ~$0.24 USD for 6 generations (Gemini 3 Pro Image @ ~$0.04/image, varies by region).
**Total time:** ~2 minutes (6 × ~15s generation + 5 × 4s delay).

---

## 2. Dry run first (recommended)

Always do a dry run before the real call to validate prompts visually:

```bash
cd /Users/luiszanetti/Documents/Atmosphere/creativeos

node engines/image/scripts/generate-assets.mjs \
  --config engines/image/configs/apice/apice-experts.yaml \
  --only ads \
  --dry-run
```

Output: prints the full prompt for each of the 6 experts without calling the API. Review. If any prompt reads wrong, edit the YAML and re-dry-run.

---

## 3. Generate individual experts

If you want to iterate on one expert only (e.g., Nora came out wrong and you want to try a variation), edit `apice-experts.yaml` to keep only that one in the `concepts` list, then run the same command. Alternatively, split into 6 individual YAML files (one per expert) — the config loader supports this.

---

## 4. Generate multiple variants per expert (for picking the best)

Gemini varies between runs on identical prompts. To get 4 variants per expert (24 generations total), run the full config 4 times in sequence:

```bash
for i in 1 2 3 4; do
  echo "▶ Round $i/4"
  node engines/image/scripts/generate-assets.mjs \
    --config engines/image/configs/apice/apice-experts.yaml \
    --only ads \
    --delay 5000
  # move outputs to variants/round-$i/
  mv /Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/brand/assets/experts/real/criativos \
     /Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/brand/assets/experts/real/round-$i
done
```

**Expected cost:** ~$1.00 USD for 24 generations.
**Expected time:** ~10 minutes.

---

## 5. After generation — QA checklist

For EACH generated portrait, check:

1. [ ] **Identity match** — does the person match the demographic description (age, heritage, gender presentation)?
2. [ ] **Expression** — composed, thoughtful, NOT stock-photo smiling wide?
3. [ ] **Wardrobe correct** — the exact color/material described (not generic "sweater")?
4. [ ] **Accent color present** — signature color appears subtly, not dominant?
5. [ ] **Background clean** — warm gradient, NO literal scenes (offices, charts, monitors)?
6. [ ] **Eyes sharp** — focus on eyes, DoF fall-off behind?
7. [ ] **No crypto clichés** — no coins, no laser eyes, no neon, no trading floors?
8. [ ] **Lighting editorial** — warm key from left, soft fill, cinematic?
9. [ ] **Style editorial** — painterly weight, NOT photoreal-smooth or anime?
10. [ ] **Apice emerald signature** — the tiny brand-emerald accent is present?

If 8/10 or better → approved for brand use.
If 6/10 or below → regenerate with refinement prompt.

---

## 6. Post-processing — attach the signature dot

The final step (per `visual-system-FINAL.md` spec):

**Each expert avatar must display a tiny bright-emerald signature dot in the bottom-right** — the "active/listening" indicator unifying all experts with the brand wordmark's dot.

### Option A — Manual (Photoshop, Figma, or similar)
1. Open the approved PNG in Figma
2. Add a circle, 12px diameter (at 256×256 canvas — scale proportionally)
3. Fill `#16A661`
4. Position: bottom-right, 16px inset from each edge
5. Add subtle white stroke (1px, 50% opacity) for visibility on any skin tone
6. Export as PNG

### Option B — Automated (SVG overlay)
Create `dot-overlay.svg`:

```svg
<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <circle cx="234" cy="234" r="12" fill="#16A661" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.5"/>
</svg>
```

Then composite with ImageMagick:
```bash
magick composite -gravity southeast -geometry +0+0 dot-overlay.svg nora-raw.png nora-final.png
```

Or let @dev overlay the dot via `<ExpertAvatar>` React component at render time (cleaner, keeps the raw PNGs clean).

---

## 7. Naming convention for final assets

Once approved + dot-overlaid:

```
brand/assets/experts/real/
├── nora-final.png      # 512×512 production
├── kai-final.png
├── elena-final.png
├── dante-final.png
├── maya-final.png
├── omar-final.png
└── raw/                # original Gemini outputs, archived
    ├── AD-01-nora-thesis-builder-{timestamp}.png
    ├── AD-02-kai-pattern-reader-{timestamp}.png
    └── ...
```

---

## 8. Dev integration after generation

`<ExpertAvatar>` component already supports `variant: 'svg' | 'png'`:

```tsx
<ExpertAvatar expert="nora" variant="png" size={128} />
```

- `variant="png"` → loads `{name}-final.png` from `brand/assets/experts/real/`
- `variant="svg"` (default when PNG missing) → falls back to existing concept SVG
- No breaking change to the component API.

---

## 9. Alternative execution paths

If CreativeOS is down or preferred to iterate outside the platform:

### Fallback A — Google AI Studio UI
Open https://aistudio.google.com → select Gemini 2.5 Flash Image → paste one prompt from the YAML at a time. See `nano-banana-prompt-package.md` §5.1.

### Fallback B — Python SDK
Use the existing `nano-banana-runner.py` script. See `nano-banana-prompt-package.md` §5.2.

### Fallback C — curl
See `nano-banana-prompt-package.md` §5.3.

---

## 10. Pre-flight checklist

Before running the real generation:

- [ ] `GOOGLE_GENAI_API_KEY` is set in the shell
- [ ] `creativeos/` `npm install` completed successfully
- [ ] Output folder exists: `/Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/brand/assets/experts/real/`
- [ ] Dry-run passed — all 6 prompts print correctly
- [ ] Internet connection stable (6 × ~15s API calls)
- [ ] ~$0.25 USD available in Gemini API budget

---

## 11. Troubleshooting

| Issue | Resolution |
|---|---|
| `ERROR: Set GOOGLE_GENAI_API_KEY` | Export the env var; get key at https://aistudio.google.com/apikey |
| `file too small (4KB)` quality issue | Gemini returned text-only; re-run with longer delay and fresh prompt |
| Prompt truncated in output | Gemini has prompt length limits ~8K chars; if expert prompt exceeds, split into prefix+suffix |
| Accent color dominates | Reduce the accent description in wardrobe — change "deep indigo" to "subtle indigo trim" |
| Expert looks like stock photo | Strengthen NEGATIVE prompt — add "no stock photography, no corporate headshot, no LinkedIn profile look" |
| Different ethnicity rendered | Gemini sometimes drifts — reinforce with "specifically South Asian" and rerun |

---

## 12. What happens next

**Jarvis coordinates:**

1. CEO (or @media-engineer) runs `node engines/image/scripts/generate-assets.mjs --config engines/image/configs/apice/apice-experts.yaml --only ads` → 6 PNGs in `experts/real/`.
2. QA the 6 — if one needs rework, edit the prompt and regenerate that one.
3. @ux-design-expert (Uma) final approval pass.
4. @media-engineer attaches the signature dot (SVG overlay or Photoshop).
5. Renames to `{name}-final.png` and places in production folder.
6. @dev integrates via `<ExpertAvatar variant="png">`.
7. Legacy concept SVGs kept as dev-only fallback (not deployed to prod).

---

*Jarvis · Chief of Staff AI · CreativeOS is the platform, nano-banana package is the fallback. Ship the real portraits.*
