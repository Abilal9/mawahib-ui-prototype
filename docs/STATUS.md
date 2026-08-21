# Frontend status

**Last reviewed:** 2026-08-21

## Env / API target

| Script | API |
|--------|-----|
| `npm run start:local` | `http://localhost:3000/api/v1` |
| `npm run start:railway` | Railway production Nest |

Details: [`API_ENV.md`](./API_ENV.md). Auth (email OTP canonical): [`AUTH.md`](./AUTH.md).

## Auth

Canonical behavior: [`AUTH.md`](./AUTH.md).

**Status:** Auth stabilization is **complete / frozen** for this MVP stage (OTP-first email verification, F1–F6 integrity fixes, Supabase ↔ Nest identity binding, JWT/JWKS, MainTabsGate, session restore, Nest-down handling). Do not redesign the Auth contract casually.

**Implemented now**

- Email OTP signup (`ConfirmCode` + `verifyOtp({ type: 'email' })`); ConfirmCode only after a real OTP send/resend.
- Unverified sign-in recovery via legitimate resend (no fake `lastOtpRequestedAt` on `email_not_confirmed`).
- Post-auth navigation via `resolvePostAuthDestination` (OTP, deep link, sign-in, restore, signup `session_ready`).
- `MainTabsGate`: Supabase session + Nest `apiUser` + `emailVerified`.
- Nest owns verification flags; trusted Auth email; `phone_verified` only when Auth phone matches Nest phone.
- Nest-down after Supabase success: session kept, MainTabs blocked, retry on Sign-in.
- Signup phone picker: **Saudi Arabia (+966)** and **UAE (+971)** only.
- Default avatar: `avatarUrl` null → FE pink `#F6339A` silhouette (no stored default file).
- Auth/onboarding logo header consistency; sticky signup header; non-scroll Login; account-type card size stability.

**Not in the app UI yet**

- Forgot password / password reset (control hidden).
- Social / OAuth login (controls hidden).
- Phone SMS OTP (feature-flagged off until provider is configured).

## Data paths

| Domain | Source today |
|--------|----------------|
| Auth / session / `/users/me` | Nest + Supabase Auth |
| Profile / portfolio / services | Nest |
| Explore (talents / businesses / services) | Nest |
| Jobs inbox / work requests / listings | Nest |
| Messaging / connections / notifications | Nest |
| Media uploads | Nest upload-sessions + Supabase Storage |
| **Home Feed / Posts / Comments** | **Mock** (`PostsContext` → `postService` → `mockPostRepository`) |
| Stories | Stubbed empty (`catalogService.listStories()` → `[]`) |
| Payments UI shells | Placeholder; no Nest payments |

Money display helpers: `src/utils/money.ts`. Commercial rules live in the backend:

- `mawahib-backend/docs/COMMERCIAL_MODEL.md`
- `mawahib-backend/docs/MARKETPLACE_CANONICAL_FLOW.md`
- `mawahib-backend/docs/MARKETPLACE_WORK_REQUESTS.md`

## Main tabs (current)

Home · Explore · Create · Messages · Jobs

Profile is opened from the header/sidebar stack, not as a main tab.

## Next FE work (aligned with backend roadmap)

1. Home Feed / Posts (replace mock)
2. Profile completion / visitor polish
3. Explore / Jobs / Marketplace polish

See `mawahib-backend/docs/ROADMAP.md`. Auth remains frozen; keep marketplace/messaging contracts untouched unless product requires a deliberate change.
