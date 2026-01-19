# Resend Email Setup Guide

**Last Updated:** 2026-01-19
**Status:** Ready to configure

---

## 🎯 What You Get

Automatic email sending for invitations with:
- ✅ Beautiful HTML email templates
- ✅ Plain text fallback
- ✅ Email tracking & analytics
- ✅ Great deliverability
- ✅ Free tier: 3,000 emails/month

---

## 📋 Setup Steps

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" (free, no credit card required)
3. Verify your email address

### 2. Get Your API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it: "Fractional Foundry Production"
4. Copy the key (starts with `re_`)

⚠️ **Important:** Save this key somewhere safe - you won't see it again!

### 3. Add to Your Environment

Add these to your `.env` file:

```bash
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional: Custom sender email (requires domain verification)
RESEND_FROM_EMAIL=invites@fractionalfoundry.com
RESEND_FROM_NAME=Fractional Foundry
```

**For testing**, you can use Resend's default:
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Fractional Foundry
```

### 4. Verify Your Domain (Optional but Recommended)

**Why?** To send from your own domain (e.g., `invites@fractionalfoundry.com`)

1. Go to [Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `fractionalfoundry.com`)
4. Add the DNS records Resend provides:
   - SPF record (TXT)
   - DKIM records (TXT)
   - DMARC record (TXT)

**DNS Provider Examples:**
- **Cloudflare:** DNS → Add Record
- **Namecheap:** Advanced DNS → Add New Record
- **GoDaddy:** DNS Management → Add Record

**Verification takes 1-5 minutes** after adding DNS records.

---

## 🧪 Testing

### Test in Development

1. Make sure Resend API key is in your `.env`
2. Restart your dev server: `bun run start`
3. Open SendInvitationModal
4. Enter a test email address
5. Click "Create Invitation"
6. Check your email inbox!

### Check Logs

In Vibecode app:
1. Go to LOGS tab
2. Look for:
   ```
   [EmailService] Invitation email sent to test@example.com, message ID: xxx
   [InvitationService] Email sent successfully
   ```

### View in Resend Dashboard

1. Go to [Emails](https://resend.com/emails)
2. See all sent emails
3. Click an email to see:
   - Delivery status
   - Open rate
   - Click tracking
   - Raw content

---

## 📧 Email Template Preview

Your invitations will look like this:

```
┌─────────────────────────────────────┐
│                                     │
│        You're Invited! 🎉          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Hi Jane,                           │
│                                     │
│  John Smith from Acme Inc has       │
│  invited you to join their team.    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ "Would love to have you on   │  │
│  │  board for our Q1 marketing  │  │
│  │  push!"                       │  │
│  └───────────────────────────────┘  │
│                                     │
│     [ Accept Invitation ]           │
│                                     │
│  🔒 Secure Invitation               │
│  • Cryptographically secure token   │
│  • Expires in 7 days                │
│  • One-time use only                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | ✅ Yes | - | Your Resend API key |
| `RESEND_FROM_EMAIL` | ⚠️ Optional | `invites@fractionalfoundry.com` | Sender email address |
| `RESEND_FROM_NAME` | ⚠️ Optional | `Fractional Foundry` | Sender name |

### Custom Sender Email

**Using Resend's test domain (no verification needed):**
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Using your own domain (requires verification):**
```bash
RESEND_FROM_EMAIL=invites@yourdomain.com
```

### Disable Email Sending

If you want to temporarily disable automatic emails:

```typescript
// In SendInvitationModal.tsx
const result = await createSecureInvitation({
  // ... other params
  sendEmail: false, // Disable automatic email
});
```

The invitation link will still be created - you just copy/paste it manually.

---

## 🐛 Troubleshooting

### "Failed to send email"

**Check:**
1. Is `RESEND_API_KEY` in `.env`?
2. Did you restart the dev server after adding it?
3. Is the API key valid? (check [API Keys](https://resend.com/api-keys))

**Test API key:**
```typescript
import { getEmailConfig } from '@/lib/email-service';
console.log(getEmailConfig());
// Should show: { configured: true, hasApiKey: true, ... }
```

### "Domain not verified"

If using custom domain:
1. Check DNS records are added correctly
2. Wait 5 minutes for DNS propagation
3. Use Resend's test domain instead: `onboarding@resend.dev`

### Emails going to spam

**Solutions:**
1. Verify your domain in Resend
2. Add SPF, DKIM, DMARC records
3. Use a reputable domain (not free email providers)
4. Test with [Mail Tester](https://www.mail-tester.com)

### Rate limit exceeded

Free tier: 3,000 emails/month

**Solutions:**
1. Upgrade to paid plan ($20/month for 50,000 emails)
2. Reduce invitation volume
3. Check for accidental loops sending emails

---

## 📊 Monitoring

### Email Analytics

In Resend dashboard you can see:
- **Sent:** Total emails sent
- **Delivered:** Successfully delivered
- **Opened:** How many recipients opened
- **Clicked:** Click-through rate on links
- **Bounced:** Failed deliveries
- **Complained:** Marked as spam

### Logs

Check server logs for:
```
[EmailService] Invitation email sent to user@example.com, message ID: 123abc
[EmailService] Resend error: Domain not verified
```

### Database

Check `people_invites` table:
- `status = 'sent'` - Email was sent
- `status = 'pending'` - Email not sent (manual link sharing)
- `sent_at` - Timestamp of email send

---

## 💰 Pricing

### Free Tier
- **3,000 emails/month**
- All features included
- No credit card required
- Perfect for getting started

### Pro Plan ($20/month)
- **50,000 emails/month**
- Same features
- Better for scaling

### Enterprise (Custom)
- **Custom volume**
- Dedicated IP
- Priority support

**Your Usage Estimate:**
- 10 invitations/day = ~300/month ✅ Free tier
- 50 invitations/day = ~1,500/month ✅ Free tier
- 200 invitations/day = ~6,000/month ⚠️ Pro tier

---

## 🎓 Next Steps

1. ✅ **Sign up for Resend** → [resend.com](https://resend.com)
2. ✅ **Get API key** → Add to `.env`
3. ⚠️ **Optional:** Verify your domain
4. ✅ **Test invitation** → Send to yourself
5. ✅ **Monitor** → Check Resend dashboard

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Dashboard](https://resend.com/emails)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

---

## 🆘 Support

**Resend Issues:**
- Email: support@resend.com
- Docs: [resend.com/docs](https://resend.com/docs)

**Integration Issues:**
- Check `src/lib/email-service.ts`
- Check server logs in LOGS tab
- Test with: `getEmailConfig()` function

---

## ✅ Checklist

Before going live:

- [ ] Resend account created
- [ ] API key added to `.env`
- [ ] Domain verified (or using resend.dev for testing)
- [ ] Test invitation sent successfully
- [ ] Email received in inbox (not spam)
- [ ] Invitation link works
- [ ] Checked Resend dashboard for delivery confirmation

**You're all set!** 🚀
