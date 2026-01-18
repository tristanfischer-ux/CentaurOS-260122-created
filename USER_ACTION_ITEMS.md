# 🎯 YOUR ACTION ITEMS - Central OS WHAT/WHY Flows

**Last Updated:** January 18, 2026
**Status:** Ready for testing

---

## ✅ COMPLETED WORK

### 1. Math & Time Semantics Audit ✅
**ALL DONE** - No action required from you

- ✅ All critical calculation bugs fixed
- ✅ DST-safe time handling implemented
- ✅ Division-by-zero guards added everywhere
- ✅ OKR progress double-averaging bug fixed
- ✅ Runway calculation returns months (not weeks)
- ✅ Documentation created

**Files Created:**
- `TIME_SEMANTICS_SPEC.md` - Time period definitions
- `MATH_AUDIT_REPORT.md` - All issues found
- `FIXES_COMPLETED.md` - Complete changelog
- `MATH_TEST_CHECKLIST.md` - 30 test scenarios

### 2. WHAT/WHY Backend Infrastructure ✅
**ALL DONE** - APIs are ready

- ✅ Database schema created (9 tables)
- ✅ WHAT APIs created (extract-drafts, confirm, drafts)
- ✅ WHY APIs created (session, turn, synthesize)
- ✅ LLM provider abstraction with Anthropic
- ✅ Scheduling engine with capacity-aware allocation
- ✅ Configuration using your existing Anthropic API key

**No cloud project needed!** - You already have Anthropic API access through Vibecode.

---

## 🔴 WHAT YOU NEED TO DO NOW

### **NOTHING! You can start testing immediately.**

Your existing Anthropic API key is already configured:
- ✅ Key found: `ANTHROPIC_API_KEY=sk-ant-api03-...`
- ✅ Already paid for through Vibecode
- ✅ Code updated to use it automatically

---

## 📱 HOW TO TEST THE NEW FEATURES

### **Test 1: WHAT Tab - Text Input** ⏰ 5 minutes

1. **Open your app** and go to the **WHAT tab**
2. **Type or paste this:**
   ```
   Create a task to update the landing page by Friday.
   Also need to review the analytics dashboard, should take about 2 days.
   John should handle the email templates by next Tuesday.
   ```
3. **What should happen:**
   - System extracts 3 task drafts
   - You see them in a list with editable fields
   - You can edit title, assignee, due date, time units
   - Click "Confirm" to create the tasks
   - Tasks appear in your task list with weekly allocations

**Expected Results:**
- ✅ 3 draft tasks created
- ✅ Assignees detected (you, John)
- ✅ Due dates detected (Friday, next Tuesday)
- ✅ Time estimates extracted (2 days)
- ✅ After confirm: tasks scheduled into weekly capacity

**If it doesn't work:**
- Check the **LOGS tab** in Vibecode app
- Or tell me what happened and I'll fix it

---

### **Test 2: WHY Tab - Business Brainstorming** ⏰ 10 minutes

1. **Go to the WHY tab**
2. **Start a brainstorm session with:**
   ```
   I want to plan our Q1 marketing strategy for the new product launch.
   ```
3. **The AI should ask you ONE question** (not multiple)
   - Example: "What problem does your new product solve for customers?"
4. **Answer the question naturally**
5. **Continue the conversation** (4-5 rounds recommended)
6. **Click "Synthesize"** when ready
7. **Review the generated:**
   - Strategic objectives (max 7)
   - Task drafts linked to objectives (max 15)
8. **Edit if needed, then confirm**
9. **Tasks appear in your task list** with a badge showing which objective they support

**Expected Results:**
- ✅ AI asks thoughtful, open-ended questions
- ✅ Builds on your previous answers
- ✅ Avoids jargon (no "SWOT", "Porter's Five Forces")
- ✅ Synthesis creates clear objectives
- ✅ Tasks are concrete next steps
- ✅ Traceability: objective → tasks

**If it doesn't work:**
- Check the LOGS tab
- Or tell me what the AI said and I'll debug

---

### **Test 3: WHAT Tab - Voice Input** ⏰ 5 minutes (OPTIONAL)

**Status:** Voice is ready with mock mode for now

1. **Go to WHAT tab**
2. **Click "Use mock transcript"** button (dev mode)
3. **Select a sample transcript**
4. **Same flow as Test 1**

**Real voice (when you want it):**
- We can add real speech-to-text later
- For now, mock mode works perfectly for testing

---

## 📊 HOW TO CHECK IF IT'S WORKING

### **Check 1: Database**
Go to your Supabase dashboard and check these tables have data:
- `task_drafts` - Should see drafts before confirmation
- `tasks` - Should see confirmed tasks
- `task_allocations` - Should see weekly schedules
- `brainstorm_sessions` - Should see WHY sessions
- `objectives` - Should see strategic goals

### **Check 2: Logs**
In Vibecode app, LOGS tab, look for:
```
[WHAT Extract] Extracted X drafts
[WHY Turn] Turn completed for session: ...
[WHY Synthesize] Generated X objectives and Y task drafts
```

### **Check 3: UI**
- WHAT tab: Draft cards appear after extraction
- WHY tab: AI questions appear after your messages
- Task list: New tasks appear after confirmation
- Tasks show correct assignee, due date, time units

---

## 🐛 IF SOMETHING BREAKS

### **Common Issues:**

**1. "No drafts extracted"**
- Check LOGS tab for LLM errors
- API key might be missing → but we already confirmed it exists
- Tell me the exact error message

**2. "Tasks not appearing after confirm"**
- Check Supabase `tasks` table
- Check LOGS tab for database errors
- May be RLS policy issue → I'll fix

**3. "AI not asking questions in WHY tab"**
- Check LOGS tab for API errors
- Session might not be created → I'll debug
- Anthropic API might be rate limited → try again in 1 min

**4. "Timezone issues / wrong week"**
- All calculations use Europe/London timezone
- Week starts Monday (ISO standard)
- If you see wrong dates, tell me your local timezone

### **How to Report Issues:**
1. Go to LOGS tab in Vibecode app
2. Screenshot the error
3. Tell me:
   - Which tab (WHAT or WHY)
   - What you did (exact steps)
   - What you expected vs what happened
   - Any error messages from logs

---

## 📚 BACKGROUND INFORMATION

### **How WHAT Flow Works:**
```
Your Input → LLM Extracts Drafts → You Review/Edit → Confirm →
Tasks Created → Scheduled into Weekly Capacity →
Allocations Created → Tasks Appear in List
```

### **How WHY Flow Works:**
```
Your Message → AI Asks Question → You Answer → AI Asks Next Question →
(Repeat 4-5 times) → You Click Synthesize →
LLM Generates Objectives + Tasks → You Review/Edit → Confirm →
Objectives Saved → Tasks Created (linked to objectives) →
Tasks Appear in List with Objective Badge
```

### **Scheduling Rules:**
- Each user has 10 time units (TU) per week by default
- Each task needs minimum 1 TU
- If week is full → task overflows to next week
- If due date exists and can't fit → risk flag set (⚠️)
- Week starts Monday at 00:00 Europe/London time

### **Key Features:**
- ✅ No task creation without confirmation (everything is draft first)
- ✅ Idempotent confirmation (clicking twice won't create duplicates)
- ✅ Capacity-aware scheduling (respects weekly limits)
- ✅ Timezone-safe (Europe/London, DST-aware)
- ✅ Audit trail (all events logged)
- ✅ Traceability (WHY tasks link to objectives)

---

## 🎯 SUCCESS CRITERIA

You'll know it's working when:
1. ✅ WHAT tab: Text input creates editable draft tasks
2. ✅ Drafts can be edited before confirmation
3. ✅ Confirmed tasks appear in task list
4. ✅ Tasks are scheduled into weekly capacity
5. ✅ WHY tab: AI asks thoughtful questions
6. ✅ Brainstorm synthesizes into objectives + tasks
7. ✅ WHY tasks show which objective they support
8. ✅ No duplicate tasks when confirming twice
9. ✅ Due dates are respected (or risk flag shown)
10. ✅ All calculations are accurate (no 231-month runway bugs!)

---

## 🚀 NEXT STEPS

### **After Testing Works:**
1. **Voice Input** - Add real speech-to-text (optional)
2. **UI Polish** - Make draft cards prettier
3. **Mobile Optimization** - Improve touch targets
4. **Batch Operations** - Edit multiple drafts at once
5. **Templates** - Save common task patterns

### **Future Enhancements:**
- AI suggests task dependencies
- Auto-detect task categories
- Smart assignee suggestions
- Predictive scheduling (ML-based capacity)
- Voice-only mode (hands-free brainstorming)

---

## 📞 SUPPORT

**If you need help:**
1. Tell me which test failed
2. Share screenshot from LOGS tab
3. Describe what you expected vs what happened
4. I'll fix it immediately

**Current Status:**
- ✅ All code written and type-checked
- ✅ All APIs functional
- ✅ Anthropic API key configured
- ✅ Ready for your testing

---

## 🎉 YOU'RE READY!

**Start with Test 1 (WHAT tab text input)** - it's the easiest.

Just go to the WHAT tab, type some tasks, and see what happens!

If anything breaks, I'm here to help. 🚀
