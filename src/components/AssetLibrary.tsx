"use client";

import { useState, useEffect } from 'react';
import { CloudUpload, PlayCircle, Image as ImageIcon, Music, LayoutGrid, List, Search, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { CreatorAsset } from '../types';

const MOCK_ASSETS: CreatorAsset[] = [
  { id: 'a1', projectId: 'p1', name: 'Intro Hook - Final Version', type: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10 },
  { id: 'a2', projectId: 'p1', name: 'Background Loop Ambient', type: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 15 },
  { id: 'a3', projectId: 'p1', name: 'Logo Reveal Animation', type: 'IMAGE', url: 'https://picsum.photos/800/600' },
  { id: 'a4', projectId: 'p1', name: 'Upbeat Background Track', type: 'AUDIO', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 120 },
];

export default function AssetLibrary() {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'VIDEO': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'AUDIO': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'IMAGE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const getTypeIcon = (type: string, size = 12) => {
    switch(type) {
      case 'VIDEO': return <PlayCircle size={size} />;
      case 'AUDIO': return <Music size={size} />;
      case 'IMAGE': return <ImageIcon size={size} />;
      default: return <ImageIcon size={size} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full bg-zinc-950/50 border border-zinc-800/80 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>
          <div className="hidden sm:flex items-center bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
        
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 w-full sm:w-auto justify-center">
          <CloudUpload size={18} />
          Upload Files
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden animate-pulse h-[280px]">
              <div className="h-40 bg-zinc-800/50 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : MOCK_ASSETS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-zinc-800">
            <CloudUpload size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-200 mb-2">No assets found</h3>
          <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">Upload your raw footage, images, and audio tracks to start generating clips.</p>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 flex items-center gap-2">
            <CloudUpload size={16} /> Select Files
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_ASSETS.map((asset, i) => (
            <div 
              key={asset.id} 
              className="group bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                {asset.type === 'VIDEO' ? (
                  <video src={asset.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                ) : asset.type === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 group-hover:bg-zinc-800 transition-colors duration-500">
                    <Music size={48} className="text-zinc-700 group-hover:text-purple-400/50 transition-colors duration-500 group-hover:scale-110" />
                  </div>
                )}
                
                {/* Media Type Badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border flex items-center gap-1.5 z-10 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105 ${getTypeColor(asset.type)}`}>
                  {getTypeIcon(asset.type)}
                  {asset.type}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button className="p-2.5 bg-zinc-900/90 text-zinc-100 rounded-full hover:bg-emerald-500 hover:text-zinc-950 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2.5 bg-zinc-900/90 text-zinc-100 rounded-full hover:bg-red-500 hover:text-zinc-950 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-1.5 relative bg-gradient-to-b from-zinc-900/10 to-zinc-900">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-200 text-base truncate group-hover:text-emerald-400 transition-colors">{asset.name}</h3>
                  <button className="text-zinc-500 hover:text-zinc-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                  {asset.duration && (
                    <span className="flex items-center gap-1 bg-zinc-950/50 px-2 py-0.5 rounded border border-zinc-800/50">
                      {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <span>24 MB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 border-b border-zinc-800/80 text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {MOCK_ASSETS.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 relative flex-shrink-0 border border-zinc-800">
                      {asset.type === 'VIDEO' ? (
                         <video src={asset.url} className="w-full h-full object-cover" />
                      ) : asset.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music size={16} className="text-zinc-600"/></div>
                      )}
                    </div>
                    <span className="font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">{asset.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${getTypeColor(asset.type)}`}>
                      {getTypeIcon(asset.type, 10)} {asset.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                    {asset.duration ? `${Math.floor(asset.duration / 60)}:${(asset.duration % 60).toString().padStart(2, '0')}` : '--'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
