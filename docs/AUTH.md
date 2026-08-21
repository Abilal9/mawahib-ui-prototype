# Authentication

Primary frontend Auth behavior reference for Mawahib. Architecture is frozen; product Auth UI that is not implemented must not be described as available.

```text
React Native / Expo
  → Supabase Auth (identity, email OTP, sessions)
  → NestJS JWT (JWKS)
  → GET /users/me | POST /auth/bootstrap
  → Prisma → PostgreSQL
```

- **Supabase** owns credentials, email OTP delivery, sessions, and Auth identity.
- **Nest** owns the Mawahib user/profile and authorization.
- Do **not** build a custom OTP, email, or SMS system.

---

## Canonical signup (email OTP — required)

```text
Create Account (email + password + phone E.164 + location)
  → supabase.auth.signUp (no emailRedirectTo on happy path)
  → outcome (see below)
  → if otp_sent: ConfirmCode → verifyOtp({ type: 'email' })
  → Supabase session
  → GET /users/me → POST /auth/bootstrap if 404
  → resolvePostAuthDestination
  → optional phone step (Skip allowed) → TurnOnNotifications / MainTabs
```

### Signup outcomes

| Status | Meaning | UI |
|--------|---------|----|
| `otp_sent` | Fresh signup; confirmation OTP email was requested successfully | ConfirmCode |
| `session_ready` | Session returned immediately (e.g. auto-confirm); Nest hydrate succeeded | `resolvePostAuthDestination({ flow: 'verify' })` |
| `already_verified` | Supabase anti-enumeration / empty `identities` — **no** OTP claimed | Login / Change Email recovery |
| `ambiguous` | Email already registered signal — **no** OTP claimed | Login / Continue Verification / Change Email |

ConfirmCode is opened only when an OTP was actually requested (`otp_sent`), or when a later **successful** resend stamps pending verification.

Browser confirmation links are **not** the primary signup path. `AuthDeepLinkListener` still handles inbound `mawahib://` / Expo auth URLs if they arrive (legacy templates, future recovery). Those paths must still hydrate Nest and pass `resolvePostAuthDestination` — never bypass into MainTabs.

---

## OTP delivery honesty / resume

Non-sensitive pending context may be stored locally (`email`, `phoneE164`, account type, location — **never** passwords or OTP tokens).

| Rule | Behavior |
|------|----------|
| When is `lastOtpRequestedAt` set? | **Only** after a successful signup confirmation send or successful `resend({ type: 'signup' })` |
| `email_not_confirmed` on password sign-in | Does **not** stamp `lastOtpRequestedAt` (no OTP was sent by that failure) |
| `hasResumablePendingVerification` | True only if the same email has a recent successful `lastOtpRequestedAt` (not bare `createdAt`) |
| Rate-limited / failed resend | Do **not** fake “code sent”; may still open ConfirmCode only if a legitimate recent stamp already exists |

Abandoned signup: app restart may resume ConfirmCode when a successful send was recorded; otherwise offer truthful resend first.

---

## Email verification recovery

| Situation | Behavior |
|-----------|----------|
| Unverified user signs in | Alert → **Resend code**; on success → ConfirmCode; on failure/rate-limit → truthful error (reuse ConfirmCode only if resumable pending exists) |
| Re-signup with verified duplicate | `already_verified` → Login / Change Email (**no** fake OTP) |
| Re-signup with ambiguous / existing email | `ambiguous` → Login / Continue Verification / Change Email (**no** fake OTP unless Continue Verification resends successfully) |
| ConfirmCode edit email (pink pencil) | Clears pending; returns to SignUp with draft preserved |
| Invalid / expired OTP | Generic invalid/expired message; resend when cooldown allows |

Email verification is **required** before MainTabs. Phone verification is optional.

---

## Sign-in (verified)

```text
signInWithPassword
  → Supabase session
  → hydrate Nest (/users/me or bootstrap)
  → resolvePostAuthDestination({ flow: 'signin' })
  → MainTabs when email verified + Nest user present
```

`isSignedIn` for the app is true only when Nest `apiUser` is hydrated. A Supabase session alone is not enough to enter MainTabs.

---

## Backend unavailable (Supabase OK, Nest down)

If OTP or sign-in succeeds and a Supabase session exists, but `/users/me` or `/auth/bootstrap` fails (network, Nest down, temporary 5xx):

- This is **not** an OTP failure.
- Supabase session is **kept** (except HTTP 401, which signs out).
- Nest identity is cleared (`apiUser = null`); app `isSignedIn` stays false.
- **MainTabs stays blocked** until Nest hydrate succeeds.
- Sign-in can show a truthful banner and **Retry profile load** (`bootstrapSession`).

Concurrent hydrate/bootstrap calls coalesce: later signup overrides (account type, phone, location, etc.) merge into the in-flight work so required bootstrap metadata is not silently dropped.

---

## Identity binding (Nest)

| Field | Rule |
|-------|------|
| Canonical email | From trusted Supabase Auth / JWT — client cannot redefine authenticated email to another address |
| `email_verified` | Synced from Supabase Auth admin (`email_confirmed_at`) |
| `phone_e164` | Client-supplied, validated E.164 |
| `phone_verified` | Synced from Auth **only when** Auth’s confirmed phone **exactly equals** Nest `phone_e164` |
| Phone change | Clears Nest `phone_verified` until the new number is confirmed in Auth |

Clients must not send forgeable `emailVerified` / `phoneVerified` on bootstrap or `PATCH /users/me`.

`accountType` (`talent` | `business`) is chosen on Join Mawahib / signup and sent at bootstrap. Nest stores it on create and does **not** change it on re-bootstrap.

---

## Phone number picker (signup)

The signup phone country selector supports **only**:

| Country | Flag | Dial code |
|---------|------|-----------|
| Saudi Arabia | 🇸🇦 | +966 |
| United Arab Emirates | 🇦🇪 | +971 |

Other countries were intentionally removed for MVP. National rules remain: Saudi / UAE mobile `5XXXXXXXX` (9 digits) → E.164 `+9665…` / `+9715…`.

---

## Default avatar

New profiles start with `avatarUrl = null` (Nest). The app does **not** upload or store a default image per user.

Frontend `UserAvatar`:

- null / empty / failed image load → circular Mawahib pink background **`#F6339A`** + white person silhouette
- a real uploaded URL replaces the fallback

---

## MainTabsGate

`MainTabsGate` (root navigator) renders MainTabs only when **all** are true:

1. Supabase session present (via AuthContext)
2. Nest `apiUser` hydrated (`isSignedIn` for the app requires Nest user)
3. `emailVerified === true` on the Nest user

Otherwise the user is redirected to SignIn / ConfirmCode via `resolvePostAuthDestination` — never into MainTabs with an unverified or Nest-missing identity.

---

## Post-auth gate

All Auth success paths use `resolvePostAuthDestination` (`src/lib/postAuthGate.ts`):

1. Email not verified → ConfirmCode  
2. Fresh verify / deep-link (`flow: 'verify' | 'deeplink'`) + phone present but unverified → VerifyAccount (Skip allowed)  
3. Otherwise fresh verify → TurnOnNotifications  
4. Sign-in / session restore with verified email + Nest user → MainTabs  

Covered paths: OTP verify, deep-link session, password sign-in, splash restore, signup `session_ready`.

---

## Phone OTP (optional, feature-flagged — currently OFF)

```text
Authenticated + email-verified user
  → updateUser({ phone })
  → SMS OTP (requires Supabase phone provider)
  → verifyOtp({ type: 'phone_change' })
  → Nest syncs phone_verified only when phones match
```

- Same Supabase user (no second Auth identity).
- Enable only with `EXPO_PUBLIC_PHONE_AUTH_ENABLED=true` after SMS works.
- Skipping phone does **not** block entering Mawahib.
- Architecture is secured for identity binding even while the feature flag is off.

---

## What is NOT available in the app UI

| Control / flow | Status |
|----------------|--------|
| Forgot password / password reset | **Not implemented.** Control is **hidden**. Supabase can support recovery emails later; there is no in-app reset screen or Forgot Password CTA today. |
| Social / OAuth (Google, Apple, Facebook) | **Not implemented.** Buttons are **hidden**. Do not document as available. |
| Phone SMS OTP in production | **Disabled** until provider + flag (see above). |

Do not ship dead or placeholder Auth controls.

---

## Known deferred (not fixed)

| Item | Current | Future |
|------|---------|--------|
| Visitor profile privacy | Some Nest user DTO responses (e.g. `GET /users/:userId`) may include email / phone | Separate private vs public profile DTOs |
| Avatar URL hardening | `avatarUrl` accepts validated URL strings | Restrict to approved Storage / media pipeline sources |

Do **not** treat these as completed.

---

## Auth validation record (MVP freeze)

**Implemented / code-validated**

- OTP honesty (`lastOtpRequestedAt` only after real send/resend)
- Duplicate email handling (`already_verified` / `ambiguous`)
- Supabase ↔ Nest identity binding (F2/F3)
- Session handling + Nest hydrate coalesce (F4)
- Nest-down after Supabase success (F5)
- Deep-link gate (F6)
- MainTabsGate + `resolvePostAuthDestination`
- FE: `tsc`, `scripts/auth-selftest.mjs`, `scripts/avatar-selftest.mjs`
- BE: Nest unit tests for bootstrap / F2 / F3

**Developer manually tested (B1–B18 family)**

- Talent and Business signup
- Email OTP delivery / verify / resend
- Abandoned signup resume
- Unverified login recovery
- Logout / restart / session restore
- Nest unavailable + retry paths (as exercised in local Auth work)

**Not independently re-run in the freeze audit session**

- Railway deployment end-to-end
- External Resend inbox delivery from a fresh auditor run
- Physical device testing

---

## Resend / expiry

- ConfirmCode: cooldown (`Resend code in MM:SS` → `Resend code`).
- Successful resend stamps `lastOtpRequestedAt`.
- Provider rate limits surface as user-facing errors (no insecure bypass).
- Expired / invalid OTP: clear feedback; user can resend when cooldown allows.

---

## Local vs Railway

| Concern | Depends on |
|---------|------------|
| Email OTP send / verify | Expo ↔ Supabase only |
| Nest bootstrap / `/users/me` | Nest API (`start:local` or `start:railway`) |

Email OTP must **never** require Railway.

Physical device + local Nest: phone `localhost` is not your Mac — use LAN IP or tunnel in `EXPO_PUBLIC_API_URL`. Prefer `npm run start:local` for Mac simulators. For hosted Nest validation use `npm run start:railway` (see [`API_ENV.md`](./API_ENV.md)).

---

## Env

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_API_URL=...          # Nest — not used for OTP itself
EXPO_PUBLIC_PHONE_AUTH_ENABLED=false
```

---

## Supabase Dashboard — manual steps (required for OTP emails)

### 1) URL Configuration

**Authentication → URL Configuration**

- **Site URL**: app / marketing URL — **not** Nest `http://localhost:3000`
- **Redirect URLs** (fallback / deep link only):

```text
mawahib://auth/callback
mawahib://**
exp://**
```

### 2) Confirm signup template → OTP token

**Authentication → Email Templates → Confirm signup**

- **Subject (recommended):** `Your Mawahib verification code`
- **Body (minimal):**

```html
<h2>Confirm your email</h2>
<p>Your Mawahib verification code is:</p>
<p style="font-size:24px;letter-spacing:4px;"><strong>{{ .Token }}</strong></p>
<p>Enter this code in the app. This code expires soon.</p>
```

Do **not** rely on `{{ .ConfirmationURL }}` for the primary signup experience.

Also check **Authentication → Providers → Email** / OTP expiry settings (default ~1 hour is typical).

### 3) Password policy

Align with app rules: min 8, upper, lower, digit, symbol.

### 4) Phone / SMS (when enabling optional phone OTP)

**Authentication → Providers → Phone**

Recommended MVP: **Twilio**

1. Twilio Account SID + Auth Token (server-side / Supabase dashboard only — never in Expo env)
2. Messaging Service SID or From number
3. Enable Phone provider in Supabase
4. Test E.164 (`+9665…`, UAE mobiles)
5. Set `EXPO_PUBLIC_PHONE_AUTH_ENABLED=true`

### 5) Custom SMTP (before external Beta / Production)

Default Supabase email is fine for local Auth work. Before Beta/Production, configure Custom SMTP with a branded sender such as `Mawahib <no-reply@…>`.

Password-recovery and OAuth provider dashboard setup are **out of scope** until those product flows are implemented.

---

## SDK note (`verifyOtp`)

Installed `@supabase/supabase-js` (auth-js ~2.112):

- **Verify signup email OTP:** `type: 'email'`
- **Resend signup email:** `resend({ type: 'signup' })`

---

## Related

- Frontend status pointer: [`STATUS.md`](./STATUS.md)
- Seed / pre-confirmed users: `mawahib-backend/docs/DEV_SEED.md`
- Architecture overview: `mawahib-backend/docs/ARCHITECTURE.md`
