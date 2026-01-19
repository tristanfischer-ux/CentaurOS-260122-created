# Settings & App Structure Fix Plan
**Date**: January 19, 2026  
**Status**: Planning Phase - Do Not Implement Yet

This document outlines all fixes needed for Settings section, app structure, Guild system, WHY tab enhancement, Reports, and other structural improvements.

---

## EXECUTIVE SUMMARY

**Categories**:
1. Settings Section Cleanup
2. Function Library Removal
3. Theme Quirks Audit
4. Guild System Restoration
5. WHY Tab Enhancement (AI Brainstorming)
6. Startup Pack Relocation
7. Reports AI Enhancement  
8. Onboarding/Tutorial Update
9. Branding Fixes (Fractional Foundry → Centaur OS)
10. Data Management Supabase Review

---

## 1. SETTINGS SECTION CLEANUP

### 1.1 Remove "Pending Approvals" from Quick Actions
**File**: `src/app/(tabs)/settings.tsx` (~236-244)
**Current**: Shows "Pending Approvals" with badge "3" navigating to /(tabs)/decide
**Issue**: Goes through "strategic decision to size thing" - orphan sheet
**Fix**: Remove this quick action entirely
```typescript
// REMOVE:
{
  id: 'pending_approvals',
  title: 'Pending Approvals',
  subtitle: 'Review allocation requests',
  icon: Clock,
  color: '#f97316',
  action: () => router.push('/(tabs)/decide'),
  badge: '3',
},
```

**Priority**: P1

### 1.2 Keep "Generate Report" Quick Action
**File**: Same (~246-252)
**Current**: Works fine, likely time unit analysis
**Action**: Keep as-is, but verify it works with no data
**Note**: User said "we have no data in the system yet, so we can't really tell very well"
**Priority**: P3 - Test only

### 1.3 Review "Sync Data" / Data Management
**File**: Lines ~254-260 (Sync Data quick action), ~944-1004 (Data Management section)
**Issue**: "Now using Supabase" - is CSV import/export still relevant or redundant?
**Investigation Needed**:
- Check if data export still useful (probably yes for backups)
- Check if import is redundant (if Supabase is source of truth)
- Determine if Google Sheets sync makes sense with Supabase

**Fix Strategy**:
- Keep export functionality (users want backups)
- Consider removing CSV import (Supabase is primary)
- Add Supabase sync status instead
- Update copy: "Export data as CSV backup" not "Import/Export"

**Priority**: P2

### 1.4 Remove Team & Collaboration Section Items
**File**: Lines ~881-942
**Current**: Has 4 items:
1. Organization Structure (keep)
2. Invitations (keep)
3. My Engagements (keep for Execs/Apprentices)
4. Guilds (MOVE to WHO tab)

**Fix**: 
- Keep first 3 items
- Remove Guilds from here
- Add Guilds to WHO tab instead

**Priority**: P1

---

## 2. FUNCTION LIBRARY REMOVAL

### 2.1 Delete Function Library Completely
**File**: `src/app/function-hub.tsx`
**Issue**: User said "formatting is wrong", "people are all wrong", "just get rid of everything in the function library, delete it completely"

**Fix**:
1. Remove from Settings Quick Actions (line ~304-310)
2. Remove from Settings Resources section (line ~1030-1039)
3. Keep file archived but don't expose to users
4. Remove navigation from anywhere else in app

**Note**: Function library data in `/lib/function-library` can stay for future use

**Priority**: P0 (Critical) - User explicitly requested deletion

---

## 3. THEME QUIRKS AUDIT

### 3.1 Systematic Theme Review
**Issue**: "still some quirks on the display theme on some of the boxes when you shift from dark to white and off-white"

**Strategy**: Methodically go through entire app checking theme consistency

**Files to Audit**:
- All components in `src/components/`
- All screens in `src/app/`
- Focus on components with conditional theme classes

**Common Issues to Find**:
- Hardcoded colors instead of theme-aware variables
- Missing `isOffWhite` checks (only checking `isDark`)
- Border colors not adapting
- Text colors not readable in all themes
- Background colors clashing

**Pattern to Follow** (from settings.tsx):
```typescript
const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
const textPrimary = isDark ? 'text-white' : 'text-gray-900';
const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
```

**Testing Checklist**:
- [ ] Home tab - all widgets
- [ ] WHAT tab - task cards, modals
- [ ] WHY tab - brainstorming UI
- [ ] WHO tab - member cards, squad cards
- [ ] TOOLS tab - supplier cards, AI tools
- [ ] EVALUATE tab - OKR cards, strategic health
- [ ] Settings - all sections
- [ ] Financial Dashboard
- [ ] Modals and overlays

**Priority**: P1

---

## 4. GUILD SYSTEM RESTORATION

### 4.1 Move Guilds to WHO Tab
**Current Location**: Settings → Team & Collaboration → Guilds
**New Location**: WHO tab → New subtab or section

**WHO Tab Structure** (current):
- My Team
- Squads  
- Hire
- Resources

**Proposed New Structure**:
```
WHO Tab:
├─ My Team (green color - current resources)
├─ Squads (green)
├─ Hire (purple - future)
└─ Guild Events (purple - future/external)
```

**OR Alternative**:
```
WHO Tab:
├─ Team (current: My Team + Squads)
├─ Hire (future team)
└─ Guild (external community)
```

**Implementation**:
1. Update `src/app/(tabs)/who.tsx` type definition
2. Add new tab: `type WhoTab = 'team' | 'squads' | 'hire' | 'guild';`
3. When "guild" tab selected, render Guild content
4. Add explanation modal: "What is the Guild?"

**Guild Explanation** (for modal):
```
What are Guilds?

Guilds are cross-company communities where executives, 
apprentices, and founders collaborate beyond their own startups.

• Share knowledge and best practices
• Find collaboration opportunities
• Earn XP and badges for contributions
• Attend virtual events and workshops
• Connect with peers in your function

Your guild activities are separate from your company work.
```

**Priority**: P1

### 4.2 Research Existing Guild System
**File**: `src/app/guilds.tsx`
**Action**: Deep dive into what was built
**Goals**:
- Understand the Guild data model
- Find Guild events system
- Understand XP/leveling mechanics
- Understand challenges and resources

**Priority**: P2

---

## 5. WHY TAB ENHANCEMENT

### 5.1 Move Startup Pack to WHY Tab
**Current**: Settings → Resources → Startup Pack
**New**: WHY tab → prominently featured

**Rationale**: User said "startup pack under resources should go under why"

**WHY Tab Redesign Concept**:
```
WHY Tab: Strategic Planning
┌─────────────────────────────────┐
│ Define Your Company Purpose     │
├─────────────────────────────────┤
│ • Why are you building this?    │
│ • What problem are you solving? │
│ • Who are you helping?          │
│                                 │
│ [Start AI Brainstorm Session]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Company Objectives              │
├─────────────────────────────────┤
│ [Your saved objectives here]    │
│ [+ New Company Aim]             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Startup Pack (UK Setup Guide)  │
├─────────────────────────────────┤
│ • Company Registration          │
│ • Banking & Accounting          │
│ • Legal Basics                  │
│ • Funding Strategy              │
│ [Open Startup Pack →]           │
└─────────────────────────────────┘
```

**Priority**: P1

### 5.2 Implement AI Brainstorming System
**File**: New component or enhanced `src/app/(tabs)/why.tsx`

**User Requirements** (from voice input):
- "Intelligent series of questions about why it's doing certain things"
- "Help it make decisions"
- "Best resources for managing those kinds of events strategically"
- "Really good advice, HR advice, which is AI-driven"

**System Design** (from provided prompts):

#### **Input Mode**: Natural Language (Voice/Text)
Examples:
- "We're struggling with employee retention"
- "I need to figure out how to pitch to industrial VCs"
- "Should we focus on B2B or B2C?"

#### **Interaction Flow**: Conversational with Business Frameworks

Topic types and frameworks:
| Topic | Frameworks | Example Prompts |
|-------|-----------|-----------------|
| Strategy | Jobs-to-be-Done, 7 Powers, OKRs | "What's your objective?" "What would success look like?" |
| Team/HR | Root Cause Analysis, GROW | "What's actually going wrong?" "What's been tried?" |
| Marketing | Positioning, Funnel Mapping | "Who's the customer?" "What's the pain?" |
| Operations | Bottleneck Mapping | "Where's the work stuck?" |
| Fundraising | Investor Fit, Milestones | "What's the ask?" "What traction?" |

#### **Flow Steps**:
1. Clarify user's goal/issue
2. Explore dimensions and constraints
3. Generate options/paths
4. Refine into concrete objectives
5. Propose actionable tasks

#### **Output Format**:
```
Based on what we've discussed, here's what I heard:

Objectives:
• Rebuild technical team morale over next 4 weeks
• Refocus delivery around achievable core roadmap

Tasks:
1. Conduct exit interviews
   Assigned: You | Due: Friday
   "Talk to last 3 engineers who left"

2. Draft internal roadmap reset email
   Assigned: CTO | Due: Tuesday
   "Communicate which goals are shifting"

3. Book engineering offsite prep call
   Assigned: Unspecified | Start: This week

Does that reflect what you had in mind?
[Confirm] [Edit] [Discard]
```

**Implementation Plan**:
1. Create new `BrainstormModal` component
2. Use OpenAI GPT-4o for conversation (already integrated)
3. Follow framework-based prompting internally
4. Extract objectives and tasks from conversation
5. Allow user to confirm/edit before saving

**Priority**: P1 (High) - Core feature enhancement

---

## 6. REPORTS AI ENHANCEMENT

### 6.1 Research Current Reports System
**File**: Likely `src/app/reports.tsx` or similar
**Action**: Find and read reports implementation

### 6.2 Enhance with AI & Better Formatting
**User Request**: "go through entire report section and see how we can use AI to simply improve the quality of the reports, and that includes using things like Google Noto, Banana and other things to make really amazing reports"

**AI Services Mentioned**:
- Google Gemini (via EXPO_PUBLIC_GOOGLE_AI_API_KEY)
- Nanobanana (mentioned as "Noto, Banana" - likely typo for NanoBanana)
- Existing: OpenAI, Anthropic, Grok, ElevenLabs

**Enhancement Strategy**:
1. **AI-Generated Insights**:
   - Use AI to analyze data and generate narrative
   - Executive summaries
   - Trend analysis
   - Recommendations

2. **Better Formatting**:
   - Use react-native-render-html for rich formatting
   - Add charts (already have chart libraries)
   - Professional layout with sections
   - Export to PDF (already have react-native-html-to-pdf)

3. **Report Types**:
   - Weekly Status Report
   - Board Pack (investor report)
   - Team Performance Report
   - Financial Summary
   - OKR Progress Report

**Implementation**:
- Create report templates
- Use AI to fill in insights
- Generate professional PDFs
- Allow customization

**Priority**: P2 (Medium)

---

## 7. ONBOARDING/TUTORIAL UPDATE

### 7.1 Update Start Tutorial
**File**: Likely `src/app/onboarding.tsx` or onboarding flow
**Issue**: "needs to be completely updated given the changes which we have made"

**Changes to Reflect**:
- Voice-to-task workflow
- WHY tab is now for strategic brainstorming
- WHO tab includes Guild
- TOOLS tab restructure
- Removed features (Function Library, etc.)

**Priority**: P1

---

## 8. BRANDING FIXES

### 8.1 Fix "Fractional Foundry" References
**File**: `src/app/settings/about.tsx` and anywhere else
**Issue**: "talking about Fractional Foundry" - naming inconsistency
**Fix**: Replace all "Fractional Foundry" with "Centaur OS"

**Search Pattern**:
```bash
grep -r "Fractional Foundry" src/
```

**Priority**: P1

---

## 9. DATA MANAGEMENT SUPABASE REVIEW

### 9.1 Review Current Data Export System
**File**: `src/lib/data-export.ts`
**File**: Settings screen Data Management section

**Questions to Answer**:
1. Is CSV export still useful with Supabase?
   - **Yes**: Backups, external analysis, migration
2. Is CSV import redundant?
   - **Maybe**: If Supabase is source of truth, import might be risky
3. Does Google Sheets sync make sense?
   - **Need architecture decision**

### 9.2 Proposed Data Management Updates

**Keep**:
- Export to CSV (for backups)
- Generate reports (PDF)
- Supabase data viewing

**Remove**:
- CSV import (or make it expert-only with warnings)
- Google Sheets sync (redundant with Supabase)

**Add**:
- Supabase connection status
- Data sync status
- Clear explanation: "Your data lives in Supabase. Export for backups only."

**Priority**: P2

---

## IMPLEMENTATION ORDER

### Phase 1: Critical Removals & Moves (Immediate)
1. ✅ **2.1** - Remove Function Library completely
2. ✅ **1.4** - Move Guilds from Settings to WHO tab
3. ✅ **5.1** - Move Startup Pack from Settings to WHY tab
4. ✅ **1.1** - Remove "Pending Approvals" orphan
5. ✅ **8.1** - Fix "Fractional Foundry" → "Centaur OS"

### Phase 2: High Priority UX (This Week)
6. ✅ **4.1** - Implement Guild in WHO tab with explanation
7. ✅ **5.2** - Implement AI Brainstorming in WHY tab
8. ✅ **3.1** - Complete theme quirks audit
9. ✅ **7.1** - Update onboarding tutorial

### Phase 3: Medium Priority (Next Week)
10. ✅ **6.1** - Research reports system
11. ✅ **6.2** - Enhance reports with AI
12. ✅ **1.3** - Review and update Data Management
13. ✅ **9.2** - Clarify Data Management with Supabase

### Phase 4: Polish & Documentation
14. ✅ **4.2** - Deep dive into Guild system details
15. ✅ **1.2** - Test Generate Report with no data
16. ✅ Documentation updates

---

## FILES TO MODIFY

### Immediate Changes:
1. `src/app/(tabs)/settings.tsx` - Remove Function Library, Pending Approvals
2. `src/app/(tabs)/who.tsx` - Add Guild tab
3. `src/app/(tabs)/why.tsx` - Add Startup Pack, AI Brainstorming
4. `src/app/settings/about.tsx` - Fix branding
5. Navigation configs - Remove Function Library links

### New Components Needed:
1. `src/components/GuildSection.tsx` - Guild UI for WHO tab
2. `src/components/AIBrainstormModal.tsx` - Strategic brainstorming
3. `src/components/StartupPackWidget.tsx` - For WHY tab

### Files to Audit (Theme):
- All screens and components for theme consistency

---

## TESTING CHECKLIST

After implementation:

### Settings
- [ ] No "Function Library" in Quick Actions
- [ ] No "Function Library" in Resources
- [ ] No "Pending Approvals" in Quick Actions
- [ ] Guilds removed from Team & Collaboration
- [ ] Data Management section clear about Supabase
- [ ] "Generate Report" works (or shows appropriate message)
- [ ] About page says "Centaur OS" not "Fractional Foundry"

### WHO Tab
- [ ] Guild tab/section visible
- [ ] Guild opens with explanation modal first time
- [ ] Guild shows events, community, XP system
- [ ] Color coding: current (green) vs future/external (purple)

### WHY Tab
- [ ] Startup Pack prominently featured
- [ ] AI Brainstorming button visible
- [ ] AI conversation follows framework logic
- [ ] Output generates objectives and tasks
- [ ] User can confirm/edit/discard

### Theme
- [ ] All screens work in Dark mode
- [ ] All screens work in Light mode
- [ ] All screens work in Off-White mode
- [ ] All screens work in System mode
- [ ] No hardcoded colors
- [ ] All text readable
- [ ] All borders visible

### Onboarding
- [ ] Tutorial reflects current app structure
- [ ] No references to removed features
- [ ] Shows voice-to-task workflow
- [ ] Shows WHY tab brainstorming

### Reports
- [ ] AI-enhanced insights
- [ ] Professional formatting
- [ ] PDF export works
- [ ] Multiple report types available

---

## NOTES

- **DO NOT IMPLEMENT** - This is planning only
- User feedback was voice transcription - may have minor errors
- "Noto, Banana" likely means NanoBanana API
- Guild system already exists - needs to be surfaced properly
- AI brainstorming is new major feature
- Theme audit will take time - be thorough
- Data Management needs architectural decision on Supabase integration

---

## AI BRAINSTORMING PROMPT REFERENCE

(Included from user's voice input - use this for implementation)

### System Prompt for AI:
```
You are a business-thinking partner and brainstorming assistant for 
founders and executives. Help them think through problems using 
structured, domain-aware reasoning.

Your job:
1. Clarify the user's context and objective
2. Prompt useful business questions in orderly, domain-specific way
3. Convert ideas into objectives and tasks

Be collaborative, clear, strategic. Avoid vague advice. Ask smart 
questions and listen closely. Work with both speech and typed input.
```

### Framework Reference (internal use):
- Strategy: 7 Powers, JTBD, OKRs
- Team/HR: Root cause, GROW, feedback loops
- Marketing: Positioning, funnel, pain/value
- Fundraising: Investor milestones, capital plan
- Operations: RACI, constraints, bottlenecks

### Example Inputs:
- "We've had 3 engineers leave and I don't know how to keep morale up"
- "Should we focus on B2B or B2C version?"
- "I think our marketing is missing something"

### Output Structure:
```
Objectives:
• [Clear objective statement]

Tasks:
1. [Task title]
   Assigned: [Person] | Due: [Date] | Start: [When]
   "[Description]"
```

