# Documentation Index

## Core Documentation

### 1. **CLAUDE.md** - Primary Development Instructions
Location: `/home/user/workspace/CLAUDE.md`
- Tech stack and environment setup
- Project structure
- TypeScript standards
- Routing patterns
- State management
- Common mistakes to avoid

### 2. **STYLE_GUIDE.md** - Comprehensive Style Guide ⭐
Location: `/home/user/workspace/STYLE_GUIDE.md`
**USE THIS FOR ALL DEVELOPMENT**

Covers:
- Design system and philosophy
- Component standards and templates
- Layout, spacing, typography
- Colors and theming (light/dark/off-white)
- Icons and imagery guidelines
- Animations and interactions
- **Modal standards (CRITICAL)**
- Form standards and validation
- Data display patterns
- Navigation patterns
- State management patterns
- Error handling patterns
- Accessibility requirements
- Code standards and best practices
- Dos and don'ts
- Quick reference for common patterns

### 3. **PERFORMANCE_OPTIMIZATION.md** - Performance Optimization Plan ⚡ NEW
Location: `/home/user/workspace/PERFORMANCE_OPTIMIZATION.md`
**40-PAGE COMPREHENSIVE PERFORMANCE GUIDE**

Complete optimization roadmap including:
- 12-point optimization plan with priorities
- Before/after code examples for each optimization
- Expected impact metrics (50-80% improvements)
- Implementation checklists
- Week-by-week schedule
- Tooling and testing strategies
- Common pitfalls to avoid

**Quick Links:**
- Critical optimizations: FlashList, Memoization, Code Splitting, MMKV, Zustand
- See **OPTIMIZATION_SUMMARY.md** for executive summary

### 4. **OPTIMIZATION_SUMMARY.md** - Performance Quick Reference ⚡ NEW
Location: `/home/user/workspace/OPTIMIZATION_SUMMARY.md`
**FAST LOOKUP FOR PERFORMANCE PRIORITIES**

Quick reference including:
- Top 5 critical optimizations
- Current state analysis
- Implementation timeline
- Quick start guide
- Success metrics
- Checklist

### 5. **IMPROVEMENTS.md** - Implementation Log
Location: `/home/user/workspace/IMPROVEMENTS.md`
- All improvements completed (items 1-20)
- Performance optimization summary (section at end)
- Component usage instructions
- Integration checklist
- Known issues and TODOs

### 6. **IMPLEMENTATION_SUMMARY.md** - Quick Start Guide
Location: `/home/user/workspace/IMPLEMENTATION_SUMMARY.md`
- Summary of all new features
- Quick examples and usage
- Impact summary
- Next steps

### 7. **README.md** - Project Overview
Location: `/home/user/workspace/README.md`
- High-level architecture
- Feature overview
- Recent updates (including performance plan)
- Getting started guide

---

## Quick Links by Task

### Optimizing Performance? ⚡
→ Read **PERFORMANCE_OPTIMIZATION.md** for full plan
→ Read **OPTIMIZATION_SUMMARY.md** for quick reference
→ Top priorities: FlashList, Memoization, MMKV, Code Splitting

### Building New Components?
→ Read **STYLE_GUIDE.md** sections:
- Component Standards
- Layout & Spacing
- Typography
- Colors & Theming

### Creating Modals?
→ Read **STYLE_GUIDE.md** section: Modal Standards (CRITICAL)

### Adding Forms?
→ Read **STYLE_GUIDE.md** section: Form Standards

### Implementing Animations?
→ Read **STYLE_GUIDE.md** section: Animations & Interactions

### Managing State?
→ Read **STYLE_GUIDE.md** section: State Management

### Handling Errors?
→ Read **STYLE_GUIDE.md** section: Error Handling
→ Use components in `/src/components/ErrorComponents.tsx`

### Adding Accessibility?
→ Read **STYLE_GUIDE.md** section: Accessibility

### Not Sure About Something?
→ Check **STYLE_GUIDE.md** Quick Reference section first!

---

## Component Library

### New Components (Ready to Use)
All located in `/src/components/`:

1. **LoadingState.tsx** - Loading states and skeletons
2. **ErrorComponents.tsx** - Error handling components
3. **NotificationCenter.tsx** - Notification center UI
4. **SearchAndFilter.tsx** - Search and filter components
5. **BulkSelection.tsx** - Bulk selection components
6. **AnimatedComponents.tsx** - Animation wrappers

### Utility Libraries
Located in `/src/lib/`:

1. **haptics.ts** - Haptic feedback functions
2. **export-utils.ts** - Data export and backup
3. **ai-suggestions.ts** - Smart allocation suggestions
4. **templates/work-templates.ts** - Task and OKR templates

### State Stores
Located in `/src/lib/state/`:

1. **notification-store.ts** - Notification management
2. **dashboard-layout-store.ts** - Dashboard customization

---

## Development Workflow

### Before Starting Any Task:
1. ✅ Read relevant section in **STYLE_GUIDE.md**
2. ✅ Check if similar components exist
3. ✅ Follow exact patterns documented
4. ✅ Ensure theme support (light/dark/off-white)
5. ✅ Add loading and error states
6. ✅ Include accessibility labels

### During Development:
1. ✅ Use TypeScript strict mode
2. ✅ Follow naming conventions
3. ✅ Add haptic feedback to interactions
4. ✅ Test with all three themes
5. ✅ Handle empty states
6. ✅ Add animations where appropriate

### Before Committing:
1. ✅ Remove debug markers
2. ✅ Check no TypeScript errors
3. ✅ Verify theme switching works
4. ✅ Test on iOS (primary platform)
5. ✅ Update documentation if needed

---

## File Organization

```
/home/user/workspace/
├── CLAUDE.md                    # Primary instructions
├── STYLE_GUIDE.md              # ⭐ Comprehensive style guide
├── IMPROVEMENTS.md             # Implementation log
├── IMPLEMENTATION_SUMMARY.md   # Quick start
├── README.md                   # Project overview
├── src/
│   ├── app/                    # Screens (Expo Router)
│   │   ├── (tabs)/            # Tab screens
│   │   └── *.tsx              # Standalone screens
│   ├── components/             # Reusable components
│   │   ├── LoadingState.tsx
│   │   ├── ErrorComponents.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── SearchAndFilter.tsx
│   │   ├── BulkSelection.tsx
│   │   └── AnimatedComponents.tsx
│   ├── lib/                    # Utilities and logic
│   │   ├── state/             # Zustand stores
│   │   ├── templates/         # Templates
│   │   ├── haptics.ts
│   │   ├── export-utils.ts
│   │   └── ai-suggestions.ts
│   └── types/                  # TypeScript types
└── ...
```

---

## Common Questions

**Q: Where do I find design standards?**
A: **STYLE_GUIDE.md** - sections on Design System, Colors, Typography

**Q: How do I create a modal correctly?**
A: **STYLE_GUIDE.md** - Modal Standards section (includes exact template)

**Q: What spacing should I use?**
A: **STYLE_GUIDE.md** - Layout & Spacing section

**Q: How do I handle themes?**
A: **STYLE_GUIDE.md** - Colors & Theming section

**Q: What icons should I use?**
A: **STYLE_GUIDE.md** - Icons & Imagery section (lucide-react-native only)

**Q: How do I add animations?**
A: **STYLE_GUIDE.md** - Animations & Interactions section

**Q: How do I manage state?**
A: **STYLE_GUIDE.md** - State Management section

**Q: What components are available?**
A: See "Component Library" section above

**Q: How do I implement notifications?**
A: **IMPROVEMENTS.md** - section 3 has full docs + examples

**Q: Where are the task templates?**
A: `/src/lib/templates/work-templates.ts`

---

## Important Notes

⚠️ **ALWAYS reference STYLE_GUIDE.md before building new features**

⚠️ **Modal pattern in STYLE_GUIDE.md is CRITICAL** - deviating causes bugs

⚠️ **All components must support 3 themes:** light, dark, off-white

⚠️ **Use Zustand selectors that return primitives** to prevent re-renders

⚠️ **Never use Alert.alert()** - use custom modals instead

⚠️ **Use lucide-react-native exclusively** for icons

⚠️ **Always add loading and error states** to async operations

---

*This index was created on 2026-01-16 to organize all project documentation.*
