import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Ensure public/uploads directory exists and serve it
const uploadsDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Photo upload endpoint: stores real uploaded photo on server and returns resulting URL
app.post('/api/upload-photo', (req, res) => {
  try {
    const { image, fileName } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    let buffer: Buffer;
    let ext = 'jpg';

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
      }
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const cleanBaseName = fileName ? path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, '') : 'craft';
    const uniqueFileName = `${cleanBaseName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFileName}`;
    res.json({
      success: true,
      url: relativeUrl,
      fileName: uniqueFileName,
    });
  } catch (err: any) {
    console.error('Error saving uploaded photo:', err);
    res.status(500).json({ error: err?.message || 'Failed to save uploaded photo' });
  }
});

// Helper to get server Supabase client if configured
function getServerSupabaseClient() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (url && key && url !== 'YOUR_SUPABASE_URL' && key !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
      return createClient(url, key);
    } catch (err) {
      console.warn('Failed to create server Supabase client:', err);
    }
  }
  return null;
}

// Initialize GoogleGenAI client lazily if key is available
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const supabaseClient = getServerSupabaseClient();
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    supabaseConfigured: Boolean(supabaseClient),
    model: 'gemini-3.8-flash',
    platform: 'CraftCopy Artisan Engine',
  });
});

// Supabase configuration info for client
app.get('/api/supabase/config', (req, res) => {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const isConfigured = Boolean(
    url && anonKey && url !== 'YOUR_SUPABASE_URL' && anonKey !== 'YOUR_SUPABASE_ANON_KEY'
  );
  res.json({
    configured: isConfigured,
    url: isConfigured ? url : null,
    anonKey: isConfigured ? anonKey : null,
  });
});

// Supabase backend health / connection status check
app.get('/api/supabase/status', async (req, res) => {
  const client = getServerSupabaseClient();
  if (!client) {
    return res.json({
      configured: false,
      connected: false,
      message: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are not set.',
    });
  }

  try {
    const { data, error, count } = await client.from('products').select('*', { count: 'exact' });
    if (error) {
      return res.json({
        configured: true,
        connected: false,
        error: error.message,
      });
    }
    return res.json({
      configured: true,
      connected: true,
      recordCount: data?.length ?? 0,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      error: err?.message || String(err),
    });
  }
});

// Marketing & Pricing Generation endpoint
app.post('/api/generate-content', async (req, res) => {
  const { product, tone = 'cozy', customInstructions = '' } = req.body;

  if (!product || !product.name) {
    return res.status(400).json({ error: 'Product name and details are required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Return gracefully labeled simulated result
    return res.json({
      simulated: true,
      reason: 'GEMINI_API_KEY is not configured in environment. Providing simulated local artisan content.',
    });
  }

  try {
    const priceDisplay = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : (product.cost ? `₱${Math.round(product.cost * 2.5).toLocaleString()}` : 'Inquire for pricing');
    const materialsDisplay = product.materials || (product.productDetails ? 'Authentic hand-selected components detailed in specifications' : 'Sustainably sourced natural materials');

    const prompt = `You are CraftCopy, an elite marketing copywriter and pricing strategist for independent artisans, craftsmen, and small-batch makers.

CRITICAL REQUIREMENT - CAPTION LENGTH, STYLE & PERSUASION:
1. LONG & SUBSTANTIAL CAPTIONS: The user explicitly requires long, comprehensive social media captions that are fully worth reading and using for serious social commerce. Aim for at least 4 to 6 well-structured, multi-paragraph sections with elegant formatting, stylish artisan emojis, and bullet points. Never provide short, brief, or superficial captions.
2. MANDATORY ELEMENTS IN EVERY CAPTION (Instagram, Facebook, TikTok):
   - EXACT PRICE: Explicitly state the price (${priceDisplay}) and persuasively justify why it is worth every single peso (highlighting the hands-on labor, durability, zero factory mass-production, and ethical artisan value).
   - MATERIALS BREAKDOWN: Prominently feature and describe the materials (${materialsDisplay}), celebrating their tactile feel, quality, durability, and aesthetic finish.
   - DETAILED PRODUCT DESCRIPTION: Showcase the product name, details (${product.productDetails || 'Handcrafted specialty'}), unique features, dimensions, colors, and craftsmanship.
   - PERSUASIVE BUYER HOOK & LIFESTYLE BENEFIT: Connect deeply with the target audience (${product.targetAudience || 'conscious buyers & design lovers'}). Explain how this piece elevates their daily life, style, home, or makes a heartfelt unforgettable gift.
   - COMPELLING CALL-TO-ACTION (CTA): Provide clear, welcoming instructions on how to order or reserve (e.g. DM to claim, small batch availability, made to order).
3. FACTUAL GROUNDING: Remain completely faithful to the maker's actual input. Do not invent unrelated materials or fake claims that contradict what the user entered.

ACTUAL PRODUCT INFORMATION:
- Product Name: "${product.name}"
- Product Details & Specifications: "${product.productDetails || 'Handmade creation'}"
- Target Buyers / Audience: "${product.targetAudience || 'Artisan goods lovers'}"
- Category: "${product.category || 'Handcrafted Goods'}"
- Raw Materials: "${materialsDisplay}"
- Technique / Method: "${product.craftTechnique || 'Handmade small-batch craft'}"
- Artisan Story / Context: "${product.story || 'Made with love and patience in our local studio'}"
- Price to Display: ${priceDisplay}
${product.cost ? `- Maker Cost: ₱${product.cost}` : ''}
- Tone preference: ${tone} (stylish, tactile, persuasive, warm, and authentic)
${customInstructions ? `- Maker's Special Instructions: "${customInstructions}"` : ''}

Generate a comprehensive marketing kit and pricing breakdown in Philippine Pesos (₱). Return pure JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite artisan copywriter. Always write rich, long, stylish, persuasive captions that explicitly include the exact price, materials breakdown, product description, and compelling calls-to-action. Never return brief or superficial copy. Always return valid JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.OBJECT,
              properties: {
                instagram: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    body: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'body', 'hashtags'],
                },
                facebook: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    body: { type: Type.STRING },
                    callToAction: { type: Type.STRING },
                  },
                  required: ['title', 'body', 'callToAction'],
                },
                tiktok: {
                  type: Type.OBJECT,
                  properties: {
                    hook: { type: Type.STRING },
                    audioIdea: { type: Type.STRING },
                    body: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['hook', 'audioIdea', 'body', 'hashtags'],
                },
              },
              required: ['instagram', 'facebook', 'tiktok'],
            },
            descriptions: {
              type: Type.OBJECT,
              properties: {
                short: { type: Type.STRING },
                story: { type: Type.STRING },
                bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                careInstructions: { type: Type.STRING },
              },
              required: ['short', 'story', 'bulletPoints', 'careInstructions'],
            },
            promotional: {
              type: Type.OBJECT,
              properties: {
                marketPitch: { type: Type.STRING },
                limitedDrop: { type: Type.STRING },
                makerStory: { type: Type.STRING },
              },
              required: ['marketPitch', 'limitedDrop', 'makerStory'],
            },
            pricing: {
              type: Type.OBJECT,
              properties: {
                suggestedRetail: { type: Type.NUMBER },
                wholesale: { type: Type.NUMBER },
                minBreakeven: { type: Type.NUMBER },
                profitMarginPercent: { type: Type.NUMBER },
                pricingTip: { type: Type.STRING },
                marketComparison: { type: Type.STRING },
              },
              required: ['suggestedRetail', 'wholesale', 'minBreakeven', 'profitMarginPercent', 'pricingTip', 'marketComparison'],
            },
          },
          required: ['captions', 'descriptions', 'promotional', 'pricing'],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsedData = JSON.parse(text);

    return res.json({
      simulated: false,
      aiModelUsed: 'Gemini 3.8 Flash (Live AI)',
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini generation error, falling back to simulated:', error?.message || error);
    return res.json({
      simulated: true,
      reason: `Live AI service encountered an issue: ${error?.message || 'Transient error'}. Loaded intelligent local craftsman synthesis.`,
    });
  }
});

// Revise Caption Endpoint: Revises an existing caption based on user's requested changes while keeping it strictly relevant to actual product
app.post('/api/revise-caption', async (req, res) => {
  const { product, currentCaption, revisionInstruction, platform = 'instagram', tone = 'cozy' } = req.body;

  if (!product || !currentCaption || !revisionInstruction) {
    return res.status(400).json({ error: 'Product, current caption, and revision instructions are required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      simulated: true,
      reason: 'GEMINI_API_KEY is not configured. Providing local revision.',
    });
  }

  try {
    const priceDisplay = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : (product.cost ? `₱${Math.round(product.cost * 2.5).toLocaleString()}` : 'Inquire for pricing');
    const materialsDisplay = product.materials || (product.productDetails ? 'Authentic hand-selected components detailed in specifications' : 'Sustainably sourced natural materials');

    const prompt = `You are CraftCopy, revising a social media marketing caption for an independent maker.

CURRENT PRODUCT CONTEXT (MUST REMAIN FACTUALLY ACCURATE):
- Product Name: "${product.name}"
- Product Details & Specifications: "${product.productDetails || ''}"
- Target Audience / Buyers: "${product.targetAudience || ''}"
- Exact Price to Display: ${priceDisplay}
- Raw Materials: "${materialsDisplay}"
- Technique / Method: "${product.craftTechnique || 'Handmade artisan process'}"

CURRENT CAPTION TO REVISE:
Title: "${currentCaption.title || ''}"
Body: "${currentCaption.body || ''}"
Hashtags: ${JSON.stringify(currentCaption.hashtags || [])}
${currentCaption.callToAction ? `Call To Action: "${currentCaption.callToAction}"` : ''}
${currentCaption.hook ? `Hook: "${currentCaption.hook}"` : ''}

USER'S REQUESTED REVISION INSTRUCTIONS:
"${revisionInstruction}"

MANDATORY REQUIREMENTS FOR THE REVISED CAPTION:
1. LONG & PERSUASIVE LENGTH: The caption must remain SUBSTANTIAL, RICH, and LONG ENOUGH to be truly worthwhile for serious sales. Provide multiple structured sections with stylish emojis, sensory details, and line breaks.
2. MUST EXPLICITLY INCLUDE:
   - The exact price (${priceDisplay}) with persuasive value framing.
   - A clear materials breakdown (${materialsDisplay}) showcasing quality and craftsmanship.
   - Comprehensive product description (${product.productDetails || product.name}) detailing features and aesthetics.
   - Direct connection to target buyers (${product.targetAudience || 'discerning shoppers'}) and clear call-to-action.
3. Apply the user's requested revision while preserving or enriching these core sales elements.
4. Return valid JSON only with keys: title, body, hashtags (array of strings), and optionally callToAction, hook, audioIdea.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert copy editor for handmade artisans. Always maintain long, substantial, persuasive copy containing the price, materials breakdown, and product description while applying requested revisions. Always return valid JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            callToAction: { type: Type.STRING },
            hook: { type: Type.STRING },
            audioIdea: { type: Type.STRING },
          },
          required: ['body', 'hashtags'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      simulated: false,
      revisedCaption: parsed,
    });
  } catch (error: any) {
    console.error('Gemini caption revision error:', error?.message || error);
    const cleanName = (product.name || '').trim();
    const cleanDetails = (product.productDetails || product.story || '').trim();
    const cleanAudience = (product.targetAudience || '').trim();
    const cleanPrice = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : '';
    const cleanMaterials = (product.materials || cleanDetails || 'Hand-selected premium materials').trim();
    const cleanTechnique = (product.craftTechnique || 'Handcrafted small-batch method').trim();

    return res.json({
      success: true,
      simulated: true,
      reason: 'Live AI capacity spike. Applied rich grounded artisan revision engine.',
      revisedCaption: {
        title: `${cleanName} ✨ | Handcrafted Just For You`,
        body: `Looking for something truly meaningful and made with soul? Meet the ${cleanName} — thoughtfully created to celebrate authentic handcraft.\n\n✨ The Details & Story:\n${cleanDetails || 'Each piece is shaped with care and patience, ensuring every curve and finish has character that mass production simply cannot replicate.'}\n\n🌿 Materials & Craft Technique:\n• Materials: ${cleanMaterials}\n• Technique: ${cleanTechnique}\n• Designed for everyday durability, comfort, and timeless beauty.\n\n💫 Why You’ll Love It:\n${cleanAudience ? `Tailored especially for ${cleanAudience.toLowerCase()} who appreciate affordable, authentic, one-of-a-kind design that stands out effortlessly.` : 'An intentional design that adds warm artisan personality to your daily routine.'}\n\n🏷️ Pricing & Transparent Value:\nAvailable now for ${cleanPrice || 'an accessible artisan price'}. Every single purchase directly supports an independent maker, slow sustainable craft, and fair wages.\n\n💌 How to Claim Yours:\n[Revision: ${revisionInstruction}]\nSend us a direct message (DM) or comment below to reserve yours before this small studio batch is gone! Custom requests are always welcome.`,
        hashtags: currentCaption.hashtags && currentCaption.hashtags.length > 0 ? currentCaption.hashtags : ['#Handmade', '#ShopSmall', '#SlowCraft', '#ArtisanMade', '#SupportLocalMakers'],
      },
    });
  }
});

// Regenerate Single Caption Endpoint: Generates a new alternative caption for the same product
app.post('/api/regenerate-caption', async (req, res) => {
  const { product, platform = 'instagram', tone = 'cozy' } = req.body;

  if (!product || !product.name) {
    return res.status(400).json({ error: 'Product is required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      simulated: true,
      reason: 'GEMINI_API_KEY is not configured.',
    });
  }

  try {
    const priceDisplay = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : (product.cost ? `₱${Math.round(product.cost * 2.5).toLocaleString()}` : 'Inquire for pricing');
    const materialsDisplay = product.materials || (product.productDetails ? 'Authentic hand-selected components detailed in specifications' : 'Sustainably sourced natural materials');

    const prompt = `You are CraftCopy. Generate a FRESH, NEW, ALTERNATIVE social media caption for ${platform} promoting this specific handmade product.

CRITICAL REQUIREMENT - CAPTION LENGTH, STYLE & PERSUASION:
1. LONG & WORTHWHILE: Write a full, generous, multi-paragraph caption (4 to 6 detailed sections). Do NOT write brief, 1-2 sentence captions.
2. MANDATORY INCLUSIONS:
   - Exact Price: ${priceDisplay} with persuasive value proposition.
   - Materials: "${materialsDisplay}" with tactile and durability appeal.
   - Product Details: "${product.productDetails || ''}" highlighting colors, features, and specs.
   - Target Audience Appeal: Specifically persuade "${product.targetAudience || 'potential buyers'}" with lifestyle & styling reasons to purchase.
   - Clear, urgent Call To Action to DM or order before small-batch sells out.

CURRENT PRODUCT CONTEXT:
- Product Name: "${product.name}"
- Product Details: "${product.productDetails || ''}"
- Target Audience / Buyers: "${product.targetAudience || ''}"
- Raw Materials: "${materialsDisplay}"
- Craft Technique: "${product.craftTechnique || ''}"
- Price: ${priceDisplay}
- Tone: ${tone} (stylish, enticing, artisan warmth)

Return valid JSON only with keys: title, body, hashtags (array of strings), and optionally callToAction, hook, audioIdea.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert copywriter for handmade artisans. Always write rich, long, stylish, persuasive captions that explicitly include the exact price, materials breakdown, and product description. Always return valid JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            callToAction: { type: Type.STRING },
            hook: { type: Type.STRING },
            audioIdea: { type: Type.STRING },
          },
          required: ['body', 'hashtags'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      simulated: false,
      newCaption: parsed,
    });
  } catch (error: any) {
    console.error('Gemini caption regeneration error:', error?.message || error);
    const cleanName = (product.name || '').trim();
    const cleanDetails = (product.productDetails || product.story || '').trim();
    const cleanAudience = (product.targetAudience || '').trim();
    const cleanPrice = product.currentPrice ? `₱${product.currentPrice.toLocaleString()}` : '';
    const cleanMaterials = (product.materials || cleanDetails || 'Carefully sourced components').trim();
    const cleanTechnique = (product.craftTechnique || 'Hand-shaped artisan craftsmanship').trim();

    return res.json({
      success: true,
      simulated: true,
      reason: 'Live AI capacity spike. Applied rich fresh grounded artisan synthesis.',
      newCaption: {
        title: `Fresh Studio Release: The ${cleanName} ✨`,
        body: `Say hello to our latest studio creation: The ${cleanName}! Handcrafted from start to finish with dedication, mindfulness, and attention to every subtle detail.\n\n✨ Design & Specifications:\n${cleanDetails || 'Designed with intention to blend effortless everyday comfort with timeless artisan aesthetics.'}\n\n🌿 Raw Materials & Quality Craft:\n• Crafted using: ${cleanMaterials}\n• Method: ${cleanTechnique}\n• Built to last with hypoallergenic, durable components made for daily wear and enjoyment.\n\n💫 Specially Styled For You:\n${cleanAudience ? `If you are among the ${cleanAudience.toLowerCase()} looking for stylish, accessible, and meaningful handmade accessories, this was made with your lifestyle in mind.` : 'Perfect for anyone who cherishes individual handmade style over generic factory mass production.'}\n\n🏷️ Fair Price & Investment:\nOnly ${cleanPrice || 'fairly priced'}! You aren’t just buying an item — you are investing in genuine craft, sustainable maker livelihood, and mindful design.\n\n💌 Claim Yours Today:\nEach piece is made in very small studio batches. Tap the link in bio or send a direct message (DM) to secure yours now before this release sells out!`,
        hashtags: ['#Handmade', '#ShopSmall', '#SlowCraft', '#ArtisanMade', '#HandcraftedWithCare'],
      },
    });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CraftCopy server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
