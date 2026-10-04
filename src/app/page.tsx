"use client";

import { useState } from "react";
import { AssetLibrary, ScriptWorkspace, ClipGenerator } from "@/components";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"ASSETS" | "SCRIPT" | "CLIPS">("ASSETS");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            DataDynamo Dashboard
          </h1>
          <div className="text-xs text-zinc-500 font-mono">Workspace ID: p1</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
        <div className="flex space-x-2 bg-zinc-900/80 p-1.5 rounded-xl mb-8 w-fit border border-zinc-800">
          <button
            onClick={() => setActiveTab("ASSETS")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "ASSETS"
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
            }`}
          >
            Asset Library
          </button>
          <button
            onClick={() => setActiveTab("SCRIPT")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "SCRIPT"
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
            }`}
          >
            Script Workspace
          </button>
          <button
            onClick={() => setActiveTab("CLIPS")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "CLIPS"
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
            }`}
          >
            Clip Generator
          </button>
        </div>

        <div className="flex-1 relative">
          {activeTab === "ASSETS" && <AssetLibrary />}
          {activeTab === "SCRIPT" && <ScriptWorkspace />}
          {activeTab === "CLIPS" && <ClipGenerator />}
        </div>
      </main>
    </div>
  );
}
