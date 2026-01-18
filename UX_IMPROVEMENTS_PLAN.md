# Voice Input UX Improvements - Implementation Plan

**Date:** 2026-01-18
**Status:** Ready for Review

## Overview

This plan addresses critical UX issues with the collapsible drawer system on the WHAT and WHY tabs, specifically around:
1. Drawer interference with the weekly resource pool
2. Missing prompts and guidance during voice/text input
3. Non-functional voice transcription
4. Unclear user flows and expectations

---

## Phase I: Drawer Collision Resolution (WHAT Tab)

### Problem
The CollapsibleResourcePool and CollapsibleTaskCreator both occupy the bottom of the screen, causing z-index conflicts and overlap.

### Solution: Smart Drawer Coordination

#### Option A: Single Drawer System (Recommended)
**Merge the Resource Pool and Task Creator into a single unified drawer with tabs:**

```
Collapsed State:
┌─────────────────────────────────────┐
│ 👥 Resources | ➕ New Task          │  ← Shows both options
│ 3 team • 12 TU | Tap to create      │
└─────────────────────────────────────┘

Expanded State (Resource Pool):
┌─────────────────────────────────────┐
│ [Resources] | New Task              │  ← Tabs to switch
│ ─────────────────────────────────── │
│ Sarah Johnson    ■■■■■□□□□□ 5/10    │
│ Mike Chen        ■■■■□□□□□□ 4/10    │
│ ...                                  │
└─────────────────────────────────────┘

Expanded State (Task Creator):
┌─────────────────────────────────────┐
│ Resources | [New Task]              │  ← Tabs to switch
│ ─────────────────────────────────── │
│ Choose input method:                 │
│ 🎤 Voice   |   ⌨️ Type              │
│ ...                                  │
└─────────────────────────────────────┘
```

**Advantages:**
- No z-index conflicts
- Clear context switching
- Maintains all functionality
- Single consistent interaction pattern

**Implementation:**
1. Create `UnifiedBottomDrawer.tsx` component
2. Add tab navigation between "Resources" and "New Task"
3. Migrate logic from both existing components
4. Update WHAT tab to use unified drawer

#### Option B: Resource Pool in Header (Alternative)
Move resource pool to header section when drawer is expanded:
- Collapsed: Resource pool at bottom
- Task creator drawer opens: Resource pool relocates to sticky header
- Avoids collision, maintains visibility

---

## Phase II: Voice Input Flow Improvements (WHAT Tab)

### Problem
Users don't understand what they should say during voice recording. Missing prompts, unclear expectations.

### Solution: Contextual Prompts & Examples

#### A. Pre-Recording Screen
When user selects "Voice" mode, show clear instructions:

```
┌─────────────────────────────────────┐
│ 🎤 Record Your Tasks                │
│                                      │
│ ℹ️ What to say:                     │
│ • Who should do the task?            │
│ • When does it need to be done?     │
│ • How long will it take? (TUs)      │
│ • What's the task about?            │
│                                      │
│ 💡 Example:                         │
│ "Create a task for Sarah to fix     │
│ the login bug by Friday. It should  │
│ take about 2 time units."           │
│                                      │
│        [🎤 Tap to Record]           │
│             [Back]                   │
└─────────────────────────────────────┘
```

#### B. During Recording
Show live feedback with prompts:

```
┌─────────────────────────────────────┐
│ 🔴 Recording... (0:15)              │
│                                      │
│ [~~~~~~~Animated waveform~~~~~~~~]  │
│                                      │
│ 💡 Remember to mention:             │
│ ✓ Who? (Sarah, Mike, etc.)          │
│ ✓ When? (Friday, next week, etc.)   │
│ ✓ How long? (2 TUs, 10 hours, etc.) │
│                                      │
│        [⏹️ Stop Recording]          │
└─────────────────────────────────────┘
```

#### C. After Recording - Review & Edit
Show transcript with AI extraction preview:

```
┌─────────────────────────────────────┐
│ 📝 Review Transcript                │
│ ─────────────────────────────────── │
│ [Editable transcript text area]     │
│ "Create a task for Sarah to fix..." │
│                                      │
│ ✨ AI Will Extract:                 │
│ • Title: Fix login bug               │
│ • Assignee: Sarah (80% confident)   │
│ • Due: Friday (75% confident)       │
│ • Estimate: 2 TUs (90% confident)   │
│                                      │
│    [Cancel]  [Extract Tasks →]      │
└─────────────────────────────────────┘
```

### Implementation Files:
- Update `CollapsibleTaskCreator.tsx` (or unified drawer)
- Create `VoiceRecordingPrompts.tsx` component
- Update `VoiceInputButton.tsx` to show live prompts

---

## Phase III: Voice Transcription Fix (WHAT & WHY Tabs)

### Problem
Voice recording doesn't transcribe. The transcript is empty or shows "[Recording]" placeholder.

### Root Cause Investigation Required:
1. Check if `VoiceInputButton.tsx` is properly calling speech-to-text API
2. Verify microphone permissions
3. Check if transcription service is configured (Expo Speech, Web Speech API, or external service)

### Solution: Implement Proper Transcription

#### File to Review: `src/components/VoiceInputButton.tsx`

**Current State Check:**
```typescript
// Does it have proper transcription logic?
// Is it calling expo-speech-recognition or similar?
// Is there error handling for transcription failures?
```

#### Required Implementation:
```typescript
import * as Speech from 'expo-speech-recognition'; // or appropriate lib

export function VoiceInputButton({ onTranscriptComplete, onError, color, size }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    try {
      // 1. Request permissions
      const { granted } = await Speech.requestPermissionsAsync();
      if (!granted) throw new Error('Microphone permission denied');

      // 2. Start recognition
      await Speech.start({
        lang: 'en-US',
        onResult: (event) => {
          setTranscript(event.results[0].transcript);
        },
        onError: (error) => {
          onError?.(error);
        }
      });

      setIsRecording(true);
    } catch (error) {
      onError?.(error);
    }
  };

  const stopRecording = async () => {
    await Speech.stop();
    setIsRecording(false);

    if (transcript.trim()) {
      onTranscriptComplete(transcript);
    } else {
      onError?.('No speech detected');
    }
  };

  // ... rest of component
}
```

**Alternative: Use Web Speech API (for Expo Web):**
```typescript
// For web compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
```

### Action Items:
1. Review current `VoiceInputButton.tsx` implementation
2. Add proper speech recognition library (if missing)
3. Implement error handling for:
   - Permission denied
   - No speech detected
   - Transcription service unavailable
4. Add visual feedback during transcription
5. Test on iOS device (simulator may not support mic)

---

## Phase IV: WHY Tab Brainstorm Flow Improvements

### Problem
Similar issues to WHAT tab:
1. No clear prompts about what to brainstorm
2. Voice recording doesn't work
3. Drawer may collide with resource pool (if present)

### Solution: Enhanced Brainstorming Prompts

#### A. Pre-Recording Screen
```
┌─────────────────────────────────────┐
│ 💡 Start Brainstorming              │
│                                      │
│ ℹ️ What to share:                   │
│ • What do you want to achieve?      │
│ • Why does it matter?               │
│ • What constraints exist?           │
│ • Any initial ideas?                │
│                                      │
│ 💭 Example:                         │
│ "I want to build a feature that     │
│ helps users track their fitness     │
│ goals. We need to integrate with    │
│ health apps. Budget is tight."      │
│                                      │
│        [🎤 Tap to Record]           │
│             [Back]                   │
└─────────────────────────────────────┘
```

#### B. During Recording
```
┌─────────────────────────────────────┐
│ 🔴 Recording... (0:23)              │
│                                      │
│ [~~~~~~~Animated waveform~~~~~~~~]  │
│                                      │
│ 💡 The AI will ask you about:       │
│ • Goals & outcomes                   │
│ • Success metrics                    │
│ • Resources needed                   │
│ • Potential roadblocks              │
│                                      │
│        [⏹️ Stop Recording]          │
└─────────────────────────────────────┘
```

#### C. After Recording - Start Session
```
┌─────────────────────────────────────┐
│ 📝 Review Your Idea                 │
│ ─────────────────────────────────── │
│ [Editable text area]                 │
│ "I want to build a feature..."      │
│                                      │
│ ✨ Next Steps:                      │
│ The AI will start a conversation     │
│ to help you:                         │
│ • Define clear objectives            │
│ • Identify key results               │
│ • Create actionable tasks            │
│ • Assign owners & timelines         │
│                                      │
│ Estimated time: 4-5 messages         │
│                                      │
│    [Cancel]  [Start Session →]      │
└─────────────────────────────────────┘
```

### Implementation:
- Update `CollapsibleBrainstormStarter.tsx` with prompt system
- Mirror WHAT tab prompt improvements
- Ensure voice transcription works (same fix as Phase III)

---

## Phase V: Text Input Improvements (Both Tabs)

### Problem
Text input mode also lacks clear guidance about what to type.

### Solution: Placeholder Examples & Inline Hints

#### Updated Text Input (WHAT Tab):
```
┌─────────────────────────────────────┐
│ ⌨️ Describe Your Tasks              │
│                                      │
│ [Large text area with placeholder:] │
│ "Example:                            │
│ - Fix login bug for Sarah by Friday │
│   (2 TUs)                            │
│ - Create dashboard for Mike next    │
│   week (5 TUs)                       │
│ - Review designs due Thursday       │
│   (1 TU)"                            │
│                                      │
│ 💡 Tip: Mention WHO, WHEN, and      │
│ HOW LONG for each task               │
│                                      │
│    [Back]  [Extract Tasks →]        │
└─────────────────────────────────────┘
```

#### Updated Text Input (WHY Tab):
```
┌─────────────────────────────────────┐
│ ⌨️ Share Your Ideas                 │
│                                      │
│ [Large text area with placeholder:] │
│ "Example:                            │
│ I want to build a fitness tracking  │
│ feature. Users need to log workouts │
│ and see progress over time. We      │
│ should integrate with Apple Health  │
│ and Google Fit. Budget is $50k and  │
│ we need it in 3 months."            │
│                                      │
│ 💡 Tip: Describe WHAT, WHY, and     │
│ any CONSTRAINTS                      │
│                                      │
│    [Back]  [Start Session →]        │
└─────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase I: Drawer Collision (2-3 hours)
**Priority: CRITICAL**
1. Create `UnifiedBottomDrawer.tsx` component
2. Implement tab navigation (Resources / New Task)
3. Migrate CollapsibleResourcePool content
4. Migrate CollapsibleTaskCreator content
5. Update `what.tsx` to use unified drawer
6. Test expansion/collapse behavior

### Phase II: Voice Prompts - WHAT Tab (1-2 hours)
**Priority: HIGH**
1. Create `VoiceRecordingPrompts.tsx` component
2. Update CollapsibleTaskCreator with pre-recording screen
3. Add during-recording prompts
4. Add post-recording review with AI preview
5. Test user flow

### Phase III: Fix Voice Transcription (3-4 hours)
**Priority: CRITICAL**
1. Review `VoiceInputButton.tsx` current implementation
2. Add speech recognition library if missing
3. Implement proper transcription logic
4. Add error handling (permissions, no speech, etc.)
5. Test on physical device (iOS required for accurate testing)
6. Add fallback for web/unsupported devices

### Phase IV: WHY Tab Improvements (1-2 hours)
**Priority: HIGH**
1. Apply same prompt system to CollapsibleBrainstormStarter
2. Update pre-recording, during, and post-recording screens
3. Ensure consistency with WHAT tab patterns
4. Test brainstorming flow

### Phase V: Text Input Polish (1 hour)
**Priority: MEDIUM**
1. Update text input placeholders on both tabs
2. Add inline hints and tips
3. Test keyboard behavior (dismissal, scroll)

---

## Files to Create/Modify

### New Files:
- `src/components/UnifiedBottomDrawer.tsx` (if Option A)
- `src/components/VoiceRecordingPrompts.tsx`

### Modified Files:
- `src/components/CollapsibleTaskCreator.tsx` (or deleted if unified)
- `src/components/CollapsibleBrainstormStarter.tsx`
- `src/components/CollapsibleResourcePool.tsx` (or migrated)
- `src/components/VoiceInputButton.tsx` (FIX TRANSCRIPTION)
- `src/app/(tabs)/what.tsx`
- `src/app/(tabs)/why.tsx`

### Review Required:
- `src/components/VoiceInputButton.tsx` - Current implementation status
- Package.json - Check if speech recognition library exists
- ENV variables - Check if external transcription service is configured

---

## Testing Checklist

### Drawer Behavior:
- [ ] Resource pool and task creator don't overlap
- [ ] Smooth expand/collapse animations
- [ ] Tab switching works correctly (if unified)
- [ ] Can access both features without collision

### Voice Input - WHAT Tab:
- [ ] Pre-recording prompts are clear
- [ ] Recording shows live feedback
- [ ] Transcript appears after recording
- [ ] Can edit transcript before extraction
- [ ] AI extraction preview shows expected data
- [ ] Extracted tasks appear in task list

### Voice Input - WHY Tab:
- [ ] Pre-recording prompts are clear
- [ ] Recording shows live feedback
- [ ] Transcript appears after recording
- [ ] Can edit transcript before session start
- [ ] Session starts with AI response
- [ ] Conversation flow works smoothly

### Text Input - Both Tabs:
- [ ] Placeholder examples are helpful
- [ ] Inline hints guide user
- [ ] Keyboard doesn't obscure input
- [ ] Can dismiss keyboard easily
- [ ] Extraction/session start works correctly

### Error Handling:
- [ ] Microphone permission denied → clear error message
- [ ] No speech detected → retry option
- [ ] Transcription fails → fallback to text input
- [ ] API errors → user-friendly messages

---

## Open Questions for User

1. **Drawer Design Decision:**
   - Option A: Unified drawer with tabs (Resources | New Task)?
   - Option B: Relocate resource pool to header when drawer opens?
   - Your preference?

2. **Voice Transcription Library:**
   - Do you want to use Expo's built-in speech recognition?
   - Or integrate external service (e.g., OpenAI Whisper, Google Cloud)?
   - Budget/latency considerations?

3. **Prompt Style:**
   - Detailed prompts (as shown) or more minimal?
   - Show examples always or toggle visibility?

4. **WHY Tab - Resource Pool:**
   - Does WHY tab also have the resource pool drawer?
   - Or only WHAT tab has this issue?

---

## Success Criteria

✅ Users clearly understand what to say/type during voice/text input
✅ Voice transcription works reliably with proper error handling
✅ No drawer collisions or z-index issues
✅ Smooth, intuitive UX flow from input → extraction → review → creation
✅ Consistent patterns across WHAT and WHY tabs
✅ All feedback/prompts are contextual and helpful

---

**Next Steps:** Review this plan, answer open questions, and I'll implement Phase I through Phase IV systematically.
