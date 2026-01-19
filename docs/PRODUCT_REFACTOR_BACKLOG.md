# Product Refactor Backlog

Technical debt and refactoring items for CursorOS, organized by priority.

## Priority: Critical (Blocking Issues)

### CR-001: Hidden Tabs Architecture
**Location**: `src/app/(tabs)/_layout.tsx`
**Issue**: 5 tabs (decide, do, evaluate, make, community) are registered but hidden with `href: null`
**Impact**: Confusing navigation, potential dead code, unclear feature boundaries
**Recommendation**:
- Merge hidden tabs into visible tabs OR
- Remove if not needed OR
- Document why they exist

### CR-002: Role-Based Home Variants
**Location**: `src/app/(tabs)/index.tsx`
**Issue**: Single file handles 3 different home screens (Founder, Exec, Apprentice)
**Impact**: Complex maintenance, hard to test
**Recommendation**: Extract to separate components or use composition pattern

---

## Priority: High (Significant Impact)

### HR-001: Demo Mode Fallbacks
**Locations**: Multiple screens
**Issue**: Many screens have "demo mode" fallbacks with hardcoded data
**Impact**: Inconsistent behavior, potential bugs when workspace is null
**Recommendation**: Create explicit demo mode with sample data loader

### HR-002: Mixed State Management
**Issue**: Uses both Zustand stores and React Query, sometimes inconsistently
**Impact**: Cache invalidation issues, potential stale data
**Recommendation**: Establish clear pattern: Zustand for local UI state, React Query for server state

### HR-003: Store Initialization Patterns
**Location**: Various stores
**Issue**: Inconsistent initialization patterns across stores
**Impact**: Race conditions, initialization bugs
**Recommendation**: Standardize store initialization in app startup

### HR-004: Marketplace Data Loading
**Location**: TOOLS tab, WHO tab
**Issue**: Marketplace data loading is duplicated across tabs
**Impact**: Inconsistent loading, wasted requests
**Recommendation**: Create shared marketplace data layer

### HR-005: Task Draft Flow Complexity
**Location**: `src/app/(tabs)/what.tsx`
**Issue**: Task draft extraction + review + confirmation is complex single-file flow
**Impact**: Hard to maintain, test, extend
**Recommendation**: Extract to dedicated component/hook

---

## Priority: Medium (Technical Debt)

### MR-001: Onboarding Store vs Supabase
**Location**: `src/lib/onboarding/store.ts`
**Issue**: Onboarding uses Zustand but references Supabase tables
**Impact**: Unclear data persistence layer
**Recommendation**: Decide: Zustand-only or Supabase-backed

### MR-002: Voice Input Component Coupling
**Location**: `src/components/VoiceInputButton.tsx`
**Issue**: Tightly coupled to specific transcription flow
**Impact**: Hard to reuse, hard to test
**Recommendation**: Make generic voice recorder component

### MR-003: Inconsistent Modal Patterns
**Location**: Various screens
**Issue**: Different modal implementations across screens
**Impact**: Inconsistent UX, potential bugs
**Recommendation**: Create standard Modal component wrapper

### MR-004: Finance Store Complexity
**Location**: `src/stores/finance.ts`
**Issue**: Complex calculations mixed with state management
**Impact**: Hard to test, hard to modify
**Recommendation**: Extract calculations to pure functions

### MR-005: Supplier vs Marketplace Overlap
**Location**: TOOLS tab
**Issue**: "My Suppliers" and "Marketplace" have overlapping concerns
**Impact**: Unclear user journey
**Recommendation**: Clarify: Marketplace for discovery, My Suppliers for active engagements

---

## Priority: Low (Nice to Have)

### LR-001: Component Directory Structure
**Location**: `src/components/`
**Issue**: Flat structure, no organization by feature
**Recommendation**: Organize by feature or atomic design pattern

### LR-002: API Route Organization
**Location**: `src/app/api/`
**Issue**: Growing number of routes, some deeply nested
**Recommendation**: Establish clear naming convention and structure

### LR-003: Type Sharing Between API and Client
**Issue**: Some types duplicated between API routes and client code
**Recommendation**: Create shared types package

### LR-004: Test Coverage
**Issue**: Limited test coverage
**Recommendation**: Add unit tests for:
- Store logic
- Pure utility functions
- API routes

### LR-005: Documentation Gaps
**Issue**: Some features lack documentation
**Recommendation**: Document:
- API endpoints
- Store usage
- Component props

---

## Refactor Principles

1. **One Thing at a Time**: Each refactor PR should address one issue
2. **Tests First**: Add tests before refactoring when possible
3. **Feature Flag**: Use feature flags for large refactors
4. **Document**: Update relevant docs after refactoring
5. **Review**: Get code review before merging refactors

---

## Completed Refactors

| ID | Title | Date | Notes |
|----|-------|------|-------|
| SEC-001 | Client-side API key removal | 2026-01-19 | Phase 0 security fix |

---

## Adding New Items

When adding refactor items:
1. Assign ID: CR/HR/MR/LR-XXX
2. Describe location and issue clearly
3. Explain impact
4. Provide recommendation
5. Add to appropriate priority section
