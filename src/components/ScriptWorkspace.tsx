"use client";

import { useState } from 'react';
import { Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { ScriptData } from '../types';

const INITIAL_SCRIPT: ScriptData = {
  id: 's1',
  projectId: 'p1',
  title: 'Top 5 AI Tools',
  content: 'Here are the top 5 AI tools you must use in 2024. First up is...',
  hooks: ['Want to save 10 hours a week?', 'If you use AI, you need to see this.']
};

export default function ScriptWorkspace() {
  const [content, setContent] = useState(INITIAL_SCRIPT.content);
  const [hooks, setHooks] = useState<string[]>(INITIAL_SCRIPT.hooks);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateHooks = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setHooks([...hooks, "Discover the secret AI tools that experts use!"]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[600px] shadow-sm relative">
            <input 
              type="text" 
              defaultValue={INITIAL_SCRIPT.title}
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
                disabled={isGenerating}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate new hook"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {hooks.map((hook, idx) => (
                <div key={idx} className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl relative group transition-colors hover:border-emerald-500/30">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-emerald-500 transition-colors rounded-l-xl" />
                  
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-zinc-300 leading-relaxed pt-1">{hook}</p>
                    <button 
                      onClick={() => handleCopy(hook, idx)}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors p-1.5 bg-zinc-900 rounded-md border border-zinc-800 flex-shrink-0"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  {copiedIndex === idx && (
                    <div className="absolute -top-8 right-0 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded shadow-lg animate-in fade-in zoom-in duration-200">
                      Copied!
                    </div>
                  )}
                </div>
              ))}
              
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
