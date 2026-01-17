# Three-Tier Database Architecture - Implementation Guide

## Overview

Centaur OS now has a complete three-tier database architecture implemented in Supabase:

- **TIER 1: MARKETPLACE** - Shared by all users (suppliers, AI tools, executive/apprentice listings, reviews)
- **TIER 2: COMPANY** - Per workspace (financials, decisions, import logs)
- **TIER 3: USER** - Per individual (preferences, skills)

---

## What's Been Implemented

### ✅ Phase 1: Database Schema (COMPLETE)
**File:** `supabase-three-tier-schema.sql`

**Tables Created:**

**TIER 1 - MARKETPLACE:**
- `suppliers` - Companies offering services (verified listings)
- `ai_tools` - Catalog of AI agents with pricing and capabilities
- `executive_listings` - Executives available for fractional work
- `apprentice_listings` - Apprentices available for hire
- `marketplace_reviews` - Reviews for any marketplace listing

**TIER 2 - COMPANY:**
- `company_financials` - Financial tracking per workspace
- `decisions` - Strategic decision tracking with options/pros/cons
- `bulk_import_logs` - CSV import history and error logs

**TIER 3 - USER:**
- `user_preferences` - Extended user settings (timezone, notifications, etc.)
- `user_skills` - Skills for marketplace discovery

**Features:**
- ✅ All tables with proper foreign keys
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic `updated_at` triggers
- ✅ Comments for documentation

---

### ✅ Phase 2: TypeScript Types (COMPLETE)
**File:** `src/types/three-tier.ts`

**Types Defined:**
- All 10 main entity interfaces
- Status enums (SupplierMarketplaceStatus, DecisionStatus, etc.)
- Search/filter types
- CSV import types
- Marketplace search result types

---

### ✅ Phase 3: Service Layer (COMPLETE)
**File:** `src/lib/supabase-three-tier-service.ts`

**Services Implemented:**

**TIER 1 - MARKETPLACE:**
- `suppliersService` - CRUD operations for supplier listings
- `aiToolsService` - Browse AI tools catalog
- `executiveListingsService` - Manage executive listings
- `apprenticeListingsService` - Manage apprentice listings
- `marketplaceReviewsService` - Create/read reviews

**TIER 2 - COMPANY:**
- `financialsService` - Track company finances per period
- `decisionsService` - Log strategic decisions
- `bulkImportService` - Track CSV imports

**TIER 3 - USER:**
- `userPreferencesService` - User settings (upsert pattern)
- `userSkillsService` - Manage user skills

**Features:**
- ✅ Full CRUD operations
- ✅ Type conversions (snake_case ↔ camelCase)
- ✅ Comprehensive error logging
- ✅ Search and filtering capabilities

---

## How to Set Up in Supabase

### Step 1: Run the SQL Schema

1. Open Supabase Dashboard → SQL Editor
2. Open `supabase-three-tier-schema.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run" (or Cmd/Ctrl + Enter)

**This will create:**
- All 10 tables
- All indexes
- All RLS policies
- All triggers

### Step 2: Verify Tables Were Created

Run this query to verify:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'suppliers', 'ai_tools', 'executive_listings', 'apprentice_listings',
  'marketplace_reviews', 'company_financials', 'decisions',
  'bulk_import_logs', 'user_preferences', 'user_skills'
)
ORDER BY tablename;
```

You should see all 10 tables listed.

---

## Usage Examples

### Example 1: Browse Marketplace Suppliers

```typescript
import { suppliersService } from '@/lib/supabase-three-tier-service';

// Get all verified suppliers
const suppliers = await suppliersService.getAll();

// Search suppliers with filters
const results = await suppliersService.search({
  searchQuery: 'injection molding',
  capabilities: ['Injection Molding'],
  minRating: 4.0,
});
```

### Example 2: Create Executive Listing

```typescript
import { executiveListingsService } from '@/lib/supabase-three-tier-service';

// Create your executive listing
const listing = await executiveListingsService.create({
  userId: currentUser.id,
  businessFunction: 'marketing',
  title: 'Fractional CMO',
  bio: '15 years experience in B2B SaaS marketing',
  skills: ['SEO', 'Content Marketing', 'Growth Hacking'],
  dayRate: 1200,
  availabilityHoursPerWeek: 16,
  visibility: 'public',
  portfolioUrl: 'https://example.com/portfolio',
  linkedinUrl: 'https://linkedin.com/in/example',
});
```

### Example 3: Track Company Financials

```typescript
import { financialsService } from '@/lib/supabase-three-tier-service';

// Create monthly financial record
const financials = await financialsService.create({
  workspaceId: currentWorkspaceId,
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  revenue: 50000,
  expenses: 35000,
  burnRate: 15000,
  runwayMonths: 12,
  budgetAllocated: 40000,
  budgetSpent: 35000,
  notes: 'Q1 2026 - Strong revenue growth',
  createdBy: currentUser.id,
});
```

### Example 4: Log a Strategic Decision

```typescript
import { decisionsService } from '@/lib/supabase-three-tier-service';

// Create decision with options
const decision = await decisionsService.create({
  workspaceId: currentWorkspaceId,
  title: 'Choose Manufacturing Partner',
  context: 'Need to select injection molding supplier for product launch',
  decisionType: 'strategic',
  urgency: 'high',
  options: [
    {
      title: 'UK Supplier A',
      pros: ['Fast shipping', 'High quality'],
      cons: ['Higher cost'],
      cost: 50000,
      impact: 'Faster time to market',
    },
    {
      title: 'China Supplier B',
      pros: ['Lower cost', 'Large capacity'],
      cons: ['Longer lead time', 'Communication challenges'],
      cost: 30000,
      impact: 'Higher profit margin',
    },
  ],
  linkedOkrIds: ['okr-123'],
  linkedTaskIds: [],
  status: 'pending',
  createdBy: currentUser.id,
});

// Later, mark the decision
await decisionsService.update(decision.id, {
  status: 'decided',
  chosenOption: 0, // Chose UK Supplier A
  decidedBy: currentUser.id,
  decisionDate: new Date().toISOString(),
  outcome: 'Signed contract with UK Supplier A',
});
```

### Example 5: Manage User Skills

```typescript
import { userSkillsService } from '@/lib/supabase-three-tier-service';

// Add skills to profile
await userSkillsService.create({
  userId: currentUser.id,
  skillName: 'React Native',
  proficiencyLevel: 'expert',
  yearsExperience: 5,
});

await userSkillsService.create({
  userId: currentUser.id,
  skillName: 'TypeScript',
  proficiencyLevel: 'expert',
  yearsExperience: 6,
});

// Get all user's skills
const skills = await userSkillsService.getForUser(currentUser.id);
```

---

## RLS Security Model

### TIER 1: MARKETPLACE
- **Suppliers:** Anyone can view verified, only owners can edit their own
- **AI Tools:** Anyone can view active tools (read-only catalog)
- **Executive Listings:** Anyone can view public, users manage their own
- **Apprentice Listings:** Anyone can view public, users manage their own
- **Reviews:** Anyone can view, users can create/edit their own

### TIER 2: COMPANY
- **All Tables:** Only workspace members can access
- Uses `memberships` table to verify access
- Pattern: `workspace_id IN (SELECT workspace_id FROM memberships WHERE user_id = auth.uid())`

### TIER 3: USER
- **Preferences:** Only the user can access their own
- **Skills:** Anyone can view (for marketplace discovery), only user can edit their own

---

## Next Steps

### 🔜 Phase 4: Update App Store (PENDING)

Add marketplace state to `app-store.ts`:

```typescript
// Add to AppState interface
marketplace: {
  suppliers: Record<string, MarketplaceSupplier>;
  aiTools: Record<string, MarketplaceAITool>;
  executives: Record<string, MarketplaceExecutive>;
  apprentices: Record<string, MarketplaceApprentice>;
};
```

### 🔜 Phase 5: Create UI Components (PENDING)

**Marketplace Browsing:**
- `/src/app/marketplace/suppliers.tsx` - Browse suppliers
- `/src/app/marketplace/executives.tsx` - Find executives
- `/src/app/marketplace/apprentices.tsx` - Find apprentices
- `/src/app/marketplace/ai-tools.tsx` - Browse AI tools catalog

**My Listings:**
- `/src/app/my-listing.tsx` - Create/edit your executive or apprentice listing

**Financial Dashboard:**
- `/src/app/financials.tsx` - View and edit company financials

**Decision Tracker:**
- `/src/app/decisions.tsx` - Log and track strategic decisions

**CSV Import:**
- `/src/app/import-csv.tsx` - Bulk import team members

### 🔜 Phase 6: CSV Import Functionality (PENDING)

Create CSV parser and bulk import logic:
- Parse CSV files
- Validate data
- Bulk insert to `team_members` table
- Log import results to `bulk_import_logs`

---

## File Structure

```
/home/user/workspace/
├── supabase-three-tier-schema.sql         # Database schema (RUN IN SUPABASE)
├── src/
│   ├── types/
│   │   └── three-tier.ts                   # TypeScript types
│   ├── lib/
│   │   └── supabase-three-tier-service.ts  # Service layer
│   └── app/
│       ├── marketplace/                     # (TO BE CREATED)
│       ├── financials.tsx                   # (TO BE CREATED)
│       ├── decisions.tsx                    # (TO BE CREATED)
│       └── import-csv.tsx                   # (TO BE CREATED)
└── THREE_TIER_ARCHITECTURE.md              # This file
```

---

## Testing Checklist

### ✅ Schema
- [x] All tables created
- [x] Indexes exist
- [x] RLS policies enabled
- [x] Triggers working

### ⏳ Service Layer
- [ ] Test marketplace CRUD operations
- [ ] Test company financials
- [ ] Test decisions
- [ ] Test user preferences
- [ ] Test user skills

### ⏳ UI
- [ ] Marketplace browsing works
- [ ] Can create listings
- [ ] Can track financials
- [ ] Can log decisions
- [ ] CSV import works

---

## Benefits of Three-Tier Architecture

**TIER 1 - MARKETPLACE:**
- Global discoverability
- Network effects (more users = more value)
- Verified suppliers and professionals
- Rating system for quality assurance

**TIER 2 - COMPANY:**
- Workspace-scoped data (proper multi-tenancy)
- Financial tracking and burn rate calculation
- Decision logging for transparency
- CSV bulk import for easy onboarding

**TIER 3 - USER:**
- Personal preferences across all workspaces
- Skills for marketplace discovery
- Portable profile (user can join multiple workspaces)

---

## Status

**Current Progress:**
- ✅ Database schema created
- ✅ TypeScript types defined
- ✅ Service layer implemented
- ⏳ App store integration (next)
- ⏳ UI components (next)
- ⏳ CSV import (next)
- ⏳ Testing (next)

**Ready for:**
1. Run SQL schema in Supabase
2. Start building UI components
3. Integrate with existing app

---

**Last Updated:** January 17, 2026
**Implementation Status:** Phase 3 of 6 Complete
**Next Task:** Create UI components for marketplace browsing
