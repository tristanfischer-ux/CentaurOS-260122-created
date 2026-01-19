# People Seed Playbook

**How to Build Your Fractional Foundry Directory in 30-60 Minutes**

---

## Overview

This playbook guides you through populating the Universal People Marketplace with quality fractional executives, advisors, and apprentices. Start with your warm network, then expand through opt-in flows.

## The 4 Intake Paths

| Path | Best For | Creates | Visibility |
|------|----------|---------|------------|
| Network Seed Upload | Bulk adding known contacts | Stubs | Private |
| Event/Community Seed | Post-conference rapid capture | Stubs (tagged) | Private |
| Apprentice Intake Form | Public apprentice applications | Opted-in profiles | Private (admin flips) |
| Fractional Exec Opt-in | Invite-only exec profiles | Opted-in profiles | Marketplace (after verify) |

---

## Phase 1: Warm Network Seed (15 minutes)

### Step 1: Export Your Network

Create a CSV or spreadsheet with these columns:
```
name,linkedin_url,role_archetype,sector_tags,notes,email
```

**Example:**
```csv
name,linkedin_url,role_archetype,sector_tags,notes,email
Sarah Chen,https://linkedin.com/in/sarahchen,fractional_cfo,fintech;saas,Met at Founders Forum,
Tom Williams,https://linkedin.com/in/twilliams,fractional_coo,hardware;manufacturing,Worked with at Series A,tom@example.com
```

**Role Archetypes:**
- `fractional_ceo`, `fractional_coo`, `fractional_cfo`, `fractional_cto`, `fractional_cmo`
- `fractional_cpo`, `fractional_cro`, `fractional_chro`
- `advisor_board`, `advisor_strategic`, `advisor_technical`, `advisor_industry`
- `apprentice_finance`, `apprentice_ops`, `apprentice_engineering`, `apprentice_cad`

**Sector Tags:** Use semicolons to separate multiple tags
- `saas`, `fintech`, `healthtech`, `hardware`, `manufacturing`, `ecommerce`, `b2b`

### Step 2: Upload via Seed Tool

1. Navigate to **WHO Tab → Seed Directory**
2. Click **Network Seed Upload**
3. Paste your CSV or upload file
4. Review the preview - system will show dedupe warnings
5. Click **Create Stubs**

### Step 3: Review Created Stubs

All uploads create records with:
- `verification_status = "stub"`
- `profile_visibility = "private"`
- No contacts visible externally

---

## Phase 2: Send Invite Links (10 minutes)

### Step 1: Select Stubs to Invite

1. Go to **Seed Directory → Stubs** list
2. Select people you want to invite
3. Click **Bulk Invite** or individual **Send Invite**

### Step 2: Generate & Send Invites

For each selected person, the system:
1. Creates a unique invite token
2. Generates an invite link: `app.fractionalfoundry.com/join/{token}`
3. Creates email and LinkedIn DM templates
4. Creates a WHAT task draft: "Send invite to {Name}"

### Step 3: Copy Templates and Send

Use the generated templates (see INVITE_TEMPLATES.md):
- **Email**: For people whose email you have
- **LinkedIn DM**: For LinkedIn-only contacts

### Step 4: Track Invite Status

Monitor the funnel:
- **Stub** → Invite created but not sent
- **Invited** → You marked as sent
- **Opted-in** → Person completed their profile
- **Verified** → Admin reviewed and verified

---

## Phase 3: Handle Incoming Opt-ins (Ongoing)

### When Someone Completes Opt-in

1. Notification appears in your dashboard
2. Review their submitted profile
3. Run verification checklist:
   - Confirm LinkedIn matches
   - Check role history
   - Add evidence links if available
4. Click **Verify** to set `verification_status = "verified"`
5. Set `profile_visibility = "marketplace"` to make them discoverable

---

## Phase 4: Event/Conference Rapid Capture (5 minutes post-event)

### At the Event

Collect business cards or note names + LinkedIn URLs

### After the Event

1. Go to **Seed Directory → Event Seed**
2. Enter event name (e.g., "TechCrunch Disrupt 2026")
3. Paste names/LinkedIn URLs
4. Submit - creates stubs tagged with `source_type = "event"`

### Follow-up

1. Review event stubs
2. Send personalized invites referencing the event

---

## Phase 5: Apprentice Pipeline (Ongoing)

### Share the Intake Form

Public URL: `app.fractionalfoundry.com/apprentice-apply`

Share with:
- University career services
- Bootcamp placement teams
- Community groups
- Social media

### Process Applications

1. Applications create `opted_in` records (not yet marketplace visible)
2. System auto-creates task drafts:
   - "Screen application from {Name}"
   - "Schedule interview with {Name}"
3. Confirm tasks in WHAT tab
4. Run interviews using Role Pack scorecards
5. Verify and add to marketplace when ready

---

## Quality Gates

| Status | Appears in Search? | Contacts Visible? |
|--------|-------------------|-------------------|
| Stub | No | No |
| Invited | No | No |
| Opted-in | No (private) | Only public ones |
| Opted-in + Marketplace | Yes | Only public ones |
| Verified + Marketplace | Yes (boosted) | Only public ones |

---

## Metrics to Track

### Weekly Review

Check your Seed Dashboard for:
- Total stubs, invited, opted-in, verified
- Conversion rates (invite→optin, optin→verified)
- Stale stubs (invited but no response in 14 days)

### Target Benchmarks

| Metric | Good | Great |
|--------|------|-------|
| Invite response rate | 30% | 50%+ |
| Optin completion rate | 60% | 80%+ |
| Time to verify | 48 hours | 24 hours |

---

## Common Issues

### "Duplicate detected"
The system found a matching LinkedIn URL or similar name. Review and merge or skip.

### "Invalid role_archetype"
Check your CSV uses exact archetype keys (e.g., `fractional_cfo` not "Fractional CFO")

### "Email not stored"
Emails are only stored if:
1. Person provides via opt-in form, OR
2. It's publicly listed on their profile

### "Person not appearing in search"
Check:
1. `verification_status` must be `opted_in` or `verified`
2. `profile_visibility` must be `marketplace`

---

## Next Steps

After seeding 50+ execs:
1. Start the Partnerships Pipeline (universities/providers)
2. Launch targeted Apprentice Role Pack campaigns
3. Run your first talent search via the Wizard
