# Mawahib frontend → Nest API environments

All Nest HTTP calls go through `src/lib/apiClient.ts` → `appEnv.apiBaseUrl` from
`src/config/env.ts`.

## How backend selection works

1. `npm run start:local` / `start:railway` set **`EXPO_PUBLIC_API_URL`** (and
   `MAWAHIB_API_TARGET`) in the shell.
2. Expo CLI loads `.env*` for Supabase keys but **does not overwrite** shell
   values already set (`@expo/env`).
3. **`app.config.js`** (Node) reads `EXPO_PUBLIC_API_URL` and writes
   `expo.extra.apiBaseUrl`.
4. The app reads **`Constants.expoConfig.extra.apiBaseUrl`** — not the Metro
   client dotenv merge.

That avoids Expo’s client `expo/virtual/env` bug: it merges
`.env` → `.env.development` → `.env.local` **on top of** `process.env`, so a
localhost value in `.env.development` used to override `start:railway`.

| Script | API base URL |
|--------|----------------|
| `npm run start:local` (or `npm start`) | `http://localhost:3000/api/v1` |
| `npm run start:railway` | `https://mawahib-backend-production.up.railway.app/api/v1` |

## Env files

| File | Tracked? | Purpose |
|------|----------|---------|
| `.env` | No | Supabase publishable URL/key (and other local secrets) |
| `.env.example` | Yes | Template — no Nest URL switching |
| `.env.development` | Yes | Dev notes only — **no** `EXPO_PUBLIC_API_URL` |
| `.env.production` | Yes | Default Railway URL for production/EAS builds |
| `.env.local` | No | **Not required** for Local ↔ Railway switching |

Do **not** put `EXPO_PUBLIC_API_URL` in `.env` / `.env.development` / `.env.local`
just to switch backends. Use the npm scripts.

## A. Run against local Nest

```bash
# Nest on :3000
npm run start:local
```

## B. Run against Railway

```bash
npm run start:railway
```

Confirm requests hit `mawahib-backend-production.up.railway.app` (network
inspector). No `.env.local` create/delete needed.

After changing Supabase keys in `.env`, restart with cache clear if needed:

```bash
npx expo start -c
```

## C. Production / release build

`.env.production` supplies Railway when `EXPO_PUBLIC_API_URL` is unset. Also set
Supabase `EXPO_PUBLIC_*` via EAS secrets / CI. Never ship server secrets.

## Staging later

Add e.g. `start:staging` that sets `EXPO_PUBLIC_API_URL` to the staging Nest URL.
No `apiClient` / screen changes.

## Smoke checklist (hosted)

- [ ] Health `…/api/v1/health` → ok / connected / configured  
- [ ] Login → bootstrap → `/users/me`  
- [ ] Profile / explore / jobs / work requests  
- [ ] Media upload-sessions (Nest) + Supabase Storage  
