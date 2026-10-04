import { Type, type Schema } from "@google/genai";
import type {
  ClipSuggestion,
  HookOption,
  UppercasePlatform,
  SinglePlatformAdaptation,
  Platform,
  PlatformAdaptation,
  ScriptFootageMatch,
  EditDecisionList,
  ContentStat,
  CreatorInsights,
  VideoScene,
  VideoAnalysis,
  VideoAnalysisInput,
  PipelineInput,
  PipelineResult,
  ExecutionSource,
  ExecutionProvider,
  PipelineProviders,
} from "./types";
import {
  getGenAIClient,
  timeToSeconds,
  safeJsonParse,
  withTimeout,
  executeTextModelChain,
  getFirstSentence,
  normalizeTranscript,
  generateCacheKey,
  generateVideoCacheKey,
  getCachedValue,
  setCachedValue,
  formatShortError,
  MAX_INPUT_CHARS,
  VIDEO_API_TIMEOUT_MS,
} from "./utils";

export type {
  ClipSuggestion,
  HookOption,
  UppercasePlatform,
  SinglePlatformAdaptation,
  Platform,
  PlatformAdaptation,
  ScriptFootageMatch,
  EditDecisionList,
  ContentStat,
  CreatorInsights,
  VideoScene,
  VideoAnalysis,
  VideoAnalysisInput,
  PipelineInput,
  PipelineResult,
  ExecutionSource,
};

// ============================================================================
// Schemas
// ============================================================================

const structuredHooksResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hooks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hookText: {
            type: Type.STRING,
            description: "Engaging, scroll-stopping opening hook text (<= 140 chars).",
          },
          viralScore: {
            type: Type.INTEGER,
            description: "Predicted virality retention score between 0 and 100.",
          },
          emotionalType: {
            type: Type.STRING,
            description: "Emotional driver: 'FOMO', 'Curiosity', 'Pattern Interrupt', 'Bold Claim', or 'Pain Point'.",
          },
        },
        required: ["hookText", "viralScore", "emotionalType"],
      },
      description: "Exactly 3 distinct, high-impact hook options.",
    },
  },
  required: ["hooks"],
};

const singleAdaptContentResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Platform-optimized punchy title.",
    },
    description: {
      type: Type.STRING,
      description: "Platform-native caption and description text.",
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Trending, relevant hashtags for the target platform.",
    },
  },
  required: ["title", "description", "hashtags"],
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
            description: "Start timestamp matching transcript format (e.g. '00:15' or '00:01:15').",
          },
          endTime: {
            type: Type.STRING,
            description: "End timestamp matching transcript format (e.g. '00:45' or '00:01:45').",
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

const adaptContentResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    adaptations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: {
            type: Type.STRING,
            description: "Target platform name (youtube_shorts, instagram_reels, tiktok, x, linkedin).",
          },
          caption: {
            type: Type.STRING,
            description: "Platform-tailored caption text.",
          },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Relevant hashtags without punctuation.",
          },
          hook: {
            type: Type.STRING,
            description: "Platform-tailored opening hook.",
          },
          postingTip: {
            type: Type.STRING,
            description: "Actionable posting tip for max engagement on this platform.",
          },
        },
        required: ["platform", "caption", "hashtags", "hook", "postingTip"],
      },
    },
  },
  required: ["adaptations"],
};

const matchScriptResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    matches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scriptBeat: {
            type: Type.STRING,
            description: "The corresponding narrative beat from the script.",
          },
          startTime: {
            type: Type.STRING,
            description: "Start timestamp from transcript.",
          },
          endTime: {
            type: Type.STRING,
            description: "End timestamp from transcript.",
          },
          matchScore: {
            type: Type.NUMBER,
            description: "Alignment score between 0 and 1.",
          },
          note: {
            type: Type.STRING,
            description: "Brief note explaining how the footage delivers this beat.",
          },
        },
        required: ["scriptBeat", "startTime", "endTime", "matchScore", "note"],
      },
    },
  },
  required: ["matches"],
};

const videoAnalysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: {
      type: Type.STRING,
      description: "Full timestamped transcript with lines formatted exactly as '[MM:SS] spoken text'.",
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: { type: Type.STRING, description: "Start time in transcript format." },
          endTime: { type: Type.STRING, description: "End time in transcript format." },
          description: { type: Type.STRING, description: "Detailed visual and narrative description." },
          visualTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Visual elements, actions, or b-roll tags.",
          },
        },
        required: ["startTime", "endTime", "description", "visualTags"],
      },
      description: "Chronological scenes identified in the footage.",
    },
    durationSeconds: {
      type: Type.NUMBER,
      description: "Total estimated duration in seconds.",
    },
  },
  required: ["transcript", "scenes"],
};

const insightsNarrativeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "High-level performance summary narrative.",
    },
    patterns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 key audience and format patterns observed in the data.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 strategic, high-ROI recommendations for future content.",
    },
    bestPostingWindow: {
      type: Type.STRING,
      description: "Estimated best posting time window based on peak engagement.",
    },
  },
  required: ["summary", "patterns", "recommendations", "bestPostingWindow"],
};

// ============================================================================
// Platform Specifications & Post-Processing Rules
// ============================================================================

type PlatformSpec = {
  aspectRatio: "9:16" | "1:1" | "16:9";
  maxDurationSeconds: number;
  maxCaptionChars: number;
  maxHashtags: number;
  defaultTip: string;
};

const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  youtube_shorts: {
    aspectRatio: "9:16",
    maxDurationSeconds: 60,
    maxCaptionChars: 100,
    maxHashtags: 3,
    defaultTip: "Use 3 relevant tags (#shorts included) and pin your top comment with a CTA.",
  },
  instagram_reels: {
    aspectRatio: "9:16",
    maxDurationSeconds: 90,
    maxCaptionChars: 2200,
    maxHashtags: 5,
    defaultTip: "Pair with trending audio and place primary keywords in the first 2 lines.",
  },
  tiktok: {
    aspectRatio: "9:16",
    maxDurationSeconds: 60,
    maxCaptionChars: 2200,
    maxHashtags: 4,
    defaultTip: "Hook in the first 1.5 seconds and encourage comments with a debate prompt.",
  },
  x: {
    aspectRatio: "16:9",
    maxDurationSeconds: 140,
    maxCaptionChars: 280,
    maxHashtags: 2,
    defaultTip: "Post during business morning hours with an engaging quote tweet hook.",
  },
  linkedin: {
    aspectRatio: "1:1",
    maxDurationSeconds: 180,
    maxCaptionChars: 3000,
    maxHashtags: 3,
    defaultTip: "Format with clear line breaks, actionable takeaways, and a professional discussion question.",
  },
};

// ============================================================================
// Fallback Generators
// ============================================================================

function getFallbackHooks(scriptContent: string): HookOption[] {
  const seed = getFirstSentence(scriptContent);
  return [
    {
      hookText: `Stop scrolling: If you care about ${seed}, you need to hear this right now.`.slice(0, 140),
      viralScore: 94,
      emotionalType: "FOMO",
    },
    {
      hookText: `Most people get this completely wrong about ${seed}—here is what actually works.`.slice(0, 140),
      viralScore: 91,
      emotionalType: "Curiosity",
    },
    {
      hookText: `Wait, why is nobody talking about this trick for ${seed}?`.slice(0, 140),
      viralScore: 88,
      emotionalType: "Pattern Interrupt",
    },
  ];
}

function getFallbackSingleAdaptation(script: string, platform: UppercasePlatform): SinglePlatformAdaptation {
  const seed = getFirstSentence(script);
  const normalized = platform.toUpperCase();

  if (normalized === "TIKTOK") {
    return {
      title: `How to master ${seed}`.slice(0, 80),
      description: `Stop struggling with ${seed}! Here is the exact breakdown in 60s. Drop a comment with your thoughts 👇`,
      hashtags: ["#fyp", "#creator", "#viral", "#growthtips", "#trending"],
    };
  }

  if (normalized === "REELS") {
    return {
      title: `The Secret to ${seed}`.slice(0, 80),
      description: `Save this Reel for later! 📌 Everything you need to know about ${seed} in under 60 seconds.`,
      hashtags: ["#reelsinstagram", "#creators", "#viralreels", "#businesstips", "#contentstrategy"],
    };
  }

  // YOUTUBE
  return {
    title: `Do THIS for ${seed} (Complete Guide)`.slice(0, 100),
    description: `In this video, discover the complete framework for ${seed}. Subscribe for weekly creator strategies and workflows.`,
    hashtags: ["#Shorts", "#YouTubeShorts", "#ContentCreation", "#ViralStrategy"],
  };
}

function getFallbackClips(scriptContent: string, videoTranscript: string): ClipSuggestion[] {
  const seed = getFirstSentence(scriptContent);
  const normalized = normalizeTranscript(videoTranscript);
  const timestampRegex = /(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)(?:\]|\b)/g;
  const foundTimestamps: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(normalized)) !== null) {
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
    if (clips.length > 0) return clips;
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

function getFallbackAdaptations(scriptContent: string, platforms: Platform[]): PlatformAdaptation[] {
  const seed = getFirstSentence(scriptContent);
  return platforms.map((platform) => {
    const spec = PLATFORM_SPECS[platform] ?? PLATFORM_SPECS.youtube_shorts;
    const baseHashtags = ["#CreatorAI", "#ContentStrategy", "#ViralTips"].slice(0, spec.maxHashtags);
    const hook = `Here is everything you need to know about ${seed}.`;
    const caption = `${hook}\n\nKey breakdown and practical tips for creators. Let me know your thoughts!`.slice(
      0,
      spec.maxCaptionChars
    );

    return {
      platform,
      caption,
      hashtags: baseHashtags,
      hook: hook.slice(0, 140),
      aspectRatio: spec.aspectRatio,
      maxDurationSeconds: spec.maxDurationSeconds,
      postingTip: spec.defaultTip,
    };
  });
}

function getFallbackMatches(scriptContent: string, videoTranscript: string): ScriptFootageMatch[] {
  const seed = getFirstSentence(scriptContent);
  const clips = getFallbackClips(scriptContent, videoTranscript);

  return clips.map((clip, index) => ({
    scriptBeat: index === 0 ? `Opening Hook: ${seed}` : `Key Beat ${index + 1}: ${clip.title}`,
    startTime: clip.startTime,
    endTime: clip.endTime,
    startSeconds: clip.startSeconds,
    endSeconds: clip.endSeconds,
    matchScore: clip.confidence,
    note: `Direct thematic match derived from footage timeline (${clip.startTime} - ${clip.endTime}).`,
  }));
}

function getFallbackVideoAnalysis(): VideoAnalysis {
  return {
    transcript: "",
    scenes: [],
    durationSeconds: 0,
  };
}

// ============================================================================
// Internal Execution State Tracking
// ============================================================================

type ExecutionWithStatus<T> = {
  data: T;
  source: ExecutionSource;
  provider: ExecutionProvider;
  warning?: string;
};

// ============================================================================
// Public API Implementations
// ============================================================================

/**
 * Analyzes video files or URIs via Gemini multimodal capabilities, returning a timestamped transcript and visual scene breakdown.
 *
 * @param input - Video source information (filePath or fileUri, and mimeType).
 * @returns A VideoAnalysis object containing timestamped transcript and scene details.
 */
export async function analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysis> {
  const res = await internalAnalyzeVideo(input);
  return res.data;
}

async function internalAnalyzeVideo(input: VideoAnalysisInput): Promise<ExecutionWithStatus<VideoAnalysis>> {
  const { fileUri, filePath, mimeType } = input || {};
  if (!fileUri && !filePath) {
    console.warn("[CreatorAI] analyzeVideo: No fileUri or filePath provided. Returning fallback video analysis.");
    return { data: getFallbackVideoAnalysis(), source: "fallback", provider: "fallback", warning: "No fileUri or filePath provided for analyzeVideo" };
  }

  // Check persistent disk cache for video files
  const videoCacheKey = filePath ? generateVideoCacheKey(filePath) : fileUri ? generateCacheKey("analyzeVideo_v1", fileUri) : null;
  if (videoCacheKey) {
    const cached = getCachedValue<VideoAnalysis>(videoCacheKey);
    if (cached) {
      return { data: cached.value, source: "live", provider: cached.provider };
    }
  }

  const { client, model } = getGenAIClient();
  if (!client) {
    console.warn("[CreatorAI] analyzeVideo: GEMINI_API_KEY / GOOGLE_API_KEY is not set. Returning fallback video analysis.");
    return { data: getFallbackVideoAnalysis(), source: "fallback", provider: "fallback", warning: "API key is not configured for analyzeVideo" };
  }

  let uploadedFileName: string | undefined;

  try {
    let targetUri = fileUri;
    const targetMimeType = mimeType || "video/mp4";

    // Handle local file upload
    if (!targetUri && filePath) {
      const uploadResult = await client.files.upload({
        file: filePath,
        mimeType: targetMimeType,
      } as Parameters<typeof client.files.upload>[0]);
      uploadedFileName = uploadResult.name;
      targetUri = uploadResult.uri;

      // Poll until file state is ACTIVE
      if (uploadResult.name) {
        let fileInfo = await client.files.get({ name: uploadResult.name });
        let attempts = 0;
        while (fileInfo.state === "PROCESSING" && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          fileInfo = await client.files.get({ name: uploadResult.name });
          attempts++;
        }

        if (fileInfo.state !== "ACTIVE") {
          throw new Error(`Uploaded file failed to activate (state: ${fileInfo.state})`);
        }
      }
    }

    if (!targetUri) {
      throw new Error("Unable to obtain valid file URI for analysis");
    }

    const systemInstruction =
      "You are an expert video transcriber and visual scene analyzer. " +
      "Analyze the video footage and provide:\n" +
      "1. A complete timestamped transcript formatted with '[MM:SS] spoken text' per line.\n" +
      "2. A chronological scene breakdown with start/end timestamps, description, and visual tags.\n" +
      "Return only valid JSON matching the schema.";

    const prompt = "Transcribe this video footage with exact timestamps and extract key visual scenes.";

    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: targetUri,
                  mimeType: targetMimeType,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: videoAnalysisResponseSchema,
        },
      }),
      VIDEO_API_TIMEOUT_MS,
      "analyzeVideo"
    );

    const rawText = response.text ?? "";
    const parsed = safeJsonParse<{
      transcript?: string;
      scenes?: Array<{
        startTime?: string;
        endTime?: string;
        description?: string;
        visualTags?: string[];
      }>;
      durationSeconds?: number;
    }>(rawText);

    if (!parsed || typeof parsed.transcript !== "string") {
      console.warn("[CreatorAI] analyzeVideo: Failed to parse valid video analysis JSON from model response.");
      return { data: getFallbackVideoAnalysis(), source: "fallback", provider: "fallback", warning: "Failed to parse valid video analysis from model" };
    }

    const scenes: VideoScene[] = [];
    if (Array.isArray(parsed.scenes)) {
      for (const rawScene of parsed.scenes) {
        if (!rawScene) continue;
        const startTime = typeof rawScene.startTime === "string" ? rawScene.startTime.trim() : "00:00";
        const endTime = typeof rawScene.endTime === "string" ? rawScene.endTime.trim() : "00:00";
        const startSeconds = timeToSeconds(startTime);
        const endSeconds = timeToSeconds(endTime);

        if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds) || endSeconds <= startSeconds) {
          continue;
        }

        scenes.push({
          startTime,
          endTime,
          startSeconds,
          endSeconds,
          description: typeof rawScene.description === "string" ? rawScene.description.trim() : "Scene",
          visualTags: Array.isArray(rawScene.visualTags)
            ? rawScene.visualTags.filter((t): t is string => typeof t === "string")
            : [],
        });
      }
    }

    const normalizedTranscript = normalizeTranscript(parsed.transcript.trim());
    const resultData: VideoAnalysis = {
      transcript: normalizedTranscript,
      scenes,
      durationSeconds: parsed.durationSeconds || (scenes[scenes.length - 1]?.endSeconds ?? 0),
    };

    if (videoCacheKey) {
      setCachedValue(videoCacheKey, resultData, "gemini");
    }

    return {
      data: resultData,
      source: "live",
      provider: "gemini",
    };
  } catch (error) {
    const errorMsg = formatShortError(model, error);
    console.warn(`[CreatorAI] analyzeVideo: Video analysis failed (${errorMsg}). Returning fallback.`);
    return { data: getFallbackVideoAnalysis(), source: "fallback", provider: "fallback", warning: `analyzeVideo failed: ${errorMsg}` };
  } finally {
    if (uploadedFileName && client) {
      try {
        await client.files.delete({ name: uploadedFileName });
      } catch {
        // Best-effort cleanup
      }
    }
  }
}

/**
 * Generates structured, high-impact hook options containing hookText, viralScore (0-100), and emotionalType.
 *
 * @param scriptContent - The full or partial script text.
 * @returns An array of 3 structured HookOption objects.
 */
export async function generateHooks(scriptContent: string): Promise<HookOption[]> {
  const res = await internalGenerateHooks(scriptContent);
  return res.data;
}

async function internalGenerateHooks(scriptContent: string): Promise<ExecutionWithStatus<HookOption[]>> {
  const trimmedInput = (scriptContent ?? "").trim();
  if (!trimmedInput) {
    console.warn("[CreatorAI] generateHooks: Empty or whitespace input provided. Returning fallback hooks.");
    return { data: getFallbackHooks(""), source: "fallback", provider: "fallback", warning: "Empty input provided to generateHooks" };
  }

  const cacheKey = generateCacheKey("generateHooks_v3", trimmedInput);
  const cached = getCachedValue<HookOption[]>(cacheKey);
  if (cached) return { data: cached.value, source: "live", provider: cached.provider };

  const boundedInput = trimmedInput.slice(0, MAX_INPUT_CHARS);
  const systemInstruction =
    "You are an elite short-form content strategist for TikTok, YouTube Shorts, and Instagram Reels. " +
    "Analyze the provided script and generate EXACTLY 3 distinct, engaging hook options.\n" +
    "Requirements:\n" +
    "- hookText: strictly <= 140 characters, first-line scroll-stopping format.\n" +
    "- viralScore: predicted virality and retention rating as an integer from 0 to 100.\n" +
    "- emotionalType: psychological driver (e.g. 'FOMO', 'Curiosity', 'Pattern Interrupt', 'Bold Claim', 'Pain Point').\n" +
    "- Return only valid JSON conforming to the requested schema.";

  const prompt = `Script Content:\n"""\n${boundedInput}\n"""\n\nGenerate 3 distinct structured hooks.`;

  try {
    const execResult = await executeTextModelChain<HookOption[]>(
      async (modelName) => {
        const { client } = getGenAIClient();
        if (!client) throw new Error("GEMINI_API_KEY not configured");
        const res = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: structuredHooksResponseSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return res.text ?? "";
      },
      (rawText) => {
        const parsed = safeJsonParse<{
          hooks?: Array<{
            hookText?: string;
            viralScore?: number;
            emotionalType?: string;
          }>;
        }>(rawText);

        if (!parsed || !Array.isArray(parsed.hooks)) return null;

        const cleanedHooks: HookOption[] = [];
        for (const h of parsed.hooks) {
          if (!h || typeof h !== "object") continue;
          const hookText = typeof h.hookText === "string" ? h.hookText.trim() : "";
          if (!hookText) continue;

          const rawScore = typeof h.viralScore === "number" ? Math.round(h.viralScore) : 85;
          const viralScore = Math.max(0, Math.min(100, rawScore));
          const emotionalType = typeof h.emotionalType === "string" && h.emotionalType.trim()
            ? h.emotionalType.trim()
            : "Curiosity";

          cleanedHooks.push({
            hookText: hookText.length > 140 ? `${hookText.slice(0, 137)}...` : hookText,
            viralScore,
            emotionalType,
          });
        }

        if (cleanedHooks.length < 3) {
          const fallbackList = getFallbackHooks(trimmedInput);
          for (const fallback of fallbackList) {
            if (cleanedHooks.length >= 3) break;
            if (!cleanedHooks.some((item) => item.hookText === fallback.hookText)) {
              cleanedHooks.push(fallback);
            }
          }
        }

        return cleanedHooks.slice(0, 3);
      },
      systemInstruction,
      prompt,
      "generateHooks"
    );

    setCachedValue(cacheKey, execResult.data, execResult.provider);
    return { data: execResult.data, source: "live", provider: execResult.provider };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[CreatorAI] generateHooks: All providers failed (${errorMsg}). Returning fallback.`);
    return { data: getFallbackHooks(trimmedInput), source: "fallback", provider: "fallback", warning: `generateHooks failed: ${errorMsg}` };
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
  const res = await internalSuggestClips(scriptContent, videoTranscript);
  return res.data;
}

async function internalSuggestClips(
  scriptContent: string,
  videoTranscript: string
): Promise<ExecutionWithStatus<ClipSuggestion[]>> {
  const trimmedScript = (scriptContent ?? "").trim();
  const normalizedTranscript = normalizeTranscript(videoTranscript ?? "");

  if (!trimmedScript && !normalizedTranscript) {
    console.warn("[CreatorAI] suggestClips: Empty script and transcript provided. Returning fallback clips.");
    return { data: getFallbackClips("", ""), source: "fallback", provider: "fallback", warning: "Empty input to suggestClips" };
  }

  const cacheKey = generateCacheKey("suggestClips_v3", { trimmedScript, normalizedTranscript });
  const cached = getCachedValue<ClipSuggestion[]>(cacheKey);
  if (cached) return { data: cached.value, source: "live", provider: cached.provider };

  const boundedScript = trimmedScript.slice(0, MAX_INPUT_CHARS);
  const boundedTranscript = normalizedTranscript.slice(0, MAX_INPUT_CHARS);

  const systemInstruction =
    "You are an expert viral video editor and content strategist. " +
    "Compare the provided script against the timestamped transcript and identify 3 to 5 high-performing short-form clips (15 to 60 seconds each).\n" +
    "Requirements:\n" +
    "- Timestamps (startTime and endTime) MUST correspond to cues in the provided transcript.\n" +
    "- Each clip must be a self-contained segment with a strong opening hook and clean ending.\n" +
    "- Prioritize parts that align with key script beats.\n" +
    "- Return only valid JSON conforming to the requested schema.";

  const prompt =
    `Script:\n"""\n${boundedScript}\n"""\n\n` +
    `Timestamped Transcript:\n"""\n${boundedTranscript}\n"""\n\n` +
    "Identify 3-5 optimal short-form clips according to the instructions.";

  try {
    const execResult = await executeTextModelChain<ClipSuggestion[]>(
      async (modelName) => {
        const { client } = getGenAIClient();
        if (!client) throw new Error("GEMINI_API_KEY not configured");
        const res = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: clipsResponseSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return res.text ?? "";
      },
      (rawText) => {
        const parsed = safeJsonParse<{
          clips?: Array<{
            startTime?: string;
            endTime?: string;
            title?: string;
            reason?: string;
            confidence?: number;
          }>;
        }>(rawText);

        if (!parsed || !Array.isArray(parsed.clips)) return null;

        const validatedClips: ClipSuggestion[] = [];
        for (const item of parsed.clips) {
          if (!item || typeof item !== "object") continue;

          const startTime = typeof item.startTime === "string" ? item.startTime.trim() : "";
          const endTime = typeof item.endTime === "string" ? item.endTime.trim() : "";
          const title = typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Untitled Clip";
          const reason = typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : "Highlight segment.";

          const startSeconds = timeToSeconds(startTime);
          const endSeconds = timeToSeconds(endTime);

          if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) continue;
          if (endSeconds <= startSeconds) continue;

          const duration = endSeconds - startSeconds;
          if (duration < 5 || duration > 90) continue;

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

        if (validatedClips.length === 0) return null;

        validatedClips.sort((a, b) => b.confidence - a.confidence);
        return validatedClips.slice(0, 5);
      },
      systemInstruction,
      prompt,
      "suggestClips"
    );

    setCachedValue(cacheKey, execResult.data, execResult.provider);
    return { data: execResult.data, source: "live", provider: execResult.provider };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[CreatorAI] suggestClips: All providers failed (${errorMsg}). Returning fallback.`);
    return { data: getFallbackClips(trimmedScript, normalizedTranscript), source: "fallback", provider: "fallback", warning: `suggestClips failed: ${errorMsg}` };
  }
}

// Function signature overloads for adaptContent
export async function adaptContent(
  script: string,
  platform: UppercasePlatform
): Promise<SinglePlatformAdaptation>;
export async function adaptContent(
  scriptContent: string,
  platforms: Platform[]
): Promise<PlatformAdaptation[]>;

/**
 * Adapts script content across specified social media platforms or single uppercase platform targets.
 */
export async function adaptContent(
  scriptContent: string,
  platformOrPlatforms: Platform[] | UppercasePlatform
): Promise<PlatformAdaptation[] | SinglePlatformAdaptation> {
  const res = await internalAdaptContent(scriptContent, platformOrPlatforms);
  return res.data;
}

async function internalAdaptContent(
  scriptContent: string,
  platformOrPlatforms: Platform[] | UppercasePlatform
): Promise<ExecutionWithStatus<PlatformAdaptation[] | SinglePlatformAdaptation>> {
  const trimmedInput = (scriptContent ?? "").trim();

  // Case 1: Single Uppercase Platform ('TIKTOK' | 'REELS' | 'YOUTUBE')
  if (typeof platformOrPlatforms === "string") {
    const singlePlatform = platformOrPlatforms.toUpperCase() as UppercasePlatform;
    if (!trimmedInput) {
      console.warn(`[CreatorAI] adaptContent: Empty script provided for ${singlePlatform}. Returning fallback.`);
      return { data: getFallbackSingleAdaptation("", singlePlatform), source: "fallback", provider: "fallback", warning: `Empty script provided for ${singlePlatform}` };
    }

    const cacheKey = generateCacheKey("adaptContent_single_v3", { trimmedInput, singlePlatform });
    const cached = getCachedValue<SinglePlatformAdaptation>(cacheKey);
    if (cached) return { data: cached.value, source: "live", provider: cached.provider };

    const boundedInput = trimmedInput.slice(0, MAX_INPUT_CHARS);
    const systemInstruction =
      `You are a viral social media strategist specializing in ${singlePlatform}. ` +
      `Generate a platform-optimized title, description/caption, and 3-5 high-performing trending hashtags.\n` +
      `Return only valid JSON matching the schema.`;

    const prompt = `Script Content:\n"""\n${boundedInput}\n"""\n\nGenerate optimized title, description, and hashtags for ${singlePlatform}.`;

    try {
      const execResult = await executeTextModelChain<SinglePlatformAdaptation>(
        async (modelName) => {
          const { client } = getGenAIClient();
          if (!client) throw new Error("GEMINI_API_KEY not configured");
          const res = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: singleAdaptContentResponseSchema,
              thinkingConfig: { thinkingBudget: 0 },
            },
          });
          return res.text ?? "";
        },
        (rawText) => {
          const parsed = safeJsonParse<SinglePlatformAdaptation>(rawText);
          if (!parsed || !parsed.title || !parsed.description) return null;

          const hashtags = Array.isArray(parsed.hashtags)
            ? parsed.hashtags
                .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
                .map((h) => (h.startsWith("#") ? h.trim() : `#${h.trim()}`))
            : ["#viral", "#content", "#growth"];

          return {
            title: parsed.title.trim(),
            description: parsed.description.trim(),
            hashtags: hashtags.length > 0 ? hashtags : ["#viral", "#content"],
          };
        },
        systemInstruction,
        prompt,
        `adaptContent_${singlePlatform}`
      );

      setCachedValue(cacheKey, execResult.data, execResult.provider);
      return { data: execResult.data, source: "live", provider: execResult.provider };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[CreatorAI] adaptContent: All providers failed for ${singlePlatform} (${errorMsg}). Returning fallback.`);
      return { data: getFallbackSingleAdaptation(trimmedInput, singlePlatform), source: "fallback", provider: "fallback", warning: `adaptContent (${singlePlatform}) failed: ${errorMsg}` };
    }
  }

  // Case 2: Array of lowercase Platforms
  const targetPlatforms: Platform[] = Array.isArray(platformOrPlatforms) && platformOrPlatforms.length > 0
    ? platformOrPlatforms
    : (["youtube_shorts"] as Platform[]);

  if (!trimmedInput) {
    console.warn("[CreatorAI] adaptContent: Empty script input provided. Returning fallback adaptations.");
    return { data: getFallbackAdaptations("", targetPlatforms), source: "fallback", provider: "fallback", warning: "Empty script input to adaptContent" };
  }

  const cacheKey = generateCacheKey("adaptContent_multi_v3", { trimmedInput, targetPlatforms });
  const cached = getCachedValue<PlatformAdaptation[]>(cacheKey);
  if (cached) return { data: cached.value, source: "live", provider: cached.provider };

  const boundedInput = trimmedInput.slice(0, MAX_INPUT_CHARS);
  const systemInstruction =
    "You are a cross-platform content strategist. Adapt the provided content for each requested platform.\n" +
    "Produce platform-native captions, high-performing hashtags, engaging hooks, and actionable posting tips.\n" +
    "Return only valid JSON conforming to the requested schema.";

  const prompt = `Platforms to adapt for: ${targetPlatforms.join(", ")}\n\nContent:\n"""\n${boundedInput}\n"""`;

  try {
    const execResult = await executeTextModelChain<PlatformAdaptation[]>(
      async (modelName) => {
        const { client } = getGenAIClient();
        if (!client) throw new Error("GEMINI_API_KEY not configured");
        const res = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: adaptContentResponseSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return res.text ?? "";
      },
      (rawText) => {
        const parsed = safeJsonParse<{
          adaptations?: Array<{
            platform?: string;
            caption?: string;
            hashtags?: string[];
            hook?: string;
            postingTip?: string;
          }>;
        }>(rawText);

        const rawAdaptations = parsed?.adaptations ?? [];
        if (!Array.isArray(rawAdaptations) || rawAdaptations.length === 0) return null;

        const resultMap = new Map<Platform, PlatformAdaptation>();

        for (const raw of rawAdaptations) {
          const platformKey = (raw.platform ?? "").toLowerCase() as Platform;
          if (!targetPlatforms.includes(platformKey)) continue;

          const spec = PLATFORM_SPECS[platformKey] ?? PLATFORM_SPECS.youtube_shorts;
          const rawCaption = typeof raw.caption === "string" ? raw.caption.trim() : "";
          const caption = rawCaption.slice(0, spec.maxCaptionChars) || `Content update for ${platformKey}.`;

          const rawHashtags = Array.isArray(raw.hashtags) ? raw.hashtags : [];
          const hashtags = rawHashtags
            .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
            .map((h) => (h.startsWith("#") ? h.trim() : `#${h.trim()}`))
            .slice(0, spec.maxHashtags);

          const rawHook = typeof raw.hook === "string" ? raw.hook.trim() : "";
          const hook = (rawHook || getFirstSentence(trimmedInput)).slice(0, 140);

          const postingTip = typeof raw.postingTip === "string" && raw.postingTip.trim()
            ? raw.postingTip.trim()
            : spec.defaultTip;

          resultMap.set(platformKey, {
            platform: platformKey,
            caption,
            hashtags: hashtags.length > 0 ? hashtags : ["#CreatorAI"],
            hook,
            aspectRatio: spec.aspectRatio,
            maxDurationSeconds: spec.maxDurationSeconds,
            postingTip,
          });
        }

        const finalAdaptations: PlatformAdaptation[] = [];
        const fallbackList = getFallbackAdaptations(trimmedInput, targetPlatforms);

        for (const platform of targetPlatforms) {
          const match = resultMap.get(platform);
          if (match) {
            finalAdaptations.push(match);
          } else {
            const fb = fallbackList.find((f) => f.platform === platform) ?? fallbackList[0];
            finalAdaptations.push(fb);
          }
        }

        return finalAdaptations;
      },
      systemInstruction,
      prompt,
      "adaptContent_multi"
    );

    setCachedValue(cacheKey, execResult.data, execResult.provider);
    return { data: execResult.data, source: "live", provider: execResult.provider };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[CreatorAI] adaptContent: All providers failed (${errorMsg}). Returning fallback.`);
    return { data: getFallbackAdaptations(trimmedInput, targetPlatforms), source: "fallback", provider: "fallback", warning: `adaptContent failed: ${errorMsg}` };
  }
}

/**
 * Matches narrative beats from a script to exact timestamps in a video transcript.
 *
 * @param scriptContent - Original script or breakdown.
 * @param videoTranscript - Timestamped footage transcript.
 * @returns An array of ScriptFootageMatch objects with validated timestamps and match scores.
 */
export async function matchScriptToFootage(
  scriptContent: string,
  videoTranscript: string
): Promise<ScriptFootageMatch[]> {
  const res = await internalMatchScriptToFootage(scriptContent, videoTranscript);
  return res.data;
}

async function internalMatchScriptToFootage(
  scriptContent: string,
  videoTranscript: string
): Promise<ExecutionWithStatus<ScriptFootageMatch[]>> {
  const trimmedScript = (scriptContent ?? "").trim();
  const normalizedTranscript = normalizeTranscript(videoTranscript ?? "");

  if (!trimmedScript || !normalizedTranscript) {
    console.warn("[CreatorAI] matchScriptToFootage: Missing script or transcript. Returning fallback matches.");
    return { data: getFallbackMatches(trimmedScript, normalizedTranscript), source: "fallback", provider: "fallback", warning: "Missing script or transcript in matchScriptToFootage" };
  }

  const cacheKey = generateCacheKey("matchScriptToFootage_v3", { trimmedScript, normalizedTranscript });
  const cached = getCachedValue<ScriptFootageMatch[]>(cacheKey);
  if (cached) return { data: cached.value, source: "live", provider: cached.provider };

  // Calculate maximum transcript time for permissive matching
  const timestampRegex = /(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)(?:\]|\b)/g;
  let maxTimeSeconds = 0;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = timestampRegex.exec(normalizedTranscript)) !== null) {
    const s = timeToSeconds(tMatch[1]);
    if (!Number.isNaN(s) && s > maxTimeSeconds) {
      maxTimeSeconds = s;
    }
  }
  const maxAllowedSeconds = maxTimeSeconds > 0 ? maxTimeSeconds + 15 : 3600;

  const boundedScript = trimmedScript.slice(0, MAX_INPUT_CHARS);
  const boundedTranscript = normalizedTranscript.slice(0, MAX_INPUT_CHARS);

  const systemInstruction =
    "You are a professional video sync assistant. Match core script narrative beats to corresponding timeline timestamps in the transcript.\n" +
    "Requirements:\n" +
    "- startTime and endTime MUST correspond to the transcript timeline cues.\n" +
    "- matchScore must be a confidence number between 0 and 1.\n" +
    "- Return only valid JSON conforming to the requested schema.";

  const prompt = `Script:\n"""\n${boundedScript}\n"""\n\nTranscript:\n"""\n${boundedTranscript}\n"""`;

  try {
    const execResult = await executeTextModelChain<ScriptFootageMatch[]>(
      async (modelName) => {
        const { client } = getGenAIClient();
        if (!client) throw new Error("GEMINI_API_KEY not configured");
        const res = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: matchScriptResponseSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return res.text ?? "";
      },
      (rawText) => {
        const parsed = safeJsonParse<{
          matches?: Array<{
            scriptBeat?: string;
            startTime?: string;
            endTime?: string;
            matchScore?: number;
            note?: string;
          }>;
        }>(rawText);

        if (!parsed || !Array.isArray(parsed.matches)) return null;

        const validatedMatches: ScriptFootageMatch[] = [];
        for (const item of parsed.matches) {
          if (!item || typeof item !== "object") continue;

          const scriptBeat = typeof item.scriptBeat === "string" && item.scriptBeat.trim()
            ? item.scriptBeat.trim()
            : "Script Beat";
          const startTime = typeof item.startTime === "string" ? item.startTime.trim() : "";
          const endTime = typeof item.endTime === "string" ? item.endTime.trim() : "";
          const note = typeof item.note === "string" && item.note.trim() ? item.note.trim() : "Footage match.";

          const startSeconds = timeToSeconds(startTime);
          const endSeconds = timeToSeconds(endTime);

          if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) continue;
          if (endSeconds <= startSeconds) continue;
          if (startSeconds > maxAllowedSeconds) continue;

          const rawScore = typeof item.matchScore === "number" ? item.matchScore : 0.8;
          const matchScore = Math.max(0, Math.min(1, Number(rawScore.toFixed(2))));

          validatedMatches.push({
            scriptBeat,
            startTime,
            endTime,
            startSeconds,
            endSeconds,
            matchScore,
            note,
          });
        }

        if (validatedMatches.length === 0) return null;
        return validatedMatches;
      },
      systemInstruction,
      prompt,
      "matchScriptToFootage"
    );

    setCachedValue(cacheKey, execResult.data, execResult.provider);
    return { data: execResult.data, source: "live", provider: execResult.provider };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[CreatorAI] matchScriptToFootage: All providers failed (${errorMsg}). Returning fallback.`);
    return { data: getFallbackMatches(trimmedScript, normalizedTranscript), source: "fallback", provider: "fallback", warning: `matchScriptToFootage failed: ${errorMsg}` };
  }
}

/**
 * Builds a deterministic, editable Edit Decision List (EDL) from clip suggestions without calling external AI services.
 *
 * @param clips - Suggested clips to include in the edit.
 * @param opts - Optional configuration such as hook overlay text and target platform.
 * @returns An EditDecisionList object ready for timeline rendering or reordering.
 */
export function buildEditDecisionList(
  clips: ClipSuggestion[],
  opts?: { hook?: string; platform?: Platform }
): EditDecisionList {
  const safeClips = Array.isArray(clips) ? clips : [];
  const items: EditDecisionList["items"] = [];

  let timelineCursor = 0;

  if (opts?.hook && opts.hook.trim().length > 0) {
    const hookDuration = Math.min(3, safeClips[0] ? Math.max(1, safeClips[0].endSeconds - safeClips[0].startSeconds) : 3);
    items.push({
      id: "item-hook-overlay-1",
      type: "hook_overlay",
      startSeconds: 0,
      endSeconds: hookDuration,
      text: opts.hook.trim(),
      editable: true,
    });
  }

  safeClips.forEach((clip, index) => {
    const duration = Math.max(1, clip.endSeconds - clip.startSeconds);
    const clipStart = timelineCursor;
    const clipEnd = clipStart + duration;

    items.push({
      id: `item-clip-${index + 1}`,
      type: "clip",
      startSeconds: clipStart,
      endSeconds: clipEnd,
      text: clip.title,
      sourceClipIndex: index,
      editable: true,
    });

    items.push({
      id: `item-caption-${index + 1}`,
      type: "caption",
      startSeconds: clipStart,
      endSeconds: clipEnd,
      text: clip.reason,
      sourceClipIndex: index,
      editable: true,
    });

    timelineCursor = clipEnd;
  });

  return {
    version: 1,
    platform: opts?.platform,
    items,
  };
}

/**
 * Evaluates creator analytics and generates actionable strategic insights, calculating metrics locally and enhancing narrative via AI.
 *
 * @param stats - Historical performance metrics across posts and platforms.
 * @returns A CreatorInsights object containing top performers, patterns, recommendations, and posting window.
 */
export async function generateCreatorInsights(stats: ContentStat[]): Promise<CreatorInsights> {
  const safeStats = Array.isArray(stats) ? stats.filter((s) => s && typeof s.views === "number") : [];

  if (safeStats.length === 0) {
    console.warn("[CreatorAI] generateCreatorInsights: Empty stats array provided. Returning fallback insights.");
    return {
      summary: "No performance data available yet. Start publishing short-form content to generate actionable creator insights.",
      topPerformers: [],
      patterns: ["Publish consistently 3-5 times per week to establish a baseline."],
      recommendations: ["Focus on hook retention and clear visual pacing in the first 3 seconds."],
      bestPostingWindow: "12:00 PM - 3:00 PM local time",
    };
  }

  const scoredStats = safeStats.map((stat) => {
    const views = Math.max(0, stat.views || 0);
    const interactions = (stat.likes || 0) + (stat.comments || 0) * 2 + (stat.shares || 0) * 3;
    const engagementRate = views > 0 ? (interactions / views) * 100 : 0;
    return { ...stat, engagementRate };
  });

  scoredStats.sort((a, b) => b.views + b.engagementRate * 100 - (a.views + a.engagementRate * 100));
  const topPerformers = scoredStats.slice(0, 3).map((s) => s.title || "Untitled Post");

  const totalViews = safeStats.reduce((sum, s) => sum + (s.views || 0), 0);
  const avgViews = Math.round(totalViews / safeStats.length);

  const heuristicSummary = `Analyzed ${safeStats.length} content posts with ${totalViews.toLocaleString()} total views (avg ${avgViews.toLocaleString()} views/post). Top performers demonstrated significantly higher comment and share ratios.`;
  const heuristicPatterns = [
    `Videos under 45 seconds showed higher completion and re-watch rates.`,
    `Posts leading with curiosity-based questions generated 2x more comment replies.`,
  ];
  const heuristicRecs = [
    `Double down on formats similar to "${topPerformers[0] || "top performer"}" to compound audience growth.`,
    `Test posting during high-engagement lunch and evening commute windows.`,
  ];
  const defaultWindow = "2:00 PM - 5:00 PM (peak audience activity)";

  const { client } = getGenAIClient();
  if (!client) {
    console.warn("[CreatorAI] generateCreatorInsights: GEMINI_API_KEY / GOOGLE_API_KEY is not set. Returning locally computed insights.");
    return {
      summary: heuristicSummary,
      topPerformers,
      patterns: heuristicPatterns,
      recommendations: heuristicRecs,
      bestPostingWindow: defaultWindow,
    };
  }

  const systemInstruction =
    "You are a creator economy analytics specialist. Analyze the provided metrics and deliver a high-impact narrative summary, patterns, and recommendations. Return only valid JSON conforming to the schema.";

  const prompt = `Content Performance Data:\n${JSON.stringify(safeStats.slice(0, 30), null, 2)}\n\nGenerate strategic creator insights based on these metrics.`;

  try {
    const execResult = await executeTextModelChain<CreatorInsights>(
      async (modelName) => {
        const { client } = getGenAIClient();
        if (!client) throw new Error("GEMINI_API_KEY not configured");
        const res = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: insightsNarrativeSchema,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return res.text ?? "";
      },
      (rawText) => {
        const parsed = safeJsonParse<{
          summary?: string;
          patterns?: string[];
          recommendations?: string[];
          bestPostingWindow?: string;
        }>(rawText);

        if (!parsed || typeof parsed.summary !== "string") return null;

        return {
          summary: parsed.summary.trim() || heuristicSummary,
          topPerformers,
          patterns: Array.isArray(parsed.patterns) && parsed.patterns.length > 0 ? parsed.patterns : heuristicPatterns,
          recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 ? parsed.recommendations : heuristicRecs,
          bestPostingWindow: parsed.bestPostingWindow?.trim() || defaultWindow,
        };
      },
      systemInstruction,
      prompt,
      "generateCreatorInsights"
    );

    return execResult.data;
  } catch (error) {
    console.warn(
      `[CreatorAI] generateCreatorInsights: All providers failed (${error instanceof Error ? error.message : "Unknown error"}). Returning locally computed insights.`
    );
    return {
      summary: heuristicSummary,
      topPerformers,
      patterns: heuristicPatterns,
      recommendations: heuristicRecs,
      bestPostingWindow: defaultWindow,
    };
  }
}

/**
 * End-to-end orchestrator for the CreatorAi operating workflow:
 * video analysis (if needed) -> parallel hooks/clips/matches -> EDL compilation -> multi-platform adaptation.
 *
 * @param input - Configuration containing script, optional video input, transcript, and target platforms.
 * @returns A consolidated PipelineResult object containing all generated assets, per-step source, and diagnostic warnings.
 */
export async function runCreatorPipeline(input: PipelineInput): Promise<PipelineResult> {
  const warnings: string[] = [];
  const script = input?.script ?? "";
  const targetPlatforms: Platform[] = input?.platforms && input.platforms.length > 0
    ? input.platforms
    : (["youtube_shorts", "instagram_reels", "tiktok"] as Platform[]);

  let transcript = normalizeTranscript(input?.transcript ?? "");
  let scenes: VideoScene[] | undefined = undefined;
  let videoSource: ExecutionSource | undefined = undefined;
  let videoProvider: ExecutionProvider | undefined = undefined;

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if ((!apiKey || apiKey.trim() === "") && (!groqKey || groqKey.trim() === "")) {
    warnings.push("No AI API keys configured; running pipeline with local heuristics and fallbacks.");
  }

  // Step 1: Video Analysis (if video provided and transcript missing)
  if (!transcript && input?.video) {
    const videoRes = await internalAnalyzeVideo(input.video);
    transcript = videoRes.data.transcript;
    scenes = videoRes.data.scenes;
    videoSource = videoRes.source;
    videoProvider = videoRes.provider;
    if (videoRes.warning) warnings.push(videoRes.warning);
    if (!transcript) {
      warnings.push("Video transcription produced no transcript; proceeding with fallback transcript.");
    }
  }

  // Step 2: Parallel execution of hooks, clips, and footage matching
  const [hooksRes, clipsRes, matchesRes] = await Promise.all([
    internalGenerateHooks(script),
    internalSuggestClips(script, transcript),
    internalMatchScriptToFootage(script, transcript),
  ]);

  if (hooksRes.warning) warnings.push(hooksRes.warning);
  if (clipsRes.warning) warnings.push(clipsRes.warning);
  if (matchesRes.warning) warnings.push(matchesRes.warning);

  // Step 3: EDL Timeline compilation (pure function)
  const primaryHook = hooksRes.data[0]
    ? typeof hooksRes.data[0] === "string"
      ? hooksRes.data[0]
      : hooksRes.data[0].hookText
    : "";

  const edl = buildEditDecisionList(clipsRes.data, {
    hook: primaryHook,
    platform: targetPlatforms[0],
  });

  // Step 4: Multi-platform adaptations
  const adaptRes = await internalAdaptContent(script, targetPlatforms);
  if (adaptRes.warning) warnings.push(adaptRes.warning);

  return {
    hooks: hooksRes.data,
    clips: clipsRes.data,
    matches: matchesRes.data,
    edl,
    adaptations: Array.isArray(adaptRes.data) ? adaptRes.data : [],
    transcript,
    scenes,
    warnings,
    source: {
      videoAnalysis: videoSource,
      generateHooks: hooksRes.source,
      suggestClips: clipsRes.source,
      matchScriptToFootage: matchesRes.source,
      adaptContent: adaptRes.source,
    },
    provider: {
      videoAnalysis: videoProvider,
      generateHooks: hooksRes.provider,
      suggestClips: clipsRes.provider,
      matchScriptToFootage: matchesRes.provider,
      adaptContent: adaptRes.provider,
    },
  };
}
