# ZetsuGuides Backend

Express.js API Server for Authentication & User Management.

## 🚀 Features

- User Registration with Email Verification
- Login with JWT Authentication
- Password Reset via Email
- Rate Limiting & Security Headers
- Gmail SMTP Integration

## 📦 Deployment Options

This backend can be deployed anywhere:

### Render.com (Recommended - Free)
1. Create a new Web Service
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

### Railway.app
1. New Project → Deploy from GitHub
2. Select `backend` folder
3. Add environment variables

### Heroku
```bash
cd backend
heroku create zetsuguides-api
git push heroku main
heroku config:set KEY=value
```

### VPS (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repo>
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# Run with PM2
npm install -g pm2
pm2 start server.js --name zetsuguides-api
pm2 save
pm2 startup
```

## ⚙️ Environment Variables

```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.netlify.app

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="YourApp" <your@gmail.com>
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/verify-email?token=xxx` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user (protected) |

## 🔒 Security

- Helmet.js for HTTP headers
- Rate limiting (100 req/15min, 10 auth req/hour)
- bcrypt for password hashing (12 rounds)
- JWT with expiration
- CORS configured for frontend only
