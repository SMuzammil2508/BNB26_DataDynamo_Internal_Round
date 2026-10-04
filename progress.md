# Progress Log

## Status

| Feature | Status | File |
| :--- | :--- | :--- |
| `generateHooks` (structured objects: `hookText`, `viralScore`, `emotionalType`) | Done | `src/lib/ai/services.ts` |
| `suggestClips` (validation, fallback, schema) | Done | `src/lib/ai/services.ts` |
| Platform Adaptation (`adaptContent` multi + single `TIKTOK`/`REELS`/`YOUTUBE`) | Done | `src/lib/ai/services.ts` |
| Creator Insights (`generateCreatorInsights`) | Done | `src/lib/ai/services.ts` |
| Script-to-Footage Matching (`matchScriptToFootage`) | Done | `src/lib/ai/services.ts` |
| Editable Edit-Decision-List Output (`buildEditDecisionList`) | Done | `src/lib/ai/services.ts` |
| Video Analysis (`analyzeVideo` with upload & 120s timeout) | Done | `src/lib/ai/services.ts` |
| End-to-End Orchestrator (`runCreatorPipeline` with source & provider maps) | Done | `src/lib/ai/services.ts` |
| Model Chain Execution (Gemini -> Fallbacks -> Groq -> Heuristics) | Done | `src/lib/ai/utils.ts` |
| Groq Native Provider (fetch-based `llama-3.3-70b-versatile` JSON completion) | Done | `src/lib/ai/utils.ts` |
| Quota-Aware Error Recovery (Daily 429 skip vs transient 503 retry) | Done | `src/lib/ai/utils.ts` |
| Persistent Disk Cache (`.cache/ai/` 24h TTL + memory layer, toggleable via `AI_DISK_CACHE=0`) | Done | `src/lib/ai/utils.ts` |
| Video Demo Safety Caching (cached by size + mtime + name for zero-cost repeat runs) | Done | `src/lib/ai/utils.ts` |
| Transcript Normalization (`normalizeTranscript` on `[MM:SS]` cues) | Done | `src/lib/ai/utils.ts` |

## Environment Variables

- `GEMINI_API_KEY`: Primary API key for Google Gemini GenAI SDK.
- `GOOGLE_API_KEY`: Fallback API key for Google Gemini GenAI SDK.
- `GEMINI_MODEL`: Primary Gemini model identifier (defaults to `gemini-2.5-flash`).
- `GEMINI_FALLBACK_MODELS`: Comma-separated Gemini fallback model list (defaults to `gemini-2.5-flash-lite`).
- `GROQ_API_KEY`: API key for Groq fallback provider (optional, skipped if unset).
- `GROQ_MODEL`: Groq model identifier (defaults to `llama-3.3-70b-versatile`).
- `AI_DISK_CACHE`: Toggle persistent 24h disk caching in `.cache/ai/` (`0` disables disk cache, default enabled).

## Known Limitations

- Input length capped at 30,000 characters per field before sending to the model.
- Transcript must contain timestamped cues (`[MM:SS]` / `HH:MM:SS`) for accurate clip extraction.
- Text API operations enforce a 30-second timeout with fallback chain; multimodal video analysis enforces 120 seconds.
- Video analysis remains Gemini-only (Groq handles text tasks).

## Changelog

- **2026-10-04**: Added multi-model execution chain (Gemini -> fallback models -> Groq native provider -> dummy heuristic), quota-aware daily limit detection, persistent `.cache/ai/` disk caching with TTL, and video metadata demo caching.
- **2026-10-04**: Added transcript normalization, thinkingBudget=0, 30s retry with backoff, per-step `source` (`"live"` | `"fallback"`) tracking in `PipelineResult`, and warning telemetry in `runCreatorPipeline`.
- **2026-10-04**: Added `HookOption` structured output to `generateHooks` and single-platform overloads to `adaptContent`.
- **2026-10-04**: Added `analyzeVideo` and `runCreatorPipeline` end-to-end orchestrator with smoke tests and API contracts.
