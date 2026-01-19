/**
 * AI Tools Service Layer
 *
 * Service for loading AI tools from Supabase directory_ai_tools table
 * Replaces hardcoded AI tools data with multi-tenant database storage
 */

import { supabase } from './supabase';
import type { ThirdPartyAITool, BusinessFunction } from './third-party-ai-tools';

// ============================================================================
// TYPES
// ============================================================================

// Supabase directory_ai_tools table row
interface DirectoryAIToolRow {
  id: string;
  tool_name: string;
  vendor_name: string;
  category: 'sales' | 'marketing' | 'ops' | 'finance' | 'design' | 'manufacturing' | 'procurement' | 'support';
  subcategories: string[];
  target_user: string | null;
  pricing_model: 'free' | 'freemium' | 'paid' | 'enterprise' | 'unknown' | null;
  website: string | null;
  confidence_score: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended AI tool with additional metadata (stored as JSON in future migration)
interface AIToolMetadata {
  purpose?: string;
  description?: string;
  capabilities?: string[];
  integrations?: string[];
  functions?: BusinessFunction[];
  costPerMonth?: number;
  efficiencyMultiplier?: number;
  useCases?: string[];
  keyFeatures?: string[];
  pricing?: {
    starter?: string;
    professional?: string;
    enterprise?: string;
    notes?: string;
  };
  setup?: {
    difficulty?: 'Easy' | 'Moderate' | 'Advanced';
    timeToValue?: string;
    requirements?: string[];
  };
  support?: {
    documentation?: string;
    community?: string;
    email?: boolean;
    phone?: boolean;
  };
  reviews?: {
    rating?: number;
    totalReviews?: number;
    pros?: string[];
    cons?: string[];
  };
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Map Supabase category to app category
 */
function mapSupabaseCategory(
  supabaseCategory: DirectoryAIToolRow['category']
): ThirdPartyAITool['category'] {
  const categoryMap: Record<DirectoryAIToolRow['category'], ThirdPartyAITool['category']> = {
    sales: 'sales',
    marketing: 'marketing',
    finance: 'finance',
    ops: 'operations',
    design: 'engineering',
    manufacturing: 'manufacturing',
    procurement: 'operations',
    support: 'productivity',
  };
  return categoryMap[supabaseCategory] || 'productivity';
}

/**
 * Map Supabase pricing_model to estimated monthly cost
 */
function estimateMonthlyCost(pricingModel: DirectoryAIToolRow['pricing_model']): number {
  const costMap: Record<Exclude<DirectoryAIToolRow['pricing_model'], null>, number> = {
    free: 0,
    freemium: 50,
    paid: 200,
    enterprise: 500,
    unknown: 0,
  };
  return pricingModel ? costMap[pricingModel] : 0;
}

/**
 * Convert Supabase row to ThirdPartyAITool
 */
function supabaseToAITool(row: DirectoryAIToolRow, metadata?: AIToolMetadata): ThirdPartyAITool {
  return {
    id: row.id,
    name: row.tool_name,
    provider: row.vendor_name,
    purpose: metadata?.purpose || `${row.tool_name} for ${row.category}`,
    functions: metadata?.functions || ['Admin'],
    costPerMonth: metadata?.costPerMonth || estimateMonthlyCost(row.pricing_model),
    website: row.website || '',
    capabilities: metadata?.capabilities || [],
    integrations: metadata?.integrations || [],
    category: mapSupabaseCategory(row.category),
    efficiencyMultiplier: metadata?.efficiencyMultiplier,
    description: metadata?.description,
    useCases: metadata?.useCases,
    keyFeatures: metadata?.keyFeatures,
    pricing: metadata?.pricing,
    setup: metadata?.setup,
    support: metadata?.support,
    reviews: metadata?.reviews,
  };
}

/**
 * Convert ThirdPartyAITool to Supabase row
 * For future: seeding tools into database
 */
function aiToolToSupabase(tool: ThirdPartyAITool): DirectoryAIToolRow {
  // Reverse category mapping
  const categoryMap: Record<ThirdPartyAITool['category'], DirectoryAIToolRow['category']> = {
    sales: 'sales',
    marketing: 'marketing',
    finance: 'finance',
    operations: 'ops',
    engineering: 'design',
    manufacturing: 'manufacturing',
    productivity: 'support',
  };

  // Map cost to pricing model
  let pricingModel: DirectoryAIToolRow['pricing_model'] = 'unknown';
  if (tool.costPerMonth === 0) pricingModel = 'free';
  else if (tool.costPerMonth < 100) pricingModel = 'freemium';
  else if (tool.costPerMonth < 500) pricingModel = 'paid';
  else pricingModel = 'enterprise';

  return {
    id: tool.id,
    tool_name: tool.name,
    vendor_name: tool.provider,
    category: categoryMap[tool.category],
    subcategories: tool.functions.map(f => f.toLowerCase()),
    target_user: tool.functions[0]?.toLowerCase() || null,
    pricing_model: pricingModel,
    website: tool.website || null,
    confidence_score: 80,
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Load all AI tools from Supabase
 */
export async function loadAITools(): Promise<ThirdPartyAITool[]> {
  try {
    const { data, error } = await supabase
      .from('directory_ai_tools')
      .select('*')
      .order('tool_name', { ascending: true });

    if (error) {
      console.error('[AI Tools Service] Error loading AI tools:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[AI Tools Service] No AI tools found in database');
      return [];
    }

    // Convert to app format
    // TODO: Load metadata from separate column or related table in future
    return data.map(row => supabaseToAITool(row as DirectoryAIToolRow));
  } catch (err) {
    console.error('[AI Tools Service] Exception loading AI tools:', err);
    return [];
  }
}

/**
 * Load AI tools filtered by category
 */
export async function loadAIToolsByCategory(
  category: 'sales' | 'marketing' | 'ops' | 'finance' | 'design' | 'manufacturing' | 'procurement' | 'support'
): Promise<ThirdPartyAITool[]> {
  try {
    const { data, error } = await supabase
      .from('directory_ai_tools')
      .select('*')
      .eq('category', category)
      .order('tool_name', { ascending: true });

    if (error) {
      console.error('[AI Tools Service] Error loading AI tools by category:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => supabaseToAITool(row as DirectoryAIToolRow));
  } catch (err) {
    console.error('[AI Tools Service] Exception loading AI tools by category:', err);
    return [];
  }
}

/**
 * Load AI tools filtered by business function
 */
export async function loadAIToolsByFunction(func: BusinessFunction): Promise<ThirdPartyAITool[]> {
  try {
    // Map business function to category filter
    const functionToCategoryMap: Record<BusinessFunction, DirectoryAIToolRow['category'][]> = {
      Sales: ['sales'],
      Marketing: ['marketing'],
      Finance: ['finance'],
      Ops: ['ops', 'procurement'],
      Engineering: ['design', 'manufacturing'],
      Admin: ['support'],
    };

    const categories = functionToCategoryMap[func] || [];

    const { data, error } = await supabase
      .from('directory_ai_tools')
      .select('*')
      .in('category', categories)
      .order('tool_name', { ascending: true });

    if (error) {
      console.error('[AI Tools Service] Error loading AI tools by function:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => supabaseToAITool(row as DirectoryAIToolRow));
  } catch (err) {
    console.error('[AI Tools Service] Exception loading AI tools by function:', err);
    return [];
  }
}

/**
 * Get count of AI tools in database
 */
export async function getAIToolsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('directory_ai_tools')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[AI Tools Service] Error getting AI tools count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[AI Tools Service] Exception getting AI tools count:', err);
    return 0;
  }
}

/**
 * Insert AI tools into database (for seeding/migration)
 * Used by seed script to populate database
 */
export async function insertAITools(tools: ThirdPartyAITool[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseRows = tools.map(tool => aiToolToSupabase(tool));

    const { error } = await supabase
      .from('directory_ai_tools')
      .upsert(supabaseRows, { onConflict: 'id' });

    if (error) {
      console.error('[AI Tools Service] Error inserting AI tools:', error);
      return { success: false, error: error.message };
    }

    console.log(`[AI Tools Service] Successfully inserted ${tools.length} AI tools`);
    return { success: true };
  } catch (err) {
    console.error('[AI Tools Service] Exception inserting AI tools:', err);
    return { success: false, error: String(err) };
  }
}
