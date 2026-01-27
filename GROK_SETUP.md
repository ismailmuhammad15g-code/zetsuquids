# Grok AI Setup Guide

## Environment Variables Required

Add these to your Vercel environment variables:

### For Backend (Node.js server)
```
GROK_API_KEY=your_grok_api_key_here
GROK_API_URL=https://api.x.ai/v1/chat/completions
GROK_MODEL=grok-2
```

### For Frontend (optional, for testing)
```
VITE_GROK_API_KEY=your_grok_api_key_here
```

## Steps to Setup

### 1. Get Grok API Key
- Go to https://console.x.ai
- Create an API key
- Copy the key

### 2. Add to Vercel
- Go to your Vercel project settings
- Navigate to Environment Variables
- Add:
  - Key: `GROK_API_KEY`
  - Value: `your_api_key`
- Deploy

### 3. Verify Backend Configuration
```bash
# Check if environment variable is loaded
echo $GROK_API_KEY
```

## How It Works

1. **Frontend** sends chat messages to `/api/ai/chat` (Vercel backend)
2. **Backend** proxies request to Grok API with proper authentication
3. **Grok AI** processes and returns response
4. **Backend** forwards response to frontend
5. **Frontend** displays message to user

## Removed Files

All Netlify files have been removed:
- ❌ `netlify/functions/ai.js` (NOT NEEDED - using Vercel only)
- ❌ `netlify.toml` configuration (NOT NEEDED)

## Testing the Setup

1. Hard refresh browser (Ctrl+Shift+R)
2. Go to ZetsuGuide AI page
3. Send a message
4. Should work without 500 errors

## Troubleshooting

### Error: "AI service not configured"
- Check Vercel environment variables are set
- Redeploy after adding variables

### Error: "Invalid API Key"
- Verify Grok API key is correct
- Check it hasn't expired on console.x.ai

### Error: "Timeout after 120s"
- Grok API might be slow
- Try a simpler prompt first
- Check console logs for details

## Backend API Endpoint

```
POST http://localhost:3001/api/ai/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

Response:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Response from Grok..."
      }
    }
  ]
}
```
