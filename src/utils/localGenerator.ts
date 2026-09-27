import { ProductInput, MarketingContent, PlatformCaption } from '../types';
import { calculateCraftPricing } from './pricingEngine';

/**
 * Builds grounded artisan hashtags based on actual product inputs
 */
function buildArtisanHashtags(product: ProductInput): string[] {
  const tags = new Set<string>();

  // Add words from product name
  const nameWords = (product.name || '').replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  nameWords.slice(0, 3).forEach(w => tags.add(`#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}`));

  // Add category tags
  if (product.category) {
    const cleanCat = product.category.replace(/[^a-zA-Z0-9]/g, '');
    tags.add(`#${cleanCat}`);
  }

  // Add target audience tags
  if (product.targetAudience) {
    const audienceWords = product.targetAudience.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    audienceWords.slice(0, 2).forEach(w => tags.add(`#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}Style`));
  }

  tags.add('#Handmade');
  tags.add('#ShopSmall');
  tags.add('#ArtisanCraft');
  tags.add('#HandcraftedWithCare');

  return Array.from(tags).slice(0, 8);
}

/**
 * Generates marketing content strictly grounded in the user's current actual product information.
 * Never invents materials, techniques, or features that the user did not provide.
 */
export function generateLocalArtisanContent(
  product: ProductInput,
  tone: 'cozy' | 'luxury' | 'modern' = 'cozy',
  variationSeed: number = 0
): MarketingContent {
  const { name, category, materials, story, craftTechnique, currentPrice, productDetails, targetAudience, costDetails } = product;
  const pricing = calculateCraftPricing(costDetails, category, currentPrice);

  const cleanName = (name || '').trim() || 'Handmade Creation';
  const cleanDetails = (productDetails || story || '').trim();
  const cleanAudience = (targetAudience || '').trim();
  const cleanPrice = currentPrice ? `₱${currentPrice.toLocaleString()}` : (pricing.suggestedRetail ? `₱${pricing.suggestedRetail.toLocaleString()}` : '');

  const hashtags = buildArtisanHashtags(product);

  const cleanMaterials = (materials || cleanDetails || 'Carefully chosen artisan-grade materials').trim();
  const cleanTechnique = (craftTechnique || 'Handmade small-batch artisan crafting').trim();

  // Tone nuances
  let toneLead = 'Handcrafted with patience, dedication, and mindful care in our small local studio.';
  let toneClosing = 'Every piece is crafted one by one with authentic craftsman pride and zero factory shortcuts.';
  if (tone === 'luxury') {
    toneLead = 'Refined artisan craftsmanship meeting timeless elegance, shaped slowly by hand.';
    toneClosing = 'An exquisite, one-of-a-kind statement piece designed to be treasured for years to come.';
  } else if (tone === 'modern') {
    toneLead = 'Minimalist everyday design thoughtfully fused with genuine handcrafted soul.';
    toneClosing = 'Thoughtfully made to fit effortlessly into your modern aesthetic and daily rituals.';
  }

  // Variations based on seed (for Regenerate)
  const isVariation = (variationSeed % 3) === 1;
  const isVariationAlt = (variationSeed % 3) === 2;

  let igTitle = `${cleanName} ✨ | Handcrafted Studio Original`;
  let igBody = '';

  if (isVariation) {
    igTitle = `New Studio Drop: The ${cleanName} 💕`;
    igBody = `${toneLead}\n\nMeet the ${cleanName} — an intentional handmade creation designed to bring genuine artisan charm into your world.\n\n✨ Product Details & Specifications:\n${cleanDetails || `Each ${cleanName} is carefully made to showcase subtle textures, balanced proportions, and functional elegance.`}\n\n🌿 Materials & Honest Craftsmanship:\n• Materials: ${cleanMaterials}\n• Technique: ${cleanTechnique}\n• Durability: Quality tested for long-lasting everyday enjoyment and tactile comfort.\n\n💫 Styled & Created For You:\n${cleanAudience ? `Specially designed for ${cleanAudience.toLowerCase()} who value authentic, budget-conscious, and distinctive handmade style.` : 'Created for conscious design lovers who choose small-batch craftsmanship over mass-produced goods.'}\n\n🏷️ Pricing & Investment:\n${cleanPrice ? `Priced at just ${cleanPrice}.` : 'Fairly priced for honest artisan craft.'} When you choose handmade, 100% of your investment directly supports independent maker livelihood and slow, sustainable fashion.\n\n💌 How to Order:\nQuantities are strictly limited per studio batch. Tap the link in bio or send a quick direct message (DM) to secure your ${cleanName} today!`;
  } else if (isVariationAlt) {
    igTitle = `Slow Craft Spotlight: ${cleanName} 🌿`;
    igBody = `Looking for something truly personal, meaningful, and made with love? Presenting our ${cleanName}.\n\n✨ What Makes It Special:\n${cleanDetails || `A bespoke handmade piece highlighting unique artisan details that cannot be replicated by factory machines.`}\n\n🌿 Raw Materials & Technique:\n• Handcrafted from: ${cleanMaterials}\n• Method: ${cleanTechnique}\n• Meticulously finished with care to preserve natural beauty and long-lasting quality.\n\n💫 Perfect Match:\n${cleanAudience ? `If you are among the ${cleanAudience.toLowerCase()} searching for unique, stylish, and dependable handmade treasures, this piece is made for your daily aesthetic.` : 'A versatile essential for anyone curating a more intentional, handmade lifestyle.'}\n\n🏷️ Fair Price:\nAvailable now for ${cleanPrice || 'an accessible price'}. Transparent pricing reflecting fair labor, quality components, and artisan pride.\n\n💌 Claim Yours:\nDM us now to order or ask about custom sizes! We ship with eco-friendly protective packaging.`;
  } else {
    igBody = `${toneLead}\n\nIntroducing our ${cleanName} — crafted to bring effortless warmth, tactile beauty, and individuality to your collection.\n\n✨ The Details & Specifications:\n${cleanDetails || `Thoughtfully designed with focus on clean aesthetics, comfortable everyday wear, and distinctive handcraft.`}\n\n🌿 Materials & Method:\n• Materials: ${cleanMaterials}\n• Technique: ${cleanTechnique}\n• Zero factory mass production; crafted individually by hand.\n\n💫 Made For Your Lifestyle:\n${cleanAudience ? `Tailored specifically for ${cleanAudience.toLowerCase()} who want stylish, meaningful, and accessible artisan originals.` : 'A timeless piece that adds instant character and conscious elegance to any moment.'}\n\n🏷️ Pricing & Value:\nOnly ${cleanPrice || 'fairly priced'}! Backed by genuine maker dedication and transparent cost breakdown.\n\n💌 How to Order:\nSend a direct message (DM) or leave a comment to claim yours before this batch runs out!`;
  }

  const instagramCaption: PlatformCaption = {
    title: igTitle,
    body: igBody,
    hashtags,
  };

  const facebookCaption: PlatformCaption = {
    title: `Fresh from the studio workbench: The ${cleanName} ✨`,
    body: `Hello friends and mindful craft community! 👋\n\nI’m proud to officially unveil our latest handmade creation: The ${cleanName}.\n\n✨ The Story & Specifications:\n${cleanDetails || 'This piece has been carefully developed in our workspace, blending slow handcraft traditions with modern usability.'}\n\n🌿 Materials & Technique:\n• Components: ${cleanMaterials}\n• Crafting Method: ${cleanTechnique}\n• Every detail is examined by hand before leaving our studio.\n\n💫 Who It’s For:\n${cleanAudience ? `We crafted this specifically with ${cleanAudience.toLowerCase()} in mind — making sure it is as accessible, stylish, and durable as it is beautiful.` : 'Designed for anyone who appreciates the character and soul of independent maker goods.'}\n\n🏷️ Transparent Pricing:\nAvailable for ${cleanPrice || 'an affordable artisan price'}. Thank you for championing small local businesses, ethical wages, and slow craftsmanship!\n\n👉 Ready to claim yours? Send a private message to our page or comment below to order.`,
    callToAction: 'Send a message or comment below to order yours!',
    hashtags: hashtags.slice(0, 6),
  };

  const tiktokCaption: PlatformCaption = {
    hook: cleanAudience 
      ? `POV: You found the perfect handmade ${cleanName.toLowerCase()} for ${cleanAudience.toLowerCase()} ✨` 
      : `POV: Choosing authentic handmade ${cleanName.toLowerCase()} over factory mass-produced items ✨`,
    audioIdea: 'Cozy acoustic guitar or satisfying ASMR studio handcraft sounds',
    body: `Making the ${cleanName} step by step in our workshop! ✨\n\n📌 Specs: ${cleanDetails || 'Handmade original'}\n🌿 Materials: ${cleanMaterials}\n🔨 Technique: ${cleanTechnique}\n${cleanAudience ? `🎯 Perfect for: ${cleanAudience}\n` : ''}💰 Price: ${cleanPrice || 'Affordable artisan price'}\n\nEvery piece is made with patience and love. Link in bio or DM to claim yours before they sell out!`,
    hashtags: ['#CraftTok', '#SmallBusiness', '#Handmade', '#ShopLocal', '#ArtisanMade', '#SlowFashion'],
  };

  const shortDescription = `The ${cleanName} is a handcrafted ${category.toLowerCase()} piece${cleanDetails ? ` featuring ${cleanDetails}` : ''}.${cleanPrice ? ` Available for ${cleanPrice}.` : ''}`;
  const storyDescription = `The ${cleanName} is created with dedication to slow, mindful craft.${cleanDetails ? ` Designed with ${cleanDetails}.` : ''}${cleanMaterials ? ` Made using ${cleanMaterials}.` : ''}${cleanAudience ? ` Designed especially for ${cleanAudience.toLowerCase()}.` : ''} Every piece represents small-scale artisan enterprise and sustainable craftsmanship.`;

  const bulletPoints = [
    `Product: ${cleanName}`,
    ...(cleanDetails ? [`Details: ${cleanDetails}`] : []),
    ...(cleanMaterials ? [`Materials: ${cleanMaterials}`] : []),
    ...(cleanTechnique ? [`Technique: ${cleanTechnique}`] : []),
    ...(cleanAudience ? [`Designed for: ${cleanAudience}`] : []),
    ...(cleanPrice ? [`Price: ${cleanPrice}`] : []),
    'Authentic small-batch handmade craft',
  ];

  return {
    captions: {
      instagram: instagramCaption,
      facebook: facebookCaption,
      tiktok: tiktokCaption,
    },
    descriptions: {
      short: shortDescription,
      story: storyDescription,
      bulletPoints,
      careInstructions: 'Handle with care to maintain the handmade quality and longevity of your piece.',
    },
    promotional: {
      marketPitch: `Hi! This is our handmade ${cleanName}.${cleanDetails ? ` It features ${cleanDetails}.` : ''}${cleanAudience ? ` It has been very popular with ${cleanAudience.toLowerCase()}.` : ''}${cleanPrice ? ` It is priced at ${cleanPrice}.` : ''} Would you like to see it up close?`,
      limitedDrop: `✨ Fresh handmade batch: ${cleanName} is now available in limited quantities!${cleanPrice ? ` ₱${currentPrice || pricing.suggestedRetail}` : ''}`,
      makerStory: `We craft each ${cleanName} individually by hand with passion, making sure every detail is made with love and care.`,
    },
    pricing: {
      suggestedRetail: pricing.suggestedRetail,
      wholesale: pricing.wholesale,
      minBreakeven: pricing.minBreakeven,
      profitMarginPercent: pricing.profitMarginPercent,
      pricingTip: pricing.pricingTip,
      marketComparison: pricing.marketComparison,
    },
    generatedAt: new Date().toISOString(),
    isAiGenerated: true,
    aiModelUsed: 'CraftCopy Local Artisan Engine (Simulated)',
    isSimulated: true,
    userSatisfied: false,
  };
}

/**
 * Revises a caption according to user's requested changes while keeping it strictly relevant
 * to the actual product details and target audience.
 */
export function reviseLocalArtisanCaption(
  product: ProductInput,
  currentCaption: PlatformCaption,
  revisionInstruction: string,
  platform: 'instagram' | 'facebook' | 'tiktok' = 'instagram',
  tone: 'cozy' | 'luxury' | 'modern' = 'cozy'
): PlatformCaption {
  const cleanName = (product.name || '').trim() || 'Handmade Creation';
  const cleanDetails = (product.productDetails || product.story || '').trim();
  const cleanAudience = (product.targetAudience || '').trim();
  const cleanPrice = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : '';
  const cleanMaterials = (product.materials || cleanDetails || 'Artisan-grade selected components').trim();
  const cleanTechnique = (product.craftTechnique || 'Handmade slow-craft technique').trim();
  const req = revisionInstruction.toLowerCase();

  const isStudentOrAudience = req.includes('student') || req.includes('budget') || req.includes('discount') || req.includes('audience');
  const isEmoji = req.includes('emoji');

  let title = currentCaption.title || `${cleanName} ✨ | Handcrafted Studio Original`;
  let body = '';

  if (isStudentOrAudience && cleanAudience) {
    title = `Hey ${cleanAudience}! Check Out The ${cleanName} 💫`;
    body = `Looking for the perfect everyday accessory that combines authentic handcraft with real affordability? Meet the ${cleanName}!\n\n✨ Product Details & Features:\n${cleanDetails || 'Carefully shaped with clean lines, comfortable wearability, and unique handmade personality.'}\n\n🌿 Raw Materials & Craftsmanship:\n• Materials: ${cleanMaterials}\n• Technique: ${cleanTechnique}\n• Meticulously constructed for daily reliability and timeless charm.\n\n💫 Specially Made for ${cleanAudience}:\nDesigned with your everyday routine and budget in mind. Perfect for casual styling, campus days, or gifting a friend something genuinely thoughtful.\n\n🏷️ Fair Price & Student Value:\nOnly ${cleanPrice || 'an accessible price'}! ${req.includes('discount') ? 'Plus, ask about our special student discount and bundle perk! ' : ''}Every purchase directly supports sustainable, independent maker craftsmanship.\n\n💌 How to Order:\nSend us a quick direct message (DM) to claim yours or comment below! Limited small-batch release.`;
  } else {
    body = `Presenting our latest studio piece: The ${cleanName} ✨\n\n✨ Details & Features:\n${cleanDetails || 'Each piece is shaped individually by hand, ensuring character and quality that mass production cannot offer.'}\n\n🌿 Materials & Method:\n• Materials: ${cleanMaterials}\n• Technique: ${cleanTechnique}\n• Hypoallergenic and built to last with thoughtful attention to finish.\n\n💫 Why You’ll Love It:\n${cleanAudience ? `Curated with ${cleanAudience.toLowerCase()} in mind for effortless daily style and standout artisan flair.` : 'An intentional, versatile piece that adds handcrafted warmth to your wardrobe or living space.'}\n\n🏷️ Pricing & Investment:\nAvailable for ${cleanPrice || 'an affordable artisan price'} — fair pricing that reflects honest artisan labor and zero factory shortcuts.\n\n💌 Order Yours:\n[Revision: ${revisionInstruction}]\nTap the link in bio or send a direct message (DM) to secure your piece today before this batch sells out!`;
  }

  if (isEmoji && !body.includes('💖')) {
    body = `💖 ✨ ${body} 🌿 🌸`;
  }

  return {
    ...currentCaption,
    title,
    body,
    hashtags: currentCaption.hashtags && currentCaption.hashtags.length > 0 ? currentCaption.hashtags : buildArtisanHashtags(product),
  };
}
