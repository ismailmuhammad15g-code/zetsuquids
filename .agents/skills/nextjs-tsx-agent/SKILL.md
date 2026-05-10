# Skill: nextjs-tsx-agent

## Name
`nextjs-tsx-agent`

## Description
A comprehensive operational guide for AI agents working on **large-scale React / Next.js / TypeScript (TSX)** projects. Activates whenever the agent is asked to modify, refactor, debug, add features, or review any file inside a Next.js + TypeScript codebase. Prevents the most common agent failure patterns: incomplete multi-file edits, silent TypeScript errors, missing build verification, broken Supabase schema awareness, and poor import/export hygiene.

**Trigger keywords:** `next.js`, `nextjs`, `react`, `.tsx`, `.ts`, `typescript`, `supabase`, `app router`, `pages router`, `tailwind`, `shadcn`

---

## ⚠️ AGENT PRIME DIRECTIVES (Never Violate)

> These rules override everything else. If you are about to break one, STOP and re-read it.

1. **NEVER edit fewer files than the change requires.** Trace every import, export, type, prop, and database call that the change touches — edit ALL of them in the same response.
2. **NEVER introduce a TypeScript error.** If you are unsure of a type, derive it — do not use `any` unless explicitly allowed.
3. **NEVER skip the build verification step** at the end of any session that modifies code.
4. **NEVER assume a Supabase table exists without checking `supabase/schema.sql`** (or the equivalent SQL file in the repo).
5. **NEVER leave a TODO comment in production code** without flagging it explicitly to the user.

---

## 1. Pre-Edit Checklist (Run Before Every Change)

Before writing a single line of code, answer these questions:

```
[ ] 1. Which files import or re-export the symbol I am changing?
[ ] 2. Which files use the prop / type / function / table I am modifying?
[ ] 3. Does this change affect a Supabase table or query? → Check schema.sql
[ ] 4. Does this change affect a shared component? → List all consumers
[ ] 5. Does this change affect routing? → Check app/ or pages/ directory tree
[ ] 6. Does this change affect environment variables? → Update .env.example too
[ ] 7. Am I adding a new dependency? → Note the install command for the user
```

If the answer to any item is "yes", include those files in the same edit batch.

---

## 2. TypeScript Rules (Zero Tolerance)

### 2.1 Strict Mode Compliance
Always write code that satisfies `"strict": true` in `tsconfig.json`:
- No implicit `any`
- No implicit `this`
- Strict null checks — handle `undefined` and `null` explicitly
- No unused variables (treat as error)

### 2.2 Type Derivation Patterns
```ts
// ✅ Derive from existing source of truth
import type { Database } from '@/types/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']

// ✅ Infer return types instead of annotating manually
const getUser = async (id: string) => {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  return data  // type is inferred
}

// ❌ Never do this
const getUser = async (id: string): Promise<any> => { ... }

// ✅ Use satisfies for config objects
const config = {
  revalidate: 60,
  tags: ['products'],
} satisfies { revalidate: number; tags: string[] }
```

### 2.3 Common TypeScript Errors & Fixes

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `Property does not exist on type 'never'` | Union type not narrowed | Add type guard: `if ('field' in obj)` |
| `Type 'X' is not assignable to type 'Y'` | Wrong type passed to prop | Check component prop types; use `as const` on literals |
| `Object is possibly 'undefined'` | Missing null check | Use optional chaining `?.` or early return guard |
| `Module has no exported member 'X'` | Wrong import path or missing export | Check barrel file `index.ts`; verify named vs default export |
| `Argument of type 'string \| null' is not assignable` | Supabase returns nullable fields | Add `?? ''` or explicit null guard before usage |
| `JSX element type does not have any construct or call signatures` | Component typed as `React.FC` with wrong generics | Switch to explicit function signature |
| `Cannot find module '@/...'` | Path alias not configured | Check `tsconfig.json` paths + `next.config.js` |

### 2.4 Server vs Client Components
```ts
// Add this comment at the TOP of every client component
'use client'

// Rules:
// - Hooks (useState, useEffect, etc.) → ALWAYS 'use client'
// - Event handlers (onClick, onChange) → ALWAYS 'use client'
// - Data fetching with async/await at component level → Server Component (no directive)
// - Mixing both → extract client part into a child component
```

---

## 3. Multi-File Edit Protocol

### 3.1 Impact Analysis (Mandatory)
Before editing, run this mental trace:

```
CHANGED: components/ProductCard.tsx  (prop `imageUrl` renamed to `image`)
  ↓ affects
pages/products/[id].tsx              (uses <ProductCard imageUrl={...} />)
pages/products/index.tsx             (uses <ProductCard imageUrl={...} />)
components/FeaturedSection.tsx       (uses <ProductCard imageUrl={...} />)
types/product.ts                     (ProductCardProps interface)
```

**Edit ALL of them. Not just the first one.**

### 3.2 Edit Batch Format
When making multi-file changes, always structure your response as:

```
## Changes in this batch

### File 1: components/ProductCard.tsx
[reason for change]
[full updated file or precise diff]

### File 2: pages/products/[id].tsx
[reason for change]
[updated usage]

... (all files)

### Verification
Run: pnpm type-check && pnpm build
```

### 3.3 Image & Static Asset Changes
If you add, remove, or rename an image/asset file:
1. Update **every** `<Image src="..." />` or `<img src="..." />` reference
2. Update any CSS `background-image: url(...)` references
3. Update any `import logo from '...'` statements
4. Check `public/` vs `src/assets/` — they are served differently in Next.js

---

## 4. Supabase Integration Rules

### 4.1 Schema Awareness
- **Always** check `supabase/schema.sql` (or `supabase/migrations/`) before writing any query.
- If a table is missing from the schema file but needed → **add it to the SQL file** and show the user the migration snippet.
- Never hard-code table names as plain strings — use a constants file:

```ts
// lib/supabase/tables.ts
export const TABLES = {
  PROFILES:  'profiles',
  PRODUCTS:  'products',
  ORDERS:    'orders',
} as const
```

### 4.2 Type-Safe Queries
```ts
// Generate types from Supabase (run once):
// npx supabase gen types typescript --project-id YOUR_ID > types/supabase.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Typed query — columns are validated at compile time
const { data, error } = await supabase
  .from('profiles')
  .select('id, full_name, avatar_url')
  .eq('id', userId)
  .single()
```

### 4.3 Error Handling (Required Pattern)
```ts
const { data, error } = await supabase.from('products').select('*')

if (error) {
  console.error('[Supabase] products query failed:', error.message)
  // Return appropriate fallback — never crash silently
  return { products: [], error: error.message }
}

// data is now non-null — safe to use
```

### 4.4 Row Level Security (RLS) Reminder
When adding a new table, always include RLS policies in the SQL file:
```sql
-- Always enable RLS on new tables
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Users can view own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);
```

### 4.5 New Table Checklist
```
[ ] Table added to supabase/schema.sql
[ ] RLS enabled and policies defined
[ ] Types regenerated (npx supabase gen types ...)
[ ] Types/supabase.ts updated in the repo
[ ] Indexes added for frequently queried columns
[ ] Foreign key constraints declared
```

---

## 5. Data Fetching Patterns

### 5.1 Server Components (Preferred for Initial Data)
```ts
// app/products/page.tsx — Server Component
export default async function ProductsPage() {
  const supabase = createServerClient(...)  // use server client
  const { data: products } = await supabase.from('products').select('*')

  return <ProductList products={products ?? []} />
}
```

### 5.2 Client-Side Fetching (For Dynamic/User-Triggered Data)
```ts
// Always use SWR or React Query — never bare useEffect for data fetching
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function useProducts() {
  const { data, error, isLoading } = useSWR('/api/products', fetcher)
  return { products: data ?? [], error, isLoading }
}
```

### 5.3 API Routes Pattern
```ts
// app/api/products/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase.from('products').select('*')
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
```

---

## 6. Build & Verification Protocol

### 6.1 When to Verify
Run verification at the **end of every improvement session**, not after every single file. Exception: run immediately if you hit a TypeScript error mid-session.

### 6.2 Verification Sequence
```bash
# Step 1 — Type check (fastest signal, run first)
pnpm type-check
# or: npx tsc --noEmit

# Step 2 — Lint
pnpm lint
# or: npx next lint

# Step 3 — Build (catches what tsc and lint miss)
pnpm build
# or: npx next build

# Step 4 — (Optional) Run dev server and manually test changed routes
pnpm dev
```

### 6.3 Reading Build Output
| Output Signal | Meaning | Action |
|--------------|---------|--------|
| `Type error in ...` | TypeScript violation | Fix type — never suppress with `@ts-ignore` unless documented |
| `Module not found` | Wrong import path | Fix path alias or relative path |
| `Page ... is missing ...` | Required export missing | Add `export default` or `generateMetadata` |
| `Image with src "..." was detected as having width/height of 0` | Missing `width`/`height` on `<Image>` | Add explicit dimensions or use `fill` + wrapper |
| Chunk size warning | Bundle too large | Dynamic import: `const Comp = dynamic(() => import('...'))` |

---

## 7. Component & File Conventions

### 7.1 File Naming
```
components/         → PascalCase.tsx         (ProductCard.tsx)
app/                → lowercase/page.tsx     (products/page.tsx)
lib/                → camelCase.ts           (supabaseClient.ts)
types/              → camelCase.ts           (product.ts)
hooks/              → useXxx.ts              (useProducts.ts)
constants/          → UPPER_SNAKE.ts         (API_ROUTES.ts)
```

### 7.2 Component Anatomy (Standard Structure)
```tsx
// 1. Imports (external → internal → types)
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types/product'

// 2. Types
interface ProductCardProps {
  product: Product
  onSelect?: (id: string) => void
}

// 3. Component
export function ProductCard({ product, onSelect }: ProductCardProps) {
  // 3a. Hooks
  const [selected, setSelected] = useState(false)

  // 3b. Handlers
  const handleClick = () => {
    setSelected(true)
    onSelect?.(product.id)
  }

  // 3c. Render
  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  )
}

// 4. Default export (optional — prefer named exports for better refactoring)
export default ProductCard
```

### 7.3 Barrel File Rules
```ts
// components/index.ts — Only re-export what is used externally
// ❌ Avoid wildcard re-exports (breaks tree-shaking)
export * from './ProductCard'

// ✅ Named re-exports
export { ProductCard } from './ProductCard'
export { FeaturedSection } from './FeaturedSection'
```

---

## 8. Common Pitfalls & Solutions

| Pitfall | Prevention |
|--------|------------|
| Editing only one file when a prop changes | Always trace imports before editing |
| Using `any` to silence TypeScript | Derive the correct type; use `unknown` + type guard |
| Forgetting `'use client'` on hooks | Check: does this component use state/effects/events? |
| Calling Supabase server client in a client component | Use server client in Server Components / API routes only |
| `next/image` without `width` and `height` | Always provide both or use `fill` layout |
| Hardcoding `http://localhost:3000` | Use `process.env.NEXT_PUBLIC_APP_URL` |
| Missing `key` prop in lists | Always add `key` to the outermost element in `.map()` |
| `useEffect` with missing dependencies | Follow exhaustive-deps lint rule |
| Not handling loading and error states | Every data fetch needs: loading skeleton + error message |
| Mutating Supabase data without revalidating cache | Call `revalidatePath()` or `revalidateTag()` after mutations |

---

## 9. Environment Variables Protocol

```bash
# .env.local (never commit — add to .gitignore)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never expose to client

# .env.example (commit this — documents required variables)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Rules:
- Variables prefixed `NEXT_PUBLIC_` are exposed to the browser — never put secrets there.
- Access server-only variables only in Server Components, API routes, and `middleware.ts`.
- When adding a new env variable, **always** update `.env.example`.

---

## 10. Performance & Quality Checklist (End of Session)

```
[ ] No new TypeScript errors (pnpm type-check passes)
[ ] No new lint errors (pnpm lint passes)
[ ] Build succeeds (pnpm build passes)
[ ] All changed routes tested manually in dev
[ ] No console.log left in production code
[ ] No hardcoded secrets or URLs
[ ] Images use next/image with proper dimensions
[ ] New Supabase tables have RLS enabled
[ ] .env.example updated if new variables added
[ ] All import paths resolve correctly (no red underlines in IDE)
```

---

## References
- `references/typescript-common-errors.md` — Detailed TypeScript error catalog
- `references/supabase-integration.md` — Supabase patterns and schema guide
- `references/file-impact-analysis.md` — How to trace multi-file impact

## Scripts
- `scripts/type-check.sh` — Run TypeScript check
- `scripts/build-check.sh` — Full build verification
- `scripts/lint-check.sh` — ESLint check
