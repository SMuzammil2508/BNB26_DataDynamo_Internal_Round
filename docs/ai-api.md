# CreatorAi AI Service API Reference

Welcome to the internal API documentation for the CreatorAi AI service layer (`src/lib/ai/services.ts`).

## Overview
All functions interact with Google Gemini via the official `@google/genai` SDK using structured JSON schemas. All functions follow these guarantees:
- **Lazy Initialization**: Safe to import even if `GEMINI_API_KEY` is undefined.
- **Fail-Safe Fallbacks**: Guaranteed to return typed results and never throw exceptions.
- **In-Memory Caching**: AI calls are cached in memory (10-minute TTL) by SHA-256 hash of inputs.
- **Timeouts**: 20 seconds for standard queries, 120 seconds for multimodal video analysis.

---

## Functions

### 1. `generateHooks`
Generates exactly 3 distinct, scroll-stopping hooks (≤ 140 chars) from a script using curiosity gaps, bold claims, and pain points.

**Signature:**
```typescript
function generateHooks(scriptContent: string): Promise<string[]>
```

**Example Output:**
```json
[
  "Stop scrolling: If you want to automate short-form content, listen up.",
  "Most creators edit clips backwards—here is the framework that gets 1M views.",
  "Struggling to turn long videos into viral shorts? Try this 3-step system."
]
```
- **Fallback**: 3 heuristic hooks derived from the first sentence of the script.
- **Typical Latency**: ~1.2s - 2.5s.

---

### 2. `suggestClips`
Compares a script against a timestamped transcript and returns 3-5 high-performing clips (15-60s) sorted by confidence.

**Signature:**
```typescript
function suggestClips(scriptContent: string, videoTranscript: string): Promise<ClipSuggestion[]>
```

**Example Output:**
```json
[
  {
    "startTime": "00:15",
    "endTime": "00:45",
    "startSeconds": 15,
    "endSeconds": 45,
    "title": "The 3-Step Framework",
    "reason": "Clear standalone breakdown with immediate retention value.",
    "confidence": 0.92
  }
]
```
- **Fallback**: 2-3 clips extracted directly from transcript timestamps or default 30s segments.
- **Typical Latency**: ~1.8s - 3.2s.

---

### 3. `adaptContent`
Adapts a script across YouTube Shorts, Instagram Reels, TikTok, X, and LinkedIn with platform-enforced constraints.

**Signature:**
```typescript
function adaptContent(scriptContent: string, platforms: Platform[]): Promise<PlatformAdaptation[]>
```

**Example Output:**
```json
[
  {
    "platform": "tiktok",
    "caption": "How to scale your content without burning out 🚀 Comment your questions below!",
    "hashtags": ["#creator", "#contentstrategy", "#automation"],
    "hook": "Here is why your workflow is slowing you down.",
    "aspectRatio": "9:16",
    "maxDurationSeconds": 60,
    "postingTip": "Hook in the first 1.5 seconds and encourage comments with a debate prompt."
  }
]
```
- **Fallback**: Platform-compliant defaults with structured formatting and standard hashtags.
- **Typical Latency**: ~1.5s - 2.8s.

---

### 4. `matchScriptToFootage`
Matches script narrative beats to specific transcript timestamp ranges.

**Signature:**
```typescript
function matchScriptToFootage(scriptContent: string, videoTranscript: string): Promise<ScriptFootageMatch[]>
```

**Example Output:**
```json
[
  {
    "scriptBeat": "Problem Statement",
    "startTime": "00:00",
    "endTime": "00:20",
    "startSeconds": 0,
    "endSeconds": 20,
    "matchScore": 0.95,
    "note": "Speaker introduces the common editor bottleneck."
  }
]
```
- **Fallback**: Thematic segments matched against chronological transcript intervals.
- **Typical Latency**: ~1.8s - 3.0s.

---

### 5. `buildEditDecisionList`
Pure timeline compiler. Combines suggested clips and hooks into an editable EDL timeline JSON.

**Signature:**
```typescript
function buildEditDecisionList(clips: ClipSuggestion[], opts?: { hook?: string; platform?: Platform }): EditDecisionList
```

**Example Output:**
```json
{
  "version": 1,
  "platform": "tiktok",
  "items": [
    {
      "id": "item-hook-overlay-1",
      "type": "hook_overlay",
      "startSeconds": 0,
      "endSeconds": 3,
      "text": "Stop scrolling",
      "editable": true
    },
    {
      "id": "item-clip-1",
      "type": "clip",
      "startSeconds": 0,
      "endSeconds": 30,
      "text": "The Hook",
      "sourceClipIndex": 0,
      "editable": true
    }
  ]
}
```
- **Fallback**: Deterministic synchronous execution (no AI call).
- **Typical Latency**: < 1ms.

---

### 6. `generateCreatorInsights`
Analyzes creator metrics and computes engagement rate + top performers locally, using AI for strategic narrative analysis.

**Signature:**
```typescript
function generateCreatorInsights(stats: ContentStat[]): Promise<CreatorInsights>
```

**Example Output:**
```json
{
  "summary": "Analyzed 10 posts with 120,000 total views. High-energy shorts drove 75% of engagement.",
  "topPerformers": ["How to automate editing in 60s", "Top 5 AI tools"],
  "patterns": ["Videos under 40 seconds saw 2x higher retention."],
  "recommendations": ["Replicate hook style from top performer for upcoming series."],
  "bestPostingWindow": "2:00 PM - 5:00 PM (peak audience activity)"
}
```
- **Fallback**: Computes performance metrics locally and generates rule-based insights.
- **Typical Latency**: ~1.2s - 2.0s.

---

### 7. `analyzeVideo`
Transcribes footage into `[MM:SS] text` lines and extracts visual scenes using Gemini multimodal video processing.

**Signature:**
```typescript
function analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysis>
```
- **Fallback**: Empty transcript and scene list.
- **Typical Latency**: ~15s - 60s (depending on video size).

---

### 8. `runCreatorPipeline`
End-to-end orchestration pipeline running video transcription, parallel hook/clip/match generation, EDL compilation, and platform adaptation.

**Signature:**
```typescript
function runCreatorPipeline(input: PipelineInput): Promise<PipelineResult>
```

---

## Calling from a Next.js route handler

Here is a standard Next.js App Router route handler pattern:

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
