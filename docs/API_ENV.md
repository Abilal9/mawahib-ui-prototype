# Mawahib frontend → Nest API environments

All Nest HTTP calls go through `src/lib/apiClient.ts` → `appEnv.apiBaseUrl` from
`src/config/env.ts`, which reads **`EXPO_PUBLIC_API_URL`** (must include `/api/v1`,
no trailing slash).

| Mode | API base URL |
|------|----------------|
| Local Nest | `http://localhost:3000/api/v1` |
| Railway (hosted) | `https://mawahib-backend-production.up.railway.app/api/v1` |

Supabase Auth stays on Supabase (`EXPO_PUBLIC_SUPABASE_*`). Only Nest routes use
`EXPO_PUBLIC_API_URL`. Storage uploads still use Supabase Storage after Nest
`/media/upload-sessions`.

## A. Run against local backend

1. Start Nest locally on port 3000.
2. Ensure `.env` has Supabase publishable URL/key (from `.env.example`).
3. Start Expo:

```bash
npm run start:local
# or: npm start   (uses .env.development → localhost)
```

4. If you changed env vars, clear cache:

```bash
npx expo start -c
```

## B. Run against Railway (dev client / Expo Go)

1. Railway health should be OK:  
   `https://mawahib-backend-production.up.railway.app/api/v1/health`
2. Start Expo with the hosted API:

```bash
npm run start:railway
```

3. Confirm in Metro logs / React Native network inspector that requests go to  
   `mawahib-backend-production.up.railway.app`, not `localhost:3000`.

## C. Production / release build against Railway

`.env.production` sets `EXPO_PUBLIC_API_URL` to the Railway base. Production
Expo/EAS builds load that file when the build mode is `production`.

Also configure Supabase public vars for the build (EAS secrets or CI env):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do **not** inject `SUPABASE_SECRET_KEY` or `DATABASE_URL` into the app.

## Switching later (staging)

Add another env file or npm script (e.g. `start:staging`) that sets
`EXPO_PUBLIC_API_URL` to a staging Nest URL. No `apiClient` / screen changes needed.

## Smoke checklist (hosted)

- [ ] `GET …/api/v1/health` → `ok` / connected / configured  
- [ ] Login (Supabase) → `POST /auth/bootstrap` → `GET /users/me`  
- [ ] Profile / visitor profile  
- [ ] Portfolio / services / explore  
- [ ] Jobs / work requests / negotiation  
- [ ] `POST /media/upload-sessions` (Nest), then Storage upload to Supabase  
