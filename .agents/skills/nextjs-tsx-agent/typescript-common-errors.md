# TypeScript Common Errors — Next.js / TSX Projects

## Error Catalog

---

### TS2339 — Property does not exist on type
```
Error: Property 'name' does not exist on type 'never'
```
**Cause:** TypeScript narrowed the type to `never` (impossible state) or the union is not narrowed.

**Fix:**
```ts
// ❌ Wrong
function greet(user: User | null) {
  return user.name  // Object is possibly null
}

// ✅ Correct
function greet(user: User | null) {
  if (!user) return null
  return user.name  // TypeScript knows user is User here
}
```

---

### TS2345 — Argument type mismatch
```
Error: Argument of type 'string | null' is not assignable to parameter of type 'string'
```
**Cause:** Supabase and many APIs return nullable values.

**Fix:**
```ts
// ✅ Option A — Nullish coalescing
const name = user.full_name ?? 'Anonymous'

// ✅ Option B — Type assertion (only when certain)
const name = user.full_name!

// ✅ Option C — Early return guard
if (!user.full_name) return
doSomething(user.full_name)  // now string
```

---

### TS2307 — Cannot find module
```
Error: Cannot find module '@/components/Button' or its corresponding type declarations
```
**Cause:** Path alias not configured or file does not exist.

**Fix:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
// Next.js 13+ reads tsconfig paths automatically
```

---

### TS7006 — Parameter implicitly has 'any' type
```
Error: Parameter 'e' implicitly has an 'any' type
```
**Fix:**
```ts
// ❌ Wrong
const handleChange = (e) => { ... }

// ✅ Correct
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }

// Common event types:
// React.MouseEvent<HTMLButtonElement>
// React.FormEvent<HTMLFormElement>
// React.KeyboardEvent<HTMLInputElement>
```

---

### TS2304 — Cannot find name (missing import)
```
Error: Cannot find name 'useState'
```
**Fix:**
```ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
```

---

### TS1484 — Type-only imports
```
Error: 'X' is a type and must be imported using a type-only import
```
**Fix:**
```ts
// ❌ Wrong (when isolatedModules: true)
import { User } from '@/types'

// ✅ Correct
import type { User } from '@/types'
```

---

## React-Specific Type Patterns

### Component Props
```ts
// Children
interface Props {
  children: React.ReactNode        // any renderable content
  child: React.ReactElement        // single JSX element
}

// Refs
interface Props {
  inputRef: React.RefObject<HTMLInputElement>
}

// Style
interface Props {
  style?: React.CSSProperties
  className?: string
}

// Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}
```

### forwardRef
```ts
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )
)
Input.displayName = 'Input'
```

---

## Next.js-Specific Types

```ts
// Page props (App Router)
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Layout props
interface LayoutProps {
  children: React.ReactNode
  params: { lang: string }
}

// generateMetadata
import type { Metadata } from 'next'
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: `Product ${params.slug}` }
}

// Route Handler (App Router)
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  return NextResponse.json({ data: [] })
}
```
