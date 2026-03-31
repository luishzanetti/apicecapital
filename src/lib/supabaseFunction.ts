import { supabase } from '@/integrations/supabase/client';

async function extractErrorMessage(error: any): Promise<string> {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      return body?.error || body?.message || body?.msg || error.message || 'Edge function error';
    }
  } catch { /* context consumed */ }
  return error?.message || 'Edge function error';
}

/**
 * Thin wrapper — lets supabase-js handle ALL auth natively.
 * No manual token injection. Just error extraction.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options?: { body?: Record<string, any>; token?: string }
): Promise<{ data: T | null; error: Error | null }> {
  const result = await supabase.functions.invoke(functionName, {
    body: options?.body,
  });

  if (result.error) {
    const errMsg = await extractErrorMessage(result.error);
    return { data: null, error: new Error(errMsg) };
  }

  return { data: result.data as T, error: null };
}
