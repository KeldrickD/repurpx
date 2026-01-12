# 🚀 Production Readiness Test Checklist

**Date:** $(date)  
**Status:** Pre-Launch Testing

---

## ✅ Critical Fixes Applied

- [x] Fixed Stripe price ID mapping (`STRIPE_PRICE_STARTER_GROWTH` → `STRIPE_PRICE_GROWTH`)
- [x] Fixed OnboardingNudge typo (`GHOST` → `GHOSTS`)
- [x] Verified all environment variables are set
- [x] Verified database migrations are applied (8 migrations)

---

## 🔐 1. Environment & Configuration

### Environment Variables
- [x] `NEXTAUTH_SECRET` - Set (base64 encoded)
- [x] `DATABASE_URL` - Connected to Supabase
- [x] `STRIPE_SECRET_KEY` - Test key configured
- [x] `STRIPE_PUBLIC_KEY` - Test key configured
- [x] `STRIPE_WEBHOOK_SECRET` - Configured
- [x] `STRIPE_PRICE_STARTER` - Set
- [x] `STRIPE_PRICE_STARTER_GROWTH` - Set
- [x] `STRIPE_PRICE_STARTER_CLUB` - Set
- [x] `TWILIO_ACCOUNT_SID` - Set
- [x] `TWILIO_AUTH_TOKEN` - Set
- [x] `TWILIO_FROM_NUMBER` - Set
- [x] `TELEGRAM_BOT_TOKEN` - Set
- [x] `OPENAI_API_KEY` - Set (optional)
- [x] `NEXT_PUBLIC_APP_URL` - Set to `http://localhost:3000`

### Database
- [x] Prisma migrations applied (8 migrations)
- [x] Database connection working
- [x] All tables exist (User, CreatorAccount, Fan, Campaign, etc.)

---

## 👤 2. Authentication Flow

### Signup
- [ ] **Test:** Create new account with email/password
  - [ ] Verify user is created in database
  - [ ] Verify password is hashed
  - [ ] Verify `hasCompletedOnboarding` defaults to `false`
  - [ ] Verify redirect to `/onboarding`

### Login
- [ ] **Test:** Login with valid credentials
  - [ ] Verify session is created
  - [ ] Verify redirect based on `hasCompletedOnboarding`
  - [ ] Verify session persists on page refresh

### Session Management
- [ ] **Test:** Session expires correctly
- [ ] **Test:** Logout clears session
- [ ] **Test:** Protected routes redirect to signin

---

## 🎯 3. Onboarding Wizard (3-Step Flow)

### Step 1: Role Selection
- [ ] **Test:** Select single role (CREATOR)
  - [ ] Verify role is saved to database
  - [ ] Verify `primaryRole` is set
  - [ ] Verify `CreatorAccount` is created with correct platform

- [ ] **Test:** Select multiple roles (CREATOR + DANCER)
  - [ ] Verify both roles are saved
  - [ ] Verify primary role selection works
  - [ ] Verify multiple `CreatorAccount` records are created

- [ ] **Test:** Select all three roles
  - [ ] Verify all roles are saved
  - [ ] Verify primary role can be changed

### Step 2: Data Import
- [ ] **Test:** Dancer CSV import
  - [ ] Upload CSV with: name, phone, tier, spend, visits, lastVisit, notes
  - [ ] Verify customers are imported
  - [ ] Verify import status message appears
  - [ ] Verify "skip" option works

- [ ] **Test:** Club CSV import
  - [ ] Upload CSV with: name, phone, vipStatus, spend, visits, lastVisit, birthday
  - [ ] Verify patrons are imported
  - [ ] Verify import status message appears

- [ ] **Test:** Creator role (skip import)
  - [ ] Verify skip checkbox works
  - [ ] Verify can proceed without importing

### Step 3: First Campaign
- [ ] **Test:** Dancer first campaign (SMS)
  - [ ] Select SMS channel
  - [ ] Use quick template
  - [ ] Send campaign
  - [ ] Verify success recap appears
  - [ ] Verify `toCount` is displayed
  - [ ] Verify redirect to dashboard after "Go to dashboard"

- [ ] **Test:** Club first campaign (SMS)
  - [ ] Select SMS channel
  - [ ] Use quick template
  - [ ] Send campaign
  - [ ] Verify success recap

- [ ] **Test:** Creator first campaign (Telegram)
  - [ ] Select Telegram channel
  - [ ] Use quick template
  - [ ] Send campaign
  - [ ] Verify success recap

- [ ] **Test:** Onboarding completion
  - [ ] Verify `hasCompletedOnboarding` is set to `true`
  - [ ] Verify redirect to role-specific dashboard

---

## 🗺️ 4. Role-Based Routing & Navigation

### Dashboard Routing
- [ ] **Test:** CREATOR role → `/dashboard/segments`
- [ ] **Test:** DANCER role → `/dashboard/dancer/customers`
- [ ] **Test:** CLUB role → `/dashboard/club/patrons`

### Navigation Visibility
- [ ] **Test:** CREATOR sees segments, campaigns, templates
- [ ] **Test:** DANCER sees dancer CRM, customers
- [ ] **Test:** CLUB sees club CRM, patrons
- [ ] **Test:** Multi-role users see all relevant nav items

### Onboarding Redirect
- [ ] **Test:** User with `hasCompletedOnboarding: false` → `/onboarding`
- [ ] **Test:** User with `hasCompletedOnboarding: true` → role dashboard

---

## 📊 5. Dashboard Features

### Creator Dashboard (`/dashboard/segments`)
- [ ] **Test:** OnboardingNudge appears
  - [ ] Verify stats (whales, ghosts) are displayed
  - [ ] Verify SMS usage is shown
  - [ ] Verify CTAs work (Open Segments, Create win-back campaign)
  - [ ] Verify dismiss works (localStorage)

- [ ] **Test:** Segment summary loads
  - [ ] Verify `/api/segments/summary` returns data
  - [ ] Verify KPI cards display correctly

### Dancer Dashboard (`/dashboard/dancer/customers`)
- [ ] **Test:** OnboardingNudge appears
  - [ ] Verify stats (atRisk, cold) are displayed
  - [ ] Verify SMS usage is shown
  - [ ] Verify CTAs work

- [ ] **Test:** Customer list loads
  - [ ] Verify customers are displayed
  - [ ] Verify activity status badges work
  - [ ] Verify filters work

- [ ] **Test:** Quick templates in broadcast card
  - [ ] Verify templates appear
  - [ ] Verify clicking template fills message
  - [ ] Verify SMS send works

### Club Dashboard (`/dashboard/club/patrons`)
- [ ] **Test:** OnboardingNudge appears
  - [ ] Verify stats (atRisk, cold, birthdays) are displayed
  - [ ] Verify SMS usage is shown

- [ ] **Test:** Patron list loads
  - [ ] Verify patrons are displayed
  - [ ] Verify VIP status badges work
  - [ ] Verify birthday indicators work

- [ ] **Test:** Quick templates in broadcast card
  - [ ] Verify templates appear
  - [ ] Verify SMS send works

---

## 💬 6. Messaging Features

### SMS Broadcasts

#### Dancer SMS (`/api/sms/dancers/broadcast`)
- [ ] **Test:** Send SMS to WHALE tier
  - [ ] Verify SMS quota is checked
  - [ ] Verify SMS is sent via Twilio
  - [ ] Verify `OutboundSms` record is created
  - [ ] Verify `successCount` and `failedCount` are tracked

- [ ] **Test:** SMS quota enforcement (FREE plan)
  - [ ] Verify `SMS_NOT_ALLOWED` error is returned
  - [ ] Verify error message is user-friendly

- [ ] **Test:** SMS quota exceeded (STARTER plan)
  - [ ] Send 500+ SMS
  - [ ] Verify `SMS_LIMIT_EXCEEDED` error is returned
  - [ ] Verify `remaining` count is accurate

#### Club SMS (`/api/sms/clubs/broadcast`)
- [ ] **Test:** Send SMS to GOLD VIPs
  - [ ] Verify SMS is sent
  - [ ] Verify quota is checked

- [ ] **Test:** Filter by AT_RISK
  - [ ] Verify only at-risk patrons receive SMS

- [ ] **Test:** Filter by BIRTHDAY_WEEK
  - [ ] Verify only patrons with birthdays receive SMS

### Telegram Broadcasts
- [ ] **Test:** Creator Telegram broadcast
  - [ ] Verify message is sent to Telegram channel
  - [ ] Verify segment filtering works

- [ ] **Test:** Dancer Telegram broadcast
  - [ ] Verify tier filtering works

---

## 💳 7. Billing & Stripe Integration

### Stripe Checkout
- [ ] **Test:** STARTER plan checkout
  - [ ] Click "Upgrade" on STARTER plan
  - [ ] Verify Stripe Checkout session is created
  - [ ] Verify redirect to Stripe Checkout page
  - [ ] Complete checkout with test card (`4242 4242 4242 4242`)
  - [ ] Verify redirect to `/dashboard/billing?success=1`

- [ ] **Test:** CLUB plan checkout
  - [ ] Verify CLUB plan checkout works
  - [ ] Verify price ID is correct (`STRIPE_PRICE_STARTER_CLUB`)

- [ ] **Test:** GROWTH plan checkout (if enabled)
  - [ ] Verify GROWTH plan checkout works

### Stripe Webhook
- [ ] **Test:** `customer.subscription.created` webhook
  - [ ] Trigger subscription creation
  - [ ] Verify webhook is received
  - [ ] Verify `CreatorAccount.billingPlan` is updated
  - [ ] Verify `monthlySmsLimit` is set correctly
  - [ ] Verify `stripeSubscriptionId` is saved
  - [ ] Verify `smsPeriodStart` is set

- [ ] **Test:** `customer.subscription.updated` webhook
  - [ ] Upgrade/downgrade subscription
  - [ ] Verify plan and limits are updated

- [ ] **Test:** `customer.subscription.deleted` webhook
  - [ ] Cancel subscription
  - [ ] Verify `billingPlan` is set to `FREE`
  - [ ] Verify `monthlySmsLimit` is set to `0`
  - [ ] Verify `stripeSubscriptionId` is cleared

### Billing Portal
- [ ] **Test:** Access Stripe Customer Portal
  - [ ] Click "Manage subscription"
  - [ ] Verify redirect to Stripe portal
  - [ ] Verify can cancel subscription
  - [ ] Verify can update payment method

### Usage Tracking
- [ ] **Test:** `/api/billing/usage` endpoint
  - [ ] Verify returns `smsUsed` and `smsLimit`
  - [ ] Verify `smsRemaining` is calculated correctly
  - [ ] Verify period reset date is correct

---

## 📥 8. CSV Import Features

### Dancer Customer Import
- [ ] **Test:** Import CSV with all fields
  - [ ] Verify header mapping works
  - [ ] Verify customers are created
  - [ ] Verify tier assignment works
  - [ ] Verify phone numbers are validated

- [ ] **Test:** Import CSV with missing fields
  - [ ] Verify graceful handling of missing data
  - [ ] Verify error messages are clear

### Club Patron Import
- [ ] **Test:** Import CSV with all fields
  - [ ] Verify patrons are created
  - [ ] Verify VIP status assignment works
  - [ ] Verify birthday parsing works

---

## 🎨 9. UI/UX Polish

### Quick Templates
- [ ] **Test:** Templates appear in onboarding Step 3
- [ ] **Test:** Templates appear in Dancer CRM broadcast card
- [ ] **Test:** Templates appear in Club CRM broadcast card
- [ ] **Test:** Clicking template fills message textarea
- [ ] **Test:** Templates are role-specific

### Onboarding Nudges
- [ ] **Test:** Nudge appears on Creator dashboard
- [ ] **Test:** Nudge appears on Dancer dashboard
- [ ] **Test:** Nudge appears on Club dashboard
- [ ] **Test:** Dismiss works (localStorage)
- [ ] **Test:** Stats are displayed correctly

### Success Recap
- [ ] **Test:** Recap appears after first campaign
- [ ] **Test:** Recap shows correct `toCount`
- [ ] **Test:** Recap shows correct channel
- [ ] **Test:** "Go to dashboard" button works

---

## 🔒 10. Security & Error Handling

### Authentication
- [ ] **Test:** Unauthorized access to protected routes
  - [ ] Verify redirect to signin
  - [ ] Verify error messages are not exposed

### API Security
- [ ] **Test:** API routes require authentication
- [ ] **Test:** User can only access their own data
- [ ] **Test:** `creatorAccountId` validation works

### Error Handling
- [ ] **Test:** SMS send failures are handled gracefully
- [ ] **Test:** Stripe webhook signature verification works
- [ ] **Test:** Database errors don't expose sensitive info
- [ ] **Test:** Invalid CSV imports show clear errors

---

## 📱 11. External Integrations

### Twilio SMS
- [ ] **Test:** SMS is sent successfully
- [ ] **Test:** Invalid phone numbers are handled
- [ ] **Test:** Twilio errors are logged

### Telegram
- [ ] **Test:** Telegram messages are sent successfully
- [ ] **Test:** Invalid chat IDs are handled

### Stripe
- [ ] **Test:** Stripe API calls work
- [ ] **Test:** Webhook signature verification works
- [ ] **Test:** Test mode is configured correctly

---

## 🧪 12. Edge Cases & Data Validation

### Empty States
- [ ] **Test:** Dashboard with no customers/patrons/fans
- [ ] **Test:** Empty state messages are clear

### Data Validation
- [ ] **Test:** Invalid email addresses are rejected
- [ ] **Test:** Invalid phone numbers are handled
- [ ] **Test:** CSV with invalid data is handled

### Multi-Role Edge Cases
- [ ] **Test:** User switches primary role
- [ ] **Test:** User adds new role after onboarding
- [ ] **Test:** User removes role

---

## 🚀 13. Production Readiness

### Performance
- [ ] **Test:** Page load times are acceptable (< 2s)
- [ ] **Test:** API responses are fast (< 500ms)
- [ ] **Test:** Database queries are optimized

### Monitoring
- [ ] **Test:** Error logging works
- [ ] **Test:** SMS send failures are logged
- [ ] **Test:** Webhook failures are logged

### Documentation
- [ ] **Test:** README is up to date
- [ ] **Test:** Environment variables are documented
- [ ] **Test:** API routes are documented

---

## ✅ Final Checklist Before Launch

- [ ] All critical tests passed
- [ ] All environment variables set for production
- [ ] Stripe webhook endpoint is publicly accessible
- [ ] Database backups are configured
- [ ] Error monitoring is set up
- [ ] SMS quota limits are correct
- [ ] Pricing is correct on landing page
- [ ] Terms of service / Privacy policy (if required)

---

## 🐛 Known Issues / Notes

_Add any issues found during testing here_

---

## 📝 Test Results Summary

**Total Tests:** ___  
**Passed:** ___  
**Failed:** ___  
**Blockers:** ___

**Ready for Production:** ☐ Yes  ☐ No

**Notes:**
_Add any additional notes or observations here_
