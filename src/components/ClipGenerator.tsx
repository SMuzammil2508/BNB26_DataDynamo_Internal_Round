"use client";

import { useState } from 'react';
import { Download, Play, Maximize2, X, Monitor, Smartphone, Video } from 'lucide-react';
import { GeneratedClip } from '../types';

const MOCK_CLIPS: GeneratedClip[] = [
  { id: 'c1', projectId: 'p1', title: 'Hook 1 - Fast Pace', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', startTime: 0, endTime: 10, platform: 'SHORTS' },
  { id: 'c2', projectId: 'p1', title: 'Main Body - Value Drop', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', startTime: 10, endTime: 30, platform: 'REELS' },
];

export default function ClipGenerator() {
  const [selectedClip, setSelectedClip] = useState<GeneratedClip | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <p className="text-zinc-400">Review, preview and export your AI-generated clips.</p>
        <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95">
          <Video size={16} /> 
          Generate New Clip
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_CLIPS.map((clip) => (
          <div key={clip.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-sm flex flex-col">
            <div className="aspect-[9/16] bg-zinc-950 relative overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setSelectedClip(clip)}>
              <video src={clip.videoUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 backdrop-blur p-3 rounded-full text-white">
                  <Play size={24} className="ml-1" />
                </div>
              </div>

              <div className="absolute top-3 right-3 flex gap-2">
                <span className="bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-pink-400 border border-pink-500/20 shadow-sm">
                  {clip.platform}
                </span>
              </div>
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
              <h3 className="font-medium text-zinc-100 line-clamp-2 text-sm">{clip.title}</h3>
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
            <div className={`bg-black flex items-center justify-center p-8 transition-all duration-500 ${isPreviewMode === 'MOBILE' ? 'md:w-1/2' : 'md:w-3/4'}`}>
              <div className={`relative overflow-hidden rounded-xl shadow-2xl bg-zinc-900 transition-all duration-500 ${isPreviewMode === 'MOBILE' ? 'aspect-[9/16] w-full max-w-[320px]' : 'aspect-video w-full'}`}>
                <video 
                  controls 
                  autoPlay 
                  src={selectedClip.videoUrl} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Sidebar Details */}
            <div className={`p-8 flex flex-col gap-6 bg-zinc-900 border-l border-zinc-800 transition-all duration-500 ${isPreviewMode === 'MOBILE' ? 'md:w-1/2' : 'md:w-1/4'}`}>
              <div>
                <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
                  {selectedClip.platform}
                </span>
                <h3 className="text-xl font-bold text-zinc-100">{selectedClip.title}</h3>
                <div className="flex gap-4 mt-4 text-sm font-mono text-zinc-400">
                  <p>Start: <span className="text-zinc-200">{selectedClip.startTime}s</span></p>
                  <p>End: <span className="text-zinc-200">{selectedClip.endTime}s</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-400">Preview Mode</p>
                <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                  <button 
                    onClick={() => setIsPreviewMode('MOBILE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${isPreviewMode === 'MOBILE' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <Smartphone size={14} /> Vertical
                  </button>
                  <button 
                    onClick={() => setIsPreviewMode('DESKTOP')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${isPreviewMode === 'DESKTOP' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
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
