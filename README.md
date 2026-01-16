# ZetsuGuides - AI-Powered Developer Knowledge Base

A modern, full-stack platform for developers to create, organize, and explore coding guides with an intelligent AI assistant. Built with React, Node.js, and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## ✨ Features

### 🤖 ZetsuGuide AI
- **Intelligent Chat Assistant**: AI-powered coding assistant with context-aware responses
- **Guide-Aware**: AI searches and references your guides automatically
- **Multi-language Support**: Works with English and Arabic seamlessly
- **Code Highlighting**: Beautiful syntax highlighting for code blocks
- **Chat History**: Persistent conversation history for logged-in users
- **Credit System**: Fair-use credit system with referral rewards

### 📚 Guides Management
- **Create & Organize**: Write guides in Markdown with live preview
- **Full-Text Search**: Fast search across all guides with keyword highlighting
- **Slug-based URLs**: Clean, SEO-friendly URLs for all guides
- **HTML & Markdown Support**: Import existing HTML guides or write in Markdown
- **Keyword Tagging**: Automatic keyword extraction and manual tagging
- **Beautiful Viewer**: Professional guide rendering with responsive design

### 👤 User Authentication
- **Email/Password Registration**: Secure account creation with email verification
- **JWT Authentication**: Token-based authentication system
- **Password Reset**: Email-based password recovery
- **Protected Routes**: Secure access to user-specific features
- **Profile Management**: User profile with credits display

### 💰 Credits & Referrals
- **Free Credits**: 5 free AI credits for all new users
- **Referral System**: Earn 5 credits per successful referral
- **Transparent Pricing**: Clear credit usage for AI queries
- **Upgradeable Plans**: Multiple tiers for power users

### 🎨 Modern UI/UX
- **Dark Theme**: Professional black & white aesthetic
- **Spotlight Effects**: Dynamic visual effects with Aceternity UI
- **Responsive Design**: Mobile-first, works on all devices
- **Smooth Animations**: Framer Motion powered transitions
- **Modern Components**: Shimmer buttons, meteors, confetti effects

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Aceternity UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **Markdown**: Marked.js + @tailwindcss/typography
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer (Gmail SMTP)
- **Security**: Helmet, rate limiting, CORS

### Deployment
- **Frontend**: Netlify (with Netlify Functions)
- **Backend**: Render.com / Railway.app / VPS
- **Database**: Supabase Cloud
- **AI API**: Proxy through backend/Netlify Functions

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **Supabase** account (free tier works)
- **Gmail** account (for email functionality in backend)
- **Git** installed

### Frontend Setup

1. **Clone the repository**
```bash
git clone https://github.com/ismailmuhammad15g-code/zetsuquids.git
cd zetsuquids
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up Supabase**

- Go to [supabase.com](https://supabase.com) and create a new project
- Get your project URL and anon key from **Settings → API**

4. **Create database tables**

Run the `supabase-setup.sql` file in your Supabase SQL editor. This will create:
- `guides` table with full-text search indexes
- `zetsuguide_credits` table for user credits
- `chat_history` table for AI conversations
- `users` table for authentication
- All necessary RLS policies and triggers

5. **Configure frontend environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

6. **Run the frontend development server**

```bash
npm run dev
```

The app will open at [http://localhost:3003](http://localhost:3003)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Configure backend environment variables**

Create a `.env` file in the `backend` directory (use `backend/.env.example` as reference):

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3003

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Gmail SMTP (for email verification)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="ZetsuGuides" <your-email@gmail.com>

# AI API (optional - for AI chat)
AI_API_URL=https://api.routeway.ai/v1/chat/completions
AI_API_KEY=your_ai_api_key
AI_MODEL=kimi-k2-0905:free
```

**Note**: For Gmail, you need to generate an [App Password](https://support.google.com/accounts/answer/185833).

4. **Run the backend server**

```bash
npm start
```

The API will run at [http://localhost:5000](http://localhost:5000)

### Verify Installation

1. Open [http://localhost:3003](http://localhost:3003)
2. Click "Sign Up" to create an account
3. Check your email for verification link
4. After verification, login and try:
   - Creating a guide
   - Chatting with ZetsuGuide AI
   - Viewing your referral code in Pricing page

## 📖 Usage Guide

### Creating a Guide

1. **From the homepage**, click "Create Guide" or navigate to `/guides`
2. **Fill in the guide details**:
   - **Title**: A descriptive title for your guide
   - **Slug**: URL-friendly identifier (auto-generated from title)
   - **Content**: Write in Markdown format
   - **Keywords**: Comma-separated tags for better searchability
3. **Preview** your guide in real-time as you type
4. **Save** to publish your guide

### Searching Guides

- Use the **search bar** on the guides page
- Search works across:
  - Guide titles
  - Guide content (full-text)
  - Keywords/tags
- Results show **highlighted matches**
- **Click any guide** to view full content

### Using ZetsuGuide AI

1. **Navigate to** [ZetsuGuide AI](http://localhost:3003/zetsuguide-ai)
2. **Ask coding questions** in English or Arabic
3. **AI automatically searches** your guides for relevant context
4. **View references** - AI shows which guides it referenced
5. **Continue conversations** - chat history is saved for logged-in users
6. **Monitor credits** - displayed in the top right corner

#### AI Query Examples:
```
- "How do I deploy a React app to Netlify?"
- "Explain JWT authentication"
- "كيف أقوم بإعداد قاعدة بيانات Supabase؟"
- "What are the best practices for React hooks?"
```

### Managing Your Account

#### View Credits
- Check remaining credits in the **user menu** (top right)
- Navigate to **Pricing** page for detailed breakdown

#### Earn More Credits
1. Go to **Pricing** page
2. Copy your **unique referral link**
3. Share with friends and colleagues
4. Earn **5 credits** for each successful referral
5. Referred users get **5 free credits** too!

#### Password Reset
1. Click "Forgot Password" on login page
2. Enter your email
3. Check your inbox for reset link
4. Create new password

## 📁 Project Structure

```
zetsuquids/
├── backend/                    # Express.js API Server
│   ├── config/
│   │   └── db.js              # Supabase client configuration
│   ├── routes/
│   │   └── auth.js            # Authentication endpoints
│   ├── services/
│   │   └── email.js           # Email service (Nodemailer)
│   ├── database/
│   │   └── queries.js         # Database queries
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env.example           # Backend environment template
│
├── src/                       # React Frontend
│   ├── components/
│   │   ├── Layout.jsx         # Main layout wrapper
│   │   ├── Navbar.jsx         # Navigation bar
│   │   └── ui/                # Aceternity UI components
│   ├── contexts/
│   │   └── AuthContext.jsx   # Authentication context
│   ├── lib/
│   │   ├── api.js             # API client & Supabase
│   │   ├── supabase.js        # Supabase configuration
│   │   └── utils.js           # Utility functions
│   ├── pages/
│   │   ├── HomePage.jsx       # Landing page
│   │   ├── AllGuidesPage.jsx  # Guides listing
│   │   ├── GuidePage.jsx      # Single guide view
│   │   ├── ZetsuGuideAIPage.jsx # AI chat interface
│   │   ├── AuthPage.jsx       # Login/Register
│   │   ├── PricingPage.jsx    # Credits & pricing
│   │   └── *.jsx             # Other pages
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
│
├── public/
│   ├── _redirects             # Netlify SPA redirects
│   └── guides/                # Legacy HTML guides
│
├── netlify/
│   └── functions/
│       └── ai.js              # Netlify function for AI proxy
│
├── .env.example               # Frontend environment template
├── netlify.toml               # Netlify configuration
├── package.json               # Frontend dependencies
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js             # Vite configuration
├── supabase-setup.sql         # Database schema
└── README.md                  # This file
```

## 🔧 Database Schema

### Main Tables

#### `users`
```sql
- id: UUID (primary key)
- email: TEXT (unique, not null)
- password_hash: TEXT (not null)
- email_verified: BOOLEAN (default false)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `guides`
```sql
- id: BIGSERIAL (primary key)
- title: TEXT (not null)
- slug: TEXT (unique, not null)
- content: TEXT (markdown)
- html_content: TEXT (rendered HTML)
- keywords: TEXT[] (array of tags)
- content_type: TEXT (default 'markdown')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `zetsuguide_credits`
```sql
- user_email: TEXT (primary key)
- credits: INTEGER (default 5)
- referral_code: TEXT (unique)
- referred_by: TEXT
- total_referrals: INTEGER (default 0)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `chat_history`
```sql
- id: BIGSERIAL (primary key)
- user_email: TEXT (not null)
- conversation_id: TEXT (not null)
- role: TEXT ('user' or 'assistant')
- content: TEXT (not null)
- created_at: TIMESTAMPTZ
```

### Indexes
- Full-text search on guide titles and content
- B-tree index on slugs for fast lookups
- GIN index on keywords for array searches

## 🚀 Deployment

### Frontend Deployment (Netlify)

#### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Connect to Netlify**
- Go to [netlify.com](https://netlify.com)
- Click "Add new site" → "Import an existing project"
- Connect your GitHub repository
- Netlify auto-detects configuration from `netlify.toml`

3. **Add Environment Variables**
Go to Site settings → Environment variables, add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. **Deploy**
- Click "Deploy site"
- Netlify builds and deploys automatically
- Get your live URL: `https://your-site.netlify.app`

#### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Option 3: Manual Build

```bash
# Build locally
npm run build

# Drag & drop the 'dist' folder to Netlify dashboard
```

### Backend Deployment

#### Option 1: Render.com (Recommended - Free)

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add all environment variables from `backend/.env.example`
6. Deploy

#### Option 2: Railway.app

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables
5. Deploy

#### Option 3: VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/ismailmuhammad15g-code/zetsuquids.git
cd zetsuquids/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your values

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name zetsuguides-backend
pm2 save
pm2 startup

# Setup Nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy port 5000
```

### Post-Deployment Setup

1. **Update Frontend URL in Backend**
```env
FRONTEND_URL=https://your-site.netlify.app
```

2. **Update Backend URL in Frontend**
```env
VITE_API_URL=https://your-backend.render.com
```

3. **Configure Supabase**
- Add your deployment URLs to Supabase **Authentication → URL Configuration**
- Update redirect URLs for email verification

4. **Test Everything**
- [ ] Sign up flow with email verification
- [ ] Login/logout
- [ ] Create a guide
- [ ] Search guides
- [ ] AI chat functionality
- [ ] Referral system

## 🔌 API Documentation

### Authentication Endpoints

Base URL: `http://localhost:5000/api/auth` (development)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "referralCode": "OPTIONAL123" // optional
}

Response: 201 Created
{
  "message": "Registration successful! Please check your email.",
  "userId": "uuid-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### Verify Email
```http
GET /api/auth/verify-email?token=verification_token

Response: 200 OK (redirects to frontend)
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "new_secure_password"
}

Response: 200 OK
{
  "message": "Password reset successful"
}
```

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer jwt_token

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "emailVerified": true
}
```

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Authentication**: 10 requests per hour per IP
- **AI Chat**: 5 requests per minute per user

### Error Responses
```json
{
  "error": "Error message",
  "details": "Additional information"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🛡️ Security Features

### Authentication & Authorization
- **bcrypt password hashing** (12 rounds)
- **JWT tokens** with expiration (7 days default)
- **Email verification** required for account activation
- **Password reset** via secure email tokens
- **Protected routes** with middleware validation

### Security Headers (Helmet.js)
- XSS Protection
- Content Security Policy
- DNS Prefetch Control
- Frame Guard (clickjacking protection)
- HSTS (Strict Transport Security)

### Rate Limiting
- Per-IP rate limiting on authentication endpoints
- User-based rate limiting for AI queries
- Prevents brute force and DDoS attacks

### Database Security
- **Row Level Security (RLS)** enabled on all tables
- Parameterized queries to prevent SQL injection
- Service role key kept server-side only
- CORS configured for specific origins only

### Environment Variables
- All secrets stored in `.env` files
- Never committed to version control
- Different configurations for dev/prod
- Secure key rotation recommended

## 🧪 Development

### Running Tests
```bash
# Frontend tests (if implemented)
npm test

# Backend tests (if implemented)
cd backend && npm test
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Development Tips

1. **Hot Module Replacement**: Frontend auto-reloads on changes
2. **Backend Nodemon**: Use `npm run dev` for auto-restart
3. **Database Migrations**: Run SQL files in order from Supabase dashboard
4. **Debug Mode**: Set `NODE_ENV=development` for verbose logging

### Debugging

#### Frontend Issues
- Check browser console for errors
- Verify environment variables are loaded
- Check network tab for API calls
- Verify Supabase connection

#### Backend Issues
- Check server logs for errors
- Verify all environment variables are set
- Test endpoints with Postman/Thunder Client
- Check database connectivity

#### Database Issues
- Verify RLS policies are correct
- Check indexes are created
- Monitor query performance
- Review Supabase logs

## 📝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 🗺️ Roadmap

### Current Features ✅
- [x] User authentication with email verification
- [x] Guide creation and management
- [x] Full-text search across guides
- [x] AI-powered chat assistant
- [x] Credit and referral system
- [x] Multi-language support (English/Arabic)
- [x] Responsive design
- [x] Dark theme UI

### Planned Features 🚧
- [ ] Rich text editor for guides (WYSIWYG)
- [ ] Guide versioning and history
- [ ] Collaborative editing
- [ ] Guide templates
- [ ] Export guides to PDF/Markdown
- [ ] Advanced AI models integration (GPT-4, Claude)
- [ ] Code playground integration
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] API webhooks
- [ ] Team workspaces
- [ ] Guide analytics
- [ ] Custom domains for guides
- [ ] Theme customization

### Known Issues 🐛
- Chat history pagination needs improvement for large conversations
- Some markdown edge cases not fully supported
- AI occasionally references non-existent guides (hallucination)

If you encounter any bugs, please [open an issue](https://github.com/ismailmuhammad15g-code/zetsuquids/issues).

## �� Support

### Getting Help
- 📚 Check the documentation in this README
- 💬 [Open a Discussion](https://github.com/ismailmuhammad15g-code/zetsuquids/discussions)
- 🐛 [Report a Bug](https://github.com/ismailmuhammad15g-code/zetsuquids/issues)
- ✨ [Request a Feature](https://github.com/ismailmuhammad15g-code/zetsuquids/issues)

### FAQ

**Q: Is this free to use?**
A: Yes! The project is open source under MIT license. You can use, modify, and deploy it freely.

**Q: Do I need to pay for Supabase?**
A: Supabase offers a generous free tier that's perfect for personal use and small projects.

**Q: Can I use a different database?**
A: The app is built around Supabase (PostgreSQL), but you can adapt it to other databases with modifications.

**Q: How do I get more AI credits?**
A: New users get 5 free credits. You can earn more by referring friends (5 credits per referral).

**Q: Can I self-host this?**
A: Absolutely! See the deployment section for VPS instructions.

**Q: Is my data private?**
A: If you self-host, you have complete control over your data. With the default deployment, data is stored in your own Supabase instance.

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 ZetsuGuides

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👏 Acknowledgments

- **[Aceternity UI](https://ui.aceternity.com/)** - Beautiful UI components
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Marked.js](https://marked.js.org/)** - Markdown parser
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Express.js](https://expressjs.com/)** - Fast, minimalist web framework
- **[Nodemailer](https://nodemailer.com/)** - Email sending library

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=ismailmuhammad15g-code/zetsuquids&type=Date)](https://star-history.com/#ismailmuhammad15g-code/zetsuquids&Date)

---

<div align="center">

**Built with ❤️ for developers who value organized knowledge**

[Report Bug](https://github.com/ismailmuhammad15g-code/zetsuquids/issues) • [Request Feature](https://github.com/ismailmuhammad15g-code/zetsuquids/issues)

</div>
