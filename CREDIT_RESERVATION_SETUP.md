# Credit Reservation System - Setup Instructions

## 🎯 What This Does

**Before this fix:**
- User types a prompt → Credit deducted immediately (-1)
- If AI fails → User loses credit forever 😢

**After this fix:**
- User types a prompt → Credit **reserved** (temporary, in "black box")
- If AI succeeds → Credit deducted permanently ✅
- If AI fails → Credit **returned** to user 🎉

---

## 📋 Setup Steps

### Step 1: Run SQL Migration in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `bfsausazslehkvrdrhcq`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire content of `supabase_migration_credit_reservation.sql`
6. Click **Run** button

**What this does:**
- Adds `reserved_credits` column to track reserved credits
- Creates 3 SQL functions:
  - `reserve_credit(email)` - Reserve 1 credit before API call
  - `commit_reserved_credit(email)` - Deduct credit after success
  - `release_reserved_credit(email)` - Return credit on error

### Step 2: Verify Migration

After running the SQL, verify it worked:

```sql
-- Check if reserved_credits column exists
SELECT 
    user_email,
    credits,
    reserved_credits,
    (credits - reserved_credits) as available_credits
FROM zetsuguide_credits
LIMIT 5;
```

You should see a `reserved_credits` column (should be 0 for all users initially).

---

## 🧪 Testing

### Test Scenario 1: Normal AI Response (Success)
1. Open your website
2. Go to ZetsuGuide AI page
3. Check your credits (e.g., 10 credits)
4. Type a question and hit Enter
5. **Expected behavior:**
   - Credits immediately show 9 (1 credit reserved)
   - AI responds successfully
   - Credits stay at 9 (reserved credit was committed)
   - Console logs: "Credit reserved!" → "Credit committed!"

### Test Scenario 2: AI Error (Failure)
1. Stop your dev server or disable internet
2. Type a question and hit Enter
3. **Expected behavior:**
   - Credits immediately show 9 (1 credit reserved)
   - AI fails with error
   - Credits return to 10 (reserved credit released!)
   - Error message: "Your credit has been returned."
   - Console logs: "Credit reserved!" → "Credit released!"

---

## 🎨 What Changed in Code

### New Files:
1. ✅ `supabase_migration_credit_reservation.sql` - SQL migration to run in Supabase
2. ✅ `src/lib/creditReservation.js` - Helper functions for credit reservation

### Modified Files:
1. ✅ `src/pages/ZetsuGuideAIPage.jsx` - Now uses credit reservation system
2. ⏳ `src/components/Chatbot.jsx` - TODO: Update this too (same pattern)

---

## 🔄 How It Works (Technical)

```
User sends message
    ↓
1. Reserve 1 credit (temporary lock)
   - credits: 10
   - reserved_credits: 1
   - available: 9
    ↓
2a. AI succeeds?
    → Commit reserved credit
    → credits: 9, reserved_credits: 0
    
2b. AI fails?
    → Release reserved credit
    → credits: 10, reserved_credits: 0 (back to original!)
```

### Database State Examples:

**Initial:**
```
user_email     | credits | reserved_credits | available
---------------|---------|------------------|----------
user@test.com  | 10      | 0                | 10
```

**After pressing Enter (reserved):**
```
user_email     | credits | reserved_credits | available
---------------|---------|------------------|----------
user@test.com  | 10      | 1                | 9
```

**After AI success (committed):**
```
user_email     | credits | reserved_credits | available
---------------|---------|------------------|----------
user@test.com  | 9       | 0                | 9
```

**After AI error (released):**
```
user_email     | credits | reserved_credits | available
---------------|---------|------------------|----------
user@test.com  | 10      | 0                | 10  ← Back to original!
```

---

## 🐛 Troubleshooting

### Error: "function reserve_credit does not exist"
- You didn't run the SQL migration. Go back to Step 1.

### Error: "column reserved_credits does not exist"
- The migration didn't complete. Re-run the SQL migration.

### Credits not being returned on error
- Check browser console for logs: "Credit released!"
- If no logs, check if `releaseReservedCredit()` is being called in catch block

### Reserved credits stuck (not released)
- Run this SQL to reset:
```sql
UPDATE zetsuguide_credits 
SET reserved_credits = 0 
WHERE reserved_credits > 0;
```

---

## ✅ Deployment to Vercel

After testing locally, deploy:

```bash
git add .
git commit -m "feat: Add credit reservation system to prevent loss on AI errors"
git push origin main
```

The SQL functions are already in Supabase, so they'll work in production automatically!

---

## 📝 Next Steps (Optional)

1. Update `Chatbot.jsx` with the same reservation logic (currently TODO)
2. Add visual indicator showing reserved credits (grayed out credit count)
3. Add notification: "Credit reserved..." → "Credit used!" or "Credit returned!"

---

## 🎉 Done!

Your users will never lose credits due to AI errors again! 🚀
