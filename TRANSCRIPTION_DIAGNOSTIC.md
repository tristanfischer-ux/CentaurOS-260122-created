# Voice Transcription Diagnostic Plan

## Current Status: NOT WORKING

**Date:** January 18, 2026
**Priority:** CRITICAL P0

---

## Problem Discovery

### Issue 1: API Routes Not Working in Expo
**Test Result:**
```bash
curl http://localhost:8081/api/transcribe
# Returns: HTML page instead of API response
```

**Root Cause:** Expo Router API routes (files ending in `+api.ts`) only work on the **server-side** (Node.js backend), NOT in the Expo development environment.

**Impact:**
- `/api/transcribe` doesn't exist at runtime
- `/api/what/extract-drafts` doesn't work either
- All voice transcription fails silently

---

## Current Flow (BROKEN)

```
1. User records voice
   ✅ VoiceInputButton.tsx (line 158-208)
   ✅ Converts audio to base64

2. Send to transcription API
   ❌ fetch('/api/transcribe')
   ❌ Returns HTML (404 disguised as HTML)
   ❌ No transcription happens

3. Send transcript to task extraction
   ❌ fetch('/api/what/extract-drafts')
   ❌ Also returns HTML
   ❌ No tasks extracted

4. Show review modal
   ❌ Never reached
```

---

## Why API Routes Don't Work

**Expo Router API Routes Requirement:**
- Need a separate Node.js server running
- Or need Expo's "API routes" feature enabled (SDK 50+)
- Currently running in **development mode** without backend

**Files affected:**
1. `/src/app/api/transcribe+api.ts` - CAN'T RUN in current setup
2. `/src/app/api/what/extract-drafts+api.ts` - CAN'T RUN
3. `/src/app/api/what/confirm+api.ts` - CAN'T RUN
4. `/src/app/api/why/*` - CAN'T RUN

---

## Solution Options

### Option 1: Use Client-Side Transcription (RECOMMENDED)
**Pros:**
- Works immediately in Expo
- No backend needed
- Simpler architecture

**Implementation:**
```typescript
// In VoiceInputButton.tsx
// Call Google Speech-to-Text API directly from client
const response = await fetch(
  `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
  {
    method: 'POST',
    body: JSON.stringify({ audio: { content: base64Audio }, config: {...} })
  }
);
```

**Changes needed:**
1. Move transcription logic to client-side
2. Move task extraction logic to client-side
3. Call Google APIs directly with API keys from environment

---

### Option 2: Set Up Expo API Routes Server
**Pros:**
- Clean separation of concerns
- API keys hidden on server

**Cons:**
- Requires separate backend deployment
- More complex setup
- Not suitable for Vibecode sandbox

**Not recommended for current environment**

---

### Option 3: Use Mock Transcription + Direct Task Extraction
**Pros:**
- Quick fix for testing
- Can validate rest of flow

**Cons:**
- Not production-ready
- User experience not real

**Good for debugging only**

---

## Recommended Implementation Plan

### Phase 1: Client-Side Transcription (IMMEDIATE)

**Step 1:** Create client-side Google Speech-to-Text helper
```typescript
// src/lib/transcription/google-speech.ts
export async function transcribeAudio(base64Audio: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'MP3',
          sampleRateHertz: 44100,
          languageCode: 'en-GB',
          enableAutomaticPunctuation: true,
        },
        audio: { content: base64Audio },
      }),
    }
  );

  const data = await response.json();
  return data.results[0]?.alternatives[0]?.transcript || '';
}
```

**Step 2:** Create client-side task extraction helper
```typescript
// src/lib/ai/task-extraction.ts
export async function extractTasksFromText(text: string): Promise<TaskDraft[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: buildTaskExtractionPrompt(text)
          }]
        }]
      }),
    }
  );

  const data = await response.json();
  // Parse and return tasks
}
```

**Step 3:** Update VoiceInputButton to use client-side transcription
```typescript
// src/components/VoiceInputButton.tsx (line 176-208)
// Replace fetch('/api/transcribe') with:
import { transcribeAudio } from '@/lib/transcription/google-speech';

const transcript = await transcribeAudio(base64Audio);
onTranscriptComplete(transcript);
```

**Step 4:** Update what.tsx to use client-side extraction
```typescript
// src/app/(tabs)/what.tsx (line 272)
// Replace fetch('/api/what/extract-drafts') with:
import { extractTasksFromText } from '@/lib/ai/task-extraction';

const drafts = await extractTasksFromText(voiceTranscript);
setTaskDrafts(drafts);
```

---

### Phase 2: Save to Supabase (AFTER transcription works)

**Step 5:** Save drafts directly to Supabase
```typescript
// After extraction
const { data: savedDrafts } = await supabase
  .from('task_drafts')
  .insert(drafts.map(d => ({
    workspace_id: currentWorkspace.id,
    created_by_user_id: currentMembership.id,
    title: d.title,
    // ... other fields
  })))
  .select();
```

---

## Testing Plan

### Test 1: Verify Google API Key
```bash
# Check if API key exists
echo $EXPO_PUBLIC_GOOGLE_AI_API_KEY
```

### Test 2: Test Speech-to-Text Directly
```bash
# Create test script to call Google Speech API
curl "https://speech.googleapis.com/v1/speech:recognize?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @test-audio-request.json
```

### Test 3: Test Gemini Task Extraction
```bash
# Test Gemini API directly
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Extract tasks from: Create website"}]}]}'
```

### Test 4: End-to-End Voice Flow
1. Record voice
2. Check console logs for transcription
3. Verify task extraction
4. Confirm tasks show in review modal

---

## Files to Modify

### New Files to Create:
1. ✅ `src/lib/transcription/google-speech.ts` - Client-side transcription
2. ✅ `src/lib/ai/task-extraction.ts` - Client-side task extraction
3. ✅ `src/lib/prompts/task-extraction-prompt.ts` - Prompt builder

### Files to Modify:
1. ✅ `src/components/VoiceInputButton.tsx` - Use client-side transcription
2. ✅ `src/app/(tabs)/what.tsx` - Use client-side task extraction
3. ✅ `src/app/(tabs)/why.tsx` - Similar changes for brainstorming

### Files to Remove/Archive:
1. ❌ `src/app/api/transcribe+api.ts` - Not usable in current setup
2. ❌ `src/app/api/what/extract-drafts+api.ts` - Not usable
3. ❌ `src/app/api/what/confirm+api.ts` - Not usable

---

## Implementation Priority

### P0 - DO FIRST (1-2 hours)
1. Create `google-speech.ts` helper
2. Create `task-extraction.ts` helper
3. Update `VoiceInputButton.tsx`
4. Update `what.tsx` handleProcessVoiceTranscript
5. Test end-to-end

### P1 - DO NEXT (30 mins)
1. Add proper error handling
2. Add loading states
3. Test with various voice inputs

### P2 - POLISH (30 mins)
1. Update why.tsx for brainstorming
2. Add confidence scores display
3. Improve UX feedback

---

## Expected Outcome

After implementation:
```
✅ User records voice
✅ Audio converted to base64
✅ Google Speech-to-Text called directly (client-side)
✅ Transcript returned
✅ Google Gemini called directly (client-side)
✅ Tasks extracted with AI
✅ User reviews tasks in modal
✅ Tasks saved to Supabase
✅ Tasks appear in workspace
```

---

## Security Note

**API Keys in Client Code:**
- Using `EXPO_PUBLIC_` environment variables exposes keys to client
- This is acceptable for Google APIs with proper restrictions:
  - Restrict API key to specific domains
  - Set quota limits
  - Monitor usage

**Alternative:** If security is concern, need proper backend (Option 2)

---

**Next Step:** Implement Phase 1, Step 1-4 immediately to fix transcription flow.
