# Progress Log

## Status

| Feature | Status | File |
| :--- | :--- | :--- |
| `generateHooks` (validation, fallback, schema) | Done | `src/lib/ai/services.ts` |
| `suggestClips` (validation, fallback, schema) | Done | `src/lib/ai/services.ts` |
| Platform Adaptation (`adaptContent`) | Done | `src/lib/ai/services.ts` |
| Creator Insights (`generateCreatorInsights`) | Done | `src/lib/ai/services.ts` |
| Script-to-Footage Matching (`matchScriptToFootage`) | Done | `src/lib/ai/services.ts` |
| Editable Edit-Decision-List Output (`buildEditDecisionList`) | Done | `src/lib/ai/services.ts` |
| Video Analysis (`analyzeVideo` with 120s timeout) | Done | `src/lib/ai/services.ts` |
| End-to-End Orchestrator (`runCreatorPipeline`) | Done | `src/lib/ai/services.ts` |
| In-memory SHA-256 Cache (100 entries, 10m TTL) | Done | `src/lib/ai/utils.ts` |
| API Reference Contract & Next.js Guide | Done | `docs/ai-api.md` |

## Environment Variables

- `GEMINI_API_KEY`: Primary API key for Google Gemini GenAI SDK.
- `GOOGLE_API_KEY`: Fallback API key for Google Gemini GenAI SDK.
- `GEMINI_MODEL`: Model identifier override (defaults to `gemini-2.5-flash`).

## Known Limitations

- Input length capped at 30,000 characters per field before sending to the model.
- Transcript must contain timestamped cues (`[MM:SS]` / `HH:MM:SS`) for accurate clip extraction.
- Gemini API calls enforce a 20-second timeout for text operations and 120-second timeout for multimodal video operations.

## Changelog

- **2026-10-04**: Added `analyzeVideo` (multimodal Gemini 120s timeout + upload lifecycle), `runCreatorPipeline` end-to-end orchestrator, SHA-256 in-memory cache, and `docs/ai-api.md` contract with live benchmarks (`scripts/ai-live.ts`).
- **2026-10-04**: Added `adaptContent`, `matchScriptToFootage`, `buildEditDecisionList`, and `generateCreatorInsights` with shared utility decoupling.
- **2026-10-04**: Added initial `generateHooks` and `suggestClips` implementation with defensive schemas and offline fallbacks.
