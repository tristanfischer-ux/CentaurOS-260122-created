/**
 * THREE-TIER SUPABASE SERVICE LAYER
 *
 * TIER 1: MARKETPLACE - Shared by all users (suppliers, AI tools, listings, reviews)
 * TIER 2: COMPANY - Per workspace (financials, decisions, import logs)
 * TIER 3: USER - Per individual (preferences, skills)
 */

import { supabase } from './supabase';
import type {
  // Tier 1: Marketplace
  MarketplaceSupplier,
  MarketplaceAITool,
  MarketplaceExecutive,
  MarketplaceApprentice,
  MarketplaceReview,
  SupplierMarketplaceStatus,
  ListingVisibility,
  MarketplaceFilters,
  MarketplaceSearchResult,

  // Tier 2: Company
  CompanyFinancials,
  Decision,
  DecisionOption,
  BulkImportLog,
  ImportError,

  // Tier 3: User
  UserPreferences,
  UserSkill,
} from '@/types/three-tier';

// ============================================================================
// TIER 1: MARKETPLACE SERVICE
// ============================================================================

// ----------------------------------------------------------------------------
// Suppliers Service
// ----------------------------------------------------------------------------

export const suppliersService = {
  // Get all verified suppliers (marketplace browsing)
  async getAll(): Promise<MarketplaceSupplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[suppliersService] Error fetching suppliers:', error.message);
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }

    return (data || []).map(supabaseToSupplier);
  },

  // Get supplier by ID
  async getById(id: string): Promise<MarketplaceSupplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[suppliersService] Error fetching supplier:', error.message);
      return null;
    }

    return data ? supabaseToSupplier(data) : null;
  },

  // Get user's own suppliers (for managing listings)
  async getMySuppliers(userId: string): Promise<MarketplaceSupplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[suppliersService] Error fetching my suppliers:', error.message);
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }

    return (data || []).map(supabaseToSupplier);
  },

  // Search suppliers with filters
  async search(filters: MarketplaceFilters): Promise<MarketplaceSearchResult<MarketplaceSupplier>> {
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('status', 'verified');

    // Apply filters
    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    if (filters.capabilities && filters.capabilities.length > 0) {
      query = query.contains('capabilities', filters.capabilities);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.minRating) {
      query = query.gte('rating_average', filters.minRating);
    }

    const { data, error, count } = await query.order('rating_average', { ascending: false });

    if (error) {
      console.error('[suppliersService] Error searching suppliers:', error.message);
      throw new Error(`Failed to search suppliers: ${error.message}`);
    }

    return {
      items: (data || []).map(supabaseToSupplier),
      total: count || 0,
      page: 1,
      pageSize: data?.length || 0,
      hasMore: false,
    };
  },

  // Create supplier listing
  async create(supplier: Omit<MarketplaceSupplier, 'id' | 'createdAt' | 'updatedAt' | 'ratingAverage' | 'reviewCount'>): Promise<MarketplaceSupplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierToSupabase(supplier))
      .select()
      .single();

    if (error) {
      console.error('[suppliersService] Error creating supplier:', error.message);
      throw new Error(`Failed to create supplier: ${error.message}`);
    }

    return supabaseToSupplier(data);
  },

  // Update supplier listing
  async update(id: string, updates: Partial<MarketplaceSupplier>): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update(supplierToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[suppliersService] Error updating supplier:', error.message);
      throw new Error(`Failed to update supplier: ${error.message}`);
    }
  },

  // Delete supplier listing
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[suppliersService] Error deleting supplier:', error.message);
      throw new Error(`Failed to delete supplier: ${error.message}`);
    }
  },
};

// ----------------------------------------------------------------------------
// AI Tools Service
// ----------------------------------------------------------------------------

export const aiToolsService = {
  // Get all active AI tools
  async getAll(): Promise<MarketplaceAITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[aiToolsService] Error fetching AI tools:', error.message);
      throw new Error(`Failed to fetch AI tools: ${error.message}`);
    }

    return (data || []).map(supabaseToAITool);
  },

  // Get AI tool by ID
  async getById(id: string): Promise<MarketplaceAITool | null> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[aiToolsService] Error fetching AI tool:', error.message);
      return null;
    }

    return data ? supabaseToAITool(data) : null;
  },

  // Get AI tools by category
  async getByCategory(category: string): Promise<MarketplaceAITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[aiToolsService] Error fetching AI tools by category:', error.message);
      throw new Error(`Failed to fetch AI tools: ${error.message}`);
    }

    return (data || []).map(supabaseToAITool);
  },
};

// ----------------------------------------------------------------------------
// Executive Listings Service
// ----------------------------------------------------------------------------

export const executiveListingsService = {
  // Get all public executive listings
  async getAll(): Promise<MarketplaceExecutive[]> {
    const { data, error } = await supabase
      .from('executive_listings')
      .select('*')
      .eq('visibility', 'public')
      .order('rating_average', { ascending: false });

    if (error) {
      console.error('[executiveListingsService] Error fetching executives:', error.message);
      throw new Error(`Failed to fetch executives: ${error.message}`);
    }

    return (data || []).map(supabaseToExecutive);
  },

  // Get user's own executive listing
  async getMyListing(userId: string): Promise<MarketplaceExecutive | null> {
    const { data, error } = await supabase
      .from('executive_listings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is okay
      console.error('[executiveListingsService] Error fetching my listing:', error.message);
      return null;
    }

    return data ? supabaseToExecutive(data) : null;
  },

  // Search executives by function
  async getByFunction(businessFunction: string): Promise<MarketplaceExecutive[]> {
    const { data, error } = await supabase
      .from('executive_listings')
      .select('*')
      .eq('business_function', businessFunction)
      .eq('visibility', 'public')
      .order('rating_average', { ascending: false });

    if (error) {
      console.error('[executiveListingsService] Error fetching executives:', error.message);
      throw new Error(`Failed to fetch executives: ${error.message}`);
    }

    return (data || []).map(supabaseToExecutive);
  },

  // Create executive listing
  async create(listing: Omit<MarketplaceExecutive, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'ratingAverage' | 'reviewCount'>): Promise<MarketplaceExecutive> {
    const { data, error } = await supabase
      .from('executive_listings')
      .insert(executiveToSupabase(listing))
      .select()
      .single();

    if (error) {
      console.error('[executiveListingsService] Error creating listing:', error.message);
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    return supabaseToExecutive(data);
  },

  // Update executive listing
  async update(id: string, updates: Partial<MarketplaceExecutive>): Promise<void> {
    const { error } = await supabase
      .from('executive_listings')
      .update(executiveToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[executiveListingsService] Error updating listing:', error.message);
      throw new Error(`Failed to update listing: ${error.message}`);
    }
  },

  // Delete executive listing
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('executive_listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[executiveListingsService] Error deleting listing:', error.message);
      throw new Error(`Failed to delete listing: ${error.message}`);
    }
  },
};

// ----------------------------------------------------------------------------
// Apprentice Listings Service
// ----------------------------------------------------------------------------

export const apprenticeListingsService = {
  // Get all public apprentice listings
  async getAll(): Promise<MarketplaceApprentice[]> {
    const { data, error } = await supabase
      .from('apprentice_listings')
      .select('*')
      .eq('visibility', 'public')
      .order('rating_average', { ascending: false });

    if (error) {
      console.error('[apprenticeListingsService] Error fetching apprentices:', error.message);
      throw new Error(`Failed to fetch apprentices: ${error.message}`);
    }

    return (data || []).map(supabaseToApprentice);
  },

  // Get user's own apprentice listing
  async getMyListing(userId: string): Promise<MarketplaceApprentice | null> {
    const { data, error } = await supabase
      .from('apprentice_listings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[apprenticeListingsService] Error fetching my listing:', error.message);
      return null;
    }

    return data ? supabaseToApprentice(data) : null;
  },

  // Create apprentice listing
  async create(listing: Omit<MarketplaceApprentice, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'ratingAverage' | 'reviewCount'>): Promise<MarketplaceApprentice> {
    const { data, error } = await supabase
      .from('apprentice_listings')
      .insert(apprenticeToSupabase(listing))
      .select()
      .single();

    if (error) {
      console.error('[apprenticeListingsService] Error creating listing:', error.message);
      throw new Error(`Failed to create listing: ${error.message}`);
    }

    return supabaseToApprentice(data);
  },

  // Update apprentice listing
  async update(id: string, updates: Partial<MarketplaceApprentice>): Promise<void> {
    const { error} = await supabase
      .from('apprentice_listings')
      .update(apprenticeToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[apprenticeListingsService] Error updating listing:', error.message);
      throw new Error(`Failed to update listing: ${error.message}`);
    }
  },

  // Delete apprentice listing
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('apprentice_listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[apprenticeListingsService] Error deleting listing:', error.message);
      throw new Error(`Failed to delete listing: ${error.message}`);
    }
  },
};

// ----------------------------------------------------------------------------
// Marketplace Reviews Service
// ----------------------------------------------------------------------------

export const marketplaceReviewsService = {
  // Get reviews for a specific listing
  async getForListing(listingType: string, listingId: string): Promise<MarketplaceReview[]> {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('listing_type', listingType)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[marketplaceReviewsService] Error fetching reviews:', error.message);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }

    return (data || []).map(supabaseToReview);
  },

  // Create review
  async create(review: Omit<MarketplaceReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount'>): Promise<MarketplaceReview> {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .insert(reviewToSupabase(review))
      .select()
      .single();

    if (error) {
      console.error('[marketplaceReviewsService] Error creating review:', error.message);
      throw new Error(`Failed to create review: ${error.message}`);
    }

    return supabaseToReview(data);
  },
};

// ============================================================================
// TIER 2: COMPANY SERVICE (Per Workspace)
// ============================================================================

// ----------------------------------------------------------------------------
// Company Financials Service
// ----------------------------------------------------------------------------

export const financialsService = {
  // Get financials for workspace
  async getForWorkspace(workspaceId: string): Promise<CompanyFinancials[]> {
    const { data, error } = await supabase
      .from('company_financials')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('period_start', { ascending: false });

    if (error) {
      console.error('[financialsService] Error fetching financials:', error.message);
      throw new Error(`Failed to fetch financials: ${error.message}`);
    }

    return (data || []).map(supabaseToFinancials);
  },

  // Create financial record
  async create(financials: Omit<CompanyFinancials, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyFinancials> {
    const { data, error } = await supabase
      .from('company_financials')
      .insert(financialsToSupabase(financials))
      .select()
      .single();

    if (error) {
      console.error('[financialsService] Error creating financials:', error.message);
      throw new Error(`Failed to create financials: ${error.message}`);
    }

    return supabaseToFinancials(data);
  },

  // Update financial record
  async update(id: string, updates: Partial<CompanyFinancials>): Promise<void> {
    const { error } = await supabase
      .from('company_financials')
      .update(financialsToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[financialsService] Error updating financials:', error.message);
      throw new Error(`Failed to update financials: ${error.message}`);
    }
  },

  // Delete financial record
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_financials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[financialsService] Error deleting financials:', error.message);
      throw new Error(`Failed to delete financials: ${error.message}`);
    }
  },
};

// ----------------------------------------------------------------------------
// Decisions Service
// ----------------------------------------------------------------------------

export const decisionsService = {
  // Get decisions for workspace
  async getForWorkspace(workspaceId: string): Promise<Decision[]> {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[decisionsService] Error fetching decisions:', error.message);
      throw new Error(`Failed to fetch decisions: ${error.message}`);
    }

    return (data || []).map(supabaseToDecision);
  },

  // Get pending decisions
  async getPending(workspaceId: string): Promise<Decision[]> {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('urgency', { ascending: false });

    if (error) {
      console.error('[decisionsService] Error fetching pending decisions:', error.message);
      throw new Error(`Failed to fetch decisions: ${error.message}`);
    }

    return (data || []).map(supabaseToDecision);
  },

  // Create decision
  async create(decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>): Promise<Decision> {
    const { data, error } = await supabase
      .from('decisions')
      .insert(decisionToSupabase(decision))
      .select()
      .single();

    if (error) {
      console.error('[decisionsService] Error creating decision:', error.message);
      throw new Error(`Failed to create decision: ${error.message}`);
    }

    return supabaseToDecision(data);
  },

  // Update decision
  async update(id: string, updates: Partial<Decision>): Promise<void> {
    const { error } = await supabase
      .from('decisions')
      .update(decisionToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[decisionsService] Error updating decision:', error.message);
      throw new Error(`Failed to update decision: ${error.message}`);
    }
  },

  // Delete decision
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[decisionsService] Error deleting decision:', error.message);
      throw new Error(`Failed to delete decision: ${error.message}`);
    }
  },
};

// ----------------------------------------------------------------------------
// Bulk Import Logs Service
// ----------------------------------------------------------------------------

export const bulkImportService = {
  // Get import logs for workspace
  async getForWorkspace(workspaceId: string): Promise<BulkImportLog[]> {
    const { data, error } = await supabase
      .from('bulk_import_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[bulkImportService] Error fetching import logs:', error.message);
      throw new Error(`Failed to fetch import logs: ${error.message}`);
    }

    return (data || []).map(supabaseToImportLog);
  },

  // Create import log
  async create(log: Omit<BulkImportLog, 'id' | 'createdAt'>): Promise<BulkImportLog> {
    const { data, error } = await supabase
      .from('bulk_import_logs')
      .insert(importLogToSupabase(log))
      .select()
      .single();

    if (error) {
      console.error('[bulkImportService] Error creating import log:', error.message);
      throw new Error(`Failed to create import log: ${error.message}`);
    }

    return supabaseToImportLog(data);
  },
};

// ============================================================================
// TIER 3: USER SERVICE (Per Individual)
// ============================================================================

// ----------------------------------------------------------------------------
// User Preferences Service
// ----------------------------------------------------------------------------

export const userPreferencesService = {
  // Get user's preferences
  async get(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[userPreferencesService] Error fetching preferences:', error.message);
      return null;
    }

    return data ? supabaseToUserPreferences(data) : null;
  },

  // Create or update user preferences (upsert)
  async upsert(preferences: Omit<UserPreferences, 'id' | 'updatedAt'>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(userPreferencesToSupabase(preferences), { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[userPreferencesService] Error upserting preferences:', error.message);
      throw new Error(`Failed to save preferences: ${error.message}`);
    }

    return supabaseToUserPreferences(data);
  },
};

// ----------------------------------------------------------------------------
// User Skills Service
// ----------------------------------------------------------------------------

export const userSkillsService = {
  // Get user's skills
  async getForUser(userId: string): Promise<UserSkill[]> {
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('proficiency_level', { ascending: false });

    if (error) {
      console.error('[userSkillsService] Error fetching skills:', error.message);
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }

    return (data || []).map(supabaseToUserSkill);
  },

  // Create skill
  async create(skill: Omit<UserSkill, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'verifiedBy' | 'verifiedAt'>): Promise<UserSkill> {
    const { data, error } = await supabase
      .from('user_skills')
      .insert(userSkillToSupabase(skill))
      .select()
      .single();

    if (error) {
      console.error('[userSkillsService] Error creating skill:', error.message);
      throw new Error(`Failed to create skill: ${error.message}`);
    }

    return supabaseToUserSkill(data);
  },

  // Update skill
  async update(id: string, updates: Partial<UserSkill>): Promise<void> {
    const { error } = await supabase
      .from('user_skills')
      .update(userSkillToSupabase(updates))
      .eq('id', id);

    if (error) {
      console.error('[userSkillsService] Error updating skill:', error.message);
      throw new Error(`Failed to update skill: ${error.message}`);
    }
  },

  // Delete skill
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[userSkillsService] Error deleting skill:', error.message);
      throw new Error(`Failed to delete skill: ${error.message}`);
    }
  },
};

// ============================================================================
// TYPE CONVERSION FUNCTIONS (snake_case <-> camelCase)
// ============================================================================

// Supplier conversions
function supabaseToSupplier(row: any): MarketplaceSupplier {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    capabilities: row.capabilities || [],
    status: row.status,
    contactEmail: row.contact_email,
    location: row.location,
    ratingAverage: parseFloat(row.rating_average) || 0,
    reviewCount: row.review_count || 0,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function supplierToSupabase(supplier: Partial<MarketplaceSupplier>): any {
  const result: any = {};
  if (supplier.name !== undefined) result.name = supplier.name;
  if (supplier.description !== undefined) result.description = supplier.description;
  if (supplier.logoUrl !== undefined) result.logo_url = supplier.logoUrl;
  if (supplier.website !== undefined) result.website = supplier.website;
  if (supplier.capabilities !== undefined) result.capabilities = supplier.capabilities;
  if (supplier.status !== undefined) result.status = supplier.status;
  if (supplier.contactEmail !== undefined) result.contact_email = supplier.contactEmail;
  if (supplier.location !== undefined) result.location = supplier.location;
  if (supplier.ownerId !== undefined) result.owner_id = supplier.ownerId;
  return result;
}

// AI Tool conversions
function supabaseToAITool(row: any): MarketplaceAITool {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconUrl: row.icon_url,
    category: row.category,
    provider: row.provider,
    pricingModel: row.pricing_model,
    capabilities: row.capabilities || [],
    multiplierEffect: parseFloat(row.multiplier_effect) || 1.0,
    isActive: row.is_active,
    monthlyCost: row.monthly_cost ? parseFloat(row.monthly_cost) : undefined,
    perUseCost: row.per_use_cost ? parseFloat(row.per_use_cost) : undefined,
    documentationUrl: row.documentation_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Executive conversions
function supabaseToExecutive(row: any): MarketplaceExecutive {
  return {
    id: row.id,
    userId: row.user_id,
    businessFunction: row.business_function,
    title: row.title,
    bio: row.bio,
    skills: row.skills || [],
    dayRate: row.day_rate ? parseFloat(row.day_rate) : undefined,
    availabilityHoursPerWeek: row.availability_hours_per_week,
    visibility: row.visibility,
    isVerified: row.is_verified,
    ratingAverage: parseFloat(row.rating_average) || 0,
    reviewCount: row.review_count || 0,
    portfolioUrl: row.portfolio_url,
    linkedinUrl: row.linkedin_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function executiveToSupabase(executive: Partial<MarketplaceExecutive>): any {
  const result: any = {};
  if (executive.userId !== undefined) result.user_id = executive.userId;
  if (executive.businessFunction !== undefined) result.business_function = executive.businessFunction;
  if (executive.title !== undefined) result.title = executive.title;
  if (executive.bio !== undefined) result.bio = executive.bio;
  if (executive.skills !== undefined) result.skills = executive.skills;
  if (executive.dayRate !== undefined) result.day_rate = executive.dayRate;
  if (executive.availabilityHoursPerWeek !== undefined) result.availability_hours_per_week = executive.availabilityHoursPerWeek;
  if (executive.visibility !== undefined) result.visibility = executive.visibility;
  if (executive.portfolioUrl !== undefined) result.portfolio_url = executive.portfolioUrl;
  if (executive.linkedinUrl !== undefined) result.linkedin_url = executive.linkedinUrl;
  return result;
}

// Apprentice conversions
function supabaseToApprentice(row: any): MarketplaceApprentice {
  return {
    id: row.id,
    userId: row.user_id,
    skills: row.skills || [],
    learningGoals: row.learning_goals || [],
    hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
    availabilityHoursPerWeek: row.availability_hours_per_week,
    portfolioUrl: row.portfolio_url,
    visibility: row.visibility,
    isVerified: row.is_verified,
    ratingAverage: parseFloat(row.rating_average) || 0,
    reviewCount: row.review_count || 0,
    githubUrl: row.github_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function apprenticeToSupabase(apprentice: Partial<MarketplaceApprentice>): any {
  const result: any = {};
  if (apprentice.userId !== undefined) result.user_id = apprentice.userId;
  if (apprentice.skills !== undefined) result.skills = apprentice.skills;
  if (apprentice.learningGoals !== undefined) result.learning_goals = apprentice.learningGoals;
  if (apprentice.hourlyRate !== undefined) result.hourly_rate = apprentice.hourlyRate;
  if (apprentice.availabilityHoursPerWeek !== undefined) result.availability_hours_per_week = apprentice.availabilityHoursPerWeek;
  if (apprentice.portfolioUrl !== undefined) result.portfolio_url = apprentice.portfolioUrl;
  if (apprentice.visibility !== undefined) result.visibility = apprentice.visibility;
  if (apprentice.githubUrl !== undefined) result.github_url = apprentice.githubUrl;
  return result;
}

// Review conversions
function supabaseToReview(row: any): MarketplaceReview {
  return {
    id: row.id,
    reviewerId: row.reviewer_id,
    listingType: row.listing_type,
    listingId: row.listing_id,
    rating: row.rating,
    reviewText: row.review_text,
    helpfulCount: row.helpful_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function reviewToSupabase(review: Partial<MarketplaceReview>): any {
  const result: any = {};
  if (review.reviewerId !== undefined) result.reviewer_id = review.reviewerId;
  if (review.listingType !== undefined) result.listing_type = review.listingType;
  if (review.listingId !== undefined) result.listing_id = review.listingId;
  if (review.rating !== undefined) result.rating = review.rating;
  if (review.reviewText !== undefined) result.review_text = review.reviewText;
  return result;
}

// Financials conversions
function supabaseToFinancials(row: any): CompanyFinancials {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    revenue: parseFloat(row.revenue) || 0,
    expenses: parseFloat(row.expenses) || 0,
    burnRate: parseFloat(row.burn_rate) || 0,
    runwayMonths: row.runway_months ? parseFloat(row.runway_months) : undefined,
    budgetAllocated: parseFloat(row.budget_allocated) || 0,
    budgetSpent: parseFloat(row.budget_spent) || 0,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function financialsToSupabase(financials: Partial<CompanyFinancials>): any {
  const result: any = {};
  if (financials.workspaceId !== undefined) result.workspace_id = financials.workspaceId;
  if (financials.periodStart !== undefined) result.period_start = financials.periodStart;
  if (financials.periodEnd !== undefined) result.period_end = financials.periodEnd;
  if (financials.revenue !== undefined) result.revenue = financials.revenue;
  if (financials.expenses !== undefined) result.expenses = financials.expenses;
  if (financials.burnRate !== undefined) result.burn_rate = financials.burnRate;
  if (financials.runwayMonths !== undefined) result.runway_months = financials.runwayMonths;
  if (financials.budgetAllocated !== undefined) result.budget_allocated = financials.budgetAllocated;
  if (financials.budgetSpent !== undefined) result.budget_spent = financials.budgetSpent;
  if (financials.notes !== undefined) result.notes = financials.notes;
  if (financials.createdBy !== undefined) result.created_by = financials.createdBy;
  return result;
}

// Decision conversions
function supabaseToDecision(row: any): Decision {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    context: row.context,
    decisionType: row.decision_type,
    urgency: row.urgency,
    options: row.options || [],
    chosenOption: row.chosen_option,
    decidedBy: row.decided_by,
    decisionDate: row.decision_date,
    linkedOkrIds: row.linked_okr_ids || [],
    linkedTaskIds: row.linked_task_ids || [],
    status: row.status,
    outcome: row.outcome,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function decisionToSupabase(decision: Partial<Decision>): any {
  const result: any = {};
  if (decision.workspaceId !== undefined) result.workspace_id = decision.workspaceId;
  if (decision.title !== undefined) result.title = decision.title;
  if (decision.context !== undefined) result.context = decision.context;
  if (decision.decisionType !== undefined) result.decision_type = decision.decisionType;
  if (decision.urgency !== undefined) result.urgency = decision.urgency;
  if (decision.options !== undefined) result.options = decision.options;
  if (decision.chosenOption !== undefined) result.chosen_option = decision.chosenOption;
  if (decision.decidedBy !== undefined) result.decided_by = decision.decidedBy;
  if (decision.decisionDate !== undefined) result.decision_date = decision.decisionDate;
  if (decision.linkedOkrIds !== undefined) result.linked_okr_ids = decision.linkedOkrIds;
  if (decision.linkedTaskIds !== undefined) result.linked_task_ids = decision.linkedTaskIds;
  if (decision.status !== undefined) result.status = decision.status;
  if (decision.outcome !== undefined) result.outcome = decision.outcome;
  if (decision.createdBy !== undefined) result.created_by = decision.createdBy;
  return result;
}

// Import Log conversions
function supabaseToImportLog(row: any): BulkImportLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    importType: row.import_type,
    fileName: row.file_name,
    rowsProcessed: row.rows_processed || 0,
    rowsSucceeded: row.rows_succeeded || 0,
    rowsFailed: row.rows_failed || 0,
    errorLog: row.error_log || [],
    importedBy: row.imported_by,
    createdAt: row.created_at,
  };
}

function importLogToSupabase(log: Partial<BulkImportLog>): any {
  const result: any = {};
  if (log.workspaceId !== undefined) result.workspace_id = log.workspaceId;
  if (log.importType !== undefined) result.import_type = log.importType;
  if (log.fileName !== undefined) result.file_name = log.fileName;
  if (log.rowsProcessed !== undefined) result.rows_processed = log.rowsProcessed;
  if (log.rowsSucceeded !== undefined) result.rows_succeeded = log.rowsSucceeded;
  if (log.rowsFailed !== undefined) result.rows_failed = log.rowsFailed;
  if (log.errorLog !== undefined) result.error_log = log.errorLog;
  if (log.importedBy !== undefined) result.imported_by = log.importedBy;
  return result;
}

// User Preferences conversions
function supabaseToUserPreferences(row: any): UserPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    timezone: row.timezone,
    locale: row.locale,
    notificationEmail: row.notification_email,
    notificationPush: row.notification_push,
    notificationInApp: row.notification_in_app,
    defaultWorkspaceId: row.default_workspace_id,
    availabilityStatus: row.availability_status,
    updatedAt: row.updated_at,
  };
}

function userPreferencesToSupabase(prefs: Partial<UserPreferences>): any {
  const result: any = {};
  if (prefs.userId !== undefined) result.user_id = prefs.userId;
  if (prefs.timezone !== undefined) result.timezone = prefs.timezone;
  if (prefs.locale !== undefined) result.locale = prefs.locale;
  if (prefs.notificationEmail !== undefined) result.notification_email = prefs.notificationEmail;
  if (prefs.notificationPush !== undefined) result.notification_push = prefs.notificationPush;
  if (prefs.notificationInApp !== undefined) result.notification_in_app = prefs.notificationInApp;
  if (prefs.defaultWorkspaceId !== undefined) result.default_workspace_id = prefs.defaultWorkspaceId;
  if (prefs.availabilityStatus !== undefined) result.availability_status = prefs.availabilityStatus;
  return result;
}

// User Skill conversions
function supabaseToUserSkill(row: any): UserSkill {
  return {
    id: row.id,
    userId: row.user_id,
    skillName: row.skill_name,
    proficiencyLevel: row.proficiency_level,
    yearsExperience: row.years_experience ? parseFloat(row.years_experience) : undefined,
    isVerified: row.is_verified,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userSkillToSupabase(skill: Partial<UserSkill>): any {
  const result: any = {};
  if (skill.userId !== undefined) result.user_id = skill.userId;
  if (skill.skillName !== undefined) result.skill_name = skill.skillName;
  if (skill.proficiencyLevel !== undefined) result.proficiency_level = skill.proficiencyLevel;
  if (skill.yearsExperience !== undefined) result.years_experience = skill.yearsExperience;
  return result;
}
