# Mawahib Prototype

React Native (Expo) mobile app prototype for **Mawahib** — a creative talent platform for the MENA region. Built from the Figma final design with static mock data; structured for backend integration later.

## Stack

- **Expo SDK 57** + **React Native 0.86**
- **TypeScript**
- **React Navigation** (native stack + custom bottom tabs)
- **Expo Image**, **Inter** font, **Ionicons**

## Getting started

```bash
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_* in .env

npm install
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

### Nest API (local vs Railway)

All Nest calls use `EXPO_PUBLIC_API_URL` (see `docs/API_ENV.md`):

```bash
npm run start:local     # http://localhost:3000/api/v1
npm run start:railway   # Railway hosted API
```

After changing env vars: `npx expo start -c`.

## Project structure

```
src/
  theme/          # Colors, spacing, typography (Figma tokens)
  components/     # Reusable UI (Button, AppHeader, CustomTabBar, …)
  screens/        # All app screens (41 screens)
  navigation/     # Root stack + main tab navigator
  data/
    mock/         # Static data for prototype
    types/        # Shared TypeScript interfaces
  services/       # Data access stubs (swap for API later)
```

## App flows

| Flow | Screens |
|------|---------|
| Onboarding | Splash → Welcome → Sign Up → Confirm Code → Profile Setup → Notifications |
| Main tabs | Home · Search · Create · Messages · Profile |
| Modals | Stories, post detail, job posting, payments, settings, … |

## Design

Brand colors from Figma:

- Primary: `#E60076`
- Background: `#F7F9FB`
- Text: `#0E243A`

## Backend readiness

Screens read data through `src/services/*`. Replace mock implementations with HTTP calls when the API is ready — screen components stay unchanged.

## License

MIT
