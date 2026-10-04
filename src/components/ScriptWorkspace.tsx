"use client";

import { useState, useEffect } from "react";
import type { ScriptData } from "../types";

const MOCK_SCRIPT: ScriptData = {
  id: "s1",
  projectId: "p1",
  title: "Top 5 AI Tools",
  content: "Here are the top 5 AI tools you must use in 2024. First up is...",
  hooks: ["Want to save 10 hours a week?", "If you use AI, you need to see this."],
};

function parseHooks(rawHooks: unknown): string[] {
  if (Array.isArray(rawHooks)) return rawHooks;
  if (typeof rawHooks === "string") {
    try {
      const parsed = JSON.parse(rawHooks);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Return line-delimited or comma-separated if not JSON
      if (rawHooks.includes("\n")) return rawHooks.split("\n").filter(Boolean);
      if (rawHooks.trim()) return [rawHooks.trim()];
    }
  }
  return [];
}

export function ScriptWorkspace() {
  const [title, setTitle] = useState(MOCK_SCRIPT.title);
  const [content, setContent] = useState(MOCK_SCRIPT.content);
  const [hooks, setHooks] = useState<string[]>(MOCK_SCRIPT.hooks);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadScripts() {
      try {
        setLoading(true);
        const res = await fetch("/api/scripts");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            setTitle(latest.title || "");
            setContent(latest.content || "");
            const parsed = parseHooks(latest.hooks);
            setHooks(parsed.length > 0 ? parsed : MOCK_SCRIPT.hooks);
          }
        }
      } catch (err) {
        console.error("Failed to load scripts from /api/scripts", err);
      } finally {
        setLoading(false);
      }
    }

    loadScripts();
  }, []);

  async function handleGenerateHooks() {
    if (!content.trim() && !title.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "p1",
          title: title.trim() || "Untitled Script",
          content: content.trim(),
          generateHooks: true,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const parsed = parseHooks(created.hooks);
        if (parsed.length > 0) {
          setHooks(parsed);
        }
        setSavedNotice("Generated 3 AI hooks and synced to script!");
        setTimeout(() => setSavedNotice(null), 4000);
      } else {
        console.error("Failed to generate hooks via /api/scripts");
      }
    } catch (err) {
      console.error("Error generating hooks:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmitScript(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!content.trim() && !title.trim()) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "p1",
          title: title.trim() || "Untitled Script",
          content: content.trim(),
          hooks: hooks,
        }),
      });

      if (res.ok) {
        setSavedNotice("Script saved successfully!");
        setTimeout(() => setSavedNotice(null), 3000);
      }
    } catch (err) {
      console.error("Error saving script:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Script Workspace</h2>
          <p className="text-xs text-zinc-500 mt-1">Write your narrative beats and generate viral AI hooks</p>
        </div>
        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-fade-in">
              {savedNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmitScript}
            disabled={isSaving || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Script"}
          </button>
          <button
            type="button"
            onClick={handleGenerateHooks}
            disabled={isGenerating || loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating AI Hooks...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Hooks
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[600px] shadow-sm">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Hook Previews
              </h3>
              <span className="text-xs text-zinc-500">{hooks.length} options</span>
            </div>

            {loading ? (
              <div className="text-zinc-500 text-xs py-6 text-center">Loading hooks...</div>
            ) : hooks.length === 0 ? (
              <div className="text-zinc-500 text-xs py-6 text-center border border-dashed border-zinc-800 rounded-xl">
                No hooks yet. Click &quot;Generate Hooks&quot; to synthesize viral hooks with AI.
              </div>
            ) : (
              <div className="space-y-4">
                {hooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(hook);
                      setSavedNotice(`Hook ${idx + 1} copied to clipboard!`);
                      setTimeout(() => setSavedNotice(null), 2500);
                    }}
                    title="Click to copy hook"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        Hook {idx + 1}
                      </span>
                      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                        Click to copy
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{hook}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScriptWorkspace;
