/**
 * Feature flags for Apice app.
 * Enables gradual rollout of new features without breaking changes.
 *
 * Precedence:
 *   1. Explicit env var (`VITE_ENABLE_*`)
 *   2. LocalStorage override (`?flag=ENABLE_BRAND_V2` in URL → persisted)
 *   3. Default value
 *
 * Usage:
 *   import { flags } from '@/lib/featureFlags';
 *   if (flags.ENABLE_BRAND_V2) { ... }
 */

const STORAGE_KEY = 'apice.flags.v1';

interface FlagDefinition {
  /** The default value if no override is set. */
  default: boolean;
  /** Human description (for future admin UI). */
  description: string;
}

const FLAGS = {
  /**
   * Brand System v2 — new logo, typography, experts, clients.
   * Controls: new triangle, emerald palette, Geist font, 6 experts integration, testimonials.
   * Default: true (CEO approved 2026-04-17 — unified logo is the canonical Apice identity).
   * Rollback: set to false via env `VITE_ENABLE_BRAND_V2=false` or localStorage to revert to v1 visual.
   */
  ENABLE_BRAND_V2: {
    default: true,
    description: 'New Apice Brand System v2 (triangle, Geist, emerald signature)',
  },

  /**
   * AI Experts — show the 6 photoreal experts in Academy, daily insight, /experts page.
   * Depends on ENABLE_BRAND_V2.
   */
  ENABLE_AI_EXPERTS: {
    default: false,
    description: '6 AI Experts (Nora, Kai, Elena, Dante, Maya, Omar) across Academy + Home',
  },

  /**
   * Social Proof Testimonials — show the 20 client testimonials in Landing/Upgrade/Quiz.
   * Depends on ENABLE_BRAND_V2.
   */
  ENABLE_TESTIMONIALS_V2: {
    default: false,
    description: '20 client testimonials with photoreal portraits',
  },

  /**
   * Apice AI mark — ambient orb visualization for AI states (idle/thinking/speaking).
   * Depends on ENABLE_BRAND_V2.
   */
  ENABLE_APICE_AI_VIZ: {
    default: false,
    description: 'Apice AI visual mark (orb) with thinking/speaking animations',
  },
} as const satisfies Record<string, FlagDefinition>;

type FlagKey = keyof typeof FLAGS;

function readEnvFlag(key: FlagKey): boolean | null {
  const envKey = `VITE_${key}`;
  const value = (import.meta.env as Record<string, string | undefined>)[envKey];
  if (value === undefined) return null;
  return value === 'true' || value === '1';
}

function readStorageFlag(key: FlagKey): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed[key] === 'boolean' ? parsed[key] : null;
  } catch {
    return null;
  }
}

function applyUrlOverrides(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const flagParam = params.get('flag');
  if (!flagParam) return;
  const [key, rawValue] = flagParam.split('=');
  const normalizedKey = key.trim().toUpperCase() as FlagKey;
  if (!(normalizedKey in FLAGS)) return;
  const value = rawValue === undefined ? true : rawValue === 'true' || rawValue === '1';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    parsed[normalizedKey] = value;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore storage errors */
  }
}

applyUrlOverrides();

function resolve(key: FlagKey): boolean {
  const envValue = readEnvFlag(key);
  if (envValue !== null) return envValue;
  const storageValue = readStorageFlag(key);
  if (storageValue !== null) return storageValue;
  return FLAGS[key].default;
}

export const flags = {
  ENABLE_BRAND_V2: resolve('ENABLE_BRAND_V2'),
  ENABLE_AI_EXPERTS: resolve('ENABLE_AI_EXPERTS'),
  ENABLE_TESTIMONIALS_V2: resolve('ENABLE_TESTIMONIALS_V2'),
  ENABLE_APICE_AI_VIZ: resolve('ENABLE_APICE_AI_VIZ'),
};

export type ApiceFlag = FlagKey;
export const flagDefinitions = FLAGS;
