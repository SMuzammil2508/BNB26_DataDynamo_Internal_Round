"use client";

import { useState } from 'react';
import { Menu, LayoutGrid, FileText, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import AssetLibrary from '../components/AssetLibrary';
import ScriptWorkspace from '../components/ScriptWorkspace';
import ClipGenerator from '../components/ClipGenerator';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'SCRIPT' | 'CLIPS'>('ASSETS');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 flex flex-col relative z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 h-16">
          {isSidebarOpen && (
            <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 truncate">
              DataDynamo
            </h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors mx-auto"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutGrid size={20} />}
            label="Asset Library"
            isActive={activeTab === 'ASSETS'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('ASSETS')}
          />
          <NavItem 
            icon={<FileText size={20} />}
            label="Script Workspace"
            isActive={activeTab === 'SCRIPT'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('SCRIPT')}
          />
          <NavItem 
            icon={<Video size={20} />}
            label="Clip Generator"
            isActive={activeTab === 'CLIPS'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('CLIPS')}
          />
        </nav>
        
        {isSidebarOpen && (
          <div className="p-4 text-xs text-zinc-500 font-mono border-t border-zinc-800 truncate">
            Workspace ID: p1
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-zinc-950/80">
        <header className="sticky top-0 z-10 p-6 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800/50 flex items-center justify-between h-16">
          <h2 className="text-xl font-semibold text-zinc-100">
            {activeTab === 'ASSETS' && 'Asset Library'}
            {activeTab === 'SCRIPT' && 'Script Workspace'}
            {activeTab === 'CLIPS' && 'Clip Generator'}
          </h2>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {activeTab === 'ASSETS' && <AssetLibrary />}
          {activeTab === 'SCRIPT' && <ScriptWorkspace />}
          {activeTab === 'CLIPS' && <ClipGenerator />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, isOpen, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, isOpen: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
        ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}
        ${!isOpen ? 'justify-center' : ''}
      `}
      title={!isOpen ? label : undefined}
    >
      <div className={`${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
        {icon}
      </div>
      {isOpen && (
        <span className="font-medium whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}
