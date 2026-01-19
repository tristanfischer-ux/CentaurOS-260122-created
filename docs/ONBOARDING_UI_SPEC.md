# Founder Onboarding UI Specification

## Screen Layout

The onboarding UI is a single-page experience in the WHY tab with **no modals**.

```
┌────────────────────────────────────────────────────────────────────┐
│ Header: "Founder Onboarding" + Progress Badge (e.g., "3/21 done") │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│  Progress    │  Main Content Panel                                 │
│  Rail        │                                                     │
│  (Left)      │  ┌─────────────────────────────────────────────┐   │
│              │  │ Current Step                                 │   │
│  ┌────────┐  │  │ - Title + Description                        │   │
│  │Module A│  │  │ - Input Area (text/transcript)              │   │
│  │ ✓ A1   │  │  │ - "Generate Drafts" button                   │   │
│  │ ● A2   │  │  └─────────────────────────────────────────────┘   │
│  │ 🔒 A3   │  │                                                     │
│  ├────────┤  │  ┌─────────────────────────────────────────────┐   │
│  │Module B│  │  │ Outputs Panel                                │   │
│  │ 🔒 B1   │  │  │ - Generated Objectives (editable)           │   │
│  │ 🔒 B2   │  │  │ - Task Drafts (editable, inline)            │   │
│  │ 🔒 B3   │  │  │ - "Send to WHAT" button                     │   │
│  └────────┘  │  └─────────────────────────────────────────────┘   │
│              │                                                     │
│  ...         │  ┌─────────────────────────────────────────────┐   │
│              │  │ Evidence Panel                               │   │
│              │  │ - Required evidence checklist                │   │
│              │  │ - "Attach Evidence" (text/link/file)        │   │
│              │  │ - "Mark Complete" / "Skip with Reason"       │   │
│              │  └─────────────────────────────────────────────┘   │
│              │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

## Components

### 1. Progress Rail (Left Column)

```
Width: 80px (mobile) / 200px (tablet+)
Position: Fixed left
```

**Module Item**
- Collapsed by default, expand on tap
- Shows: Module letter + title + completion count
- States: `locked` (gray), `active` (blue), `completed` (green)

**Step Item**
- Shows: Step number + title (truncated)
- Icons:
  - 🔒 Locked (gray lock)
  - ○ Unlocked (empty circle)
  - ● In Progress (filled blue)
  - ✓ Completed (green check)
  - ⊘ Skipped (gray slash)

### 2. Current Step Panel

**Header**
- Step title (large, bold)
- Module breadcrumb (e.g., "Foundation > Step 2 of 3")
- Short description (2-3 lines)

**Input Section**
```tsx
<View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
  <Text className="font-medium mb-2">Your Input</Text>
  <TextInput
    multiline
    placeholder="Type or paste transcript here..."
    className="min-h-[120px] bg-white dark:bg-slate-900 p-3 rounded-lg"
  />
  <View className="flex-row justify-between mt-3">
    <Pressable className="flex-row items-center gap-2">
      <Mic size={18} />
      <Text>Voice Input</Text>
    </Pressable>
    <Pressable className="bg-blue-600 px-4 py-2 rounded-lg">
      <Text className="text-white font-medium">Generate Drafts</Text>
    </Pressable>
  </View>
</View>
```

### 3. Outputs Panel

**Objectives Section**
- Inline editable cards
- Each objective shows: title, category badge, edit icon
- No modal—edit inline on tap

**Task Drafts Section**
- List of draft tasks
- Each shows: title, TU units, assignee hint
- Inline edit on tap (title + units)
- Remove button (X icon)

**Actions**
```tsx
<View className="flex-row gap-3">
  <Pressable className="flex-1 bg-slate-200 py-3 rounded-lg">
    <Text>Save for Later</Text>
  </Pressable>
  <Pressable className="flex-1 bg-green-600 py-3 rounded-lg">
    <Text className="text-white">Send to WHAT</Text>
  </Pressable>
</View>
```

### 4. Evidence Panel

**Evidence Checklist**
```tsx
{step.evidenceRequirements.map(req => (
  <View className="flex-row items-center gap-3 py-2">
    <View className={`w-5 h-5 rounded-full border-2 ${req.satisfied ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
      {req.satisfied && <Check size={12} color="white" />}
    </View>
    <Text>{req.label}</Text>
  </View>
))}
```

**Evidence Input**
- Text input for evidence notes
- Link input (URL validation)
- File picker (optional, future)

**Completion Actions**
```tsx
<View className="gap-3">
  <Pressable
    disabled={!allEvidenceSatisfied}
    className={`py-4 rounded-xl ${allEvidenceSatisfied ? 'bg-green-600' : 'bg-gray-300'}`}
  >
    <Text className="text-white text-center font-bold">Mark Step Complete</Text>
  </Pressable>
  <Pressable className="py-3" onPress={() => setShowSkipInput(true)}>
    <Text className="text-center text-slate-500">Skip this step...</Text>
  </Pressable>
</View>
```

**Skip Input (Inline, not modal)**
```tsx
{showSkipInput && (
  <View className="bg-yellow-50 p-4 rounded-xl mt-3">
    <Text className="font-medium mb-2">Why are you skipping?</Text>
    <TextInput
      placeholder="Explain briefly (min 20 chars)..."
      value={skipReason}
      onChangeText={setSkipReason}
      className="bg-white p-3 rounded-lg"
    />
    <Pressable
      disabled={skipReason.length < 20}
      className="bg-yellow-500 py-3 rounded-lg mt-3"
      onPress={handleSkip}
    >
      <Text className="text-white text-center font-medium">Confirm Skip</Text>
    </Pressable>
  </View>
)}
```

## User Flow

### 1. Entry Point (WHY Tab)
- New CTA card: "Start Founder Onboarding"
- Shows if `company_onboarding_state` is null or `status='active'`
- Hidden if onboarding completed

### 2. Starting Onboarding
1. User taps "Start Founder Onboarding"
2. System creates `company_onboarding_state` with `status='active'`
3. Navigates to onboarding screen
4. First unlocked step is automatically selected

### 3. Working Through a Step
1. User reads step description
2. User enters input (text or pasted transcript)
3. User taps "Generate Drafts"
4. System generates objectives + task drafts (LLM or templates)
5. User reviews/edits outputs inline
6. User taps "Send to WHAT" → drafts appear in WHAT pending confirmation
7. User attaches evidence
8. User taps "Mark Complete" → step marked complete, next step unlocks

### 4. Skipping a Step
1. User taps "Skip this step..."
2. Inline skip input appears
3. User enters reason (min 20 chars)
4. User taps "Confirm Skip"
5. Step marked as `skipped`, next step unlocks

### 5. Completing Onboarding
1. All required steps completed/skipped
2. Summary card appears
3. User can review all created objectives/tasks
4. "Finish Onboarding" button
5. Onboarding card hidden from WHY tab

## Animations

- **Step transition**: FadeInDown for new step panel
- **Output generation**: Typing indicator while generating
- **Evidence check**: Scale animation on checkbox
- **Progress update**: Spring animation on rail percentage

## Accessibility

- All interactive elements have proper labels
- Progress rail has ARIA landmarks
- Color-blind friendly icons (not just colors)
- Min tap target: 44x44pt

## Responsive Behavior

**Mobile (<768px)**
- Progress rail collapses to icon-only
- Step panel is full width
- Evidence panel stacks below outputs

**Tablet+ (>=768px)**
- Progress rail shows full labels
- Side-by-side layout
- Outputs and evidence panels can be parallel columns
