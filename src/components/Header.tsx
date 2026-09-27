import React from 'react';
import { Sparkles, Bookmark, BarChart3, Globe, Hammer, ShieldCheck, HelpCircle, Lightbulb, User, Search, Database } from 'lucide-react';

interface HeaderProps {
  currentTab: 'create' | 'ideas' | 'catalog' | 'analytics' | 'sdg';
  setCurrentTab: (tab: 'create' | 'ideas' | 'catalog' | 'analytics' | 'sdg') => void;
  savedCount: number;
  geminiConfigured: boolean;
  forceSimulated: boolean;
  setForceSimulated: (val: boolean) => void;
  onOpenSdg: () => void;
  onOpenBasicInfo: () => void;
  makerName?: string;
  supabaseStatus?: {
    isConfigured: boolean;
    isConnected: boolean;
    recordCount: number;
    message?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  savedCount,
  geminiConfigured,
  forceSimulated,
  setForceSimulated,
  onOpenSdg,
  onOpenBasicInfo,
  makerName,
  supabaseStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('create')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-logo"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#4E654E] flex items-center justify-center text-[#FAF7F2] shadow-sm group-hover:bg-[#3E523E] transition-colors border border-[#3E523E]/20">
            <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-[#E7EFE6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold font-artisan tracking-tight text-[#423023]">
                CraftCopy
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#6E5038]">
                Artisan AI
              </span>
            </div>
            <p className="text-[12px] text-[#7C6A59] hidden sm:block">
              Marketing Assistant for Local Craftsmen & Makers
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          <button
            id="nav-tab-create"
            onClick={() => setCurrentTab('create')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'create'
                ? 'bg-[#4E654E] text-[#FAF7F2] shadow-sm'
                : 'text-[#6E5038] hover:bg-[#EFE7DA]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Create</span>
          </button>

          <button
            id="nav-tab-ideas"
            onClick={() => setCurrentTab('ideas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'ideas'
                ? 'bg-[#4E654E] text-[#FAF7F2] shadow-sm'
                : 'text-[#6E5038] hover:bg-[#EFE7DA]'
            }`}
            title="Explore what to sell, trending crafts, and search product ideas"
          >
            <Lightbulb className="w-4 h-4 text-[#C59B3C]" />
            <span>Product Ideas</span>
          </button>

          <button
            id="nav-tab-catalog"
            onClick={() => setCurrentTab('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all relative ${
              currentTab === 'catalog'
                ? 'bg-[#4E654E] text-[#FAF7F2] shadow-sm'
                : 'text-[#6E5038] hover:bg-[#EFE7DA]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#C59B3C] text-white text-[11px] font-bold rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'analytics'
                ? 'bg-[#4E654E] text-[#FAF7F2] shadow-sm'
                : 'text-[#6E5038] hover:bg-[#EFE7DA]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden xs:inline">Analytics</span>
          </button>

          <button
            id="nav-btn-basic-info"
            onClick={onOpenBasicInfo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-[#5A4535] hover:bg-[#EFE7DA] border border-[#E0D3C3] transition-colors"
            title="Edit Artisan Profile & Studio Basic Information"
          >
            <User className="w-3.5 h-3.5 text-[#4E654E]" />
            <span className="hidden md:inline">{makerName || 'Basic Info'}</span>
          </button>

          <button
            id="nav-tab-sdg"
            onClick={onOpenSdg}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#E7EFE6] text-[#344834] hover:bg-[#D9E6D8] transition-colors border border-[#C5DAC3]"
            title="UN Sustainable Development Goal 9: Industry, Innovation and Infrastructure"
          >
            <Globe className="w-3.5 h-3.5 text-[#4E654E]" />
            <span className="hidden lg:inline">SDG 9</span>
          </button>
        </nav>
      </div>

      {/* Secondary Status Strip with AI Mode Labeling */}
      <div className="bg-[#F3ECE0] border-t border-[#E8DFD1]/60 px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs text-[#6A5A4A]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#4E654E] animate-pulse"></span>
            <span className="font-medium text-[#423023]">AI:</span>
            {geminiConfigured && !forceSimulated ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E2EBE2] text-[#2F442F] font-medium text-[11px]">
                <Sparkles className="w-3 h-3 text-[#4E654E]" />
                Gemini 3.8 Flash (Live AI)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF3D6] text-[#7A5A1B] font-medium text-[11px] border border-[#E9D6A0]">
                <ShieldCheck className="w-3 h-3 text-[#C59B3C]" />
                Simulated AI (Local Engine)
              </span>
            )}

            <span className="text-[#BBAEA0] mx-0.5">•</span>

            {/* Supabase Status */}
            <div className="flex items-center gap-1.5" id="supabase-status-badge">
              <span className="font-medium text-[#423023]">Supabase:</span>
              {supabaseStatus?.isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E2EBE2] text-[#2F442F] font-medium text-[11px] border border-[#BED2BD]" title={supabaseStatus.message || 'Connected to public.products'}>
                  <Database className="w-3 h-3 text-[#3E523E]" />
                  <span>Connected (public.products{supabaseStatus.recordCount > 0 ? ` • ${supabaseStatus.recordCount} products` : ''})</span>
                </span>
              ) : supabaseStatus?.isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF3D6] text-[#7A5A1B] font-medium text-[11px] border border-[#E9D6A0]">
                  <Database className="w-3 h-3 text-[#C59B3C]" />
                  <span>Connecting to public.products...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE8DD] text-[#7A6755] font-medium text-[11px] border border-[#D5C7B6]" title="Awaiting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY">
                  <Database className="w-3 h-3 text-[#8B6544]" />
                  <span>Ready (VITE_SUPABASE_URL)</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-[#735F4C]">
              <input
                type="checkbox"
                checked={forceSimulated}
                onChange={(e) => setForceSimulated(e.target.checked)}
                className="rounded border-[#C8BEAF] text-[#4E654E] focus:ring-[#4E654E] w-3.5 h-3.5"
              />
              <span>Force Simulated Test Mode</span>
            </label>
            <button
              onClick={onOpenSdg}
              className="text-[#4E654E] hover:underline font-medium flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Why SDG 9?</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
