# STYLE_SYSTEM.md - UI Primitives and Tailwind Conventions

**Last Updated**: 2026-01-19

## Overview

This document defines the UI primitives, Tailwind conventions, and design system for CentaurOS.

---

## Color System

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#3b82f6` | Primary actions, active states |
| Emerald | `#10b981` | Success, completion, Tasks tab |
| Purple | `#8b5cf6` | Marketplace, When tab |
| Amber | `#f59e0b` | Warnings, drafts |
| Red | `#ef4444` | Errors, blocked status |
| Slate | `#64748b` | Secondary text, queued status |

### Theme Colors

| Theme | Background | Surface | Border | Text |
|-------|------------|---------|--------|------|
| Light | `white` | `slate-50` | `slate-200` | `slate-900` |
| Dark | `slate-950` | `slate-900` | `slate-800` | `white` |
| Off-white | `stone-50` | `stone-100` | `stone-200` | `slate-900` |

### Status Colors

| Status | Color | Background |
|--------|-------|------------|
| Doing | `#3b82f6` | `#3b82f620` |
| Queued | `#64748b` | `#64748b20` |
| Blocked | `#ef4444` | `#ef444420` |
| Done | `#10b981` | `#10b98120` |
| Draft | `#f59e0b` | `#f59e0b20` |

---

## Typography

### Font Sizes

| Name | Class | Usage |
|------|-------|-------|
| xs | `text-xs` | Labels, captions |
| sm | `text-sm` | Secondary text |
| base | `text-base` | Body text |
| lg | `text-lg` | Section headers |
| xl | `text-xl` | Modal titles |
| 2xl | `text-2xl` | Tab titles |

### Font Weights

| Name | Class | Usage |
|------|-------|-------|
| normal | `font-normal` | Body text |
| medium | `font-medium` | Labels, secondary headers |
| semibold | `font-semibold` | Section headers |
| bold | `font-bold` | Titles, emphasis |

---

## Spacing

### Standard Spacing Scale

| Size | Value | Usage |
|------|-------|-------|
| 0.5 | 2px | Tight gaps |
| 1 | 4px | Inline spacing |
| 2 | 8px | Small gaps |
| 3 | 12px | Medium gaps |
| 4 | 16px | Standard padding |
| 5 | 20px | Section padding |
| 6 | 24px | Large padding |

### Common Patterns

```
- Card padding: px-4 py-3 or p-4
- Section margin: mb-6
- List item gap: gap-3
- Header padding: px-5 pt-4 pb-2
- Safe area: insets.top + 12, insets.bottom + 100
```

---

## Components

### Cards

```tsx
// Standard card
<View className="bg-white dark:bg-slate-800 rounded-xl p-4">
  {/* content */}
</View>

// Card with border accent
<View className="bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 border-blue-500">
  {/* content */}
</View>

// Draft card (amber accent)
<View className="bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 border-amber-500">
  {/* content */}
</View>
```

### Buttons

```tsx
// Primary button
<Pressable className="bg-blue-500 py-4 rounded-xl items-center active:opacity-80">
  <Text className="text-white font-semibold">Action</Text>
</Pressable>

// Secondary button
<Pressable className="bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center">
  <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
</Pressable>

// Pill button
<Pressable className="bg-blue-500 px-3 py-1.5 rounded-full flex-row items-center gap-1">
  <Text className="text-white text-xs font-medium">Label</Text>
</Pressable>
```

### Modals

```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <Pressable className="flex-1 bg-black/70" onPress={onClose}>
    <View className="flex-1" /> {/* Spacer */}
    <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
      <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Title</Text>
          <Pressable onPress={onClose} className="p-2">
            <X size={24} color="#64748b" />
          </Pressable>
        </View>

        {/* Content with scroll */}
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* content */}
        </ScrollView>

        {/* Footer - always visible */}
        <View className="flex-row gap-3 mt-4">
          <Pressable className="flex-1 bg-slate-200 py-4 rounded-xl items-center">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </Pressable>
          <Pressable className="flex-1 bg-blue-500 py-4 rounded-xl items-center">
            <Text className="text-white font-semibold">Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  </Pressable>
</Modal>
```

### Headers

```tsx
<LinearGradient
  colors={['#10b981', '#059669', '#047857']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={{
    paddingHorizontal: 20,
    paddingTop: insets.top + 12,
    paddingBottom: 16,
  }}
>
  <View className="flex-row items-center justify-between mb-4">
    <View>
      <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Label</Text>
      <Text className="text-white text-2xl font-bold">Title</Text>
    </View>
    <View className="flex-row items-center gap-2">
      {/* Action buttons */}
    </View>
  </View>
</LinearGradient>
```

---

## Icons

Use `lucide-react-native` for all icons:

```tsx
import { IconName } from 'lucide-react-native';

<IconName size={20} color="#3b82f6" />
```

### Standard Sizes

| Size | Usage |
|------|-------|
| 14 | Inline, badges |
| 16 | Small buttons |
| 18 | List icons |
| 20 | Standard actions |
| 24 | Headers, modals |
| 48 | Empty states |

---

## Animations

Use `react-native-reanimated` for animations:

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.springify()}>
  {/* content */}
</Animated.View>
```

---

## Nativewind Notes

- Use `className` for View and Text components
- Use inline `style` prop for LinearGradient, Animated components
- Use `cn()` helper for conditional classNames
- Dark mode: `dark:` prefix (e.g., `dark:bg-slate-800`)
