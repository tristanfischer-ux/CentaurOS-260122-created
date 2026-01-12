# CentaurOS Ecosystem Onboarding System - Implementation Plan

**Status**: Planning Phase
**Created**: January 12, 2026
**Priority**: High - Core Platform Feature

---

## 🎯 Executive Summary

Create a self-service onboarding system that allows executives, apprentices, and manufacturing companies to join the CentaurOS ecosystem independently, while giving founders the ability to discover, invite, and manage these relationships across multiple companies.

---

## 📋 Current State vs. Desired State

### Current State
- **Fixed Team Structure**: Mock data with predefined team members
- **Single Company**: Each user belongs to one workspace
- **No Discovery**: Cannot find or invite external talent
- **No Multi-Company**: Executives cannot work across multiple companies

### Desired State
- **Dynamic Onboarding**: Anyone can self-register as Founder/Executive/Apprentice
- **Marketplace Model**: Founders discover and invite talent from ecosystem
- **Multi-Company Support**: Executives manage multiple client engagements
- **Company Profiles**: Manufacturing companies can list their services
- **Role-Based Experiences**: Different interfaces for different user types

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    CentaurOS Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Founders   │  │  Executives  │  │ Apprentices  │         │
│  │              │  │              │  │              │         │
│  │  Create      │  │  Join        │  │  Join        │         │
│  │  Companies   │  │  Multiple    │  │  Companies   │         │
│  │              │  │  Companies   │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Global Talent Marketplace                │         │
│  │  - Executive Directory                           │         │
│  │  - Apprentice Directory                          │         │
│  │  - Manufacturing Company Directory               │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Phases

### Phase 1: Initial Onboarding Flow (Week 1-2)

**Goal**: Replace single-path onboarding with role selection system

#### 1.1 Welcome Screen (NEW)
**Location**: `src/app/onboarding-welcome.tsx`

**UI Design**:
```
┌─────────────────────────────────────────────┐
│                                             │
│        Welcome to CentaurOS                 │
│   The Operating System for Lean Hardware   │
│              Startups                       │
│                                             │
│         [Rocket Icon - Large]               │
│                                             │
│         I want to...                        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  👑  Start My Company (Founder)     │   │
│  │      Build and manage your startup  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  💼  Offer Executive Services       │   │
│  │      Help startups part-time        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🎓  Work as an Apprentice          │   │
│  │      Learn while contributing       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🏭  List My Manufacturing Company  │   │
│  │      Connect with hardware startups │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Technical Details**:
- **State Management**: Store role selection in AsyncStorage
- **Navigation**: Route to appropriate onboarding flow
- **Analytics**: Track which roles are most popular

---

#### 1.2 Founder Onboarding (ENHANCED)
**Location**: `src/app/onboarding-founder.tsx`

**Flow**:
1. **Company Setup** (NEW)
   - Company name
   - Industry (Hardware, IoT, Robotics, Electronics, etc.)
   - Stage (Pre-seed, Seed, Series A, etc.)
   - Description
   - Website (optional)

2. **Founder Profile**
   - Full name
   - Email
   - Phone
   - Location
   - LinkedIn (optional)
   - Bio (what you're building)

3. **Feature Tour**
   - Existing onboarding walkthrough
   - Now ends with: "Ready to build your team? Visit the Marketplace tab to invite executives and apprentices."

**Data Structure**:
```typescript
interface Company {
  id: string;
  name: string;
  industry: string;
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b+';
  description: string;
  website?: string;
  foundedDate: string;
  founderIds: string[];
  teamSize: number;
  isActive: boolean;
}

interface FounderProfile {
  userId: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  linkedIn?: string;
  bio: string;
  onboardedAt: string;
}
```

---

#### 1.3 Executive Onboarding (NEW)
**Location**: `src/app/onboarding-executive.tsx`

**Flow**:
1. **Personal Details**
   - Full name
   - Email
   - Phone
   - Location
   - Profile photo (optional)

2. **Professional Experience**
   - Primary function (Finance, Sales, Marketing, Ops, Engineering, Admin)
   - Years of experience
   - Previous companies (free text, 3 max)
   - Key achievements (free text)
   - LinkedIn profile

3. **Service Details**
   - Availability (1 day/week, 2 days/week, 3 days/week, Full-time)
   - Day rate (£/day)
   - Start date availability
   - Remote/Hybrid/In-person preference
   - Willing to travel? (Yes/No)

4. **Skills & Expertise**
   - Select primary skills (multi-select)
   - Certifications (optional)
   - Industries specialized in
   - Company stages preferred (pre-seed, seed, etc.)

5. **Bio & Pitch**
   - Professional bio (what you help startups with)
   - Why you do fractional work
   - References available? (Yes/No)

**UI Design**:
```
┌─────────────────────────────────────────────┐
│                                             │
│      Join as Fractional Executive           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Function (Primary Expertise)        │   │
│  │  ▼ Finance                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Day Rate: £ [____] /day                    │
│                                             │
│  Availability:                              │
│  ○ 1 day/week   ● 2 days/week               │
│  ○ 3 days/week  ○ Full-time                 │
│                                             │
│  Skills (select all that apply):            │
│  ☑ Financial Modeling                       │
│  ☑ Fundraising                              │
│  ☑ Unit Economics                           │
│  ☐ Board Reporting                          │
│                                             │
│  Bio (tell startups what you do):           │
│  ┌─────────────────────────────────────┐   │
│  │ I help hardware startups build...   │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Continue to Preview]                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Data Structure**:
```typescript
interface ExecutiveProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  profilePhoto?: string;
  linkedIn?: string;

  // Professional
  primaryFunction: Function;
  yearsExperience: number;
  previousCompanies: string[];
  achievements: string;

  // Service
  availability: '1-day' | '2-day' | '3-day' | 'full-time';
  dayRate: number; // £/day
  startDateAvailable: string;
  workPreference: 'remote' | 'hybrid' | 'in-person';
  willingToTravel: boolean;

  // Skills
  skills: string[];
  certifications?: string[];
  industriesSpecialized: string[];
  stagesPreferred: string[];

  // Bio
  bio: string;
  whyFractional: string;
  referencesAvailable: boolean;

  // Status
  isAvailable: boolean;
  currentEngagements: string[]; // companyIds
  maxEngagements: number; // e.g., 3 companies max
  rating?: number;
  reviewCount?: number;

  onboardedAt: string;
}
```

---

#### 1.4 Apprentice Onboarding (NEW)
**Location**: `src/app/onboarding-apprentice.tsx`

**Flow**:
1. **Personal Details**
   - Full name
   - Email
   - Phone
   - Location
   - Date of birth (for junior positions)
   - Profile photo (optional)

2. **Education & Background**
   - Highest education level
   - Field of study
   - University/College (optional)
   - Graduation year (or expected)

3. **Function Interest**
   - What function are you interested in? (Finance, Sales, Marketing, Ops, Engineering, Admin)
   - Why this function? (free text)

4. **Current Skills**
   - Technical skills (select from list)
   - Soft skills (select from list)
   - Tools you know (Excel, Python, CAD, etc.)
   - Portfolio/GitHub/Projects (optional links)

5. **Learning Goals**
   - What do you want to learn?
   - Career goals (where do you see yourself in 2 years?)
   - Preferred learning style (hands-on, structured, mentorship)

6. **Availability**
   - Full-time or Part-time
   - Start date
   - Expected day rate (£/day) - auto-calculated based on experience

**UI Design**:
```
┌─────────────────────────────────────────────┐
│                                             │
│         Join as an Apprentice               │
│                                             │
│  What function interests you most?          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ● Finance    ○ Sales                 │   │
│  │ ○ Marketing  ○ Operations            │   │
│  │ ○ Engineering ○ Admin                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Current Skills:                            │
│  ☑ Excel (Intermediate)                     │
│  ☑ Communication (Advanced)                 │
│  ☐ Python (Beginner)                        │
│                                             │
│  What do you want to learn?                 │
│  ┌─────────────────────────────────────┐   │
│  │ I want to learn financial modeling  │   │
│  │ and help startups build...          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Availability:                              │
│  ● Full-time  ○ Part-time                   │
│                                             │
│  Expected Rate: £140/day                    │
│  (Based on your experience level)           │
│                                             │
│  [Complete Profile]                         │
│                                             │
└─────────────────────────────────────────────┘
```

**Data Structure**:
```typescript
interface ApprenticeProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  dateOfBirth?: string;
  profilePhoto?: string;

  // Education
  educationLevel: 'high-school' | 'bachelors' | 'masters' | 'phd';
  fieldOfStudy: string;
  university?: string;
  graduationYear: number;

  // Function
  functionInterest: Function;
  whyThisFunction: string;

  // Skills
  technicalSkills: { name: string; level: 'beginner' | 'intermediate' | 'advanced' }[];
  softSkills: { name: string; level: 'beginner' | 'intermediate' | 'advanced' }[];
  toolsKnown: string[];
  portfolioLinks?: string[];

  // Goals
  learningGoals: string;
  careerGoals: string;
  learningStyle: 'hands-on' | 'structured' | 'mentorship';

  // Availability
  availability: 'full-time' | 'part-time';
  startDate: string;
  dayRate: number; // £/day

  // Status
  isAvailable: boolean;
  currentCompanyId?: string;
  rating?: number;
  reviewCount?: number;
  tasksCompleted?: number;

  onboardedAt: string;
}
```

---

### Phase 2: Marketplace Discovery (Week 3-4)

**Goal**: Create marketplace for founders to discover and invite talent

#### 2.1 Marketplace Tab (NEW)
**Location**: `src/app/(tabs)/marketplace.tsx`

**UI Design**:
```
┌─────────────────────────────────────────────┐
│  Marketplace    [Search...] [Filter]        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Executives  │  Apprentices  │  Mfg   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📊 Finance Executives (12 available)       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [Photo] James Mitchell               │   │
│  │         18 years experience          │   │
│  │         £950/day · 2 days/week       │   │
│  │         ⭐ 4.9 (23 reviews)           │   │
│  │         Currently: 2/3 engagements   │   │
│  │         [View Profile] [Invite]      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [Photo] Sarah Chen                   │   │
│  │         12 years experience          │   │
│  │         £850/day · 3 days/week       │   │
│  │         ⭐ 5.0 (31 reviews)           │   │
│  │         Currently: 1/3 engagements   │   │
│  │         [View Profile] [Invite]      │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Features**:
- **Search**: By name, skills, location
- **Filters**:
  - Function
  - Availability
  - Day rate range
  - Experience years
  - Location
  - Rating
- **Sort**: By rating, price, availability, experience
- **Cards**: Compact profile cards with key info
- **Actions**: View full profile, Send invitation

#### 2.2 Profile Detail Modal
**UI Design**:
```
┌─────────────────────────────────────────────┐
│  [Photo]  James Mitchell              [X]   │
│           Fractional CFO                    │
│           ⭐ 4.9 (23 reviews)                │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Overview                                │
│  18 years experience in Finance             │
│  £950/day · 2 days/week available           │
│  Remote/Hybrid · Edinburgh, UK              │
│                                             │
│  📖 Bio                                     │
│  "I help hardware startups build financial  │
│   models, secure funding, and establish     │
│   unit economics frameworks..."             │
│                                             │
│  💼 Previous Work                           │
│  • Helped 10+ startups raise Series A       │
│  • Ex-CFO at RobotCo (acquired 2021)        │
│  • Built finance function at 3 startups     │
│                                             │
│  🎯 Skills & Expertise                      │
│  ☑ Financial Modeling                       │
│  ☑ Fundraising (Series A/B)                 │
│  ☑ Unit Economics                           │
│  ☑ Board Reporting                          │
│                                             │
│  📊 Current Engagements                     │
│  Working with 2 companies (1 slot open)     │
│  • Hardware IoT Startup (6 months)          │
│  • Robotics Company (3 months)              │
│                                             │
│  ⭐ Reviews (23)                             │
│  "James transformed our financial ops..."   │
│  - Founder, DroneStartup                    │
│                                             │
│  [Send Invitation] [Message]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Phase 3: Invitation & Engagement System (Week 5-6)

**Goal**: Allow founders to send invitations and manage relationships

#### 3.1 Invitation Flow

**For Founders**:
1. Click "Invite" on executive/apprentice profile
2. Modal appears:
   ```
   ┌─────────────────────────────────────────┐
   │  Invite James Mitchell                   │
   ├─────────────────────────────────────────┤
   │                                          │
   │  Company: [Your Startup Name]            │
   │                                          │
   │  Role: Fractional CFO                    │
   │                                          │
   │  Function: ● Finance                     │
   │                                          │
   │  Commitment:                             │
   │  ● 2 days/week  ○ 3 days/week            │
   │  ○ Custom: [_] days/week                 │
   │                                          │
   │  Start Date: [Date Picker]               │
   │                                          │
   │  Rate: £950/day                          │
   │  (Negotiable after acceptance)           │
   │                                          │
   │  Message (optional):                     │
   │  ┌────────────────────────────────────┐ │
   │  │ Hi James, we're building a...      │ │
   │  └────────────────────────────────────┘ │
   │                                          │
   │  [Cancel]  [Send Invitation]             │
   │                                          │
   └─────────────────────────────────────────┘
   ```

3. Invitation sent notification
4. Invitation appears in "Pending Invitations" list

**For Executives/Apprentices**:
1. Receive notification: "New invitation from [Company Name]"
2. View invitation in "Invitations" tab
3. See company details, role, commitment, rate
4. Actions: Accept, Decline, Counter-offer (rate/availability)

**Data Structure**:
```typescript
interface Invitation {
  id: string;
  fromCompanyId: string;
  toUserId: string;
  toUserRole: 'FractionalExec' | 'Apprentice';

  // Details
  roleName: string; // e.g., "Fractional CFO"
  function: Function;
  commitment: string; // e.g., "2 days/week"
  startDate: string;
  proposedRate: number; // £/day
  message?: string;

  // Status
  status: 'pending' | 'accepted' | 'declined' | 'counter-offered' | 'expired';
  sentAt: string;
  respondedAt?: string;
  expiresAt: string; // 7 days from sent

  // Counter-offer (if applicable)
  counterOffer?: {
    rate: number;
    commitment: string;
    startDate: string;
    message: string;
  };
}
```

#### 3.2 Invitations Tab (NEW)
**Location**: Appears in Settings or as a new main tab for Executives/Apprentices

**For Executives/Apprentices**:
```
┌─────────────────────────────────────────────┐
│  Invitations                                │
├─────────────────────────────────────────────┤
│                                             │
│  📬 Pending (2)                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  DroneStartup Ltd                    │   │
│  │  Fractional CFO · Finance            │   │
│  │  2 days/week · £950/day              │   │
│  │  "Hi James, we're building..."       │   │
│  │                                      │   │
│  │  [View Company] [Accept] [Decline]   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ✅ Accepted (3)                            │
│  ❌ Declined (1)                            │
│                                             │
└─────────────────────────────────────────────┘
```

**For Founders**:
```
┌─────────────────────────────────────────────┐
│  Team Invitations                           │
├─────────────────────────────────────────────┤
│                                             │
│  ⏳ Pending (2)                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [Photo] James Mitchell              │   │
│  │           Fractional CFO             │   │
│  │           Invited 2 days ago         │   │
│  │           [View] [Withdraw]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ✅ Accepted (1)                            │
│  ❌ Declined (0)                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Phase 4: Multi-Company Management (Week 7-8)

**Goal**: Allow executives to manage multiple client engagements

#### 4.1 Executive Dashboard (NEW)
**Location**: `src/app/(tabs)/executive-dashboard.tsx` (replaces home for Executives)

**UI Design**:
```
┌─────────────────────────────────────────────┐
│  My Engagements                    [+ New]  │
├─────────────────────────────────────────────┤
│                                             │
│  Active Engagements (2/3 slots)             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🏢 DroneStartup Ltd                 │   │
│  │     Fractional CFO · Finance         │   │
│  │     2 days/week · Started Jan 2024   │   │
│  │                                      │   │
│  │     📊 This Week:                    │   │
│  │     • 5 tasks pending review         │   │
│  │     • 12 hours logged                │   │
│  │     • Board pack due Friday          │   │
│  │                                      │   │
│  │     [Enter Workspace] [Details]      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🏢 RobotCo Inc                      │   │
│  │     Fractional CFO · Finance         │   │
│  │     1 day/week · Started Mar 2024    │   │
│  │                                      │   │
│  │     📊 This Week:                    │   │
│  │     • 2 tasks pending review         │   │
│  │     • 8 hours logged                 │   │
│  │     • Financial model review done    │   │
│  │                                      │   │
│  │     [Enter Workspace] [Details]      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  💰 This Month                              │
│  £7,600 invoiced · 16 days worked           │
│                                             │
│  📬 Invitations (1 pending)                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Features**:
- **Company Switcher**: Quick toggle between client workspaces
- **Aggregated View**: See all tasks, hours, deadlines across companies
- **Capacity Management**: Visual indicator of availability (e.g., "2/3 slots filled")
- **Financial Tracking**: Monthly revenue, hours worked, invoicing status
- **Invitations**: Manage new opportunities

#### 4.2 Workspace Context Switcher
**Implementation**:
- Top navigation bar shows current company
- Dropdown to switch between companies
- Each workspace has isolated data (tasks, OKRs, reports)
- Executive sees only their function's work in each company

```
┌─────────────────────────────────────────────┐
│  [Logo] DroneStartup Ltd ▼    [Profile]    │
│         ─────────────────                   │
│         ● DroneStartup Ltd (Finance)        │
│         ○ RobotCo Inc (Finance)             │
│         ─────────────────                   │
│         ○ Return to Dashboard               │
└─────────────────────────────────────────────┘
```

---

### Phase 5: Manufacturing Company Onboarding (Week 9-10)

**Goal**: Allow manufacturing companies to list services in ecosystem

#### 5.1 Manufacturing Company Onboarding
**Location**: `src/app/onboarding-manufacturing.tsx`

**Flow**:
1. **Company Details**
   - Company name
   - Location (address, city, postcode)
   - Website
   - Year established
   - Company size (employees)
   - Certifications (ISO 9001, ISO 13485, etc.)

2. **Capabilities**
   - Manufacturing processes (multi-select):
     - CNC Machining
     - Injection Molding
     - 3D Printing
     - PCB Assembly
     - Sheet Metal Fabrication
     - Die Casting
     - Laser Cutting
     - Etc.
   - Materials expertise
   - Minimum order quantities
   - Lead times (typical)
   - Maximum part size

3. **Pricing & Terms**
   - Pricing model (per unit, per hour, project-based)
   - Typical project size (£5k-50k, £50k-250k, etc.)
   - Payment terms (Net 30, 50% upfront, etc.)
   - NDA available? (Yes/No)

4. **Portfolio**
   - Upload photos of previous work (up to 10)
   - Case studies (optional)
   - Industries served

5. **Contact**
   - Primary contact name
   - Email
   - Phone
   - Preferred contact method

**Data Structure**:
```typescript
interface ManufacturingCompany {
  id: string;
  name: string;
  location: string;
  website: string;
  yearEstablished: number;
  employeeCount: string;
  certifications: string[];

  // Capabilities
  processes: string[];
  materials: string[];
  minOrderQuantity: string;
  leadTimes: string;
  maxPartSize: string;

  // Pricing
  pricingModel: 'per-unit' | 'per-hour' | 'project-based';
  typicalProjectSize: string;
  paymentTerms: string;
  ndaAvailable: boolean;

  // Portfolio
  photos: string[];
  caseStudies?: string[];
  industriesServed: string[];

  // Contact
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    preferredMethod: 'email' | 'phone' | 'both';
  };

  // Status
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  projectsCompleted?: number;

  onboardedAt: string;
}
```

---

## 🗄️ Data Model Changes

### New Collections/Tables

```typescript
// Global talent pools (not workspace-specific)
users: {
  id: string;
  email: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice' | 'Manufacturer';
  onboardedAt: string;
  profileCompleted: boolean;
}

founderProfiles: {
  userId: string;
  companyId: string;
  // ... (defined above)
}

executiveProfiles: {
  userId: string;
  // ... (defined above)
}

apprenticeProfiles: {
  userId: string;
  // ... (defined above)
}

manufacturingCompanies: {
  id: string;
  // ... (defined above)
}

// Multi-company relationships
companies: {
  id: string;
  name: string;
  industry: string;
  stage: string;
  // ... (defined above)
}

engagements: {
  id: string;
  companyId: string;
  userId: string;
  userRole: 'FractionalExec' | 'Apprentice';
  function: Function;
  commitment: string;
  rate: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'ended';
}

invitations: {
  id: string;
  // ... (defined above)
}

// Workspace-specific data (unchanged but now scoped to companyId)
workspaces: {
  id: string;
  companyId: string; // NEW: links to company
  name: string;
  // ... existing fields
}

memberships: {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: Function;
  engagementId?: string; // NEW: links to engagement
  // ... existing fields
}
```

---

## 🎨 UI/UX Considerations

### Navigation Changes

**For Founders**:
```
Home | Marketplace | OKRs | Work | Team | Reviews | Organization | Events | Settings
       ^^^^^^^^^^^
         NEW TAB
```

**For Executives**:
```
Dashboard | [Company A] | [Company B] | Invitations | Profile | Settings
^^^^^^^^^^^   ^^^^^^^^^^^   ^^^^^^^^^^^   ^^^^^^^^^^^
    NEW          SWITCHER      SWITCHER       NEW
```

**For Apprentices**:
```
Home | Work | Reviews | Learning | Invitations | Profile
                                   ^^^^^^^^^^^
                                       NEW
```

### Role-Based Routing

**App Entry Point**: `src/app/_layout.tsx`

```typescript
// Determine user's primary role and route accordingly
const userRole = currentUser?.role;

if (!userRole) {
  // First-time user → Onboarding Welcome
  return <OnboardingWelcome />;
}

if (userRole === 'Founder') {
  return <FounderTabs />;
} else if (userRole === 'FractionalExec') {
  return <ExecutiveDashboard />;
} else if (userRole === 'Apprentice') {
  return <ApprenticeTabs />;
}
```

---

## 🔐 Permissions & Access Control

### RBAC Updates

```typescript
// NEW: Multi-workspace permissions
type Permission =
  | 'view:marketplace'           // Founders only
  | 'send:invitation'            // Founders only
  | 'manage:engagements'         // Executives/Apprentices
  | 'switch:workspace'           // Executives with multiple engagements
  | 'view:all-companies'         // Platform admin
  | 'approve:manufacturing'      // Platform admin
  // ... existing permissions

// NEW: Context-aware permissions
function hasPermission(
  user: User,
  permission: Permission,
  workspaceId?: string
): boolean {
  const membership = user.memberships.find(m => m.workspaceId === workspaceId);

  if (permission === 'view:marketplace') {
    return user.role === 'Founder';
  }

  if (permission === 'send:invitation') {
    return membership?.role === 'Founder';
  }

  if (permission === 'switch:workspace') {
    return user.engagements.filter(e => e.status === 'active').length > 1;
  }

  // ... existing permission logic
}
```

---

## 📊 Analytics & Metrics

### Track Key Metrics

**Onboarding**:
- Conversion rates by role (Founder/Exec/Apprentice/Mfg)
- Time to complete onboarding
- Profile completion rates
- Drop-off points

**Marketplace**:
- Search queries
- Profile views
- Invitation sent vs accepted rate
- Time to accept/decline invitation
- Counter-offer frequency

**Engagement**:
- Average engagements per executive
- Engagement duration (how long executives stay with companies)
- Churn rate (executives leaving ecosystem)
- Revenue per executive (total earnings)

**Multi-Company**:
- Executives working across multiple companies (%)
- Average number of concurrent engagements
- Workspace switching frequency

---

## 🚧 Technical Challenges & Solutions

### Challenge 1: Data Persistence
**Problem**: Currently using MMKV/AsyncStorage (local only)
**Solution**: Phase 1 can continue with local storage for MVP, but Phase 4+ requires backend (Firebase/Supabase)

### Challenge 2: Multi-Workspace State Management
**Problem**: Zustand store is single-workspace
**Solution**:
```typescript
// NEW: Multi-workspace store structure
interface AppState {
  currentUserId: string;
  currentWorkspaceId: string | null;

  // Workspace-specific data indexed by workspaceId
  workspaces: Record<string, {
    tasks: Task[];
    okrs: Objective[];
    // ... other workspace data
  }>;

  // Global user data
  userProfile: ExecutiveProfile | ApprenticeProfile | FounderProfile;
  engagements: Engagement[];
  invitations: Invitation[];
}
```

### Challenge 3: Real-Time Notifications
**Problem**: Need to notify users of invitations, acceptances, etc.
**Solution**:
- Phase 1-3: Polling every 30 seconds when app is active
- Phase 4+: WebSocket/Firebase Cloud Messaging for push notifications

### Challenge 4: Profile Photos
**Problem**: Need image upload capability
**Solution**:
- Use `expo-image-picker` for photo selection
- Upload to Cloudinary/Firebase Storage
- Store URL in profile

---

## 🧪 Testing Strategy

### Unit Tests
- Invitation state machine (pending → accepted/declined/expired)
- Multi-workspace context switching
- Permission checks across workspaces

### Integration Tests
- Founder sends invitation → Executive receives → Accepts → Membership created
- Executive switches between workspaces → Data loads correctly
- Apprentice completes profile → Appears in marketplace

### User Acceptance Testing
- **Founder Flow**: Create company → Browse marketplace → Invite executive → Accept invitation → See executive in team
- **Executive Flow**: Complete profile → Receive invitation → Accept → Switch between companies → Complete tasks
- **Apprentice Flow**: Complete profile → Receive invitation → Join company → See tasks → Complete work

---

## 📅 Implementation Timeline

### Week 1-2: Phase 1 - Initial Onboarding
- ✅ Welcome screen with role selection
- ✅ Enhanced founder onboarding (company setup)
- ✅ Executive onboarding flow (new)
- ✅ Apprentice onboarding flow (new)
- ✅ Data models defined

### Week 3-4: Phase 2 - Marketplace
- ✅ Marketplace tab for founders
- ✅ Executive/Apprentice directory with search/filter
- ✅ Profile detail modals
- ✅ Basic discovery functionality

### Week 5-6: Phase 3 - Invitations
- ✅ Invitation flow (send, receive, accept, decline)
- ✅ Invitations tab for all roles
- ✅ Notification system (in-app)
- ✅ Membership creation on acceptance

### Week 7-8: Phase 4 - Multi-Company
- ✅ Executive dashboard
- ✅ Workspace switcher
- ✅ Multi-workspace state management
- ✅ Context-aware data loading

### Week 9-10: Phase 5 - Manufacturing
- ✅ Manufacturing company onboarding
- ✅ Manufacturing directory in marketplace
- ✅ RFQ (Request for Quote) system (basic)

### Week 11-12: Polish & Launch
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Onboarding analytics
- ✅ User testing feedback integration
- ✅ Documentation

---

## 🎯 Success Criteria

### Quantitative
- **Onboarding Completion Rate**: >80% of users complete profile
- **Invitation Acceptance Rate**: >60% of invitations accepted
- **Time to First Engagement**: <48 hours from sign-up to first invitation sent
- **Executive Utilization**: >70% of executives have at least 1 active engagement
- **Multi-Company Adoption**: >40% of executives work with 2+ companies

### Qualitative
- Founders can discover and hire talent without friction
- Executives can manage multiple clients in one app
- Apprentices can showcase skills and get hired
- Manufacturing companies can connect with startups

---

## 🚀 Future Enhancements (Post-Launch)

### Payments & Invoicing
- Integrated payment system (Stripe)
- Automated invoicing for executives
- Payroll management for apprentices

### Ratings & Reviews
- Post-engagement reviews
- Public ratings visible in marketplace
- Dispute resolution system

### Matching Algorithm
- AI-powered talent recommendations
- "You might like..." suggestions for founders
- Skills gap analysis for apprentices

### Contracts & Legal
- Digital contract signing (DocuSign integration)
- Standard engagement templates
- NDA management

### Analytics Dashboard
- Executive performance across all clients
- Founder insights into team productivity
- Apprentice skill progression tracking

---

## 📝 Open Questions & Decisions Needed

1. **Pricing Model**: Will CentaurOS charge a platform fee? (% of transactions? Monthly subscription?)
2. **Vetting Process**: Should executives/manufacturing companies be vetted before appearing in marketplace?
3. **Exclusivity**: Can executives work with competing startups?
4. **Data Portability**: If executive leaves, can they export their work history/reviews?
5. **Background Checks**: Required for apprentices? Who pays?
6. **Insurance**: Should executives carry professional liability insurance?
7. **Geographic Scope**: UK-only initially or international from day 1?
8. **Referral Program**: Incentivize executives to refer other executives?

---

## 🔗 Dependencies

### Technical
- **Backend**: Firebase/Supabase for multi-user data (Phase 3+)
- **Push Notifications**: Expo Notifications (Phase 3+)
- **Image Storage**: Cloudinary/Firebase Storage (Phase 1+)
- **Payments**: Stripe (Future)

### Design
- **Profile Photo Guidelines**: Aspect ratio, file size limits
- **Marketplace Card Design**: Consistent across all talent types
- **Empty States**: When no results in marketplace
- **Loading States**: Skeleton screens for profile loading

### Legal
- **Terms of Service**: For marketplace participants
- **Privacy Policy**: Updated for multi-user ecosystem
- **Data Processing Agreement**: For GDPR compliance
- **Standard Engagement Agreement**: Template for founder-executive relationships

---

## 📚 Documentation Needed

### User-Facing
- **Founder Guide**: "How to build your team on CentaurOS"
- **Executive Guide**: "Getting started as a fractional executive"
- **Apprentice Guide**: "Landing your first startup role"
- **Manufacturing Guide**: "Connecting with hardware startups"

### Technical
- **API Documentation**: For backend integration
- **State Management Guide**: Multi-workspace patterns
- **Testing Guide**: How to test marketplace flows
- **Deployment Guide**: Environment setup for multi-tenancy

---

**End of Plan**

This plan provides a complete roadmap for transforming CentaurOS from a single-company tool into a multi-company ecosystem where executives, apprentices, and manufacturing companies can self-onboard and founders can discover and hire talent. The phased approach allows for iterative development and validation at each stage.
