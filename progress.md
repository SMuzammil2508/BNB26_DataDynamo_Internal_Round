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
| End-to-End Orchestrator (`runCreatorPipeline` with source field & warnings) | Done | `src/lib/ai/services.ts` |
| Transcript Normalization (`normalizeTranscript` on `[MM:SS]` cues) | Done | `src/lib/ai/utils.ts` |
| In-memory SHA-256 Cache (100 entries, 10m TTL) | Done | `src/lib/ai/utils.ts` |
| Retries (1s/2s backoff, thinking budget=0, 30s timeout) | Done | `src/lib/ai/utils.ts` |

## Environment Variables

- `GEMINI_API_KEY`: Primary API key for Google Gemini GenAI SDK.
- `GOOGLE_API_KEY`: Fallback API key for Google Gemini GenAI SDK.
- `GEMINI_MODEL`: Model identifier override (defaults to `gemini-2.5-flash`).
- `GEMINI_FALLBACK_MODEL`: Fallback model identifier on retry exhaustion.

## Known Limitations

- Input length capped at 30,000 characters per field before sending to the model.
- Transcript must contain timestamped cues (`[MM:SS]` / `HH:MM:SS`) for accurate clip extraction.
- Gemini API calls enforce a 30-second timeout for text operations and 120-second timeout for multimodal video operations.

## Changelog

- **2026-10-04**: Added transcript normalization, thinkingBudget=0, 30s retry with backoff, per-step `source` (`"live"` | `"fallback"`) tracking in `PipelineResult`, and warning telemetry in `runCreatorPipeline`.
- **2026-10-04**: Added `HookOption` structured output to `generateHooks` and single-platform overloads to `adaptContent`.
- **2026-10-04**: Added `analyzeVideo` and `runCreatorPipeline` end-to-end orchestrator with smoke tests and API contracts.
