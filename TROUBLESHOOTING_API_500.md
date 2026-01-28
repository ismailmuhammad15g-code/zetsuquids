# 🔧 TROUBLESHOOTING GUIDE - API Error 500

## Error You're Seeing:
```
Failed to load resource: the server responded with a status of 500
AI API Error Response: 500 {"error":"Unexpected token < in JSON at position 0"}
```

---

## Quick Fix (Try This First):

### Step 1: Stop the dev server
Press `Ctrl + C` in the terminal

### Step 2: Clear cache and restart
```bash
# Delete node_modules/.vite folder
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

### Step 3: Check terminal logs
Look for these lines in the terminal:
```
[API Middleware] Initialized
[API Middleware] API Key present: true
[API Middleware] API URL: https://api.routeway.ai/v1/chat/completions
```

If you see `API Key present: false`, your `.env` file is not being loaded.

---

## Detailed Diagnosis:

### Test 1: Check if API works directly
```bash
node test-api.js
```

**Expected output:**
```
✅ Success! Response: { ... }
```

**If this fails:** Your API key is invalid or Routeway is down.

### Test 2: Check if `.env` is loaded
Open browser console (F12) and check for these logs when you send a message:
```
[API Middleware] Received request for model: kimi-k2-0905:free
[API Middleware] Calling AI API...
[API Middleware] Response status: 200
[API Middleware] Success! Got AI response
```

### Test 3: Check Network tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Send an AI message
4. Find the request to `/api/ai`
5. Check:
   - **Request Headers:** Should have `Content-Type: application/json`
   - **Request Payload:** Should have `messages`, `model`, `skipCreditDeduction`
   - **Response:** Should be JSON, not HTML

---

## Common Issues & Fixes:

### Issue 1: "Unexpected token < in JSON"
**Cause:** The middleware is returning HTML error page instead of JSON
**Fix:** Check if `fetch` is failing in the middleware

**Solution:**
1. Update `vite.config.js` (already done ✅)
2. Restart dev server
3. Check terminal logs

### Issue 2: API Key not loaded
**Symptoms:**
- Terminal shows: `API Key present: false`
- Error: "Missing AI API Key"

**Solution:**
```bash
# Check if .env exists
Get-Content .env | Select-String "VITE_AI_API_KEY"

# Should output:
# VITE_AI_API_KEY=sk-Bro7uFLHC9E8ioA25...
```

If `.env` doesn't exist or API key is missing:
1. Create `.env` file in project root
2. Add: `VITE_AI_API_KEY=sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA`
3. Restart dev server

### Issue 3: Routeway API is down
**Test:**
```bash
node test-api.js
```

**If it fails:**
- Routeway.ai might be down
- Try alternative: OpenRouter (https://openrouter.ai)
- Update `.env`:
  ```
  VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
  VITE_AI_MODEL=meta-llama/llama-3.2-3b-instruct:free
  ```

### Issue 4: Credit reservation functions not found
**Symptoms:**
- Error: "function reserve_credit does not exist"
- Credits not being reserved

**Solution:**
1. Run the SQL migration in Supabase
2. Open file: `supabase_migration_credit_reservation.sql`
3. Go to Supabase → SQL Editor
4. Paste and Run

---

## Step-by-Step Reset (Nuclear Option):

If nothing works, do this:

```bash
# 1. Stop dev server
Ctrl + C

# 2. Clear all caches
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force dist

# 3. Reinstall dependencies
npm install

# 4. Verify .env file
Get-Content .env | Select-String "VITE_AI"

# 5. Start dev server
npm run dev
```

---

## Check Your Setup:

### ✅ Checklist:
- [ ] `.env` file exists in project root
- [ ] `VITE_AI_API_KEY` is set in `.env`
- [ ] `vite.config.js` has `loadEnv()` (updated file)
- [ ] Terminal shows `[API Middleware] Initialized`
- [ ] Terminal shows `API Key present: true`
- [ ] `node test-api.js` returns success
- [ ] SQL migration ran in Supabase

---

## Still Not Working?

### Check Terminal Output:
When you send an AI message, you should see:
```
[API Middleware] Received request for model: kimi-k2-0905:free
[API Middleware] Calling AI API...
[API Middleware] Response status: 200
[API Middleware] Success! Got AI response
```

If you don't see these logs:
1. The middleware might not be running
2. The request might not be reaching `/api/ai`
3. Check if you're running on the correct port (3000)

### Check Browser Console:
You should see:
```
Reserving 1 credit...
Credit reserved! Available: 9
AI response successful! Committing reserved credit...
Credit committed! New balance: 9
```

If you see errors about SQL functions, run the migration.

---

## Emergency Fallback:

If `/api/ai` still doesn't work, you can temporarily use the direct API call (bypasses middleware):

**Temporary Fix (NOT recommended for production):**

In `src/pages/ZetsuGuideAIPage.jsx`, change line 1342:
```javascript
// FROM:
const response = await fetch('/api/ai', {

// TO (temporary):
const response = await fetch('https://api.routeway.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA'
    },
```

**⚠️ Warning:** This exposes your API key in the browser! Only use for testing!

---

## Contact:
If none of these fixes work, check:
1. Terminal logs when you start `npm run dev`
2. Browser console (F12) when you send a message
3. Network tab (F12) for the `/api/ai` request

The logs will tell us exactly what's failing.
