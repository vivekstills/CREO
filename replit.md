# LearnLoop UI

## Overview
LearnLoop is a Next.js-based learning platform that uses Google's Gemini AI to generate educational course content. The application features an interactive course builder with AI-powered content generation.

**Current State**: Successfully migrated from Vercel to Replit and running in production mode.

## Recent Changes
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
- Course journey visualization
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

## User Preferences
- None documented yet
