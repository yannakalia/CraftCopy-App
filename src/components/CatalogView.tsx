import React, { useState, useMemo } from 'react';
import { 
  Bookmark, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Edit3, 
  ShoppingBag, 
  Share2, 
  PlusCircle, 
  Filter,
  Search,
  X,
  Database,
  ShieldCheck
} from 'lucide-react';
import { SavedCraft } from '../types';

interface CatalogViewProps {
  savedCrafts: SavedCraft[];
  onSelectCraft: (craft: SavedCraft) => void;
  onDeleteCraft: (id: string) => void;
  onCopyContent: (craft: SavedCraft, platform: 'instagram' | 'facebook' | 'tiktok' | 'marketplaces') => void;
  onNewProduct: () => void;
  onBrowseIdeas?: () => void;
  onEditCraftInForm?: (craft: SavedCraft) => void;
  supabaseLoadedIds?: Set<string>;
  onSyncSupabase?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  savedCrafts,
  onSelectCraft,
  onDeleteCraft,
  onCopyContent,
  onNewProduct,
  onBrowseIdeas,
  onEditCraftInForm,
  supabaseLoadedIds,
  onSyncSupabase,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(savedCrafts.map((c) => c.product.category)))];

  const filtered = useMemo(() => {
    return savedCrafts.filter((craft) => {
      // Category filter
      if (filterCategory !== 'all' && craft.product.category !== filterCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = craft.product.name.toLowerCase().includes(q);
        const matchesCategory = craft.product.category.toLowerCase().includes(q);
        const matchesMaterials = craft.product.materials.toLowerCase().includes(q);
        const matchesTechnique = craft.product.craftTechnique.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesMaterials && !matchesTechnique) {
          return false;
        }
      }
      return true;
    });
  }, [savedCrafts, filterCategory, searchQuery]);

  const handleCopy = (craft: SavedCraft, platform: 'instagram' | 'facebook') => {
    const text = platform === 'instagram'
      ? `${craft.content.captions.instagram.title}\n\n${craft.content.captions.instagram.body}\n\n${craft.content.captions.instagram.hashtags.join(' ')}`
      : `${craft.content.captions.facebook.title}\n\n${craft.content.captions.facebook.body}`;

    navigator.clipboard.writeText(text);
    setCopiedId(`${craft.id}-${platform}`);
    onCopyContent(craft, platform);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header with Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B6544]">
            Artisan Studio Collection
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-artisan text-[#423023]">
            Saved Craft Marketing Kits ({savedCrafts.length})
          </h2>
          <p className="text-xs sm:text-sm text-[#735F4C]">
            Ready-to-post marketing copy and pricing guides for your creations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {categories.length > 2 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          )}

          {onSyncSupabase && (
            <button
              id="btn-sync-catalog-supabase"
              onClick={onSyncSupabase}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#D5C7B6] hover:bg-[#F2ECE1] text-[#423023] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
              title="Synchronize and re-fetch from Supabase public.products"
            >
              <Database className="w-3.5 h-3.5 text-[#4E654E]" />
              <span>Sync Supabase</span>
            </button>
          )}

          <button
            onClick={onNewProduct}
            className="px-4 py-2 rounded-xl bg-[#4E654E] text-[#FAF7F2] text-xs font-bold hover:bg-[#3E523E] flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887463]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            id="search-saved-crafts"
            placeholder="Search saved products by name, materials, or technique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8A7969] hover:text-[#423023]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#786554] shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto text-xs px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FAF7F2] border border-dashed border-[#D5C7B6] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EFE7DA] text-[#7A6655] mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#423023]">
            {searchQuery ? `No saved products match "${searchQuery}"` : 'No saved crafts yet'}
          </h3>
          <p className="text-xs text-[#7A6655] max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms or clearing the filter.' 
              : 'Generate your first product marketing copy using the Workshop, then approve and save it to store it here.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E]"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={onNewProduct}
                className="px-4 py-2 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E]"
              >
                Start First Product
              </button>
            )}
            {onBrowseIdeas && (
              <button
                onClick={onBrowseIdeas}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#D8CCBC] text-[#553E2E] text-xs font-semibold hover:bg-[#EAE2D3]"
              >
                Browse Product Ideas
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((craft) => (
            <div
              key={craft.id}
              className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#4E654E]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {craft.product.photoUrl ? (
                      <img
                        src={craft.product.photoUrl}
                        alt={craft.product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#D5C7B6]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#EFE7DA] flex items-center justify-center text-[#735F4C]">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6544]">
                          {craft.product.category}
                        </span>
                        {(supabaseLoadedIds?.has(craft.id) || craft.createdAt === 'Supabase Record' || craft.content?.aiModelUsed === 'Supabase Cloud Database') && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#E2EBE2] text-[#2F442F] text-[9px] font-semibold border border-[#BED2BD]" title="Synchronized with Supabase public.products">
                            <Database className="w-2.5 h-2.5 text-[#3E523E]" />
                            <span>Supabase Cloud</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#423023] line-clamp-1">
                        {craft.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-bold text-[#4E654E]">
                          ₱{craft.content.pricing.suggestedRetail.toLocaleString()}
                        </span>
                        <span className="text-[#887463]">
                          (Wholesale: ₱{craft.content.pricing.wholesale.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {supabaseLoadedIds?.has(craft.id) ? (
                    <span 
                      className="p-1.5 text-[#4E654E] rounded-lg bg-[#EAEFE9]" 
                      title="Database Protection: Existing Supabase project records are preserved and cannot be deleted."
                    >
                      <ShieldCheck className="w-4 h-4 text-[#3E523E]" />
                    </span>
                  ) : (
                    <button
                      onClick={() => onDeleteCraft(craft.id)}
                      className="p-1.5 text-[#9C8A7B] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete saved kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Caption Snippet */}
                <p className="text-xs text-[#5C4A3C] line-clamp-2 bg-white p-2.5 rounded-xl border border-[#E2D5C4] mb-3 leading-relaxed">
                  "{craft.content.captions.instagram.title} - {craft.content.captions.instagram.body.slice(0, 110)}..."
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-[#E8DFD1] flex items-center justify-between">
                <div className="text-[11px] text-[#8C7A6B]">
                  Copied {craft.copyCount} times
                </div>

                <div className="flex items-center gap-1.5">
                  {onEditCraftInForm && (
                    <button
                      onClick={() => onEditCraftInForm(craft)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#D5C7B6] hover:bg-[#F2ECE1] text-[#423023] text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
                      title="Edit craft info and photo"
                    >
                      <Edit3 className="w-3 h-3 text-[#4E654E]" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(craft, 'instagram')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#EFE7DA] hover:bg-[#E2D5C3] text-[#423023] text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    {copiedId === `${craft.id}-instagram` ? (
                      <Check className="w-3 h-3 text-[#4E654E]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>IG Copy</span>
                  </button>

                  <button
                    onClick={() => onSelectCraft(craft)}
                    className="px-3 py-1.5 rounded-lg bg-[#4E654E] hover:bg-[#3E523E] text-white text-xs font-bold transition-all"
                  >
                    Open Hub →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
