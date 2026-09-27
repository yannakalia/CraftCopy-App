import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Stepper, WorkflowStep } from './components/Stepper';
import { ProductForm } from './components/ProductForm';
import { ReviewEditWorkshop } from './components/ReviewEditWorkshop';
import { ReadyToPostHub } from './components/ReadyToPostHub';
import { CatalogView } from './components/CatalogView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SdgInfoModal } from './components/SdgInfoModal';
import { ProductIdeasView } from './components/ProductIdeasView';
import { BasicInfoModal } from './components/BasicInfoModal';
import { ProductInput, MarketingContent, SavedCraft, AnalyticsMetrics, ArtisanProfile, ProductIdea } from './types';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { checkServerHealth, generateMarketingContent, reviseMarketingCaption, regenerateMarketingCaption } from './services/api';
import { calculateCraftPricing } from './utils/pricingEngine';
import { fetchSupabaseProducts, insertProductToSupabase, saveCaptionToSupabase, isSupabaseConfigured } from './services/supabase';
import { Sparkles, Hammer, Compass, Heart, Loader2, Database, CheckCircle2, AlertCircle, X } from 'lucide-react';

const INITIAL_ARTISAN_PROFILE: ArtisanProfile = {
  makerName: 'Elena Santos',
  studioName: 'Tala Artisan Workshop',
  craftSpecialty: 'Handmade Leather Goods, Footwear, Crochet & Apparel',
  location: 'Marikina & Laguna, Philippines',
  bio: 'Independent maker dedicated to slow, sustainable artisanal craftsmanship. From vegetable-tanned leather goods to hand-crocheted pieces and heritage apparel, each creation honors mindful handwork and local livelihood.',
  instagramHandle: '@tala.artisan',
  websiteUrl: 'talaartisan.ph',
  defaultHourlyRate: 180,
  defaultOverheadRate: 50,
  standardMarginPercent: 30,
};

const INITIAL_PRODUCT: ProductInput = {
  id: '',
  name: '',
  ownerName: '',
  productDetails: '',
  category: 'Handcrafted Goods',
  currentPrice: null,
  cost: null,
  materials: '',
  story: '',
  craftTechnique: '',
  photoUrl: '',
  caption: '',
  productDescription: '',
  productIdea: '',
  costDetails: {
    materialsCost: 0,
    laborHours: 0,
    hourlyRate: 180,
    overheadCost: 0,
    targetMarginPercent: 30,
  },
};

const INITIAL_METRICS: AnalyticsMetrics = {
  totalGenerated: 12,
  totalApproved: 10,
  totalCopies: 28,
  estimatedRevenueBoost: 2450,
  hoursSaved: 18.5,
  platformShares: {
    instagram: 14,
    facebook: 8,
    tiktok: 4,
    marketplaces: 2,
  },
  recentActivities: [
    {
      id: 'act-1',
      timestamp: 'Just now',
      action: 'Instagram caption copied',
      productName: 'Heritage Veg-Tan Bifold Leather Wallet',
      platform: 'instagram',
    },
    {
      id: 'act-2',
      timestamp: '15m ago',
      action: 'Pricing approved (+₱350 margin)',
      productName: 'Marikina Handcrafted Leather Derby Shoes',
    },
    {
      id: 'act-3',
      timestamp: '1h ago',
      action: 'TikTok CraftTok script generated',
      productName: 'Boho Sunburst Hand-Crocheted Tote Bag',
      platform: 'tiktok',
    },
  ],
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'ideas' | 'catalog' | 'analytics' | 'sdg'>('create');
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('form');
  const [product, setProduct] = useState<ProductInput>(() => ({
    ...INITIAL_PRODUCT,
  }));
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);
  const [tone, setTone] = useState<'cozy' | 'luxury' | 'modern'>('cozy');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [forceSimulated, setForceSimulated] = useState(false);
  const [isSdgModalOpen, setIsSdgModalOpen] = useState(false);
  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [generationTipIndex, setGenerationTipIndex] = useState(0);

  // Supabase backend connection status
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    isConnected: boolean;
    recordCount: number;
    message?: string;
  }>({
    isConfigured: isSupabaseConfigured(),
    isConnected: false,
    recordCount: 0,
  });
  // Track IDs that belong to existing public.products records so we preserve and protect them
  const [supabaseLoadedIds, setSupabaseLoadedIds] = useState<Set<string>>(new Set());
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Auto-clear sync toast after 4s
  useEffect(() => {
    if (syncToast) {
      const timer = setTimeout(() => setSyncToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  // Load artisan profile from local storage
  const [artisanProfile, setArtisanProfile] = useState<ArtisanProfile>(() => {
    try {
      const saved = localStorage.getItem('craftcopy_artisan_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse artisan profile:', e);
    }
    return INITIAL_ARTISAN_PROFILE;
  });

  // Load saved crafts from local storage
  const [savedCrafts, setSavedCrafts] = useState<SavedCraft[]>(() => {
    try {
      const saved = localStorage.getItem('craftcopy_saved_crafts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved crafts:', e);
    }
    return [];
  });

  // Load analytics metrics from local storage
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(() => {
    try {
      const saved = localStorage.getItem('craftcopy_metrics');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse metrics:', e);
    }
    return INITIAL_METRICS;
  });

  // Save to localStorage whenever profile, crafts or metrics change
  useEffect(() => {
    try {
      localStorage.setItem('craftcopy_artisan_profile', JSON.stringify(artisanProfile));
    } catch (e) {
      console.warn('Failed to persist artisan profile:', e);
    }
  }, [artisanProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('craftcopy_saved_crafts', JSON.stringify(savedCrafts));
    } catch (e) {
      console.warn('Failed to persist crafts:', e);
    }
  }, [savedCrafts]);

  useEffect(() => {
    try {
      localStorage.setItem('craftcopy_metrics', JSON.stringify(metrics));
    } catch (e) {
      console.warn('Failed to persist metrics:', e);
    }
  }, [metrics]);

  // Handle saving artisan profile
  const handleSaveProfile = (updatedProfile: ArtisanProfile, applyToProduct = false) => {
    setArtisanProfile(updatedProfile);
    if (applyToProduct) {
      setProduct((prev) => ({
        ...prev,
        costDetails: {
          ...prev.costDetails,
          hourlyRate: updatedProfile.defaultHourlyRate || prev.costDetails.hourlyRate,
          overheadCost: updatedProfile.defaultOverheadRate || prev.costDetails.overheadCost,
          targetMarginPercent: updatedProfile.standardMarginPercent || prev.costDetails.targetMarginPercent,
        },
      }));
    }
  };

  // Handle selecting a product idea from ideas catalog
  const handleSelectProductIdea = (idea: ProductIdea) => {
    setProduct({
      id: `craft-${Date.now()}`,
      name: idea.name,
      category: idea.category,
      currentPrice: idea.suggestedRetail,
      materials: idea.materials,
      story: `${idea.starterStory}\n\nHandcrafted by ${artisanProfile.makerName || 'our maker'} at ${artisanProfile.studioName || 'our studio'}.`,
      craftTechnique: idea.craftTechnique,
      photoUrl: idea.photoUrl,
      costDetails: {
        materialsCost: idea.materialsCost,
        laborHours: idea.estimatedHours,
        hourlyRate: artisanProfile.defaultHourlyRate || 22,
        overheadCost: artisanProfile.defaultOverheadRate || 3.5,
        targetMarginPercent: idea.profitMarginPercent || 30,
      },
    });

    // Reset previous generated content and navigate to the creation form
    setMarketingContent(null);
    setWorkflowStep('form');
    setCurrentTab('create');
  };

  // Fetch and sync products from Supabase public.products table
  const syncWithSupabase = async (showToast = false) => {
    try {
      const res = await fetchSupabaseProducts();
      if (res.success && res.products.length > 0) {
        setSupabaseStatus({
          isConfigured: true,
          isConnected: true,
          recordCount: res.rawCount,
          message: `Connected to public.products (${res.rawCount} records loaded)`,
        });

        // Mark loaded IDs as existing database records to protect them from deletion
        const idSet = new Set(res.products.map((p) => p.id));
        setSupabaseLoadedIds(idSet);

        // Populate Studio Catalog with existing Supabase records without modifying or deleting them
        setSavedCrafts((prev) => {
          const existingIds = new Set(prev.map((c) => c.id || c.product.id));
          const newCrafts: SavedCraft[] = [];

          for (const sp of res.products) {
            if (!existingIds.has(sp.id)) {
              const livePricing = calculateCraftPricing(sp.costDetails, sp.category, sp.currentPrice);
              const craftItem: SavedCraft = {
                id: sp.id,
                product: sp,
                content: {
                  captions: {
                    instagram: {
                      title: `${sp.name} ✨`,
                      body: sp.story || `Thoughtfully handcrafted with ${sp.materials}. Available in small artisan batches.`,
                      hashtags: ['#Handcrafted', '#ArtisanMade', '#ShopSmall', '#SlowCraft', '#SDG9'],
                    },
                    facebook: {
                      title: `Handcrafted in our studio: ${sp.name}`,
                      body: sp.story || `Individually crafted with ${sp.materials}.`,
                      callToAction: 'Message us to order yours!',
                      hashtags: ['#Handmade', '#ArtisanGoods'],
                    },
                    tiktok: {
                      hook: `POV: Handcrafting the ${sp.name} 🌿`,
                      audioIdea: 'Cozy workshop ASMR sounds',
                      body: `Making the ${sp.name} from raw materials.`,
                      hashtags: ['#CraftTok', '#SmallBusinessCheck'],
                    },
                  },
                  descriptions: {
                    short: `${sp.name} handmade with ${sp.materials}.`,
                    story: sp.story,
                    bulletPoints: [
                      `Handmade with ${sp.materials}`,
                      `Technique: ${sp.craftTechnique}`,
                      'Small-batch artisan quality',
                    ],
                    careInstructions: 'Handle with care. Wipe gently with a soft dry cloth.',
                  },
                  promotional: {
                    marketPitch: `Welcome! Here is our handmade ${sp.name}, crafted with ${sp.materials}.`,
                    limitedDrop: `New studio drop: Limited batch of ${sp.name} available now!`,
                    makerStory: sp.story,
                  },
                  pricing: {
                    suggestedRetail: livePricing.suggestedRetail,
                    wholesale: livePricing.wholesale,
                    minBreakeven: livePricing.minBreakeven,
                    profitMarginPercent: livePricing.profitMarginPercent,
                    pricingTip: livePricing.pricingTip,
                    marketComparison: 'Competitive with boutique artisan goods.',
                  },
                  generatedAt: new Date().toISOString(),
                  isAiGenerated: false,
                  aiModelUsed: 'Supabase Cloud Database',
                  isSimulated: true,
                  userSatisfied: true,
                },
                status: 'approved',
                createdAt: 'Supabase Record',
                copyCount: 0,
              };
              newCrafts.push(craftItem);
            }
          }

          if (newCrafts.length > 0) {
            return [...newCrafts, ...prev];
          }
          return prev;
        });

        if (showToast) {
          setSyncToast({
            type: 'success',
            message: `Synchronized with Supabase: ${res.rawCount} products loaded.`,
          });
        }
      } else if (res.isConfigured) {
        setSupabaseStatus({
          isConfigured: true,
          isConnected: res.success,
          recordCount: res.rawCount,
          message: res.error || (res.success ? 'Connected to public.products' : 'Connection issue'),
        });
        if (showToast && res.error) {
          setSyncToast({
            type: 'error',
            message: `Supabase Error: ${res.error}`,
          });
        }
      } else {
        setSupabaseStatus({
          isConfigured: false,
          isConnected: false,
          recordCount: 0,
          message: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ready to connect',
        });
      }
    } catch (err: any) {
      console.warn('Supabase sync error:', err);
      if (showToast) {
        setSyncToast({
          type: 'error',
          message: `Supabase Error: ${err?.message || 'Sync failed'}`,
        });
      }
    }
  };

  // Check health and initialize Supabase connection on mount
  useEffect(() => {
    let isMounted = true;

    // Check Gemini & server health
    checkServerHealth().then((health) => {
      if (isMounted) {
        setGeminiConfigured(health.geminiConfigured);
      }
    });

    // Check and restore Supabase connection for public.products
    syncWithSupabase(false);

    return () => {
      isMounted = false;
    };
  }, []);

  // Generation status rotation tips
  const generationTips = [
    'Honoring the raw character of your craft materials...',
    'Weaving an authentic, sensory artisan story for your buyers...',
    'Calculating fair living-wage pricing (Materials + Labor Hours + Studio Overhead)...',
    'Composing platform-optimized captions for Instagram, Facebook, and TikTok...',
    'Checking sustainable craft benchmarks (UN SDG 9)...',
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationTipIndex((prev) => (prev + 1) % generationTips.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Trigger Generation
  const handleProceedToGenerate = async (customTone?: 'cozy' | 'luxury' | 'modern', tweakPrompt?: string) => {
    setIsGenerating(true);
    setWorkflowStep('generating');

    const effectiveTone = customTone || tone;
    const effectivePrompt = tweakPrompt || customInstructions;

    try {
      const res = await generateMarketingContent(product, effectiveTone, effectivePrompt, forceSimulated);
      setMarketingContent(res.content);

      // Only populate the AI-specific fields: caption, product description, and product idea.
      // NEVER overwrite user's product name, owner name, product details, cost, price, or photo!
      const generatedCaption = res.content.captions.instagram
        ? `${res.content.captions.instagram.title ? `${res.content.captions.instagram.title}\n\n` : ''}${res.content.captions.instagram.body}${res.content.captions.instagram.hashtags ? `\n\n${res.content.captions.instagram.hashtags.join(' ')}` : ''}`
        : '';
      const generatedDesc = res.content.descriptions.story || res.content.descriptions.short || '';
      const generatedIdea = res.content.promotional.makerStory || res.content.promotional.marketPitch || '';

      setProduct((prev) => ({
        ...prev,
        caption: generatedCaption,
        productDescription: generatedDesc,
        productIdea: generatedIdea,
      }));

      // Update analytics for generated count
      setMetrics((prev) => ({
        ...prev,
        totalGenerated: prev.totalGenerated + 1,
        hoursSaved: Number((prev.hoursSaved + 0.5).toFixed(1)),
      }));

      // Transition to review workshop
      setWorkflowStep('review');
    } catch (err) {
      console.error('Failed generation:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // User Satisfaction: YES -> Approve & Save
  const handleApproveAndSave = async () => {
    if (!marketingContent) return;

    const approvedContent: MarketingContent = {
      ...marketingContent,
      userSatisfied: true,
    };
    setMarketingContent(approvedContent);

    // Save product to Supabase public.products using current form and reviewed AI values
    const approvedCaption = approvedContent.captions.instagram
      ? `${approvedContent.captions.instagram.title ? `${approvedContent.captions.instagram.title}\n\n` : ''}${approvedContent.captions.instagram.body}${approvedContent.captions.instagram.hashtags ? `\n\n${approvedContent.captions.instagram.hashtags.join(' ')}` : ''}`
      : (product.caption || '');
    const approvedDesc = approvedContent.descriptions.story || approvedContent.descriptions.short || (product.productDescription || '');
    const approvedIdea = approvedContent.promotional.makerStory || approvedContent.promotional.marketPitch || (product.productIdea || '');

    const productToSave: ProductInput = {
      ...product,
      name: product.name.trim(),
      ownerName: (product.ownerName || '').trim(),
      productDetails: (product.productDetails || product.story || '').trim(),
      cost: product.cost !== null && product.cost !== undefined && String(product.cost).trim() !== ''
        ? Number(product.cost)
        : (product.costDetails?.materialsCost ? Number(product.costDetails.materialsCost) : null),
      currentPrice: product.currentPrice !== null && product.currentPrice !== undefined && String(product.currentPrice).trim() !== ''
        ? Number(product.currentPrice)
        : null,
      photoUrl: (product.photoUrl || '').trim(),
      caption: approvedCaption,
      productDescription: approvedDesc,
      productIdea: approvedIdea,
    };

    let finalProduct = { ...productToSave };
    try {
      const res = await insertProductToSupabase(productToSave);
      if (res.success && res.product) {
        finalProduct = res.product;
        setSupabaseLoadedIds((prev) => new Set([...prev, finalProduct.id]));
        setSupabaseStatus((prev) => ({
          ...prev,
          isConnected: true,
          recordCount: prev.recordCount + 1,
          message: `Connected to public.products (${prev.recordCount + 1} records loaded)`,
        }));
        setSyncToast({
          type: 'success',
          message: `Product successfully saved to Supabase (public.products)!`,
        });
      } else if (res.error) {
        setSyncToast({
          type: 'error',
          message: `Supabase Error: ${res.error}`,
        });
      }
    } catch (err: any) {
      console.warn('Supabase save error on approve:', err);
      setSyncToast({
        type: 'error',
        message: `Supabase Error: ${err?.message || 'Failed to save product to Supabase'}`,
      });
    }

    // Create SavedCraft item
    const newCraft: SavedCraft = {
      id: finalProduct.id || `saved-${Date.now()}`,
      product: { ...finalProduct },
      content: approvedContent,
      status: 'approved',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      copyCount: 0,
    };

    // Add to savedCrafts
    setSavedCrafts((prev) => [newCraft, ...prev]);

    // Update real-time metrics
    const priceDiff = product.currentPrice
      ? Math.max(0, approvedContent.pricing.suggestedRetail - product.currentPrice)
      : 15;

    setMetrics((prev) => ({
      ...prev,
      totalApproved: prev.totalApproved + 1,
      estimatedRevenueBoost: prev.estimatedRevenueBoost + priceDiff,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          action: 'Approved marketing kit & saved',
          productName: product.name,
        },
        ...prev.recentActivities.slice(0, 7),
      ],
    }));

    // Transition to "Content Ready to Post"
    setWorkflowStep('ready');
  };

  // Track Copy Event from Ready to Post hub
  const handleCopyPlatform = (platform: 'instagram' | 'facebook' | 'tiktok' | 'marketplaces') => {
    setMetrics((prev) => ({
      ...prev,
      totalCopies: prev.totalCopies + 1,
      platformShares: {
        ...prev.platformShares,
        [platform]: prev.platformShares[platform] + 1,
      },
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          action: `Copied for ${platform}`,
          productName: product.name,
          platform,
        },
        ...prev.recentActivities.slice(0, 7),
      ],
    }));
  };

  // Revise active caption according to user instructions while maintaining strict product relevance
  const handleReviseCaption = async (
    instruction: string,
    platform: 'instagram' | 'facebook' | 'tiktok'
  ) => {
    if (!marketingContent) return;
    try {
      const currentCap = marketingContent.captions[platform];
      const res = await reviseMarketingCaption(product, currentCap, instruction, platform, tone);
      if (res.success && res.revisedCaption) {
        const updatedContent: MarketingContent = {
          ...marketingContent,
          captions: {
            ...marketingContent.captions,
            [platform]: res.revisedCaption,
          },
        };
        setMarketingContent(updatedContent);

        // Build latest caption text string
        const captionText = `${res.revisedCaption.title ? `${res.revisedCaption.title}\n\n` : ''}${res.revisedCaption.body}${res.revisedCaption.hashtags ? `\n\n${res.revisedCaption.hashtags.join(' ')}` : ''}`;

        setProduct((prev) => ({
          ...prev,
          caption: captionText,
        }));

        // After user edits or revises caption, save the latest version to "caption" field in Supabase
        const saveRes = await saveCaptionToSupabase(product, captionText);
        if (saveRes.success && saveRes.product) {
          setProduct(saveRes.product);
          setSyncToast({
            type: 'success',
            message: `Revised caption saved to Supabase (caption field)!`,
          });
        }
      }
    } catch (err: any) {
      console.error('Caption revision error:', err);
    }
  };

  // Regenerate fresh single caption variation using the SAME current product data
  const handleRegenerateCaption = async (
    platform: 'instagram' | 'facebook' | 'tiktok'
  ) => {
    if (!marketingContent) return;
    try {
      const res = await regenerateMarketingCaption(product, platform, tone, Date.now());
      if (res.success && res.newCaption) {
        const updatedContent: MarketingContent = {
          ...marketingContent,
          captions: {
            ...marketingContent.captions,
            [platform]: res.newCaption,
          },
        };
        setMarketingContent(updatedContent);

        const captionText = `${res.newCaption.title ? `${res.newCaption.title}\n\n` : ''}${res.newCaption.body}${res.newCaption.hashtags ? `\n\n${res.newCaption.hashtags.join(' ')}` : ''}`;

        setProduct((prev) => ({
          ...prev,
          caption: captionText,
        }));

        // Save latest version to Supabase
        const saveRes = await saveCaptionToSupabase(product, captionText);
        if (saveRes.success && saveRes.product) {
          setProduct(saveRes.product);
          setSyncToast({
            type: 'success',
            message: `Regenerated caption saved to Supabase!`,
          });
        }
      }
    } catch (err: any) {
      console.error('Caption regeneration error:', err);
    }
  };

  // Save current caption text directly to Supabase
  const handleSaveCaptionToSupabase = async (captionText: string): Promise<{ success: boolean; error?: string }> => {
    setProduct((prev) => ({ ...prev, caption: captionText }));
    try {
      const saveRes = await saveCaptionToSupabase(product, captionText);
      if (saveRes.success && saveRes.product) {
        setProduct(saveRes.product);
        setSyncToast({
          type: 'success',
          message: 'Latest caption saved to Supabase (caption field)!',
        });
        return { success: true };
      } else {
        const err = saveRes.error || 'Failed to save caption to Supabase';
        setSyncToast({
          type: 'error',
          message: `Supabase Error: ${err}`,
        });
        return { success: false, error: err };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error saving caption' };
    }
  };

  // Start fresh product
  const handleStartNewProduct = () => {
    setProduct({
      ...INITIAL_PRODUCT,
      id: `craft-${Date.now()}`,
    });
    setMarketingContent(null);
    setWorkflowStep('form');
    setCurrentTab('create');
  };

  // Direct save product with photo to catalog and Supabase public.products
  const handleDirectSaveProduct = async (
    prodToSave: ProductInput
  ): Promise<{ success: boolean; error?: string; product?: ProductInput }> => {
    try {
      const res = await insertProductToSupabase(prodToSave);
      if (res.success && res.product) {
        const finalProd = res.product;
        setSupabaseLoadedIds((prev) => new Set([...prev, finalProd.id]));
        setSupabaseStatus((prev) => ({
          ...prev,
          isConnected: true,
          recordCount: prev.recordCount + 1,
          message: `Connected to public.products (${prev.recordCount + 1} records loaded)`,
        }));
        setSyncToast({
          type: 'success',
          message: `Product successfully saved & inserted into Supabase (public.products)!`,
        });

        const livePricing = calculateCraftPricing(
          finalProd.costDetails,
          finalProd.category,
          finalProd.currentPrice
        );

        const initialContent: MarketingContent = marketingContent || {
          captions: {
            instagram: {
              title: `${finalProd.name} ✨`,
              body: finalProd.story || `Thoughtfully handcrafted with ${finalProd.materials}. Available in limited artisan batches.`,
              hashtags: ['#Handcrafted', '#ArtisanMade', '#ShopSmall', '#SlowCraft', '#SDG9'],
            },
            facebook: {
              title: `From our studio: ${finalProd.name}`,
              body: finalProd.story || `Every piece is individually handcrafted using ${finalProd.craftTechnique || 'traditional craft methods'}.`,
              callToAction: 'Send us a message to reserve yours or request bespoke options!',
              hashtags: ['#Handmade', '#ArtisanGoods', '#SupportSmallMakers'],
            },
            tiktok: {
              hook: `POV: Handcrafting the ${finalProd.name} 🌿`,
              audioIdea: 'Cozy workshop ASMR sounds',
              body: `Behind the scenes making of the ${finalProd.name}.`,
              hashtags: ['#CraftTok', '#SmallBusinessCheck', '#ArtisanCraft'],
            },
          },
          descriptions: {
            short: `${finalProd.name} handmade with ${finalProd.materials}.`,
            story: finalProd.story || `Handcrafted with care by ${artisanProfile.makerName || 'our artisan'} at ${artisanProfile.studioName || 'our workshop'}.`,
            bulletPoints: [
              `Materials: ${finalProd.materials}`,
              `Technique: ${finalProd.craftTechnique || 'Handmade craftsmanship'}`,
              'Small-batch artisan quality',
            ],
            careInstructions: 'Handle with care. Wipe gently with a soft dry cloth.',
          },
          promotional: {
            marketPitch: `Hi! Welcome to our studio. This is our ${finalProd.name}, handcrafted from ${finalProd.materials}.`,
            limitedDrop: `New studio drop: Limited small-batch release of ${finalProd.name} available now!`,
            makerStory: finalProd.story || `Created with dedication by ${artisanProfile.makerName || 'our maker'}.`,
          },
          pricing: {
            suggestedRetail: livePricing.suggestedRetail,
            wholesale: livePricing.wholesale,
            minBreakeven: livePricing.minBreakeven,
            profitMarginPercent: livePricing.profitMarginPercent,
            pricingTip: livePricing.pricingTip,
            marketComparison: 'Priced competitively with independent artisan boutique goods.',
          },
          generatedAt: new Date().toISOString(),
          isAiGenerated: false,
          aiModelUsed: 'Supabase Cloud Database',
          isSimulated: true,
          userSatisfied: true,
        };

        const newCraft: SavedCraft = {
          id: finalProd.id,
          product: { ...finalProd },
          content: initialContent,
          status: 'approved',
          createdAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          copyCount: 0,
        };

        setSavedCrafts((prev) => {
          const idx = prev.findIndex((c) => c.product.id === finalProd.id || c.id === finalProd.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = newCraft;
            return updated;
          }
          return [newCraft, ...prev];
        });

        setProduct(finalProd);

        setMetrics((prev) => ({
          ...prev,
          totalApproved: prev.totalApproved + 1,
          recentActivities: [
            {
              id: `act-${Date.now()}`,
              timestamp: 'Just now',
              action: 'Saved & inserted into Supabase public.products',
              productName: finalProd.name,
            },
            ...prev.recentActivities.slice(0, 7),
          ],
        }));

        return { success: true, product: finalProd };
      } else {
        const errMsg = res.error || 'Failed to insert product into Supabase public.products.';
        console.error('Supabase INSERT failed:', errMsg);
        setSyncToast({
          type: 'error',
          message: `Supabase Error: ${errMsg}`,
        });
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Unexpected error while inserting to Supabase';
      console.error('Direct save to Supabase error:', err);
      setSyncToast({
        type: 'error',
        message: `Supabase Error: ${errMsg}`,
      });
      return { success: false, error: errMsg };
    }
  };

  // Open saved craft from catalog into ready view
  const handleSelectSavedCraft = (craft: SavedCraft) => {
    setProduct(craft.product);
    setMarketingContent(craft.content);
    setWorkflowStep('ready');
    setCurrentTab('create');
  };

  // Edit saved craft back into the Product Details Form
  const handleEditSavedCraftInForm = (craft: SavedCraft) => {
    setProduct({ ...craft.product });
    setMarketingContent(craft.content);
    setWorkflowStep('form');
    setCurrentTab('create');
  };

  // Delete saved craft
  const handleDeleteCraft = (id: string) => {
    // Safety protection: Do not delete or modify existing Supabase product records
    if (supabaseLoadedIds.has(id)) {
      setSyncToast({
        type: 'warning',
        message: 'Database Protection: Existing Supabase project records cannot be deleted.',
      });
      return;
    }
    setSavedCrafts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#423023] flex flex-col font-sans selection:bg-[#E2D5C3]">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedCount={savedCrafts.length}
        geminiConfigured={geminiConfigured}
        forceSimulated={forceSimulated}
        setForceSimulated={setForceSimulated}
        onOpenSdg={() => setIsSdgModalOpen(true)}
        onOpenBasicInfo={() => setIsBasicInfoModalOpen(true)}
        makerName={artisanProfile.makerName || artisanProfile.studioName}
        supabaseStatus={supabaseStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'create' && (
          <div>
            {/* Step-by-Step Workflow Tracker */}
            <Stepper
              currentStep={workflowStep}
              onStepClick={(step) => {
                if (step === 'form') setWorkflowStep('form');
                else if (step === 'review' && marketingContent) setWorkflowStep('review');
                else if (step === 'ready' && marketingContent?.userSatisfied) setWorkflowStep('ready');
              }}
              canNavigateToReview={!!marketingContent}
              canNavigateToReady={!!marketingContent?.userSatisfied}
            />

            {/* Workflow Step 1: Product Form */}
            {workflowStep === 'form' && (
              <ProductForm
                product={product}
                setProduct={setProduct}
                tone={tone}
                setTone={setTone}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
                onProceedToGenerate={() => handleProceedToGenerate()}
                isGenerating={isGenerating}
                artisanProfile={artisanProfile}
                onOpenBasicInfo={() => setIsBasicInfoModalOpen(true)}
                onOpenProductIdeas={() => setCurrentTab('ideas')}
                onSaveProduct={handleDirectSaveProduct}
              />
            )}

            {/* Workflow Step 2: Generating State */}
            {workflowStep === 'generating' && (
              <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#E7EFE6] text-[#4E654E] mx-auto flex items-center justify-center animate-bounce shadow-sm">
                  <Hammer className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-artisan text-[#423023]">
                    Crafting Your Marketing Kit...
                  </h3>
                  <p className="text-xs sm:text-sm text-[#735F4C] mt-1">
                    Analyzing materials, craftsmanship techniques, and fair pricing
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#D5C7B6] max-w-md mx-auto shadow-xs">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#4E654E]">
                    <Sparkles className="w-4 h-4 animate-spin text-[#C59B3C]" />
                    <span>{generationTips[generationTipIndex]}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-[#EFE7DA] overflow-hidden">
                    <div className="h-full bg-[#4E654E] animate-pulse w-3/4 rounded-full" />
                  </div>
                </div>

                <p className="text-[11px] text-[#8E7C6B]">
                  {geminiConfigured && !forceSimulated
                    ? '⚡ Powered by Google Gemini 3.8 Flash'
                    : '🌿 Powered by CraftCopy Local Artisan Intelligence'}
                </p>
              </div>
            )}

            {/* Workflow Step 3: Review & Edit Workshop */}
            {workflowStep === 'review' && marketingContent && (
              <ReviewEditWorkshop
                product={product}
                setProduct={setProduct}
                content={marketingContent}
                setContent={setMarketingContent}
                onApproveAndSave={handleApproveAndSave}
                onRegenerate={(newTone, tweak) => handleProceedToGenerate(newTone, tweak)}
                onReviseCaption={handleReviseCaption}
                onRegenerateCaption={handleRegenerateCaption}
                onSaveCaptionToSupabase={handleSaveCaptionToSupabase}
                onBackToForm={() => setWorkflowStep('form')}
                isRegenerating={isGenerating}
              />
            )}

            {/* Workflow Step 4: Ready to Post Hub */}
            {workflowStep === 'ready' && marketingContent && (
              <ReadyToPostHub
                product={product}
                content={marketingContent}
                onCopyPlatform={handleCopyPlatform}
                onNewProduct={handleStartNewProduct}
                onGoToCatalog={() => setCurrentTab('catalog')}
                onEditAgain={() => setWorkflowStep('review')}
              />
            )}
          </div>
        )}

        {/* Tab 2: Product Ideas & What to Sell */}
        {currentTab === 'ideas' && (
          <ProductIdeasView
            onSelectIdea={handleSelectProductIdea}
            onOpenBasicInfo={() => setIsBasicInfoModalOpen(true)}
          />
        )}

        {/* Tab 3: Saved Crafts Catalog */}
        {currentTab === 'catalog' && (
          <CatalogView
            savedCrafts={savedCrafts}
            onSelectCraft={handleSelectSavedCraft}
            onDeleteCraft={handleDeleteCraft}
            onCopyContent={(craft, platform) => handleCopyPlatform(platform)}
            onNewProduct={handleStartNewProduct}
            onBrowseIdeas={() => setCurrentTab('ideas')}
            onEditCraftInForm={handleEditSavedCraftInForm}
            supabaseLoadedIds={supabaseLoadedIds}
            onSyncSupabase={() => syncWithSupabase(true)}
          />
        )}

        {/* Tab 4: Analytics Dashboard */}
        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            metrics={metrics}
            savedCrafts={savedCrafts}
            onOpenSdg={() => setIsSdgModalOpen(true)}
          />
        )}
      </main>

      {/* Supabase & Activity Notification Toast */}
      {syncToast && (
        <div 
          className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md shadow-xl rounded-2xl p-4 border flex items-start gap-3 bg-white text-[#423023] border-[#E8DFD1]"
          role="alert"
        >
          {syncToast.type === 'success' && (
            <div className="w-8 h-8 rounded-full bg-[#E2EBE2] text-[#2F442F] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#3E523E]" />
            </div>
          )}
          {syncToast.type === 'error' && (
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          )}
          {syncToast.type === 'info' && (
            <div className="w-8 h-8 rounded-full bg-[#EAE2D3] text-[#6E5038] flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-[#4E654E]" />
            </div>
          )}
          {syncToast.type === 'warning' && (
            <div className="w-8 h-8 rounded-full bg-[#FFF3D6] text-[#7A5A1B] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-[#C59B3C]" />
            </div>
          )}
          <div className="flex-1 pr-1 text-xs">
            <p className="font-bold text-[#423023]">
              {syncToast.type === 'success' ? 'Supabase Sync Succeeded' : syncToast.type === 'error' ? 'Supabase Sync Error' : syncToast.type === 'warning' ? 'Record Protected' : 'Notice'}
            </p>
            <p className="text-[#6A5847] mt-0.5">{syncToast.message}</p>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-[#998777] hover:text-[#423023] p-1 rounded-lg hover:bg-[#F3ECE0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cozy Footer */}
      <footer className="border-t border-[#E8DFD1] bg-[#F4EFE6] py-6 px-4 text-xs text-[#7A6755] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-artisan font-bold text-[#423023]">CraftCopy</span>
            <span>•</span>
            <span>Handmade Marketing & Pricing for Independent Makers</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSdgModalOpen(true)}
              className="text-[#4E654E] hover:underline font-semibold"
            >
              Supporting UN SDG 9
            </button>
            <span>•</span>
            <span>Transparent Artisan AI</span>
          </div>
        </div>
      </footer>

      {/* UN SDG 9 Informational Modal */}
      <SdgInfoModal
        isOpen={isSdgModalOpen}
        onClose={() => setIsSdgModalOpen(false)}
      />

      {/* Artisan Basic Information Modal */}
      <BasicInfoModal
        isOpen={isBasicInfoModalOpen}
        onClose={() => setIsBasicInfoModalOpen(false)}
        profile={artisanProfile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
