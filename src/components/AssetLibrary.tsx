"use client";

import { useState, useEffect } from "react";
import type { CreatorAsset } from "../types";

const INITIAL_MOCK_ASSETS: CreatorAsset[] = [
  { id: "a1", projectId: "p1", name: "Intro Hook", type: "VIDEO", url: "https://placehold.co/600x400/1e293b/fff?text=Intro+Hook", duration: 15 },
  { id: "a2", projectId: "p1", name: "Background Loop", type: "VIDEO", url: "https://placehold.co/600x400/1e293b/fff?text=BG+Loop", duration: 60 },
  { id: "a3", projectId: "p1", name: "Logo Reveal", type: "IMAGE", url: "https://placehold.co/600x400/1e293b/fff?text=Logo+Reveal" },
];

export function AssetLibrary() {
  const [assets, setAssets] = useState<CreatorAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"VIDEO" | "AUDIO" | "IMAGE">("VIDEO");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        const res = await fetch("/api/assets");
        if (res.ok) {
          const data: CreatorAsset[] = await res.json();
          if (data && data.length > 0) {
            setAssets(data);
          } else {
            setAssets(INITIAL_MOCK_ASSETS);
          }
        } else {
          setAssets(INITIAL_MOCK_ASSETS);
        }
      } catch (err) {
        console.error("Failed to fetch assets from /api/assets", err);
        setAssets(INITIAL_MOCK_ASSETS);
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, []);

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const newAssetPayload = {
        projectId: "p1",
        name: name.trim(),
        type,
        url: url.trim() || `https://placehold.co/600x400/1e293b/fff?text=${encodeURIComponent(name.trim())}`,
        duration: duration ? parseFloat(duration) : undefined,
      };

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssetPayload),
      });

      if (res.ok) {
        const created: CreatorAsset = await res.json();
        setAssets((prev) => [created, ...prev]);
        setName("");
        setUrl("");
        setDuration("");
        setShowAddModal(false);
      } else {
        console.error("Failed to add asset via POST /api/assets");
      }
    } catch (err) {
      console.error("Error submitting asset:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-100">Asset Library</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Asset
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-semibold text-zinc-100">Add New Asset</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hero Cinematic"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "VIDEO" | "AUDIO" | "IMAGE")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="IMAGE">IMAGE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Media URL (optional)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Duration in seconds (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  {isSubmitting ? "Uploading..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-500 text-sm">
          Loading assets...
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          No assets found. Click &quot;Add Asset&quot; to upload your first clip or graphic.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300"
            >
              <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-emerald-400 border border-emerald-500/20">
                  {asset.type}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-medium text-zinc-100 text-lg">{asset.name}</h3>
                {asset.duration !== undefined && asset.duration !== null && (
                  <p className="text-sm text-zinc-500 mt-1.5 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {asset.duration}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssetLibrary;
