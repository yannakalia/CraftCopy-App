import { ProductInput, MarketingContent, PlatformCaption } from '../types';
import { generateLocalArtisanContent, reviseLocalArtisanCaption } from '../utils/localGenerator';

export interface GenerationResponse {
  content: MarketingContent;
  isSimulated: boolean;
  modelUsed: string;
  note?: string;
}

export async function checkServerHealth(): Promise<{ geminiConfigured: boolean; supabaseConfigured: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { geminiConfigured: false, supabaseConfigured: false };
    const data = await res.json();
    return { 
      geminiConfigured: Boolean(data.geminiConfigured),
      supabaseConfigured: Boolean(data.supabaseConfigured),
    };
  } catch {
    return { geminiConfigured: false, supabaseConfigured: false };
  }
}

export async function generateMarketingContent(
  product: ProductInput,
  tone: 'cozy' | 'luxury' | 'modern' = 'cozy',
  customInstructions: string = '',
  forceSimulated: boolean = false
): Promise<GenerationResponse> {
  if (forceSimulated) {
    const localContent = generateLocalArtisanContent(product, tone);
    return {
      content: localContent,
      isSimulated: true,
      modelUsed: 'Local Artisan Intelligence (Simulated Offline Mode)',
      note: 'Rendered via built-in artisan intelligence engine.',
    };
  }

  try {
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product,
        tone,
        customInstructions,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.simulated) {
        const localContent = generateLocalArtisanContent(product, tone);
        return {
          content: localContent,
          isSimulated: true,
          modelUsed: 'Local Artisan Intelligence (Simulated)',
          note: data.reason || 'Gemini API key is not active. Using simulated local engine.',
        };
      } else if (data.data) {
        const d = data.data;
        const marketingResult: MarketingContent = {
          captions: {
            instagram: d.captions?.instagram || {
              title: `${product.name} ✨`,
              body: d.descriptions?.story || '',
              hashtags: ['#Handmade', '#ShopSmall', '#ArtisanCraft', '#SDG9'],
            },
            facebook: d.captions?.facebook || {
              title: `Handcrafted in our studio: ${product.name}`,
              body: d.descriptions?.short || '',
              callToAction: 'Message us to order yours!',
              hashtags: ['#Handcrafted', '#ArtisanMade'],
            },
            tiktok: d.captions?.tiktok || {
              hook: 'POV: Slow craftsmanship vs mass production 🌿',
              audioIdea: 'Cozy workshop ASMR acoustic sounds',
              body: `Making the ${product.name} from raw materials.`,
              hashtags: ['#CraftTok', '#SmallBusinessCheck'],
            },
          },
          descriptions: {
            short: d.descriptions?.short || `${product.name} made with ${product.materials}.`,
            story: d.descriptions?.story || product.story,
            bulletPoints: d.descriptions?.bulletPoints || [
              `Handmade with ${product.materials}`,
              `Traditional technique: ${product.craftTechnique}`,
              'Small-batch artisan quality',
            ],
            careInstructions: d.descriptions?.careInstructions || 'Gently clean with a damp cloth.',
          },
          promotional: {
            marketPitch: d.promotional?.marketPitch || `Welcome! Here is our handmade ${product.name}.`,
            limitedDrop: d.promotional?.limitedDrop || `New batch of ${product.name} available now in limited quantities!`,
            makerStory: d.promotional?.makerStory || product.story,
          },
          pricing: {
            suggestedRetail: Number(d.pricing?.suggestedRetail) || 35,
            wholesale: Number(d.pricing?.wholesale) || 18,
            minBreakeven: Number(d.pricing?.minBreakeven) || 12,
            profitMarginPercent: Number(d.pricing?.profitMarginPercent) || 30,
            pricingTip: d.pricing?.pricingTip || 'Priced to sustain independent craftsmanship.',
            marketComparison: d.pricing?.marketComparison || 'Competitive with boutique artisan goods.',
          },
          generatedAt: new Date().toISOString(),
          isAiGenerated: true,
          aiModelUsed: data.aiModelUsed || 'Gemini 3.8 Flash (Live AI)',
          isSimulated: false,
          userSatisfied: false,
        };

        return {
          content: marketingResult,
          isSimulated: false,
          modelUsed: data.aiModelUsed || 'Gemini 3.8 Flash',
        };
      }
    }
  } catch (err) {
    console.warn('Network call failed, falling back to local generator:', err);
  }

  // Graceful fallback
  const fallback = generateLocalArtisanContent(product, tone);
  return {
    content: fallback,
    isSimulated: true,
    modelUsed: 'Local Artisan Intelligence (Simulated Fallback)',
    note: 'Server request could not complete. Instant local simulation applied.',
  };
}

export async function reviseMarketingCaption(
  product: ProductInput,
  currentCaption: PlatformCaption,
  revisionInstruction: string,
  platform: 'instagram' | 'facebook' | 'tiktok' = 'instagram',
  tone: 'cozy' | 'luxury' | 'modern' = 'cozy'
): Promise<{ success: boolean; revisedCaption: PlatformCaption; isSimulated: boolean }> {
  try {
    const res = await fetch('/api/revise-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product,
        currentCaption,
        revisionInstruction,
        platform,
        tone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.revisedCaption) {
        return {
          success: true,
          revisedCaption: {
            ...currentCaption,
            ...data.revisedCaption,
            hashtags: data.revisedCaption.hashtags || currentCaption.hashtags,
          },
          isSimulated: Boolean(data.simulated),
        };
      }
    }
  } catch (err) {
    console.warn('Network call for caption revision failed, using local revision:', err);
  }

  // Local fallback revision strictly grounded in the product data
  const localRevised = reviseLocalArtisanCaption(product, currentCaption, revisionInstruction, platform, tone);
  return {
    success: true,
    revisedCaption: localRevised,
    isSimulated: true,
  };
}

export async function regenerateMarketingCaption(
  product: ProductInput,
  platform: 'instagram' | 'facebook' | 'tiktok' = 'instagram',
  tone: 'cozy' | 'luxury' | 'modern' = 'cozy',
  seed: number = Date.now()
): Promise<{ success: boolean; newCaption: PlatformCaption; isSimulated: boolean }> {
  try {
    const res = await fetch('/api/regenerate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product,
        platform,
        tone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.newCaption) {
        return {
          success: true,
          newCaption: data.newCaption,
          isSimulated: Boolean(data.simulated),
        };
      }
    }
  } catch (err) {
    console.warn('Network call for caption regeneration failed, using local generator:', err);
  }

  // Local alternative caption strictly grounded in current product data
  const localContent = generateLocalArtisanContent(product, tone, seed);
  const newCap = localContent.captions[platform] || localContent.captions.instagram;
  return {
    success: true,
    newCaption: newCap,
    isSimulated: true,
  };
}
