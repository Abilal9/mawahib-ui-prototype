# Frontend status

**Last reviewed:** 2026-08-19

## Env / API target

| Script | API |
|--------|-----|
| `npm run start:local` | `http://localhost:3000/api/v1` |
| `npm run start:railway` | Railway production Nest |

Details: [`API_ENV.md`](./API_ENV.md). Auth dashboard steps: [`AUTH.md`](./AUTH.md).

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

See `mawahib-backend/docs/ROADMAP.md`. Immediate: replace mock posts/feed with Nest once Posts APIs exist; keep marketplace/messaging untouched.
