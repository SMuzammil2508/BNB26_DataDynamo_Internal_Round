# Progress Log

## Status

| Feature | Status | File |
| :--- | :--- | :--- |
| `generateHooks` (validation, fallback, schema) | Done | `src/lib/ai/services.ts` |
| `suggestClips` (validation, fallback, schema) | Done | `src/lib/ai/services.ts` |
| Platform Adaptation | Todo | `src/lib/ai/` |
| Creator Insights | Todo | `src/lib/ai/` |
| Script-to-Footage Matching | Todo | `src/lib/ai/` |
| Editable Edit-Decision-List (EDL) Output | Todo | `src/lib/ai/` |

## Environment Variables

- `GEMINI_API_KEY`: Primary API key for Google Gemini GenAI SDK.
- `GOOGLE_API_KEY`: Fallback API key for Google Gemini GenAI SDK.
- `GEMINI_MODEL`: Model identifier override (defaults to `gemini-2.5-flash`).

## Known Limitations

- Input length capped at 30,000 characters per field before sending to the model.
- Transcript must contain timestamped cues (`[MM:SS]` / `HH:MM:SS`) for accurate clip extraction.
- Gemini API calls enforce a 20-second timeout before falling back to local heuristic results.

## Changelog

- **2026-10-04**: Added `generateHooks` and `suggestClips` with defensive validation, 20s timeouts, safe JSON parsing, and graceful heuristic fallbacks in `src/lib/ai/services.ts`.
