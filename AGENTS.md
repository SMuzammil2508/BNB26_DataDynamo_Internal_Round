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
- **Graceful Fallbacks**: Never throw on missing keys, API timeouts (~20s / 120s for video), or unparseable responses; log a warning (`[CreatorAI] ...`) and return typed dummy/heuristic data.
- **In-Memory & Persistent Caching**: AI calls are cached in memory (10-minute TTL) and persisted to `.cache/ai/` (24-hour TTL) by SHA-256 hash of inputs. Disabled via `AI_DISK_CACHE=0`. Never cache fallback responses.
- **Model Chain & Quota-Aware Cascades**: Text generation cascades through `GEMINI_MODEL` -> `GEMINI_FALLBACK_MODELS` -> `Groq` (`llama-3.3-70b-versatile` via native fetch) -> local heuristic fallbacks. On 429 daily quota exhaustion (`PerDay` or retryDelay > 60s), cascade immediately without retrying the same model.
- **Concise Error Extraction**: Extract status and short summaries (`formatShortError`) rather than logging raw JSON error payloads.
- **Defensive Parsing**: Use `config.responseSchema` with `responseMimeType: "application/json"`, and defensively parse JSON while stripping markdown code fences.
- **Input Boundaries**: Guard against empty inputs and truncate large inputs (>30,000 chars).
- **TypeScript & Docs**: Strict typing, no `any`, small private helpers, and full JSDoc comments on exported functions.

## Public API (`src/lib/ai/services.ts`)
- `generateHooks(scriptContent: string): Promise<HookOption[]>` - Generates exactly 3 distinct structured hooks.
- `suggestClips(scriptContent: string, videoTranscript: string): Promise<ClipSuggestion[]>` - Suggests 3-5 transcript-matched clips sorted by confidence.
- `adaptContent(scriptContent: string, platforms: Platform[]): Promise<PlatformAdaptation[]>` - Adapts scripts for YouTube Shorts, Reels, TikTok, X, and LinkedIn.
- `adaptContent(script: string, platform: 'TIKTOK' | 'REELS' | 'YOUTUBE'): Promise<SinglePlatformAdaptation>` - Platform-specific title, description, and hashtags.
- `matchScriptToFootage(scriptContent: string, videoTranscript: string): Promise<ScriptFootageMatch[]>` - Matches script beats to timeline footage.
- `buildEditDecisionList(clips: ClipSuggestion[], opts?: { hook?: string; platform?: Platform }): EditDecisionList` - Pure function generating editable EDL timelines.
- `generateCreatorInsights(stats: ContentStat[]): Promise<CreatorInsights>` - Computes creator engagement metrics and actionable recommendations.
- `analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysis>` - Multimodal video transcription and scene analysis (Gemini-only).
- `runCreatorPipeline(input: PipelineInput): Promise<PipelineResult>` - End-to-end orchestration pipeline with warnings, source tracking, and provider mapping.

## How to Add a New AI Function (5 Steps)
1. Define strict input/output TypeScript types and response schemas using `Type` from `@google/genai`.
2. Implement local heuristic fallback helper for offline/error handling.
3. Add input guards (empty check + character limit truncation) and lazy client acquisition.
4. Execute `client.models.generateContent` with timeout race (20s/120s) and structured output config.
5. Validate/sanitize parsed results, sort/clamp fields, cache valid results, and return with typed fallbacks on failure.

## Git & Workflow Rules
- Branch: `feature/ai-pipeline`.
- Use conventional commits (`feat(ai): ...`, `fix(ai): ...`, `docs(ai): ...`).
- Keep diffs minimal and self-contained.
- Token efficiency: keep chat responses concise and action-oriented.
