"use client";

import { useState, useEffect } from 'react';
import { Menu, LayoutGrid, FileText, Video, ChevronLeft, Search, Bell, Command, Settings } from 'lucide-react';
import AssetLibrary from '../components/AssetLibrary';
import ScriptWorkspace from '../components/ScriptWorkspace';
import ClipGenerator from '../components/ClipGenerator';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'SCRIPT' | 'CLIPS'>('ASSETS');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const main = document.getElementById('main-content');
      if (main) {
        setIsScrolled(main.scrollTop > 10);
      }
    };
    const main = document.getElementById('main-content');
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-zinc-950/80 backdrop-blur-2xl border-r border-zinc-800/60 flex flex-col relative z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]`}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-800/60 h-16">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Video size={18} className="text-zinc-950" />
              </div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                DataDynamo
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Video size={18} className="text-zinc-950" />
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 transition-all ${!isSidebarOpen ? 'absolute -right-3.5 top-5 bg-zinc-800 border border-zinc-700 z-50' : ''}`}
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronLeft size={14} className="rotate-180" />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<LayoutGrid size={18} />}
            label="Asset Library"
            isActive={activeTab === 'ASSETS'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('ASSETS')}
          />
          <NavItem 
            icon={<FileText size={18} />}
            label="Script Workspace"
            isActive={activeTab === 'SCRIPT'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('SCRIPT')}
          />
          <NavItem 
            icon={<Video size={18} />}
            label="Clip Generator"
            isActive={activeTab === 'CLIPS'}
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('CLIPS')}
          />
        </nav>
        
        <div className="p-3 border-t border-zinc-800/60 mt-auto">
          <NavItem 
            icon={<Settings size={18} />}
            label="Settings"
            isActive={false}
            isOpen={isSidebarOpen}
            onClick={() => {}}
          />
          {isSidebarOpen && (
            <div className="mt-3 px-3 py-2 text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex items-center justify-between">
              <span>Workspace ID</span>
              <span className="text-zinc-400">P1-ALPHA</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto relative bg-zinc-950 custom-scrollbar">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <header className={`sticky top-0 z-30 px-8 py-4 transition-all duration-300 flex items-center justify-between ${isScrolled ? 'bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-800/80 shadow-sm' : 'bg-transparent'}`}>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight flex items-center gap-3">
            {activeTab === 'ASSETS' && 'Asset Library'}
            {activeTab === 'SCRIPT' && 'Script Workspace'}
            {activeTab === 'CLIPS' && 'Clip Generator'}
          </h2>

          <div className="flex items-center gap-4">
            {/* Command Palette Mock */}
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-zinc-900/50 border border-zinc-800/80 focus:border-emerald-500/50 rounded-full pl-10 pr-12 py-2 text-sm text-zinc-200 outline-none w-64 transition-all placeholder:text-zinc-600 focus:bg-zinc-900 shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                <Command size={10} />K
              </div>
            </div>

            <button className="relative p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800/80">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] border-2 border-zinc-950" />
            </button>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 border border-zinc-500/30 flex items-center justify-center text-xs font-medium cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all">
              SH
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto relative z-10 min-h-full">
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
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group relative
        ${isActive 
          ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400' 
          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}
        ${!isOpen ? 'justify-center' : ''}
      `}
      title={!isOpen ? label : undefined}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-in fade-in zoom-in duration-300" />
      )}
      
      <div className={`relative ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-zinc-500 group-hover:text-zinc-300 transition-colors'}`}>
        {icon}
      </div>
      
      {isOpen && (
        <span className={`font-medium text-sm whitespace-nowrap transition-colors ${isActive ? 'text-emerald-50' : ''}`}>
          {label}
        </span>
      )}
    </button>
  );
}
