# Achetut Web

Achetut is a web-only collection of curated city guides presented on an interactive Mapbox map.

## Stack

- React 18.3
- TypeScript 6
- Vite 7
- Tailwind CSS 4
- React Router 7
- Mapbox GL JS 3 + react-map-gl 8
- Zustand 5

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set a public Mapbox token in `.env`:

```dotenv
VITE_MAPBOX_ACCESS_TOKEN=pk.etc
VITE_MAPBOX_STYLE=mapbox://styles/mapbox/standard
```

The previous `EXPO_PUBLIC_MAPBOX_*` names are temporarily supported so existing local environments continue to work.

## Routes

- `/design-1` — collapsible-panel concept
- `/design-1/cities` — city overview
- `/design-1/:cityId` — city guide
- `/design-1/:cityId/:placeId` — place detail
- `/design-2` — permanent-sidebar concept
- `/design-2/:cityId` — city guide
- `/design-2/:cityId/:placeId` — selected place and map popup

## Checks

```bash
npm run typecheck
npm run build
npm run preview
```

Vite outputs the production application to `dist/`.

## Source structure

```text
src/
  App.tsx                    # React Router routes
  main.tsx                   # browser entry point
  features/web-map/          # two map interface concepts
  shared/config/env.ts       # Vite environment adapter
  styles/index.css           # Tailwind and global document styles
  top/                       # curated city and place data
```
