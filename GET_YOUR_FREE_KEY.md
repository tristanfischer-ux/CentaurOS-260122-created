# 🎯 FINAL SETUP - Get Your Own FREE Google API Key

**IMPORTANT:** To avoid any charges from Vibecode, get your own FREE Google AI API key.

---

## 💰 **Cost Comparison:**

### Option 1: Use Vibecode's Managed API ❌ **NOT RECOMMENDED**
- Uses: `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY`
- **May charge you** for API usage over time
- You don't control costs
- Unclear pricing

### Option 2: Get Your Own FREE Google Key ✅ **RECOMMENDED**
- Uses: `GOOGLE_AI_API_KEY` (your own)
- **100% FREE** with generous limits
- 1 million tokens/day (way more than you need)
- No credit card required
- You control everything

---

## 🚀 **GET YOUR FREE KEY (2 minutes)**

### Step 1: Create API Key

1. **Go to:** https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Get API key"**
4. **Click "Create API key in new project"**
   - This creates a minimal project (not full Google Cloud)
   - No billing setup required
   - No credit card needed
5. **Copy the key** (starts with `AIza...`)

### Step 2: Add to Vibecode

1. **Open Vibecode app** → **ENV tab**
2. **Click "+ Add variable"**
3. **Enter:**
   - Key: `GOOGLE_AI_API_KEY`
   - Value: `AIza...` (paste your key)
4. **Click Save**

### Step 3: Verify (Check LOGS)

After adding your key:
1. **Go to LOGS tab**
2. **Look for:** `✅ Using your own GOOGLE_AI_API_KEY (FREE!)`

If you see this, **you're all set!** ✅

If you see: `⚠️ Using EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY`, then your key wasn't added properly - try again.

---

## 📊 **FREE TIER LIMITS**

**Gemini 1.5 Flash (Default):**
- ✅ 15 requests/minute
- ✅ 1 million tokens/day
- ✅ **FREE forever**

**What this means:**
- ~2,000 task extractions per day
- ~500 brainstorming sessions per day
- **You'll never hit these limits** in normal usage

**If you somehow hit limits:**
- Free tier resets daily
- Or upgrade to paid: $0.35 per million tokens (incredibly cheap)

---

## 🔍 **HOW TO VERIFY IT'S FREE**

### Check 1: LOGS Tab Shows Your Key
```
✅ Using your own GOOGLE_AI_API_KEY (FREE!)
```

### Check 2: Google AI Studio Dashboard
1. Go to: https://aistudio.google.com/
2. Click "Usage" (if available)
3. See your free tier usage
4. **No billing** = 100% free

### Check 3: No Vibecode Charges
Since you're using your own key:
- Vibecode won't charge you for API usage
- Only your Google account (which is free)
- You're in complete control

---

## ⚠️ **IMPORTANT: Priority Order**

The code checks for API keys in this order:

1. **`GOOGLE_AI_API_KEY`** ← Your own (FREE) ✅
2. `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY` ← Vibecode's (may charge) ❌
3. `ANTHROPIC_API_KEY` ← Your own Anthropic
4. `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` ← Vibecode's (may charge) ❌

**As long as you add `GOOGLE_AI_API_KEY`, it will use YOUR key first!**

---

## 🎉 **AFTER YOU ADD YOUR KEY**

### Then Test:

1. **WHAT Tab:**
   ```
   Create a task to update the landing page by Friday.
   ```
   - Should extract drafts using YOUR free Google key
   - Check LOGS: `✅ Using your own GOOGLE_AI_API_KEY (FREE!)`

2. **WHY Tab:**
   ```
   I want to plan our Q1 marketing strategy.
   ```
   - AI asks questions using YOUR free Google key
   - No charges to you or Vibecode

---

## 💡 **WHY YOUR OWN KEY IS BETTER**

1. ✅ **100% FREE** - No charges ever (with free tier)
2. ✅ **No surprises** - You see usage in Google dashboard
3. ✅ **Full control** - You own the API key
4. ✅ **Better limits** - Direct access to Google's generous free tier
5. ✅ **Future-proof** - Can upgrade on your terms if needed

---

## 🔐 **SECURITY NOTE**

Your API key is **safe**:
- Only used in server-side API routes (not client)
- Never exposed to browser
- Environment variable (not in code)
- Can regenerate anytime in Google AI Studio

---

## 📝 **QUICK CHECKLIST**

- [ ] Go to https://aistudio.google.com/app/apikey
- [ ] Create API key in new project
- [ ] Copy the key (starts with `AIza...`)
- [ ] Add to Vibecode ENV tab: `GOOGLE_AI_API_KEY`
- [ ] Save
- [ ] Check LOGS tab for: `✅ Using your own GOOGLE_AI_API_KEY (FREE!)`
- [ ] Test WHAT tab
- [ ] Test WHY tab
- [ ] Celebrate! 🎉

---

## 🚀 **YOU'RE READY!**

Once you add your own `GOOGLE_AI_API_KEY`:
- ✅ 100% free
- ✅ No Vibecode charges
- ✅ Generous limits
- ✅ Full control

**Get your key now and start testing!**
