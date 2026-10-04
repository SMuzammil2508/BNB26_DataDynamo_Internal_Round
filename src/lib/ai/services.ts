import { GoogleGenAI, Type, type Schema } from "@google/genai";

export type ClipSuggestion = {
  startTime: string; // "HH:MM:SS" or "MM:SS", matching the transcript's format
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  title: string; // short label for the clip
  reason: string; // why this segment works as short-form content
  confidence: number; // 0..1
};

const MAX_INPUT_CHARS = 30_000;
const DEFAULT_MODEL = "gemini-2.5-flash";
const API_TIMEOUT_MS = 20_000;

/**
 * Executes an async task with a strict timeout rejection.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Lazily retrieves the GoogleGenAI client instance or null if API key is not configured.
 */
function getGenAIClient(): { client: GoogleGenAI | null; model: string } {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  if (!apiKey || apiKey.trim() === "") {
    return { client: null, model };
  }

  return {
    client: new GoogleGenAI({ apiKey: apiKey.trim() }),
    model,
  };
}

/**
 * Converts timestamp strings in "SS", "MM:SS", "HH:MM:SS", or decimal formats (e.g., "01:23.456") to seconds.
 * Returns NaN if input cannot be parsed.
 */
function timeToSeconds(t: string): number {
  if (!t || typeof t !== "string") {
    return NaN;
  }

  const trimmed = t.trim();
  if (trimmed === "") {
    return NaN;
  }

  const parts = trimmed.split(":");
  if (parts.length === 1) {
    const s = Number(parts[0]);
    return Number.isFinite(s) ? s : NaN;
  }

  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (Number.isFinite(m) && Number.isFinite(s)) {
      return m * 60 + s;
    }
    return NaN;
  }

  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    if (Number.isFinite(h) && Number.isFinite(m) && Number.isFinite(s)) {
      return h * 3600 + m * 60 + s;
    }
    return NaN;
  }

  return NaN;
}

/**
 * Removes markdown code block wraps and parses JSON safely.
 */
function safeJsonParse<T>(rawText: string): T | null {
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "");
      clean = clean.replace(/\s*```$/, "");
    }
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

/**
 * Extracts a concise lead snippet from the script content for fallback generation.
 */
function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "this topic";
  const match = trimmed.match(/^([^.!?\n]+)/);
  const sentence = match ? match[1].trim() : trimmed.slice(0, 50).trim();
  return sentence.length > 50 ? `${sentence.slice(0, 47)}...` : sentence;
}

/**
 * Generates fallback hook options when AI generation is unavailable or fails.
 */
function getFallbackHooks(scriptContent: string): string[] {
  const seed = getFirstSentence(scriptContent);
  const baseHooks = [
    `Stop scrolling: If you care about ${seed}, you need to hear this right now.`,
    `Most people get this completely wrong about ${seed}—here is what actually works.`,
    `Are you struggling with ${seed}? Here is the exact fix in under 60 seconds.`,
  ];

  return baseHooks.map((hook) => (hook.length > 140 ? `${hook.slice(0, 137)}...` : hook));
}

/**
 * Derives fallback clip suggestions from the transcript or default estimates.
 */
function getFallbackClips(scriptContent: string, videoTranscript: string): ClipSuggestion[] {
  const seed = getFirstSentence(scriptContent);

  // Attempt to parse existing timestamps from transcript lines (e.g. [00:15] or 01:20 - 01:50)
  const timestampRegex = /(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)(?:\]|\b)/g;
  const foundTimestamps: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(videoTranscript)) !== null) {
    if (!foundTimestamps.includes(match[1])) {
      foundTimestamps.push(match[1]);
    }
  }

  if (foundTimestamps.length >= 2) {
    const clips: ClipSuggestion[] = [];
    for (let i = 0; i < foundTimestamps.length - 1 && clips.length < 3; i++) {
      const start = foundTimestamps[i];
      const end = foundTimestamps[i + 1];
      const sSec = timeToSeconds(start);
      const eSec = timeToSeconds(end);
      const duration = eSec - sSec;

      if (duration >= 5 && duration <= 90) {
        clips.push({
          startTime: start,
          endTime: end,
          startSeconds: sSec,
          endSeconds: eSec,
          title: `Key Takeaway: ${seed}`,
          reason: "High-value segment identified directly from the transcript timeline.",
          confidence: Number((0.85 - clips.length * 0.05).toFixed(2)),
        });
      }
    }

    if (clips.length > 0) {
      return clips;
    }
  }

  return [
    {
      startTime: "00:00",
      endTime: "00:30",
      startSeconds: 0,
      endSeconds: 30,
      title: `The Hook: ${seed}`,
      reason: "Captures viewer attention in the opening 30 seconds with immediate context.",
      confidence: 0.85,
    },
    {
      startTime: "00:30",
      endTime: "01:00",
      startSeconds: 30,
      endSeconds: 60,
      title: "Core Insight & Breakdown",
      reason: "Delivers the primary value proposition and actionable breakdown.",
      confidence: 0.8,
    },
    {
      startTime: "01:00",
      endTime: "01:30",
      startSeconds: 60,
      endSeconds: 90,
      title: "Actionable Wrap-Up & CTA",
      reason: "Provides a concise conclusion with a clear call-to-action.",
      confidence: 0.75,
    },
  ];
}

const hooksResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hooks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Exactly 3 distinct, engaging, scroll-stopping hooks (each <= 140 chars).",
    },
  },
  required: ["hooks"],
};

const clipsResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: {
            type: Type.STRING,
            description: "Start timestamp matching the transcript format (e.g. '00:15' or '00:01:15').",
          },
          endTime: {
            type: Type.STRING,
            description: "End timestamp matching the transcript format (e.g. '00:45' or '00:01:45').",
          },
          title: {
            type: Type.STRING,
            description: "Short, punchy label for the clip.",
          },
          reason: {
            type: Type.STRING,
            description: "Why this segment works as standalone short-form content.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score between 0 and 1.",
          },
        },
        required: ["startTime", "endTime", "title", "reason", "confidence"],
      },
      description: "3 to 5 recommended short-form clips sorted by confidence descending.",
    },
  },
  required: ["clips"],
};

/**
 * Generates exactly 3 distinct, scroll-stopping hook options for short-form video content based on a script.
 *
 * @param scriptContent - The full or partial script text.
 * @returns An array of exactly 3 distinct hook strings (each <= 140 chars).
 */
export async function generateHooks(scriptContent: string): Promise<string[]> {
  const trimmedInput = (scriptContent ?? "").trim();
  if (!trimmedInput) {
    console.warn("[CreatorAI] generateHooks: Empty or whitespace input provided. Returning fallback hooks.");
    return getFallbackHooks("");
  }

  const { client, model } = getGenAIClient();
  if (!client) {
    console.warn("[CreatorAI] generateHooks: GEMINI_API_KEY / GOOGLE_API_KEY is not set. Returning fallback hooks.");
    return getFallbackHooks(trimmedInput);
  }

  const boundedInput = trimmedInput.slice(0, MAX_INPUT_CHARS);
  const systemInstruction =
    "You are an elite short-form content strategist for TikTok, YouTube Shorts, and Instagram Reels. " +
    "Analyze the provided script and generate EXACTLY 3 distinct, engaging hook options. " +
    "Requirements:\n" +
    "- Each hook must be strictly <= 140 characters.\n" +
    "- Use distinct angles across the 3 hooks: (1) Curiosity gap, (2) Bold/controversial claim, (3) Pain-point question.\n" +
    "- First-line scroll-stopping style designed to maximize retention in the first 3 seconds.\n" +
    "- Return only valid JSON conforming to the requested schema.";

  const prompt = `Script Content:\n"""\n${boundedInput}\n"""\n\nGenerate 3 distinct hooks according to the instructions.`;

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: hooksResponseSchema,
        },
      }),
      API_TIMEOUT_MS,
      "generateHooks"
    );

    const rawText = response.text ?? "";
    const parsed = safeJsonParse<{ hooks?: string[] }>(rawText);

    if (!parsed || !Array.isArray(parsed.hooks)) {
      console.warn("[CreatorAI] generateHooks: Failed to parse valid hooks JSON from model response. Returning fallback.");
      return getFallbackHooks(trimmedInput);
    }

    // Clean, trim, deduplicate, filter non-empty and limit to 140 chars
    const cleanedHooks: string[] = [];
    for (const hook of parsed.hooks) {
      if (typeof hook === "string") {
        const t = hook.trim();
        if (t.length > 0 && !cleanedHooks.includes(t)) {
          cleanedHooks.push(t.length > 140 ? `${t.slice(0, 137)}...` : t);
        }
      }
    }

    // Ensure exactly 3 hooks: pad with fallback hooks if fewer, truncate if more
    if (cleanedHooks.length < 3) {
      const fallbackList = getFallbackHooks(trimmedInput);
      for (const fallback of fallbackList) {
        if (cleanedHooks.length >= 3) break;
        if (!cleanedHooks.includes(fallback)) {
          cleanedHooks.push(fallback);
        }
      }
    }

    return cleanedHooks.slice(0, 3);
  } catch (error) {
    console.warn(
      `[CreatorAI] generateHooks: API call failed or encountered an error (${error instanceof Error ? error.message : "Unknown error"}). Returning fallback.`
    );
    return getFallbackHooks(trimmedInput);
  }
}

/**
 * Compares a script against a timestamped transcript and suggests 3-5 high-performing short-form clips.
 *
 * @param scriptContent - The original script or outline.
 * @param videoTranscript - The timestamped transcript of the recorded footage.
 * @returns An array of 3 to 5 valid ClipSuggestion objects sorted by confidence descending.
 */
export async function suggestClips(
  scriptContent: string,
  videoTranscript: string
): Promise<ClipSuggestion[]> {
  const trimmedScript = (scriptContent ?? "").trim();
  const trimmedTranscript = (videoTranscript ?? "").trim();

  if (!trimmedScript && !trimmedTranscript) {
    console.warn("[CreatorAI] suggestClips: Empty script and transcript provided. Returning fallback clips.");
    return getFallbackClips("", "");
  }

  const { client, model } = getGenAIClient();
  if (!client) {
    console.warn("[CreatorAI] suggestClips: GEMINI_API_KEY / GOOGLE_API_KEY is not set. Returning fallback clips.");
    return getFallbackClips(trimmedScript, trimmedTranscript);
  }

  const boundedScript = trimmedScript.slice(0, MAX_INPUT_CHARS);
  const boundedTranscript = trimmedTranscript.slice(0, MAX_INPUT_CHARS);

  const systemInstruction =
    "You are an expert viral video editor and content strategist. " +
    "Compare the provided script against the timestamped transcript and identify 3 to 5 high-performing short-form clips (15 to 60 seconds each).\n" +
    "Requirements:\n" +
    "- Timestamps (startTime and endTime) MUST exist in the provided transcript. NEVER invent timestamps.\n" +
    "- Each clip must be a self-contained segment with a strong opening hook and a clean, satisfying ending.\n" +
    "- Prioritize parts that align with key script beats and deliver high standalone value.\n" +
    "- Confidence score must be a number between 0 and 1.\n" +
    "- Sort recommendations by confidence descending.\n" +
    "- Return only valid JSON conforming to the requested schema.";

  const prompt =
    `Script:\n"""\n${boundedScript}\n"""\n\n` +
    `Timestamped Transcript:\n"""\n${boundedTranscript}\n"""\n\n` +
    "Identify 3-5 optimal short-form clips according to the instructions.";

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: clipsResponseSchema,
        },
      }),
      API_TIMEOUT_MS,
      "suggestClips"
    );

    const rawText = response.text ?? "";
    const parsed = safeJsonParse<{
      clips?: Array<{
        startTime?: string;
        endTime?: string;
        title?: string;
        reason?: string;
        confidence?: number;
      }>;
    }>(rawText);

    if (!parsed || !Array.isArray(parsed.clips)) {
      console.warn("[CreatorAI] suggestClips: Failed to parse valid clips JSON from model response. Returning fallback.");
      return getFallbackClips(trimmedScript, trimmedTranscript);
    }

    const validatedClips: ClipSuggestion[] = [];

    for (const item of parsed.clips) {
      if (!item || typeof item !== "object") continue;

      const startTime = typeof item.startTime === "string" ? item.startTime.trim() : "";
      const endTime = typeof item.endTime === "string" ? item.endTime.trim() : "";
      const title = typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Untitled Clip";
      const reason = typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : "Highlight segment.";

      const startSeconds = timeToSeconds(startTime);
      const endSeconds = timeToSeconds(endTime);

      if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) {
        continue;
      }

      if (endSeconds <= startSeconds) {
        continue;
      }

      const duration = endSeconds - startSeconds;
      if (duration < 5 || duration > 90) {
        continue;
      }

      const rawConfidence = typeof item.confidence === "number" ? item.confidence : 0.7;
      const confidence = Math.max(0, Math.min(1, Number(rawConfidence.toFixed(2))));

      validatedClips.push({
        startTime,
        endTime,
        startSeconds,
        endSeconds,
        title,
        reason,
        confidence,
      });
    }

    if (validatedClips.length === 0) {
      console.warn("[CreatorAI] suggestClips: No valid clips passed timestamp/duration validation. Returning fallback.");
      return getFallbackClips(trimmedScript, trimmedTranscript);
    }

    // Sort descending by confidence
    validatedClips.sort((a, b) => b.confidence - a.confidence);

    return validatedClips.slice(0, 5);
  } catch (error) {
    console.warn(
      `[CreatorAI] suggestClips: API call failed or encountered an error (${error instanceof Error ? error.message : "Unknown error"}). Returning fallback.`
    );
    return getFallbackClips(trimmedScript, trimmedTranscript);
  }
}

/*
// ==========================================
// Tiny Usage Example:
// ==========================================
// import { generateHooks, suggestClips } from "@/lib/ai/services";
//
// async function example() {
//   const script = "In this video, I reveal how to automate content creation using AI...";
//   const transcript = "[00:00] Intro to AI tools [00:15] Step 1: Scripting [00:45] Step 2: Generation [01:20] Outro";
//
//   const hooks = await generateHooks(script);
//   console.log("Hooks:", hooks);
//
//   const clips = await suggestClips(script, transcript);
//   console.log("Clips:", clips);
// }
*/
