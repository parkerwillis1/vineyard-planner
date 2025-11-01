# Team Member Email Invitation System - Setup Guide

This guide will help you set up the professional email invitation system for team members.

## Overview

When you invite a team member through the Team Management page:
1. A member record is created with a unique invitation token
2. A professional email is sent to the invitee
3. The email contains a link to accept the invitation
4. The invitee creates their account and automatically joins your organization

## Prerequisites

- Supabase project set up
- Resend account (for sending emails)
- Supabase CLI installed (for deploying Edge Functions)

## Step 1: Run Database Migration

Run the invitation tokens migration in your Supabase dashboard:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of: `supabase/migrations/013_add_invitation_tokens.sql`
5. Click **Run**

This adds the necessary columns to track invitation tokens and expiration dates.

## Step 2: Set Up Resend Account

1. Sign up for a free account at [resend.com](https://resend.com)
2. Verify your domain (or use their testing domain for development)
3. Generate an API key:
   - Go to **API Keys** in the Resend dashboard
   - Click **Create API Key**
   - Copy the key (you'll need it for the next step)

## Step 3: Configure Environment Variables

### Supabase Secrets

Set up the following secrets in your Supabase project:

```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_YOUR_ACTUAL_KEY_HERE
supabase secrets set APP_URL=https://your-production-domain.com

# For local development
supabase secrets set APP_URL=http://localhost:5173 --local
```

### Application Environment Variables

Create or update your `.env.local` file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Deploy Supabase Edge Function

Deploy the invitation email Edge Function:

```bash
# Make sure you're in the project root directory
cd /path/to/vineyard-planner

# Deploy the function
supabase functions deploy send-invitation

# Verify deployment
supabase functions list
```

You should see `send-invitation` in the list of deployed functions.

## Step 5: Configure Resend Email Domain (Production)

For production, you'll need to verify your domain with Resend:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `vinepioneer.com`)
4. Add the DNS records they provide to your domain registrar
5. Wait for verification (usually takes a few minutes)

Once verified, update the Edge Function to use your domain:

Edit `supabase/functions/send-invitation/index.ts` line 84:
```typescript
from: 'Vine Pioneer <invitations@yourdomain.com>',
```

Redeploy after making changes:
```bash
supabase functions deploy send-invitation
```

## Step 6: Test the System

### Test Invitation Flow

1. Log in to your vineyard app
2. Go to Team Management (Vineyard → Team)
3. Click **Invite Member**
4. Fill in the form:
   - Full Name: Test User
   - Email: your-test-email@example.com (use a real email you can access)
   - Role: Select a role
5. Click **Send Invitation**

### Verify Email

1. Check the email inbox for the invitation
2. The email should have:
   - Professional vineyard-themed design
   - Your organization name
   - The invited person's role
   - A prominent "Accept Invitation" button
   - An expiration date (7 days from invitation)

### Test Acceptance

1. Click the "Accept Invitation" button in the email
2. You should be redirected to the invitation acceptance page
3. Create a password
4. Click "Accept & Create Account"
5. You should be automatically logged in and redirected to the app

## Troubleshooting

### Invitation Email Not Sending

**Check Edge Function Logs:**
```bash
supabase functions logs send-invitation
```

**Common Issues:**
- Invalid Resend API key → Check secrets configuration
- Domain not verified → Use Resend testing domain for development
- Edge Function not deployed → Run `supabase functions deploy send-invitation`

### Invitation Link Not Working

**Check Database:**
```sql
SELECT invitation_token, invitation_expires_at, invitation_sent_at
FROM organization_members
WHERE email = 'test@example.com';
```

**Common Issues:**
- Token expired → Invitation is only valid for 7 days
- Token already used → Check `invitation_accepted_at` field
- Wrong APP_URL → Verify environment variable

### User Cannot Create Account

**Check Browser Console:**
- Look for Supabase auth errors
- Verify email is not already registered

**Check Supabase Auth Settings:**
- Enable email/password authentication
- Disable email confirmation for testing (or handle confirmation flow)

## Email Customization

### Update Email Template

Edit the `generateInvitationEmail` function in `supabase/functions/send-invitation/index.ts` to customize:

- Colors and styling
- Logo (add your organization's logo URL)
- Text content
- Button styles

### Update "From" Address

Line 84 in the Edge Function:
```typescript
from: 'Your Vineyard Name <invitations@yourdomain.com>',
```

## Development vs Production

### Development Setup

For local development with Resend:
1. Use Resend's testing domain: `onboarding@resend.dev`
2. Set `APP_URL=http://localhost:5173`
3. Emails will be delivered but marked as test emails

### Production Setup

For production:
1. Verify your domain with Resend
2. Set `APP_URL=https://your-production-domain.com`
3. Update "from" address to use your domain
4. Configure proper SPF/DKIM records for better deliverability

## Security Notes

1. **Invitation Tokens:**
   - Automatically expire after 7 days
   - Can only be used once
   - Are cryptographically secure UUIDs

2. **API Keys:**
   - Never commit Resend API key to version control
   - Use Supabase secrets for production
   - Rotate keys if compromised

3. **Email Verification:**
   - Consider enabling Supabase email verification for additional security
   - Implement rate limiting on invitation sending

## Next Steps

- Customize the email template with your branding
- Set up email analytics in Resend dashboard
- Implement invitation resending feature
- Add invitation expiration notifications
- Create an admin dashboard to manage invitations

## Support

For issues specific to:
- **Resend:** [resend.com/docs](https://resend.com/docs)
- **Supabase Edge Functions:** [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **Supabase Auth:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
