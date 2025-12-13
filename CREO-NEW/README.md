# CREO Learning Coach

Production-ready, adaptive tutoring experience that detects when learners are blocked and automatically switches into a gentle Learning Mode. Built with Next.js (App Router), a real Gemini-backed prompt layer, and SQLite persistence for user profiles, chat history, and topic progress.

## What was added
- **Personalized tutor page** at `/tutor` with Learning Mode indicator, quick controls (hint, explain differently, simplify, overwhelmed), and progress pulses.
- **SQLite persistence** via `better-sqlite3` (`data/learning.db`) for user profiles, messages, and topic-level progress.
- **Adaptive prompting layer** that injects profile data, frustration signals, and pacing guidance on every request.
- **API routes** for users (`/api/users`), chat handling (`/api/chat`), and progress updates (`/api/progress`).

## Getting started
```bash
npm install
npm run dev
# open http://localhost:5000
```

### Environment
Copy `env.example` to `.env.local` and set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`). Without a key, the chat gracefully falls back to an on-device tutoring message, but real generations require a key.

### Data
The first request creates `data/learning.db` with three tables:
- `users`: name, subjects, goals, learning style, attention span, past struggles, progress notes.
- `messages`: full conversation history with sentiment, frustration score, and whether Learning Mode was active.
- `topic_progress`: confidence, status, and struggle/success counts per topic.

## Key endpoints
- `POST /api/users` create/update a profile. Body supports `name`, `subjects[]`, `goals`, `learningStyle`, `attentionSpan`, `pastStruggles[]`, `progressNotes`, optional `userId`.
- `GET /api/users?id=...` fetch a profile, recent history, and topic progress.
- `POST /api/chat` send a message with `{ userId, message, topic?, modeOverride?, controls? }`. Returns tutor reply, Learning Mode state, signals, and progress.
- `POST /api/progress` update topic progress manually; `GET /api/progress?userId=...` to read it.

## Running the tutor UI
1) Start the dev server.  
2) Visit `/tutor`. A profile is auto-created and stored in `localStorage` for reuse.  
3) Fill in your goals/subjects, type where you are stuck, and hit **Send**. The coach will slow down when frustration/hesitation/repetition is detected and surface a Learning Mode badge.

## Notes on behavior
- Learning Mode triggers on negative sentiment, frustration keywords, repeated failures, or explicit “I’m overwhelmed.” It slows pacing, uses Socratic prompts, and confirms understanding before moving on.
- Topic progress confidence nudges up on positive turns and down on struggles, enabling lightweight progress feedback in the UI.

## Scripts
- `npm run dev` – start the Next.js app on port 5000  
- `npm run build` – production build  
- `npm run start` – run the built app  
- `npm run lint` – lint
