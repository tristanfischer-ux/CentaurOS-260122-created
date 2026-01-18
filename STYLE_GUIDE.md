# Centaur OS Style Guide

**Version:** 1.1
**Last Updated:** 2026-01-18
**Purpose:** Comprehensive design and development standards for Centaur OS

**KEY UPDATES:**
- ✨ **Color Hierarchy Clarified:** Blue (#3b82f6) is PRIMARY for UI/actions, Purple (#8b5cf6) is BRAND/accent
- ✨ **Theme Support:** All components now support light/dark/off-white themes with `isOffWhite`
- ✨ **Consistency Standards:** Enforced Zustand selectors and haptic feedback patterns

---

## Table of Contents

1. [Design System](#design-system)
2. [Component Standards](#component-standards)
3. [Layout & Spacing](#layout--spacing)
4. [Typography](#typography)
5. [Colors & Theming](#colors--theming)
6. [Icons & Imagery](#icons--imagery)
7. [Animations & Interactions](#animations--interactions)
8. [Modal Standards](#modal-standards)
9. [Form Standards](#form-standards)
10. [Data Display](#data-display)
11. [Navigation](#navigation)
12. [State Management](#state-management)
13. [Error Handling](#error-handling)
14. [Accessibility](#accessibility)
15. [Code Standards](#code-standards)
16. [Testing Guidelines](#testing-guidelines)

---

## Design System

### Design Philosophy
- **Mobile-First:** Design for touch, thumb zones, and glanceability
- **Professional & Polished:** iOS HIG-inspired, not generic AI aesthetics
- **Contextual:** Business operations require clarity over decoration
- **Efficient:** Minimize taps, maximize information density

### Inspiration Sources
- ✅ iOS Human Interface Guidelines
- ✅ Instagram (mobile patterns)
- ✅ Airbnb (information hierarchy)
- ✅ Coinbase (data visualization)
- ✅ Polished habit trackers (progress visualization)

### Avoid
- ❌ Purple gradients on white backgrounds
- ❌ Generic centered layouts
- ❌ Web-like designs (this is mobile!)
- ❌ Overused fonts (Space Grotesk, Inter as primary)
- ❌ Predictable patterns and cookie-cutter designs

---

## Component Standards

### File Structure
```
src/components/
├── [ComponentName].tsx        # Main component
├── [ComponentName].test.tsx   # Tests (if needed)
└── README.md                  # Usage docs (for complex components)
```

### Component Template
```tsx
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import type { ComponentProps } from './types'; // if complex

interface MyComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function MyComponent({ title, onPress, variant = 'primary' }: MyComponentProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl py-4 px-6 active:opacity-70 ${
        variant === 'primary' ? 'bg-blue-600' : isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'
      }`}
    >
      <Text className={variant === 'primary' ? 'text-white font-bold' : `${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'} font-semibold`}>
        {title}
      </Text>
    </Pressable>
  );
}
```

### Naming Conventions
- **Components:** PascalCase (e.g., `TaskCard`, `NotificationBadge`)
- **Utilities:** camelCase (e.g., `formatDate`, `calculateProgress`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_TEAM_SIZE`)
- **Types/Interfaces:** PascalCase with descriptive suffix (e.g., `TaskCardProps`, `UserRole`)

---

## Layout & Spacing

### Spacing Scale (Tailwind)
Use consistent spacing throughout:
```
px-1  → 4px   (minimal)
px-2  → 8px   (tight)
px-3  → 12px  (compact)
px-4  → 16px  (default)
px-5  → 20px  (comfortable)
px-6  → 24px  (spacious)
px-8  → 32px  (large)
px-12 → 48px  (extra large)
```

### Standard Padding
- **Screen padding:** `px-5` (20px horizontal)
- **Card padding:** `p-4` (16px all sides)
- **Modal padding:** `px-5 py-6` (20px horizontal, 24px vertical)
- **Section spacing:** `mb-6` (24px between sections)
- **List item spacing:** `gap-3` (12px between items)

### Layout Patterns

#### Screen Layout
```tsx
<ScrollView className="flex-1 px-5 py-6">
  {/* Header section */}
  <View className="mb-6">
    <Text className="text-2xl font-bold mb-2">Title</Text>
    <Text className="text-gray-600">Subtitle</Text>
  </View>

  {/* Content sections */}
  <View className="mb-6">
    {/* Section content */}
  </View>
</ScrollView>
```

#### Card Layout
```tsx
<View className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-800">
  {/* Card content */}
</View>
```

#### Two-Column Layout
```tsx
<View className="flex-row gap-3">
  <View className="flex-1">
    {/* Left column */}
  </View>
  <View className="flex-1">
    {/* Right column */}
  </View>
</View>
```

---

## Typography

### Font Hierarchy
```tsx
// Page Title
<Text className="text-2xl font-bold text-gray-900 dark:text-white">
  Page Title
</Text>

// Section Header
<Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
  Section Header
</Text>

// Subsection Header
<Text className="text-sm font-bold text-gray-500 dark:text-slate-400 tracking-wide uppercase mb-2">
  SUBSECTION HEADER
</Text>

// Body Text
<Text className="text-base text-gray-900 dark:text-white">
  Body text content
</Text>

// Secondary Text
<Text className="text-sm text-gray-600 dark:text-slate-400">
  Secondary information
</Text>

// Caption / Metadata
<Text className="text-xs text-gray-500 dark:text-slate-500">
  Caption or metadata
</Text>
```

### Font Weights
- **Bold:** `font-bold` - Titles, headers, emphasized content
- **Semibold:** `font-semibold` - Buttons, important labels
- **Medium:** `font-medium` - Navigation, subtle emphasis
- **Regular:** (default) - Body text

### Text Colors (Theme-Aware)
```tsx
// Primary text
className={`${isDark ? 'text-white' : 'text-gray-900'}`}

// Secondary text
className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}

// Muted text
className={`${isDark ? 'text-slate-500' : 'text-gray-500'}`}

// Accent text
className="text-purple-600 dark:text-purple-400"
```

---

## Colors & Theming

### Theme Support
All components MUST support three themes:
- **Light:** Default light theme
- **Dark:** High contrast dark theme
- **Off-White:** Warm, cream-colored theme

### Theme Implementation
```tsx
import { useTheme } from '@/lib/ThemeContext';

const { theme } = useTheme();
const isDark = theme === 'dark';
const isOffWhite = theme === 'off-white';

// Use conditional classes
className={`${isDark ? 'bg-slate-900' : isOffWhite ? 'bg-orange-50' : 'bg-white'}`}
```

### Color Palette

#### Primary Colors

**IMPORTANT: Color Hierarchy**
- **Blue (#3b82f6)** = Primary UI color for interactive elements, buttons, links, and active states
- **Purple (#8b5cf6)** = Brand/accent color for highlighting, special features, and branding moments

```tsx
// Blue (Primary UI & Actions)
bg-blue-50   dark:bg-blue-900/20    // Subtle backgrounds, selected states
bg-blue-500  // Medium emphasis
bg-blue-600  // PRIMARY ACTIONS - Use for main CTAs, active states, interactive elements
text-blue-600 dark:text-blue-400     // Links, active text

// Purple (Brand & Accent)
bg-purple-50   dark:bg-purple-900/20  // Brand-themed backgrounds
bg-purple-100  dark:bg-purple-900/30
bg-purple-500  // Medium
bg-purple-600  // BRAND MOMENTS - Use sparingly for special features, branding
text-purple-600 dark:text-purple-400  // Brand text, premium features
```

**Usage Guidelines:**
- Use **Blue** for 80% of interactive elements (buttons, tabs, selections, notifications)
- Use **Purple** for 20% brand moments (premium features, achievements, branding)

#### Status Colors
```tsx
// Success (Green)
bg-emerald-50  dark:bg-emerald-900/20
bg-emerald-500
text-emerald-600 dark:text-emerald-400

// Warning (Amber)
bg-amber-50  dark:bg-amber-900/20
bg-amber-500
text-amber-600 dark:text-amber-400

// Error (Red)
bg-red-50  dark:bg-red-900/20
bg-red-500
bg-red-600
text-red-600 dark:text-red-400

// Info (Blue)
bg-blue-50  dark:bg-blue-900/20
text-blue-600 dark:text-blue-400
```

#### Neutral Colors
```tsx
// Light Theme
bg-white
bg-gray-50    // Subtle backgrounds
bg-gray-100   // Input backgrounds, secondary buttons
bg-gray-200   // Borders
text-gray-500 // Muted text
text-gray-600 // Secondary text
text-gray-900 // Primary text

// Dark Theme
bg-slate-950  // Screen background
bg-slate-900  // Card background
bg-slate-800  // Input background, secondary buttons
bg-slate-700  // Borders
text-slate-500 // Muted text
text-slate-400 // Secondary text
text-white    // Primary text

// Off-White Theme
bg-orange-50  // Screen/card background
bg-orange-100 // Input background
bg-orange-200 // Borders
text-orange-600 // Muted text
text-orange-700 // Secondary text
text-gray-900   // Primary text
```

#### Function Colors
```tsx
// Used for business function tagging
Marketing:   #f59e0b (amber)
Sales:       #ec4899 (pink)
Engineering: #3b82f6 (blue)
Finance:     #10b981 (emerald)
Ops:         #8b5cf6 (purple)
Admin:       #6b7280 (gray)
```

---

## Icons & Imagery

### Icon Library
**Use:** `lucide-react-native` exclusively
```tsx
import { Icon, AnotherIcon } from 'lucide-react-native';

<Icon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
```

### Icon Sizes
```tsx
size={16}  // Small (inline with text, badges)
size={18}  // Default (buttons, navigation)
size={20}  // Medium (headers, cards)
size={24}  // Large (prominent actions)
size={32}  // Extra large (empty states)
size={48}  // Huge (large empty states)
size={64}  // Massive (full-screen empty states)
```

### Icon Colors
```tsx
// Default icon color (secondary text)
color={isDark ? '#94a3b8' : '#64748b'}

// White icons (on colored backgrounds)
color="#ffffff"

// Accent icons
color="#8b5cf6" // purple
color="#3b82f6" // blue
color="#10b981" // green
```

### Image Guidelines
- **Avatars:** Circular, 40x40px default, 64x64px large
- **Thumbnails:** 16:9 ratio, rounded corners (`rounded-lg`)
- **Illustrations:** Use for empty states, onboarding
- **Source:** Unsplash for placeholder images

---

## Animations & Interactions

### Animation Library
**Use:** `react-native-reanimated` v3 (NOT `Animated` from react-native)

### Standard Animations
```tsx
import { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { AnimatedListItem, AnimatedCard, FadeInContainer } from '@/components/AnimatedComponents';

// List items
<AnimatedListItem index={0}>
  <TaskCard />
</AnimatedListItem>

// Cards
<AnimatedCard index={1}>
  <FeatureCard />
</AnimatedCard>

// Containers
<FadeInContainer delay={200}>
  <Content />
</FadeInContainer>
```

### Timing
```tsx
delay: 50-100ms   // Per list item
delay: 200-300ms  // For containers
duration: 300ms   // Standard fade
duration: 400ms   // Slide animations
```

### Haptic Feedback
**Use:** `/src/lib/haptics.ts`
```tsx
import { lightImpact, mediumImpact, heavyImpact, successNotification } from '@/lib/haptics';

// Button press
onPress={() => {
  lightImpact();
  handleAction();
}}

// Task completion
onComplete={() => {
  successNotification();
  markComplete();
}}

// Error
onError={() => {
  errorNotification();
  showError();
}}
```

### Pressable States
```tsx
// Standard button
<Pressable className="... active:opacity-70">

// Scale effect (for cards)
<Pressable className="... active:scale-95">

// Combine with haptics
<Pressable
  onPress={() => {
    lightImpact();
    onPress();
  }}
  className="... active:opacity-70"
>
```

---

## Modal Standards

### Modal Structure
**CRITICAL:** Follow this exact pattern to avoid bugs
```tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <Pressable className="flex-1 bg-black/70" onPress={onClose}>
    <View className="flex-1" /> {/* Spacer pushes content down */}
    <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
      <View className="bg-white dark:bg-slate-950 rounded-t-3xl">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
          <Text className="text-lg font-bold">Modal Title</Text>
          <Pressable onPress={onClose} className="w-9 h-9 rounded-full items-center justify-center bg-gray-100 dark:bg-slate-800">
            <X size={20} color={isDark ? '#fff' : '#374151'} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="px-5 py-6" contentContainerStyle={{ flexGrow: 1 }}>
          {/* Content here */}
        </ScrollView>

        {/* Footer (optional) */}
        <View className="p-5 border-t border-gray-200 dark:border-slate-800">
          <Pressable className="bg-blue-600 rounded-xl py-4">
            <Text className="text-white font-bold text-center">Action</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  </Pressable>
</Modal>
```

### Modal Variants

#### Full-Screen Modal (slide from bottom)
```tsx
<View className="flex-1 bg-black/50">
  <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
```

#### Centered Modal (fade)
```tsx
animationType="fade"
<View className="flex-1 bg-black/50 items-center justify-center p-6">
  <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
```

#### Modal with LinearGradient Header
```tsx
<LinearGradient
  colors={['#8b5cf6', '#6366f1']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
>
  <View className="p-5">
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-white/70 text-xs font-medium">CATEGORY</Text>
        <Text className="text-white text-xl font-bold">Title</Text>
      </View>
      <Pressable onPress={onClose} className="w-9 h-9 bg-white/20 rounded-full items-center justify-center">
        <X size={20} color="#ffffff" />
      </Pressable>
    </View>
  </View>
</LinearGradient>
```

### Modal Standards
- **Close button size:** `w-9 h-9` (always)
- **Header padding:** `px-5 py-4`
- **Content padding:** `px-5 py-6`
- **Footer padding:** `p-5`
- **Border radius:** `rounded-t-3xl` (top) or `rounded-2xl` (centered)
- **Max height:** `maxHeight: '90%'` (slide-up) or auto (centered)
- **Always include:** `onRequestClose` for Android back button

---

## Form Standards

### Input Fields
```tsx
// Text input
<TextInput
  className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
  placeholder="Enter text..."
  placeholderTextColor="#9ca3af"
  value={value}
  onChangeText={setValue}
/>

// Multi-line input
<TextInput
  className="... min-h-[80px]"
  multiline
  textAlignVertical="top"
/>
```

### Form Labels
```tsx
<Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide uppercase">
  LABEL TEXT
</Text>
```

### Form Validation
```tsx
import { InlineError } from '@/components/ErrorComponents';

{errors.email && <InlineError message={errors.email} />}
```

### Selection Inputs

#### Radio/Checkbox Style
```tsx
<Pressable
  onPress={() => setSelected(value)}
  className={`px-4 py-3 rounded-xl border-2 ${
    selected === value
      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
      : 'border-gray-200 dark:border-slate-800'
  }`}
>
  <Text className={selected === value ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-600 dark:text-slate-400'}>
    {label}
  </Text>
</Pressable>
```

#### Chip Style (multi-select)
```tsx
import { FilterChip } from '@/components/SearchAndFilter';

<FilterChip
  label="Marketing"
  selected={selected.includes('Marketing')}
  onPress={() => toggleSelection('Marketing')}
/>
```

### Button States
```tsx
import { LoadingButton } from '@/components/LoadingState';

<LoadingButton
  isLoading={isSubmitting}
  disabled={!isValid}
  onPress={handleSubmit}
>
  Submit
</LoadingButton>
```

---

## Data Display

### Cards
```tsx
// Standard card
<View className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
  <Text className="font-bold mb-2">Title</Text>
  <Text className="text-gray-600 dark:text-slate-400 text-sm">Description</Text>
</View>

// Colored accent card
<View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
  <Text className="text-purple-900 dark:text-purple-100">Content</Text>
</View>
```

### Lists
```tsx
import { AnimatedListItem } from '@/components/AnimatedComponents';

<ScrollView className="px-5 py-6">
  {items.map((item, index) => (
    <AnimatedListItem key={item.id} index={index}>
      <View className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3">
        {/* Item content */}
      </View>
    </AnimatedListItem>
  ))}
</ScrollView>
```

### Empty States
```tsx
<View className="items-center py-16">
  <Icon size={64} color={isDark ? '#475569' : '#cbd5e1'} />
  <Text className="text-gray-900 dark:text-white font-bold text-lg mt-4">
    No Items Found
  </Text>
  <Text className="text-gray-600 dark:text-slate-400 text-center mt-2 px-8">
    Description of why empty and what to do
  </Text>
  <Pressable className="bg-blue-600 rounded-xl px-6 py-3 mt-6">
    <Text className="text-white font-semibold">Add Item</Text>
  </Pressable>
</View>
```

### Loading States
```tsx
import { LoadingState, SkeletonLoader } from '@/components/LoadingState';

// Full screen
{isLoading && <LoadingState message="Loading tasks..." />}

// List skeleton
{isLoading ? <SkeletonLoader count={5} /> : <List />}
```

### Badges & Tags
```tsx
// Status badge
<View className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
    Active
  </Text>
</View>

// Count badge
<View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
  <Text className="text-white text-xs font-bold">3</Text>
</View>
```

### Progress Indicators
```tsx
// Progress bar
<View className="h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
  <View className="h-full bg-purple-600" style={{ width: `${progress}%` }} />
</View>

// Circular progress (use existing patterns from app)
// See MiniGanttChart for reference
```

---

## Navigation

### Tab Bar
- **Minimum tabs:** 2 (never use tabs for single view)
- **Maximum tabs:** 7 (current implementation)
- **Icon size:** `size={24}`
- **Active color:** `text-purple-600`
- **Inactive color:** `text-gray-400 dark:text-slate-500`

### Stack Navigation
- **Header:** Use native Stack.Screen headers when possible
- **Custom headers:** Only when native doesn't fit design
- **Back button:** Always visible and functional
- **Title:** Centered, bold

### Deep Linking
- All screens should be accessible via URL pattern
- Format: `/(tabs)/screen-name` or `/modal-name`

---

## State Management

### Zustand Patterns
```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyStore {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: Item) => {
        set((state: MyStore) => ({
          items: [...state.items, item],
        }));
      },

      removeItem: (id: string) => {
        set((state: MyStore) => ({
          items: state.items.filter((item: Item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'my-store-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Selectors (CRITICAL)
**Always use selectors to prevent unnecessary re-renders:**
```tsx
// ✅ CORRECT - Returns primitive
const itemCount = useMyStore(s => s.items.length);
const getItem = useMyStore(s => s.getItemById);
const item = getItem(id);

// ❌ WRONG - Returns object, causes re-renders
const { items } = useMyStore();
```

### React Query for Server State
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', workspaceId],
  queryFn: () => fetchTasks(workspaceId),
});

// Mutations
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

---

## Error Handling

### Error Modal Pattern
```tsx
import { ErrorModal } from '@/components/ErrorComponents';
import { useState } from 'react';

const [error, setError] = useState<string | null>(null);

// In async function
try {
  await riskyOperation();
} catch (err) {
  setError(err.message || 'An error occurred');
}

// In render
<ErrorModal
  visible={!!error}
  message={error || ''}
  onClose={() => setError(null)}
  onRetry={() => {
    setError(null);
    retryOperation();
  }}
/>
```

### Form Validation
```tsx
import { InlineError } from '@/components/ErrorComponents';

const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!email) newErrors.email = 'Email is required';
  if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// In render
<TextInput ... />
{errors.email && <InlineError message={errors.email} />}
```

### Error States in Lists
```tsx
{error ? (
  <View className="items-center py-12">
    <AlertCircle size={48} color="#ef4444" />
    <Text className="text-red-600 dark:text-red-400 font-bold mt-4">
      Failed to Load
    </Text>
    <Text className="text-gray-600 dark:text-slate-400 text-center mt-2 px-8">
      {error.message}
    </Text>
    <Pressable onPress={retry} className="bg-blue-600 rounded-xl px-6 py-3 mt-6">
      <Text className="text-white font-semibold">Try Again</Text>
    </Pressable>
  </View>
) : isLoading ? (
  <SkeletonLoader count={5} />
) : (
  <List items={items} />
)}
```

---

## Accessibility

### Basic Requirements
```tsx
// Button
<Pressable
  accessibilityLabel="Add new task"
  accessibilityRole="button"
  accessibilityHint="Creates a new task in your current workspace"
>

// Image
<Image
  source={...}
  accessibilityLabel="User profile picture"
  alt="User profile picture"
/>

// Text input
<TextInput
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email address to sign in"
/>
```

### Semantic Roles
```tsx
accessibilityRole="button"
accessibilityRole="header"
accessibilityRole="link"
accessibilityRole="image"
accessibilityRole="text"
accessibilityRole="search"
```

### State Indicators
```tsx
// Toggles
accessibilityState={{ checked: isChecked }}
accessibilityState={{ selected: isSelected }}
accessibilityState={{ disabled: isDisabled }}
accessibilityState={{ busy: isLoading }}
```

### Dynamic Font Sizing
- Use relative sizing (text-base, text-sm) not fixed pixel values
- Test with iOS "Larger Text" accessibility settings
- Ensure layout doesn't break with larger fonts

---

## Code Standards

### TypeScript
```tsx
// ✅ ALWAYS use explicit types
const [items, setItems] = useState<Item[]>([]);
const [count, setCount] = useState<number>(0);

// ✅ Use optional chaining
const name = user?.profile?.name ?? 'Unknown';

// ✅ Include all required properties
const newItem: Item = {
  id: generateId(),
  title: title,
  description: description,
  createdAt: new Date().toISOString(),
  status: 'active',
};

// ❌ Don't leave properties undefined
const newItem = {
  id: generateId(),
  // Missing required properties!
};
```

### Imports Organization
```tsx
// 1. React imports
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// 3. Icons
import { Check, X, AlertCircle } from 'lucide-react-native';

// 4. Local imports (absolute paths)
import { useTheme } from '@/lib/ThemeContext';
import { useMyStore } from '@/lib/state/my-store';
import type { MyType } from '@/types';

// 5. Relative imports (if needed)
import { helper } from './utils';
```

### File Organization
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Component
// 5. Styles (if any inline)
// 6. Exports

// Example:
import { ... };

interface MyComponentProps {
  ...
}

const CONSTANTS = {
  ...
};

export function MyComponent({ ... }: MyComponentProps) {
  // Hooks
  const { theme } = useTheme();
  const [state, setState] = useState(...);

  // Derived state
  const isDark = theme === 'dark';

  // Handlers
  const handlePress = () => {
    ...
  };

  // Effects
  useEffect(() => {
    ...
  }, []);

  // Render
  return (
    ...
  );
}
```

### Comments
```tsx
// ✅ Use comments for complex logic
// Calculate available capacity considering overtime
const availableCapacity = baseCapacity + (allowOvertime ? overtimeCapacity : 0);

// ✅ TODO comments with context
// TODO: Replace with API call once backend is ready
const data = MOCK_DATA;

// ❌ Don't comment obvious code
// Set the name
setName(name);
```

---

## Testing Guidelines

### Component Testing
```tsx
import { render, fireEvent } from '@testing-library/react-native';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent title="Test" onPress={onPress} />);
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Store Testing
```tsx
describe('useMyStore', () => {
  beforeEach(() => {
    useMyStore.setState({ items: [] });
  });

  it('adds items', () => {
    const { addItem } = useMyStore.getState();
    addItem({ id: '1', name: 'Test' });
    expect(useMyStore.getState().items).toHaveLength(1);
  });
});
```

---

## Performance Optimization

### Use FlashList for Long Lists
```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
export const ExpensiveCard = memo(({ item }: Props) => {
  ...
});

// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.priority - b.priority);
}, [items]);

// Memoize callbacks
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Image Optimization
```tsx
// Use appropriate sizes
<Image
  source={{ uri: imageUrl }}
  style={{ width: 64, height: 64 }}
  resizeMode="cover"
/>

// Use FastImage for remote images (if installed)
import FastImage from 'react-native-fast-image';
```

---

## Common Patterns

### Search Implementation
```tsx
import { SearchBar } from '@/components/SearchAndFilter';

const [searchQuery, setSearchQuery] = useState('');
const filteredItems = items.filter(item =>
  item.title.toLowerCase().includes(searchQuery.toLowerCase())
);

<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search tasks..."
  showFilter
  onFilterPress={() => setShowFilters(true)}
/>
```

### Bulk Selection
```tsx
import { useBulkSelection, BulkSelectionBar } from '@/components/BulkSelection';

const { selectedIds, selectionMode, toggleSelection, selectAll, deselectAll, getSelectedItems } =
  useBulkSelection(tasks);

// In list item
<Pressable
  onPress={() => selectionMode ? toggleSelection(task.id) : navigate(task)}
  onLongPress={() => enterSelectionMode(task.id)}
>

// Show selection bar
{selectionMode && (
  <BulkSelectionBar
    selectedCount={selectedIds.size}
    totalCount={tasks.length}
    onSelectAll={selectAll}
    onDeselectAll={deselectAll}
    onCancel={() => deselectAll()}
    actions={[
      { label: 'Delete', icon: <Trash />, onPress: handleBulkDelete, variant: 'destructive' }
    ]}
  />
)}
```

### Pull to Refresh
```tsx
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetchData();
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
```

---

## Dos and Don'ts

### ✅ DO
- Use NativeWind (Tailwind) for styling
- Support all three themes (light, dark, off-white)
- Add haptic feedback to interactions
- Show loading states during async operations
- Handle errors gracefully with retry options
- Use FlashList for lists with 50+ items
- Memoize expensive components and calculations
- Add accessibility labels to all interactive elements
- Use Zustand selectors that return primitives
- Follow modal standards exactly to avoid bugs
- Add animations to make the app feel polished
- Test on both iOS and Android

### ❌ DON'T
- Use inline styles unless required (LinearGradient, CameraView)
- Use Alert.alert() (use custom modals instead)
- Use `import from 'zustand'` (use `import { create } from 'zustand'`)
- Use `<SafeAreaView>` from react-native (use react-native-safe-area-context)
- Use Node.js `buffer` in React Native
- Create new packages unless pure JS utilities
- Use generic purple gradient on white designs
- Copy web patterns to mobile (design for touch!)
- Forget to handle empty states
- Leave debug markers in production code
- Skip loading states (users need feedback!)

---

## Quick Reference

### Common Class Combinations
```tsx
// Button (Primary)
className="bg-blue-600 rounded-xl py-4 px-6 active:opacity-70"

// Button (Secondary)
className="bg-gray-100 dark:bg-slate-800 rounded-xl py-4 px-6 active:opacity-70"

// Card
className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800"

// Input
className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"

// Section Header
className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide uppercase mb-2"

// Screen Container
className="flex-1 px-5 py-6"
```

---

## Updates & Maintenance

**When to update this guide:**
- New design patterns emerge
- Breaking changes to libraries
- Team consensus on new standards
- User feedback reveals issues

**Review schedule:** Quarterly or after major feature releases

**Maintained by:** Development team leads

**Version control:** Track changes in git, update version number at top

---

*Last Updated: 2026-01-16 | Version 1.0*
