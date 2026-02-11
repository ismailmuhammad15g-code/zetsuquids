# 🚀 Cloudinary Setup - 100% FREE (25GB)

## ✅ Why Cloudinary?
- ✅ **25GB FREE storage**
- ✅ **Full CORS support** (no localhost issues!)
- ✅ **Auto retry** on network errors
- ✅ **Real upload progress**
- ✅ **Fast CDN delivery**
- ✅ **No API key needed** (uses unsigned upload)

## 📝 Quick Setup (2 minutes):

### 1. Create FREE Account:
Go to: https://cloudinary.com/users/register_free

### 2. Get Your Cloud Name:
- After signup, go to **Dashboard**
- Copy your **Cloud Name** (e.g., "zetsuguide")

### 3. Create Upload Preset:
- Go to **Settings** → **Upload**
- Scroll to **Upload presets**
- Click **Add upload preset**
- Set:
  - **Preset name**: `support_images`
  - **Signing mode**: **Unsigned** ⚠️ Important!
  - **Folder**: `support-chat`
- Click **Save**

### 4. Update .env File:
Already done! Just update with YOUR values:
```env
VITE_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME_HERE
VITE_CLOUDINARY_UPLOAD_PRESET=support_images
```

### 5. Restart Server:
```bash
npm run dev
```

## 🎯 Features Included:

### ✅ Auto Retry (3 attempts)
If network fails, automatically retries 3 times!

### ✅ Real Progress Bar
Shows actual upload progress based on bytes sent

### ✅ No CORS Issues
Works perfectly with localhost and production

### ✅ Image Auto-Delete After 24h
The SQL script in Supabase will delete URLs after 24 hours

## 🧪 Test It:
1. Upload an image in Direct Support
2. Watch the progress: 5% → 25% → 50% → 75% → 95% → 100%
3. Refresh page - image still there!
4. If network fails - auto retry 3 times!

## 📊 Free Tier Limits:
- Storage: **25 GB**
- Bandwidth: **25 GB/month**
- Transformations: **25,000/month**
- More than enough for support chat! 🚀

---

**Ready! Just update your Cloud Name in .env** 🎉
