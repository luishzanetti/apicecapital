# Supabase Edge Functions

## market-data

Server-side proxy for Bybit V5 API. Prevents direct API calls from client browser.

### Deploy

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref atatdrnqpynzydkdukta

# Deploy the function
supabase functions deploy market-data --no-verify-jwt
```

> Note: `--no-verify-jwt` allows anon key auth. The function still validates the authorization header exists.

### Test locally

```bash
supabase start
supabase functions serve market-data
```

```bash
curl -X POST http://localhost:54321/functions/v1/market-data \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "tickers"}'
```

### API

| Action | Body | Response |
|--------|------|----------|
| `tickers` | `{ action: "tickers", symbols?: string[] }` | All supported spot tickers |
| `ticker` | `{ action: "ticker", symbol: "BTCUSDT" }` | Single ticker data |

### Architecture

```
Client (marketData.ts)
  ├─ Supabase configured? → Edge Function → Bybit API
  └─ Not configured? → Direct Bybit API (fallback)
```

Server-side cache: 15s. Client-side cache: 30s.

---

## bybit-account

Secure server-side Bybit authenticated API calls. API secrets are decrypted server-side only — never exposed to the browser.

### Deploy

```bash
# Set the encryption key as a secret
supabase secrets set ENCRYPTION_KEY="your-encryption-key-here"

# Deploy
supabase functions deploy bybit-account
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `ENCRYPTION_KEY` | AES encryption key (must match `VITE_ENCRYPTION_KEY` used to encrypt credentials) |
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | Auto-provided by Supabase |

### Required DB Table

```sql
CREATE TABLE bybit_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  testnet BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bybit_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credentials" ON bybit_credentials
  FOR ALL USING (auth.uid() = user_id);
```

### API

| Action | Body | Response |
|--------|------|----------|
| `balance` | `{ action: "balance", accountType?: "UNIFIED" }` | Wallet balance + coin holdings |
| `positions` | `{ action: "positions", category?: "linear" }` | Open derivative positions |
| `test` | `{ action: "test" }` | Connection test result |

### Architecture

```
Client (useExchangeBalance.ts)
  → supabase.functions.invoke('bybit-account')
    → Edge Function reads encrypted credentials from DB
      → Decrypts API secret server-side
        → Makes authenticated Bybit V5 API call
          → Returns sanitized balance data
```

API secrets never leave the server.
