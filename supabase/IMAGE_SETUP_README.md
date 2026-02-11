# 📸 Image Support Setup - Auto Delete After 24 Hours

## 🎯 What This Does:
- ✅ Saves image URLs in Supabase database
- ✅ Shows images after page refresh
- ✅ **Automatically deletes image URLs after 24 hours**
- ✅ Keeps your database clean and saves space
- ✅ Images remain on ImgBB (free hosting) but links removed from DB

## 📝 Setup Instructions:

### Option 1: Simple Method (RECOMMENDED) ⭐
Uses a trigger - no cron jobs needed!

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the content of: `supabase/auto_delete_images_simple.sql`
5. Click **Run** (or press F5)
6. ✅ Done! Images will auto-delete after 24h

### Option 2: Advanced Method (with pg_cron)
Uses scheduled jobs - more precise timing

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor**
3. Copy and paste: `supabase/add_image_support.sql`
4. Click **Run**
5. ⚠️ Note: Requires pg_cron extension (may not be available on free tier)

## 🧪 Testing:

### Test Image Upload:
1. Upload an image in Direct Support Chat
2. Refresh the page - image should still be there ✅
3. Wait 24+ hours
4. Image URL will be automatically deleted from database
5. Message remains, but image link is gone

### Manual Cleanup (Optional):
Run this in SQL Editor to delete old images immediately:
```sql
SELECT cleanup_old_image_urls();
```

### Check Current Images:
```sql
SELECT id, message, image_url, created_at
FROM support_messages
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;
```

## 🔧 How It Works:

### Trigger Method (Simple):
- Every time someone uploads an image
- Trigger automatically checks for old images (24h+)
- Deletes their URLs automatically
- No cron jobs needed!

### Cron Method (Advanced):
- Runs every hour automatically
- Checks all messages
- Deletes image URLs older than 24 hours

## 📊 Database Schema:

```sql
support_messages:
  - id (uuid)
  - conversation_id (uuid)
  - message (text)
  - image_url (text) ← NEW! Auto-deleted after 24h
  - sender_type (text)
  - sender_name (text)
  - created_at (timestamp)
```

## ⚠️ Important Notes:

1. **ImgBB keeps images forever** - only the URL link is deleted from your DB
2. **After 24h**: Image URL removed from DB = image won't load
3. **Privacy**: Old sensitive images won't be accessible after 24h
4. **Space**: Keeps your database small and efficient
5. **Cost**: No storage cost after 24h (free!)

## 🚀 Already Done in Code:

The React component (`DirectSupportChat.jsx`) is already updated to:
- ✅ Save `image_url` to database
- ✅ Load images from database on refresh
- ✅ Show images in chat messages
- ✅ Handle missing images gracefully

## 🎨 Features:

- 📸 Upload images with progress bar (0-100%)
- 🔄 Images persist after page refresh
- 🗑️ Auto-cleanup after 24 hours
- 💾 Free hosting on ImgBB
- 🔒 Secure and private

---

**Ready to test!** Just run one of the SQL files above. 🚀
