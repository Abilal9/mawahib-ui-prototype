# Authentication configuration (Phase 1 + email/phone signup)

## OTP / email / SMS delivery — deferred

Full **email OTP delivery**, **SMTP**, **phone OTP/SMS provider (Twilio)**, and production verification hardening are **intentionally deferred**.

Development can use:

- Normal signup UI (phone + email collection + validation)
- `npm run seed:dev` for pre-confirmed test users (run in **`mawahib-backend`**; see `mawahib-backend/docs/DEV_SEED.md`)

Return later to:

1. Confirm signup email template + SMTP
2. Supabase Phone Auth + Twilio
3. `EXPO_PUBLIC_PHONE_AUTH_ENABLED=true`
4. Production auth hardening

Do not treat seed users as a substitute for production verification.

## Architecture

React Native → Supabase Auth → JWT → NestJS (`/auth/bootstrap`, `/users/me`) → Prisma `users` + `profiles`

Every new Mawahib account stores **email + phone (E.164)** on the same Supabase user and the same Nest profile. Do not create a second auth user for phone.

## Signup fields

- First name, last name (optional) → `displayName`
- Email → Supabase Auth + `users.email`
- Phone → country picker + validation → `profiles.phone_e164` (E.164, unique)
- Password / confirm → live rules (8+, upper, lower, number, special)

Flow: **SignUp → VerifyAccount → ConfirmCode (email) → onboarding**

## Verification

Independent flags on `profiles`:

| Flag | Meaning | Required to enter app |
|------|---------|------------------------|
| `email_verified` | Synced from Supabase `email_confirmed_at` | **Yes** |
| `phone_verified` | Synced from Supabase `phone_confirmed_at` / phone_change OTP | No (until product requires it) |

`VerifyAccount` screen:

- **Email** — always active (Supabase email OTP)
- **Phone** — inactive until `EXPO_PUBLIC_PHONE_AUTH_ENABLED=true` *and* SMS provider configured; copy: “Available once SMS verification is enabled”

Phone OTP uses `updateUser({ phone })` + `verifyOtp({ type: 'phone_change' })` so the phone attaches to the **existing** email user (no duplicate).

## Phone storage

- UI: country dial code + national number (`libphonenumber-js`)
- API / DB: **E.164** (`+9665xxxxxxx`)
- Unique index on `profiles.phone_e164` (duplicates rejected on bootstrap / update)

## Env

```text
EXPO_PUBLIC_PHONE_AUTH_ENABLED=false
```

Set to `true` only after Supabase Phone Auth + SMS provider work in the dashboard.

## Supabase Dashboard — required manual steps

### 1) URL Configuration

Path: **Authentication → URL Configuration**

**Site URL** — web Site URL (not Nest `http://localhost:3000`).

**Redirect URLs:**

```text
mawahib://auth/callback
mawahib://**
exp://**
```

### 2) Confirm signup email template → OTP

Path: **Authentication → Email Templates → Confirm signup**

Include `{{ .Token }}` (6-digit). App primary path is OTP on `ConfirmCode`.

### 3) Password policy (≥ frontend)

- Min length 8
- Lower, upper, digits, symbols
- Leaked password protection if plan allows

### 4) Phone / SMS (when ready)

Path: **Authentication → Providers → Phone**

**Recommended provider for Saudi Arabia, GCC, and international growth: Twilio** (or Twilio Verify).

Why Twilio:

- Strong coverage and delivery in KSA / GCC
- Native Supabase Phone Auth integration
- Scales to EU/US without swapping architecture
- Messaging Service SID supports multi-region sender IDs later

Steps:

1. Create Twilio account + Messaging Service (or number)
2. Enter Account SID, Auth Token, and Messaging Service SID / phone in Supabase Phone provider
3. Enable Phone provider
4. Test with E.164 (`+9665…`)
5. Set `EXPO_PUBLIC_PHONE_AUTH_ENABLED=true` in the app
6. No Nest/Prisma redesign required — phone row + `phone_verified` already exist

Do **not** ship fake SMS. Until the provider is live, the Phone option stays gracefully disabled.

## Account linking

Same `auth.users.id` → Nest `users.id`. Email and phone always belong to one profile. Further identity-linking UX (add phone after signup when SMS is on) is already prepared via `sendPhoneOtp` / `verifyPhoneOtp`.

## App deep link

- Scheme: `mawahib`
- Callback: `auth/callback`
- Handler: `AuthDeepLinkListener`
