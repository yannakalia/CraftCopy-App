import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  DollarSign, 
  Tag, 
  Share2, 
  ShieldAlert, 
  Info,
  Layers,
  ShoppingBag,
  Clock,
  Sparkle
} from 'lucide-react';
import { MarketingContent, ProductInput, PlatformCaption } from '../types';

interface ReviewEditWorkshopProps {
  product: ProductInput;
  setProduct: React.Dispatch<React.SetStateAction<ProductInput>>;
  content: MarketingContent;
  setContent: React.Dispatch<React.SetStateAction<MarketingContent | null>>;
  onApproveAndSave: () => void;
  onRegenerate: (newTone?: 'cozy' | 'luxury' | 'modern', tweakPrompt?: string) => void;
  onReviseCaption?: (instruction: string, platform: 'instagram' | 'facebook' | 'tiktok') => Promise<void>;
  onRegenerateCaption?: (platform: 'instagram' | 'facebook' | 'tiktok') => Promise<void>;
  onSaveCaptionToSupabase?: (captionText: string) => Promise<{ success: boolean; error?: string }>;
  onBackToForm: () => void;
  isRegenerating: boolean;
}

export const ReviewEditWorkshop: React.FC<ReviewEditWorkshopProps> = ({
  product,
  setProduct,
  content,
  setContent,
  onApproveAndSave,
  onRegenerate,
  onReviseCaption,
  onRegenerateCaption,
  onSaveCaptionToSupabase,
  onBackToForm,
  isRegenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'captions' | 'descriptions' | 'pricing' | 'promotional'>('captions');
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'tiktok'>('instagram');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Revision & single regeneration states
  const [revisionInput, setRevisionInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState(false);
  const [captionSaveMessage, setCaptionSaveMessage] = useState<string | null>(null);
  const [captionErrorMessage, setCaptionErrorMessage] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCurrentCaptionString = (): string => {
    if (selectedPlatform === 'instagram') {
      const cap = content.captions.instagram;
      return `${cap.title ? `${cap.title}\n\n` : ''}${cap.body}${cap.hashtags ? `\n\n${cap.hashtags.join(' ')}` : ''}`;
    } else if (selectedPlatform === 'facebook') {
      const cap = content.captions.facebook;
      return `${cap.title ? `${cap.title}\n\n` : ''}${cap.body}${cap.callToAction ? `\n\n👉 ${cap.callToAction}` : ''}${cap.hashtags ? `\n\n${cap.hashtags.join(' ')}` : ''}`;
    } else {
      const cap = content.captions.tiktok;
      return `${cap.hook ? `[HOOK]: ${cap.hook}\n` : ''}${cap.audioIdea ? `[AUDIO]: ${cap.audioIdea}\n\n` : ''}${cap.body}${cap.hashtags ? `\n\n${cap.hashtags.join(' ')}` : ''}`;
    }
  };

  const handleReviseClick = async (instructionToUse?: string) => {
    const inst = (instructionToUse || revisionInput).trim();
    if (!inst || isRevising) return;
    setIsRevising(true);
    setCaptionSaveMessage(null);
    setCaptionErrorMessage(null);
    try {
      if (onReviseCaption) {
        await onReviseCaption(inst, selectedPlatform);
        setCaptionSaveMessage(`Caption revised based on "${inst}" and saved to Supabase!`);
        setRevisionInput('');
        setTimeout(() => setCaptionSaveMessage(null), 4000);
      }
    } catch (err: any) {
      setCaptionErrorMessage(err?.message || 'Failed to revise caption');
    } finally {
      setIsRevising(false);
    }
  };

  const handleRegenerateSingleClick = async () => {
    if (isRegeneratingSingle) return;
    setIsRegeneratingSingle(true);
    setCaptionSaveMessage(null);
    setCaptionErrorMessage(null);
    try {
      if (onRegenerateCaption) {
        await onRegenerateCaption(selectedPlatform);
        setCaptionSaveMessage(`New caption generated using current product information and saved to Supabase!`);
        setTimeout(() => setCaptionSaveMessage(null), 4000);
      }
    } catch (err: any) {
      setCaptionErrorMessage(err?.message || 'Failed to regenerate caption');
    } finally {
      setIsRegeneratingSingle(false);
    }
  };

  const handleSaveCaptionClick = async () => {
    const currentText = getCurrentCaptionString();
    setCaptionSaveMessage(null);
    setCaptionErrorMessage(null);
    try {
      if (onSaveCaptionToSupabase) {
        const res = await onSaveCaptionToSupabase(currentText);
        if (res.success) {
          setCaptionSaveMessage('Latest caption saved to Supabase (caption field)!');
          setTimeout(() => setCaptionSaveMessage(null), 4000);
        } else {
          setCaptionErrorMessage(res.error || 'Failed to save caption to Supabase');
        }
      }
    } catch (err: any) {
      setCaptionErrorMessage(err?.message || 'Failed to save caption to Supabase');
    }
  };

  // Updaters for live editing
  const updateInstagram = (field: 'title' | 'body', val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const updatedCap = {
        ...prev.captions.instagram,
        [field]: val,
      };
      const text = `${updatedCap.title ? `${updatedCap.title}\n\n` : ''}${updatedCap.body}${updatedCap.hashtags ? `\n\n${updatedCap.hashtags.join(' ')}` : ''}`;
      setProduct((p) => ({ ...p, caption: text }));
      return {
        ...prev,
        captions: {
          ...prev.captions,
          instagram: updatedCap,
        },
      };
    });
  };

  const updateFacebook = (field: 'title' | 'body' | 'callToAction', val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const updatedCap = {
        ...prev.captions.facebook,
        [field]: val,
      };
      return {
        ...prev,
        captions: {
          ...prev.captions,
          facebook: updatedCap,
        },
      };
    });
  };

  const updateTikTok = (field: 'hook' | 'body' | 'audioIdea', val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        captions: {
          ...prev.captions,
          tiktok: {
            ...prev.captions.tiktok,
            [field]: val,
          },
        },
      };
    });
  };

  const updateDescription = (field: 'short' | 'story' | 'careInstructions', val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        descriptions: {
          ...prev.descriptions,
          [field]: val,
        },
      };
    });
  };

  const updatePrice = (field: 'suggestedRetail' | 'wholesale', val: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          [field]: val,
        },
      };
    });
  };

  const updatePromotional = (field: 'marketPitch' | 'limitedDrop' | 'makerStory', val: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        promotional: {
          ...prev.promotional,
          [field]: val,
        },
      };
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Banner: Product Summary & AI Labeling */}
      <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          {product.photoUrl ? (
            <img
              src={product.photoUrl}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover border border-[#D8CCBD]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#E8E0D2] flex items-center justify-center text-[#7A6655]">
              <ShoppingBag className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#8B6544] uppercase tracking-wider">
                {product.category}
              </span>
              <button
                type="button"
                onClick={onBackToForm}
                className="text-[11px] text-[#4E654E] hover:underline font-bold flex items-center gap-1"
                title="Return to form to edit product name or details"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Product Details</span>
              </button>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-artisan text-[#423023]">
              {product.name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
              {product.productDetails && (
                <span className="bg-[#EFE7DA] text-[#553E2E] px-2 py-0.5 rounded-md font-medium">
                  Details: {product.productDetails}
                </span>
              )}
              {product.targetAudience && (
                <span className="bg-[#E8EFE8] text-[#2A472A] px-2 py-0.5 rounded-md font-semibold">
                  Target: {product.targetAudience}
                </span>
              )}
              {product.currentPrice && (
                <span className="bg-[#FFF5DF] text-[#8C6418] px-2 py-0.5 rounded-md font-bold">
                  ₱{product.currentPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Transparency Badge */}
        <div className="flex items-center gap-2">
          {content.isSimulated ? (
            <div className="px-3 py-1.5 rounded-xl bg-[#FFF5DF] border border-[#E9D5A1] text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6418]">
                <ShieldAlert className="w-4 h-4 text-[#C59B3C]" />
                <span>Simulated AI Result</span>
              </div>
              <p className="text-[10px] text-[#7A5A18]">
                Local Artisan Engine (Offline simulation)
              </p>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#E8EFE8] border border-[#C5DAC3] text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2A472A]">
                <Sparkles className="w-4 h-4 text-[#4E654E]" />
                <span>{content.aiModelUsed}</span>
              </div>
              <p className="text-[10px] text-[#3D5E3D]">
                Connected to Google Gemini Live API
              </p>
            </div>
          )}

          <button
            onClick={() => onRegenerate()}
            disabled={isRegenerating}
            className="p-2.5 rounded-xl bg-[#EFE7DA] text-[#553E2E] hover:bg-[#E3D9C9] border border-[#D5C7B5] transition-all"
            title="Regenerate all content"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Review & Edit Navigation Tabs */}
      <div className="flex border-b border-[#E8DFD1] gap-2 overflow-x-auto pb-1">
        {[
          { id: 'captions', label: 'Social Captions', icon: '📸' },
          { id: 'descriptions', label: 'Product Descriptions', icon: '📝' },
          { id: 'pricing', label: 'AI Pricing Breakdown', icon: '🏷️' },
          { id: 'promotional', label: 'Promotions & Pitches', icon: '📢' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#4E654E] text-white shadow-xs'
                : 'text-[#6C5746] hover:bg-[#EFE7DA]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Captions */}
      {activeTab === 'captions' && (
        <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['instagram', 'facebook', 'tiktok'] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedPlatform === plat
                      ? 'bg-[#423023] text-white'
                      : 'bg-[#EAE2D3] text-[#5F4B3C] hover:bg-[#DED3C1]'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#826F5E] italic">
              ✏️ You can edit any text below directly
            </span>
          </div>

          {selectedPlatform === 'instagram' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Post Headline / Opening Line
                </label>
                <input
                  type="text"
                  value={content.captions.instagram.title}
                  onChange={(e) => updateInstagram('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Story & Caption Body
                </label>
                <textarea
                  rows={12}
                  value={content.captions.instagram.body}
                  onChange={(e) => updateInstagram('body', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#635041]">
                    Recommended Artisan Hashtags
                  </label>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        content.captions.instagram.hashtags.join(' '),
                        'ig-tags'
                      )
                    }
                    className="text-xs text-[#4E654E] hover:underline font-semibold flex items-center gap-1"
                  >
                    {copiedKey === 'ig-tags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'ig-tags' ? 'Copied!' : 'Copy Tags'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white border border-[#D5C7B6]">
                  {content.captions.instagram.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#EFE7DA] text-[#553E2E] text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedPlatform === 'facebook' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Post Headline
                </label>
                <input
                  type="text"
                  value={content.captions.facebook.title}
                  onChange={(e) => updateFacebook('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Community Storytelling Body
                </label>
                <textarea
                  rows={12}
                  value={content.captions.facebook.body}
                  onChange={(e) => updateFacebook('body', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Call to Action (CTA)
                </label>
                <input
                  type="text"
                  value={content.captions.facebook.callToAction || ''}
                  onChange={(e) => updateFacebook('callToAction', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
                />
              </div>
            </div>
          )}

          {selectedPlatform === 'tiktok' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Video Hook / On-Screen Text
                </label>
                <input
                  type="text"
                  value={content.captions.tiktok.hook || ''}
                  onChange={(e) => updateTikTok('hook', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Recommended Audio / Workshop ASMR Idea
                </label>
                <input
                  type="text"
                  value={content.captions.tiktok.audioIdea || ''}
                  onChange={(e) => updateTikTok('audioIdea', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-[#F7F2E9] text-[#523F30] text-sm italic"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#635041] mb-1">
                  Video Caption & Craft Details
                </label>
                <textarea
                  rows={8}
                  value={content.captions.tiktok.body}
                  onChange={(e) => updateTikTok('body', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* AI Caption Revision & Regeneration Tools */}
          <div className="pt-4 border-t border-[#E8DFD1] space-y-4">
            <div className="p-4 rounded-xl bg-white border border-[#D5C7B6] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4E654E]/10 flex items-center justify-center text-[#4E654E]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#423023]">
                      Revise This Caption with AI
                    </h4>
                    <p className="text-[11px] text-[#7A6655]">
                      Request revisions to the current caption while keeping it strictly focused on your {product.name}.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E3D6C5] text-[#705A47] font-medium capitalize">
                  {selectedPlatform} Caption
                </span>
              </div>

              {/* Quick revision recommendation chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Make shorter & punchier',
                  product.targetAudience ? `Target for ${product.targetAudience}` : 'Tailor for students',
                  product.productDetails ? `Emphasize: ${product.productDetails.slice(0, 30)}` : 'Highlight handcrafted details',
                  'Add emojis & upbeat tone',
                  'Highlight price & DM to order',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleReviseClick(chip)}
                    disabled={isRevising}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EFE7DA] border border-[#D5C7B6] text-[#553E2E] transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Custom revision prompt input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. Specifically promote to students with an affordable everyday tone..."
                  value={revisionInput}
                  onChange={(e) => setRevisionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleReviseClick();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#D5C7B6] bg-[#FAF7F2] text-xs text-[#423023] focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#9F8F7E]"
                />
                <button
                  type="button"
                  id="btn-revise-caption"
                  data-testid="btn-revise-caption"
                  onClick={() => handleReviseClick()}
                  disabled={isRevising || !revisionInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#4E654E] hover:bg-[#3E523E] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isRevising ? 'animate-spin' : ''}`} />
                  <span>{isRevising ? 'Revising...' : 'Revise Caption'}</span>
                </button>
              </div>
            </div>

            {/* Caption Actions Row: Regenerate Single Caption & Save to Supabase */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-regenerate-single-caption"
                  data-testid="btn-regenerate-single-caption"
                  onClick={handleRegenerateSingleClick}
                  disabled={isRegeneratingSingle}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C7B6] bg-white hover:bg-[#FAF7F2] text-[#423023] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Generate a new fresh caption variation using the same product data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingSingle ? 'animate-spin' : ''}`} />
                  <span>{isRegeneratingSingle ? 'Generating...' : 'Regenerate Caption'}</span>
                </button>

                <button
                  type="button"
                  onClick={onBackToForm}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C7B6] bg-white hover:bg-[#FAF7F2] text-[#423023] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Change product name or details in form"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8B6544]" />
                  <span>Change Product Info</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-save-caption-supabase"
                data-testid="btn-save-caption-supabase"
                onClick={handleSaveCaptionClick}
                className="px-4 py-2 rounded-xl bg-[#3E523E] hover:bg-[#2F402F] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Caption to Supabase</span>
              </button>
            </div>

            {/* Inline Caption Success / Error Banner */}
            {captionSaveMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{captionSaveMessage}</span>
              </div>
            )}
            {captionErrorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{captionErrorMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Descriptions */}
      {activeTab === 'descriptions' && (
        <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              Short Description (For Etsy, Shopify, Instagram Shop or Catalog)
            </label>
            <textarea
              rows={3}
              value={content.descriptions.short}
              onChange={(e) => updateDescription('short', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              Sensory Artisan Storytelling Description
            </label>
            <textarea
              rows={5}
              value={content.descriptions.story}
              onChange={(e) => updateDescription('story', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              Artisan Bullet Specifications
            </label>
            <div className="space-y-1.5">
              {content.descriptions.bulletPoints.map((bp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4E654E]" />
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => {
                      const updated = [...content.descriptions.bulletPoints];
                      updated[idx] = e.target.value;
                      setContent((prev) => prev ? { ...prev, descriptions: { ...prev.descriptions, bulletPoints: updated } } : prev);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-xs text-[#423023]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              Care & Longevity Instructions
            </label>
            <input
              type="text"
              value={content.descriptions.careInstructions}
              onChange={(e) => updateDescription('careInstructions', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
            />
          </div>
        </div>
      )}

      {/* Tab 3: AI Pricing Assistant */}
      {activeTab === 'pricing' && (
        <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-5 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#D5C7B6] shadow-2xs">
              <span className="text-xs text-[#7A6655] font-medium block">Suggested Retail Price</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-2xl font-bold text-[#4E654E]">₱</span>
                <input
                  type="number"
                  value={content.pricing.suggestedRetail}
                  onChange={(e) => updatePrice('suggestedRetail', Number(e.target.value))}
                  className="text-2xl font-bold text-[#4E654E] w-28 border-b border-[#D5C7B6] bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#867464] mt-1">
                Fair artisan pricing protecting your living wage
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D5C7B6] shadow-2xs">
              <span className="text-xs text-[#7A6655] font-medium block">Wholesale Price (50-60%)</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-2xl font-bold text-[#8B6544]">₱</span>
                <input
                  type="number"
                  value={content.pricing.wholesale}
                  onChange={(e) => updatePrice('wholesale', Number(e.target.value))}
                  className="text-2xl font-bold text-[#8B6544] w-28 border-b border-[#D5C7B6] bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#867464] mt-1">
                For boutique stockists, gift shops, and galleries
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4EFE6] border border-[#E4D7C4] shadow-2xs">
              <span className="text-xs text-[#7A6655] font-medium block">Minimum Breakeven Floor</span>
              <span className="text-2xl font-bold text-[#423023] block mt-1">
                ₱{content.pricing.minBreakeven.toLocaleString()}
              </span>
              <p className="text-[11px] text-[#867464] mt-1">
                Materials + Labor + Overhead base cost
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F1E6] border border-[#E5DAC8] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#635041] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C59B3C]" />
              Artisan Pricing Insight
            </h4>
            <p className="text-sm text-[#4E3A2B] leading-relaxed">
              {content.pricing.pricingTip}
            </p>
            <p className="text-xs text-[#7C6958]">
              {content.pricing.marketComparison}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Promotional & Pitches */}
      {activeTab === 'promotional' && (
        <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              In-Person Craft Fair & Market Booth Pitch (30-second verbal pitch)
            </label>
            <textarea
              rows={3}
              value={content.promotional.marketPitch}
              onChange={(e) => updatePromotional('marketPitch', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              Micro-Batch Limited Drop Announcement
            </label>
            <textarea
              rows={3}
              value={content.promotional.limitedDrop}
              onChange={(e) => updatePromotional('limitedDrop', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#635041] mb-1">
              "Meet the Maker" Newsletter / Story Blurb
            </label>
            <textarea
              rows={3}
              value={content.promotional.makerStory}
              onChange={(e) => updatePromotional('makerStory', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm"
            />
          </div>
        </div>
      )}

      {/* User Satisfaction Decision Box: Strict App Workflow Requirement */}
      <div className="bg-[#FAF7F2] border-2 border-[#D8CCBD] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B6544] block mb-1">
              Step 3: Workflow Decision Point
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-artisan text-[#423023]">
              Are you satisfied with this generated marketing content?
            </h3>
            <p className="text-xs sm:text-sm text-[#735F4C]">
              If yes, approve and save to display the final "Content Ready to Post" suite. If no, tweak the tone or regenerate.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* If NO: Open regenerate options */}
            <button
              type="button"
              id="btn-not-satisfied"
              onClick={() => setShowRegenerateModal(true)}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-[#C5B5A2] bg-[#F2ECE1] text-[#553E2E] hover:bg-[#E7DFCE] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <ThumbsDown className="w-4 h-4 text-[#8C6418]" />
              <span>No, Edit / Regenerate</span>
            </button>

            {/* If YES: Approve and Proceed to Ready to Post */}
            <button
              type="button"
              id="btn-satisfied-approve"
              onClick={onApproveAndSave}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-[#4E654E] text-[#FAF7F2] hover:bg-[#3E523E] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <ThumbsUp className="w-4 h-4 text-[#E7EFE6]" />
              <span>Yes, Approve & Save!</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Regeneration / Tweak Prompt */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold font-artisan text-[#423023]">
              Refine or Regenerate Copy
            </h4>
            <p className="text-xs text-[#735F4C]">
              Tell the AI what to change or pick a new tone:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#635041]">
                Quick Tone Shift:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cozy', label: 'Warm & Cozy' },
                  { id: 'luxury', label: 'Bespoke Luxury' },
                  { id: 'modern', label: 'Minimal Modern' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onRegenerate(t.id as any, tweakPrompt);
                      setShowRegenerateModal(false);
                    }}
                    className="p-2 rounded-lg bg-white border border-[#D5C7B6] text-xs font-medium text-[#423023] hover:bg-[#EFE7DA]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#635041]">
                Specific Refinement Instruction:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Make the Instagram caption shorter and focus more on the local clay digging process..."
                value={tweakPrompt}
                onChange={(e) => setTweakPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-xs text-[#423023]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#635041] hover:bg-[#EFE7DA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRegenerate(undefined, tweakPrompt);
                  setShowRegenerateModal(false);
                }}
                disabled={isRegenerating}
                className="px-4 py-2 rounded-lg bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E]"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Content'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
