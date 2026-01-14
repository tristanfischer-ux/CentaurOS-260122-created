# Talent Invitation & Negotiation System - Implementation Summary

## Overview
A comprehensive system allowing founders to invite executives and apprentices with rate negotiations, and enabling unaffiliated users to sign up and receive invitations before joining a company.

## ✅ Completed

### 1. Invitation Store (`/src/lib/state/invitation-store.ts`)
Created a full-featured invitation and negotiation system with:

**Key Features:**
- **Rate Negotiation**: Full back-and-forth negotiation with rate history tracking
- **Multiple Rate Types**: Hourly, daily, and monthly retainer rates
- **Invitation Statuses**: pending, counter_offered, accepted, rejected, withdrawn
- **Unaffiliated User Registry**: System for users to sign up before joining companies

**Data Structures:**
```typescript
interface TalentInvitation {
  id: string;
  workspaceId: string;
  companyName: string;
  candidateInfo: { id, name, email, role, function }
  position: string;
  description: string;
  rateHistory: RateProposal[];
  currentRate: RateProposal;
  status: InvitationStatus;
}

interface RateProposal {
  proposedBy: 'founder' | 'candidate';
  amount: number;
  currency: string;
  type: 'hourly_rate' | 'daily_rate' | 'monthly_retainer';
  daysPerWeek?: number;
  hoursPerWeek?: number;
  message?: string;
  timestamp: string;
}

interface UnaffiliatedUser {
  id: string;
  email: string;
  name: string;
  role: 'FractionalExec' | 'Apprentice';
  functions: string[];
  bio?: string;
  hourlyRate?: number;
  dailyRate?: number;
  availability: { daysPerWeek, startDate };
  profileComplete: boolean;
}
```

**Store Methods:**
- `createInvitation()` - Founder sends invitation with initial rate
- `respondToInvitation()` - Accept, reject, or counter-offer
- `updateInvitationRate()` - Update rate during negotiation
- `withdrawInvitation()` - Founder withdraws invitation
- `registerUnaffiliatedUser()` - Sign up as unaffiliated
- `searchUnaffiliatedUsers()` - Find candidates by role/function

**Demo Data:**
- 2 sample unaffiliated users (Jane Designer, Mike Chen)
- 1 sample pending invitation with initial rate proposal

### 2. Type System Updates
**Updated `/src/types/index.ts`:**
- Added `'Unaffiliated'` to `Role` type
- Now: `type Role = 'Founder' | 'Apprentice' | 'FractionalExec' | 'Government' | 'Unaffiliated'`

**Updated `/src/lib/api/index.ts`:**
- Added permissions for Unaffiliated role:
  ```typescript
  Unaffiliated: {
    invitation: ['read', 'respond'],
    profile: ['read', 'update'],
  }
  ```

**Updated `/src/components/EngagementSections.tsx`:**
- Changed role prop to use imported `Role` type instead of hardcoded union

## 🚧 Remaining Work

### 3. Talent Tab UI (In Progress)
Need to add invitation creation and management interface:

**For Founders:**
- Search unaffiliated users by role and function
- Create new invitation with rate proposal
- View pending invitations with status
- Counter-offer when candidate proposes different rate
- Accept/withdraw invitations
- View negotiation history

**UI Components Needed:**
- `InvitationCreationModal` - Form to send invitation
- `InvitationListItem` - Display invitation with status
- `RateNegotiationDialog` - Back-and-forth rate discussion
- `UnaffiliatedUserSearch` - Browse available candidates

### 4. Unaffiliated User Inbox (Pending)
Create dedicated view for unaffiliated users:

**Features:**
- List all pending invitations
- View company details and offer
- Accept, reject, or counter-offer
- Track negotiation history
- Profile completion prompts

**Navigation:**
- Add inbox tab for unaffiliated users
- Show notification badge for pending invitations
- Deep link from email notifications

### 5. Authentication Updates (Pending)
Update signup/signin flows:

**Signup Changes:**
- Add "Unaffiliated" option to role selector
- Simplified flow (no workspace creation)
- Profile setup: role, functions, rates, availability
- Email verification for invitation notifications

**Signin Changes:**
- Route unaffiliated users to inbox instead of home
- Show "Complete Your Profile" banner if incomplete
- Allow accepting invitation to join workspace

## User Flows

### Flow 1: Founder Invites Unaffiliated User
1. Founder goes to Talent tab
2. Searches for candidates (by role/function)
3. Views candidate profile (bio, rate expectations)
4. Clicks "Send Invitation"
5. Fills out position, description, proposed rate
6. Sends invitation
7. Candidate receives email notification
8. Candidate logs in, sees invitation in inbox
9. Candidate accepts/rejects/counters

### Flow 2: Rate Negotiation
1. Founder offers £40/hr for apprentice
2. Candidate counters with £45/hr + message
3. Founder sees counter-offer notification
4. Founder accepts counter OR proposes £42/hr
5. Back-and-forth until agreement
6. Final acceptance → candidate joins workspace

### Flow 3: Unaffiliated User Signs Up
1. User visits signup page
2. Selects "Unaffiliated" role
3. Enters: email, name, role (exec/apprentice)
4. Selects function areas (Marketing, Engineering, etc.)
5. Sets rate expectations and availability
6. Completes profile
7. Waits for invitations
8. Receives notifications when invited

## Technical Architecture

### State Management
- **Zustand store** with AsyncStorage persistence
- Invitation data persists across app restarts
- Real-time updates when negotiating rates

### Multi-Tenancy
- Invitations linked to workspaces via `workspaceId`
- Unaffiliated users not linked to any workspace
- Upon acceptance, user joins workspace as member

### Notifications (Future)
- Email notifications for new invitations
- Push notifications for counter-offers
- In-app notification badge

### Security Considerations
- Rate history immutable (no deletion)
- All proposals timestamped
- Audit trail of negotiation
- Email verification required

## Database Schema (Future Backend)

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  candidate_email VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE TABLE rate_proposals (
  id UUID PRIMARY KEY,
  invitation_id UUID REFERENCES invitations(id),
  proposed_by VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'GBP',
  type VARCHAR NOT NULL,
  days_per_week INTEGER,
  hours_per_week INTEGER,
  message TEXT,
  timestamp TIMESTAMP
);

CREATE TABLE unaffiliated_users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  functions JSONB,
  bio TEXT,
  hourly_rate DECIMAL,
  daily_rate DECIMAL,
  availability JSONB,
  profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

## Testing Checklist

- [ ] Create invitation as founder
- [ ] Receive invitation as unaffiliated user
- [ ] Accept invitation with original rate
- [ ] Counter-offer with different rate
- [ ] Back-and-forth negotiation (3+ rounds)
- [ ] Founder withdraws invitation
- [ ] Candidate rejects invitation
- [ ] Rate history displays correctly
- [ ] Search unaffiliated users by role
- [ ] Search unaffiliated users by function
- [ ] Signup as unaffiliated user
- [ ] Complete unaffiliated profile
- [ ] Invitation moves user to workspace on accept
- [ ] Email/name validation
- [ ] Persistence after app restart

## Next Steps

1. **Create Talent Tab UI** (Priority 1)
   - File: `/src/app/(tabs)/talent.tsx` (new)
   - Components: InvitationCreationModal, InvitationList
   - Integration with invitation store

2. **Create Unaffiliated Inbox** (Priority 2)
   - File: `/src/app/invitations-inbox.tsx` (new)
   - Show all pending invitations
   - Accept/reject/counter UI

3. **Update Auth Flows** (Priority 3)
   - Update signup screen with unaffiliated option
   - Route logic based on role
   - Profile completion flow

4. **Notifications** (Priority 4)
   - Email templates
   - Push notification setup
   - In-app notification system

## Notes

- Demo data includes 2 unaffiliated users for testing
- All rate amounts in pence/cents (multiply by 100 for storage)
- Currency defaults to GBP, can be extended
- Invitation store persists to AsyncStorage automatically
- Clean separation between workspace members and unaffiliated users
