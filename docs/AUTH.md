# Authentication configuration (Phase 1 + auth cleanup)

## Architecture

React Native → Supabase Auth → JWT → NestJS (`/auth/bootstrap`, `/users/me`)

## Verification UX (chosen)

**Email OTP (6-digit code)** — matches `ConfirmCodeScreen`.

Confirm signup emails must contain `{{ .Token }}`, not only a confirmation link.

Deep-link handling still exists for recovery / legacy confirmation links so errors surface in the app instead of Nest `Cannot GET /`.

## Supabase Dashboard — required manual steps

### 1) URL Configuration

Path: **Authentication → URL Configuration**

**Site URL**

- Keep a **web** Site URL (do **not** set this to the Nest API root as the product homepage).
- For local mobile development you may leave a placeholder such as `http://localhost:8081` (Expo web) or your future marketing site.
- Do **not** rely on `http://localhost:3000` (Nest) as Site URL — that caused confirmation links to open the API and show `Cannot GET /`.

**Redirect URLs** — add all of:

```text
mawahib://auth/callback
mawahib://**
exp://**
```

If you use Expo Go on a LAN IP, also add the concrete exp URL Expo prints, e.g.:

```text
exp://192.168.x.x:8081/--/auth/callback
```

(`**` wildcards are allowed in Supabase redirect allow-lists.)

### 2) Confirm signup email template → OTP

Path: **Authentication → Email Templates → Confirm signup**

Replace link-only body with a code-first template, for example:

```html
<h2>Confirm your Mawahib account</h2>
<p>Enter this 6-digit code in the app:</p>
<p style="font-size:24px;letter-spacing:4px;"><strong>{{ .Token }}</strong></p>
<p>If you prefer a link, you can also use: <a href="{{ .ConfirmationURL }}">Confirm email</a></p>
```

Prefer **Token-first**. The app’s primary path is OTP entry.

### 3) Password policy (must be ≥ frontend)

Path: **Authentication → Providers → Email** (or **Authentication → Password** / security section)

Set:

- Minimum password length: **8**
- Required characters: **lowercase, uppercase, digits, symbols**
- Enable **Leaked password protection** if your plan allows (Pro+)

Frontend rules are UX only; Supabase must enforce the same or stricter.

### 4) Phone / SMS (optional later)

Path: **Authentication → Providers → Phone**

Recommended provider for MENA + reliability: **Twilio** (or Twilio Verify).

You will need:

- Twilio Account SID
- Twilio Auth Token
- Twilio phone number (or Messaging Service SID)
- Enable Phone provider in Supabase
- Test with E.164 numbers (`+9665…`)

Do not enable production SMS until credentials are configured. App methods `sendPhoneOtp` / `verifyPhoneOtp` are ready and will return a friendly error until then.

## Account linking (email + phone)

Same Supabase `auth.users.id` → Nest `users.id`.

If a user signs up with email and later adds phone (or vice versa), use Supabase **identity linking** (documented later). Do **not** create a second Nest row. Linking is a dedicated follow-up flow; Phase auth cleanup only prepares phone OTP APIs.

## App deep link

- Scheme: `mawahib`
- Callback path: `auth/callback`
- Handler: `AuthDeepLinkListener` inside `NavigationContainer`
