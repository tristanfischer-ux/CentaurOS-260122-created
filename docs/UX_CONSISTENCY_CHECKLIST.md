# UX Consistency Checklist

Audit checklist for ensuring consistent user experience across CursorOS.

## Color System

### Tab Header Gradients
| Tab | Primary | Secondary | Status |
|-----|---------|-----------|--------|
| Home | #7c3aed | #5b21b6 | ✓ |
| Who | #0ea5e9 | #0284c7 | ✓ |
| What | #10b981 | #047857 | ✓ |
| Why | #8b5cf6 | #6d28d9 | ✓ |
| Tools | #f59e0b | #b45309 | ✓ |
| Performance | #3b82f6 | #1d4ed8 | ✓ |
| Settings | #64748b | #475569 | ✓ |

### Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| Success/Completed | green-500 | Completed tasks, on-track OKRs |
| Warning/At-Risk | amber-500 | At-risk items, pending |
| Error/Off-Track | red-500 | Off-track, blocked, failed |
| Info/In-Progress | blue-500 | In progress, syncing |
| Neutral | slate-500 | Inactive, not started |

### Audit Items
- [ ] All success states use green-500
- [ ] All warning states use amber-500
- [ ] All error states use red-500
- [ ] All info states use blue-500
- [ ] No random color choices in new components

---

## Typography

### Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Screen Title | text-2xl | font-bold |
| Section Title | text-lg | font-semibold |
| Card Title | text-base | font-semibold |
| Body Text | text-sm | font-normal |
| Caption/Label | text-xs | font-medium |
| Badge Text | text-xs | font-semibold |

### Audit Items
- [ ] Screen titles are text-2xl font-bold
- [ ] Section titles are text-lg font-semibold
- [ ] Consistent body text sizing
- [ ] Labels use text-xs font-medium
- [ ] No inline style font overrides

---

## Spacing

### Standard Spacing
| Context | Class |
|---------|-------|
| Screen padding | px-4 |
| Section gap | gap-4 or gap-6 |
| Card padding | p-4 |
| Card gap | gap-3 |
| Between elements | gap-2 |

### Audit Items
- [ ] All screens use px-4 horizontal padding
- [ ] Consistent gap between sections
- [ ] Cards use p-4 padding
- [ ] No arbitrary spacing values

---

## Components

### Cards
- [ ] Use rounded-xl border radius
- [ ] Use consistent shadow (shadow-sm)
- [ ] Use bg-white dark:bg-slate-800
- [ ] Use p-4 padding

### Buttons
- [ ] Primary: gradient or solid color
- [ ] Secondary: bg-slate-200 dark:bg-slate-700
- [ ] Use rounded-xl
- [ ] Use px-4 py-2 padding
- [ ] Use Pressable, not TouchableOpacity

### Modals
- [ ] Follow standard modal pattern (see STYLE_GUIDE.md)
- [ ] Use transparent + animationType="slide"
- [ ] Use bg-black/70 overlay
- [ ] Handle tap-outside-to-dismiss
- [ ] Handle Android back button

### Badges
- [ ] Use rounded-full
- [ ] Use px-2 py-0.5
- [ ] Use text-xs font-semibold
- [ ] Status-appropriate colors

---

## Icons

### Library
All icons should use lucide-react-native.

### Sizes
| Context | Size |
|---------|------|
| Tab bar | 24 |
| Card action | 20 |
| Button inline | 16 |
| Badge/indicator | 12 |

### Audit Items
- [ ] All icons from lucide-react-native
- [ ] Consistent sizing per context
- [ ] No mixed icon libraries

---

## Dark Mode

### Color Mapping
| Light | Dark |
|-------|------|
| bg-white | bg-slate-900 |
| bg-slate-50 | bg-slate-800 |
| bg-slate-100 | bg-slate-700 |
| text-slate-900 | text-white |
| text-slate-600 | text-slate-400 |
| border-slate-200 | border-slate-700 |

### Audit Items
- [ ] All components have dark: variants
- [ ] Text is readable in both modes
- [ ] Gradients work in dark mode
- [ ] No hardcoded light-only colors

---

## Accessibility

### Requirements
- [ ] All interactive elements have accessible labels
- [ ] Touch targets are at least 44x44 points
- [ ] Color is not the only indicator of state
- [ ] Text contrast meets WCAG AA

### Audit Items
- [ ] Buttons have accessibilityLabel
- [ ] Images have accessibilityLabel
- [ ] Status has text + color indicator
- [ ] No color-only status indicators

---

## Animations

### Standard Animations
| Type | Duration | Easing |
|------|----------|--------|
| Fade | 200ms | linear |
| Slide | 300ms | ease-out |
| Spring | - | damping: 15 |
| Pulse | 800ms | ease-in-out |

### Audit Items
- [ ] Use react-native-reanimated
- [ ] Consistent animation timing
- [ ] No jarring or slow animations
- [ ] Animations don't block interaction

---

## Forms

### Input Fields
- [ ] Use rounded-xl border
- [ ] Use p-4 padding
- [ ] Use placeholder text
- [ ] Show validation errors below field
- [ ] Use consistent focus state

### Validation
- [ ] Error text is red-500
- [ ] Success text is green-500
- [ ] Errors appear immediately or on blur
- [ ] Clear error when user starts typing

---

## Loading States

### Patterns
- [ ] Use skeleton loaders for lists
- [ ] Use spinner for actions
- [ ] Show "Loading..." text when appropriate
- [ ] Never show blank screen

### Audit Items
- [ ] All async actions show loading state
- [ ] Loading state matches component size
- [ ] Consistent loading component usage

---

## Empty States

### Requirements
- [ ] All lists have empty state
- [ ] Empty state has icon + message
- [ ] Empty state suggests action
- [ ] Consistent empty state styling

---

## Overall Audit Score

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| Color System | | | |
| Typography | | | |
| Spacing | | | |
| Components | | | |
| Icons | | | |
| Dark Mode | | | |
| Accessibility | | | |
| Animations | | | |
| Forms | | | |
| Loading States | | | |
| Empty States | | | |

**Total Score**: ___/11 categories passing

**Issues Found**:
1.
2.
3.

**Priority Fixes**:
1.
2.
3.

---

*Last audited: YYYY-MM-DD*
*Audited by: ___*
