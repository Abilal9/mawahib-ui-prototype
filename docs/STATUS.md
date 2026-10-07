# Frontend status

**Last reviewed:** 2026-10-07

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

## Profile (own + visitor)

**Status:** Edit Profile + About + cover completion for Nest persistence (2026-09-02).

**Implemented now**

- Edit Profile is a **local draft** until **Save** (display name, title, location, avatar, cover). Cancel/Discard leaves DB unchanged.
- Avatar: change/remove; remove → `avatarUrl: null` → Mawahib default avatar UI.
- Cover: `MediaPurpose.cover` → Nest upload → `coverUrl`; reposition/crop before confirm; remove → pink header fallback (no fake pink image file).
- About (languages / education / experience / certifications) persists via `PATCH /users/me` → `Profile.aboutJson`.
- Ratings follow Nest `ratingAvg` / `ratingCount`. Zero reviews → “No reviews yet”.
- Profile Reviews list engagement reviews and up to 4 images, opened in-app.
- Connections identity: display name + optional title (no user-facing `@username`).
- Public visitor DTO: cover/avatar/About allowed; no email/phone/verification leakage.
- Visitor profile refreshes on focus for latest public fields.

**Not shipped**

- Aggressive old-media GC after avatar/cover replace (lifecycle deferred).

## Data paths

| Domain | Source today |
|--------|----------------|
| Auth / session / `/users/me` | Nest + Supabase Auth |
| Profile / portfolio / services / About / cover | Nest |
| Explore (talents / businesses / services) | Nest |
| Jobs / work requests / engagements / reviews | Nest. Selection does not create an engagement. Acceptance does. |
| Payments / invoices | Nest mock provider. Card data never leaves the device as PAN/CVV. Amount is the engagement total. |
| Media uploads | Nest upload-sessions + Supabase Storage. Domain rows are Nest-owned. |
| Messaging / connections / notifications | Nest |
| **Home Feed / Posts / Comments / Likes / Saves** | **Nest-backed** (`PostsContext` → `postService` → `postsApi` → `/feed`, `/posts`, likes list, comments). Hybrid self/connection/discovery. **Posts max 4 images** (`MAX_POST_IMAGES`) — Post-specific only; Portfolio/Services/Messages keep their own limits. Comment Report UI is deferred (no report API). |
| Social notifications | Nest `post_liked` / `post_commented` mapped in Notifications UI; Expo tap-nav E2E pending |
| Stories | Deferred — Home Stories row **hidden** (style stub only; not rendered) |

Local Nest expects `NODE_ENV=development`, `PAYMENT_PROVIDER=mock`, and
`ENABLE_DEV_START_WORK=false`. `npm run start:local` talks to
`http://localhost:3000/api/v1`. Railway is an optional hosted target, not a
requirement for local development.

Commercial behavior on the client:

- Service requests send the package tier and add-on ids. They do not send a price.
- Past calendar days are disabled. There is no time-of-day field.
- A saved Google Maps URL opens unchanged when it is an approved HTTPS Maps host.
- Images and iOS PDFs open in-app. Android PDFs, including invoices, open the signed URL externally.
- A payment that is still `pending` or `processing` is polled with the same idempotency key.

Money display helpers: `src/utils/money.ts`. Commercial rules live in the backend:

- `mawahib-backend/docs/COMMERCIAL_MODEL.md`
- `mawahib-backend/docs/MARKETPLACE_CANONICAL_FLOW.md`
- `mawahib-backend/docs/MARKETPLACE_WORK_REQUESTS.md`

## Main tabs (current)

Home · Explore · Create · Messages · Jobs

Profile is opened from the header/sidebar stack, not as a main tab.

## Next FE work (aligned with backend roadmap)

1. Manual Expo multi-user Profile E2E (edit/save/cancel, cover crop, visitor)
2. Explore / Jobs / Marketplace polish
3. Full Reviews product (still deferred)
4. Stories (product decision still deferred)
5. Search polish / Explore ranking
6. Block / mute / report (**comment report UI** shipped deferred like Jobs; persistence/moderation still deferred)
7. Notification polish (grouping / push)

See `mawahib-backend/docs/ROADMAP.md`. Auth remains frozen; keep marketplace/messaging contracts untouched unless product requires a deliberate change.
