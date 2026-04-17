# Apice — Brand Asset Integration Guide

> **Audience:** @dev (Dex) and frontend contributors
> **Source of truth:** `Apps/ApiceCapital/brand/assets/logos/` + `brand-system-FINAL.md` + `motion-spec-FINAL.md`
> **Author:** Uma (@ux-design-expert) · 2026-04-17

---

## 1. Asset placement

Copy SVGs from the brand source into the React/Vite app's assets directory:

```
Apps/ApiceCapital/brand/assets/logos/    ← source of truth (do NOT edit here for app use)
Apps/ApiceCapital/src/assets/logos/      ← app consumption (copy of source)
Apps/ApiceCapital/public/                ← public serving (favicon, og-image, app icons)
```

### Recommended distribution

| Asset | Destination | Exposure |
|---|---|---|
| `apice-wordmark-primary.svg` | `src/assets/logos/` | Component import |
| `apice-lockup-horizontal.svg` | `src/assets/logos/` | Component import |
| `apice-lockup-stacked.svg` | `src/assets/logos/` | Component import |
| `apice-compact.svg` | `src/assets/logos/` | Component import |
| `apice-favicon.svg` | `public/favicon.svg` | Served at `/favicon.svg` |
| `apice-og-image.svg` | `public/og-image.svg` + converted to `public/og-image.png` (1200×630) | Meta tag |
| `apice-app-icon-ios.svg` | Hand off to @apple-ux for Xcode pack | N/A from web |
| `apice-app-icon-android-*.svg` | Native Android project | N/A from web |

### Sync script (suggested)

Add to `Apps/ApiceCapital/package.json`:

```json
{
  "scripts": {
    "brand:sync": "rsync -av --delete ../brand/assets/logos/*.svg src/assets/logos/ && cp ../brand/assets/logos/apice-favicon.svg public/favicon.svg && cp ../brand/assets/logos/apice-og-image.svg public/og-image.svg"
  }
}
```

Run once on setup, then again whenever Uma ships an update.

---

## 2. React component API

Create `src/components/ApiceLogo.tsx` with this interface:

```tsx
import { type FC } from 'react';
import WordmarkPrimary from '@/assets/logos/apice-wordmark-primary.svg?react';
import LockupHorizontal from '@/assets/logos/apice-lockup-horizontal.svg?react';
import LockupStacked from '@/assets/logos/apice-lockup-stacked.svg?react';
import Compact from '@/assets/logos/apice-compact.svg?react';
import Favicon from '@/assets/logos/apice-favicon.svg?react';

export type ApiceLogoVariant = 'primary' | 'horizontal' | 'stacked' | 'compact' | 'favicon';
export type ApiceLogoTheme = 'light' | 'dark';

export interface ApiceLogoProps {
  variant?: ApiceLogoVariant;
  theme?: ApiceLogoTheme;
  className?: string;
  /** Height in px; width auto-scales via viewBox. Defaults to variant-appropriate size. */
  height?: number;
  /** Override ink color (wordmark). Defaults to theme. */
  ink?: string;
  /** Override dot color. Defaults to #16A661 (brand spec — do not change without approval). */
  dot?: string;
  /** Pass-through for testing/accessibility */
  'aria-label'?: string;
}

const VARIANT_MAP = {
  primary: WordmarkPrimary,
  horizontal: LockupHorizontal,
  stacked: LockupStacked,
  compact: Compact,
  favicon: Favicon,
} as const;

export const ApiceLogo: FC<ApiceLogoProps> = ({
  variant = 'primary',
  theme = 'light',
  className,
  height,
  ink,
  dot,
  'aria-label': ariaLabel = 'Apice',
}) => {
  const Svg = VARIANT_MAP[variant];

  // Theme-driven ink color (dot color is brand-locked)
  const resolvedInk = ink ?? (theme === 'dark' ? 'var(--apice-cream, #F7F3ED)' : 'var(--apice-ink, #0E0E12)');
  const resolvedDot = dot ?? 'var(--apice-emerald-bright, #16A661)';

  return (
    <Svg
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{
        height: height ?? undefined,
        width: 'auto',
        // CSS custom properties overridden per instance
        ['--apice-ink' as string]: resolvedInk,
        ['--apice-dot' as string]: resolvedDot,
      }}
    />
  );
};
```

### 2.1 Usage examples

```tsx
// Site nav (light theme, default variant)
<ApiceLogo variant="primary" theme="light" height={28} />

// Dark mode footer
<ApiceLogo variant="horizontal" theme="dark" height={24} />

// Mobile burger menu
<ApiceLogo variant="compact" height={20} />

// Loading screen (large)
<ApiceLogo variant="primary" theme="dark" height={64} />

// Social avatar embed (SSR-friendly static)
<ApiceLogo variant="stacked" height={120} />
```

### 2.2 Why CSS custom properties for colors

The SVGs declare:

```css
.wm { fill: var(--apice-ink, #0E0E12); }
.dot { fill: var(--apice-dot, #16A661); }
```

This means:
1. **Default** renders correctly without any setup (hex fallbacks).
2. **Theme-aware** via `data-theme="dark"` on `<html>` setting `--apice-ink: #F7F3ED`.
3. **Per-instance override** via inline `style` on the component.
4. **Design tokens** from `brand-system-FINAL.md` § 11 become the single source of truth.

---

## 3. Vite configuration

Install SVG-to-React transformer:

```bash
npm install -D vite-plugin-svgr
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {
        // Preserve viewBox, title, role — already in source SVGs
        svgProps: { role: 'img' },
      },
    }),
  ],
});
```

`src/vite-env.d.ts` (so TS recognizes `?react` imports):

```ts
declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react';
  const content: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string }>;
  export default content;
}
```

---

## 4. Next.js pattern (if adopted later)

For Next.js 14+ App Router:

```tsx
// app/components/ApiceLogo.tsx
import Image from 'next/image';
import Wordmark from '@/public/assets/logos/apice-wordmark-primary.svg';

export function ApiceLogo({ height = 28 }: { height?: number }) {
  return <Image src={Wordmark} alt="Apice" height={height} width={height * 3.5} priority />;
}
```

For inline SVG with theme control, use `@svgr/webpack` in `next.config.js`:

```js
module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};
```

---

## 5. Favicon integration

### 5.1 HTML head

In `index.html` (or Next.js `app/layout.tsx` metadata):

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="mask-icon" href="/favicon.svg" color="#16A661" />
<meta name="theme-color" content="#0E0E12" />
```

### 5.2 Raster exports

Generate PNG fallbacks from the SVG source using `sharp` or `svgexport`:

```bash
npx svgexport public/favicon.svg public/favicon-32.png 32:32
npx svgexport public/favicon.svg public/favicon-16.png 16:16
npx svgexport public/favicon.svg public/apple-touch-icon.png 180:180
```

Add to `npm run brand:sync` script for repeatability.

---

## 6. OG image (Open Graph) meta tags

The SVG at `public/og-image.svg` must be converted to PNG (1200×630) for social scrapers. Most platforms don't support SVG OG images.

### 6.1 Conversion

```bash
npx svgexport public/og-image.svg public/og-image.png 1200:630
```

### 6.2 Meta tags (index.html or Next.js metadata)

```html
<meta property="og:title" content="Apice — Build Wealth. One Week at a Time." />
<meta property="og:description" content="AI-powered wealth platform. DCA, autonomous trading, and education in one place." />
<meta property="og:image" content="https://apice.capital/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://apice.capital" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Apice — Build Wealth. One Week at a Time." />
<meta name="twitter:description" content="AI-powered wealth platform." />
<meta name="twitter:image" content="https://apice.capital/og-image.png" />
```

**Replace placeholder URLs** (`apice.capital`) with your production domain once confirmed.

---

## 7. Design tokens

Import the full token set from `brand-system-FINAL.md` §11 into `src/styles/tokens.css` or equivalent. Minimum required tokens for logo consumption:

```css
:root {
  --apice-ink: #0E0E12;
  --apice-cream: #F7F3ED;
  --apice-emerald-bright: #16A661;
}
[data-theme='dark'] {
  --apice-ink: #F7F3ED; /* ink token flips in dark mode */
  --apice-cream: #0E0E12;
}
```

---

## 8. Motion integration (optional — only for splash/welcome screens)

See `motion-spec-FINAL.md` for full CSS/Lottie spec.

### 8.1 Quick CSS-only splash

```tsx
import './apice-motion.css';

export function ApiceSplash() {
  return (
    <div className="apice-splash">
      <span className="apice-logo animated">
        <span className="wordmark">
          <span className="letter">A</span>
          <span className="letter">p</span>
          <span className="letter">i</span>
          <span className="letter">c</span>
          <span className="letter">e</span>
        </span>
        <span className="dot" aria-hidden="true" />
      </span>
    </div>
  );
}
```

CSS (`apice-motion.css`) is copied verbatim from `motion-spec-FINAL.md` §5.

---

## 9. Constraints checklist (enforced at PR review)

- [ ] `ApiceLogo` is the **only** way to render the brand. No hand-coded inline SVG in app code.
- [ ] Dot color is **never** overridden except for an approved exception with Uma sign-off.
- [ ] No rotations, skews, or non-uniform scales applied to the logo.
- [ ] Clear-space respected (minimum 1d padding — see `brand-system-FINAL.md` §5).
- [ ] `prefers-reduced-motion` honored wherever motion is used.
- [ ] `theme-color` meta tag matches current theme (dark `#0E0E12` or light `#F7F3ED`).

---

## 10. Escalation / questions

- **Visual bug / rendering issue** → @ux-design-expert (Uma)
- **New variant needed** → blocked; open decision cycle via @pm (Morgan)
- **Motion polish** → @media-engineer (Lottie export) + Uma (review)
- **iOS/Android native icon pack** → @apple-ux + Uma
- **Anything else** → Jarvis

---

*Uma — @ux-design-expert · 2026-04-17 · v1.0 FINAL*
