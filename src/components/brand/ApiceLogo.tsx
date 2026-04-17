import { cn } from '@/lib/utils';

/**
 * Apice Logo — canonical brand component.
 *
 * The approved triangle DNA (since Brand Book v2 D7):
 *   - Outer outline · stroke 2.5u · rounded joins/caps · path `M 32 6 L 58 56 L 6 56 Z` on 64u viewBox
 *   - Inner fill · opacity 0.20 · path `M 32 20 L 48 52 L 16 52 Z` (harmonious 1.6:1 ratio)
 *
 * Variants:
 *   - 'triangle'          standalone approved triangle (outline + inner fill 20%)
 *   - 'triangle-in-circle' approved triangle inside translucent circle + blue glow (dark hero)
 *   - 'primary-light'     triangle + "Apice" wordmark + emerald dot (light bg)
 *   - 'primary-dark'      triangle-in-circle + "Apice" + "AI TRADE SETUP" (dark bg — matches Landing screenshot)
 *   - 'wordmark'          just "Apice" with emerald dot
 *   - 'favicon'           simplified for ≤48px
 *
 * Reference: Brand Book v2 §2 · DECISIONS-LOG D7 · approved by CEO 2026-04-17
 */

export type ApiceLogoVariant =
  | 'triangle'
  | 'triangle-in-circle'
  | 'primary-light'
  | 'primary-dark'
  | 'wordmark'
  | 'favicon'
  | 'unified-horizontal-light'
  | 'unified-horizontal-dark'
  | 'unified-stacked-light'
  | 'unified-stacked-dark'
  | 'wordmark-with-tagline'
  | 'compact-nav';

const TAGLINE = 'Global AI Investing';

export interface ApiceLogoProps {
  variant?: ApiceLogoVariant;
  /** Size in pixels — applied to the height of the element. Width scales proportionally. */
  size?: number;
  /** Theme-aware color — when not set, inherits from CSS `color` (ink on light, cream on dark). */
  className?: string;
  /** Accessibility label. Defaults to "Apice". */
  'aria-label'?: string;
}

const EMERALD = '#16A661';

// Approved triangle paths — DO NOT change without updating Brand Book v2
const TRIANGLE_OUTLINE = 'M 32 6 L 58 56 L 6 56 Z';
const TRIANGLE_INNER = 'M 32 20 L 48 52 L 16 52 Z';

export function ApiceLogo({
  variant = 'triangle',
  size = 32,
  className,
  'aria-label': ariaLabel = 'Apice',
}: ApiceLogoProps) {
  switch (variant) {
    case 'triangle':
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <path
            d={TRIANGLE_OUTLINE}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          <path d={TRIANGLE_INNER} fill="currentColor" opacity="0.20" />
        </svg>
      );

    case 'triangle-in-circle':
      return (
        <svg
          viewBox="0 0 88 88"
          width={size}
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <defs>
            <radialGradient id="apice-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#528FFF" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#528FFF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#528FFF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="apice-circle-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
            </radialGradient>
          </defs>
          <circle cx="44" cy="44" r="44" fill="url(#apice-glow)" />
          <circle
            cx="44"
            cy="44"
            r="30"
            fill="url(#apice-circle-fill)"
            stroke="#FFFFFF"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <g transform="translate(26 26) scale(0.5625)">
            <path
              d={TRIANGLE_OUTLINE}
              stroke="#F7F3ED"
              strokeWidth="4.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            <path d={TRIANGLE_INNER} fill="#F7F3ED" opacity="0.20" />
          </g>
        </svg>
      );

    case 'primary-light':
      return (
        <svg
          viewBox="0 0 380 88"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <g transform="translate(12 12)">
            <path
              d={TRIANGLE_OUTLINE}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            <path d={TRIANGLE_INNER} fill="currentColor" opacity="0.20" />
          </g>
          <text
            x="100"
            y="60"
            fontFamily="'Geist', 'Inter', system-ui, sans-serif"
            fontWeight="700"
            fontSize="56"
            letterSpacing="-1.68"
            fill="currentColor"
          >
            Apice
          </text>
          <circle cx="260" cy="55" r="5" fill={EMERALD} />
        </svg>
      );

    case 'primary-dark':
      return (
        <svg
          viewBox="0 0 420 100"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <defs>
            <radialGradient id="apice-glow-dark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#528FFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#528FFF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="apice-fill-dark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#apice-glow-dark)" />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="url(#apice-fill-dark)"
            stroke="#FFFFFF"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          <g transform="translate(32 32) scale(0.5625)">
            <path
              d={TRIANGLE_OUTLINE}
              stroke="#F7F3ED"
              strokeWidth="4.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            <path d={TRIANGLE_INNER} fill="#F7F3ED" opacity="0.20" />
          </g>
          <text
            x="110"
            y="48"
            fontFamily="'Geist', 'Inter', system-ui, sans-serif"
            fontWeight="700"
            fontSize="42"
            letterSpacing="-1.26"
            fill="#FFFFFF"
          >
            Apice
          </text>
          <text
            x="110"
            y="72"
            fontFamily="'Geist', 'Inter', system-ui, sans-serif"
            fontWeight="500"
            fontSize="10"
            letterSpacing="2.8"
            textTransform="uppercase"
            fill="rgba(255,255,255,0.5)"
          >
            Global AI Investing
          </text>
          <circle cx="202" cy="44" r="4" fill={EMERALD} />
        </svg>
      );

    case 'wordmark':
      return (
        <svg
          viewBox="0 0 280 80"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <text
            x="28"
            y="54"
            fontFamily="'Geist', 'Inter', system-ui, sans-serif"
            fontWeight="700"
            fontSize="48"
            letterSpacing="-1.44"
            fill="currentColor"
          >
            Apice
          </text>
          <circle cx="160.5" cy="51.5" r="4.3" fill={EMERALD} />
        </svg>
      );

    case 'favicon':
      return (
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <path
            d="M 16 4 L 29 26 L 3 26 Z"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 16 12 L 24 25 L 8 25 Z" fill="currentColor" opacity="0.20" />
        </svg>
      );

    case 'unified-horizontal-light':
      return (
        <svg
          viewBox="0 0 460 108"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={`${ariaLabel} — ${TAGLINE}`}
        >
          <title>{`${ariaLabel} · ${TAGLINE}`}</title>
          <g transform="translate(16 18)">
            <path d={TRIANGLE_OUTLINE} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={TRIANGLE_INNER} fill="currentColor" opacity="0.20" />
          </g>
          <text x="104" y="58" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="52" letterSpacing="-1.56" fill="currentColor">Apice</text>
          <circle cx="245" cy="54" r="5" fill={EMERALD} />
          <line x1="104" y1="72" x2="300" y2="72" stroke="currentColor" strokeWidth="0.6" opacity="0.30" />
          <text x="104" y="92" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.8" textTransform="uppercase" fill="currentColor" opacity="0.60">{TAGLINE}</text>
        </svg>
      );

    case 'unified-horizontal-dark':
      return (
        <svg
          viewBox="0 0 340 120"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={`${ariaLabel} — ${TAGLINE}`}
        >
          <title>{`${ariaLabel} · ${TAGLINE}`}</title>
          <defs>
            <radialGradient id="uni-h-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#528FFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#528FFF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="uni-h-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#uni-h-glow)" />
          <circle cx="60" cy="60" r="38" fill="url(#uni-h-fill)" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="1" />
          <g transform="translate(38 38) scale(0.6875)">
            <path d={TRIANGLE_OUTLINE} stroke="#F7F3ED" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={TRIANGLE_INNER} fill="#F7F3ED" opacity="0.20" />
          </g>
          <text x="140" y="64" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="48" letterSpacing="-1.44" fill="#FFFFFF">Apice</text>
          <circle cx="268" cy="60" r="5" fill={EMERALD} />
          <line x1="140" y1="80" x2="328" y2="80" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.25" />
          <text x="140" y="100" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.4" textTransform="uppercase" fill="#FFFFFF" opacity="0.55">{TAGLINE}</text>
        </svg>
      );

    case 'unified-stacked-light':
      return (
        <svg
          viewBox="0 0 280 220"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={`${ariaLabel} — ${TAGLINE}`}
        >
          <title>{`${ariaLabel} · ${TAGLINE}`}</title>
          <g transform="translate(108 24)">
            <path d={TRIANGLE_OUTLINE} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={TRIANGLE_INNER} fill="currentColor" opacity="0.20" />
          </g>
          <text x="140" y="140" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="54" letterSpacing="-1.62" textAnchor="middle" fill="currentColor">Apice</text>
          <circle cx="213" cy="137" r="5" fill={EMERALD} />
          <line x1="80" y1="160" x2="200" y2="160" stroke="currentColor" strokeWidth="0.6" opacity="0.30" />
          <text x="140" y="186" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.8" textTransform="uppercase" textAnchor="middle" fill="currentColor" opacity="0.60">{TAGLINE}</text>
        </svg>
      );

    case 'unified-stacked-dark':
      return (
        <svg
          viewBox="0 0 320 280"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={`${ariaLabel} — ${TAGLINE}`}
        >
          <title>{`${ariaLabel} · ${TAGLINE}`}</title>
          <defs>
            <radialGradient id="uni-s-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#528FFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#528FFF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="uni-s-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
            </radialGradient>
          </defs>
          <circle cx="160" cy="72" r="56" fill="url(#uni-s-glow)" />
          <circle cx="160" cy="72" r="38" fill="url(#uni-s-fill)" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="1" />
          <g transform="translate(138 50) scale(0.6875)">
            <path d={TRIANGLE_OUTLINE} stroke="#F7F3ED" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={TRIANGLE_INNER} fill="#F7F3ED" opacity="0.20" />
          </g>
          <text x="160" y="188" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="50" letterSpacing="-1.5" textAnchor="middle" fill="#FFFFFF">Apice</text>
          <circle cx="229" cy="185" r="5" fill={EMERALD} />
          <line x1="92" y1="212" x2="228" y2="212" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.25" />
          <text x="160" y="240" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="600" fontSize="11" letterSpacing="3" textTransform="uppercase" textAnchor="middle" fill="#FFFFFF" opacity="0.55">{TAGLINE}</text>
        </svg>
      );

    case 'wordmark-with-tagline':
      return (
        <svg
          viewBox="0 0 360 108"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={`${ariaLabel} — ${TAGLINE}`}
        >
          <title>{`${ariaLabel} · ${TAGLINE}`}</title>
          <text x="16" y="62" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="54" letterSpacing="-1.62" fill="currentColor">Apice</text>
          <circle cx="163" cy="58" r="5.5" fill={EMERALD} />
          <line x1="16" y1="76" x2="244" y2="76" stroke="currentColor" strokeWidth="0.6" opacity="0.30" />
          <text x="16" y="96" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="600" fontSize="10" letterSpacing="2.8" textTransform="uppercase" fill="currentColor" opacity="0.60">{TAGLINE}</text>
        </svg>
      );

    case 'compact-nav':
      return (
        <svg
          viewBox="0 0 200 44"
          height={size}
          className={cn('inline-block', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <title>{ariaLabel}</title>
          <g transform="translate(4 6) scale(0.5)">
            <path d={TRIANGLE_OUTLINE} stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d={TRIANGLE_INNER} fill="currentColor" opacity="0.20" />
          </g>
          <text x="48" y="32" fontFamily="'Geist','Inter',system-ui,sans-serif" fontWeight="700" fontSize="26" letterSpacing="-0.78" fill="currentColor">Apice</text>
          <circle cx="121" cy="30" r="3" fill={EMERALD} />
        </svg>
      );

    default: {
      const _exhaustive: never = variant;
      return null;
    }
  }
}
