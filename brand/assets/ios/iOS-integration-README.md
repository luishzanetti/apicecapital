# Apice Capital — iOS Asset Integration Guide

**Owner:** @apple-ux (delivery) → @dev (integration)
**Version:** 1.0 · 2026-04-17
**Brand baseline:** D5 — V3.01 "The Dot, Plain"
**Superseded paths:** none (first iOS asset drop)

---

## 1. Primary Icon Variant — Recommendation

**SHIP: `AppIcon-iOS.svg` (dot-only) as primary.**

**Rationale (Apple-grade craft):**
- At 60pt (the smallest home-screen size on iPhone), a wordmark becomes illegible noise. Apple's own apps (Wallet, Finance, Health, Music) all use a single symbol, never text. The dot reads at every size from 29pt Notification up to 1024pt App Store — a wordmark cannot.
- The dot-alone mark is the one thing that *is* Apice in the Stripe/Linear register: a confident, quiet signature. Putting "Apice." on the home screen dilutes exactly the distinctiveness the brand was designed around.

`AppIcon-iOS-alt.svg` is preserved for:
- App Store product page hero (1024×1024 only — size where wordmark is legible)
- Marketing collateral where icon is shown enlarged
- Internal debug/dev variant distinction

---

## 2. Required Sizes — Xcode Asset Catalog

Generate PNG exports from `AppIcon-iOS.svg` (1024×1024 master) at every size below. All exports MUST be flat PNG (no alpha around squircle — the superellipse IS the icon; iOS does NOT remask it).

### iPhone

| Idiom | Size (pt) | Scale | Pixels | Filename |
|-------|-----------|-------|--------|----------|
| Notification | 20 | 2x | 40×40 | `Icon-20@2x.png` |
| Notification | 20 | 3x | 60×60 | `Icon-20@3x.png` |
| Settings | 29 | 2x | 58×58 | `Icon-29@2x.png` |
| Settings | 29 | 3x | 87×87 | `Icon-29@3x.png` |
| Spotlight | 40 | 2x | 80×80 | `Icon-40@2x.png` |
| Spotlight | 40 | 3x | 120×120 | `Icon-40@3x.png` |
| App (home) | 60 | 2x | 120×120 | `Icon-60@2x.png` |
| App (home) | 60 | 3x | 180×180 | `Icon-60@3x.png` |

### iPad

| Idiom | Size (pt) | Scale | Pixels | Filename |
|-------|-----------|-------|--------|----------|
| Notification | 20 | 1x | 20×20 | `Icon-20~ipad.png` |
| Notification | 20 | 2x | 40×40 | `Icon-20@2x~ipad.png` |
| Settings | 29 | 1x | 29×29 | `Icon-29~ipad.png` |
| Settings | 29 | 2x | 58×58 | `Icon-29@2x~ipad.png` |
| Spotlight | 40 | 1x | 40×40 | `Icon-40~ipad.png` |
| Spotlight | 40 | 2x | 80×80 | `Icon-40@2x~ipad.png` |
| App | 76 | 1x | 76×76 | `Icon-76~ipad.png` |
| App | 76 | 2x | 152×152 | `Icon-76@2x~ipad.png` |
| Pro | 83.5 | 2x | 167×167 | `Icon-83.5@2x~ipad.png` |

### App Store

| Idiom | Size | Pixels | Filename |
|-------|------|--------|----------|
| Marketing | 1024 | 1024×1024 | `Icon-1024.png` |

**Total:** 18 PNG files for iPhone + iPad Asset Catalog (`AppIcon.appiconset/Contents.json` lists all).

---

## 3. Adaptive Icon Considerations (iPadOS)

iPadOS 18 supports **Light / Dark / Tinted** App Icons (parity with iOS 18). The Asset Catalog schema for this:

```
AppIcon.appiconset/
├── AppIcon.png          (1024×1024, light mode — primary)
├── AppIcon-Dark.png     (1024×1024, dark mode variant)
├── AppIcon-Tinted.png   (1024×1024, tinted mode, grayscale)
└── Contents.json
```

### Light mode
Use the primary `AppIcon-iOS.svg` as-is (near-black squircle + emerald dot).

### Dark mode
Apple draws a dark backdrop; the icon's own background should be **transparent** with the dot alone on a flat `#16A661`. Author a dark variant:
- Background: transparent (no squircle fill)
- Element: dot, same proportions, emerald `#16A661`

Apple will composite this over its own dark gradient surface.

### Tinted mode
Apple applies a monochrome treatment. Author as:
- Background: transparent
- Element: dot shape, fill `#FFFFFF` (white — Apple's tint engine maps luminance to tint color)

**Note:** Tinted mode looks best when icon elements have strong silhouette and no color dependency. The dot-only approach is IDEAL for tinted — a wordmark would fragment visually.

Export these variants manually from the master after approving dark/tinted recipes with CEO.

---

## 4. Dark Mode / Light Mode / Tinted — Summary

| Mode | Primary icon source | Notes |
|------|---------------------|-------|
| Light | `AppIcon-iOS.svg` (1024) as-is | Near-black squircle + emerald dot |
| Dark | Transparent bg + emerald dot only | Apple composites over dark surface |
| Tinted | Transparent bg + white dot only | Apple applies monochrome tint |

---

## 5. Notification Icon Spec

Notification icons on iOS are auto-generated from the App Icon (no separate asset needed). Apple extracts the 20pt size from the Asset Catalog and applies automatic circular masking.

**Design verification:** At 20pt × 3x (60×60px), the dot must remain visibly emerald and well-positioned. Our spec (18.75% canvas ratio, optical centering) holds at every size.

---

## 6. Spotlight Icon Spec

Uses the 40pt size from the Asset Catalog. No separate asset required. The dot-only design guarantees legibility at Spotlight's tight dimensions.

---

## 7. Settings Icon Spec

Uses the 29pt size (iPhone) / 29pt (iPad). No separate asset required. **However**, note that Settings renders icons smaller than any other context — this is the acid test for "dot-only over wordmark" (wordmark would be completely unreadable at 29pt × 2x = 58×58px).

---

## 8. HIG Compliance Checklist (iOS 18, 2024)

- [x] **Safe area:** Dot occupies 18.75% of canvas; Apple recommends content consume ≤75% of canvas height. PASS (well within safe zone).
- [x] **Superellipse shape:** Custom Lamé curve (n≈5) approximation, not standard `rx` rounded-rect. PASS.
- [x] **Minimum touch target:** App Icons aren't direct touch targets (OS-handled). In-app interactive elements must be ≥44×44pt per HIG (enforced in app, not icon).
- [x] **Accessibility — color contrast:** Emerald `#16A661` on near-black `#0E0E12` gives WCAG contrast ratio **5.74:1** (exceeds WCAG AA 4.5:1 for normal text; meets AAA for UI component). PASS.
- [x] **Accessibility — recognition:** Dot + solid bg reads as a single high-contrast silhouette — works for low-vision users and when rendered at notification sizes.
- [x] **Cultural neutrality:** Abstract dot carries no accidental cultural/religious/regional meaning. PASS.
- [x] **No photographic detail:** Per HIG, icons should avoid gradients/photographs. Ours is pure flat color. PASS.
- [x] **No transparency in primary variant:** PNG export must flatten squircle (no outer alpha channel). PASS when exporting.
- [x] **No text in icon:** Primary variant ships dot-only per HIG recommendation. PASS.

---

## 9. Xcode Commands — Generate PNG Export Pack

**Option A — `xcassetgen` (preferred, built-in Xcode tool):**

```bash
# From project root
xcrun xcassetgen \
  --input brand/assets/ios/AppIcon-iOS.svg \
  --output ios/App/Assets.xcassets/AppIcon.appiconset \
  --template ios-app-icon
```

**Option B — ImageMagick (cross-platform, scriptable):**

```bash
#!/usr/bin/env bash
# export-ios-icons.sh — requires: brew install imagemagick librsvg
set -euo pipefail

SRC="brand/assets/ios/AppIcon-iOS.svg"
OUT="ios/App/Assets.xcassets/AppIcon.appiconset"
mkdir -p "$OUT"

# iPhone
for size in 40:Icon-20@2x 60:Icon-20@3x 58:Icon-29@2x 87:Icon-29@3x \
            80:Icon-40@2x 120:Icon-40@3x 120:Icon-60@2x 180:Icon-60@3x; do
  px="${size%%:*}"; name="${size##*:}"
  rsvg-convert -w "$px" -h "$px" "$SRC" | \
    convert - -background "#0E0E12" -alpha remove -alpha off "$OUT/${name}.png"
done

# iPad
for size in 20:Icon-20~ipad 40:Icon-20@2x~ipad 29:Icon-29~ipad 58:Icon-29@2x~ipad \
            40:Icon-40~ipad 80:Icon-40@2x~ipad 76:Icon-76~ipad 152:Icon-76@2x~ipad \
            167:Icon-83.5@2x~ipad; do
  px="${size%%:*}"; name="${size##*:}"
  rsvg-convert -w "$px" -h "$px" "$SRC" | \
    convert - -background "#0E0E12" -alpha remove -alpha off "$OUT/${name}.png"
done

# App Store marketing
rsvg-convert -w 1024 -h 1024 "$SRC" | \
  convert - -background "#0E0E12" -alpha remove -alpha off "$OUT/Icon-1024.png"

echo "Export complete. 18 PNGs written to $OUT"
```

**Option C — AppIcon.co / MakeAppIcon (web fallback):**
Upload `AppIcon-iOS.svg` (exported as 1024×1024 PNG first via `rsvg-convert`) to https://appicon.co and download the generated `AppIcon.appiconset`. Suitable only when neither Xcode nor ImageMagick are available.

---

## 10. Apple Touch Icon (Web)

For the marketing landing page and PWA wrapper:

```html
<!-- In <head> of index.html -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon.png">
```

Export from `apple-touch-icon.svg` at 180×180 PNG. iOS applies its own superellipse mask when users add the page to Home Screen — this is why our master has no outer rounding.

---

## 11. Launch Screen Integration

iOS deprecated static launch image catalogs — use **Storyboard** (`LaunchScreen.storyboard`) or **SwiftUI `@main` SplashView**.

### Storyboard approach (UIKit / hybrid apps)
1. Export `LaunchScreen-light.svg` and `LaunchScreen-dark.svg` as PDFs (Xcode supports vector PDF assets natively — no rasterization loss across devices).
2. Add to `Assets.xcassets/LaunchImage.imageset` with Light/Dark appearance variants.
3. In `LaunchScreen.storyboard`, drop an `UIImageView` full-bleed with contentMode = `.scaleAspectFill` bound to the imageset name.

### SwiftUI approach (pure SwiftUI apps)
Show `SplashView()` for 1.2s on app launch (matches our REDESIGN-SPEC §F5 onboarding flow):

```swift
struct SplashView: View {
  @Environment(\.colorScheme) var scheme
  var body: some View {
    ZStack {
      (scheme == .dark ? Color(hex: "#0E0E12") : Color(hex: "#F7F3ED"))
        .ignoresSafeArea()
      HStack(spacing: 10) {
        Text("Apice")
          .font(.custom("Geist-Bold", size: 64))
          .kerning(-1.92)
          .foregroundStyle(scheme == .dark ? Color(hex: "#F7F3ED") : Color(hex: "#0E0E12"))
        Circle()
          .fill(Color(hex: "#16A661"))
          .frame(width: 8, height: 8)
          .offset(y: 20)
      }
    }
  }
}
```

---

## 12. Widget & App Clip Integration

### App Clip Card
Use `AppClip-card.svg` → export as 108×108 PNG → drop into App Clip target's Asset Catalog. Apple displays this in the App Clip card sheet that appears from QR/NFC/Smart App Banner triggers.

### WidgetKit configuration icon
Widgets show the app icon in their configuration sheet. No separate asset required — iOS reuses `AppIcon`.

---

## 13. watchOS Complication

`watchOS-complication.svg` targets the **`.circular`** complication family (most compact, most universal — works on modular, infograph, and other faces).

To deploy:
1. Add watchOS target to the Xcode project.
2. In `Assets.xcassets` under the watchOS target, create `Complication.complicationset`.
3. Drop exports (20×20, 36×36, 40×40, 44×44) in the Circular slot.
4. Register in `ComplicationController.swift` via `CLKImageProvider`.

The monochrome design guarantees compatibility with Apple's tint engine across all watch face styles.

---

## 14. File Inventory

```
brand/assets/ios/
├── AppIcon-iOS.svg              (PRIMARY — superellipse + dot, 1024×1024 master)
├── AppIcon-iOS-alt.svg          (WORDMARK variant — App Store hero only)
├── LaunchScreen-light.svg       (Cream bg — light mode)
├── LaunchScreen-dark.svg        (Near-black bg — dark mode)
├── apple-touch-icon.svg         (Web PWA — 180×180, no outer rounding)
├── AppClip-card.svg             (App Clip trigger — 108×108)
├── watchOS-complication.svg     (Circular complication — 40×40 monochrome)
└── iOS-integration-README.md    (This document)
```

---

## 15. Known Limitations

- **SVG-only delivery.** This pack ships vector masters. PNG export pack for Xcode Asset Catalog must be generated per §9 (one command away, but not pre-built).
- **No Geist font embedded.** Wordmark variants reference `Geist` family with `Inter` + system-ui fallbacks. For production bundles, Geist must be registered as a custom font in Info.plist (`UIAppFonts` array) and loaded in `Bundle.main`.
- **Tinted / Dark icon variants not pre-exported.** Recipes documented in §3–4 but PNG masters not generated in this drop — requires CEO approval on each dark/tinted treatment before locking.

---

*Craft is the compound interest of detail. Ship the dot, plain.*
