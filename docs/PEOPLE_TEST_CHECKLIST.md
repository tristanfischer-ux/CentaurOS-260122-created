# People Component Test Checklist

**Version:** 1.0
**Created:** 2026-01-19

## Prerequisites

- [ ] Database migration 008_people_component.sql has been run
- [ ] Environment variables set (see PEOPLE_ARCHITECTURE.md)
- [ ] Logged in as a workspace member
- [ ] Have Anthropic API key configured (for wizard LLM)

---

## 1. Stub Creation (Company-Side Discovery)

### 1.1 Create Minimal Stub

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to People → Pipeline | Pipeline view loads |
| 2 | Click "Add Candidate" | Add candidate form opens |
| 3 | Enter only: Name: "Test Candidate", Source: "referral" | Form accepts minimal data |
| 4 | Click "Add as Stub" | Stub created, appears in "Identified" column |
| 5 | Check universal_people table | Record has verification_status='stub', profile_visibility='private' |

### 1.2 Stub with LinkedIn

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add candidate with LinkedIn URL | Form accepts URL |
| 2 | Check universal_people_contacts | Contact created with visibility='private' |
| 3 | Search marketplace | Stub does NOT appear in results |

### 1.3 Verify Stub Privacy

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as different workspace user | Different workspace loads |
| 2 | Search marketplace for stub name | No results found |
| 3 | Check API response | Private stubs excluded |

---

## 2. Opt-in Onboarding Flow

### 2.1 Create Invite

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to People → Invites (admin) | Invite management page loads |
| 2 | Click "Create Invite" | Invite form opens |
| 3 | Enter email: test@example.com | Email accepted |
| 4 | Click "Send Invite" | Invite created, email sent (or logged) |
| 5 | Check people_invites table | Record with token, status='pending' |

### 2.2 Complete Onboarding (Invited Person)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open invite URL with token | Onboarding form loads |
| 2 | Enter required fields: name, role archetype | Fields validated |
| 3 | Select sectors, skills, location | Multi-selects work |
| 4 | Enter availability (8 hrs/wk) | Number validated |
| 5 | Leave "Visible in marketplace" unchecked | Privacy respected |
| 6 | Click consent checkbox | Required for submission |
| 7 | Submit form | Profile created |
| 8 | Check universal_people | verification_status='opted_in', profile_visibility='private' |

### 2.3 Opt Into Marketplace Visibility

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit own profile | Edit form loads |
| 2 | Check "Visible in marketplace" | Checkbox toggles |
| 3 | Mark email as "public" | Contact visibility toggle |
| 4 | Save changes | Changes saved |
| 5 | Check universal_people | profile_visibility='marketplace' |
| 6 | Search marketplace | Profile now appears |

---

## 3. Verified Profile

### 3.1 Admin Verification

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to admin People management | Admin view loads |
| 2 | Find opted-in profile | Profile appears in list |
| 3 | Click "Verify" | Verification dialog opens |
| 4 | Confirm verification | Status updated |
| 5 | Check universal_people | verification_status='verified', confidence_score increased |

### 3.2 Verification Badge Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search marketplace | Results include verified profile |
| 2 | Check profile card | Verification badge visible |
| 3 | Click profile | Detail view shows verification status |

---

## 4. Search & Wizard

### 4.1 Basic Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to People → Search | Search interface loads |
| 2 | Enter keyword: "COO" | Search executes |
| 3 | Check results | Only marketplace profiles shown |
| 4 | Filter by sector: "fintech" | Results filtered |
| 5 | Filter by availability: 8+ hrs | Results filtered |

### 4.2 Talent Matching Wizard (Text)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to People → Wizard | Wizard interface loads |
| 2 | Enter: "I need a fractional COO for a Series A fintech startup, 12 hours per week, remote OK" | Text accepted |
| 3 | Click "Find Matches" | Loading indicator shows |
| 4 | Check interpretation | Shows extracted: role=COO, sector=fintech, stage=series_a, hours=12, remote=true |
| 5 | View results | Ranked candidates with match explanations |

### 4.3 Wizard with Voice Transcript

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Voice Input" (if enabled) | Transcript input mode |
| 2 | Paste transcript: "We're a hardware company... need someone to sort out operations... maybe 2 days a week..." | Transcript accepted |
| 3 | Click "Interpret" | Claude extracts intent |
| 4 | Check interpretation | Shows: role=COO/ops, sector=hardware, hours=16 |

### 4.4 No Results Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Search for impossible combination | No results |
| 2 | Check UI | "No matches" message, suggestion to broaden criteria |

---

## 5. Add to Pipeline

### 5.1 From Search Results

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find candidate in search results | Card displayed |
| 2 | Click "Add to Pipeline" | Confirmation dialog |
| 3 | Select relationship type: "candidate" | Type selected |
| 4 | Confirm | Candidate added |
| 5 | Navigate to Pipeline | Candidate in "Identified" column |
| 6 | Check company_people_relationships | Record created with correct workspace_id |

### 5.2 From Wizard Results

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete wizard search | Results displayed |
| 2 | Click "Add to Pipeline" on top result | Same flow as above |

---

## 6. Pipeline Management

### 6.1 Move Through Stages

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View pipeline | Kanban columns visible |
| 2 | Drag candidate from "Identified" to "Contacted" | Stage updated |
| 3 | Check database | pipeline_stage='contacted' |

### 6.2 Add Interaction

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click candidate card | Detail panel opens |
| 2 | Click "Log Interaction" | Form opens |
| 3 | Enter: type=call, summary="Initial screening call" | Fields validated |
| 4 | Save | Interaction logged |
| 5 | Check company_people_interactions | Record created |

### 6.3 Add Document Link

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In detail panel, click "Add Document" | Form opens |
| 2 | Enter: type=nda, URL=https://... | Fields validated |
| 3 | Save | Document link saved |
| 4 | Check company_people_docs | Record created |

---

## 7. Create Outreach Drafts

### 7.1 Generate from Pipeline

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select candidate in "Identified" stage | Candidate selected |
| 2 | Click "Create Outreach Tasks" | Draft generation dialog |
| 3 | Select templates: "Email introduction", "Schedule call" | Templates selected |
| 4 | Confirm | Drafts created |
| 5 | Navigate to WHAT tab | Drafts appear in pending |
| 6 | Check task_drafts | Records with source='people_outreach', status='pending_confirmation' |

### 7.2 Confirm Drafts in WHAT

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In WHAT tab, find people outreach draft | Draft displayed |
| 2 | Click "Confirm" | Draft confirmed |
| 3 | Check task_drafts | status='confirmed' |
| 4 | Check tasks table | Task created |

### 7.3 Discard Draft

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find another draft | Draft displayed |
| 2 | Click "Discard" | Draft removed from view |
| 3 | Check task_drafts | status='discarded' |

---

## 8. Apprentice-Specific Features

### 8.1 Apprentice Profile Fields

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create profile with person_type='apprentice' | Form accepts |
| 2 | Set education_status='degree_apprentice' | Field saved |
| 3 | Search for apprentices | Filter by person_type works |

### 8.2 Apprentice Role Pack

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to People → Apprentice Packs | Packs list displayed |
| 2 | Select "Finance Apprentice Pack" | Pack details shown |
| 3 | Click "Apply Pack" | Task drafts generated |
| 4 | Check WHAT tab | 4 drafts: posting, screening, interview, onboarding |

### 8.3 Filter Apprentices vs Fractional

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In pipeline, click "Fractional Execs" filter | Only fractional shown |
| 2 | Click "Apprentices" filter | Only apprentices shown |
| 3 | Click "All" | Both shown |

---

## 9. Privacy & Security

### 9.1 Workspace Isolation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add candidate to Workspace A pipeline | Candidate added |
| 2 | Log in as Workspace B user | Different workspace |
| 3 | View Workspace B pipeline | Workspace A candidate NOT visible |
| 4 | Check API directly | RLS prevents access |

### 9.2 Personal Contacts Privacy

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add personal contact (warm intro) | Contact saved |
| 2 | Log in as different user (same workspace) | Same workspace |
| 3 | Try to view first user's personal contacts | Access denied |

### 9.3 Contact Visibility Rules

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View stub profile | No contact details shown |
| 2 | View opted-in private profile (if you created relationship) | Only name/headline shown |
| 3 | View marketplace profile with public email | Email visible |
| 4 | View marketplace profile with private email | Email hidden |

---

## 10. WHY Tab Integration

### 10.1 Stage Suggestion

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In WHY tab, trigger stage analysis | Analysis runs |
| 2 | Get result suggesting ops need | Suggestion displayed |
| 3 | Check for "talent needed" indicator | Shows suggested roles |
| 4 | Click "Find Candidates" | Opens People Wizard |
| 5 | Check wizard | Pre-filled with suggested criteria |

---

## 11. Error Handling

### 11.1 Invalid Invite Token

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to onboarding with invalid token | Error page |
| 2 | Check error message | "Invalid or expired invite" |

### 11.2 Duplicate Email

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to onboard with existing email | Error shown |
| 2 | Check message | "Email already registered" |

### 11.3 API Rate Limiting

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make 100+ search requests quickly | Rate limit hit |
| 2 | Check response | 429 with retry-after |

---

## 12. Performance

### 12.1 Search Performance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With 1000+ profiles, run search | < 500ms response |
| 2 | Check query plan | Indexes used |

### 12.2 Pipeline Load

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With 100+ candidates in pipeline | Loads < 1s |
| 2 | Drag-drop stage change | < 200ms feedback |

---

## Sign-off

| Test Section | Tester | Date | Pass/Fail |
|--------------|--------|------|-----------|
| 1. Stub Creation | | | |
| 2. Opt-in Onboarding | | | |
| 3. Verified Profile | | | |
| 4. Search & Wizard | | | |
| 5. Add to Pipeline | | | |
| 6. Pipeline Management | | | |
| 7. Outreach Drafts | | | |
| 8. Apprentice Features | | | |
| 9. Privacy & Security | | | |
| 10. WHY Integration | | | |
| 11. Error Handling | | | |
| 12. Performance | | | |

**Notes:**
