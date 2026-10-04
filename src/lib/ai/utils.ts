import { GoogleGenAI } from "@google/genai";

export const MAX_INPUT_CHARS = 30_000;
export const DEFAULT_MODEL = "gemini-2.5-flash";
export const API_TIMEOUT_MS = 20_000;

/**
 * Lazily retrieves the GoogleGenAI client instance or null if API key is not configured.
 */
export function getGenAIClient(): { client: GoogleGenAI | null; model: string } {
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
 * Executes an async task with a strict timeout rejection.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
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
