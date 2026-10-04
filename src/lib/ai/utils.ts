import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ExecutionProvider } from "./types";

export const MAX_INPUT_CHARS = 30_000;
export const DEFAULT_MODEL = "gemini-2.5-flash";
export const DEFAULT_FALLBACK_MODELS = "gemini-2.5-flash-lite";
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
export const TEXT_API_TIMEOUT_MS = 30_000;
export const VIDEO_API_TIMEOUT_MS = 120_000;

const CACHE_DIR = path.resolve(process.cwd(), ".cache", "ai");
const MEMORY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MEMORY_CACHE_ENTRIES = 100;

type CacheEntry<T> = {
  value: T;
  provider?: ExecutionProvider;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Checks if disk caching is enabled (default enabled, disabled if AI_DISK_CACHE=0).
 */
function isDiskCacheEnabled(): boolean {
  return process.env.AI_DISK_CACHE !== "0";
}

/**
 * Generates a SHA-256 hash key for caching function calls.
 */
export function generateCacheKey(functionName: string, inputs: unknown): string {
  const serialized = JSON.stringify(inputs);
  return createHash("sha256").update(`${functionName}:${serialized}`).digest("hex");
}

/**
 * Generates a video cache key based on file path, size, and modified time.
 */
export function generateVideoCacheKey(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    const basename = path.basename(filePath);
    return createHash("sha256")
      .update(`video:${basename}:${stats.size}:${stats.mtimeMs}`)
      .digest("hex");
  } catch {
    return createHash("sha256").update(`video:${filePath}`).digest("hex");
  }
}

/**
 * Retrieves a cached value from memory or disk (if not expired).
 */
export function getCachedValue<T>(key: string): { value: T; provider: ExecutionProvider } | null {
  // 1. Check in-memory cache
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry) {
    if (Date.now() <= memEntry.expiresAt) {
      return { value: memEntry.value, provider: memEntry.provider ?? "gemini" };
    }
    memoryCache.delete(key);
  }

  // 2. Check persistent disk cache
  if (isDiskCacheEnabled()) {
    try {
      const diskPath = path.join(CACHE_DIR, `${key}.json`);
      if (fs.existsSync(diskPath)) {
        const content = fs.readFileSync(diskPath, "utf-8");
        const entry = JSON.parse(content) as CacheEntry<T>;
        if (Date.now() <= entry.expiresAt) {
          // Populate back into memory cache
          setMemoryCache(key, entry.value, entry.provider ?? "gemini");
          return { value: entry.value, provider: entry.provider ?? "gemini" };
        }
        // Remove expired disk cache
        fs.unlinkSync(diskPath);
      }
    } catch {
      // Ignore disk read errors
    }
  }

  return null;
}

function setMemoryCache<T>(key: string, value: T, provider: ExecutionProvider): void {
  if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    value,
    provider,
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
  });
}

/**
 * Stores a successful AI result into memory and persistent disk cache.
 */
export function setCachedValue<T>(key: string, value: T, provider: ExecutionProvider = "gemini"): void {
  setMemoryCache(key, value, provider);

  if (isDiskCacheEnabled()) {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const diskPath = path.join(CACHE_DIR, `${key}.json`);
      const diskEntry: CacheEntry<T> = {
        value,
        provider,
        expiresAt: Date.now() + DISK_CACHE_TTL_MS,
      };
      fs.writeFileSync(diskPath, JSON.stringify(diskEntry), "utf-8");
    } catch {
      // Ignore disk write errors
    }
  }
}

/**
 * Lazily retrieves the GoogleGenAI client instance or null if API key is not configured.
 */
export function getGenAIClient(): {
  client: GoogleGenAI | null;
  model: string;
  fallbackModels: string[];
} {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const fallbackEnv = process.env.GEMINI_FALLBACK_MODELS ?? DEFAULT_FALLBACK_MODELS;
  const fallbackModels = fallbackEnv
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  if (!apiKey || apiKey.trim() === "") {
    return { client: null, model, fallbackModels };
  }

  return {
    client: new GoogleGenAI({ apiKey: apiKey.trim() }),
    model,
    fallbackModels,
  };
}

/**
 * Extracts a concise error message from raw error structures or strings.
 */
export function formatShortError(modelName: string, err: unknown): string {
  const rawMsg = err instanceof Error ? err.message : String(err);
  if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
    if (rawMsg.includes("PerDay") || rawMsg.includes("free_tier_requests") || rawMsg.includes("retryDelay")) {
      return `${modelName}: quota exhausted (daily)`;
    }
    return `${modelName}: rate limit exceeded (429)`;
  }
  if (rawMsg.includes("503") || rawMsg.includes("high demand")) {
    return `${modelName}: service temporarily unavailable (503)`;
  }
  if (rawMsg.includes("500")) {
    return `${modelName}: internal server error (500)`;
  }
  if (rawMsg.includes("timed out")) {
    return `${modelName}: request timed out`;
  }
  if (rawMsg.includes("NOT_FOUND") || rawMsg.includes("404")) {
    return `${modelName}: model not found or deprecated`;
  }
  return `${modelName}: call failed (${rawMsg.slice(0, 50)})`;
}

/**
 * Normalizes transcript text by splitting timestamp cues like [MM:SS] or [HH:MM:SS] into distinct lines.
 */
export function normalizeTranscript(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

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
 * Calls Groq API using native fetch without external dependencies.
 */
async function callGroqChat(systemInstruction: string, prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GROQ_API_KEY not configured");
  }

  const model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
  const systemWithJson = `${systemInstruction}\nReturn only a valid JSON object matching the requested schema. Do not include markdown code fences or conversational text.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemWithJson },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export type TextExecutionResult<T> = {
  data: T;
  provider: ExecutionProvider;
};

/**
 * Robust model-chain executor:
 * GEMINI_MODEL -> GEMINI_FALLBACK_MODELS -> Groq -> Throw for fallback handling.
 */
export async function executeTextModelChain<T>(
  geminiCall: (modelName: string) => Promise<string>,
  parseAndValidate: (rawText: string) => T | null,
  systemInstruction: string,
  prompt: string,
  operationName: string
): Promise<TextExecutionResult<T>> {
  const { client, model, fallbackModels } = getGenAIClient();
  const errors: string[] = [];

  // 1. Try Gemini primary and fallback models
  if (client) {
    const geminiModels = [model, ...fallbackModels.filter((m) => m !== model)];

    for (const currentModel of geminiModels) {
      let isDailyQuotaExhausted = false;

      // Try up to 2 attempts for transient errors
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const rawText = await withTimeout(
            geminiCall(currentModel),
            TEXT_API_TIMEOUT_MS,
            `${operationName} (${currentModel})`
          );
          const parsed = parseAndValidate(rawText);
          if (parsed !== null) {
            return { data: parsed, provider: "gemini" };
          }
          throw new Error("Model returned invalid or incomplete schema structure");
        } catch (err) {
          const formatted = formatShortError(currentModel, err);
          errors.push(formatted);
          const rawMsg = err instanceof Error ? err.message : String(err);

          // If daily quota is exhausted (429 with PerDay or large delay), do NOT retry same model
          if (
            rawMsg.includes("PerDay") ||
            rawMsg.includes("free_tier_requests") ||
            rawMsg.includes("retryDelay") ||
            rawMsg.includes("RESOURCE_EXHAUSTED")
          ) {
            isDailyQuotaExhausted = true;
            break;
          }

          const isTransient =
            rawMsg.includes("503") ||
            rawMsg.includes("high demand") ||
            rawMsg.includes("timed out") ||
            rawMsg.includes("500");

          if (attempt === 1 && isTransient) {
            await new Promise((res) => setTimeout(res, 1000));
          } else {
            break;
          }
        }
      }

      if (isDailyQuotaExhausted) {
        // Move immediately to next model without lingering
        continue;
      }
    }
  }

  // 2. Try Groq provider if available
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
    try {
      const groqRawText = await withTimeout(
        callGroqChat(systemInstruction, prompt),
        TEXT_API_TIMEOUT_MS,
        `${operationName} (groq)`
      );
      const parsed = parseAndValidate(groqRawText);
      if (parsed !== null) {
        return { data: parsed, provider: "groq" };
      }
      errors.push("groq: invalid json schema returned");
    } catch (groqErr) {
      errors.push(formatShortError("groq", groqErr));
    }
  }

  throw new Error(errors.join(" | ") || "All providers in model chain failed");
}

/**
 * Converts timestamp strings in "SS", "MM:SS", "HH:MM:SS", or decimal formats to seconds.
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
