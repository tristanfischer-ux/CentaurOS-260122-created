# Backend Architecture Comprehensive Review
## Centaur OS - Mobile Task Management for Small Teams

**Generated:** January 21, 2026
**Platform:** React Native (Expo SDK 53) + Supabase (PostgreSQL)
**Architecture Type:** Mobile-first, serverless, multi-tenant

---

## Executive Summary

**Centaur OS** is a **mobile-first task management application** for small teams (founders, fractional executives, apprentices) built with:

- **Frontend**: React Native 0.76.7 + Expo SDK 53
- **Backend**: Supabase (PostgreSQL with Row-Level Security)
- **State Management**: Zustand stores with MMKV persistence
- **No Traditional Backend Server**: Direct client-to-database using Supabase client
- **Multi-tenancy**: Workspace-based isolation using Row-Level Security (RLS)

**Important Clarifications:**
- **NO GitHub Integration** - This is a mobile app, not a GitHub-connected service
- **NO Vercel Deployment** - Built with Expo for iOS/Android, not a web app
- **Database Connection**: Direct Supabase connection from mobile client (no intermediary backend)

---

## 1. Database Architecture

### 1.1 Platform: Supabase (PostgreSQL)

**Connection Setup** (`src/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // Mobile persistent storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,        // Mobile-specific: no URL auth
  },
});
```

**Key Features:**
- ✅ Environment variables for credentials (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
- ✅ AsyncStorage for auth session persistence
- ✅ Auto token refresh for continuous mobile sessions
- ✅ Direct client-database connection (no backend API layer)

### 1.2 Three-Tier Data Architecture

The database is organized into **three logical tiers**:

#### **TIER 1: UNIVERSAL/MARKETPLACE DATA** (Shared across all users)
Public catalog visible to everyone:
- `ai_tools` - AI service catalog (OpenAI, Anthropic, etc.)
- `function_templates` - Business function templates (Engineering, Marketing, Finance)
- `role_definitions` - Role permission definitions
- `suppliers` - External vendor marketplace
- `executive_listings` - Available fractional executives
- `apprentice_listings` - Available apprentices for hire

**Access**: Public read access, verified/admin write access

#### **TIER 2: COMPANY DATA** (Workspace-scoped, multi-tenant)
Private data scoped by `workspace_id`:
- `workspaces` - Company/organization entities
- `members` - Team members within workspaces
- `work_plans` - Tasks/projects
- `work_plan_allocations` - Task assignments to team members
- `okrs` - Objectives and Key Results
- `okr_objectives` - Sub-objectives within OKRs
- `financial_transactions` - Revenue and expense tracking
- `budget_targets` - Financial planning goals
- `supplier_engagements` - Active supplier contracts
- `task_drafts` - Pending task confirmations
- `tasks` - Confirmed tasks (new system)
- `task_allocations` - Weekly time unit allocations
- `brainstorm_sessions` - Strategic planning conversations
- `brainstorm_messages` - Chat history for sessions
- `objectives` - Strategic goals from brainstorming
- `decisions` - Strategic decision tracking

**Access**: Only workspace members (enforced by RLS)

#### **TIER 3: USER DATA** (Individual user-specific)
Personal data tied to individual users:
- `user_preferences` - Theme, notifications, default workspace
- `user_favorite_suppliers` - Personal bookmarks
- `user_skills` - Skills for marketplace discovery
- `user_capacity` - Weekly time unit availability

**Access**: Only the owning user (enforced by RLS)

### 1.3 Multi-Tenancy & Row-Level Security (RLS)

**Core Principle**: Workspace isolation using `workspace_id` foreign key

**Example RLS Policy** (from `001_data_architecture.sql`):
```sql
-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see members of workspaces they belong to
CREATE POLICY members_workspace_isolation ON members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );
```

**How It Works:**
1. User authenticates with Supabase Auth
2. `auth.uid()` returns authenticated user's ID
3. RLS policies automatically filter queries by workspace membership
4. Client cannot bypass these policies (enforced at database level)

**Key Security Features:**
- ✅ Workspace data isolation (companies can't see each other's data)
- ✅ User-specific data isolation (users only see their own preferences)
- ✅ Marketplace data is public (read-only for most users)
- ✅ Automatic query filtering (no manual workspace checks needed in code)

### 1.4 Key Database Tables

#### Core Entities

**`workspaces`** - Company organizations
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`members`** - Team members within workspaces
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),  -- Nullable for external members
  name TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'Founder', 'FractionalExec', 'Apprentice'
  function TEXT,       -- 'Engineering', 'Marketing', 'Finance', etc.
  status TEXT NOT NULL DEFAULT 'active',
  days_per_week DECIMAL(3,1),
  cost_per_day DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`work_plans`** - Tasks and projects
```sql
CREATE TABLE work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT,
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`work_plan_allocations`** - Member assignments
```sql
CREATE TABLE work_plan_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  squares_per_week DECIMAL(4,1),  -- Time units (1 square = 0.5 days)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_plan_id, member_id)
);
```

#### Task Draft System (WHAT/WHY Flows)

**`task_drafts`** - Pending task confirmations
```sql
CREATE TABLE task_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignee_user_id UUID REFERENCES auth.users(id),

  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  notes TEXT CHECK (char_length(notes) <= 2000),

  start_iso TIMESTAMPTZ DEFAULT NOW(),
  due_iso TIMESTAMPTZ,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units >= 1),

  source TEXT NOT NULL,  -- 'what_voice' | 'what_text' | 'why_brainstorm' | 'manual'
  confidence_assignee INTEGER CHECK (confidence_assignee BETWEEN 0 AND 100),
  confidence_due INTEGER CHECK (confidence_due BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending_confirmation',

  transcript_ref TEXT,
  session_id UUID,
  objective_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- ✅ No task created without user confirmation
- ✅ AI-extracted drafts with confidence scores
- ✅ Links to brainstorm sessions and objectives
- ✅ Minimum 1 time unit per task
- ✅ Idempotency through draft → task relationship

**`brainstorm_sessions`** - Strategic planning conversations
```sql
CREATE TABLE brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  domain TEXT,  -- Auto-detected topic/domain
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'synthesized' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`brainstorm_messages`** - Chat history
```sql
CREATE TABLE brainstorm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Financial Tracking

**`financial_transactions`** - Revenue and costs
```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,  -- 'revenue', 'cost'
  category TEXT NOT NULL,  -- 'product_sales', 'team', 'ai_tools', etc.
  subcategory TEXT,
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_period TEXT,  -- 'monthly', 'quarterly', 'annual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Database Migrations

**Location**: `supabase/migrations/`

**Migration Files**:
1. `001_data_architecture.sql` - Core multi-tenant tables, RLS policies
2. `002_seed_data.sql` - Initial demo data
3. `003_enhance_audit_records.sql` - Audit trail improvements
4. `004_what_why_flows.sql` - Task drafts, brainstorm sessions, objectives
5. `005_marketplace_directory.sql` - Supplier/executive listings
6. `006_freshness_system.sql` - Portfolio review system
7. `008_people_component.sql` - People management features
8. `011_work_plans_visibility.sql` - Enhanced work plan access
9. `012_finance_function_access.sql` - Financial permissions

**Migration Process**:
1. Create SQL files in `supabase/migrations/`
2. Run in Supabase Dashboard SQL Editor
3. RLS policies automatically enforced
4. Indexes created for performance
5. Triggers for `updated_at` timestamps

---

## 2. State Management Architecture

### 2.1 Zustand Store Pattern

**Primary State Library**: Zustand (not Redux)

**Key Features:**
- ✅ Lightweight, no boilerplate
- ✅ React hooks integration
- ✅ Persistence via MMKV (faster than AsyncStorage)
- ✅ Selector-based subscriptions (prevent unnecessary re-renders)
- ✅ TypeScript first-class support

**Store Structure** (`src/lib/state/`):

**Core Stores:**
- `app-store.ts` - Global app state, current workspace, user session
- `user-store.ts` - User profile and preferences
- `work-plan-store.ts` - Tasks/projects
- `organization-store.ts` - Team members, org chart
- `okr-store.ts` - Objectives and Key Results
- `notification-store.ts` - In-app notifications
- `messages-store.ts` - Conversations and messaging
- `finance-store.ts` - Financial tracking
- `supplier-store.ts` - Supplier relationships
- `escalation-store.ts` - Task escalation workflow

**Specialized Stores:**
- `capacity-store.ts` - Team capacity calculations
- `draft-store.ts` - Task draft management
- `decisions-store.ts` - Strategic decision tracking
- `invitation-store.ts` - Team invitations
- `squad-store.ts` - Team squads/groups

### 2.2 Zustand Store Example

**Pattern**: `notification-store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export type NotificationType = 'approval' | 'deadline' | 'capacity' |
  'budget' | 'assignment' | 'message' | 'achievement' | 'escalation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  timestamp: string;
  read: boolean;
  workspaceId: string;
  userId?: string;  // User-specific notifications
}

interface NotificationStore {
  notifications: Notification[];
  preferences: {
    approvals: boolean;
    deadlines: boolean;
    capacity: boolean;
    budget: boolean;
    assignments: boolean;
    messages: boolean;
    achievements: boolean;
    escalations: boolean;
  };
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (workspaceId: string, userId?: string) => void;
  getUnreadCount: (workspaceId: string, userId?: string) => number;
  getNotificationsByWorkspace: (workspaceId: string, userId?: string) => Notification[];
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: {
        approvals: true,
        deadlines: true,
        capacity: true,
        budget: true,
        assignments: true,
        messages: true,
        achievements: true,
        escalations: true,
      },

      addNotification: (notification) => {
        // Check if notification type is enabled
        const typeKey = notification.type === 'approval' ? 'approvals' : ...;
        if (!get().preferences[typeKey]) return;

        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
        }));
      },

      getUnreadCount: (workspaceId, userId) => {
        return get().notifications.filter((n) => {
          const matchesWorkspace = n.workspaceId === workspaceId;
          const matchesUser = !userId || !n.userId || n.userId === userId;
          return matchesWorkspace && matchesUser && !n.read;
        }).length;
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

**Best Practices:**
1. **Use Selectors** - Prevents re-renders
   ```typescript
   // ✅ Good - only re-renders when unread count changes
   const unreadCount = useNotificationStore(s => s.getUnreadCount(workspaceId));

   // ❌ Bad - re-renders on any notification change
   const { notifications } = useNotificationStore();
   ```

2. **Workspace Filtering** - Multi-tenant data isolation
   ```typescript
   getNotificationsByWorkspace: (workspaceId, userId?) => {
     return get().notifications.filter(n => {
       const matchesWorkspace = n.workspaceId === workspaceId;
       const matchesUser = !userId || !n.userId || n.userId === userId;
       return matchesWorkspace && matchesUser;
     });
   }
   ```

3. **Persistence with MMKV** - Faster than AsyncStorage
   ```typescript
   {
     name: 'notification-storage',
     storage: createJSONStorage(() => mmkvStorage),
   }
   ```

### 2.3 Messages Store (User Communication)

**Pattern**: `messages-store.ts`

```typescript
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Founder' | 'FractionalExec' | 'Apprentice';
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  workspaceId: string;  // 🔑 Multi-tenancy key
  type: 'direct' | 'group';
  name: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  isTyping: string[];  // User IDs currently typing
  createdAt: Date;
  updatedAt: Date;
}

interface MessagesStore {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  activeConversation: string | null;

  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  markAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  getUnreadCount: (workspaceId: string) => number;
  getConversationsByWorkspace: (workspaceId: string) => Conversation[];
}
```

**Features:**
- ✅ Direct and group conversations
- ✅ Real-time typing indicators
- ✅ Unread message tracking
- ✅ Workspace-scoped (multi-tenant)
- ✅ Message attachments support

---

## 3. Communication Systems

### 3.1 Notification System

**Implementation**: `src/lib/state/notification-store.ts`

**Notification Types:**
1. **Approval** - Approval requests from team members
2. **Deadline** - Task deadlines approaching
3. **Capacity** - Team member overallocation warnings
4. **Budget** - Financial alerts (runway warnings, budget limits)
5. **Assignment** - New task assignments
6. **Message** - New messages in conversations
7. **Achievement** - Milestone completions, achievements unlocked
8. **Escalation** - Task escalations to leadership

**User Preferences:**
- Toggle each notification type on/off
- Persisted to MMKV storage
- Filter applied before adding notifications

**Helper Functions** (`notificationHelpers`):
```typescript
// Capacity warning example
notificationHelpers.capacityWarning(
  workspaceId,
  memberName: "Sarah Johnson",
  utilizationPercent: 120
) => {
  type: 'capacity',
  workspaceId,
  title: 'Capacity Alert',
  message: 'Sarah Johnson is at 120% capacity (overtime)',
  actionLabel: 'View Team',
  actionRoute: '/who',
}
```

### 3.2 Messaging System

**Implementation**: `src/lib/state/messages-store.ts`

**Features:**
- **Direct Messages** - 1-on-1 conversations
- **Group Chats** - Team-wide discussions
- **Typing Indicators** - Real-time "is typing..." feedback
- **Unread Badges** - Per-conversation unread counts
- **Workspace Filtering** - Only show conversations for current workspace

**Data Flow:**
```
User sends message
  ↓
addMessage() called
  ↓
Message added to messages[conversationId]
  ↓
Conversation lastMessage updated
  ↓
UnreadCount incremented (if not active conversation)
  ↓
UI re-renders with new message
```

### 3.3 Escalation System

**Implementation**: `src/lib/state/escalation-store.ts`

**Purpose**: Allow team members to escalate blocked tasks to leadership (Founders)

**Workflow:**
1. **Team member escalates task**
   - Selects reason (Budget, Timeline, Scope, Resource)
   - Adds details
   - Creates escalation record

2. **Founders receive notification**
   - Red badge on Home tab
   - User-specific notification (only Founders with auth)
   - Can view all pending escalations in modal

3. **Founder responds**
   - **Accept** - Approve with changes
   - **Delegate** - Assign to another team member
   - **Reject** - Decline with feedback

4. **Original escalator notified**
   - User-specific notification of decision
   - Can view resolution in task history

**Multi-User Features:**
- ✅ User-specific notifications (userId tracking)
- ✅ Founders with auth receive targeted notifications
- ✅ Graceful fallback to workspace-level if userId unavailable
- ✅ Full audit trail with userId tracking

### 3.4 Brainstorm Sessions (WHY Flow)

**Database Tables**:
- `brainstorm_sessions` - Conversation sessions
- `brainstorm_messages` - Chat history (user/assistant)
- `objectives` - Strategic goals extracted from sessions
- `objective_task_links` - Links objectives to tasks

**AI-Powered Workflow:**
```
User opens WHY tab
  ↓
Creates brainstorm session (POST /api/why/session)
  ↓
User sends message
  ↓
AI responds with clarifying question (POST /api/why/turn)
  ↓
Conversation continues (multi-turn)
  ↓
User synthesizes session (POST /api/why/synthesize)
  ↓
AI extracts objectives + task drafts
  ↓
User reviews and confirms tasks
```

**Security:**
- API keys stored server-side (EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY)
- All LLM calls in `/api` routes (not client-side)
- RLS policies prevent cross-workspace access

---

## 4. Data Flow Patterns

### 4.1 Client-to-Database Architecture

**Pattern**: Direct Supabase client (no backend API layer)

```
Mobile App (React Native)
  ↓
Supabase Client SDK
  ↓
PostgREST API (auto-generated by Supabase)
  ↓
PostgreSQL Database
  ↓
Row-Level Security (RLS) Enforcement
  ↓
Filtered Results by Workspace
```

**Benefits:**
- ✅ No backend server to maintain
- ✅ Automatic API generation from schema
- ✅ Real-time subscriptions available
- ✅ Offline-first with local state (Zustand + MMKV)

**Trade-offs:**
- ⚠️ Complex logic must be in client or database functions
- ⚠️ No centralized API layer for validation
- ⚠️ RLS policies are critical for security

### 4.2 Supabase Service Layer

**Implementation**: `src/lib/supabase-service.ts`

**Purpose**: Centralize Supabase operations with type conversions

**Pattern**:
```typescript
// Type conversion: Supabase (snake_case) <-> App (camelCase)
function supabaseToMember(row: any): Member {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    function: row.function,
    daysPerWeek: row.days_per_week,
    costPerDay: row.cost_per_day,
    ...
  };
}

// Service function
export async function getMembers(workspaceId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('workspace_id', workspaceId);  // Manual workspace filter

  if (error) throw error;
  return data.map(supabaseToMember);
}
```

**Note**: Even though RLS auto-filters, manual workspace filters are still used for clarity.

### 4.3 State Synchronization

**Pattern**: Zustand store + Supabase

```typescript
// In component or store
const loadWorkPlans = async (workspaceId: string) => {
  const plans = await workPlanService.getByWorkspace(workspaceId);
  useWorkPlanStore.getState().setWorkPlans(plans);
};

// Store update
setWorkPlans: (plans) => set({ workPlans: plans });
```

**Offline-First Strategy:**
1. Load data from Supabase on app start
2. Store in Zustand (in-memory)
3. Persist critical state to MMKV
4. Mutations optimistically update local state
5. Background sync to Supabase
6. Handle conflicts with "last write wins" or manual resolution

### 4.4 Real-Time Subscriptions (Optional)

**Supabase Realtime** - Not heavily used yet, but available:

```typescript
supabase
  .channel('work-plans')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'work_plans' },
    (payload) => {
      // Update local state with new/updated/deleted work plan
      handleWorkPlanChange(payload);
    }
  )
  .subscribe();
```

**Current Status**: Not implemented for most tables (relying on manual refresh)

---

## 5. Integration Points

### 5.1 Supabase Auth

**Setup**:
- Email/password authentication
- Magic link authentication (optional)
- Session stored in AsyncStorage
- Auto token refresh

**User Flow:**
```
User enters email + password
  ↓
supabase.auth.signInWithPassword()
  ↓
Session created
  ↓
auth.uid() available for RLS policies
  ↓
User can access workspace data
```

**Profile Creation:**
```typescript
// After signup, create user profile
await supabase
  .from('profiles')
  .insert({
    id: user.id,
    email: user.email,
    avatar_url: null,
    theme_mode: 'system',
  });
```

### 5.2 AI APIs (LLM Integration)

**Purpose**: Task extraction, brainstorming, prioritization

**Providers** (`src/lib/providers/llm-provider.ts`):
- **AnthropicProvider** (production) - Claude API
- **MockProvider** (development) - Safe fallback

**Environment Variables:**
```
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=...
LLM_PROVIDER=anthropic  # or "mock"
```

**API Routes** (server-side only):
- `/api/what/extract-drafts` - Extract tasks from text/voice
- `/api/why/turn` - Brainstorm conversation turn
- `/api/why/synthesize` - Extract objectives + tasks from session

**Security:**
- ✅ API keys NEVER sent to client
- ✅ All LLM calls in API routes (server-side Expo functions)
- ✅ Input validation on all endpoints

### 5.3 No GitHub Integration

**Searched Codebase**: No GitHub API integrations found

**Why?** This is a **mobile task management app**, not a code/repository tool.

### 5.4 No Vercel Deployment

**Platform**: Expo (iOS/Android native apps)

**Build Process:**
- Development: `bun start` (Expo Go)
- Production: EAS Build (Expo Application Services)
- Distribution: App Store / Google Play

**Not a web app** - No Vercel, no Next.js, no SSR

---

## 6. Security Architecture

### 6.1 Row-Level Security (RLS)

**Enforcement Points:**
1. **Workspace Isolation**
   ```sql
   CREATE POLICY work_plans_workspace_isolation ON work_plans
     FOR SELECT
     USING (
       workspace_id IN (
         SELECT workspace_id FROM members WHERE user_id = auth.uid()
       )
     );
   ```

2. **User-Specific Data**
   ```sql
   CREATE POLICY user_preferences_own_data ON user_preferences
     FOR ALL
     USING (user_id = auth.uid());
   ```

3. **Marketplace (Public Read, Restricted Write)**
   ```sql
   -- Anyone can view verified suppliers
   CREATE POLICY suppliers_public_read ON suppliers
     FOR SELECT
     USING (status = 'verified');

   -- Only admins can approve/verify
   CREATE POLICY suppliers_admin_write ON suppliers
     FOR UPDATE
     USING (auth.uid() IN (SELECT id FROM admin_users));
   ```

### 6.2 API Security

**Server-Side API Routes** (`src/app/api/`):
- All LLM calls happen server-side
- API keys in environment variables (not client code)
- Input validation on all endpoints
- No direct database writes from client for AI features

**Example** (`/api/what/extract-drafts+api.ts`):
```typescript
export async function POST(request: Request) {
  const { text, workspaceId } = await request.json();

  // Validate input
  if (!text || !workspaceId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Server-side LLM call (API key never exposed)
  const llm = getLLMProvider();
  const drafts = await llm.complete(extractTasksPrompt(text));

  // Return to client
  return Response.json({ drafts });
}
```

### 6.3 Authentication Flow

**Supabase Auth Integration:**
```
1. User signs up/logs in
     ↓
2. Supabase creates auth.users record
     ↓
3. Session token stored in AsyncStorage
     ↓
4. auth.uid() available in all RLS policies
     ↓
5. Client queries automatically filtered by RLS
```

**Session Management:**
- Auto-refresh tokens
- Persistent sessions across app restarts
- Logout clears AsyncStorage + Supabase session

---

## 7. What's NOT Integrated

### 7.1 GitHub

**Status**: ❌ Not integrated

**Why?** This is a mobile task management app, not a code repository tool. No Git operations, no PR tracking, no code review features.

### 7.2 Vercel

**Status**: ❌ Not integrated

**Why?** This is a React Native mobile app built with Expo. Deployment is via EAS Build → App Store/Google Play, not Vercel.

### 7.3 Traditional Backend Server

**Status**: ❌ Not needed

**Architecture**: Serverless using Supabase

**Pattern:**
- No Express/Node.js server
- No REST API layer
- Direct database access via Supabase client
- Server-side logic in Expo API routes (for AI/LLM only)

---

## 8. Development Workflow

### 8.1 Local Development

**Setup:**
```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Add Supabase credentials

# Start dev server
bun start
```

**Environment Variables:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-...
```

### 8.2 Database Migrations

**Process:**
1. Create SQL file in `supabase/migrations/XXX_description.sql`
2. Open Supabase Dashboard → SQL Editor
3. Copy SQL contents
4. Run migration
5. Verify tables/policies created

**Example Migration:**
```sql
-- 013_new_feature.sql
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY new_feature_workspace_isolation ON new_feature
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid()
    )
  );
```

### 8.3 Store Updates

**Adding New State:**
1. Create store file: `src/lib/state/my-feature-store.ts`
2. Define TypeScript interfaces
3. Create Zustand store with persistence
4. Export selectors for efficient access
5. Use in components with `useMyFeatureStore(s => s.field)`

---

## 9. Key Architectural Decisions

### 9.1 Why Supabase Instead of Custom Backend?

**Pros:**
- ✅ Auto-generated REST API from schema
- ✅ Built-in authentication
- ✅ Row-Level Security for multi-tenancy
- ✅ Real-time subscriptions available
- ✅ No server infrastructure to maintain

**Cons:**
- ⚠️ Less control over API layer
- ⚠️ Complex logic in client or database functions
- ⚠️ Vendor lock-in

**Decision**: Pros outweigh cons for small team mobile app

### 9.2 Why Zustand Instead of Redux?

**Pros:**
- ✅ Simpler API, less boilerplate
- ✅ Better TypeScript support
- ✅ Selector-based subscriptions
- ✅ Easier to learn for small teams

**Cons:**
- ⚠️ Less ecosystem/middleware
- ⚠️ No time-travel debugging

**Decision**: Simplicity > features for MVP

### 9.3 Why Direct Client-Database Instead of API Layer?

**Pros:**
- ✅ Faster development (no API endpoints to write)
- ✅ Automatic query generation
- ✅ RLS provides security at database level

**Cons:**
- ⚠️ Business logic in multiple places
- ⚠️ Harder to add complex workflows

**Decision**: Acceptable trade-off for small team

---

## 10. Summary

### Key Takeaways

1. **Database**: Supabase (PostgreSQL) with Row-Level Security for multi-tenancy
2. **Architecture**: Three-tier (Universal/Company/User) data model
3. **State Management**: Zustand stores with MMKV persistence
4. **Authentication**: Supabase Auth with AsyncStorage sessions
5. **Communication**: In-app notifications, messaging, escalations, brainstorm sessions
6. **Security**: RLS policies enforce workspace isolation at database level
7. **AI Integration**: Server-side LLM calls for task extraction and brainstorming
8. **No GitHub**: Mobile task app, not a code repository tool
9. **No Vercel**: Expo app deployed to App Store/Google Play
10. **Serverless**: Direct client-database, no traditional backend

### Architecture Strengths

✅ **Multi-tenant from day one** - RLS policies ensure data isolation
✅ **Mobile-optimized** - MMKV persistence, offline-first patterns
✅ **Type-safe** - TypeScript throughout, strict mode enabled
✅ **Scalable data model** - Three-tier architecture separates concerns
✅ **Real-time capable** - Supabase subscriptions available when needed

### Areas for Improvement

⚠️ **No offline sync strategy** - Currently requires internet connection
⚠️ **No real-time subscriptions** - Manual refresh for data updates
⚠️ **Complex client logic** - Business rules split between client and database
⚠️ **No centralized validation** - Input validation duplicated across API routes

---

## Appendix: File Structure

```
/home/user/workspace/
├── supabase/
│   └── migrations/
│       ├── 001_data_architecture.sql       # Core multi-tenant tables
│       ├── 004_what_why_flows.sql          # Task drafts, brainstorm
│       ├── 005_marketplace_directory.sql    # Supplier/exec listings
│       └── ...
├── src/
│   ├── app/
│   │   ├── (tabs)/                         # Tab navigation screens
│   │   │   ├── index.tsx                   # Home dashboard
│   │   │   ├── people.tsx                  # Team roster
│   │   │   ├── tasks.tsx                   # Task list
│   │   │   ├── when.tsx                    # Timeline/Gantt
│   │   │   ├── marketplace.tsx             # Supplier directory
│   │   │   └── settings.tsx                # Settings
│   │   ├── api/                            # Server-side API routes
│   │   │   ├── what/
│   │   │   │   ├── extract-drafts+api.ts   # AI task extraction
│   │   │   │   ├── drafts+api.ts           # Draft CRUD
│   │   │   │   └── confirm+api.ts          # Create tasks from drafts
│   │   │   ├── why/
│   │   │   │   ├── session+api.ts          # Create brainstorm session
│   │   │   │   ├── turn+api.ts             # AI conversation turn
│   │   │   │   └── synthesize+api.ts       # Extract objectives
│   │   │   └── transcribe+api.ts           # Voice-to-text
│   │   └── _layout.tsx                     # Root navigation
│   ├── lib/
│   │   ├── state/                          # Zustand stores
│   │   │   ├── app-store.ts
│   │   │   ├── work-plan-store.ts
│   │   │   ├── organization-store.ts
│   │   │   ├── notification-store.ts
│   │   │   ├── messages-store.ts
│   │   │   └── ...
│   │   ├── supabase.ts                     # Supabase client config
│   │   ├── supabase-service.ts             # Database service layer
│   │   └── providers/
│   │       └── llm-provider.ts             # AI integration
│   ├── components/                         # Reusable UI components
│   └── types/                              # TypeScript definitions
├── CLAUDE.md                               # Development instructions
├── STYLE_GUIDE.md                          # UI/UX standards
├── THREE_TIER_ARCHITECTURE.md              # Data model docs
├── ARCHITECTURE_NOTES.md                   # WHAT/WHY flow docs
└── MULTI_TENANCY_ARCHITECTURE.md           # Multi-tenant design

```

---

**Last Updated**: January 21, 2026
**Reviewed By**: Claude (Sonnet 4.5)
**Status**: Comprehensive review complete
