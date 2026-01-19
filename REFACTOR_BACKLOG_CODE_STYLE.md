# REFACTOR_BACKLOG_CODE_STYLE.md - Lint Issues & Fix Plan

**Last Updated**: 2026-01-19
**Source**: CODE_STYLE_AUDIT_REPORT.md

## Overview

This document tracks code style issues identified during audits and the plan to fix them.

---

## Priority 0: Must Fix (Causes Bugs)

### Missing useEffect Dependencies

| File | Issue | Fix |
|------|-------|-----|
| `_layout.tsx` | `setCurrentWorkspace` missing | Add to deps array |
| `decide.tsx` | `initializeDemoRequests` missing | Add to deps array or wrap in useCallback |
| `decide.tsx` | `taskOKRRequests.length` missing | Add to deps array |
| `decide.tsx` | `seedResourceData` missing | Add to deps array |
| `decide.tsx` | `initializeQueue` missing | Add to deps array |
| `decide.tsx` | `selectedTaskForAllocation` missing | Add to deps array |

**Status**: PENDING - Requires careful review to avoid infinite loops

---

## Priority 1: Should Fix (Technical Debt)

### Unused Imports

| File | Count | Status |
|------|-------|--------|
| `decide.tsx` | ~30 | PENDING |
| `community.tsx` | ~15 | PENDING |
| `do.tsx` | ~10 | PENDING |
| `who.tsx` | ~5 | PENDING |
| `what.tsx` | ~5 | PENDING |

### Unused Variables

| File | Count | Status |
|------|-------|--------|
| `decide.tsx` | ~40 | PENDING |
| `community.tsx` | ~20 | PENDING |
| Various | ~20 | PENDING |

---

## Priority 2: Nice to Have

### Array Type Style

Change `Array<T>` to `T[]` for consistency:

| File | Location | Status |
|------|----------|--------|
| `decide.tsx` | Multiple | PENDING |

### Missing Type Annotations

| File | Issue | Status |
|------|-------|--------|
| Various | Implicit `any` types | PENDING |

### Commented-out Code

| File | Issue | Status |
|------|-------|--------|
| Various | Dead code removal | PENDING |

---

## Fix Strategy

### Phase 1: Immediate (This Week)
1. Fix P0 useEffect dependency issues in `_layout.tsx`
2. Run `bun run lint --fix` for auto-fixable issues
3. Manually remove unused imports from `decide.tsx`

### Phase 2: Short Term (Next Week)
1. Fix remaining P0 issues in `decide.tsx`
2. Clean up `community.tsx` and `do.tsx`
3. Add pre-commit lint hook

### Phase 3: Long Term
1. Configure lint rules as errors (not warnings)
2. Regular lint cleanup sprints
3. Add TypeScript strict mode checks

---

## Commands

```bash
# Run lint
bun run lint

# Auto-fix what's possible
bun run lint --fix

# Type check
bun run tsc --noEmit
```

---

## Notes

- Legacy tabs (`who.tsx`, `what.tsx`, `tools.tsx`) have redirects now but still contain original code
- These files will be cleaned up in Phase 3 of the deprecation timeline (4 weeks)
- Focus on new tab files first (`tasks.tsx`, `marketplace.tsx`, etc.)
