"use client";

import { useState } from 'react';
import { Download, Play, Maximize2, X, Monitor, Smartphone, Video, Scissors, Layers, Settings, Wand2, CheckCircle2, Loader2 } from 'lucide-react';
import { GeneratedClip } from '../types';

const MOCK_CLIPS: GeneratedClip[] = [
  { id: 'c1', projectId: 'p1', title: 'Hook 1 - Fast Pace', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', startTime: 0, endTime: 10, platform: 'SHORTS' },
  { id: 'c2', projectId: 'p1', title: 'Main Body - Value Drop', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', startTime: 10, endTime: 30, platform: 'REELS' },
];

export default function ClipGenerator() {
  const [selectedClip, setSelectedClip] = useState<GeneratedClip | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationSuccess(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationSuccess(true);
      setTimeout(() => setGenerationSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-inner relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
             <Scissors size={24} className="text-emerald-400 relative z-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100">Ready to render?</h3>
            <p className="text-sm text-zinc-400 mt-1">Review your timeline chunks and generate platform-optimized clips instantly.</p>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || generationSuccess}
          className={`relative z-10 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 overflow-hidden
            ${generationSuccess ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30' : 
              isGenerating ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700' : 
              'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95'
            }
          `}
        >
          {isGenerating ? (
             <><Loader2 size={18} className="animate-spin" /> Rendering Timeline...</>
          ) : generationSuccess ? (
             <><CheckCircle2 size={18} className="animate-in zoom-in" /> Clips Generated!</>
          ) : (
             <><Wand2 size={18} /> Auto-Generate Clips</>
          )}
          
          {generationSuccess && (
            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
          )}
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Timeline Map (Left Pane) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/60">
            <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
              <Layers size={18} className="text-zinc-500" />
              Timeline Chunks
            </h3>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 hover:bg-zinc-800 rounded-md"><Settings size={16}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {[1,2,3].map((item, i) => (
              <div key={i} className={`p-4 rounded-xl border transition-all cursor-pointer relative group overflow-hidden
                ${i === 0 ? 'bg-zinc-800/80 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-600'}
              `}>
                {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Chunk {i+1}</span>
                  <span className="text-xs font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    0:{i*15} - 0:{(i*15)+15}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed font-medium">
                  {i===0 ? "Here are the top 5 AI tools you must use in 2024. First up is..." : "Notice how it seamlessly integrates with your existing assets..."}
                </p>
                <div className="mt-4 flex gap-2">
                   <span className="text-[10px] uppercase font-bold px-2 py-1 bg-zinc-900 rounded text-pink-400 border border-pink-500/20">Shorts</span>
                   <span className="text-[10px] uppercase font-bold px-2 py-1 bg-zinc-900 rounded text-blue-400 border border-blue-500/20">TikTok</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Preview Grid (Right Pane) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
              <Video size={18} className="text-zinc-500" />
              Rendered Output
            </h3>
            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button className="px-3 py-1.5 text-xs font-medium rounded bg-zinc-800 text-zinc-100 shadow-sm">All</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded text-zinc-500 hover:text-zinc-300">Vertical</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded text-zinc-500 hover:text-zinc-300">Horizontal</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {MOCK_CLIPS.map((clip) => (
                <div key={clip.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                  <div className="aspect-[9/16] bg-black relative cursor-pointer" onClick={() => setSelectedClip(clip)}>
                    <video src={clip.videoUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl transform group-hover:scale-110 transition-transform">
                        <Play size={20} className="text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-zinc-900/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-pink-400 border border-pink-500/30">
                        {clip.platform}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-300 bg-zinc-900/60 backdrop-blur px-2 py-1.5 rounded-lg border border-zinc-700/50">
                        <span>{clip.startTime}s</span>
                        <div className="flex-1 h-0.5 bg-zinc-700 mx-2 relative rounded-full">
                          <div className="absolute inset-y-0 left-0 bg-emerald-500 w-1/2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>
                        <span>{clip.endTime}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900 flex items-center justify-between gap-2 border-t border-zinc-800">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate flex-1">{clip.title}</h4>
                    <button className="p-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-400 rounded-md transition-colors" title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative scale-100 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedClip(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
            >
              <X size={20} />
            </button>
            
            {/* Player Area */}
            <div className={`bg-black/90 flex items-center justify-center p-8 transition-all duration-500 relative ${isPreviewMode === 'MOBILE' ? 'md:w-3/5' : 'md:w-3/4'}`}>
              {/* Decorative Glow */}
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl" />
              
              <div className={`relative overflow-hidden rounded-2xl shadow-2xl border border-zinc-800/50 bg-zinc-950 transition-all duration-500 z-10 ${isPreviewMode === 'MOBILE' ? 'aspect-[9/16] w-full max-w-[340px]' : 'aspect-video w-full'}`}>
                <video 
                  controls 
                  autoPlay 
                  src={selectedClip.videoUrl} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Sidebar Details */}
            <div className={`p-8 flex flex-col gap-8 bg-zinc-900/90 border-l border-zinc-800 transition-all duration-500 relative z-10 ${isPreviewMode === 'MOBILE' ? 'md:w-2/5' : 'md:w-1/4'}`}>
              <div>
                <span className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-4 inline-block shadow-sm">
                  {selectedClip.platform}
                </span>
                <h3 className="text-2xl font-bold text-zinc-100 leading-tight">{selectedClip.title}</h3>
                <div className="flex gap-4 mt-4 text-sm font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 inline-flex">
                  <div className="flex flex-col">
                    <span className="text-zinc-500 text-[10px] uppercase">Start</span>
                    <span className="text-zinc-200">{selectedClip.startTime}s</span>
                  </div>
                  <div className="w-px bg-zinc-800" />
                  <div className="flex flex-col">
                    <span className="text-zinc-500 text-[10px] uppercase">End</span>
                    <span className="text-zinc-200">{selectedClip.endTime}s</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview Aspect</p>
                <div className="flex p-1.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  <button 
                    onClick={() => setIsPreviewMode('MOBILE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg transition-all ${isPreviewMode === 'MOBILE' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Smartphone size={16} /> 9:16
                  </button>
                  <button 
                    onClick={() => setIsPreviewMode('DESKTOP')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg transition-all ${isPreviewMode === 'DESKTOP' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Monitor size={16} /> 16:9
                  </button>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 active:scale-95">
                  <Download size={18} /> Export 4K
                </button>
                <button className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-3 rounded-xl font-medium transition-all text-sm">
                  Send to Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
