# Deployment Checklist ✅

## Your Current Setup

✅ `.env` file exists with:
- `VITE_AI_API_KEY` = sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA
- `VITE_AI_API_URL` = https://api.routeway.ai/v1/chat/completions
- `VITE_AI_MODEL` = kimi-k2-0905:free
- `VITE_SUPABASE_URL` = https://bfsausazslehkvrdrhcq.supabase.co
- `VITE_SUPABASE_ANON_KEY` = (present)
- `SUPABASE_SERVICE_KEY` = (present)

---

## Local Development (Fixed!)

### Run the website locally:
```bash
npm run dev
```

The website should now work at http://localhost:3000 without CORS errors!

**How it works:**
- `vite.config.js` now properly loads `.env` variables
- `/api/ai` endpoint is handled by Vite middleware locally
- All AI requests go through `/api/ai` (no CORS issues)

---

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "fix: Resolve CORS issues with AI API proxy"
git push origin main
```

### Step 2: Set Environment Variables in Vercel

Go to your Vercel project dashboard:
1. **Settings** → **Environment Variables**
2. Add these variables for **Production, Preview, and Development**:

| Variable Name | Value |
|---------------|-------|
| `VITE_AI_API_KEY` | `sk-Bro7uFLHC9E8ioA25YyoXBtF3v8-fYfjs6M4xlT81Ykx2Cn1qYhQvADGpI-dRH280GJHvnPne-dgwwCk7tmoQA` |
| `VITE_AI_API_URL` | `https://api.routeway.ai/v1/chat/completions` |
| `VITE_AI_MODEL` | `kimi-k2-0905:free` |
| `VITE_SUPABASE_URL` | `https://bfsausazslehkvrdrhcq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (copy from your .env) |
| `SUPABASE_SERVICE_KEY` | (copy from your .env) |
| `SUPABASE_URL` | `https://bfsausazslehkvrdrhcq.supabase.co` |

**Important Notes:**
- Make sure to add `SUPABASE_SERVICE_KEY` (without `VITE_` prefix) for the serverless function
- Add both `VITE_SUPABASE_URL` and `SUPABASE_URL` (the serverless function needs both)

### Step 3: Redeploy
After adding environment variables, Vercel will automatically redeploy.

---

## Testing

### Local Testing:
```bash
npm run dev
```

Then test:
1. Go to http://localhost:3000
2. Navigate to ZetsuGuide AI page
3. Ask a question
4. Should work without CORS errors ✅

### Production Testing:
1. Open your Vercel deployment URL
2. Test the AI chatbot
3. Check browser console (F12) - should see no CORS errors

---

## Troubleshooting

### Still getting "Missing AI API Key" error?
1. Make sure `.env` file is in project root (`D:\zetsusave2\.env`)
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Check console logs for "[API Middleware] API Key present: true"

### CORS errors in production?
1. Make sure environment variables are set in Vercel dashboard
2. Redeploy after adding variables
3. Check Vercel function logs for errors

### Chatbot not working?
1. Check browser console (F12) for errors
2. Make sure user is logged in (AI requires authentication)
3. Check if credits are available in Supabase

---

## What Was Fixed

### Files Modified:
1. ✅ `vite.config.js` - Added proper env loading with `loadEnv()`
2. ✅ `api/ai.js` - Added support for `VITE_AI_API_URL` variable
3. ✅ `src/lib/ai.js` - Uses `/api/ai` proxy instead of direct API call
4. ✅ `src/pages/ZetsuGuideAIPage.jsx` - Uses `/api/ai` proxy
5. ✅ `src/components/Chatbot.jsx` - Passes user email to AI function

### How It Works:
```
Frontend → /api/ai → AI Provider (Routeway)
         ↑ (No CORS issue because same origin)
```

**Local**: Vite middleware handles `/api/ai`
**Production**: Vercel serverless function handles `/api/ai`

---

## Next Steps

1. ✅ Run `npm run dev` - should work locally
2. ✅ Add environment variables to Vercel
3. ✅ Push to GitHub and deploy
4. ✅ Test in production

Your website should now work perfectly both locally and on Vercel! 🎉
