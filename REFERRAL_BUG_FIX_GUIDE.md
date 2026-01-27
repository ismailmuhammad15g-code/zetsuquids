# Referral Bonus Bug Fix Guide

## The Problem
You referred 3 friends but only show +0 bonus received, even though they earned their 5 credits. The referrer (you) should have gotten +5 credits × 3 = +15 credits total.

## The Solution

### Step 1: Run the SQL Migration
**File:** `supabase/fix_referral_bonus.sql`

1. Go to your Supabase Dashboard
2. Click "SQL Editor"
3. Create a new query
4. Copy the entire contents of `supabase/fix_referral_bonus.sql`
5. Click "Run"

**What it does:**
- Fixes email casing issues (ensures all emails are lowercase for matching)
- Recalculates total_referrals counts from actual referral records
- Awards missing bonus credits to referrers
- Creates the `referral_notifications` table for real-time notifications
- Sets up triggers to automatically log notifications

### Step 2: Files Updated
The following files have been automatically updated:

1. **`src/components/ReferralBonusNotification.jsx`** (NEW)
   - Real-time WebSocket listener for referral notifications
   - Beautiful toast-style popup that appears when someone uses your code
   - Shows: "@{username} invited! you got 5 credit"
   - Auto-dismisses after 5 seconds

2. **`src/components/Layout.jsx`** (UPDATED)
   - Added `ReferralBonusNotification` component
   - Now listens for referral bonuses across all pages

3. **`api/claim_referral.js`** (UPDATED)
   - Now inserts notification into `referral_notifications` table
   - Ensures referrer gets the +5 credits bonus
   - Sends real-time signal to trigger the popup

### Step 3: Expected Behavior After Fix

When someone signs up with your referral code:
1. ✅ They receive +5 credits
2. ✅ You receive +5 credits (THIS WAS THE BUG - NOW FIXED)
3. ✅ A beautiful popup appears in real-time: "🎉 Referral Bonus! +5 credits earned! Your friend {username} just signed up!"
4. ✅ Your total_referrals count increments
5. ✅ The credits are immediately visible on the Pricing page

### Step 4: Database Schema Changes
New table created: `referral_notifications`
```sql
- id (UUID, primary key)
- referrer_email (text) - Who gets the bonus
- referred_email (text) - Who signed up
- credit_amount (integer) - Always 5
- created_at (timestamp) - When the bonus was earned
- read (boolean) - Whether user has seen it
```

## Testing the Fix

1. Ask 2-3 friends to sign up with your referral code
2. You should see a real-time popup appear immediately
3. Check your credits - should increase by 5 for each signup
4. Your "Bonus Received" should show +15 (if 3 referrals)

## Troubleshooting

If you still don't see the credits:
1. Check if emails are lowercase in the database
2. Verify referral_code is stored correctly
3. Check browser console for any errors
4. Verify RLS policies on referral_notifications table allow SELECT/INSERT

## Referral Commission Structure
- **New User Bonus:** +5 credits
- **Referrer Bonus:** +5 credits per successful referral
- **Total Value:** +10 credits per signup (5 for you, 5 for friend)
