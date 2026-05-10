# File Impact Analysis — How to Trace Multi-File Changes

## The Core Problem
AI agents often edit only the file they were asked to change, breaking the rest of the codebase silently. This guide teaches systematic impact tracing.

---

## Step-by-Step Impact Trace

### Scenario: Renaming a prop
```
Task: Rename prop `imageUrl` → `image` on <ProductCard>
```

**Step 1 — Find the definition**
```
components/ProductCard.tsx   ← the file with the interface definition
```

**Step 2 — Find all direct imports**
```bash
# Search for every file that imports ProductCard
grep -r "ProductCard" src/ --include="*.tsx" --include="*.ts" -l
```
Result:
```
pages/products/index.tsx
pages/products/[id].tsx
components/FeaturedSection.tsx
components/SearchResults.tsx
```

**Step 3 — Check each consumer for the old prop**
```bash
grep -n "imageUrl" pages/products/index.tsx
grep -n "imageUrl" pages/products/\[id\].tsx
# ...etc
```

**Step 4 — Edit ALL files that use the old prop name**

**Step 5 — Check types file**
```bash
grep -rn "imageUrl" types/
```

**Step 6 — Run type check**
```bash
npx tsc --noEmit
```
If zero errors → change is complete. If errors remain → trace further.

---

## Common Impact Patterns

### Changing a shared type/interface
```
types/product.ts changed
  → All files that import Product type
  → All Supabase queries that select product columns
  → All API routes that return product data
  → All components that render product fields
```

### Adding/removing a required field to a database table
```
supabase/schema.sql changed
  → types/supabase.ts must be regenerated
  → All queries selecting '*' may now include/exclude the field
  → All INSERT statements must include/exclude the field
  → All form components that edit this table
```

### Changing a Next.js layout
```
app/layout.tsx changed
  → Every page under app/ is affected
  → Check: metadata, fonts, global providers, nav
```

### Changing a utility function in lib/
```
lib/formatPrice.ts changed (signature or return type)
  → All components and pages that call formatPrice()
  → All tests for those components
```

---

## Quick Grep Commands
```bash
# Find all usages of a component
grep -r "ComponentName" src/ --include="*.tsx" -l

# Find all usages of a function
grep -r "functionName" src/ --include="*.ts" --include="*.tsx" -n

# Find all imports from a module
grep -r "from '@/lib/utils'" src/ -l

# Find all Supabase queries on a table
grep -r "\.from('table_name')" src/ -n
```
