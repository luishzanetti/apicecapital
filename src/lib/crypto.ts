import CryptoJS from 'crypto-js';

const INSECURE_KEY_PATTERNS = [
    'apice-capital-default-key-change-in-production',
    'CHANGE_ME_run_openssl_rand_base64_32',
];

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    if (import.meta.env.DEV) console.warn('[crypto] VITE_ENCRYPTION_KEY not configured — encryption disabled');
}

/**
 * Validate that the encryption key is configured and not using the insecure default.
 * This MUST be called before any encryption operation.
 */
function validateEncryptionKey(): void {
    if (!ENCRYPTION_KEY) {
        throw new Error(
            '[Security] VITE_ENCRYPTION_KEY is not configured. ' +
            'Set a strong random key (32+ characters) in your .env file.'
        );
    }
    if (INSECURE_KEY_PATTERNS.includes(ENCRYPTION_KEY)) {
        throw new Error(
            '[Security] VITE_ENCRYPTION_KEY is using an insecure default value. ' +
            'Generate a new random key: openssl rand -base64 32'
        );
    }
    if (ENCRYPTION_KEY.length < 32) {
        throw new Error(
            '[Security] VITE_ENCRYPTION_KEY is too short. ' +
            'Use at least 32 characters. Generate one: openssl rand -base64 32'
        );
    }
}

/**
 * Check if encryption is properly configured (non-throwing version).
 * Returns true if the key is valid, false otherwise.
 */
export function isEncryptionConfigured(): boolean {
    return Boolean(
        ENCRYPTION_KEY &&
        !INSECURE_KEY_PATTERNS.includes(ENCRYPTION_KEY) &&
        ENCRYPTION_KEY.length >= 32
    );
}

/**
 * Encrypt sensitive data using AES-256.
 * Used in Settings page to encrypt API secrets before saving to Supabase.
 * Throws if VITE_ENCRYPTION_KEY is not properly configured.
 */
export function encrypt(text: string): string {
    validateEncryptionKey();

    if (!text || typeof text !== 'string') {
        throw new Error('[Security] Cannot encrypt empty or non-string value.');
    }

    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

// SECURITY FIX: decrypt() was removed. API secret decryption must happen server-side
// (in Supabase Edge Functions), never in the browser. If you need to decrypt secrets,
// implement that logic in the corresponding Edge Function.
