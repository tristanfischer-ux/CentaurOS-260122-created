# Demo Accounts Setup Script

This document provides SQL commands to create demo accounts in Supabase Auth.

## Quick Setup

Run these commands in your Supabase SQL Editor to create the demo accounts:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** (manually) for each:

**Founder Account:**
- Email: `founder@fractional.com`
- Password: `demo1234`
- Metadata (JSON):
```json
{
  "name": "Sarah Chen"
}
```

**Executive Account:**
- Email: `exec@fractional.com`
- Password: `demo1234`
- Metadata (JSON):
```json
{
  "name": "Jordan Martinez"
}
```

**Apprentice Account:**
- Email: `apprentice@fractional.com`
- Password: `demo1234`
- Metadata (JSON):
```json
{
  "name": "Alex Rivera"
}
```

---

### Option 2: Via SQL (Advanced)

**Note:** Direct SQL creation of auth users requires admin API key. It's easier to use the dashboard.

If you have the service_role key, you can use the Admin API:

```typescript
// Use this in a Node.js script with service_role key
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'your-project-url'
const serviceRoleKey = 'your-service-role-key' // Keep this secret!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create demo accounts
const demoAccounts = [
  { email: 'founder@fractional.com', password: 'demo1234', name: 'Sarah Chen' },
  { email: 'exec@fractional.com', password: 'demo1234', name: 'Jordan Martinez' },
  { email: 'apprentice@fractional.com', password: 'demo1234', name: 'Alex Rivera' }
]

for (const account of demoAccounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true, // Skip email confirmation
    user_metadata: {
      name: account.name
    }
  })

  if (error) {
    console.error(`Failed to create ${account.email}:`, error.message)
  } else {
    console.log(`✅ Created ${account.email}`)
  }
}
```

---

## Verification

After creating the accounts, verify they work:

1. Open your Centaur OS app
2. Tap a "Quick Demo Access" button
3. Should sign in successfully and navigate to app

---

## Security Notes

⚠️ **Important:**
- Demo accounts are for testing only
- Use strong passwords in production
- Consider disabling demo accounts before App Store release
- Never commit service_role keys to git

---

## Alternative: Remove Demo Accounts

If you don't want demo accounts, you can remove the quick sign-in buttons:

**File:** `/src/app/sign-in.tsx`

Comment out or remove lines 294-354 (the Demo Accounts section)

---

## Password Requirements

Supabase default password requirements:
- Minimum 6 characters
- No maximum length
- Any characters allowed

You can customize this in: **Authentication** → **Policies** in Supabase dashboard

---

**Last Updated:** January 17, 2026
