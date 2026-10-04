# CreatorAi AI Service API Reference

Welcome to the internal API documentation for the CreatorAi AI service layer (`src/lib/ai/services.ts`).

## Overview
All functions interact with Google Gemini via the official `@google/genai` SDK using structured JSON schemas. All functions follow these guarantees:
- **Lazy Initialization**: Safe to import even if `GEMINI_API_KEY` is undefined.
- **Fail-Safe Fallbacks**: Guaranteed to return typed results and never throw exceptions.
- **In-Memory Caching**: AI calls are cached in memory (10-minute TTL) by SHA-256 hash of inputs.
- **Timeouts & Retries**: 30s per attempt for text operations with retry backoff and model fallbacks; 120s for multimodal video analysis.
- **Per-Step Source Tracking**: Pipeline results contain a `source` map denoting whether each individual asset was generated via `"live"` AI or `"fallback"` heuristic.

---

## Functions

### 1. `generateHooks`
Generates exactly 3 distinct, scroll-stopping hook options with virality score and emotional drivers.

**Signature:**
```typescript
function generateHooks(scriptContent: string): Promise<HookOption[]>
```

**Example Output:**
```json
[
  {
    "hookText": "Stop spending 80% of your time editing! Try this AI workflow.",
    "viralScore": 95,
    "emotionalType": "FOMO"
  },
  {
    "hookText": "Most creators edit clips completely backwards—here is what actually works.",
    "viralScore": 91,
    "emotionalType": "Curiosity"
  },
  {
    "hookText": "Wait, why is nobody talking about automated clip generation?",
    "viralScore": 88,
    "emotionalType": "Pattern Interrupt"
  }
]
```
- **Fallback**: 3 structured heuristic hooks derived from the script.
- **Typical Latency**: ~1.2s - 2.5s.

---

### 2. `suggestClips`
Compares a script against a normalized timestamped transcript and returns 3-5 high-performing clips (15-60s) sorted by confidence.

**Signature:**
```typescript
function suggestClips(scriptContent: string, videoTranscript: string): Promise<ClipSuggestion[]>
```

---

### 3. `adaptContent`
Adapts a script across multiple platforms (`Platform[]`) or single platforms (`'TIKTOK' | 'REELS' | 'YOUTUBE'`).

**Signatures:**
```typescript
function adaptContent(script: string, platform: 'TIKTOK' | 'REELS' | 'YOUTUBE'): Promise<SinglePlatformAdaptation>;
function adaptContent(scriptContent: string, platforms: Platform[]): Promise<PlatformAdaptation[]>;
```

---

### 4. `matchScriptToFootage`
Matches script narrative beats to specific transcript timestamp ranges with normalized cue parsing.

**Signature:**
```typescript
function matchScriptToFootage(scriptContent: string, videoTranscript: string): Promise<ScriptFootageMatch[]>
```

---

### 5. `buildEditDecisionList`
Pure timeline compiler. Combines suggested clips and hooks into an editable EDL timeline JSON.

**Signature:**
```typescript
function buildEditDecisionList(clips: ClipSuggestion[], opts?: { hook?: string; platform?: Platform }): EditDecisionList
```

---

### 6. `generateCreatorInsights`
Analyzes creator metrics, computes engagement rate + top performers locally, and generates narrative analysis.

**Signature:**
```typescript
function generateCreatorInsights(stats: ContentStat[]): Promise<CreatorInsights>
```

---

### 7. `analyzeVideo`
Transcribes footage into `[MM:SS] text` lines and extracts visual scenes using Gemini multimodal video processing with upload lifecycle management.

**Signature:**
```typescript
function analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysis>
```

---

### 8. `runCreatorPipeline`
End-to-end orchestration pipeline running video transcription, parallel hook/clip/match generation, EDL compilation, and platform adaptation.

**Signature:**
```typescript
function runCreatorPipeline(input: PipelineInput): Promise<PipelineResult>
```

**Pipeline Result Structure:**
```typescript
export type PipelineResult = {
  hooks: HookOption[] | string[];
  clips: ClipSuggestion[];
  matches: ScriptFootageMatch[];
  edl: EditDecisionList;
  adaptations: PlatformAdaptation[];
  transcript: string;
  scenes?: VideoScene[];
  warnings: string[];
  source: {
    videoAnalysis?: "live" | "fallback";
    generateHooks: "live" | "fallback";
    suggestClips: "live" | "fallback";
    matchScriptToFootage: "live" | "fallback";
    adaptContent: "live" | "fallback";
  };
  provider: {
    videoAnalysis?: "gemini" | "groq" | "fallback";
    generateHooks: "gemini" | "groq" | "fallback";
    suggestClips: "gemini" | "groq" | "fallback";
    matchScriptToFootage: "gemini" | "groq" | "fallback";
    adaptContent: "gemini" | "groq" | "fallback";
  };
};
```

---

## Environment Variables & Model Chain

- `GEMINI_API_KEY`: Primary API key for Gemini models.
- `GEMINI_MODEL`: Primary text/multimodal model (default `gemini-2.5-flash`).
- `GEMINI_FALLBACK_MODELS`: Comma-separated fallback models (default `gemini-2.5-flash-lite`).
- `GROQ_API_KEY`: API key for Groq fallback provider (optional, skipped if unset).
- `GROQ_MODEL`: Model identifier for Groq fetch completions (default `llama-3.3-70b-versatile`).
- `AI_DISK_CACHE`: Toggle persistent 24h disk caching in `.cache/ai/` (`0` disables disk cache, default enabled).

**Provider Chain for Text Generation:**
`GEMINI_MODEL` ➔ `GEMINI_FALLBACK_MODELS` ➔ `Groq` ➔ `Local Heuristic Fallback`.

---

## Calling from a Next.js route handler

```typescript
import { NextResponse } from "next/server";
import { runCreatorPipeline } from "@/lib/ai/services";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runCreatorPipeline({
      script: body.script ?? "",
      transcript: body.transcript,
      platforms: body.platforms,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
```
