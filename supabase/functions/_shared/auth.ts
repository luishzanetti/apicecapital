// Shared auth utilities for Supabase Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aesDecryptAsync } from './crypto.ts';

export interface BybitCredentials {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

export async function getUserCredentials(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  encryptionKey: string
): Promise<BybitCredentials> {
  const { data: creds } = await supabaseAdmin
    .from('bybit_credentials')
    .select('api_key, api_secret_encrypted, testnet')
    .eq('user_id', userId)
    .single();

  if (!creds) throw new Error('No Bybit credentials found. Connect your API key in Settings.');

  const apiSecret = await aesDecryptAsync(creds.api_secret_encrypted, encryptionKey);
  return { apiKey: creds.api_key, apiSecret, testnet: creds.testnet };
}

export async function verifyAuth(
  req: Request,
  supabaseUrl: string,
  anonKey: string
): Promise<{ id: string; email?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('Missing authorization');

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) throw new Error('Invalid token');

  return { id: user.id, email: user.email };
}

export function verifyCronSecret(req: Request): boolean {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (!expectedSecret) return true; // No secret configured = allow
  return cronSecret === expectedSecret;
}
