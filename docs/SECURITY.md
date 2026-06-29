# The Study Flow Security Policy

## 🔐 Auth & Tokens

- **JWT Validation**: Client requests are intercepted by Uvicorn middleware. Tokens are decoded locally using HS256 algorithm with your Supabase JWT secret to extract the authenticated user UUID (`sub`).
- **Database Fallback**: In the event that local decoding fails (e.g. format issues), the token is sent to the Supabase auth API endpoint directly to fetch the session status.

---

## 💾 Row Level Security (RLS)

Every table inside PostgreSQL has RLS enabled to prevent cross-tenant data access.

### Typical RLS Schema Policy
```sql
alter table public.document_chunks enable row level security;

create policy "Users can only view their own document chunks"
on public.document_chunks
for select
using (
  auth.uid() = (
    select user_id 
    from public.documents 
    where id = document_chunks.document_id
  )
);
```

---

## 🛡️ Content Security Policy & Rate Limiting

- **Rate Limits**:
  - Auth requests are rate-limited to `10 requests / minute` per client IP.
  - Gemini AI generations are limited to `15 requests / minute` per IP.
- **Trusted Hosts**: Uvicorn whitelists only explicitly configured hosts to block HTTP Host Header Injection attacks.
