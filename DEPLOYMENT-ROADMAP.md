# DevVault Deployment Roadmap

## 📋 Pre-Deployment Checklist

### ✅ Step 1: Supabase Setup (Already Done)
- [x] Create Supabase project
- [x] Get API URL and Anon Key
- [x] Configure `.env` file locally

### ✅ Step 2: Database Setup
Run this SQL in Supabase SQL Editor:
```sql
-- First, drop existing tables if needed
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS guides CASCADE;

-- Then run the full supabase-setup.sql file
```

### ⏳ Step 3: Netlify Deployment

#### 3.1 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub/GitLab/Email

#### 3.2 Deploy Options

**Option A: Deploy via GitHub (Recommended)**
1. Push code to GitHub repository
2. In Netlify: "Add new site" → "Import an existing project"
3. Connect to GitHub and select repository
4. Configure build settings (auto-detected from netlify.toml)
5. Add environment variables
6. Deploy!

**Option B: Manual Deploy (Drag & Drop)**
1. Run `npm run build` locally
2. Drag the `dist` folder to Netlify dashboard

#### 3.3 Environment Variables in Netlify
Go to: Site settings → Environment variables → Add variable

Add these variables:
```
VITE_SUPABASE_URL = https://eynieasoxmpgyhfhbfmd.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⏳ Step 4: Post-Deployment

#### 4.1 Custom Domain (Optional)
1. Go to Domain settings in Netlify
2. Add custom domain
3. Configure DNS records

#### 4.2 Enable HTTPS
- Automatically enabled by Netlify
- Free SSL certificate

---

## 🚀 Quick Deploy Commands

### Local Build Test
```bash
npm run build
npm run preview
```

### Deploy to Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

---

## 📁 Project Structure for Deployment

```
devvault/
├── dist/                    # Build output (auto-generated)
├── public/
│   ├── _redirects          # Netlify redirects for SPA
│   └── guides/             # HTML guide files
├── src/                    # Source code
├── .env                    # Local environment (NOT deployed)
├── .env.example            # Example environment file
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
└── index.html              # Entry point
```

---

## ⚠️ Important Notes

1. **Never commit `.env` file** - It contains secrets
2. **Add environment variables in Netlify dashboard**
3. **The `dist` folder is auto-generated** - Don't commit it
4. **Supabase URL must be accessible** - No IP restrictions

---

## 🔗 Useful Links

- [Netlify Docs](https://docs.netlify.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

## 📞 Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Run `npm install` before build
- Check for TypeScript/ESLint errors

### API Not Working
- Verify environment variables in Netlify
- Check Supabase RLS policies
- Ensure CORS is configured in Supabase

### Routes Not Working (404)
- Verify `_redirects` file exists in `public/`
- Check `netlify.toml` redirects configuration
