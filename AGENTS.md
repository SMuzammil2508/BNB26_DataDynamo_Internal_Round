<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CreatorAi Agent Guidelines

## Project Overview
CreatorAi is an AI-powered creator operating platform automating script → footage → clips → multi-platform publishing workflows.

## Scope Rules
- AI layer work belongs strictly inside `src/lib/ai/`.
- Never modify, read, or create files in `src/components`, `src/app`, or Prisma migrations/schema unless explicitly requested.

## Technology Stack
- TypeScript (strict mode, zero `any`).
- Official `@google/genai` SDK (`GoogleGenAI` class, `ai.models.generateContent`). Never use `@google/generative-ai`.

## Conventions
- **Lazy Initialization**: Never initialize clients at top-level module scope; instantiate lazily to avoid runtime import failures when API keys are absent.
- **Graceful Fallbacks**: Never throw on missing keys, API timeouts (~20s), or unparseable responses; log a warning (`[CreatorAI] ...`) and return typed dummy/heuristic data.
- **Defensive Parsing**: Use `config.responseSchema` with `responseMimeType: "application/json"`, and defensively parse JSON while stripping markdown code fences.
- **Input Boundaries**: Guard against empty inputs and truncate large inputs (>30,000 chars).
- **TypeScript & Docs**: Strict typing, no `any`, small private helpers, and full JSDoc comments on exported functions.

## Public API (`src/lib/ai/services.ts`)
```typescript
export type ClipSuggestion = {
  startTime: string;   // "HH:MM:SS" or "MM:SS"
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  title: string;
  reason: string;
  confidence: number;  // 0..1
};

export async function generateHooks(scriptContent: string): Promise<string[]>;
export async function suggestClips(scriptContent: string, videoTranscript: string): Promise<ClipSuggestion[]>;
```

## How to Add a New AI Function (5 Steps)
1. Define strict input/output TypeScript types and response schemas using `Type` from `@google/genai`.
2. Implement local heuristic fallback helper for offline/error handling.
3. Add input guards (empty check + character limit truncation) and lazy client acquisition.
4. Execute `client.models.generateContent` with a ~20s timeout race and structured output config.
5. Validate/sanitize parsed results, sort/clamp fields, and return with typed fallbacks on failure.

## Git & Workflow Rules
- Branch: `feature/ai-pipeline`.
- Use conventional commits (`feat(ai): ...`, `fix(ai): ...`, `docs(ai): ...`).
- Keep diffs minimal and self-contained.
- Token efficiency: keep chat responses concise and action-oriented.
