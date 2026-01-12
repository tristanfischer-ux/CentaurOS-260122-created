# Fractional Foundry Implementation Roadmap

**Status**: Centaur OS currently implements ~70% of the business plan. This roadmap closes the gap.

---

## 🎯 Strategic Gap Analysis

### What We Have (✅ 70% Complete)
- ✅ 3-tier role system (Founder/Exec/Apprentice)
- ✅ OKR management system
- ✅ Task execution & review workflows
- ✅ Financial dashboard with burn rate tracking
- ✅ Supplier directory (30+ UK manufacturers)
- ✅ AI agents library (37 agents)
- ✅ Team org chart and directory
- ✅ Basic events system
- ✅ Professional reporting (board packs, PDF)

### Critical Gaps (🔴 Must Build)

| Gap | Business Plan Requirement | Current State | Impact |
|-----|---------------------------|---------------|---------|
| **1. Active Marketplace** | Browse 1000s of executives/apprentices, hire on-demand | Static demo data (30+30) | 🔴 CRITICAL |
| **2. Invitation System** | Send invites → Counter-offers → Engagements | Types exist, zero UI | 🔴 CRITICAL |
| **3. Guilds** | Cross-company knowledge sharing, collaborative learning | Events only, no guilds | 🟡 HIGH |
| **4. Multi-Company** | Execs work across 2-3 startups simultaneously | Single workspace view | 🟡 HIGH |
| **5. Cloud Mfg** | On-demand manufacturing with order tracking | Directory only | 🟠 MEDIUM |
| **6. Apprentice Discovery** | Apprentices build portfolios, get discovered | Internal team view | 🟠 MEDIUM |

---

## 📋 5-Phase Implementation Plan

### **Phase 1: Active Marketplace** (🔴 CRITICAL - Week 1-2)
**Goal**: Transform static directories into live, searchable talent marketplaces

#### 1.1 Executive Marketplace
- [ ] Convert Community tab to have 3 sub-tabs: **Executives | Apprentices | Events**
- [ ] Build paginated executive listing with real filters (function, availability, rate range)
- [ ] Add executive profile pages with:
  - Full bio, experience, skills, certifications
  - Current engagements (shows 1/3 slots filled)
  - Reviews and ratings from previous founders
  - "Send Invitation" button
- [ ] Add search with multi-criteria (skills, function, location, availability)

#### 1.2 Apprentice Marketplace
- [ ] Build apprentice listing page (similar to executives)
- [ ] Apprentice profiles include:
  - Skills matrix with proficiency levels
  - Learning goals and portfolio projects
  - Education and certifications
  - "Send Invitation" button
- [ ] Add filters: function interest, skill level, availability, rate

#### 1.3 Mock Data Expansion
- [ ] Expand to 100+ executives with diverse backgrounds
- [ ] Expand to 100+ apprentices across all functions
- [ ] Add realistic availability: "2 days/week available", "Full-time available"

**Success Metrics**:
- ✅ Founders can browse 200+ talent profiles
- ✅ Search/filter returns relevant results in <1s
- ✅ Every profile has "Send Invitation" CTA

---

### **Phase 2: Invitation & Engagement System** (🔴 CRITICAL - Week 2-3)
**Goal**: Enable actual hiring workflow from invitation to engagement

#### 2.1 Send Invitation Flow (Founder → Exec/Apprentice)
- [ ] "Send Invitation" modal with fields:
  - Role name (e.g., "VP of Sales", "Marketing Apprentice")
  - Commitment (days/week or hours/week)
  - Proposed rate (day rate or hourly)
  - Start date
  - Message (pitch)
- [ ] Create invitation record in database
- [ ] Email notification to invited user (via mailto link)

#### 2.2 Invitation Management (For Executives/Apprentices)
- [ ] New **"My Invitations"** screen (accessible from Settings or new tab)
- [ ] List pending invitations with company details
- [ ] Actions per invitation:
  - Accept (creates engagement)
  - Decline (with optional message)
  - Counter-offer (different rate/commitment)
- [ ] Show accepted invitations (now engagements)

#### 2.3 Engagement Tracking
- [ ] **"My Engagements"** screen for Execs/Apprentices
- [ ] List active engagements with:
  - Company name, role, commitment (2 days/week)
  - Start date, status (active/paused/ended)
  - Quick link to switch workspace (if multi-company implemented)
- [ ] For Founders: **"Team Engagements"** page showing who's hired, rates, commitment

#### 2.4 Workspace Switching (For Multi-Company)
- [ ] Add workspace switcher in header (dropdown or modal)
- [ ] Show all workspaces where user has membership
- [ ] Indicate current workspace with checkmark
- [ ] Switch workspace = reload app with new workspace context

**Success Metrics**:
- ✅ Founder sends invitation → Exec receives it
- ✅ Exec accepts → Engagement created → Added to company workspace
- ✅ Exec can view all engagements (2-3 companies)

---

### **Phase 3: Guilds & Cross-Company Collaboration** (🟡 HIGH - Week 4-5)
**Goal**: Enable knowledge sharing across companies, build network effects

#### 3.1 Guild Concept
A **Guild** is a cross-company community of practice (e.g., "Hardware Design Guild", "Fundraising Guild")

**Features**:
- [ ] Guild directory (browse all guilds)
- [ ] Guild detail page with:
  - Members (executives/apprentices across companies)
  - Resources (templates, guides, best practices)
  - Discussion threads
  - Events (guild-specific workshops/office hours)
- [ ] Join guild (public) or request membership (private)

#### 3.2 Guild Resources Library
- [ ] Each guild has a **Resources** section
- [ ] Upload templates (Figma files, pitch decks, financial models)
- [ ] Link to external guides (Notion, Google Docs)
- [ ] Tag resources by function and topic

#### 3.3 Guild Discussions
- [ ] Simple threaded discussion board per guild
- [ ] Post questions, share learnings
- [ ] Upvote valuable posts
- [ ] Tag posts (Question, Best Practice, Case Study)

#### 3.4 Guild Events Integration
- [ ] Link community events to guilds
- [ ] Filter events by guild
- [ ] Guild members get notifications for guild events

**Data Model**:
```typescript
interface Guild {
  id: string;
  name: string;
  description: string;
  function?: Function; // optional
  isPublic: boolean;
  memberCount: number;
  resourceCount: number;
  createdBy: string; // User ID
  createdAt: string;
}

interface GuildMembership {
  id: string;
  guildId: string;
  userId: string;
  role: 'member' | 'moderator' | 'founder';
  joinedAt: string;
}

interface GuildResource {
  id: string;
  guildId: string;
  title: string;
  description: string;
  type: 'template' | 'guide' | 'tool' | 'article';
  url: string;
  uploadedBy: string;
  tags: string[];
  upvotes: number;
  createdAt: string;
}

interface GuildPost {
  id: string;
  guildId: string;
  authorId: string;
  title: string;
  content: string;
  type: 'question' | 'best-practice' | 'case-study' | 'discussion';
  upvotes: number;
  replyCount: number;
  createdAt: string;
}
```

**Success Metrics**:
- ✅ 10+ guilds created (one per function + cross-functional)
- ✅ Users can join guilds
- ✅ Resources shared across companies
- ✅ Discussion threads active

---

### **Phase 4: Multi-Company Workflows** (🟡 HIGH - Week 5-6)
**Goal**: Enable executives to work across multiple startups simultaneously

#### 4.1 Availability Tracking
- [ ] Executive profile shows availability:
  - Total capacity: 5 days/week
  - Current engagements: Company A (2 days), Company B (2 days)
  - Available: 1 day/week
- [ ] Visual availability calendar (heatmap or progress bar)

#### 4.2 Workspace Selector Enhancement
- [ ] Header shows current workspace with dropdown
- [ ] Workspace list shows:
  - Company name
  - Your role (Exec, Apprentice)
  - Commitment (2 days/week)
  - Unread notifications badge
- [ ] Switch workspace → Load that workspace's data

#### 4.3 Cross-Workspace Notifications
- [ ] Notifications tab shows activity from all workspaces
- [ ] Group by workspace
- [ ] Click notification → Switch to that workspace

#### 4.4 Unified Calendar (Future)
- [ ] Calendar view showing tasks/events across all workspaces
- [ ] Color-coded by company
- [ ] Filter by workspace

**Success Metrics**:
- ✅ Exec works in 3 different companies (2+2+1 days)
- ✅ Workspace switcher works seamlessly
- ✅ No data leakage between workspaces (RBAC enforced)

---

### **Phase 5: Cloud Manufacturing & Supplier Orders** (🟠 MEDIUM - Week 7-8)
**Goal**: Make supplier directory actionable with order placement and tracking

#### 5.1 Supplier Order Placement
- [ ] "Request Quote" button on supplier profiles
- [ ] Quote request form:
  - Part description
  - Quantity
  - Material/specs
  - Desired lead time
  - Attach files (CAD, drawings)
- [ ] Email quote request to supplier (via mailto)

#### 5.2 Supplier Orders Management
- [ ] New **"Orders"** section in Make tab
- [ ] List all orders with:
  - Supplier name
  - Part/project name
  - Quantity, unit cost, total cost
  - Status (quote requested, quoted, ordered, in production, delivered)
  - Expected delivery date
- [ ] Track order status (manual updates for now)

#### 5.3 Supplier Engagement Detail
- [ ] View order history with a supplier
- [ ] Track total spend with supplier
- [ ] Add notes/feedback per order

#### 5.4 Manufacturing Workflow (Advanced)
- [ ] Link tasks to supplier orders (e.g., "Review prototypes from Acme")
- [ ] Milestone tracking (Design review → Prototype → Production → QC → Delivery)
- [ ] Integrate with OKRs (e.g., KR: "Deliver 1000 units by Q2")

**Data Model**:
```typescript
interface SupplierOrder {
  id: string;
  workspaceId: string;
  supplierId: string;
  partName: string;
  description: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  currency: string;
  status: 'quote-requested' | 'quoted' | 'ordered' | 'in-production' | 'quality-check' | 'delivered';
  requestedBy: string; // User ID
  requestedAt: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}
```

**Success Metrics**:
- ✅ Founders can request quotes from suppliers
- ✅ Track order status (quote → production → delivered)
- ✅ View total manufacturing spend

---

## 🎨 Design System Updates

### New Components Needed

1. **MarketplaceCard** - Unified card for executives/apprentices with:
   - Avatar, name, headline
   - Key stats (experience, rating, availability)
   - Quick action buttons (View Profile, Send Invitation)

2. **ProfilePage** - Full profile template with tabs:
   - Overview (bio, stats)
   - Experience (timeline)
   - Skills (matrix)
   - Reviews (ratings + testimonials)

3. **InvitationCard** - Display pending/accepted invitations with:
   - Company info
   - Role details (commitment, rate)
   - Actions (Accept, Decline, Counter-offer)

4. **EngagementCard** - Show active engagements with:
   - Company name, logo
   - Role, commitment (2 days/week)
   - Status indicator (active, paused)
   - Quick link to workspace

5. **GuildCard** - Guild listing card with:
   - Guild name, description
   - Member count, resource count
   - Join button

6. **OrderCard** - Supplier order card with:
   - Supplier name
   - Part/project name
   - Status badge (quote requested, in production, etc.)
   - Cost and delivery date

---

## 📐 Architecture Changes

### Navigation Updates

**Before** (7 tabs):
```
Home | Decide | Do | Evaluate | Make | Community | Settings
```

**After** (8 tabs):
```
Home | Decide | Do | Evaluate | Make | Marketplace | Guilds | Settings
```

**OR** (Keep 7 tabs, reorganize):
```
Home | Decide | Do | Evaluate | Make | Community (Events+Guilds) | Settings
```
- Settings gains: My Invitations, My Engagements

### New Screens

1. `/marketplace` - Browse executives and apprentices
2. `/marketplace/[id]` - Executive/Apprentice profile
3. `/invitations` - Manage invitations (send, receive)
4. `/engagements` - View all engagements (for execs/apprentices)
5. `/guilds` - Browse guilds
6. `/guilds/[id]` - Guild detail (members, resources, discussions)
7. `/orders` - Manage supplier orders

### Data Model Extensions

**New Types**:
- `Invitation` (already exists in types, needs UI)
- `Engagement` (already exists in types, needs UI)
- `Guild`, `GuildMembership`, `GuildResource`, `GuildPost` (new)
- `SupplierOrder` (new)
- `AvailabilitySlot` (for exec scheduling)

---

## 🚀 Implementation Priority

### Must-Do First (Weeks 1-3)
1. **Phase 1: Marketplace** - Browse executives/apprentices
2. **Phase 2: Invitations** - Hire talent
3. **Phase 4: Workspace Switching** - Multi-company support

**Why**: These unlock the core value proposition (on-demand talent marketplace)

### Nice-to-Have Next (Weeks 4-6)
4. **Phase 3: Guilds** - Cross-company collaboration
5. **Phase 5: Manufacturing** - Supplier orders

**Why**: These add network effects but aren't blocking core workflow

---

## 🎯 Success Criteria

After completing all 5 phases, Centaur OS will:

✅ **Enable Fractional Model**:
- Founders browse 200+ executives/apprentices
- Send invitations with custom terms
- Execs/Apprentices accept and join workspaces
- Execs work across 2-3 companies simultaneously

✅ **Build Network Effects**:
- Guilds enable cross-company knowledge sharing
- Resources (templates, guides) shared via guilds
- Discussions help members solve common problems

✅ **Operationalize Manufacturing**:
- Founders request quotes from suppliers
- Track orders from quote → delivery
- View total manufacturing spend

✅ **Match Business Plan Vision**:
- "Hire fractional executives on-demand" ✅
- "Apprentice workforce for execution" ✅
- "Collaborative guilds for learning" ✅
- "Cloud manufacturing" ✅

---

## 📊 Estimated Effort

| Phase | Effort | Impact |
|-------|--------|--------|
| Phase 1: Marketplace | 2 weeks | 🔴 Critical |
| Phase 2: Invitations | 1 week | 🔴 Critical |
| Phase 3: Guilds | 2 weeks | 🟡 High |
| Phase 4: Multi-Company | 1 week | 🟡 High |
| Phase 5: Manufacturing | 2 weeks | 🟠 Medium |
| **Total** | **8 weeks** | **Full Business Plan** |

---

## 🎬 Next Steps

1. **Get alignment** on phase priority
2. **Start Phase 1**: Marketplace UI (executives/apprentices browsing)
3. **Mock data**: Expand to 100+ profiles per role
4. **Design first**: Create MarketplaceCard and ProfilePage components
5. **Build incrementally**: Ship each sub-phase as it's done

**Ready to start implementation?** I recommend beginning with:
- Phase 1.1: Executive Marketplace listing (Community tab → Executives sub-tab)
- Create 100 mock executive profiles with realistic data
- Add search and filter functionality

This gives immediate visual impact and validates the marketplace concept before building invitations.
