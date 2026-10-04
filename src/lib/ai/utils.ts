import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";

export const MAX_INPUT_CHARS = 30_000;
export const DEFAULT_MODEL = "gemini-2.5-flash";
export const FALLBACK_MODEL = "gemini-2.5-flash";
export const TEXT_API_TIMEOUT_MS = 30_000;
export const VIDEO_API_TIMEOUT_MS = 120_000;

/**
 * In-memory LRU-like cache (max 100 entries, 10 min TTL).
 */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a SHA-256 hash key for caching function calls.
 */
export function generateCacheKey(functionName: string, inputs: unknown): string {
  const serialized = JSON.stringify(inputs);
  return createHash("sha256").update(`${functionName}:${serialized}`).digest("hex");
}

/**
 * Retrieves a cached value if present and not expired.
 */
export function getCachedValue<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Stores a successful AI result in the in-memory cache.
 */
export function setCachedValue<T>(key: string, value: T): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Lazily retrieves the GoogleGenAI client instance or null if API key is not configured.
 */
export function getGenAIClient(): { client: GoogleGenAI | null; model: string; fallbackModel: string } {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL ?? FALLBACK_MODEL;

  if (!apiKey || apiKey.trim() === "") {
    return { client: null, model, fallbackModel };
  }

  return {
    client: new GoogleGenAI({ apiKey: apiKey.trim() }),
    model,
    fallbackModel,
  };
}

/**
 * Normalizes transcript text by splitting timestamp cues like [MM:SS] or [HH:MM:SS] into distinct lines.
 */
export function normalizeTranscript(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  // Split on timestamp cues while keeping timestamps
  const lines: string[] = [];
  const cueRegex = /(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)(?:\]|\b)/g;

  const rawTrimmed = raw.trim();
  if (!rawTrimmed) return "";

  const matches: Array<{ timestamp: string; index: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = cueRegex.exec(rawTrimmed)) !== null) {
    matches.push({ timestamp: m[1], index: m.index });
  }

  if (matches.length === 0) {
    return rawTrimmed;
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const startIndex = current.index;
    const endIndex = next ? next.index : rawTrimmed.length;
    const chunk = rawTrimmed.substring(startIndex, endIndex).trim();

    // Clean up format into "[MM:SS] text"
    const cleanedChunk = chunk
      .replace(/^\[?(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\]?\s*[-:]?\s*/, "[$1] ")
      .trim();

    if (cleanedChunk) {
      lines.push(cleanedChunk);
    }
  }

  return lines.join("\n");
}

/**
 * Executes an async task with a configurable timeout rejection.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TEXT_API_TIMEOUT_MS,
  operationName: string = "AI Operation"
): Promise<T> {
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
 * Robust retry executor for text API calls with thinking budget = 0 and fallback model switching.
 */
export async function executeWithRetry<T>(
  fn: (modelName: string) => Promise<T>,
  operationName: string
): Promise<T> {
  const { client, model, fallbackModel } = getGenAIClient();
  if (!client) {
    throw new Error("API key not configured");
  }

  const modelsToTry = [model, fallbackModel];
  let lastError: unknown;

  for (const currentModel of modelsToTry) {
    const attempts = currentModel === model ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await withTimeout(fn(currentModel), TEXT_API_TIMEOUT_MS, `${operationName} (${currentModel})`);
      } catch (err) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isRetryable =
          errMsg.includes("429") ||
          errMsg.includes("500") ||
          errMsg.includes("503") ||
          errMsg.includes("timed out") ||
          errMsg.includes("high demand") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (attempt < attempts && isRetryable) {
          const delayMs = attempt * 1000;
          await new Promise((res) => setTimeout(res, delayMs));
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

/**
 * Converts timestamp strings in "SS", "MM:SS", "HH:MM:SS", or decimal formats (e.g., "01:23.456") to seconds.
 * Returns NaN if input cannot be parsed.
 */
export function timeToSeconds(t: string): number {
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
 * Formats seconds back to MM:SS or HH:MM:SS string.
 */
export function secondsToTime(totalSeconds: number): string {
  const rounded = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Removes markdown code block wraps and parses JSON safely.
 */
export function safeJsonParse<T>(rawText: string): T | null {
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
 * Extracts a concise lead snippet from text content for fallback generation.
 */
export function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "this topic";
  const match = trimmed.match(/^([^.!?\n]+)/);
  const sentence = match ? match[1].trim() : trimmed.slice(0, 50).trim();
  return sentence.length > 50 ? `${sentence.slice(0, 47)}...` : sentence;
}
