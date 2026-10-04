"use client";

import { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, Loader2, Bold, Italic, Underline, List as ListIcon, AlignLeft, HelpCircle, Save, Clock } from 'lucide-react';
import { ScriptData } from '../types';

const INITIAL_SCRIPT: ScriptData = {
  id: 's1',
  projectId: 'p1',
  title: 'Top 5 AI Tools',
  content: 'Here are the top 5 AI tools you must use in 2024.\n\nFirst up is a tool that completely changes how we edit video. Let\'s dive right into the timeline features. Notice how it seamlessly integrates with your existing assets.\n\nSecondly, we need to talk about audio generation. It\'s never been easier...',
  hooks: ['Want to save 10 hours a week?', 'If you use AI, you need to see this.']
};

export default function ScriptWorkspace() {
  const [content, setContent] = useState(INITIAL_SCRIPT.content);
  const [hooks, setHooks] = useState<string[]>(INITIAL_SCRIPT.hooks);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  // Estimate: 150 words per minute speaking rate
  const durationEstimate = Math.max(1, Math.round((wordCount / 150) * 60));

  // Auto-save simulation
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateHooks = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setHooks(["Discover the secret AI tools that experts use!", ...hooks]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      
      {/* Left Sidebar - Navigator */}
      <div className="hidden lg:flex w-64 flex-col gap-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Outline</h3>
        <div className="space-y-1">
          <div className="px-3 py-2 text-sm text-emerald-400 bg-emerald-400/10 rounded-lg font-medium border border-emerald-400/20 cursor-pointer">
            Introduction (0:00)
          </div>
          <div className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
            Tool 1: Video Gen (0:15)
          </div>
          <div className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
            Tool 2: Audio AI (0:45)
          </div>
          <div className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
            Conclusion (1:30)
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-md shadow-lg overflow-hidden relative">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"><Bold size={16} /></button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"><Italic size={16} /></button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"><Underline size={16} /></button>
            <div className="w-px h-4 bg-zinc-800 mx-2" />
            <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"><AlignLeft size={16} /></button>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"><ListIcon size={16} /></button>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-zinc-500">
              {isSaving ? (
                <><Loader2 size={12} className="animate-spin text-emerald-500" /> Saving...</>
              ) : (
                <><Save size={12} className="text-zinc-600" /> Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</>
              )}
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-4 text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5"><Clock size={12} /> ~{durationEstimate}s est.</span>
              <span>{wordCount} w</span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <input 
            type="text" 
            defaultValue={INITIAL_SCRIPT.title}
            className="bg-transparent border-none text-4xl font-bold outline-none text-zinc-100 placeholder:text-zinc-700 mb-8 w-full"
            placeholder="Untitled Script..."
          />
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent resize-none outline-none text-zinc-300 leading-loose text-lg placeholder:text-zinc-700 font-serif"
            placeholder="Start writing your masterpiece here..."
          />
        </div>
      </div>

      {/* Right Sidebar - AI Tools */}
      <div className="w-full lg:w-80 flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-emerald-500/10 rounded-md">
              <Sparkles size={16} className="text-emerald-400" />
            </div>
            AI Assistant
          </h3>
          <button className="text-zinc-500 hover:text-zinc-300"><HelpCircle size={16}/></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Hook Generator</h4>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">Generate catchy hooks based on your current script content to boost retention.</p>
            <button 
              onClick={handleGenerateHooks}
              disabled={isGenerating}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Hooks</>}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">Generated Ideas</h4>
            {hooks.map((hook, idx) => (
              <div key={idx} className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl relative group transition-all hover:border-emerald-500/40 hover:bg-zinc-900 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">{hook}</p>
                  <button 
                    onClick={() => handleCopy(hook, idx)}
                    className="text-zinc-500 hover:text-emerald-400 transition-colors p-1.5 bg-zinc-900 rounded-md border border-zinc-800 flex-shrink-0 hover:bg-zinc-800/80"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
