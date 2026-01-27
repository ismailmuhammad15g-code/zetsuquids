# Vercel + Separate Backend Setup Guide

This project uses:
- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on separate server (Railway, Render, Heroku, VPS, etc.)
- **AI API**: Grok API (via backend proxy)

## 🚀 Setup Instructions

### 1. Backend Deployment

Deploy the `/backend` folder to your chosen platform:

#### Option A: Railway
```bash
railway login
railway link
railway up
```

#### Option B: Render
```
1. Connect GitHub repo to Render
2. Create Web Service pointing to /backend
3. Set runtime to Node
```

#### Option C: Heroku / VPS
```bash
# Follow platform-specific deployment docs
```

**After deploying, copy the Backend URL** (e.g., `https://zetsuguide-backend.railway.app`)

### 2. Set Backend Environment Variables

On your backend deployment platform, add these environment variables:

```
GROK_API_KEY=your_actual_grok_api_key_here
GROK_API_URL=https://api.x.ai/v1/chat/completions
GROK_MODEL=grok-2
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
NODE_ENV=production
PORT=5000
```

### 3. Frontend Deployment on Vercel

```bash
# Connect GitHub repo to Vercel
# Or use CLI:
npm install -g vercel
vercel
```

### 4. Set Frontend Environment Variables on Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend-url.com
VITE_AI_MODEL=grok-2
```

**Replace `https://your-backend-url.com` with your actual backend URL** (e.g., `https://zetsuguide-backend.railway.app`)

### 5. Redeploy Frontend

After setting environment variables:

```bash
vercel --prod
```

Or trigger a redeployment via Vercel Dashboard.

## ✅ Verification

1. Open frontend: `https://your-vercel-app.vercel.app`
2. Go to ZetsuGuide AI page
3. Send a test message
4. Check browser console for any errors

### Expected Flow:
```
Frontend (Vercel) 
  → sends message to /api/ai/chat
  → Backend receives at https://your-backend-url/api/ai/chat
  → Backend proxies to Grok API
  → Response flows back
```

## 🔧 Troubleshooting

### Getting 405 errors?
- ❌ API_URL is not set on Vercel (relative path `/api/ai/chat`)
- ✅ Make sure `VITE_API_URL` is set to your backend URL

### Getting connection errors?
- Check backend is running: `https://your-backend-url/api/health`
- Check GROK_API_KEY is set on backend
- Check CORS is allowed in backend (already configured)

### Backend can't find Grok?
- Verify `GROK_API_KEY` environment variable is set
- Verify `GROK_API_URL` is correct
- Check backend logs for error details

## 📝 Project Structure

```
/
├── src/                    # React frontend
├── backend/                # Node.js/Express backend
│   ├── routes/
│   │   ├── ai.js          # AI proxy route
│   │   └── auth.js        # Auth routes
│   └── server.js          # Express server
├── netlify.toml            # ⚠️ DEPRECATED
├── vercel.json             # Vercel config (for frontend)
└── VERCEL_BACKEND_SETUP.md # This file
```

## 🚫 Important Notes

- **Netlify functions are deprecated** - Do NOT use netlify.toml for API routing
- **Backend and Frontend must be on different servers** - API calls use full URL
- **VITE_API_URL is required in production** - Frontend needs to know backend location
- **GROK_API_KEY must be set** - Backend cannot work without it
