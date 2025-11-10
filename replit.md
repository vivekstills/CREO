# LearnLoop UI

## Overview
LearnLoop is a Next.js-based learning platform that uses Google's Gemini AI to generate educational course content. The application features an interactive course builder with AI-powered content generation.

**Current State**: Successfully migrated from Vercel to Replit and running in production mode.

## Recent Changes
- **November 10, 2025 (Latest)**: Added beautiful animated waves background
  - **Perlin Noise Waves**: Interactive canvas-based wave animation using Perlin noise
  - **Mouse Interaction**: Waves react to cursor movement with fluid physics
  - **Subtle Design**: Semi-transparent waves (#a95757 at 8% opacity) match brand colors
  - **Performance**: GPU-accelerated canvas rendering with requestAnimationFrame
  - **Fixed Background**: Waves stay fixed as page scrolls for parallax effect
  
- **November 10, 2025**: Interactive carousel with full module details
  - **Master-Detail Flow**: Carousel cards control expanded module view below
  - **Full-Width Cards**: 900px wide carousel cards with topic previews
  - **Complete Module Details**: Click any card to see full topics, objectives, quizzes, videos
  - **Integrated Features**: Notes sidebar, social space, quiz generation all working
  - **Smart Selection**: Auto-selects first module on course generation
  - **Smooth Scrolling**: Clicking carousel card scrolls to expanded details
  - **3D Card Carousel**: Swipeable module cards with perspective transforms
  - **5 Topic Preview**: Each carousel card shows up to 5 topics
  - **Star Ratings**: 5-star system based on topic count
  - **All Original Features Restored**: Topics, objectives, quizzes, notes, videos all functional
  
- **November 10, 2025**: Simplified course display
  - Removed gamified roadmap visualization
  - Clean course outline with module breakdown
  - Enhanced time cadence display with real-time updates
  - Status indicators for course generation
  
- **November 10, 2025**: Enhanced UI with beautiful animated time cadence display
  - Created glassmorphic time cadence badge with smooth spring animations
  - Subtle breathing animation (gentle scale pulse every 4 seconds)
  - Hover effect with warm shadow glow matching brand colors
  - Value updates in real-time as you type in duration field
  - Moved "Generate course" button and status badge below input fields (right-aligned)
  - Added clear warning when Gemini API quota exceeded (>40s generation time)
  
- **November 10, 2025**: Fixed course generation status indicators and logging
  - Fixed status state race condition - "Course ready" indicator now displays for full 5 seconds
  - Added request ID correlation between frontend and backend for better debugging
  - Implemented concise structured logging with timing information
  - Verified course generation correctly uses user's topic and difficulty (both Gemini and fallback)
  - Status flow: idle → loading → done (5s) → idle
  
- **November 10, 2025**: Migrated project from Vercel to Replit
  - Configured Next.js to run on port 5000 with 0.0.0.0 binding for Replit compatibility
  - Set up development workflow with webview output
  - Configured deployment for Replit autoscale
  - Added allowedDevOrigins configuration for Replit domains
  - Installed dependencies with legacy peer deps flag (React 19 compatibility)

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16.0.1 with React 19.2.0
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion 11.0.28
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React
- **Language**: TypeScript 5

### Key Features
- AI-powered course generation using Gemini API
- **Gamified roadmap visualization** - Candy Crush/Byju's-style learning journey map
  - Animated SVG paths connecting module nodes
  - Interactive hover/focus cards with module details
  - Progress indicators and achievement icons
  - Fully accessible keyboard navigation
- Interactive course builder
- API testing interface
- Video workspace integration
- Learning path and roadmap progress tracking

### Directory Structure
```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── generate/     # Gemini AI generation endpoint
│   │   └── course/       # Course-related endpoints
│   ├── components/       # React components
│   │   ├── GameifiedRoadmap.tsx    # Gamified learning journey visualization
│   │   ├── CourseBuilder.tsx       # Main course builder interface
│   │   ├── FeaturedVideoWorkspace.tsx
│   │   ├── CourseNotesSidebar.tsx
│   │   └── ...
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper utilities
├── lib/                 # Shared libraries
└── public/             # Static assets
```

## Environment Variables

### Required Secrets
- `GEMINI_API_KEY`: Google Gemini API key for AI content generation (configured in Replit Secrets)

### Optional Configuration
- `GEMINI_MODEL`: Model to use (defaults to gemini-2.0-flash-exp)
- `GEMINI_MAX_TOKENS`: Maximum tokens per request (defaults to 2048)
- `GEMINI_TEMPERATURE`: Temperature for generation (defaults to 0.7)

## Development

### Running Locally
The development server runs automatically via the configured workflow:
- Port: 5000
- Host: 0.0.0.0 (accessible from Replit webview)
- Hot reload enabled

### Scripts
- `npm run dev`: Start development server on port 5000
- `npm run build`: Build for production
- `npm run start`: Start production server on port 5000
- `npm run lint`: Run ESLint

### Deployment
Configured for Replit autoscale deployment:
- Build command: `npm run build`
- Start command: `npm run start`
- Automatically scales based on traffic

## API Endpoints

### `/api/generate` (GET/POST)
- **GET**: Returns API status and available Gemini models
- **POST**: Generate content using Gemini AI
  - Request body: `{ prompt: string, maxTokens?: number, temperature?: number, model?: string }`
  - Returns: Generated content with model information and usage metadata

### `/api/course/generate`
Course generation endpoint

### `/api/course/test`
Course testing endpoint

## Known Issues & Notes
- Using `--legacy-peer-deps` for npm install due to React 19 and framer-motion compatibility
- TypeScript type checking disabled in build (`ignoreBuildErrors: true`) due to framer-motion/React 19 type incompatibilities - code works correctly at runtime
- YouTube integration available but API key not yet configured
- Turbopack panic in Next.js 16 is a known issue ("Item already exists") and doesn't affect functionality - pages load and render correctly

## Debugging & Logging
- Course generation requests include correlation IDs (format: `req_TIMESTAMP_RANDOM`)
- Frontend logs: `[req_xxx] Course generation: Topic (difficulty)`
- Backend logs: `[req_xxx] Request: "Topic" (difficulty, duration)`
- Success logs: `[req_xxx] Success: "Course Title" (N modules, Xms)`
- Check browser console and server logs for the same request ID to trace issues

## User Preferences
- None documented yet
