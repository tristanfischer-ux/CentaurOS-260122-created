// ============================================================================
// THREE-TIER ARCHITECTURE TYPES
// ============================================================================

// ============================================================================
// TIER 1: MARKETPLACE TYPES (Shared by ALL users)
// ============================================================================

export type SupplierMarketplaceStatus = 'pending_approval' | 'verified' | 'suspended';
export type AIToolCategory = 'productivity' | 'coding' | 'design' | 'marketing' | 'data_analysis' | 'customer_support' | 'other';
export type PricingModel = 'free' | 'subscription' | 'per_use' | 'enterprise';
export type BusinessFunction = 'marketing' | 'sales' | 'finance' | 'engineering' | 'operations' | 'admin' | 'product' | 'hr';
export type ListingVisibility = 'public' | 'unlisted' | 'private';
export type MarketplaceListingType = 'supplier' | 'executive' | 'apprentice' | 'ai_tool';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert' | 'master';

// Supplier in Marketplace
export interface MarketplaceSupplier {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  capabilities: string[];
  status: SupplierMarketplaceStatus;
  contactEmail?: string;
  location?: string;
  ratingAverage: number;
  reviewCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// AI Tool in Marketplace
export interface MarketplaceAITool {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  category: AIToolCategory;
  provider?: string;
  pricingModel: PricingModel;
  capabilities: string[];
  multiplierEffect: number; // 1.5 = 50% productivity boost
  isActive: boolean;
  monthlyCost?: number;
  perUseCost?: number;
  documentationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Executive Listing in Marketplace
export interface MarketplaceExecutive {
  id: string;
  userId: string;
  businessFunction: BusinessFunction;
  title: string;
  bio?: string;
  skills: string[];
  dayRate?: number;
  availabilityHoursPerWeek?: number;
  visibility: ListingVisibility;
  isVerified: boolean;
  ratingAverage: number;
  reviewCount: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Apprentice Listing in Marketplace
export interface MarketplaceApprentice {
  id: string;
  userId: string;
  skills: string[];
  learningGoals: string[];
  hourlyRate?: number;
  availabilityHoursPerWeek?: number;
  portfolioUrl?: string;
  visibility: ListingVisibility;
  isVerified: boolean;
  ratingAverage: number;
  reviewCount: number;
  githubUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Marketplace Review
export interface MarketplaceReview {
  id: string;
  reviewerId: string;
  listingType: MarketplaceListingType;
  listingId: string;
  rating: number; // 1-5
  reviewText?: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIER 2: COMPANY TYPES (Per Workspace)
// ============================================================================

export type DecisionType = 'strategic' | 'tactical' | 'operational';
export type DecisionUrgency = 'low' | 'normal' | 'high' | 'critical';
export type DecisionStatus = 'pending' | 'decided' | 'implemented' | 'cancelled';
export type ImportType = 'team_members' | 'tasks' | 'okrs' | 'decisions' | 'financials';

// Company Financials
export interface CompanyFinancials {
  id: string;
  workspaceId: string;
  periodStart: string; // Date
  periodEnd: string; // Date
  revenue: number;
  expenses: number;
  burnRate: number; // Monthly burn rate
  runwayMonths?: number; // Calculated: remaining_cash / burn_rate
  budgetAllocated: number;
  budgetSpent: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Decision Option
export interface DecisionOption {
  title: string;
  pros: string[];
  cons: string[];
  cost?: number;
  impact?: string;
}

// Strategic Decision
export interface Decision {
  id: string;
  workspaceId: string;
  title: string;
  context?: string;
  decisionType: DecisionType;
  urgency: DecisionUrgency;
  options: DecisionOption[];
  chosenOption?: number; // Index of chosen option
  decidedBy?: string;
  decisionDate?: string;
  linkedOkrIds: string[];
  linkedTaskIds: string[];
  status: DecisionStatus;
  outcome?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Bulk Import Error
export interface ImportError {
  row: number;
  error: string;
  data: any;
}

// Bulk Import Log
export interface BulkImportLog {
  id: string;
  workspaceId: string;
  importType: ImportType;
  fileName: string;
  rowsProcessed: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errorLog: ImportError[];
  importedBy?: string;
  createdAt: string;
}

// ============================================================================
// TIER 3: USER TYPES (Per Individual)
// ============================================================================

export type AvailabilityStatus = 'available' | 'busy' | 'away' | 'offline';

// User Preferences
export interface UserPreferences {
  id: string;
  userId: string;
  timezone: string;
  locale: string;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationInApp: boolean;
  defaultWorkspaceId?: string;
  availabilityStatus: AvailabilityStatus;
  updatedAt: string;
}

// User Skill
export interface UserSkill {
  id: string;
  userId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  yearsExperience?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CSV IMPORT TYPES
// ============================================================================

export interface CSVTeamMemberRow {
  name: string;
  initials?: string;
  personClass: 'Founder' | 'Exec' | 'Apprentice';
  function: string;
  baseSquaresPerWeek?: number;
  overtimeSquaresPerWeek?: number;
  overtimeEnabled?: boolean;
  costPerSquare?: number;
  avatarColor?: string;
}

export interface CSVImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errors: ImportError[];
  importLogId?: string;
}

// ============================================================================
// MARKETPLACE SEARCH/FILTER TYPES
// ============================================================================

export interface MarketplaceFilters {
  searchQuery?: string;
  category?: string;
  minRating?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  capabilities?: string[];
  location?: string;
  availabilityMin?: number;
  verified?: boolean;
}

export interface MarketplaceSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
