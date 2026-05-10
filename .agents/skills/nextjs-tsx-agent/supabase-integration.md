# Supabase Integration Guide — Next.js Projects

## Setup

### 1. Install
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2. Generate Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts
```
Regenerate every time the schema changes.

### 3. Client Setup

**Browser Client (Client Components)**
```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client (Server Components, API Routes)**
```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

---

## Schema File Standard

Every table must be documented in `supabase/schema.sql`:

```sql
-- ================================================
-- Table: profiles
-- Description: Extended user profile data
-- Author: [your name]
-- Created: YYYY-MM-DD
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## Query Patterns

### Select with type safety
```ts
const { data, error } = await supabase
  .from('products')
  .select('id, name, price, category:categories(name)')
  .eq('active', true)
  .order('created_at', { ascending: false })
  .limit(20)
```

### Insert with return
```ts
const { data, error } = await supabase
  .from('orders')
  .insert({ user_id: userId, total: 99.99 })
  .select()
  .single()
```

### Upsert
```ts
const { error } = await supabase
  .from('profiles')
  .upsert({ id: userId, full_name: 'Ahmed', updated_at: new Date().toISOString() })
```

### Delete
```ts
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
```

### Realtime Subscription
```ts
useEffect(() => {
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => setOrders(prev => [payload.new as Order, ...prev])
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

---

## Auth Patterns

### Get current user (Server Component)
```ts
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Protected API Route
```ts
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // proceed...
}
```

---

## Migration Checklist (New Table)

```
[ ] Table defined in supabase/schema.sql with comments
[ ] RLS enabled
[ ] Policies for SELECT / INSERT / UPDATE / DELETE as needed
[ ] Indexes on columns used in WHERE / ORDER BY
[ ] Foreign keys declared (with ON DELETE behavior)
[ ] Types regenerated: npx supabase gen types typescript ...
[ ] types/supabase.ts committed to repo
[ ] Seeder or test data added if needed
```
