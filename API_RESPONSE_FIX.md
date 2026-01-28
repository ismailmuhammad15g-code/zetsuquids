# ✅ API Response Format Fix

## Problem
**Error: "Error parsing content."** in the ZetsuGuide AI page

### Root Cause
The AI API returns responses in **OpenAI format**:
```json
{
  "choices": [{
    "message": {
      "content": "..."
    }
  }],
  ...
}
```

But the frontend expected a **custom format**:
```json
{
  "content": "...",
  "publishable": true
}
```

This mismatch caused the frontend to fail parsing the response.

---

## Solution
Updated the API proxy ([api/ai.js](api/ai.js)) to **transform the response** before sending it back to the frontend.

### Changes Made:

1. ✅ **Added response transformation for both skipCreditDeduction and normal flows**
   - Extracts `content` from `data.choices[0].message.content`
   - Always sets `publishable: true` by default
   - Still passes through the original OpenAI response for compatibility

2. ✅ **Enhanced error handling**
   - Catches timeout errors (504)
   - Catches parse errors (502)
   - Provides clear error messages to frontend

3. ✅ **Added timeout configuration**
   - 30 second timeout on fetch calls
   - Prevents hanging requests

---

## How It Works Now

**Frontend sends:** `{ messages, model, skipCreditDeduction }`
         ↓
**API receives:** Calls routeway.ai API
         ↓
**OpenAI response:** `{ choices: [{ message: { content: "..." } }] }`
         ↓
**API transforms to:**
```json
{
  "choices": [{ "message": { "content": "..." } }],
  "content": "...",
  "publishable": true
}
```
         ↓
**Frontend receives:** Both formats available for parsing

---

## Testing

Try sending an AI message in ZetsuGuide:
1. Open the site
2. Go to ZetsuGuide AI page
3. Send a message (any prompt will work)
4. Should see the response without "Error parsing content"

---

## Files Modified:
- [api/ai.js](api/ai.js) - Response transformation logic

**Status:** ✅ FIXED
