# AI Setup Guide for ZetsuGuide

## 🚨 Quick Fix for "Missing AI API Key" Error

Your website needs an AI API key to work. Follow these steps:

---

## Step 1: Get a FREE API Key

### Option A: Routeway AI (Recommended - 100% Free)
1. Go to https://routeway.ai
2. Click "Sign Up" or "Get API Key"
3. Create a free account
4. Copy your API key from the dashboard
5. **Model to use**: `kimi-k2-0905:free` (completely free)

### Option B: OpenRouter (Alternative)
1. Go to https://openrouter.ai
2. Sign up for free
3. Get your API key
4. **Free models**: `meta-llama/llama-3.2-3b-instruct:free`

---

## Step 2: Create `.env.local` File

Create a file named `.env.local` in your project root (`D:\zetsusave2\.env.local`)

### For Routeway AI:
```env
# AI Provider: Routeway
VITE_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_AI_MODEL=kimi-k2-0905:free

# Supabase (if you have it)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### For OpenRouter:
```env
# AI Provider: OpenRouter
VITE_AI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_AI_MODEL=meta-llama/llama-3.2-3b-instruct:free
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions

# Supabase (if you have it)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 3: Update Configuration Files

If you're using **OpenRouter** instead of Routeway, update these files:

### `vite.config.js` (line 24):
```javascript
const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
const response = await fetch(apiUrl, {
```

### `api/ai.js` (line 38):
```javascript
const apiUrl = process.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
const response = await fetch(apiUrl, {
```

---

## Step 4: Run the Project

```bash
# Install dependencies (if not done)
npm install

# Run development server
npm run dev
```

---

## Step 5: Deploy to Vercel

Add environment variables in Vercel dashboard:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - `ROUTEWAY_API_KEY` = your_api_key
   - `VITE_SUPABASE_URL` = your_supabase_url
   - `SUPABASE_SERVICE_KEY` = your_service_key (from Supabase settings)

---

## Troubleshooting

### "Missing AI API Key" Error
- Make sure `.env.local` exists in project root
- Check that `VITE_AI_API_KEY` is set correctly
- Restart the dev server after creating `.env.local`

### CORS Error
- This should be fixed now with the proxy setup
- Make sure you're using `/api/ai` endpoint (already configured)

### Credit Deduction Issues
- Make sure `SUPABASE_SERVICE_KEY` is set in Vercel
- Check Supabase table `zetsuguide_credits` exists

---

## Free AI Providers Comparison

| Provider | Free Tier | Best Free Model | Signup |
|----------|-----------|-----------------|--------|
| **Routeway** | Unlimited | kimi-k2-0905:free | https://routeway.ai |
| **OpenRouter** | $1 free credit | llama-3.2-3b:free | https://openrouter.ai |
| **Groq** | 14400 req/day | llama-3.3-70b | https://groq.com |

---

## Need Help?

If you're still having issues:
1. Check the browser console (F12) for errors
2. Check if `.env.local` file is in the correct location
3. Make sure you restarted the dev server after adding `.env.local`
