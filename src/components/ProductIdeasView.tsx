import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Filter, 
  Flame, 
  Wand2, 
  PlusCircle, 
  Check, 
  X,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ProductIdea, ProductInput } from '../types';
import { CURATED_PRODUCT_IDEAS } from '../data/productIdeas';
import { CRAFT_CATEGORIES } from '../data/sampleProducts';

interface ProductIdeasViewProps {
  onSelectIdea: (idea: ProductIdea) => void;
  onOpenBasicInfo?: () => void;
}

export const ProductIdeasView: React.FC<ProductIdeasViewProps> = ({
  onSelectIdea,
  onOpenBasicInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedDemand, setSelectedDemand] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-desc' | 'time-asc' | 'margin-desc'>('recommended');

  // AI Brainstormer state
  const [brainstormInput, setBrainstormInput] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [customIdeas, setCustomIdeas] = useState<ProductIdea[]>([]);
  const [showBrainstormBox, setShowBrainstormBox] = useState(false);

  // Combine curated + brainstormed ideas
  const allIdeas = useMemo(() => {
    return [...customIdeas, ...CURATED_PRODUCT_IDEAS];
  }, [customIdeas]);

  // Filtered & Searched ideas
  const filteredIdeas = useMemo(() => {
    return allIdeas.filter((idea) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = idea.name.toLowerCase().includes(q);
        const matchesCategory = idea.category.toLowerCase().includes(q);
        const matchesMaterials = idea.materials.toLowerCase().includes(q);
        const matchesWhy = idea.whyItSells.toLowerCase().includes(q);
        const matchesTags = idea.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCategory && !matchesMaterials && !matchesWhy && !matchesTags) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All' && idea.category !== selectedCategory) {
        return false;
      }

      // Difficulty
      if (selectedDifficulty !== 'All' && idea.difficulty !== selectedDifficulty) {
        return false;
      }

      // Demand
      if (selectedDemand !== 'All') {
        if (selectedDemand === 'Bestseller' && idea.marketDemand !== 'Bestseller') return false;
        if (selectedDemand === 'Trending' && idea.marketDemand !== 'Trending') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-desc') return b.suggestedRetail - a.suggestedRetail;
      if (sortBy === 'time-asc') return a.estimatedHours - b.estimatedHours;
      if (sortBy === 'margin-desc') return b.profitMarginPercent - a.profitMarginPercent;
      return 0; // recommended original order
    });
  }, [allIdeas, searchQuery, selectedCategory, selectedDifficulty, selectedDemand, sortBy]);

  // Handle AI brainstorm generator
  const handleBrainstorm = () => {
    if (!brainstormInput.trim()) return;
    setIsBrainstorming(true);

    setTimeout(() => {
      const cleanInput = brainstormInput.trim();
      const generated: ProductIdea[] = [
        {
          id: `custom-idea-${Date.now()}-1`,
          name: `Handcrafted ${cleanInput.split(' ')[0] || 'Studio'} Artisanal Catchall Vessel`,
          category: selectedCategory !== 'All' ? selectedCategory : 'Other Handmade Craft',
          difficulty: 'Beginner',
          estimatedHours: 0.9,
          materialsCost: 280,
          suggestedRetail: 950,
          profitMarginPercent: 36,
          materials: cleanInput,
          craftTechnique: 'Studio handcraft, custom shaping, protective non-toxic natural sealer',
          starterStory: `Inspired by raw studio materials: ${cleanInput}. Designed as a tactile daily organizer that honors raw textural character.`,
          photoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
          whyItSells: `Leverages existing studio supplies with high perceived artisanal value. Shoppers love one-of-a-kind pieces crafted from authentic materials.`,
          marketDemand: 'Trending',
          bestSeason: 'Year-round Gifting',
          tags: ['custom', 'artisan', 'handmade', 'gift', 'studio piece'],
        },
        {
          id: `custom-idea-${Date.now()}-2`,
          name: `Minimalist ${cleanInput.split(',')[0] || 'Artisan'} Daily Ritual Set`,
          category: selectedCategory !== 'All' ? selectedCategory : 'Other Handmade Craft',
          difficulty: 'Intermediate',
          estimatedHours: 1.4,
          materialsCost: 450,
          suggestedRetail: 1550,
          profitMarginPercent: 34,
          materials: `${cleanInput}, brass and organic cotton accent cord`,
          craftTechnique: 'Small-batch handmade assembly, precision finishing, hand-rubbed wax',
          starterStory: `Crafted with intention using ${cleanInput}. Every unit possesses distinctive grain and subtle variations of slow human workmanship.`,
          photoUrl: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=800&q=80',
          whyItSells: `Everyday ritual objects (morning tea, desk calm, entryway drop) command high customer loyalty and great word-of-mouth.`,
          marketDemand: 'High Demand',
          bestSeason: 'Fall & Holiday Markets',
          tags: ['ritual', 'artisan', 'minimalist', 'sustainable'],
        },
      ];

      setCustomIdeas((prev) => [...generated, ...prev]);
      setIsBrainstorming(false);
      setBrainstormInput('');
    }, 900);
  };

  const quickPromptChips = [
    'Full-grain leather wallet & brass snaps',
    'Handmade leather shoes & crepe soles',
    'Organic cotton yarn for crocheted bags',
    'Natural linen cloth for artisan shirts',
    'Textured acrylic canvas wall art',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#F4EFE6] border border-[#E3D5C1] rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7EFE6] text-[#344834] text-xs font-semibold">
                <Lightbulb className="w-3.5 h-3.5 text-[#4E654E]" />
                Artisan Inspiration Hub
              </span>
              <span className="text-xs text-[#7A6755]">
                {allIdeas.length} Curated Craft Concepts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-artisan text-[#423023]">
              What to Sell: Proven Craft Product Ideas
            </h2>
            <p className="text-xs sm:text-sm text-[#735F4C] max-w-2xl">
              Discover high-demand, profitable handcrafted products that sell well at artisan markets and online shops. Click <strong>"Craft This"</strong> on any card to immediately pre-fill your product form!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrainstormBox(!showBrainstormBox)}
              className="px-4 py-2.5 rounded-xl bg-[#4E654E] text-[#FAF7F2] text-xs font-bold hover:bg-[#3E523E] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Wand2 className="w-4 h-4 text-[#E7EFE6]" />
              <span>{showBrainstormBox ? 'Hide AI Brainstormer' : 'Brainstorm from My Materials'}</span>
            </button>
          </div>
        </div>

        {/* AI Materials Brainstormer Drawer */}
        {showBrainstormBox && (
          <div className="mt-5 pt-5 border-t border-[#DCCDB7] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C59B3C]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#423023]">
                  AI Craft Idea Brainstormer: What materials or scraps do you have on hand?
                </h3>
              </div>
              <span className="text-[11px] text-[#867362]">Instant custom suggestions</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Leftover vegetable-tanned leather scraps and solid brass key rings..."
                value={brainstormInput}
                onChange={(e) => setBrainstormInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBrainstorm()}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
              />
              <button
                type="button"
                onClick={handleBrainstorm}
                disabled={!brainstormInput.trim() || isBrainstorming}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8B6544] text-white text-xs font-bold hover:bg-[#735133] disabled:opacity-50 transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                {isBrainstorming ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Brainstorming...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Generate Product Ideas</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#887463]">Try quick prompts:</span>
              {quickPromptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setBrainstormInput(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#D8CCBD] text-[#635041] hover:bg-[#F2ECE1] transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filtering Controls */}
      <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887463]">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <input
            type="text"
            id="search-products-input"
            placeholder="Search products by name, materials, technique, or tags (e.g. 'mug', 'leather', 'charcuterie', 'candle', 'gift')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-11 pr-10 py-3 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A69786]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8A7969] hover:text-[#423023]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#4E654E] text-white shadow-xs'
                : 'bg-white border border-[#D8CCBD] text-[#604D3F] hover:bg-[#EFE7DA]'
            }`}
          >
            All Categories ({allIdeas.length})
          </button>
          {CRAFT_CATEGORIES.slice(0, 7).map((cat) => {
            const count = allIdeas.filter((i) => i.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#4E654E] text-white shadow-xs'
                    : 'bg-white border border-[#D8CCBD] text-[#604D3F] hover:bg-[#EFE7DA]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8DFD1] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[#786554]">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-semibold">Filter:</span>
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023] focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
            >
              <option value="All">All Skill Levels</option>
              <option value="Beginner">Beginner Friendly</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Master Artisan">Master Artisan</option>
            </select>

            {/* Demand Filter */}
            <select
              value={selectedDemand}
              onChange={(e) => setSelectedDemand(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023] focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
            >
              <option value="All">All Market Demand</option>
              <option value="Bestseller">Bestsellers Only</option>
              <option value="Trending">Trending Only</option>
            </select>

            {(searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedDemand !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                  setSelectedDemand('All');
                }}
                className="text-[#8B6544] hover:underline font-semibold ml-1"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-[#786554]">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023] font-medium focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
            >
              <option value="recommended">Market Recommended</option>
              <option value="price-desc">Highest Retail Price (₱)</option>
              <option value="time-asc">Quickest to Make (Hours)</option>
              <option value="margin-desc">Highest Profit Margin (%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-[#FAF7F2] border border-dashed border-[#D5C7B6] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EFE7DA] text-[#7A6655] mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#423023]">
            No craft products found for "{searchQuery}"
          </h3>
          <p className="text-xs text-[#7A6655] max-w-md mx-auto">
            Try searching for another keyword like "bowl", "wood", "wallet", or "soap", or use the AI brainstormer above to generate custom product ideas for your specific supplies!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
            }}
            className="px-4 py-2 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E]"
          >
            Clear Search & Show All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#4E654E]/50 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Demand Badge */}
                <div className="relative h-44 w-full bg-[#EDE4D5] overflow-hidden">
                  <img
                    src={idea.photoUrl}
                    alt={idea.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1 ${
                      idea.marketDemand === 'Bestseller'
                        ? 'bg-[#C59B3C] text-white'
                        : idea.marketDemand === 'Trending'
                        ? 'bg-[#E76F51] text-white'
                        : 'bg-[#4E654E] text-white'
                    }`}>
                      <Flame className="w-3 h-3" />
                      {idea.marketDemand}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#423023] shadow-xs">
                    {idea.difficulty}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6544]">
                      {idea.category}
                    </span>
                    <h3 className="text-base font-bold font-artisan text-[#423023] line-clamp-1 group-hover:text-[#4E654E] transition-colors">
                      {idea.name}
                    </h3>
                  </div>

                  {/* Why It Sells Box */}
                  <div className="p-2.5 rounded-xl bg-[#F4EFE6] border border-[#E4D7C4] text-xs text-[#5C4A3A] leading-relaxed">
                    <strong className="text-[#423023] block text-[11px] mb-0.5">
                      💡 Why It Sells:
                    </strong>
                    {idea.whyItSells}
                  </div>

                  {/* Economics Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E8DFD1] text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-[#887463]">Suggested Retail</span>
                      <span className="font-bold text-[#4E654E] text-sm">₱{idea.suggestedRetail.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#887463]">Est. Time</span>
                      <span className="font-semibold text-[#423023]">{idea.estimatedHours} hrs</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#887463]">Target Margin</span>
                      <span className="font-semibold text-[#C59B3C]">{idea.profitMarginPercent}%</span>
                    </div>
                  </div>

                  {/* Materials Preview */}
                  <div className="text-xs text-[#715E4E]">
                    <span className="font-semibold text-[#423023]">Materials: </span>
                    <span className="line-clamp-2">{idea.materials}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: "Craft This" */}
              <div className="p-4 sm:p-5 pt-0">
                <button
                  type="button"
                  id={`btn-craft-idea-${idea.id}`}
                  onClick={() => onSelectIdea(idea)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E] transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
                >
                  <span>Craft This / Use in Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
