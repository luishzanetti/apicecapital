import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn('[Supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not configured. Running in degraded/demo mode.');
}

/**
 * SECURITY NOTES — Supabase Anon Key
 *
 * The anon key is a PUBLIC key designed for use in browsers. It is NOT a secret.
 * All data security relies on Row Level Security (RLS) policies on every table:
 *
 *   - profiles:          RLS enforced — users can only CRUD their own row (auth.uid() = id)
 *   - portfolios:        RLS enforced — users can only CRUD their own rows (auth.uid() = user_id)
 *   - dca_plans:         RLS enforced — users can only CRUD their own rows (auth.uid() = user_id)
 *   - transactions:      RLS MUST be enforced — users can only CRUD their own rows (auth.uid() = user_id)
 *   - bybit_credentials: RLS MUST be enforced — users can only CRUD their own rows (auth.uid() = user_id)
 *   - dca_executions:    RLS MUST be enforced — users can only SELECT their own rows (auth.uid() = user_id)
 *   - analytics_events:  RLS MUST be enforced — INSERT only, no SELECT/UPDATE/DELETE for anon
 *
 * CRITICAL: Never use the anon key for privileged operations (admin, service_role).
 * All sensitive operations (API secret decryption, Bybit order execution) MUST go
 * through Supabase Edge Functions which use the service_role key server-side.
 *
 * If adding new tables, ALWAYS enable RLS and create appropriate policies BEFORE
 * writing any client-side code that accesses them.
 */

// Use a valid-looking placeholder to pass URL validation when not configured
const PLACEHOLDER_URL = 'https://placeholder-project.supabase.co';
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseKey : PLACEHOLDER_KEY,
);
