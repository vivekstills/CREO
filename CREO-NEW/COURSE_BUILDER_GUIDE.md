# LearnLoop Course Builder - Complete Guide

## 🎯 Overview

LearnLoop is an AI-powered course generation platform that creates comprehensive, structured courses with curated YouTube videos. It uses Google's Gemini AI to generate course content and the YouTube Data API to fetch relevant, highly-rated educational videos.

## 🚀 Key Features

- **AI-Powered Course Generation**: Uses Gemini AI to create structured course content
- **Video Curation**: Automatically fetches and ranks YouTube videos by quality and relevance
- **Structured JSON Output**: All courses are generated in a clean, structured JSON format
- **Interactive UI**: Expandable modules and topics with embedded video previews
- **Export Functionality**: Download courses as JSON for integration with other systems
- **Quality Metrics**: Videos are ranked by view count, likes, and engagement ratio

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Google Cloud Account** with:
   - Gemini API enabled
   - YouTube Data API v3 enabled
3. **API Keys** configured in `.env.local`

## 🔧 Setup Instructions

### 1. Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable:
- **Generative Language API** (for Gemini)
- **YouTube Data API v3** (for video fetching)

### 2. Configure Environment Variables

Create `.env.local` file:
```bash
# Required API Keys
GEMINI_API_KEY=your-gemini-api-key-here
YOUTUBE_API_KEY=your-youtube-api-key-here

# Or use a single Google API key for both
GOOGLE_API_KEY=your-google-api-key-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Access the Application

- **Course Builder**: http://localhost:3000/course
- **API Tester**: http://localhost:3000/api-test
- **Home Page**: http://localhost:3000

## 📚 How to Use the Course Builder

### Step 1: Configure Your Course

1. **Enter Topic**: Specify what you want to learn (e.g., "React Development", "Machine Learning")
2. **Select Difficulty**: Choose beginner, intermediate, or advanced
3. **Set Duration**: Specify course length (e.g., "4 weeks", "30 hours")
4. **Target Audience**: Define who the course is for
5. **Prerequisites**: List any required knowledge (comma-separated)
6. **Focus Areas**: Specify areas to emphasize (comma-separated)
7. **Video Settings**: Choose whether to include videos and how many per topic

### Step 2: Generate the Course

Click **"Generate Course"** and wait 10-30 seconds while:
- Gemini AI creates the course structure
- YouTube API fetches relevant videos
- Videos are ranked by quality metrics

### Step 3: Explore the Generated Course

- **Expand Modules**: Click on any module to see its topics
- **View Topics**: Click on topics to see detailed content, key points, and videos
- **Watch Videos**: Each topic includes curated YouTube videos with ratings
- **Export JSON**: Click "Export JSON" to download the complete course structure

## 🏗️ JSON Structure

### Complete Course Object

```json
{
  "id": "course_1234567890_abc",
  "title": "Course Title",
  "description": "Comprehensive course description",
  "difficulty": "intermediate",
  "duration": "4 weeks",
  "prerequisites": ["Basic programming", "HTML/CSS"],
  "learningOutcomes": [
    "Understand core concepts",
    "Build practical projects",
    "Apply best practices"
  ],
  "modules": [...],
  "tags": ["web-development", "javascript", "react"],
  "createdAt": "2024-11-08T10:00:00Z",
  "updatedAt": "2024-11-08T10:00:00Z"
}
```

### Module Structure

```json
{
  "id": "module_course123_1",
  "moduleNumber": 1,
  "title": "Introduction to React",
  "description": "Learn React fundamentals",
  "learningObjectives": [
    "Understand React components",
    "Master state management",
    "Handle events and props"
  ],
  "estimatedDuration": "1 week",
  "topics": [...]
}
```

### Topic Structure

```json
{
  "id": "topic_module123_1",
  "topicNumber": 1,
  "title": "Components and Props",
  "content": "Detailed explanation of React components...",
  "keyPoints": [
    "Components are reusable UI pieces",
    "Props pass data to components",
    "Components can be functional or class-based"
  ],
  "practiceQuestions": [
    "Create a functional component",
    "Pass props between components"
  ],
  "videos": [...],
  "resources": [...]
}
```

### Video Structure

```json
{
  "id": "dQw4w9WgXcQ",
  "title": "React Components Explained",
  "description": "Learn about React components...",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "duration": "15m 30s",
  "viewCount": 150000,
  "likeCount": 5000,
  "channelName": "Tech Channel",
  "channelId": "UC123456",
  "publishedAt": "2024-01-15T10:00:00Z",
  "rating": 95.2,
  "relevanceScore": 10
}
```

## 🎥 Video Ranking Algorithm

Videos are ranked using a composite score:

```javascript
// Rating Calculation (0-100)
rating = (likeRatio * 0.7) + (viewWeight * 0.3)

// Final Score
finalScore = (rating * 0.6) + (relevanceScore * 0.4)
```

- **Like Ratio**: Percentage of viewers who liked the video
- **View Weight**: Logarithmic scale of total views
- **Relevance Score**: Position in search results

## 📡 API Endpoints

### POST /api/course/generate

Generate a complete course with AI.

**Request:**
```json
{
  "topic": "React Development",
  "difficulty": "intermediate",
  "duration": "6 weeks",
  "targetAudience": "Web developers",
  "prerequisites": ["JavaScript", "HTML/CSS"],
  "focusAreas": ["Hooks", "State Management"],
  "includeVideos": true,
  "videosPerTopic": 3
}
```

**Response:**
```json
{
  "success": true,
  "course": { /* Complete course object */ },
  "generationTime": 15000,
  "videosFetched": 45
}
```

### GET /api/course/generate

Returns API documentation and example usage.

## 🛠️ Technical Details

### Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling
- **Gemini AI API**: Content generation
- **YouTube Data API v3**: Video fetching
- **React Hooks**: State management

### File Structure

```
src/app/
├── types/
│   └── course.ts           # TypeScript type definitions
├── lib/
│   └── youtube.ts          # YouTube API integration
├── api/
│   └── course/
│       └── generate/
│           └── route.ts    # Course generation endpoint
├── components/
│   ├── CourseBuilder.tsx   # Main course builder UI
│   └── ApiTester.tsx       # API testing interface
├── course/
│   └── page.tsx            # Course builder page
└── page.tsx                # Home page
```

## 🔍 Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Ensure YouTube Data API v3 is enabled in Google Cloud
   - Check that API key has no restrictions or correct restrictions

2. **"No videos found"**
   - Verify YouTube API quota hasn't been exceeded
   - Check search terms are in English
   - Try broader search terms

3. **"Course generation failed"**
   - Check Gemini API key is valid
   - Ensure selected model is available
   - Verify API quotas

### API Quotas

- **YouTube API**: 10,000 units/day (default)
  - Search: 100 units
  - Video details: 1 unit
- **Gemini API**: Varies by model and plan

## 🎯 Example Use Cases

1. **Corporate Training**
   - Generate onboarding courses for new employees
   - Create skill development programs
   - Export to LMS systems

2. **Educational Institutions**
   - Create supplementary course materials
   - Generate study guides with video resources
   - Build curriculum structures

3. **Self-Learning**
   - Structure personal learning paths
   - Find curated video content
   - Track learning objectives

## 📈 Best Practices

1. **Topic Selection**
   - Be specific but not too narrow
   - Include technology versions when relevant
   - Use standard terminology

2. **Video Curation**
   - Set 3-5 videos per topic for balance
   - Review ratings to ensure quality
   - Check video durations match your needs

3. **Course Structure**
   - Start with fundamentals
   - Progress logically
   - Include practice exercises

## 🚀 Advanced Features

### Custom Prompts

You can modify the course generation prompt in `/api/course/generate/route.ts`:

```typescript
function generateCoursePrompt(request: CourseGenerationRequest): string {
  // Customize the prompt structure
  // Add specific requirements
  // Modify output format
}
```

### Video Filtering

Adjust video quality thresholds in `/lib/youtube.ts`:

```typescript
// Minimum thresholds
const MIN_VIEWS = 1000;
const MIN_RATING = 80;
```

### Export Formats

The course JSON can be:
- Imported into Learning Management Systems
- Converted to Markdown documentation
- Used as API responses
- Stored in databases

## 📝 License & Credits

- Built with Next.js and React
- Powered by Google's Gemini AI
- Videos from YouTube creators
- Open source under MIT License

---

**Need Help?** Check the console for detailed error messages or review the API documentation at `/api/course/generate`
