"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Play,
  Maximize2,
  X,
  Monitor,
  Smartphone,
  Video,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { GeneratedClip } from "../types";

interface ClipWithScore extends GeneratedClip {
  viralityScore?: number | null;
  platformFormat?: string | null;
}

export default function ClipGenerator() {
  const [clips, setClips] = useState<ClipWithScore[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipWithScore | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<"MOBILE" | "DESKTOP">(
    "MOBILE"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClips = async () => {
    try {
      const res = await fetch("/api/clips");
      if (res.ok) {
        const data = await res.json();
        setClips(data);
      }
    } catch {
      // Silently fall back
    }
  };

  useEffect(() => {
    fetchClips();
  }, []);

  const handleGenerateClip = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateAI: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate clip");
      }

      // Refresh the full list after generation
      await fetchClips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const platformColor = (platform: string) => {
    switch (platform) {
      case "SHORTS":
        return "text-red-400 border-red-500/20 bg-red-500/10";
      case "REELS":
        return "text-pink-400 border-pink-500/20 bg-pink-500/10";
      case "TIKTOK":
        return "text-cyan-400 border-cyan-500/20 bg-cyan-500/10";
      default:
        return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <p className="text-zinc-400">
          Review, preview and export your AI-generated clips.
        </p>
        <button
          onClick={handleGenerateClip}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Video size={16} />
          )}
          {isGenerating ? "Generating..." : "Generate New Clip"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {clips.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
          <Video size={48} className="text-zinc-700" />
          <p className="text-sm text-center max-w-md">
            No clips yet. Click &quot;Generate New Clip&quot; to create
            AI-powered short-form clips from your scripts and footage.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-sm flex flex-col"
          >
            {/* 9:16 Vertical Preview */}
            <div
              className="aspect-[9/16] bg-zinc-950 relative overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={() => setSelectedClip(clip)}
            >
              <video
                src={clip.videoUrl}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 backdrop-blur p-3 rounded-full text-white">
                  <Play size={24} className="ml-1" />
                </div>
              </div>

              <div className="absolute top-3 right-3 flex gap-2">
                <span
                  className={`backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${platformColor(clip.platform)}`}
                >
                  {clip.platform}
                </span>
              </div>

              {/* Virality Score Badge */}
              {clip.viralityScore != null && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md px-2 py-1 rounded-md border border-emerald-500/20">
                  <TrendingUp size={10} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    {Math.round(clip.viralityScore * 100)}%
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between text-xs font-mono bg-zinc-900/90 backdrop-blur-md rounded-lg px-3 py-2 border border-zinc-700/50 shadow-inner">
                  <span className="text-zinc-300">{clip.startTime}s</span>
                  <div className="flex-1 h-px bg-zinc-700 mx-3 relative">
                    <div className="absolute inset-y-0 left-0 bg-emerald-500 w-1/3 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  </div>
                  <span className="text-zinc-300">{clip.endTime}s</span>
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1 gap-4">
              <h3 className="font-medium text-zinc-100 line-clamp-2 text-sm">
                {clip.title}
              </h3>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => setSelectedClip(clip)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Maximize2 size={14} /> Preview
                </button>
                <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading state inline */}
      {isGenerating && (
        <div className="flex items-center justify-center py-8 gap-3 text-zinc-500">
          <Loader2 size={20} className="animate-spin text-emerald-500" />
          <span className="text-sm font-medium">
            AI is generating your clip...
          </span>
        </div>
      )}

      {/* Video Preview Modal */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedClip(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* Player Area */}
            <div
              className={`bg-black flex items-center justify-center p-8 transition-all duration-500 ${isPreviewMode === "MOBILE" ? "md:w-1/2" : "md:w-3/4"}`}
            >
              <div
                className={`relative overflow-hidden rounded-xl shadow-2xl bg-zinc-900 transition-all duration-500 ${isPreviewMode === "MOBILE" ? "aspect-[9/16] w-full max-w-[320px]" : "aspect-video w-full"}`}
              >
                <video
                  controls
                  autoPlay
                  src={selectedClip.videoUrl}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Sidebar Details */}
            <div
              className={`p-8 flex flex-col gap-6 bg-zinc-900 border-l border-zinc-800 transition-all duration-500 ${isPreviewMode === "MOBILE" ? "md:w-1/2" : "md:w-1/4"}`}
            >
              <div>
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 inline-block border ${platformColor(selectedClip.platform)}`}
                >
                  {selectedClip.platform}
                </span>
                <h3 className="text-xl font-bold text-zinc-100">
                  {selectedClip.title}
                </h3>
                <div className="flex gap-4 mt-4 text-sm font-mono text-zinc-400">
                  <p>
                    Start:{" "}
                    <span className="text-zinc-200">
                      {selectedClip.startTime}s
                    </span>
                  </p>
                  <p>
                    End:{" "}
                    <span className="text-zinc-200">
                      {selectedClip.endTime}s
                    </span>
                  </p>
                </div>

                {/* Virality Score in modal */}
                {selectedClip.viralityScore != null && (
                  <div className="mt-4 flex items-center gap-3">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">
                          Virality Score
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {Math.round(selectedClip.viralityScore * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${selectedClip.viralityScore * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-400">
                  Preview Mode
                </p>
                <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setIsPreviewMode("MOBILE")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${isPreviewMode === "MOBILE" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    <Smartphone size={14} /> Vertical
                  </button>
                  <button
                    onClick={() => setIsPreviewMode("DESKTOP")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${isPreviewMode === "DESKTOP" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    <Monitor size={14} /> Landscape
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-zinc-800">
                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 active:scale-95">
                  <Download size={18} /> Export High Quality
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
