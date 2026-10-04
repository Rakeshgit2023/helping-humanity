# fe-mobile

Production-ready Expo (React Native + TypeScript) mobile app, built on Expo Router, NativeWind, Zustand, and TanStack Query.

## Stack

- Expo SDK 57 / React Native 0.86 / React 19
- Expo Router (file-based navigation)
- TypeScript (strict mode) with `@/*` path aliases into `src/`
- NativeWind (Tailwind CSS utility classes for React Native)
- Zustand for client state, TanStack Query for server state
- Axios API client with token refresh interceptor
- Expo SecureStore for tokens
- React Hook Form + Zod for forms and validation
- ESLint (flat config) + Prettier

## Getting started

```bash
npm install
cp .env.example .env
npm start
```

Then press `i` (iOS), `a` (Android) or `w` (web) in the Expo CLI, or scan the QR code with Expo Go.

## Environment variables

Configuration lives in `src/config/env.ts` and reads from `EXPO_PUBLIC_*` variables (see `.env.example`).

**Important:** anything prefixed `EXPO_PUBLIC_` is bundled into the client and readable by anyone who inspects the app. Never put secrets (API keys, credentials) in these variables — only public, non-sensitive configuration like a base API URL.

## Project structure

```
app/                  Expo Router routes (thin — compose from src/)
  (auth)/             Public routes: login, register
  (protected)/        Auth-gated routes: home, profile, settings
src/
  components/         Reusable UI (ui/, forms/, layout/, common/)
  features/           Feature modules (auth, user) — components/hooks/services/types/utils
  services/           API client, secure storage, notifications
  store/              Zustand stores (auth, app)
  theme/              Design tokens: colors, spacing, typography, shadows
  types/              Shared TypeScript types
  utils/              Validation, formatters, error handling
  config/             Environment configuration
  providers/          App-wide providers (React Query, safe area, gesture handler)
```

## Scripts

- `npm start` — start the Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — start on a specific platform
- `npm run lint` — run ESLint
- `npm run typecheck` — run `tsc --noEmit`
- `npm run format` — run Prettier

## Authentication

The auth architecture (`src/features/auth`, `src/store/authStore.ts`) is wired for a real backend but does not implement one. `authService` calls the endpoints in `src/services/api/endpoints.ts` — point `EXPO_PUBLIC_API_URL` at your backend and it will work end to end (login, register, session restore, token refresh, logout).
