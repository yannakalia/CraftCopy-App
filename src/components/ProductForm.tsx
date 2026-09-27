import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Calculator, 
  Layers, 
  BookOpen, 
  HelpCircle,
  Wand2,
  X,
  Check,
  Store,
  Lightbulb,
  User,
  ArrowRight,
  FileText,
  RefreshCw,
  Trash2,
  Maximize2,
  Save,
  Loader2,
  CheckCircle2,
  Camera,
  Database,
  AlertCircle
} from 'lucide-react';
import { ProductInput, ArtisanProfile } from '../types';
import { CRAFT_CATEGORIES, SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { calculateCraftPricing } from '../utils/pricingEngine';
import { optimizeImageFile, formatBytes } from '../utils/imageOptimizer';

interface ProductFormProps {
  product: ProductInput;
  setProduct: React.Dispatch<React.SetStateAction<ProductInput>>;
  tone: 'cozy' | 'luxury' | 'modern';
  setTone: (tone: 'cozy' | 'luxury' | 'modern') => void;
  customInstructions: string;
  setCustomInstructions: (notes: string) => void;
  onProceedToGenerate: () => void;
  isGenerating: boolean;
  artisanProfile: ArtisanProfile;
  onOpenBasicInfo: () => void;
  onOpenProductIdeas: () => void;
  onSaveProduct?: (product: ProductInput) => Promise<{ success: boolean; error?: string; product?: ProductInput }> | void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  setProduct,
  tone,
  setTone,
  customInstructions,
  setCustomInstructions,
  onProceedToGenerate,
  isGenerating,
  artisanProfile,
  onOpenBasicInfo,
  onOpenProductIdeas,
  onSaveProduct,
}) => {
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false);
  const [photoMeta, setPhotoMeta] = useState<{ fileName: string; fileSize: string } | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const livePricing = calculateCraftPricing(
    product.costDetails,
    product.category,
    product.currentPrice
  );

  const handleInputChange = (field: keyof ProductInput, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleCostChange = (field: keyof ProductInput['costDetails'], value: number) => {
    setProduct((prev) => ({
      ...prev,
      costDetails: {
        ...prev.costDetails,
        [field]: value,
      },
    }));
  };

  const processAndSetImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }

    try {
      setIsOptimizingPhoto(true);
      const result = await optimizeImageFile(file, 1200, 0.85);

      // Upload and store the photo on the server to get an actual photo URL
      try {
        const uploadRes = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: result.dataUrl,
            fileName: file.name,
          }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            handleInputChange('photoUrl', uploadData.url);
            setPhotoMeta({
              fileName: uploadData.fileName || file.name,
              fileSize: formatBytes(result.optimizedSizeBytes),
            });
            return;
          }
        }
      } catch (uploadErr) {
        console.warn('Could not upload to /api/upload-photo, using dataUrl fallback:', uploadErr);
      }

      handleInputChange('photoUrl', result.dataUrl);
      setPhotoMeta({
        fileName: result.fileName,
        fileSize: formatBytes(result.optimizedSizeBytes),
      });
    } catch (err: any) {
      console.error('Error processing photo:', err);
      // Fallback direct reader
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        handleInputChange('photoUrl', res);
        setPhotoMeta({
          fileName: file.name,
          fileSize: formatBytes(file.size),
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsOptimizingPhoto(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    handleInputChange('photoUrl', '');
    setPhotoMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDirectSave = async () => {
    if (!product.name.trim() || isSaving) return;
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    // Collect CURRENT product form values exactly as entered
    const currentFormValues: ProductInput = {
      ...product,
      name: product.name.trim(),
      ownerName: (product.ownerName || '').trim(),
      productDetails: (product.productDetails || product.story || '').trim(),
      targetAudience: (product.targetAudience || '').trim(),
      cost: product.cost !== null && product.cost !== undefined && String(product.cost).trim() !== ''
        ? Number(product.cost)
        : (product.costDetails?.materialsCost ? Number(product.costDetails.materialsCost) : null),
      currentPrice: product.currentPrice !== null && product.currentPrice !== undefined && String(product.currentPrice).trim() !== ''
        ? Number(product.currentPrice)
        : null,
      photoUrl: (product.photoUrl || '').trim(),
      caption: (product.caption || '').trim(),
      productDescription: (product.productDescription || '').trim(),
      productIdea: (product.productIdea || '').trim(),
      category: product.category,
      materials: product.materials,
      story: product.story,
      craftTechnique: product.craftTechnique,
      costDetails: { ...product.costDetails },
    };

    try {
      if (onSaveProduct) {
        const res = await onSaveProduct(currentFormValues);
        if (res && res.success) {
          setSaveSuccessMessage('Product successfully saved & synced to Supabase (public.products)!');
          setSaveErrorMessage(null);
          setTimeout(() => setSaveSuccessMessage(null), 5000);
        } else {
          const err = res?.error || 'Failed to insert product into public.products.';
          setSaveErrorMessage(err);
          setSaveSuccessMessage(null);
        }
      } else {
        setSaveErrorMessage('Save/Sync handler is not configured.');
      }
    } catch (err: any) {
      setSaveErrorMessage(err?.message || 'An unexpected error occurred while inserting product to Supabase.');
      setSaveSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSample = (sample: ProductInput) => {
    setProduct({ ...sample, id: `craft-${Date.now()}` });
    setPhotoMeta({
      fileName: `${sample.name.split(' ')[0]} Reference`,
      fileSize: 'Sample HD Photo',
    });
  };

  const handleApplyProfileStory = () => {
    const storySnippet = artisanProfile.bio 
      ? `Handcrafted by ${artisanProfile.makerName || 'our artisan'} at ${artisanProfile.studioName || 'our studio'}${artisanProfile.location ? ` in ${artisanProfile.location}` : ''}. ${artisanProfile.bio}`
      : `Handcrafted with care by ${artisanProfile.makerName || 'our artisan'} at ${artisanProfile.studioName || 'our studio'}.`;
    
    setProduct((prev) => ({
      ...prev,
      story: prev.story ? `${prev.story}\n\n${storySnippet}` : storySnippet,
    }));
  };

  const isValid =
    product.name.trim().length > 0 &&
    Boolean((product.productDetails && product.productDetails.trim().length > 0) || (product.materials && product.materials.trim().length > 0));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Artisan Profile & Basic Information Banner */}
      <div className="bg-[#FAF7F2] border border-[#E3D5C1] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#4E654E] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Store className="w-5 h-5 text-[#FAF7F2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#8B6544]">
                Maker Studio Profile
              </span>
              {artisanProfile.makerName && (
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-[#E7EFE6] text-[#3E523E] font-semibold">
                  Profile Active
                </span>
              )}
            </div>
            <h3 className="text-base font-bold font-artisan text-[#423023]">
              {artisanProfile.studioName || 'My Artisan Studio'} 
              <span className="font-normal text-xs text-[#7A6655] ml-2">
                by {artisanProfile.makerName || 'Independent Craftsman'} {artisanProfile.location ? `• ${artisanProfile.location}` : ''}
              </span>
            </h3>
            <p className="text-xs text-[#735F4C] line-clamp-1 mt-0.5">
              {artisanProfile.bio || 'Provide your studio details to auto-personalize all stories and living-wage pricing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            id="btn-edit-basic-info"
            onClick={onOpenBasicInfo}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#D5C7B6] text-[#423023] hover:bg-[#F2ECE1] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-[#4E654E]" />
            <span>{artisanProfile.makerName ? 'Edit Basic Info' : 'Fill Basic Info'}</span>
          </button>
          {artisanProfile.bio && (
            <button
              type="button"
              onClick={handleApplyProfileStory}
              className="px-3 py-2 rounded-xl bg-[#E7EFE6] text-[#344834] hover:bg-[#D9E6D8] text-xs font-semibold transition-all flex items-center gap-1"
              title="Add your studio origin story to this piece"
            >
              <FileText className="w-3.5 h-3.5 text-[#4E654E]" />
              <span className="hidden sm:inline">Use Studio Bio</span>
            </button>
          )}
        </div>
      </div>

      {/* Welcome & Presets bar */}
      <div className="bg-[#F4EFE6] border border-[#E4D7C4] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7EFE6] text-[#344834] text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#4E654E]" />
              Artisan Quick Start
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-artisan text-[#423023]">
              Describe Your Handcrafted Creation
            </h2>
            <p className="text-xs sm:text-sm text-[#735F4C]">
              Fill in your product details below, or explore our curated product ideas what to sell:
            </p>
          </div>

          <button
            type="button"
            id="btn-browse-ideas-form"
            onClick={onOpenProductIdeas}
            className="px-4 py-2 rounded-xl bg-[#4E654E] text-[#FAF7F2] text-xs font-bold hover:bg-[#3E523E] transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Lightbulb className="w-4 h-4 text-[#C59B3C]" />
            <span>Need Ideas What to Sell?</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E4D7C4]/70">
          <span className="text-[11px] font-semibold text-[#867464]">Quick fill sample craft:</span>
          {SAMPLE_PRODUCTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSample(s)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#D8CCBC] text-[#553E2E] hover:border-[#4E654E] hover:bg-[#EAE2D3] transition-all font-medium flex items-center gap-1 shadow-2xs"
            >
              <span>{s.name.split(' ')[0]}</span>
              <span className="text-[#887463]">({s.category.split(' ')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Product Name & Owner */}
          <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                1. Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="input-product-name"
                name="product_name"
                data-testid="input-product-name"
                placeholder="e.g. Mountain Mist Speckled Stoneware Mug"
                value={product.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] focus:border-transparent transition-all placeholder:text-[#A89887]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                Owner / Maker Name
              </label>
              <input
                type="text"
                id="input-owner-name"
                name="owner_name"
                data-testid="input-owner-name"
                placeholder="e.g. Elena Santos"
                value={product.ownerName || ''}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] focus:border-transparent transition-all placeholder:text-[#A89887]"
              />
            </div>

            {/* Category, Cost, and Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6F5B4B] mb-1">
                  Craft Category
                </label>
                <select
                  id="select-category"
                  name="category"
                  value={product.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                >
                  {CRAFT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F5B4B] mb-1">
                  Cost to Make (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#887463] text-sm">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    id="input-cost"
                    name="cost"
                    data-testid="input-cost"
                    placeholder="e.g. 450"
                    value={product.cost ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      handleInputChange('cost', val);
                      if (val !== null) {
                        handleCostChange('materialsCost', val);
                      }
                    }}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F5B4B] mb-1">
                  Selling Price (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#887463] text-sm">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    id="input-price"
                    name="price"
                    data-testid="input-price"
                    placeholder="e.g. 1850"
                    value={product.currentPrice ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'currentPrice',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                  />
                  <input
                    type="hidden"
                    id="input-current-price"
                    value={product.currentPrice ?? ''}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Details, Materials & Technique */}
          <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                2. Product Details & Specifications
              </label>
              <textarea
                rows={2}
                id="input-product-details"
                name="product_details"
                data-testid="input-product-details"
                placeholder="e.g. Pink and white bracelet made with beads, elastic stretch cord, hypoallergenic."
                value={product.productDetails || ''}
                onChange={(e) => handleInputChange('productDetails', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
              />
              <p className="text-[11px] text-[#867362] mt-1">
                Enter colors, features, dimensions, beads, style, and specific details.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                3. Target Buyers / Audience
              </label>
              <input
                type="text"
                id="input-target-audience"
                name="target_audience"
                data-testid="input-target-audience"
                placeholder="e.g. Students, young adults, gift shoppers, conscious fashion lovers"
                value={product.targetAudience || ''}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
              />
              <p className="text-[11px] text-[#867362] mt-1">
                Helps the AI tailor tone, hooks, and hashtags to your exact ideal customers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                4. Raw Materials & Provenance
              </label>
              <textarea
                rows={2}
                id="input-materials"
                name="materials"
                placeholder="e.g. Glass seed beads, rose quartz beads, durable elastic cord"
                value={product.materials}
                onChange={(e) => handleInputChange('materials', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
              />
              <p className="text-[11px] text-[#867362] mt-1">
                Mention natural textures, locally sourced materials, or eco-friendly elements.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1.5">
                5. Craft Technique & Method
              </label>
              <input
                type="text"
                id="input-technique"
                name="craft_technique"
                placeholder="e.g. Hand-strung and knotted, double-reinforced beadwork"
                value={product.craftTechnique}
                onChange={(e) => handleInputChange('craftTechnique', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B]">
                  6. The Story Behind the Piece
                </label>
                <span className="text-[11px] text-[#887463]">Adds soul to your copy</span>
              </div>
              <textarea
                rows={3}
                id="input-story"
                name="story"
                placeholder="e.g. Created in our home studio during foggy autumn mornings. Inspired by the ridge lines of the Blue Ridge mountains. Designed to fit comfortably in your hands for morning coffee rituals."
                value={product.story}
                onChange={(e) => handleInputChange('story', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
              />
            </div>
          </div>


          {/* AI Pricing Assistant Accordion/Drawer */}
          <div className="bg-[#F6EFE3] border border-[#DECFB8] rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C59B3C]/15 flex items-center justify-center text-[#9E7828]">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#423023]">
                    AI Pricing Assistant
                  </h3>
                  <p className="text-[11px] text-[#786452]">
                    Calculates sustainable living-wage pricing for makers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPricingCalculator(!showPricingCalculator)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#FAF7F2] border border-[#D8CCBC] text-[#553E2E] hover:bg-white"
              >
                {showPricingCalculator ? 'Collapse' : 'Tune Costs'}
              </button>
            </div>

            {/* Quick Pricing Badge preview */}
            <div className="mt-3 flex flex-wrap items-center justify-between bg-white/70 rounded-xl px-3.5 py-2.5 border border-[#E5D7C5]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6655]">AI Suggested Retail:</span>
                <span className="text-base font-bold text-[#4E654E]">
                  ₱{livePricing.suggestedRetail.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#867464]">
                  (Wholesale: ₱{livePricing.wholesale.toLocaleString()})
                </span>
              </div>
              <div className="text-[11px] font-medium text-[#8B6544]">
                Profit: ₱{livePricing.artisanProfitPerUnit.toLocaleString()}/unit ({livePricing.profitMarginPercent}%)
              </div>
            </div>

            {/* Collapsible details form */}
            {showPricingCalculator && (
              <div className="mt-4 pt-3 border-t border-[#E5D7C5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[#6F5B4B] font-semibold mb-1">
                    Raw Materials (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={product.costDetails.materialsCost}
                    onChange={(e) => handleCostChange('materialsCost', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                  />
                </div>

                <div>
                  <label className="block text-[#6F5B4B] font-semibold mb-1">
                    Labor (Hours)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.25"
                    value={product.costDetails.laborHours}
                    onChange={(e) => handleCostChange('laborHours', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                  />
                </div>

                <div>
                  <label className="block text-[#6F5B4B] font-semibold mb-1">
                    Artisan Wage (₱/hr)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={product.costDetails.hourlyRate}
                    onChange={(e) => handleCostChange('hourlyRate', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                  />
                </div>

                <div>
                  <label className="block text-[#6F5B4B] font-semibold mb-1">
                    Overhead & Box (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={product.costDetails.overheadCost}
                    onChange={(e) => handleCostChange('overheadCost', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-4 mt-1 bg-[#F9F5EC] p-2.5 rounded-lg text-[11px] text-[#715D4C]">
                  💡 <strong>Sustainable Pricing Advice:</strong> {livePricing.pricingTip}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Photo Upload & Tone Selection */}
        <div className="lg:col-span-5 space-y-5">
          {/* Photo Upload Card */}
          <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B]">
                  Product Photo
                </label>
                <p className="text-[11px] text-[#867362]">
                  Upload an actual photo of your handcrafted piece
                </p>
              </div>
              {product.photoUrl && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E7EFE6] text-[#344834] font-semibold flex items-center gap-1 border border-[#C5DAC3]">
                  <Check className="w-3 h-3 text-[#4E654E]" />
                  Photo Attached
                </span>
              )}
            </div>

            {/* Hidden native file input with camera/device file support */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processAndSetImage(e.target.files[0]);
                }
              }}
            />

            {/* Loading state during optimization */}
            {isOptimizingPhoto && (
              <div className="border-2 border-dashed border-[#4E654E] rounded-2xl p-8 text-center bg-[#EBF1EA] space-y-2">
                <Loader2 className="w-8 h-8 text-[#4E654E] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[#344834]">
                  Processing and optimizing photo from device...
                </p>
                <p className="text-[11px] text-[#637C63]">
                  Preserving colors and clarity for your catalog
                </p>
              </div>
            )}

            {/* Photo Preview when an image is selected */}
            {!isOptimizingPhoto && product.photoUrl && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#D5C7B6] bg-[#EDE4D5] shadow-xs group">
                  <img
                    src={product.photoUrl}
                    alt={product.name || 'Handmade piece preview'}
                    className="w-full h-60 sm:h-64 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium transition-all backdrop-blur-xs flex items-center gap-1.5 shadow"
                      title="Zoom photo preview"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Zoom Preview</span>
                    </button>
                  </div>
                </div>

                {/* Metadata & Quality Details */}
                <div className="flex items-center justify-between text-[11px] text-[#786554] bg-white px-3 py-1.5 rounded-lg border border-[#E5DACD]">
                  <span className="truncate max-w-[210px] font-medium" title={photoMeta?.fileName || 'Uploaded Photo'}>
                    📷 {photoMeta?.fileName || 'Artisan Product Photo'}
                  </span>
                  <span className="font-semibold text-[#4E654E]">
                    {photoMeta?.fileSize || 'Attached'}
                  </span>
                </div>

                {/* Action buttons: Replace or Remove */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    id="btn-replace-photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-[#D5C7B6] hover:bg-[#F2ECE1] text-[#423023] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#4E654E]" />
                    <span>Replace Photo</span>
                  </button>

                  <button
                    type="button"
                    id="btn-remove-photo"
                    onClick={handleRemovePhoto}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dropzone when NO photo is attached */}
            {!isOptimizingPhoto && !product.photoUrl && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all ${
                  dragActive
                    ? 'border-[#4E654E] bg-[#EBF1EA]'
                    : 'border-[#D5C7B6] bg-white/70 hover:border-[#4E654E] hover:bg-[#F2ECE1]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#E7EFE6] text-[#4E654E] mx-auto flex items-center justify-center mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#423023] mb-1">
                  Attach Product Photo
                </h4>
                <p className="text-xs text-[#7F6E5F] mb-3.5 max-w-xs mx-auto leading-relaxed">
                  Choose a picture of your creation from your phone gallery, camera, or computer.
                </p>

                {/* Primary Button with exact text "Upload Product Photo" */}
                <button
                  type="button"
                  id="btn-upload-product-photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-[#4E654E] text-[#FAF7F2] hover:bg-[#3E523E] text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Product Photo</span>
                </button>

                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-[#8C7A6B]">
                  <span>📱 Phone Camera / Gallery</span>
                  <span>•</span>
                  <span>💻 Computer Files</span>
                </div>
              </div>
            )}

            {/* Direct Photo URL Input */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-[#6F5B4B] mb-1">
                Photo URL
              </label>
              <input
                type="url"
                id="input-photo-url"
                name="photo_url"
                data-testid="input-photo-url"
                placeholder="https://... (or choose photo above)"
                value={product.photoUrl || ''}
                onChange={(e) => handleInputChange('photoUrl', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023] text-xs focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
              />
            </div>

            {/* Quick Craft Reference Photos */}
            <div className="mt-3 pt-3 border-t border-[#E8DFD1]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#7E6D5D]">
                  Or choose a craft reference photo:
                </span>
                <span className="text-[10px] text-[#8B6544]">Real artisan items</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SAMPLE_PRODUCTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      handleInputChange('photoUrl', s.photoUrl);
                      setPhotoMeta({
                        fileName: `${s.name.split(' ')[0]} Reference`,
                        fileSize: 'Sample Craft HD',
                      });
                    }}
                    className={`relative rounded-lg overflow-hidden border h-11 hover:opacity-90 transition-all ${
                      product.photoUrl === s.photoUrl
                        ? 'border-[#4E654E] ring-2 ring-[#4E654E]'
                        : 'border-[#D5C7B6]'
                    }`}
                    title={`${s.name} (${s.category})`}
                  >
                    <img
                      src={s.photoUrl}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {product.photoUrl === s.photoUrl && (
                      <div className="absolute inset-0 bg-[#4E654E]/70 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Marketing Tone Selection */}
          <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 sm:p-5 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-2">
              Marketing Voice & Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cozy', label: 'Warm & Cozy', desc: 'Heartfelt, slow-living, studio vibes' },
                { id: 'luxury', label: 'Artisan Luxury', desc: 'Heirloom, bespoke, high craft' },
                { id: 'modern', label: 'Minimal Modern', desc: 'Clean, design-led, intentional' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    tone === t.id
                      ? 'bg-[#E7EFE6] border-[#4E654E] text-[#2F442F] ring-2 ring-[#4E654E]/20'
                      : 'bg-white border-[#D8CCBD] text-[#604D3F] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <span className="block text-xs font-bold">{t.label}</span>
                  <span className="block text-[10px] text-[#7C6A5A] mt-0.5 leading-tight">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Maker Instructions */}
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-[#735F4C] mb-1">
                Optional Maker's Note (Custom angle or upcoming market)
              </label>
              <input
                type="text"
                placeholder="e.g. Highlight that it makes a great gift or mention local weekend market"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023] text-xs focus:outline-none focus:ring-1 focus:ring-[#4E654E]"
              />
            </div>
          </div>

          {/* Action Buttons: Generate & Save */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              id="btn-generate-content"
              disabled={!isValid || isGenerating}
              onClick={onProceedToGenerate}
              className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all ${
                isValid && !isGenerating
                  ? 'bg-[#4E654E] text-[#FAF7F2] hover:bg-[#3E523E] hover:shadow-lg active:scale-[0.99]'
                  : 'bg-[#D1C6B8] text-[#867566] cursor-not-allowed'
              }`}
            >
              <Wand2 className="w-5 h-5 text-[#E7EFE6]" />
              <span>Generate AI Marketing Content</span>
            </button>

            {/* Dedicated Save/Sync to Supabase Button */}
            <button
              type="button"
              id="btn-save-sync"
              data-testid="btn-save-sync"
              disabled={!product.name.trim() || isSaving}
              onClick={handleDirectSave}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                product.name.trim() && !isSaving
                  ? 'bg-white border-[#4E654E]/40 text-[#2F442F] hover:bg-[#E7EFE6] shadow-xs active:scale-[0.99] ring-1 ring-[#4E654E]/20'
                  : 'bg-[#FAF7F2] border-[#E8DFD1] text-[#9E8B7A] cursor-not-allowed'
              }`}
              title="Save and synchronize product details directly with Supabase public.products"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#4E654E]" />
                  <span>Syncing to Supabase (public.products)...</span>
                </>
              ) : saveSuccessMessage ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800 font-bold">Saved & Synced to Supabase!</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-[#4E654E]" />
                  <span>Save/Sync to Supabase (public.products)</span>
                </>
              )}
            </button>

            {/* Hidden fallback button with legacy id to ensure backward compatibility */}
            <button
              type="button"
              id="btn-save-product-details"
              aria-hidden="true"
              tabIndex={-1}
              style={{ display: 'none' }}
              onClick={handleDirectSave}
            />

            {/* Error Message Display if Supabase Insert Fails */}
            {saveErrorMessage && (
              <div 
                id="supabase-error-banner"
                data-testid="supabase-error-message"
                className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-900">Supabase Insert Error</p>
                  <p className="font-mono text-[11px] text-red-700 break-words mt-0.5">
                    {saveErrorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveErrorMessage(null)}
                  className="text-red-400 hover:text-red-700 p-0.5"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Success Message Display when Supabase Insert Succeeds */}
            {saveSuccessMessage && (
              <div 
                id="supabase-success-banner"
                data-testid="supabase-success-message"
                className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2.5 animate-in fade-in"
                role="status"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800">{saveSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveSuccessMessage(null)}
                  className="text-emerald-500 hover:text-emerald-800 p-0.5"
                  aria-label="Dismiss message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!isValid && (
              <p className="text-[11px] text-center text-[#9E7B62] mt-1">
                * Please enter at least a Product Name and Product Details (or Materials) to generate AI copy.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for Photo Preview */}
      {showPhotoModal && product.photoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full bg-[#FAF7F2] rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD1]">
              <div>
                <h4 className="text-sm font-bold text-[#423023] truncate max-w-sm">
                  {product.name || 'Product Photo Preview'}
                </h4>
                <p className="text-[11px] text-[#7C6958]">
                  {photoMeta?.fileName || 'Attached Photo'} {photoMeta?.fileSize ? `(${photoMeta.fileSize})` : ''}
                </p>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 text-[#786554] hover:text-[#423023] hover:bg-[#EAE2D3] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto flex items-center justify-center bg-[#1F1813]/5 rounded-xl p-2 max-h-[70vh]">
              <img
                src={product.photoUrl}
                alt={product.name || 'Full preview'}
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false);
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D5C7B6] hover:bg-[#F2ECE1] text-xs font-semibold text-[#423023] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#4E654E]" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#4E654E] hover:bg-[#3E523E] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
