"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { ScriptData } from "../types";

interface HookOption {
  hookText: string;
  viralScore: number;
  emotionalType: string;
}

export default function ScriptWorkspace() {
  const [title, setTitle] = useState("Top 5 AI Tools");
  const [content, setContent] = useState(
    "Here are the top 5 AI tools you must use in 2024. First up is..."
  );
  const [hooks, setHooks] = useState<HookOption[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Fetch existing scripts on mount and hydrate the latest one
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/scripts");
        if (res.ok) {
          const scripts = await res.json();
          if (scripts.length > 0) {
            const latest = scripts[0];
            setTitle(latest.title);
            setContent(latest.content);
            try {
              const parsed = JSON.parse(latest.hooks);
              if (Array.isArray(parsed)) {
                setHooks(
                  parsed.map((h: HookOption | string) =>
                    typeof h === "string"
                      ? { hookText: h, viralScore: 85, emotionalType: "Curiosity" }
                      : h
                  )
                );
              }
            } catch {
              // hooks stored as plain string array
              if (latest.hooks) {
                setHooks([
                  { hookText: latest.hooks, viralScore: 85, emotionalType: "Curiosity" },
                ]);
              }
            }
          }
        }
      } catch {
        // Silently fall back to defaults
      }
    })();
  }, []);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateHooks = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          generateHooks: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate hooks");
      }

      const script = await res.json();

      // Parse the hooks response — the API stores them as JSON string
      let parsedHooks: HookOption[] = [];
      try {
        const raw = JSON.parse(script.hooks);
        if (Array.isArray(raw)) {
          parsedHooks = raw.map((h: HookOption | string) =>
            typeof h === "string"
              ? { hookText: h, viralScore: 85, emotionalType: "Curiosity" }
              : h
          );
        }
      } catch {
        parsedHooks = [
          { hookText: script.hooks, viralScore: 85, emotionalType: "Curiosity" },
        ];
      }

      setHooks(parsedHooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const emotionColor = (type: string) => {
    switch (type) {
      case "FOMO":
        return "text-red-400 border-red-500/20 bg-red-500/10";
      case "Curiosity":
        return "text-blue-400 border-blue-500/20 bg-blue-500/10";
      case "Pattern Interrupt":
        return "text-purple-400 border-purple-500/20 bg-purple-500/10";
      case "Bold Claim":
        return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      case "Pain Point":
        return "text-orange-400 border-orange-500/20 bg-orange-500/10";
      default:
        return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[600px] shadow-sm relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-b border-zinc-800 pb-3 text-2xl font-semibold outline-none focus:border-emerald-500 text-zinc-100 transition-colors placeholder:text-zinc-600"
              placeholder="Script Title..."
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-6 flex-1 bg-transparent resize-none outline-none text-zinc-300 leading-relaxed text-lg placeholder:text-zinc-600"
              placeholder="Write your script content here..."
            />

            {/* Word & Char Counter */}
            <div className="absolute bottom-4 right-6 flex items-center gap-4 text-xs font-mono text-zinc-500">
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                AI Hooks
              </h3>
              <button
                onClick={handleGenerateHooks}
                disabled={isGenerating || !content.trim()}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate new hooks"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative group transition-colors hover:border-emerald-500/30"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-emerald-500 transition-colors rounded-l-xl" />

                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                      {hook.hookText}
                    </p>
                    <button
                      onClick={() => handleCopy(hook.hookText, idx)}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors p-1.5 bg-zinc-900 rounded-md border border-zinc-800 flex-shrink-0"
                    >
                      {copiedIndex === idx ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* Viral Score & Emotional Type */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${hook.viralScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {hook.viralScore}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${emotionColor(hook.emotionalType)}`}
                    >
                      {hook.emotionalType}
                    </span>
                  </div>

                  {copiedIndex === idx && (
                    <div className="absolute -top-8 right-0 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-lg animate-in fade-in zoom-in duration-200">
                      Copied!
                    </div>
                  )}
                </div>
              ))}

              {hooks.length === 0 && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                  <Sparkles size={32} className="text-zinc-700" />
                  <p className="text-sm text-center">
                    Write your script and click the sparkle button to generate
                    AI-powered viral hooks.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="bg-zinc-950/50 border border-zinc-800 border-dashed p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-500 py-8 animate-pulse">
                  <Loader2 size={24} className="animate-spin text-emerald-500/50" />
                  <span className="text-xs font-medium">Generating magic...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
