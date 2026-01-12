// Marketplace types for Centaur OS
// Enables discovery of executives, apprentices, suppliers, AI agents, and locations

import type { Availability, SupplierRegion, ManufacturingCapability, Function } from './index';

export type MarketplaceCategory = 'executives' | 'apprentices' | 'suppliers' | 'ai-agents' | 'locations';

export type ListingStatus = 'active' | 'pending' | 'paused' | 'rejected';

export type FeaturedTier = 'standard' | 'featured' | 'premium';

// Base marketplace listing
export interface MarketplaceListing {
  id: string;
  category: MarketplaceCategory;
  providerId: string; // User or company ID
  providerName: string;
  status: ListingStatus;
  featuredTier: FeaturedTier;
  createdAt: string;
  updatedAt: string;
  views: number;
  clicks: number;
  verified: boolean;
}

// Executive marketplace listing
export interface ExecutiveMarketplaceListing extends MarketplaceListing {
  category: 'executives';
  profile: {
    name: string;
    title: string;
    primaryFunction: Function;
    secondaryFunctions: Function[];
    yearsOfExperience: number;
    availability: Availability;
    dayRate: number;
    currency: string;
    location: string;
    remote: boolean;
    bio: string;
    skills: string[];
    industries: string[];
    previousCompanies: string[];
    linkedInUrl?: string;
    portfolioUrl?: string;
    avatarUrl?: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    completedEngagements: number;
    responseTime: string; // e.g., "< 24 hours"
  };
}

// Apprentice marketplace listing
export interface ApprenticeMarketplaceListing extends MarketplaceListing {
  category: 'apprentices';
  profile: {
    name: string;
    age: number;
    location: string;
    remote: boolean;
    targetFunctions: Function[];
    skills: string[];
    learningGoals: string[];
    education: string;
    availability: Availability;
    hourlyRate?: number;
    currency: string;
    bio: string;
    portfolioUrl?: string;
    githubUrl?: string;
    avatarUrl?: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    projectsCompleted: number;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

// Supplier marketplace listing
export interface SupplierMarketplaceListing extends MarketplaceListing {
  category: 'suppliers';
  profile: {
    companyName: string;
    description: string;
    location: string;
    region: SupplierRegion;
    capabilities: ManufacturingCapability[];
    certifications: string[]; // e.g., "ISO 9001", "ISO 14001"
    materials: string[]; // e.g., "Plastics", "Metals", "Composites"
    minOrderQuantity: number;
    leadTime: string; // e.g., "4-6 weeks"
    website?: string;
    contactEmail: string;
    contactPhone: string;
    logoUrl?: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    projectsCompleted: number;
    onTimeDelivery: number; // percentage
    qualityScore: number; // 1-5
  };
}

// AI Agent marketplace listing
export interface AIAgentMarketplaceListing extends MarketplaceListing {
  category: 'ai-agents';
  profile: {
    name: string;
    provider: string;
    model: string;
    category: string; // e.g., "Productivity", "Design", "Code Generation"
    description: string;
    purpose: string;
    capabilities: string[];
    integrations: string[];
    pricing: {
      model: 'free' | 'freemium' | 'subscription' | 'usage-based' | 'enterprise';
      startingPrice?: number;
      currency?: string;
      billingPeriod?: 'monthly' | 'annual' | 'per-use';
    };
    website: string;
    apiAvailable: boolean;
    logoUrl?: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    activeUsers: number;
    uptime: number; // percentage
  };
}

// Location marketplace listing (offices, co-working, etc.)
export interface LocationMarketplaceListing extends MarketplaceListing {
  category: 'locations';
  profile: {
    name: string;
    type: 'office' | 'co-working' | 'meeting-room' | 'maker-space' | 'warehouse' | 'showroom';
    description: string;
    address: string;
    city: string;
    region: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    capacity: number; // Number of people
    amenities: string[]; // e.g., "WiFi", "3D Printers", "Meeting Rooms"
    pricing: {
      model: 'hourly' | 'daily' | 'monthly' | 'annual';
      price: number;
      currency: string;
    };
    availability: {
      daysPerWeek: number;
      hoursPerDay: number;
      instantBooking: boolean;
    };
    images: string[];
    contactEmail: string;
    contactPhone: string;
    website?: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    bookings: number;
    occupancyRate: number; // percentage
  };
}

// Union type for all listing types
export type AnyMarketplaceListing =
  | ExecutiveMarketplaceListing
  | ApprenticeMarketplaceListing
  | SupplierMarketplaceListing
  | AIAgentMarketplaceListing
  | LocationMarketplaceListing;

// Marketplace review
export interface MarketplaceReview {
  id: string;
  listingId: string;
  listingCategory: MarketplaceCategory;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  verified: boolean; // Verified engagement/purchase
  helpfulCount: number;
  createdAt: string;
  response?: {
    // Provider can respond
    content: string;
    respondedAt: string;
  };
}

// Marketplace search filters
export interface MarketplaceFilters {
  category?: MarketplaceCategory;
  query?: string;
  location?: string;
  remote?: boolean;
  minRating?: number;
  maxPrice?: number;
  availability?: Availability;
  skills?: string[];
  capabilities?: ManufacturingCapability[];
  verified?: boolean;
  featured?: boolean;
}

// Marketplace analytics
export interface MarketplaceAnalytics {
  listingId: string;
  period: 'day' | 'week' | 'month' | 'all-time';
  views: number;
  clicks: number;
  contactRequests: number;
  conversionRate: number; // percentage
  revenueGenerated?: number;
}
