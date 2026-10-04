"use client";

import { UploadCloud, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { CreatorAsset } from '../types';

const MOCK_ASSETS: CreatorAsset[] = [
  { id: 'a1', projectId: 'p1', name: 'Intro Hook', type: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10 },
  { id: 'a2', projectId: 'p1', name: 'Background Loop', type: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10 },
  { id: 'a3', projectId: 'p1', name: 'Logo Reveal', type: 'IMAGE', url: 'https://picsum.photos/600/400' },
];

export default function AssetLibrary() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <p className="text-zinc-400">Manage all your raw videos, audio, and images for this project.</p>
        <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-zinc-700 hover:border-zinc-600 shadow-sm active:scale-95">
          <UploadCloud size={18} />
          Upload Files
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ASSETS.map((asset) => (
          <div key={asset.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
            <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center">
              {asset.type === 'VIDEO' ? (
                <video 
                  controls 
                  src={asset.url} 
                  className="w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              )}
              
              <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 z-10 pointer-events-none">
                {asset.type === 'VIDEO' ? <PlayCircle size={12} /> : <ImageIcon size={12} />}
                {asset.type}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-medium text-zinc-100 text-lg truncate">{asset.name}</h3>
              {asset.duration && (
                <p className="text-sm text-zinc-500 mt-1.5 flex items-center gap-1.5 font-mono">
                  {asset.duration}s
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
