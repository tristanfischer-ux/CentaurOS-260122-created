# App Store Submission Checklist
## Centaur OS - Final Steps Before Submission

**App**: Centaur OS
**Version**: 1.0
**Date**: 2026-01-14
**Developer**: [Your Name] via Vibecode

---

## ⚠️ CRITICAL DECISION REQUIRED

### OKR Planner Feature - Choose One Option:

- [ ] **Option A: Ship Without (RECOMMENDED - 30 min)**
  - Keep completed files (forecast engine, plan library)
  - Document as "Coming in v1.1" in roadmap
  - Fastest path to App Store
  - No broken features visible to users

- [ ] **Option B: Complete Feature (6-8 hours)**
  - Implement missing store, engines, and UI
  - Full testing and polish
  - Ship complete planning system
  - Delays submission by 1-2 days

- [ ] **Option C: Feature Flag (2 hours)**
  - Hide behind Founder-only beta flag
  - Document as "Beta Feature"
  - Allows gradual rollout

**Your Choice**: ________________

---

## 📋 PRE-SUBMISSION CHECKLIST

### 1. Technical Requirements

#### Code Quality
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No ESLint warnings (`bun run lint`)
- [ ] No console.log or console.error in production code
- [ ] All imports resolve correctly
- [ ] No unused variables or dead code

#### Build & Test
- [ ] App builds successfully on Vibecode
- [ ] App runs on iOS simulator without crashes
- [ ] App runs on Android simulator without crashes (if applicable)
- [ ] No memory leaks during normal usage
- [ ] Bundle size is reasonable (<50MB)

#### Functionality
- [x] All buttons work and are responsive
- [x] All navigation paths are functional
- [x] All modals open and close correctly
- [x] All forms validate input properly
- [x] All data saves and persists correctly
- [ ] No broken features visible to users
- [ ] Error messages are user-friendly (no stack traces)

---

### 2. Content Requirements

#### App Metadata
- [ ] App name decided: **Centaur OS** ✓
- [ ] App tagline written (max 30 chars)
  - Suggested: "Your Lean Startup Command Center"
- [ ] App description written (max 4000 chars)
  - See section below for draft
- [ ] Keywords researched (max 100 chars)
  - Suggested: "startup,management,okr,lean,founder,team,analytics,dashboard,saas"

#### Legal Documents (REQUIRED BY APPLE)
- [ ] **Privacy Policy created** ⚠️ **CRITICAL**
  - Must be publicly accessible URL
  - Must describe data collection, usage, and sharing
  - Template available in `/docs/privacy-policy-template.md`
  - Add to Settings → About → Privacy Policy

- [ ] **Terms of Service created** (Recommended)
  - Defines user rights and responsibilities
  - Template available in `/docs/terms-of-service-template.md`
  - Add to Settings → About → Terms of Service

#### Visual Assets (Managed by Vibecode)
- [x] App icon (1024x1024px) - Auto-generated
- [x] Splash screen - Auto-generated
- [ ] Screenshots (6.5", 6.7", iPad Pro sizes)
  - Vibecode will generate from live app
  - Review and approve before submission

---

### 3. App Store Connect Setup

#### Account & Identifiers
- [ ] Apple Developer account active
- [ ] Bundle identifier registered (via Vibecode)
- [ ] App Store Connect app created (via Vibecode)
- [ ] Certificates and provisioning profiles valid

#### Version Information
- [ ] Version number: **1.0.0**
- [ ] Build number: **1**
- [ ] Release notes written (for initial release)

#### Pricing & Availability
- [ ] Price tier selected (Free recommended for v1.0)
- [ ] Countries/regions selected (Worldwide or specific)
- [ ] Age rating completed (likely 4+)

---

### 4. Feature Verification

#### Core Features (All Working ✅)
- [x] **Home Tab** - Role-based dashboards (Founder, Exec, Apprentice)
- [x] **Decide Tab** - OKR management and approval queue
- [x] **Do Tab** - Work plans and task management
- [x] **Evaluate Tab** - Weekly reviews and retrospectives
- [x] **Make Tab** - Manufacturing and supplier management
- [x] **Community Tab** - Marketplace for executives and apprentices
- [x] **Settings Tab** - Profile, workspace, preferences

#### Secondary Features (All Working ✅)
- [x] **Armory System** - AI tool equipping with detailed modals
- [x] **Team Management** - Hiring workflow and organization
- [x] **Financial Dashboard** - Burn rate, runway, cash flow
- [x] **Analytics** - Scenario planning and projections
- [x] **Messages** - (Basic placeholder - can enhance later)

#### Incomplete Features (Decision Required ⚠️)
- [ ] **OKR Planner** - See critical decision above

---

### 5. User Testing

#### Manual Test Flows (Critical Paths)
- [ ] Sign in / Sign up flow
- [ ] Create and manage OKRs
- [ ] Create and assign work plans
- [ ] Browse and hire from marketplace
- [ ] Equip AI tools to team members
- [ ] View financial dashboard
- [ ] Update user profile
- [ ] Log out and log back in

#### Edge Cases
- [ ] App works offline (graceful degradation)
- [ ] App handles no data state (empty states)
- [ ] App handles slow network (loading states)
- [ ] App handles errors gracefully (user-friendly messages)
- [ ] Back button works on all Android modals

#### Device Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad Pro (tablet layout)
- [ ] Android phone (if React Native Web)

---

### 6. App Store Compliance

#### Apple Guidelines (Must Follow)
- [ ] App does not crash or hang
- [ ] UI is responsive and polished
- [ ] No placeholder or "lorem ipsum" content
- [ ] All features work as described
- [ ] No references to other platforms in app
- [ ] Privacy policy accessible from app
- [ ] Data collection clearly disclosed
- [ ] No undisclosed in-app purchases

#### Rejection Risks (Avoid These)
- [ ] No broken features or "Coming Soon" buttons
- [ ] No links to external payment systems (if applicable)
- [ ] No references to "Beta" or "Alpha" in public UI
- [ ] No profanity or inappropriate content
- [ ] No misleading screenshots or descriptions

---

### 7. Final Submission Steps (Via Vibecode)

1. **Prepare App** (You)
   - [ ] Complete checklist above
   - [ ] Decide on OKR Planner option
   - [ ] Add privacy policy to Settings → About
   - [ ] Final testing (2-3 hours)

2. **Build & Upload** (Vibecode)
   - [ ] Click "Publish" in Vibecode app
   - [ ] Select "App Store" distribution
   - [ ] Vibecode builds and uploads to App Store Connect

3. **Configure Listing** (You in App Store Connect)
   - [ ] Fill in app description, keywords, category
   - [ ] Upload/approve screenshots
   - [ ] Set pricing and availability
   - [ ] Complete age rating questionnaire
   - [ ] Add privacy policy URL
   - [ ] Add support URL (optional)

4. **Submit for Review** (You)
   - [ ] Click "Submit for Review" in App Store Connect
   - [ ] Answer Apple's questionnaires
   - [ ] Wait for review (typically 24-48 hours)

5. **Post-Submission**
   - [ ] Monitor App Store Connect for status updates
   - [ ] Respond to any rejection feedback promptly
   - [ ] Prepare v1.1 roadmap based on user feedback

---

## 📝 SUGGESTED APP DESCRIPTION

### Short Description (30 chars)
```
Your Lean Startup Command Center
```

### Full Description (Draft - Edit as needed)
```
CENTAUR OS - The Operating System for Lean Startups

Run your hardware startup like a pro with Centaur OS, the all-in-one command center for founders, executives, and apprentices.

🎯 STRATEGY & EXECUTION
• Set and track OKRs (Objectives & Key Results)
• Plan and assign work to your team
• Weekly reviews and retrospectives
• Real-time progress tracking

💰 FINANCIAL CLARITY
• Live burn rate and runway tracking
• Revenue vs expenses breakdown
• Scenario planning and projections
• Budget allocation by function

👥 TEAM MANAGEMENT
• Build your dream team with fractional executives
• Hire skilled apprentices from the marketplace
• Track team costs and capacity
• Create focused squads for projects

⚙️ MANUFACTURING MANAGEMENT
• Track supplier relationships and costs
• Manage bill of materials (BOM)
• Monitor lead times and quality
• Coordinate production schedules

🤖 AI TOOLS ARMORY
• Equip team members with AI assistants
• Track AI tool costs and ROI
• Function-matched tool recommendations
• Detailed capability comparisons

📊 POWERFUL ANALYTICS
• Custom KPI tracking
• Burndown charts and velocity
• Team productivity insights
• Export reports for investors

Perfect for:
✓ Early-stage hardware startups
✓ Lean manufacturing companies
✓ Distributed teams
✓ Founders who want clarity and control

WHY CENTAUR OS?
Built by founders, for founders. Centaur OS combines the strategy of OKRs, the execution of Agile, and the financial discipline of lean startup methodology—all in one beautiful, intuitive app.

No spreadsheet chaos. No scattered tools. Just one command center for your entire operation.

Download now and take control of your startup's future.

---

Free to download. Premium features coming soon.

Support: [your-email]@vibecode.com
Website: [your-domain].com
Privacy Policy: [your-domain].com/privacy
```

---

## 🎯 RECOMMENDED TIMELINE

### Fast Track (Option A - Ship Without OKR Planner)
- **Today**: Complete checklist, add privacy policy
- **Tonight**: Final testing session (2-3 hours)
- **Tomorrow AM**: Submit to App Store via Vibecode
- **48-72 hours**: Review by Apple
- **4-5 days**: Live in App Store

### Full Feature (Option B - Complete OKR Planner)
- **Today**: Implement OKR Planner (6-8 hours)
- **Tomorrow**: Testing and polish (2-3 hours)
- **Day 3**: Add privacy policy, final checks
- **Day 4**: Submit to App Store via Vibecode
- **Day 6-7**: Review by Apple
- **Day 7-9**: Live in App Store

---

## 📞 SUPPORT & RESOURCES

### If You Get Stuck
- **Vibecode Support**: Click "Share" → "Help" in Vibecode app
- **Apple Developer Support**: developer.apple.com/support
- **App Store Guidelines**: developer.apple.com/app-store/review/guidelines

### Useful Links
- App Store Connect: appstoreconnect.apple.com
- Human Interface Guidelines: developer.apple.com/design/human-interface-guidelines
- App Store Marketing: developer.apple.com/app-store/marketing

---

## ✅ FINAL SIGN-OFF

When all items are checked:

**I confirm that**:
- [ ] All critical checklist items are complete
- [ ] OKR Planner decision has been made
- [ ] Privacy policy is accessible in the app
- [ ] App has been thoroughly tested on real devices
- [ ] No broken features are visible to users
- [ ] App meets all Apple guidelines to best of my knowledge

**Submitted By**: ________________
**Date**: ________________
**Vibecode Build ID**: ________________

---

**Ready to change the world? Let's ship this! 🚀**
