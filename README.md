# Mawahib Prototype

React Native (Expo) mobile app for **Mawahib** — a creative talent marketplace for the MENA region.

## Stack

- **Expo SDK 57** + **React Native 0.86**
- **TypeScript**
- **React Navigation** (native stack + custom bottom tabs)
- **Expo Image**, **Inter** font, **Ionicons**
- **Supabase Auth** (client) + **NestJS** API for domain data

## Getting started

```bash
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_* in .env

npm install
npm run start:local     # preferred for development (local Nest)
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

`npm start` also targets local Nest. Prefer the explicit scripts below.

### Nest API (local vs Railway)

```bash
npm run start:local     # http://localhost:3000/api/v1
npm run start:railway   # Railway hosted API
```

Switching is automatic via the npm script — do not put `EXPO_PUBLIC_API_URL` in `.env` / `.env.development` to switch backends. Details: [`docs/API_ENV.md`](docs/API_ENV.md). After changing Supabase keys: `npx expo start -c`.

## Status

Live vs mock domains: [`docs/STATUS.md`](docs/STATUS.md).

Auth configuration: [`docs/AUTH.md`](docs/AUTH.md).

Backend canonical docs (money, marketplace):

- `mawahib-backend/docs/COMMERCIAL_MODEL.md`
- `mawahib-backend/docs/MARKETPLACE_CANONICAL_FLOW.md`
- `mawahib-backend/docs/ROADMAP.md`

## Project structure

```
src/
  theme/          # Colors, spacing, typography (Figma tokens)
  components/     # Reusable UI
  screens/        # App screens
  navigation/     # Root stack + main tab navigator
  context/        # Auth, profile, posts, jobs, messaging, …
  config/         # Env / apiBaseUrl
  lib/            # apiClient, supabase client
  services/       # Nest *Api clients + remaining local services
  repositories/   # Mock repos for domains not yet on Nest (e.g. posts)
  data/
    mock/         # Seed / leftover mock data
    types/        # Shared TypeScript interfaces
  utils/          # money, location, image helpers
```

## App flows

| Flow | Screens |
|------|---------|
| Onboarding | Splash → Welcome → Sign Up → Confirm Code → Profile Setup → Notifications |
| Main tabs | Home · Explore · Create · Messages · Jobs |
| Stack | Profile, settings, marketplace detail, messaging, post detail, … |

## Design

Brand colors from Figma:

- Primary: `#E60076`
- Background: `#F7F9FB`
- Text: `#0E243A`

## Backend integration

Most product domains call Nest via `src/services/*Api.ts` and contexts. **Posts / Home Feed** still use the mock post repository until the Posts module ships. Do not treat “all services are mocks” as current reality — see [`docs/STATUS.md`](docs/STATUS.md).

## License

MIT
