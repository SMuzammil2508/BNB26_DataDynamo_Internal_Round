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

## Environment Variables

- `GEMINI_API_KEY`: Primary API key for Google Gemini GenAI SDK.
- `GOOGLE_API_KEY`: Fallback API key for Google Gemini GenAI SDK.
- `GEMINI_MODEL`: Model identifier override (defaults to `gemini-2.5-flash`).

## Known Limitations

- Input length capped at 30,000 characters per field before sending to the model.
- Transcript must contain timestamped cues (`[MM:SS]` / `HH:MM:SS`) for accurate clip extraction.
- Gemini API calls enforce a 20-second timeout before falling back to local heuristic results.

## Changelog

- **2026-10-04**: Added `adaptContent`, `matchScriptToFootage`, `buildEditDecisionList`, and `generateCreatorInsights` with refactored shared utilities (`src/lib/ai/utils.ts`, `src/lib/ai/types.ts`) and smoke tests (`scripts/ai-smoke.ts`).
- **2026-10-04**: Added initial `generateHooks` and `suggestClips` implementation with defensive schemas and offline fallbacks.
