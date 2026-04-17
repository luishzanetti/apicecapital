# Apice Capital — Asset Production Handoff Guide

> **For:** @media-engineer + future content team
> **Owner:** @media-head
> **Status:** v1 FINAL — 2026-04-17
> **Asset source:** `/Users/luiszanetti/Documents/Atmosphere/Apps/ApiceCapital/brand/assets/marketing/`

---

## 1. Template anatomy — how to swap copy without breaking layout

Every marketing SVG in this pack follows the same internal DNA:

```
┌──────────────────────────────────────────────┐
│  [lockup]  Apice.                            │  ← wordmark + dot (never alter)
│  ─────────────────────────────────────────── │  ← top rule (0.12 opacity)
│  EYEBROW (kicker in emerald, all-caps)       │  ← context/category
│                                              │
│  Headline Line 1                             │  ← 2–3 lines max
│  Headline Line 2                             │
│                                              │
│  Supporting tag (12–18 words max)            │  ← never more than 2 lines
│                                              │
│  ─────────────────────────────────────────── │  ← bottom rule
│  APICE.CAPITAL              META / CATEGORY  │  ← footer
└──────────────────────────────────────────────┘
```

### Editable CSS classes (present in every template)

| Class | Purpose | Safe to edit |
|---|---|---|
| `.bg` | Background fill | Only cream `#F7F3ED` ↔ dark `#0E0E12` swap |
| `.wm` | Wordmark "Apice" | **Never** — text is fixed |
| `.dot` | Emerald signature dot | **Never** — position calculated off wordmark |
| `.headline` / `.hook` / `.quote` | Main message | Yes — text content |
| `.tag` | Supporting line | Yes |
| `.eyebrow` | Kicker above headline | Yes — keep all-caps, short |
| `.cta` / `.cta-bg` | Button label + fill | Yes — text only |
| `.rule` | Divider lines | **Never** alter opacity |

### Copy-swap protocol

1. **Open SVG in text editor** (VS Code / Antigravity). Do NOT re-save via vector tool — most tools re-encode whitespace and break diffing.
2. **Find the `<text>` tag with `class="headline"` (or `hook`, `quote`)**. Edit only the inner text.
3. **Preserve line structure** — if original has 2 lines, keep 2. Break at natural comma/period.
4. **Recount characters** before committing:
   - Headlines: ≤ 18 chars per line (feed/OG); ≤ 12 chars per line (story/vertical).
   - Tags: ≤ 42 chars per line.
   - Eyebrows: ≤ 26 chars total.
5. **Verify in browser** — open the SVG directly; check that text doesn't overflow the viewBox.
6. **Commit** — the `<!-- Apice · … -->` comment header stays intact; only update the version suffix if the change is structural (e.g., `v1 FINAL` → `v1.1 FINAL`).

### Never edit
- The wordmark text `Apice`
- The emerald dot (`<circle class="dot">`) — its X position is calibrated to the final `e` in the wordmark at that specific font-size
- The `viewBox` dimensions — they match platform specs (1200×630, 1080×1080, etc.)
- Any `class="rule"` line — they are the structural backbone

---

## 2. Font substitution rules

**Primary:** Geist (variable, weights 400–700)
**Fallback chain (already in all templates):** `'Geist', 'Inter', system-ui, -apple-system, sans-serif`

### If Geist unavailable on destination
- **Web:** serve Geist via `@font-face` from `/fonts/geist/` (CEO to commit WOFF2 to repo). Include `font-display: swap`.
- **Figma / Sketch:** import Geist from vercel.com/font. If restricted, **Inter 700** is the approved substitute — it preserves tracking and x-height within 3% variance.
- **Email (MSO/Outlook):** Geist won't render. Email templates MUST use `font-family: 'Helvetica Neue', Arial, sans-serif` + a fallback cascade. SVG emails rasterize to PNG before send (see § batch export).
- **Print / external PDF:** embed subset. Use `fonttools pyftsubset` to strip to Latin-1 + digits + punctuation.

### Never substitute with
- Roboto (feels Material, not editorial)
- SF Pro (Apple-owned licensing constraints for ads)
- Any serif (breaks the modern-fintech register)
- Any geometric display font (DIN, Futura) — wrong voice

---

## 3. Color replacement protocol (seasonal variants)

The brand system is locked to three colors. Seasonal variants may introduce **one** temporary fourth accent for a defined window (max 4 weeks). Rules:

| Moment | Base | Signature | Secondary accent | Window |
|---|---|---|---|---|
| **Default (year-round)** | `#0E0E12` + `#F7F3ED` | `#16A661` emerald | — | always |
| Launch week | same | same | none | — |
| Q4 / end-of-year review | same | same | `#C9A96E` (soft gold) for "Capital Game results" only | Dec 20 – Jan 10 |
| Elite Challenge reveal | same | same | `#B8860B` (deeper gold) for the single Challenge 10 badge graphic | 2 weeks |

### Global find-and-replace
```bash
# Swap emerald to seasonal gold in a single file
sed -i '' 's/#16A661/#C9A96E/g' asset-name.svg
```

### Never replace
- The cream `#F7F3ED` or dark `#0E0E12` — they are the identity foundation.
- The emerald on the wordmark dot — the dot is the permanent signature.

---

## 4. Batch export pipeline (SVG → PNG → platform variants)

### Recommended toolchain
- **Primary:** [`resvg`](https://github.com/RazrFalcon/resvg) CLI — fastest, pixel-perfect, no Chromium dependency.
- **Alternative:** Chrome `--headless --screenshot` if resvg not available.
- **Image optimization:** `pngquant` + `oxipng` post-render.

### Directory layout (output)
```
brand/assets/marketing/exports/
├── og/                    # 1200×630 PNG
├── instagram/
│   ├── square/            # 1080×1080
│   └── story/             # 1080×1920
├── meta-ads/
│   ├── feed-16x9/         # 1200×675
│   ├── square/            # 1080×1080
│   └── story/             # 1080×1920
├── tiktok/                # 1080×1920
├── twitter/               # 1200×675
├── linkedin/              # 1200×628
├── email/
│   ├── header/            # 600×200 (2x retina → 1200×400)
│   └── footer/            # 600×80 (2x → 1200×160)
└── web/
    ├── hero-homepage/     # 1440×600 + 2880×1200 retina
    └── hero-club/         # 1440×600 + 2880×1200 retina
```

### One-liner batch export (bash)
```bash
#!/usr/bin/env bash
# scripts/export-marketing-assets.sh
SRC="brand/assets/marketing"
OUT="brand/assets/marketing/exports"

# Standard @1x
for svg in "$SRC"/*.svg; do
  name=$(basename "$svg" .svg)
  resvg --zoom 2 "$svg" "$OUT/${name}@2x.png"
  resvg "$svg" "$OUT/${name}.png"
done

# Optimize
find "$OUT" -name "*.png" -exec pngquant --quality=80-95 --ext .png --force {} \;
find "$OUT" -name "*.png" -exec oxipng -o 3 {} \;
```

### Platform-specific resize rules
- **Meta ads:** upload at 1200×675 (16:9) or 1080×1080 — never resize, always export at spec
- **TikTok / IG Story:** 1080×1920, but keep "safe zone" text within central 80% (avoid top 200px and bottom 250px due to UI overlay)
- **Email:** export SVG → PNG at 2x retina, then halve with CSS — improves retina crispness without bloating mobile bandwidth
- **OG images:** 1200×630 min, but generate 1800×945 for high-DPI Twitter/LinkedIn previews

---

## 5. Accessibility checklist

Every asset MUST pass before shipping.

### Contrast
- [ ] Text on cream (`#F7F3ED`) background has ≥ 4.5:1 contrast (body) or ≥ 3:1 (large text ≥ 24px/700). Dark text `#0E0E12` on cream passes 17.1:1 — always safe.
- [ ] Text on dark (`#0E0E12`) background: cream text passes 17.1:1 — always safe. Emerald `#16A661` on dark passes 4.7:1 for large-text only, **never** for body copy < 18px.
- [ ] Emerald on cream passes 3.8:1 — marginal, only for ≥ 24px bold headlines or non-informational accents (dot, rules).

### Alt text / aria-label
- [ ] Every SVG has `role="img"` + `aria-label="{campaign message}"`.
- [ ] Alt text mirrors the primary headline, not a visual description.
  - ✅ "Apice — Build Wealth. One Week at a Time."
  - ❌ "Dark background with green text and a logo"

### Motion / auto-play
- [ ] No auto-play motion in static templates (these are frames, not videos).
- [ ] If exported as MP4, respect `prefers-reduced-motion` — serve static poster fallback.

### Screen reader flow
- [ ] For social posts, provide the full copy in the post body, not just in the image — screen readers skip image-only text.
- [ ] Ad caption fields (Meta, TikTok) MUST duplicate any headline that appears only visually.

---

## 6. Figma library structure (recommended)

```
📚 Apice Brand — Marketing v1
├── 📄 00 — Foundations
│   ├── Color tokens (Dark / Cream / Emerald)
│   ├── Type scale (Geist 14/16/18/22/24/28/44/54/56/64/72/80/88/96/104/132/148/220/240/420)
│   ├── Spacing (8pt grid, 72px outer margin standard)
│   └── Rule styles (0.10 / 0.12 / 0.14 opacity)
├── 📄 01 — Components
│   ├── Wordmark lockup (3 sizes: 44 / 60 / 148)
│   ├── Eyebrow (kicker)
│   ├── Headline (2-line, 3-line)
│   ├── Tag / supporting
│   ├── CTA button (primary dark, primary emerald)
│   ├── Rule (horizontal divider)
│   ├── Stat block (big number + label)
│   └── Price block
├── 📄 02 — Social templates
│   ├── OG default / homepage / academy / club
│   ├── Instagram post 1/2/3
│   ├── Instagram story
│   ├── Twitter card
│   └── LinkedIn post
├── 📄 03 — Ad templates
│   ├── Meta feed 16:9
│   ├── Meta square
│   ├── Meta story
│   └── TikTok cover
├── 📄 04 — Email templates
│   ├── Header hero
│   └── Footer
└── 📄 05 — Web heroes
    ├── Homepage desktop
    └── Club page
```

### Figma variant system
Each template uses the same **Master Component** with variants:
- **Theme:** Light (cream bg) / Dark (dark bg)
- **Use case:** {archetype A / B / C}
- **State:** Default / Launch / Seasonal

This lets @media-engineer produce a new campaign variant by changing two variant toggles, not by redesigning.

---

## 7. Version control

- **All SVGs live in git.** Never store them in Figma-only.
- **Export artifacts go in `.gitignore`** (`brand/assets/marketing/exports/**`). Regenerate on deploy.
- **Commit convention:** `chore(marketing): refresh {asset-name} for {campaign-id}` (scope = `marketing`).
- **File naming:** `{category}-{use-case}.svg` lowercase + kebab-case. Variants append `-{variant}` (e.g., `meta-ad-square-archetype-a.svg`).

---

## 8. Handoff checklist (media-engineer → production)

Before declaring an asset "production-ready":

- [ ] SVG passes `xmllint --noout {file}` (valid XML)
- [ ] Comment header matches format `<!-- Apice · {name} · v1 FINAL · media-head YYYY-MM-DD -->`
- [ ] `role="img"` + `aria-label` present on root `<svg>`
- [ ] `viewBox` matches target platform spec
- [ ] File size within limits (social < 10KB, ads < 15KB, hero < 20KB)
- [ ] Font-family includes full fallback chain
- [ ] Renders correctly in Chrome, Safari, Firefox (test each)
- [ ] PNG exports (@1x + @2x) committed to `exports/` for preview
- [ ] Alt text matches the intended campaign message
- [ ] Contrast checked against WCAG 2.2 AA (see § 5)
- [ ] No hardcoded user data, no test copy, no lorem ipsum

---

## 9. Escalation

If you encounter any of these, stop and escalate to @media-head:
- Need to introduce a new color outside the locked system
- Need to modify the wordmark or dot lockup
- Need to use a new font
- A platform requires a format not in this pack (e.g., Snapchat, Pinterest) — requires brief before design

**@media-head responds within 24h. @aios-master is fallback if @media-head unavailable.**

---

*This guide is the single source of truth for marketing asset production. Superseded only by a newer document committed to this directory with an increased version number.*
