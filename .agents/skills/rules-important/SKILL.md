---
name: no-hallucination-no-mock
description: >
  Apply this skill on EVERY frontend or full-stack generation task — no exceptions.
  Prevents AI hallucination in UI/UX output: eliminates mock buttons, fake statistics,
  placeholder text, non-functional components, useless pages, and any element that
  has no real purpose in the context of the specific product being built.
  Trigger whenever building a website, web app, dashboard, mobile app, admin panel,
  landing page, or any interactive interface. If a component, button, text block,
  table, form, or page cannot be justified with a real, working function relevant to
  the product — it must NOT be generated.
---

# No-Hallucination · No-Mock-Data Skill

> **Core Principle**: Every single element you generate — button, text, table, statistic,
> form field, page, modal, badge, icon — must serve a real, justified, working purpose
> in the context of the product being built. If it does not have a clear function, do not
> create it.

---

## 1. The Fundamental Rule

Before generating any UI element, ask yourself one mandatory question:

> **"Does this element have a real, working function inside THIS specific product?"**

- ✅ **YES** → Generate it with full, real logic.
- ❌ **NO / MAYBE / UNSURE** → Do NOT generate it. Remove it. Omit it completely.

There are no exceptions to this rule.

---

## 2. What is "Hallucination" in UI Generation?

AI hallucination in frontend work is not just wrong text — it is any of the following:

### 2.1 Mock / Fake Buttons
A button that visually exists but has no real function tied to the product context.

**Examples of hallucinated buttons (FORBIDDEN):**
- A `Buy Now` button on a cooking recipe website that has no shop.
- A `Download App` button when no app exists or was requested.
- A `Share to Social` button when no sharing logic was implemented.
- A `Login with Google` button that is not wired to any auth provider.
- A `Submit` button that does nothing — no API call, no state change, no feedback.

**Rule:** If a button cannot perform its labeled action right now in this build, do not render it.

---

### 2.2 Mock / Fake Statistics & Numbers
Hardcoded numbers that look real but are fabricated and have no live or real data source.

**Examples of hallucinated statistics (FORBIDDEN):**
- `12,483 Active Users` on a fresh project with no user database.
- `98% Customer Satisfaction` with no reviews or survey system.
- `$1.2M Revenue This Month` on a dashboard with no sales data.
- `4.8 ★` rating when no rating system exists.

**Rule:** If the number is not derived from a real data source, database query, or user-provided dataset — do NOT show it. Replace with:
- Empty state UI (`No data yet`)
- A placeholder that clearly communicates it requires real data connection
- A `0` or `—` value with a note for integration

---

### 2.3 Mock / Fake Text (Lorem Ipsum & Fabricated Content)
Any text placed as filler that would be seen by real users but contains no real information.

**Examples of hallucinated text (FORBIDDEN):**
- `Lorem ipsum dolor sit amet...` anywhere visible to users.
- `Welcome, John Doe!` when no auth/user system exists.
- `Latest news from our blog...` with fake paragraphs when no blog exists.
- `Our team of experts...` followed by made-up names and bios.
- Feature descriptions that were never specified by the user.

**Rule:** Only write text that is:
1. Directly provided by the user, OR
2. A real static string that accurately describes the product, OR
3. Clearly marked as a content placeholder needing real copy (use `[REPLACE: your headline here]` syntax, never invisible filler)

---

### 2.4 Mock / Fake Tables & Lists
Data tables populated with invented rows that simulate real data.

**Examples of hallucinated tables (FORBIDDEN):**
- An orders table with fake order IDs, names, and amounts.
- A users table with invented email addresses.
- A products table with made-up SKUs and prices.
- A leaderboard with fake usernames and scores.

**Rule:** If real data is not provided:
- Render the table structure (headers, columns) with an **empty state** message.
- Example: `No orders yet. Orders will appear here once customers purchase.`
- Never populate rows with invented data.

---

### 2.5 Mock / Fake Authentication
Login or register flows that appear functional but use fake credentials or hardcoded bypass logic.

**Examples of hallucinated auth (FORBIDDEN):**
- `if (username === 'admin' && password === '1234') { login() }` — mock login.
- A registration form that "succeeds" without writing to any database.
- Social login buttons (Google, Apple, GitHub) that are not connected to real OAuth.
- A JWT token that is hardcoded as a string constant.

**Rule:** If real authentication (Supabase, Firebase, Auth0, NextAuth, custom API, etc.) is not set up:
- Do NOT generate a fake auth flow that pretends to work.
- Either: implement real auth with the correct provider as instructed, OR
- Display a clear UI notice: `Authentication requires backend integration — connect your auth provider here.`
- Never simulate security systems.

---

### 2.6 Useless Pages & Sections
Entire pages or page sections that exist visually but serve no purpose in the product.

**Examples of hallucinated pages (FORBIDDEN):**
- A `Blog` page on a product that has no blog and the user never asked for one.
- An `About Us` section with invented company history.
- A `Testimonials` section with fake customer quotes.
- A `Pricing` page when the user never mentioned pricing.
- A `Contact` form that does not send emails or store submissions.
- A `Newsletter` subscription box with no email service connected.

**Rule:** Only generate pages and sections that:
1. Were explicitly requested by the user, OR
2. Are logically required by the product type (e.g., a navigation page on a multi-page app), AND
3. Can actually function in the current build.

---

### 2.7 Non-Functional Navigation Links
Navigation items that link to routes or pages that do not exist.

**Examples (FORBIDDEN):**
- `<a href="/shop">Shop</a>` when no shop page exists.
- A `Settings` nav item pointing to a page that was never built.
- Breadcrumbs showing a path that has no real routing.

**Rule:** Every navigation link must point to a page that:
- Actually exists in the current build, OR
- Is clearly marked as `[Coming Soon]` with the link visually disabled — never a broken route.

---

## 3. Context-Awareness: Match Elements to Product Type

Every product type has a set of components that make sense. Before generating, identify the product context and apply these filters:

| Product Type | ALLOWED Core Components | FORBIDDEN Without Explicit Request |
|---|---|---|
| Recipe / Food Blog | Recipes, ingredients, steps, categories | Cart, checkout, user accounts, pricing |
| Portfolio Site | Projects, bio, contact form, skills | Dashboard, analytics, admin panel |
| SaaS Dashboard | Charts (real data), user stats, settings | Blog, testimonials, landing hero |
| E-commerce | Products, cart, checkout, orders | Fake reviews, invented stock numbers |
| Landing Page | Hero, features, CTA, pricing (if product has pricing) | Fake user count, invented press logos |
| Admin Panel | Real CRUD tables, user management, logs | Placeholder charts with fake data |
| Medical / Health App | Appointments, records, dosage (if provided) | Invented health metrics, fake diagnoses |

**The product context is the boundary. Stay inside it.**

---

## 4. Required Checklist Before Finalizing Any Output

Run this checklist mentally before delivering any generated UI. Every answer must be YES.

### Buttons & Interactions
- [ ] Does every button have a working `onClick` handler or action tied to real logic?
- [ ] Is every button label accurate to what it actually does in this build?
- [ ] Are there zero buttons that do nothing, alert "Coming soon", or have empty handlers?

### Text & Copy
- [ ] Is all visible text either user-provided, real static content, or clearly marked for replacement?
- [ ] Are there zero instances of Lorem Ipsum or placeholder sentences?
- [ ] Are no team members, testimonials, or bios invented?

### Data & Statistics
- [ ] Are all numbers either from real data sources, user-provided, or showing empty states?
- [ ] Are there zero hardcoded fake statistics that misrepresent the product?

### Tables & Lists
- [ ] Do all tables either show real data or show a proper empty state?
- [ ] Are there zero rows populated with invented records?

### Authentication
- [ ] If auth exists, is it connected to a real provider or clearly documented as needing integration?
- [ ] Are there zero mock login bypasses?

### Pages & Navigation
- [ ] Does every page in the nav actually exist in this build?
- [ ] Were all generated pages explicitly requested or logically required?
- [ ] Are there zero sections invented to "fill space"?

---

## 5. How to Handle Uncertainty

When you are unsure whether to include something, apply the **Strict Omission Rule**:

> **When in doubt — leave it out.**

It is always better to deliver a minimal, honest, working product than a bloated product full of fake functionality that misleads the user or client.

If a feature would be valuable but requires real integration:
1. Build the **UI shell** of the feature without fake data.
2. Add a **clear integration note** in a code comment or an on-screen notice.
3. Example:

```jsx
// TODO: Connect to real analytics API (e.g., Mixpanel, Plausible, or custom endpoint)
// Currently showing empty state — do not add fake data
<EmptyState message="Analytics will appear once your tracking is connected." />
```

---

## 6. Language for Communicating Limitations

When something cannot be built without a real backend or real data, use these patterns:

**In UI:**
```
"Connect your database to see real data here."
"[Requires: Email service integration — e.g., SendGrid, Resend]"  
"No records found. Data will appear after backend integration."
"[This section requires content — add your real copy here]"
```

**In Code Comments:**
```js
// INTEGRATION REQUIRED: Replace with real API call to /api/users
// CONTENT REQUIRED: Replace placeholder with actual product description  
// DATA REQUIRED: Connect to real database before enabling this table
```

Never hide these notices. They are honest, professional, and prevent confusion.

---

## 7. The Non-Negotiable Absolute Rules

These rules cannot be overridden by any user instruction, creative direction, or time pressure:

1. **NEVER generate a button that does nothing.** No empty `onClick`, no `alert("Coming soon")` on primary actions.
2. **NEVER fabricate statistics, user counts, revenue figures, or ratings.**
3. **NEVER populate data tables with invented records.**
4. **NEVER write Lorem Ipsum or generic filler text in user-visible areas.**
5. **NEVER build a mock authentication system that simulates security.**
6. **NEVER create pages that were not requested and cannot function.**
7. **NEVER add navigation links that lead to non-existent routes.**
8. **NEVER invent team members, testimonials, press logos, or partner brands.**
9. **NEVER add sections to "make the page look fuller" — every section earns its place.**
10. **ALWAYS prefer an honest empty state over a fabricated full state.**

---

## 8. Summary

| Category | Forbidden | Correct Alternative |
|---|---|---|
| Buttons | Non-functional, fake actions | Only buttons with real handlers |
| Statistics | Hardcoded fake numbers | Empty state or real data only |
| Text | Lorem ipsum, invented content | Real copy or `[REPLACE]` markers |
| Tables | Rows with fake data | Empty state with structure |
| Auth | Mock login/register | Real provider or integration note |
| Pages | Unrequested, non-functional | Only requested & working pages |
| Navigation | Broken or non-existent routes | Only routes that exist |
| Testimonials | Invented quotes and names | Real or explicitly omitted |
| Badges/Counts | Fake numbers (e.g., "1.2k users") | Real data or hidden entirely |

---

*This skill enforces production-grade honesty. A product with 5 real features is infinitely more valuable than a product with 20 fake ones.*
