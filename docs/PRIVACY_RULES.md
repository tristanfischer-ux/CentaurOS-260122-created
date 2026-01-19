# Privacy Rules for People Component

**Version:** 1.0
**Created:** 2026-01-19
**Status:** Enforced in Code + Database

## Core Privacy Principles

1. **Opt-in by default** - No one appears in the marketplace without explicit consent
2. **No scraping** - We do not collect private data from LinkedIn or other sources
3. **Contact details are sacred** - Email/phone only visible if person explicitly allows it
4. **Workspace isolation** - Company data is invisible to other companies
5. **Personal contacts are private** - Only visible to the individual user

---

## Data Visibility Matrix

### Layer 1: Universal Marketplace

| Verification Status | Profile Visibility | Who Can See Profile? | Who Can See Contacts? |
|---------------------|-------------------|---------------------|----------------------|
| `stub` | `private` | Only companies with relationships | Only company that created stub |
| `stub` | `marketplace` | ❌ N/A (stubs can't be marketplace) | ❌ |
| `invited` | `private` | Only companies with relationships | ❌ |
| `invited` | `marketplace` | ❌ N/A (must complete onboarding) | ❌ |
| `opted_in` | `private` | Only companies with relationships | Only if contact.is_public=true |
| `opted_in` | `marketplace` | All authenticated users | Only if contact.is_public=true |
| `verified` | `private` | Only companies with relationships | Only if contact.is_public=true |
| `verified` | `marketplace` | All authenticated users | Only if contact.is_public=true |

### Layer 2: Company Layer

| Data Type | Who Can See? |
|-----------|--------------|
| `company_people_relationships` | Workspace members only |
| `company_people_interactions` | Workspace members only |
| `company_people_docs` | Workspace members only |
| Pipeline stage & notes | Workspace members only |
| Warm intro signals | Workspace members only |

### Layer 3: Personal Layer

| Data Type | Who Can See? |
|-----------|--------------|
| `personal_contacts` | Owner user only |
| Warm intro notes | Owner user only |
| Relationship strength | Owner user only |

---

## Contact Information Rules

### What We Store

| Contact Type | Can Be Stored? | Can Be Made Public? |
|--------------|----------------|---------------------|
| Email (personal) | Only if provided by person | Only if person marks is_public=true |
| Email (work) | Only if provided by person | Only if person marks is_public=true |
| Phone | Only if provided by person | Only if person marks is_public=true |
| LinkedIn URL | Yes (public profile URL) | Yes (if person allows) |
| Website | Yes (public URL) | Yes |
| Twitter/GitHub | Yes (public profile) | Yes |
| Contact form URL | Yes (public URL) | Yes |

### What We NEVER Store

- ❌ Private emails found via scraping
- ❌ Phone numbers from databases
- ❌ LinkedIn connection data
- ❌ Social media passwords
- ❌ Data from paid data brokers

### Contact Visibility Flow

```
1. Person creates profile
   ↓
2. Person adds contact (e.g., email)
   ↓
3. Contact defaults to: visibility='private', is_public=false
   ↓
4. Person explicitly checks "Make this visible in marketplace"
   ↓
5. Contact updated: visibility='marketplace', is_public=true
   ↓
6. NOW contact appears in search results
```

---

## Stub Creation Rules

When a company discovers a potential candidate, they can create a "stub":

### Allowed Data for Stubs

| Field | Allowed? | Notes |
|-------|----------|-------|
| Name | ✅ Yes | If publicly known (e.g., from LinkedIn) |
| LinkedIn URL | ✅ Yes | Public profile URL only |
| Source notes | ✅ Yes | "Met at conference", "Referral from X" |
| Person type guess | ✅ Yes | "fractional_exec" |
| Role archetypes guess | ✅ Yes | Based on public info |
| Private email | ❌ No | Only if person provides directly |
| Phone number | ❌ No | Only if person provides directly |
| Detailed bio | ⚠️ Limited | Only public information |

### Stub Privacy Guarantees

1. Stubs have `profile_visibility='private'` always
2. Stubs are only visible to the workspace that created them
3. Other workspaces cannot see that a stub exists
4. If person later opts in, their profile merges (deduplication)

---

## Consent Tracking

### What We Track

```sql
opted_in_at TIMESTAMPTZ        -- When they completed onboarding
consent_version TEXT           -- Which privacy policy version
```

### Consent Flow

```
1. Person receives invite
   ↓
2. Person opens onboarding form
   ↓
3. Person must check: "I agree to the Terms of Service and Privacy Policy"
   ↓
4. On submit: opted_in_at = NOW(), consent_version = '2024-01'
   ↓
5. Profile created with verification_status='opted_in'
```

### Re-consent Requirements

If we materially change the privacy policy:
1. Bump consent version
2. Existing users with old version see notice
3. They must re-consent to remain in marketplace

---

## Data Retention

### Active Data

| Data Type | Retention |
|-----------|-----------|
| Marketplace profiles | Until person deletes or withdraws consent |
| Company relationships | Until company deletes or relationship archived |
| Personal contacts | Until user deletes |
| Interactions log | 7 years (business records) |
| Documents | Links only, external storage policy applies |

### Deleted Data

| Data Type | Hard Delete | Anonymize |
|-----------|-------------|-----------|
| Person requests deletion | ✅ Cascade all | - |
| Company deletes relationship | ✅ | - |
| User deletes personal contact | ✅ | - |
| Workspace deleted | - | ✅ Keep universal, remove company data |

---

## GDPR Compliance

### Right to Access

Person can request all data we hold:
- Universal profile
- All contacts
- All evidence
- All relationships (aggregated, not company-specific)
- Search appearances (anonymized)

### Right to Erasure

Person can request deletion:
- Profile deleted
- All contacts deleted
- All evidence deleted
- All relationships marked `person_id=NULL`
- Search index entry removed

### Right to Portability

Person can export:
- Profile data (JSON)
- Contact information
- Evidence links
- NOT: Company notes about them (those belong to company)

### Right to Rectification

Person can update:
- Profile information
- Contact details
- Evidence links
- Visibility settings

---

## Voice Input Privacy

### Default Behavior

| Setting | Default |
|---------|---------|
| Raw audio storage | ❌ Never stored |
| Transcript storage | ✅ Stored for session only |
| Transcript in logs | ❌ Not logged |
| Interpretation result | ✅ Stored as search parameters |

### Transcript Handling

```
1. User speaks or pastes transcript
   ↓
2. Transcript sent to Claude for interpretation
   ↓
3. Claude returns structured filters (role, sector, etc.)
   ↓
4. Transcript discarded after interpretation
   ↓
5. Only search parameters stored (no transcript)
```

---

## API Security

### Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| `/api/people/search` | 100/minute per user |
| `/api/people/onboard` | 10/hour per IP |
| `/api/people/wizard/interpret` | 20/minute per user |

### Authentication Requirements

| Endpoint | Auth Required? |
|----------|---------------|
| Public marketplace search | ✅ Authenticated |
| Onboarding with invite token | Token only |
| Pipeline management | ✅ Workspace member |
| Personal contacts | ✅ User only |

---

## Enforcement Points

### Database Level (RLS Policies)

```sql
-- Marketplace profiles only
CREATE POLICY universal_people_marketplace_read ON universal_people
  FOR SELECT
  USING (
    profile_visibility = 'marketplace'
    AND verification_status IN ('opted_in', 'verified')
  );

-- Contacts only if public
CREATE POLICY universal_people_contacts_read ON universal_people_contacts
  FOR SELECT
  USING (
    visibility = 'marketplace'
    AND is_public = TRUE
    ...
  );
```

### API Level

```typescript
// Always filter at API level too (defense in depth)
function filterContactsForVisibility(contacts, requestingUser) {
  return contacts.filter(c =>
    c.visibility === 'marketplace' &&
    c.is_public === true
  );
}
```

### UI Level

```typescript
// Never show email input for stubs
{isStub && (
  <Alert>
    Contact details cannot be added for candidates who haven't opted in.
    Send them an invite to join the marketplace.
  </Alert>
)}
```

---

## Audit Trail

All privacy-sensitive actions are logged:

```sql
-- Examples logged to task_events or dedicated privacy_audit table
{
  "action": "profile_visibility_changed",
  "before": "private",
  "after": "marketplace",
  "user_id": "...",
  "timestamp": "..."
}

{
  "action": "contact_made_public",
  "contact_type": "email",
  "user_id": "...",
  "timestamp": "..."
}

{
  "action": "data_export_requested",
  "user_id": "...",
  "timestamp": "..."
}
```
