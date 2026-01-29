# 🔍 Web Search Integration Setup

ZetsuGuideAI now includes **real web search** capability powered by **Tavily API** (completely free tier available).

## What's New

✅ **Real Web Search**: The AI now searches the web in real-time while thinking  
✅ **Researching Phase**: Shows "researching..." status while searching  
✅ **Sources Display**: Shows all sources used at the bottom of responses  
✅ **Combined Results**: Merges web search results with your guide sources  
✅ **Free Integration**: Uses Tavily's free tier - no credit card required  

## How It Works

When you ask a question:

1. **Thinking...** - AI analyzes your query
2. **Researching...** - API searches web in real-time using Tavily
3. **Diving into guides...** - Searches your internal guides
4. **Generating response...** - Creates comprehensive answer
5. **Sources Used** - Shows all links and sources cited

## Setup Instructions

### Step 1: Get a Free Tavily API Key

1. Visit [https://tavily.com](https://tavily.com)
2. Sign up for free (no credit card required for free tier)
3. Go to your dashboard and copy your API key
4. You get **100 free searches/month** on the free tier

### Step 2: Add Environment Variable to Vercel

1. Go to your Vercel dashboard
2. Select your project (zetsuquids)
3. Go to **Settings → Environment Variables**
4. Add new variable:
   - **Name**: `TAVILY_API_KEY`
   - **Value**: Your API key from Tavily
   - **Environments**: All (Production, Preview, Development)
5. Click "Save"
6. **Trigger a redeploy** by pushing a new commit or using Vercel dashboard

### Step 3: Verify It Works

After Vercel redeploys:
1. Visit your app
2. Ask the AI a question
3. Watch for "Researching..." in the thinking phase
4. Check the response for **"📚 Sources Used"** section with links

## API Implementation Details

### Backend Changes (api/ai.js)

```javascript
// New search function
async function searchWithTavily(query) {
    const tavilyApiKey = process.env.TAVILY_API_KEY
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: tavilyApiKey,
            query: query,
            max_results: 5,
            include_answer: true,
            include_raw_content: false
        })
    })
    return await response.json()
}
```

Search results are automatically included in the AI system prompt, enhancing answer quality.

### Frontend Changes (ZetsuGuideAIPage.jsx)

**New Agent Phase**: `RESEARCHING` 
- Shows "researching..." message during web search
- Occurs between "Thinking..." and "Diving into guides..."
- Lasts ~1 second to allow search API to complete

**Sources Management**:
- Web sources include full URLs (open in new tab)
- Guide sources use internal links (`/guide/slug`)
- Displayed at end of response in "📚 Sources Used" section

## Configuration

### Search Parameters (in api/ai.js)

```javascript
{
    api_key: tavilyApiKey,
    query: query,              // Your question
    max_results: 5,            // Top 5 results
    include_answer: true,      // Summary answer
    include_raw_content: false // Don't include full page content (saves tokens)
}
```

Adjust `max_results` if you want more/fewer search results.

## Free Tier Limits

- **100 searches/month** (free tier)
- **1,000 searches/month** (starter tier, $10/month)
- No credit card required for free tier

## Troubleshooting

### "Researching phase doesn't appear"
- Check if `TAVILY_API_KEY` environment variable is set in Vercel
- Verify Vercel has redeployed (check recent deployments)
- Check browser console for API errors

### "No sources appearing in response"
- Tavily API might be rate-limited if you've exceeded free tier
- Check Tavily dashboard at [https://tavily.com/dashboard](https://tavily.com/dashboard)
- Upgrade to paid tier or wait for monthly reset

### "API returns null search results"
- This is normal if:
  - Tavily API key is not configured (gracefully falls back)
  - Network issue (check server logs in Vercel)
  - Search returned no relevant results

## Fallback Behavior

If Tavily API is not configured or fails:
- ✅ AI still works normally
- ✅ Uses only your internal guides
- ✅ No error messages shown to users
- ⚠️ Missing "researching" phase and web sources

## Monitoring

### Check Search Usage
Visit [https://tavily.com/dashboard](https://tavily.com/dashboard) to see:
- API calls used this month
- Remaining searches in free tier
- API response times

### Server Logs
Check Vercel Function Logs for search-related messages:
- `🔍 Searching with Tavily for: {query}`
- `✅ Found X search results`
- `⚠️ Tavily search failed with status XXX`

## Costs

| Tier | Searches/Month | Price |
|------|---|---|
| Free | 100 | $0 |
| Starter | 1,000 | $10/month |
| Pro | 10,000 | $50/month |
| Enterprise | Unlimited | Custom |

For a production app, estimate:
- 100 users × 5 searches/day = 15,000 searches/month
- Would require "Pro" tier at $50/month

## Advanced: Custom Search Parameters

To customize search behavior, edit the `searchWithTavily` function in [api/ai.js](api/ai.js#L3):

```javascript
// Example: Get more results
max_results: 10,  // Instead of 5

// Example: Include full page content
include_raw_content: true  // More context but uses more tokens

// Example: Add search filters
topic: "technology",  // Narrow down by topic
```

## References

- **Tavily API Docs**: [https://docs.tavily.com](https://docs.tavily.com)
- **Pricing**: [https://tavily.com/pricing](https://tavily.com/pricing)
- **Dashboard**: [https://tavily.com/dashboard](https://tavily.com/dashboard)

---

**Status**: ✅ Search integration deployed and working  
**Last Updated**: January 29, 2026  
**Tested With**: Tavily Free Tier, Vercel Serverless Functions
