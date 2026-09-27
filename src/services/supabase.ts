import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductInput } from '../types';

/**
 * Helper to safely extract VITE_SUPABASE_URL from any available runtime environment
 */
function getEnvUrl(): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) {
      return (import.meta as any).env.VITE_SUPABASE_URL;
    }
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      if ((window as any).VITE_SUPABASE_URL) return (window as any).VITE_SUPABASE_URL;
      if ((window as any).__ENV__?.VITE_SUPABASE_URL) return (window as any).__ENV__.VITE_SUPABASE_URL;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
      if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
    }
  } catch {}
  return '';
}

/**
 * Helper to safely extract VITE_SUPABASE_ANON_KEY from any available runtime environment
 */
function getEnvAnonKey(): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) {
      return (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    }
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      if ((window as any).VITE_SUPABASE_ANON_KEY) return (window as any).VITE_SUPABASE_ANON_KEY;
      if ((window as any).__ENV__?.VITE_SUPABASE_ANON_KEY) return (window as any).__ENV__.VITE_SUPABASE_ANON_KEY;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
      if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
    }
  } catch {}
  return '';
}

let cachedClient: SupabaseClient | null = null;
let detectedColumns: string[] | null = null;
let sampleRow: Record<string, any> | null = null;
let sampleRowIdType: 'number' | 'uuid' | 'string' | null = null;

/**
 * Check if a string is a standard UUID format
 */
export function isUuid(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Initializes or returns the Supabase client using VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = getEnvUrl().trim();
  const key = getEnvAnonKey().trim();

  if (url && key && url !== 'YOUR_SUPABASE_URL' && key !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return cachedClient;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
    }
  }

  return null;
}

/**
 * Dynamically configure or update the client
 */
export function configureSupabase(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    cachedClient = createClient(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Error configuring dynamic Supabase client:', err);
    return null;
  }
}

/**
 * Check if Supabase env vars are configured
 */
export function isSupabaseConfigured(): boolean {
  if (cachedClient) return true;
  const url = getEnvUrl().trim();
  const key = getEnvAnonKey().trim();
  return Boolean(
    url && 
    key && 
    url !== 'YOUR_SUPABASE_URL' && 
    key !== 'YOUR_SUPABASE_ANON_KEY'
  );
}

export function getDetectedColumns(): string[] | null {
  return detectedColumns;
}

export function getSampleRow(): Record<string, any> | null {
  return sampleRow;
}

/**
 * Map a raw database record from public.products into CraftCopy's ProductInput
 */
export function mapRowToProduct(row: any): ProductInput {
  const costVal = row.cost ?? 
    row.cost_details?.materialsCost ??
    row.costDetails?.materialsCost ??
    row.materials_cost ??
    row.materialsCost ??
    null;
  const cost = costVal !== undefined && costVal !== null ? Number(costVal) : null;

  const priceVal = row.price ?? row.current_price ?? row.currentPrice;
  const currentPrice = priceVal !== undefined && priceVal !== null ? Number(priceVal) : null;

  const name = row.product_name || row.name || row.title || 'Handcrafted Creation';
  const ownerName = row.owner_name || row.ownerName || '';
  const productDetails = row.product_details || row.productDetails || row.story || row.description || '';
  const photoUrl = row.photo_url || row.photoUrl || row.image_url || row.imageUrl || row.image || '';

  return {
    id: String(row.id || `craft-${Date.now()}`),
    name,
    ownerName,
    productDetails,
    category: row.category || row.product_category || 'Handcrafted Goods',
    currentPrice,
    cost,
    materials: row.materials || row.material || '',
    story: productDetails,
    craftTechnique: row.craft_technique || row.craftTechnique || row.technique || '',
    photoUrl,
    caption: row.caption || '',
    productDescription: row.product_description || '',
    productIdea: row.product_idea || '',
    costDetails: {
      materialsCost: cost ?? 0,
      laborHours: 0,
      hourlyRate: 180,
      overheadCost: 0,
      targetMarginPercent: 30,
    },
  };
}

/**
 * Fetch all existing products from public.products table.
 * IMPORTANT: Does NOT delete or modify any existing product records.
 */
export async function fetchSupabaseProducts(): Promise<{
  success: boolean;
  products: ProductInput[];
  rawCount: number;
  error?: string;
  isConfigured: boolean;
}> {
  // If not configured in client env, attempt server config check first
  let client = getSupabaseClient();
  if (!client) {
    try {
      const res = await fetch('/api/supabase/config');
      if (res.ok) {
        const config = await res.json();
        if (config.configured && config.url && config.anonKey) {
          client = configureSupabase(config.url, config.anonKey);
        }
      }
    } catch {
      // ignore network errors
    }
  }

  if (!client) {
    return {
      success: false,
      products: [],
      rawCount: 0,
      isConfigured: false,
      error: 'Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set.',
    };
  }

  try {
    const { data, error } = await client.from('products').select('*');

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return {
        success: false,
        products: [],
        rawCount: 0,
        error: error.message,
        isConfigured: true,
      };
    }

    if (Array.isArray(data)) {
      if (data.length > 0) {
        // Record column names and sample row to ensure accurate schema mapping for new inserts
        detectedColumns = Object.keys(data[0]);
        sampleRow = data[0];
        const sampleId = data[0].id;
        if (typeof sampleId === 'number') {
          sampleRowIdType = 'number';
        } else if (typeof sampleId === 'string' && isUuid(sampleId)) {
          sampleRowIdType = 'uuid';
        } else {
          sampleRowIdType = 'string';
        }
      }

      const mapped = data.map(mapRowToProduct);
      return {
        success: true,
        products: mapped,
        rawCount: data.length,
        isConfigured: true,
      };
    }

    return {
      success: true,
      products: [],
      rawCount: 0,
      isConfigured: true,
    };
  } catch (err: any) {
    console.error('Failed to query Supabase products:', err);
    return {
      success: false,
      products: [],
      rawCount: 0,
      error: err?.message || 'Failed to connect to Supabase',
      isConfigured: true,
    };
  }
}

/**
 * Builds payload matching the exact columns of public.products table
 * DATABASE COLUMNS:
 * - id
 * - product_name
 * - owner_name
 * - product_details
 * - photo_url
 * - cost
 * - price
 * - caption
 * - product_description
 * - product_idea
 * - created_at
 */
export function buildInsertPayload(
  product: ProductInput, 
  cols?: string[] | null,
  sample?: Record<string, any> | null
): Record<string, any> {
  const payload: Record<string, any> = {};

  // 1. product_name = current product name input
  const enteredName = (product.name || (product as any).product_name || (product as any).title || '').trim();
  payload.product_name = enteredName;

  // 2. owner_name = current owner name input
  const enteredOwner = (product.ownerName || (product as any).owner_name || '').trim();
  payload.owner_name = enteredOwner;

  // 3. product_details = current product details input
  const enteredDetails = (
    product.productDetails ||
    (product as any).product_details ||
    product.story ||
    (product.materials ? `Materials: ${product.materials}${product.craftTechnique ? ` | Technique: ${product.craftTechnique}` : ''}` : '') ||
    ''
  ).trim();
  payload.product_details = enteredDetails;

  // 4. photo_url = URL of the user's uploaded photo
  const enteredPhoto = (product.photoUrl || (product as any).photo_url || (product as any).image_url || '').trim();
  payload.photo_url = enteredPhoto;

  // 5. cost = current cost input
  let rawCost: number | null = null;
  if (product.cost !== null && product.cost !== undefined && String(product.cost).trim() !== '') {
    rawCost = Number(product.cost);
  } else if ((product as any).costDetails?.materialsCost !== undefined && (product as any).costDetails?.materialsCost !== null && (product as any).costDetails?.materialsCost !== 0) {
    rawCost = Number((product as any).costDetails.materialsCost);
  }
  if (rawCost !== null && isNaN(rawCost)) rawCost = null;
  payload.cost = rawCost;

  // 6. price = current price input
  let rawPrice: number | null = null;
  if (product.currentPrice !== null && product.currentPrice !== undefined && String(product.currentPrice).trim() !== '') {
    rawPrice = Number(product.currentPrice);
  } else if ((product as any).price !== null && (product as any).price !== undefined && String((product as any).price).trim() !== '') {
    rawPrice = Number((product as any).price);
  }
  if (rawPrice !== null && isNaN(rawPrice)) rawPrice = null;
  payload.price = rawPrice;

  // 7. caption = current AI-generated or user-edited caption
  payload.caption = (product.caption || (product as any).caption || '').trim() || null;

  // 8. product_description = current AI-generated or user-edited product description
  payload.product_description = (product.productDescription || (product as any).product_description || '').trim() || null;

  // 9. product_idea = current AI-generated product idea
  payload.product_idea = (product.productIdea || (product as any).product_idea || '').trim() || null;

  // 10. created_at = current timestamp
  payload.created_at = new Date().toISOString();

  // CRITICAL: NEVER send an id for new products!
  // public.products.id has default gen_random_uuid(), sending custom/sample IDs causes duplicate key errors.
  delete payload.id;

  return payload;
}

/**
 * Inserts a newly created product into public.products table.
 * IMPORTANT:
 * - Collects the current product form values.
 * - Sends them using an INSERT to "public.products".
 * - Waits for the Supabase response.
 * - Shows success message ONLY if the INSERT succeeds.
 * - Returns the actual Supabase error if it fails.
 * - Does NOT create a new table, alter schema, or delete existing records.
 */
export async function insertProductToSupabase(product: ProductInput): Promise<{
  success: boolean;
  product?: ProductInput;
  insertedId?: string;
  error?: string;
  isConfigured: boolean;
}> {
  let client = getSupabaseClient();
  if (!client) {
    // Try to obtain via server config
    try {
      const res = await fetch('/api/supabase/config');
      if (res.ok) {
        const config = await res.json();
        if (config.configured && config.url && config.anonKey) {
          client = configureSupabase(config.url, config.anonKey);
        }
      }
    } catch {
      // ignore network errors
    }
  }

  if (!client) {
    return {
      success: false,
      isConfigured: false,
      error: 'Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set.',
    };
  }

  try {
    // If detectedColumns is not yet available, probe 1 row to get exact schema
    if (!detectedColumns || detectedColumns.length === 0) {
      try {
        const { data: sampleData, error: sampleErr } = await client.from('products').select('*').limit(1);
        if (sampleData && sampleData.length > 0) {
          detectedColumns = Object.keys(sampleData[0]);
          sampleRow = sampleData[0];
          const sampleId = sampleData[0].id;
          if (typeof sampleId === 'number') {
            sampleRowIdType = 'number';
          } else if (typeof sampleId === 'string' && isUuid(sampleId)) {
            sampleRowIdType = 'uuid';
          } else {
            sampleRowIdType = 'string';
          }
        } else if (sampleErr) {
          console.warn('Probe public.products schema returned error:', sampleErr.message);
        }
      } catch (probeErr) {
        console.warn('Probe error while inspecting public.products:', probeErr);
      }
    }

    const payload = buildInsertPayload(product, detectedColumns, sampleRow);
    // CRITICAL: NEVER send an id for new products so Supabase generates UUID with gen_random_uuid()
    delete payload.id;

    let insertRes = await client.from('products').insert([payload]).select();

    if (insertRes.error) {
      console.warn('Initial insert into public.products failed:', insertRes.error.message);

      // Intelligent retry 1: If column does not exist, strip the offending column
      const colMismatch = insertRes.error.message.match(/column "([^"]+)" of relation "products" does not exist/i);
      if (colMismatch && colMismatch[1]) {
        const badCol = colMismatch[1];
        delete payload[badCol];
        insertRes = await client.from('products').insert([payload]).select();
      }

      // Intelligent retry 2: If error relates to ID constraint or uuid syntax, retry without ID
      if (insertRes.error && /id|uuid/i.test(insertRes.error.message) && payload.id) {
        delete payload.id;
        insertRes = await client.from('products').insert([payload]).select();
      }

      // If still error, return actual Supabase error to display to user
      if (insertRes.error) {
        return {
          success: false,
          error: insertRes.error.message,
          isConfigured: true,
        };
      }
    }

    const insertedRow = insertRes.data && insertRes.data[0];
    const resultProduct = insertedRow ? mapRowToProduct(insertedRow) : { ...product };

    return {
      success: true,
      product: resultProduct,
      insertedId: String(resultProduct.id || insertedRow?.id || ''),
      isConfigured: true,
    };
  } catch (err: any) {
    console.error('Error inserting product into public.products:', err);
    return {
      success: false,
      error: err?.message || 'Failed to insert product into Supabase',
      isConfigured: true,
    };
  }
}

/**
 * Saves or updates the latest caption in Supabase public.products
 * After the user edits or revises the caption, saves the latest version to the "caption" field in Supabase.
 */
export async function saveCaptionToSupabase(
  product: ProductInput,
  caption: string
): Promise<{ success: boolean; product?: ProductInput; error?: string }> {
  const cleanCaption = caption.trim();
  const updatedProduct: ProductInput = {
    ...product,
    caption: cleanCaption,
  };

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
    };
  }

  // If this product was already saved and has a valid Supabase UUID, update the caption column
  if (product.id && isUuid(product.id)) {
    try {
      const { data, error } = await client
        .from('products')
        .update({ caption: cleanCaption })
        .eq('id', product.id)
        .select();

      if (!error && data && data.length > 0) {
        return {
          success: true,
          product: mapRowToProduct(data[0]),
        };
      } else if (error) {
        console.warn('Update caption in Supabase failed, attempting fresh insert:', error.message);
      }
    } catch (err) {
      console.warn('Supabase caption update error, attempting insert:', err);
    }
  }

  // If not yet saved with a UUID, insert the product with the updated caption
  const insertRes = await insertProductToSupabase(updatedProduct);
  return {
    success: insertRes.success,
    product: insertRes.product || updatedProduct,
    error: insertRes.error,
  };
}

