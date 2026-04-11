const BYBIT_ERROR_MAP: Record<number, { message: string; retryable: boolean }> = {
  0: { message: 'Success', retryable: false },
  10003: { message: 'Invalid API key. Reconnect in Settings.', retryable: false },
  10004: { message: 'Request signing failed. Try again.', retryable: true },
  10005: { message: 'Permission denied. Check API key permissions.', retryable: false },
  10006: { message: 'Rate limited. Please wait.', retryable: true },
  10016: { message: 'Server busy. Retrying...', retryable: true },
  33004: { message: 'Insufficient balance.', retryable: false },
  170137: { message: 'Order amount too small.', retryable: false },
  170124: { message: 'Order quantity too small.', retryable: false },
  170217: { message: 'Exceeds maximum order amount.', retryable: false },
};

export function getBybitErrorMessage(retCode: number, fallback?: string): string {
  return BYBIT_ERROR_MAP[retCode]?.message || fallback || `Bybit error (${retCode})`;
}

export function isRetryable(retCode: number): boolean {
  return BYBIT_ERROR_MAP[retCode]?.retryable ?? false;
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const code = (error as any)?.retCode ?? (error as any)?.code;
      if (!isRetryable(code) || attempt === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}
