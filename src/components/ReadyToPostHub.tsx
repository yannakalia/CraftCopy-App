import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  Instagram, 
  Facebook, 
  ShoppingBag, 
  Sparkles, 
  ArrowLeft, 
  PlusCircle, 
  Bookmark,
  ExternalLink,
  Download,
  FileText
} from 'lucide-react';
import { MarketingContent, ProductInput } from '../types';

interface ReadyToPostHubProps {
  product: ProductInput;
  content: MarketingContent;
  onCopyPlatform: (platform: 'instagram' | 'facebook' | 'tiktok' | 'marketplaces') => void;
  onNewProduct: () => void;
  onGoToCatalog: () => void;
  onEditAgain: () => void;
}

export const ReadyToPostHub: React.FC<ReadyToPostHubProps> = ({
  product,
  content,
  onCopyPlatform,
  onNewProduct,
  onGoToCatalog,
  onEditAgain,
}) => {
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'facebook' | 'tiktok' | 'marketplace' | 'booth'>('instagram');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const triggerCopy = (text: string, platformKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(platformKey);
    if (platformKey === 'instagram') onCopyPlatform('instagram');
    else if (platformKey === 'facebook') onCopyPlatform('facebook');
    else if (platformKey === 'tiktok') onCopyPlatform('tiktok');
    else onCopyPlatform('marketplaces');

    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getInstagramFullText = () => {
    return `${content.captions.instagram.title}\n\n${content.captions.instagram.body}\n\n${content.captions.instagram.hashtags.join(' ')}`;
  };

  const getFacebookFullText = () => {
    return `${content.captions.facebook.title}\n\n${content.captions.facebook.body}\n\n👉 ${content.captions.facebook.callToAction}\n\n${content.captions.facebook.hashtags?.join(' ') || ''}`;
  };

  const getTikTokFullText = () => {
    return `[HOOK]: ${content.captions.tiktok.hook}\n[AUDIO IDEA]: ${content.captions.tiktok.audioIdea}\n\n[CAPTION]: ${content.captions.tiktok.body}\n\n${content.captions.tiktok.hashtags?.join(' ') || ''}`;
  };

  const getMarketplaceListing = () => {
    return `${product.name} - Handcrafted ${product.category}\nSuggested Retail: ₱${content.pricing.suggestedRetail.toLocaleString()}\n\nDESCRIPTION:\n${content.descriptions.story}\n\nPRODUCT HIGHLIGHTS:\n${content.descriptions.bulletPoints.map(b => `• ${b}`).join('\n')}\n\nCARE INSTRUCTIONS:\n${content.descriptions.careInstructions}\n\nMATERIALS:\n${product.materials}`;
  };

  const getBoothCard = () => {
    return `✦ ${product.name} ✦\nHandcrafted by Local Artisan\n\nPrice: ₱${content.pricing.suggestedRetail.toLocaleString()}\n\nMaterials: ${product.materials}\nCrafted with: ${product.craftTechnique}\n\n"${content.promotional.makerStory}"`;
  };

  const downloadTextFile = () => {
    const fullKit = `=====================================================
CRAFTCOPY ARTISAN MARKETING KIT: ${product.name}
=====================================================
Category: ${product.category}
Suggested Retail: ₱${content.pricing.suggestedRetail.toLocaleString()} (Wholesale: ₱${content.pricing.wholesale.toLocaleString()})
Materials: ${product.materials}
Technique: ${product.craftTechnique}

-----------------------------------------------------
1. INSTAGRAM CAPTION
-----------------------------------------------------
${getInstagramFullText()}

-----------------------------------------------------
2. FACEBOOK COMMUNITY POST
-----------------------------------------------------
${getFacebookFullText()}

-----------------------------------------------------
3. TIKTOK SCRIPT & SOUND
-----------------------------------------------------
${getTikTokFullText()}

-----------------------------------------------------
4. ONLINE MARKETPLACE (ETSY / SHOPIFY) LISTING
-----------------------------------------------------
${getMarketplaceListing()}

-----------------------------------------------------
5. MARKET BOOTH VERBAL PITCH
-----------------------------------------------------
${content.promotional.marketPitch}

-----------------------------------------------------
6. PRICING ANALYSIS & BREAKDOWN
-----------------------------------------------------
Suggested Retail: ₱${content.pricing.suggestedRetail.toLocaleString()}
Wholesale Price: ₱${content.pricing.wholesale.toLocaleString()}
Min Breakeven: ₱${content.pricing.minBreakeven.toLocaleString()}
Target Margin: ${content.pricing.profitMarginPercent}%
Artisan Advice: ${content.pricing.pricingTip}
`;

    const blob = new Blob([fullKit], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name.replace(/\s+/g, '_')}_MarketingKit.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-in fade-in">
      {/* Workflow Endpoint Banner */}
      <div className="bg-[#E7EFE6] border-2 border-[#4E654E] rounded-2xl p-5 sm:p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#4E654E] text-[#FAF7F2] flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#3E523E] bg-[#D7E6D5] px-2 py-0.5 rounded-full">
                Workflow Complete
              </span>
              <span className="text-xs text-[#526D52]">Saved to Studio Catalog</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-artisan text-[#283828] mt-0.5">
              Content Ready to Post!
            </h2>
            <p className="text-xs sm:text-sm text-[#3E553E]">
              Your handcrafted marketing suite is approved. Click below to copy directly to your clipboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadTextFile}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#C5DAC3] text-xs font-semibold text-[#2F442F] hover:bg-[#F2ECE1] transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export .TXT</span>
          </button>
          <button
            onClick={onNewProduct}
            className="px-3.5 py-2 rounded-xl bg-[#4E654E] text-[#FAF7F2] text-xs font-bold hover:bg-[#3E523E] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Platform Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'instagram', label: 'Instagram', icon: '📸' },
          { id: 'facebook', label: 'Facebook', icon: '👥' },
          { id: 'tiktok', label: 'TikTok', icon: '🎵' },
          { id: 'marketplace', label: 'Etsy / Shop', icon: '🛍️' },
          { id: 'booth', label: 'Fair Sign', icon: '🏷️' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id as any)}
            className={`p-3 rounded-xl text-center border font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === p.id
                ? 'bg-[#4E654E] text-white border-[#4E654E] shadow-sm'
                : 'bg-[#FAF7F2] border-[#E8DFD1] text-[#635041] hover:bg-[#EFE7DA]'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Content Display Card with 1-Click Copy */}
      <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD1]">
          <div>
            <span className="text-xs font-bold text-[#8B6544] uppercase tracking-wider">
              {activePlatform === 'instagram' && 'Instagram Post & Reels Caption'}
              {activePlatform === 'facebook' && 'Facebook Community & Group Post'}
              {activePlatform === 'tiktok' && 'TikTok CraftTok Script & Sound'}
              {activePlatform === 'marketplace' && 'Marketplace Listing (Etsy / Shopify / Square)'}
              {activePlatform === 'booth' && 'Artisan Fair Display Sign & Tag'}
            </span>
            <h3 className="text-base sm:text-lg font-bold font-artisan text-[#423023]">
              {product.name}
            </h3>
          </div>

          <button
            type="button"
            id={`btn-copy-${activePlatform}`}
            onClick={() => {
              if (activePlatform === 'instagram') triggerCopy(getInstagramFullText(), 'instagram');
              else if (activePlatform === 'facebook') triggerCopy(getFacebookFullText(), 'facebook');
              else if (activePlatform === 'tiktok') triggerCopy(getTikTokFullText(), 'tiktok');
              else if (activePlatform === 'marketplace') triggerCopy(getMarketplaceListing(), 'marketplace');
              else triggerCopy(getBoothCard(), 'booth');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              copiedKey === activePlatform
                ? 'bg-[#3E523E] text-white'
                : 'bg-[#4E654E] text-white hover:bg-[#3E523E] active:scale-95'
            }`}
          >
            {copiedKey === activePlatform ? (
              <>
                <Check className="w-4 h-4 text-[#A1E3A1]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#FAF7F2]" />
                <span>Copy for {activePlatform.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* Text Content Box */}
        <div className="bg-white rounded-xl border border-[#D5C7B6] p-4 sm:p-5 font-mono text-xs sm:text-sm text-[#423023] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto selection:bg-[#E2D5C3]">
          {activePlatform === 'instagram' && getInstagramFullText()}
          {activePlatform === 'facebook' && getFacebookFullText()}
          {activePlatform === 'tiktok' && getTikTokFullText()}
          {activePlatform === 'marketplace' && getMarketplaceListing()}
          {activePlatform === 'booth' && getBoothCard()}
        </div>

        {/* Action Footnotes */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7F6C5B] pt-2">
          <div className="flex items-center gap-2">
            <span>Suggested Price: <strong>₱{content.pricing.suggestedRetail.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Wholesale: <strong>₱{content.pricing.wholesale.toLocaleString()}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onEditAgain}
              className="text-[#8B6544] hover:underline font-medium"
            >
              Need to tweak? Re-open editor
            </button>
            <span>•</span>
            <button
              onClick={onGoToCatalog}
              className="text-[#4E654E] hover:underline font-bold"
            >
              View in Saved Catalog →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
