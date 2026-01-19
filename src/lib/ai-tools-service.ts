/**
 * AI Tools Service Layer
 *
 * Service for loading AI tools from Supabase ai_tools table
 * Replaces hardcoded AI tools data with multi-tenant database storage
 */

import { supabase } from './supabase';
import type { ThirdPartyAITool, BusinessFunction } from './third-party-ai-tools';

// ============================================================================
// TYPES
// ============================================================================

// Supabase ai_tools table row (from migration 001)
interface AIToolRow {
  id: string;
  name: string;
  provider: string;
  category: string; // 'text', 'image', 'voice', 'video', etc.
  description: string | null;
  typical_monthly_cost: number | null;
  created_at: string;
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
 * Map ai_tools category to app category
 */
function mapCategory(category: string): ThirdPartyAITool['category'] {
  const categoryMap: Record<string, ThirdPartyAITool['category']> = {
    text: 'productivity',
    image: 'engineering',
    voice: 'sales',
    video: 'marketing',
    code: 'engineering',
    data: 'finance',
    automation: 'operations',
    sales: 'sales',
    marketing: 'marketing',
    finance: 'finance',
    ops: 'operations',
    design: 'engineering',
    manufacturing: 'manufacturing',
    procurement: 'operations',
    support: 'productivity',
  };
  return categoryMap[category.toLowerCase()] || 'productivity';
}

/**
 * Convert Supabase row to ThirdPartyAITool
 */
function supabaseToAITool(row: AIToolRow, metadata?: AIToolMetadata): ThirdPartyAITool {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    purpose: metadata?.purpose || row.description || `${row.name} for ${row.category}`,
    functions: metadata?.functions || ['Admin'],
    costPerMonth: metadata?.costPerMonth || row.typical_monthly_cost || 0,
    website: '',
    capabilities: metadata?.capabilities || [],
    integrations: metadata?.integrations || [],
    category: mapCategory(row.category),
    efficiencyMultiplier: metadata?.efficiencyMultiplier,
    description: metadata?.description || row.description || undefined,
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
function aiToolToSupabase(tool: ThirdPartyAITool): Omit<AIToolRow, 'created_at'> {
  // Reverse category mapping
  const categoryMap: Record<ThirdPartyAITool['category'], string> = {
    sales: 'sales',
    marketing: 'marketing',
    finance: 'finance',
    operations: 'ops',
    engineering: 'design',
    manufacturing: 'manufacturing',
    productivity: 'support',
  };

  return {
    id: tool.id,
    name: tool.name,
    provider: tool.provider,
    category: categoryMap[tool.category],
    description: tool.description || tool.purpose || null,
    typical_monthly_cost: tool.costPerMonth || null,
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
      .from('ai_tools')
      .select('*')
      .order('name', { ascending: true });

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
    return data.map(row => supabaseToAITool(row as AIToolRow));
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
      .from('ai_tools')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error('[AI Tools Service] Error loading AI tools by category:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => supabaseToAITool(row as AIToolRow));
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
    const functionToCategoryMap: Record<BusinessFunction, string[]> = {
      Sales: ['sales'],
      Marketing: ['marketing'],
      Finance: ['finance'],
      Ops: ['ops', 'procurement'],
      Engineering: ['design', 'manufacturing'],
      Admin: ['support'],
    };

    const categories = functionToCategoryMap[func] || [];

    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .in('category', categories)
      .order('name', { ascending: true });

    if (error) {
      console.error('[AI Tools Service] Error loading AI tools by function:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => supabaseToAITool(row as AIToolRow));
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
      .from('ai_tools')
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
      .from('ai_tools')
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
