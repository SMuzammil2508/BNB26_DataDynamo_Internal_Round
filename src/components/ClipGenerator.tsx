"use client";

import { useState, useEffect } from "react";
import type { GeneratedClip } from "../types";

const INITIAL_MOCK_CLIPS: GeneratedClip[] = [
  { id: "c1", projectId: "p1", title: "Hook 1 - Fast Pace", videoUrl: "https://placehold.co/400x700/0f172a/fff?text=Clip+1", startTime: 0, endTime: 15, platform: "SHORTS" },
  { id: "c2", projectId: "p1", title: "Main Body - Slow", videoUrl: "https://placehold.co/400x700/0f172a/fff?text=Clip+2", startTime: 15, endTime: 45, platform: "REELS" },
];

export function ClipGenerator() {
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"ALL" | "SHORTS" | "REELS" | "TIKTOK">("ALL");

  useEffect(() => {
    async function loadClips() {
      try {
        setLoading(true);
        const res = await fetch("/api/clips");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setClips(data);
          } else {
            setClips(INITIAL_MOCK_CLIPS);
          }
        } else {
          setClips(INITIAL_MOCK_CLIPS);
        }
      } catch (err) {
        console.error("Failed to load clips from /api/clips", err);
        setClips(INITIAL_MOCK_CLIPS);
      } finally {
        setLoading(false);
      }
    }

    loadClips();
  }, []);

  async function handleGenerateClip() {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "p1",
          platform: selectedPlatform !== "ALL" ? selectedPlatform : undefined,
        }),
      });

      if (res.ok) {
        const created: GeneratedClip = await res.json();
        setClips((prev) => [created, ...prev]);
      } else {
        console.error("Failed to generate clip via /api/clips");
      }
    } catch (err) {
      console.error("Error generating clip:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  const filteredClips = selectedPlatform === "ALL"
    ? clips
    : clips.filter((c) => c.platform === selectedPlatform);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Generated Clips</h2>
          <p className="text-xs text-zinc-500 mt-1">Multi-platform viral cuts extracted with Gemini AI</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            {(["ALL", "SHORTS", "REELS", "TIKTOK"] as const).map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedPlatform === plat
                    ? "bg-zinc-800 text-emerald-400 font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerateClip}
            disabled={isGenerating || loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Extracting with AI...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Generate New Clip
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-500 text-sm">
          Loading generated clips...
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          No clips found for platform: {selectedPlatform}. Click &quot;Generate New Clip&quot; to extract viral segments.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-sm"
            >
              <div className="aspect-[9/16] bg-zinc-950 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clip.videoUrl}
                  alt={clip.title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span
                    className={`bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      clip.platform === "SHORTS"
                        ? "text-red-400 border-red-500/20"
                        : clip.platform === "REELS"
                        ? "text-pink-400 border-pink-500/20"
                        : "text-cyan-400 border-cyan-500/20"
                    }`}
                  >
                    {clip.platform}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between text-xs font-mono bg-zinc-900/80 backdrop-blur-md rounded-lg px-3 py-2 border border-zinc-700/50">
                    <span className="text-zinc-300">{clip.startTime}s</span>
                    <span className="text-emerald-400 flex-1 text-center">→</span>
                    <span className="text-zinc-300">{clip.endTime}s</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-zinc-100 line-clamp-1">{clip.title}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Duration: {(clip.endTime - clip.startTime).toFixed(0)}s</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClipGenerator;
