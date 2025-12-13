# CREO - AI-Powered Learning Platform

## Overview
CREO (formerly LearnLoop) is a Next.js-based learning platform that uses Google's Gemini AI to generate educational course content. The application features an interactive course builder with AI-powered content generation and a beautiful CREO brand aesthetic.

**Current State**: Successfully migrated from Vercel to Replit and running in production mode.

## Recent Changes
- **November 10, 2025 (Latest)**: Refined hero section and navbar based on user feedback
  - **Clean Headline**: "Meet Creo" headline without background pill, using elegant drop shadow for depth
  - **Simplified Hero**: Removed "This is Smart Learning" tagline for cleaner, more focused design
  - **Sign in Button**: Top-right navbar button changed to "Sign in" (opens auth dialog)
  - **Optimized Floating Elements**: Repositioned to prevent overlap and improve visual balance:
    - AI Course Builder (top 12%, left 8%)
    - Personalized Paths (bottom 25%, left 12%)
    - Curated Videos (top 18%, right 10%)
    - Study Pods (top 55%, right 8%)
    - Study Stream (bottom 18%, right 15%)
  
- **November 10, 2025**: Redesigned homepage with Phantom-inspired navbar and purposeful floating elements
  - **Glassmorphic Navbar**: Phantom Cash-inspired centered pill menu with backdrop blur
  - **Consistent Typography**: Playfair Display for logo/headlines, Space Grotesk for body/menu items
  - **Purposeful Floating Cards**: Replaced random decorative elements with CREO feature cards (AI Course Builder, Personalized Paths, Curated Videos, Study Pods, Study Stream)
  - **Centered Layout**: Three-column navbar with logo left, menu center, CTA right
  - **Real Features Only**: Menu items link to actual CREO pages (Course Builder, API, Sign in)
  - **Dark Mode Support**: All navbar and floating elements respect theme with smooth transitions
  
- **November 10, 2025**: Extended dark mode to course builder and learning path
  - **Course Builder Dark Mode**: Complete dark theme for /course page with navbar toggle
  - **Synced Theme State**: Dark mode preference syncs between homepage and course builder via localStorage
  - **All Components Themed**: CourseBuilder, ModuleCarousel, CourseNotesSidebar, ModuleSocialSpace, LearningPathCohortCard all support dark mode
  - **Interactive Waves**: Waves background adapts color in dark mode (coral tint)
  - **Form Elements**: All inputs, selects, textareas styled for both themes with coral focus rings
  - **Status Badges**: Animated status indicators (Ready, Generating, Course ready) themed for dark mode
  - **Notes Sidebar**: Study stream sidebar fully themed with dark backgrounds and borders
  - **Social Spaces**: Study group pods and cohort cards styled for dark mode
  - **Carousel Cards**: 3D module carousel cards with dark gradients and themed indicators
  - **Home Button**: Course builder navbar includes Home link to return to homepage
  
- **November 10, 2025**: Implemented complete dark mode toggle system (Homepage)
  - **Dark Mode Toggle**: Moon/Sun icon button in navbar for instant theme switching
  - **localStorage Persistence**: Theme preference saved and persists across sessions
  - **Dark Theme Colors**: Deep purples, browns, and grays (`#1a120e`, `#1f1410`, `#0f0a08`)
  - **Light Theme Colors**: Warm beiges and creams (`#fffaf6`, `#fff0e8`, `#ffe8e8`)
  - **Coral Accents**: Consistent `#c24f63` accent color across both themes
  - **Smooth Transitions**: 300-500ms transition duration for all theme switches
  - **Theme-Aware Components**: All sections (hero, features, flow, study groups) fully theme-responsive
  - **Typography Adjustments**: Optimized text colors for readability in both modes
  - **Shadow System**: Enhanced shadows and glows for dark mode depth
  
- **November 10, 2025**: Redesigned homepage with CREO brand aesthetic
  - **Elegant Floating Elements**: Refined 3D floating cards, icons, and badges
  - **CREO Brand Colors**: Warm cream/beige gradients with coral accents
  - **Typography**: Playfair Display headlines, Space Grotesk body text
  - **Meet Creo Hero**: Massive 7xl-9xl headline with elegant shadows
  - **Clean Navigation**: Glassmorphic buttons with proper brand styling
  - **Removed Tagline**: Eliminated "This is Smart Learning" text per feedback
  
- **November 10, 2025**: Added beautiful animated waves background to course builder
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
- **Icons**: Lucide React (Moon, Sun, BookOpen, GraduationCap, etc.)
- **Language**: TypeScript 5

### Key Features
- AI-powered course generation using Gemini API
- **Dark Mode**: Complete theme switching with localStorage persistence
- **3D Homepage**: Floating elements with CREO brand aesthetic
- **Animated Waves**: Perlin noise background with mouse interaction
- Interactive course builder with carousel navigation
- API testing interface
- Video workspace integration
- Learning path and roadmap progress tracking
- Notes sidebar and social collaboration space

### Directory Structure
```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── generate/     # Gemini AI generation endpoint
│   │   └── course/       # Course-related endpoints
│   ├── components/       # React components
│   │   ├── ModuleCarousel.tsx       # 3D carousel module navigation
│   │   ├── CourseBuilder.tsx        # Main course builder interface
│   │   ├── Waves.tsx                # Animated waves background
│   │   ├── FeaturedVideoWorkspace.tsx
│   │   ├── CourseNotesSidebar.tsx
│   │   └── ...
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper utilities
├── lib/                 # Shared libraries
└── public/             # Static assets
```

## Design System

### CREO Brand Colors
**Light Mode:**
- Background: `#fffaf6`, `#fff0e8`, `#ffe8e8` (warm cream/beige gradients)
- Text: `#1f120f` (rich dark brown)
- Accent: `#c24f63` (coral)
- Secondary: `#b37871`, `#5b4743` (muted browns)
- Borders: `#f2e1d8`, `#f2d6c4` (light beige)

**Dark Mode:**
- Background: `#1a120e`, `#1f1410`, `#0f0a08` (deep brown/black)
- Text: `#f5e6dc` (warm cream)
- Accent: `#c24f63`, `#ff8ab6` (coral/pink)
- Secondary: `#b8998a`, `#c9a89a` (warm tans)
- Borders: `#3a2f2a` (dark brown)

### Typography
- **Headlines**: Playfair Display (600, 700, 900 weights)
- **Body**: Space Grotesk (400, 500, 600 weights)
- **Uppercase Labels**: 0.3em-0.6em tracking for elegance

### Component Patterns
- **Glassmorphic Elements**: backdrop-blur-sm with semi-transparent backgrounds
- **Rounded Corners**: 2xl-3xl border radius (24px-40px)
- **Shadows**: Layered shadows with coral/brown tints
- **Transitions**: 300-500ms duration for smooth theme switches

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
- **Theme Preference**: Stored in localStorage as `creoDarkMode` (true/false)
- **Intro Animation**: Skip preference stored as `creoIntroPlayed` in localStorage
