# Frontend status

**Last reviewed:** 2026-09-02

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
- Ratings: no fake `?? 5` / `?? 106`; zero reviews → “No reviews yet” / hide compact rating chips.
- Seeded user/service `ratingAvg`/`ratingCount` values were reset to **0** (not backed by `EngagementReview`). Live aggregation remains deferred with Reviews.
- Reviews screen: honest deferred/empty state (no mock review people). Full Reviews product remains deferred.
- Connections identity: display name + optional title (no user-facing `@username`).
- Public visitor DTO: cover/avatar/About allowed; no email/phone/verification leakage.
- Visitor profile refreshes on focus for latest public fields.

**Not shipped**

- Full Reviews product / live aggregation UI beyond raw `ratingAvg`/`ratingCount` when present.
- Aggressive old-media GC after avatar/cover replace (lifecycle deferred).

## Data paths

| Domain | Source today |
|--------|----------------|
| Auth / session / `/users/me` | Nest + Supabase Auth |
| Profile / portfolio / services / About / cover | Nest |
| Explore (talents / businesses / services) | Nest |
| Jobs inbox / work requests / listings | Nest |
| Messaging / connections / notifications | Nest |
| Media uploads | Nest upload-sessions + Supabase Storage (`avatars`, `covers`, …) |
| **Home Feed / Posts / Comments / Likes / Saves** | **Nest-backed** (`PostsContext` → `postService` → `postsApi` → `/feed`, `/posts`, likes list, comments). Hybrid self/connection/discovery. **Posts max 4 images** (`MAX_POST_IMAGES`) — Post-specific only; Portfolio/Services/Messages keep their own limits. Comment Report UI is deferred (no report API). |
| Social notifications | Nest `post_liked` / `post_commented` mapped in Notifications UI; Expo tap-nav E2E pending |
| Stories | Deferred — Home Stories row **hidden** (style stub only; not rendered) |
| Payments UI shells | Placeholder; no Nest payments |

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
