"use client";

import { useState } from 'react';
import { CreatorAsset, ScriptData, GeneratedClip } from '../types';

const MOCK_ASSETS: CreatorAsset[] = [
  { id: 'a1', projectId: 'p1', name: 'Intro Hook', type: 'VIDEO', url: 'https://placehold.co/600x400/1e293b/fff?text=Intro+Hook', duration: 15 },
  { id: 'a2', projectId: 'p1', name: 'Background Loop', type: 'VIDEO', url: 'https://placehold.co/600x400/1e293b/fff?text=BG+Loop', duration: 60 },
  { id: 'a3', projectId: 'p1', name: 'Logo Reveal', type: 'IMAGE', url: 'https://placehold.co/600x400/1e293b/fff?text=Logo+Reveal' },
];

const MOCK_SCRIPT: ScriptData = {
  id: 's1',
  projectId: 'p1',
  title: 'Top 5 AI Tools',
  content: 'Here are the top 5 AI tools you must use in 2024. First up is...',
  hooks: ['Want to save 10 hours a week?', 'If you use AI, you need to see this.']
};

const MOCK_CLIPS: GeneratedClip[] = [
  { id: 'c1', projectId: 'p1', title: 'Hook 1 - Fast Pace', videoUrl: 'https://placehold.co/400x700/0f172a/fff?text=Clip+1', startTime: 0, endTime: 15, platform: 'SHORTS' },
  { id: 'c2', projectId: 'p1', title: 'Main Body - Slow', videoUrl: 'https://placehold.co/400x700/0f172a/fff?text=Clip+2', startTime: 15, endTime: 45, platform: 'REELS' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'SCRIPT' | 'CLIPS'>('ASSETS');

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
            onClick={() => setActiveTab('ASSETS')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'ASSETS' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'}`}
          >
            Asset Library
          </button>
          <button
            onClick={() => setActiveTab('SCRIPT')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'SCRIPT' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'}`}
          >
            Script Workspace
          </button>
          <button
            onClick={() => setActiveTab('CLIPS')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'CLIPS' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'}`}
          >
            Clip Generator
          </button>
        </div>

        <div className="flex-1 relative">
          {activeTab === 'ASSETS' && <AssetLibrary />}
          {activeTab === 'SCRIPT' && <ScriptWorkspace />}
          {activeTab === 'CLIPS' && <ClipGenerator />}
        </div>
      </main>
    </div>
  );
}

function AssetLibrary() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-100">Asset Library</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ASSETS.map((asset) => (
          <div key={asset.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
            <div className="aspect-video bg-zinc-800 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-emerald-400 border border-emerald-500/20">
                {asset.type}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-medium text-zinc-100 text-lg">{asset.name}</h3>
              {asset.duration && <p className="text-sm text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {asset.duration}s
              </p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScriptWorkspace() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-semibold text-zinc-100">Script Workspace</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[600px] shadow-sm">
            <input 
              type="text" 
              defaultValue={MOCK_SCRIPT.title}
              className="bg-transparent border-b border-zinc-800 pb-3 text-2xl font-semibold outline-none focus:border-emerald-500 text-zinc-100 transition-colors placeholder:text-zinc-600"
              placeholder="Script Title..."
            />
            <textarea 
              defaultValue={MOCK_SCRIPT.content}
              className="mt-6 flex-1 bg-transparent resize-none outline-none text-zinc-300 leading-relaxed text-lg placeholder:text-zinc-600"
              placeholder="Write your script content here..."
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-medium text-zinc-200 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hook Previews
            </h3>
            <div className="space-y-4">
              {MOCK_SCRIPT.hooks.map((hook, idx) => (
                <div key={idx} className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Hook {idx + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipGenerator() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-zinc-100">Generated Clips</h2>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
          Generate New Clip
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_CLIPS.map((clip) => (
          <div key={clip.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-sm">
            <div className="aspect-[9/16] bg-zinc-950 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clip.videoUrl} alt={clip.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-pink-400 border border-pink-500/20">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
