# Achetut Mobile (Expo + React Native + TypeScript)

## Stack

- TypeScript
- Expo SDK 54, React Native 0.81
- expo-router 6 (routing)
- Zustand 5 (state store)
- react-native-maps (Google Maps)
- expo-location (permission + GPS helper)
- dotenv (+ app.config.ts -> extra)
- Babel module-resolver (aliases `@shared/*`, `@features/*`)
- OpenAI Chat Completions API

## Requirements

- Node.js LTS and npm
- Xcode (for iOS) / Android Studio (for Android)
- Installed iOS simulator or Android emulator
- `.env` file inside `mobile/` (already committed) - update the keys if needed:
  - `GOOGLE_MAPS_API_KEY`
  - `GOOGLE_MAPS_MAP_ID`
  - `GPT_API_KEY`
- Allow the app to access Location Services when prompted (used for initial map centering).

## Getting Started

```bash
cd /Users/stelsp/Documents/geosemantica/achetut/ui/mobile
npm install
```

Recommended dev build (ensures Google Maps renders correctly):

```bash
npx expo run:ios     # iOS simulator
npx expo run:android # Android emulator
```

Quick start (maps might fail to render on first boot):

```bash
npm run ios   # or npm run android
```

After editing Babel config or aliases:

```bash
npm start -c
```

## Project Structure

```text
mobile/
  app/
    _layout.tsx            # shared layout + footer tab switcher
    index.tsx              # main screen (map + side panel)
  app.config.ts            # ENV -> extra + Google Maps config (iOS/Android)
  babel.config.js          # @shared/* and @features/* aliases
  tsconfig.json            # baseUrl + paths for aliases
  src/
    features/
      map/
        screens/MapScreen.tsx
        constants.ts
        styles.ts
        config/prompt.ts        # system prompt for GPT descriptions
        hooks/*                 # selection logic and data fetching
    shared/
      api/openai.ts            # OpenAI Chat Completions client
      config/env.ts            # env access (extra)
      types/chat.ts            # ChatMessage types
      ui/*                     # reusable UI components
```

## Modules and Shared Code

- MAP: single screen with Google Maps, point/POI selection, metadata panel (coordinates, address, Google Places / Street View photos, GPT description).
- Shared (`src/shared/*`):
  - `api/` - API clients (for example, `openai.ts`)
  - `config/` - environment adapters (`env.ts` pulls keys from `extra`)
  - `types/` - shared types such as `ChatMessage`
  - `ui/` - reusable UI components

For additional routing/feature guidance see `docs/DEV_GUIDE.md`.
