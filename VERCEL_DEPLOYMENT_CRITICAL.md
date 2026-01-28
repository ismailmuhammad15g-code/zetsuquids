# 🚀 CRITICAL: Vercel Deployment Environment Variables

## Problem You Had:
- **Status 504 Gateway Timeout** from routeway.ai
- Your Vercel deployment didn't have `VITE_AI_API_URL` and `VITE_AI_API_KEY` set
- Frontend was falling back to default routeway.ai which is down

## ✅ Solution: Set Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project (e.g., "zetsuguide" or similar)
3. Click **Settings** → **Environment Variables**

### Step 2: Add These Environment Variables

Copy and paste each one:

```
VITE_SUPABASE_URL=https://bfsausazslehkvrdrhcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2F1c2F6c2xlaGt2cmRyaGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMjA1OTMsImV4cCI6MjA4NDg5NjU5M30.wSHzd7_iZViBeObGAfJ_0sB0WawgPIkJGodFFRAmQCU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2F1c2F6c2xlaGt2cmRyaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMDU5MywiZXhwIjoyMDg0ODk2NTkzfQ.rk8yXfpFxhYQAjRhELk3Cq7ZqRxSxlZJ5P0wNqYvPxs
VITE_AI_API_URL=https://api.routeway.ai/v1/chat/completions
VITE_AI_API_KEY=sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA
VITE_AI_MODEL=kimi-k2-0905:free
```

**For each variable:**
1. Paste the name in **Name** field
2. Paste the value in **Value** field
3. Make sure all are set to **Production**
4. Click **Add**

### Step 3: Redeploy
After adding all environment variables:
```bash
git push  # This triggers automatic redeploy
```

OR manually redeploy:
1. Go to Vercel Dashboard
2. Click on your project
3. Click **Deployments**
4. Click **Redeploy** on the latest deployment

### Step 4: Verify
1. Wait 1-2 minutes for deployment
2. Open your site
3. Try sending a message to AI
4. Check browser console (F12) for errors

## 📊 What These Variables Do:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Database connection |
| `VITE_SUPABASE_ANON_KEY` | Frontend DB access |
| `SUPABASE_SERVICE_KEY` | Backend credit system |
| `VITE_AI_API_URL` | Where to send AI requests |
| `VITE_AI_API_KEY` | Authorization for AI API |
| `VITE_AI_MODEL` | Which AI model to use |

## 🔍 If It Still Doesn't Work:

1. **Check Deployment Logs:**
   - Vercel Dashboard → Your Project → Deployments → Click latest → Logs

2. **Check Browser Console (F12):**
   - Look for network errors on `/api/ai` request
   - Response should be JSON, not HTML

3. **Test API Direct (from console):**
   ```javascript
   fetch('/api/ai', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           messages: [{ role: 'user', content: 'test' }],
           model: 'kimi-k2-0905:free',
           skipCreditDeduction: true
       })
   })
   .then(r => r.json())
   .then(console.log)
   ```

## ⚠️ Important Notes:

- **DO NOT** commit `.env` file to GitHub (add to `.gitignore`)
- Vercel environment variables override local `.env`
- Changes take 1-2 minutes to deploy
- Clear browser cache (Ctrl+Shift+Del) if you see old errors

## 📝 Local Development:

Make sure `.env` file has all these variables for local testing:
```
VITE_SUPABASE_URL=https://bfsausazslehkvrdrhcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2F1c2F6c2xlaGt2cmRyaGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMjA1OTMsImV4cCI6MjA4NDg5NjU5M30.wSHzd7_iZViBeObGAfJ_0sB0WawgPIkJGodFFRAmQCU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2F1c2F6c2xlaGt2cmRyaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMDU5MywiZXhwIjoyMDg0ODk2NTkzfQ.rk8yXfpFxhYQAjRhELk3Cq7ZqRxSxlZJ5P0wNqYvPxs
VITE_AI_API_URL=https://api.routeway.ai/v1/chat/completions
VITE_AI_API_KEY=sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA
VITE_AI_MODEL=kimi-k2-0905:free
```

---

**Status:** ✅ Fixed - All environment variables are now in `.env` locally. You just need to add them to Vercel.
