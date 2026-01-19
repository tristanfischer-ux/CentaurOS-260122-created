# API Security Note

## Current State (2026-01-19)

### Issue
AI API keys (OpenAI, Google, Anthropic) are currently exposed in the client bundle via `EXPO_PUBLIC_*` environment variables. This is **not secure** for production apps.

### Why Server Routes Don't Work
Attempted to move API calls to Expo Router API routes (`src/app/api/*.ts`), but discovered that:
- Expo Router API routes only work within the React rendering context, not as standalone HTTP endpoints
- Direct HTTP calls to `/api/*` routes return HTML (the app shell) instead of executing the handler
- This is by design - Expo Router API routes are not traditional REST endpoints

### Current Approach
Using client-side API calls directly from library files:
- `src/lib/transcription/openai-whisper.ts` - Direct OpenAI Whisper API calls
- `src/lib/ai/task-extraction.ts` - Direct OpenAI GPT API calls
- `src/lib/transcription/google-speech.ts` - Direct Google Speech API calls

### Security Trade-off
**For MVP/Demo:**
- ✅ App works correctly
- ✅ Fast development
- ❌ API keys exposed in bundle (can be extracted)
- ❌ Not suitable for production

**Recommendation: Use Vibecode's API Integration**
Vibecode provides API integrations through the API tab that handle keys securely. This is the recommended approach.

### Future Solution
For production apps, consider:
1. **Option A:** Real backend server with REST endpoints (Next.js, Express, etc.)
2. **Option B:** Supabase Edge Functions for serverless API calls
3. **Option C:** AWS Lambda / Cloudflare Workers
4. **Option D:** Use Vibecode's built-in API integrations (recommended)

## Files Created During Failed Attempt
These server route files exist but don't function as intended:
- `src/app/api/transcribe-whisper+api.ts` (created, not used)
- `src/app/api/ai-extract-tasks+api.ts` (created, not used)

They can be deleted or kept as reference for future backend implementation.

## Related Documentation
- `MORNING_SUMMARY.md` - Documents the overnight "security fix" attempt
- `.env.example` - Shows which keys should ideally be server-only
