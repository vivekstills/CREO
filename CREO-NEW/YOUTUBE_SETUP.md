# 🎥 YouTube API Setup Instructions

## Add Your YouTube API Key

Add this line to your `.env.local` file:

```bash
YOUTUBE_API_KEY=AIzaSyDLaMnVtWIfpc4r9kEPZqHy98NgMmf4dsc
```

## Complete .env.local Example

Your `.env.local` file should look like this:

```bash
# Gemini API Key (you already have this)
GEMINI_API_KEY=your-existing-gemini-key

# YouTube Data API Key (add this line)
YOUTUBE_API_KEY=AIzaSyDLaMnVtWIfpc4r9kEPZqHy98NgMmf4dsc
```

## Steps to Enable YouTube Videos

1. **Add the API key** to `.env.local` (as shown above)

2. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C) then restart
   npm run dev
   ```

3. **Test YouTube Integration**:
   - Go to http://localhost:3000/course
   - Enter any topic
   - ✅ **CHECK** "Include YouTube Videos"
   - Set "Videos per Topic" to 3
   - Click "Generate Course"

## What to Expect

With YouTube API enabled, each topic will include:
- 📹 3 curated educational videos
- View counts and ratings
- Direct YouTube links
- Video thumbnails
- Channel information

## Test Your YouTube API

Run this command to verify YouTube is working:
```bash
node -e "console.log('YouTube API Key:', process.env.YOUTUBE_API_KEY ? '✅ Configured' : '❌ Not found')"
```

## Important Notes

⚠️ **Security**: Never commit `.env.local` to git
📊 **Quota**: YouTube API has a daily quota (10,000 units)
🔍 **Quality**: Videos are automatically ranked by views and likes

## Quick Test

Try generating a course for:
- Topic: "React Hooks"
- Include Videos: ✅ Checked
- Videos per Topic: 3

You should see YouTube videos embedded in each topic!

---

**Ready to go!** Your YouTube API is now configured. Generate a course with videos enabled to see it in action!
