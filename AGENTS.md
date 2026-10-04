# Agentic System Guidelines for CreatorAI

## Project Architecture
- Framework: Next.js 16 (App Router), TypeScript, Tailwind CSS v3
- ORM & Database: Prisma with SQLite (`dev.db`)
- AI Engine: `@google/genai` (Gemini API)

## Agent Scope & Rules
- Frontend: Restrict edits to `/src/app` and `/src/components`
- Backend: Restrict edits to `/src/app/api` and `/prisma`
- AI Pipeline: Restrict edits to `/src/lib/ai`
- Always preserve baseline interfaces in `/src/types/index.ts`.
- Avoid unnecessary test suite sweeps or background rebuild loops to preserve quota.
