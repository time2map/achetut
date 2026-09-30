---
status: draft
stage: v0
priority: must-have (decided 30.09)
platforms: [ios, android, web]
issues: [https://github.com/time2map/achetut/issues/4]
---
# Migration to Mapbox
## Summary
Replace `react-native-maps` (Google provider) with Mapbox (`@rnmapbox/maps`). Reasons from the 29.09 weekly: detailed 3D buildings in more cities, vector styling without regional restrictions, and a
basemap whose POIs and buildings can be tapped for "What's here?". Navigation stays in Google Maps. The framework stays React Native + Expo; a move to Flutter is not planned for v0
(decision record required, see W-01 in the plan).
## Spike first (go / no-go)
Before the migration, a spike on a dev build shall confirm:
1. `@rnmapbox/maps` works with Expo SDK 54, React Native 0.81 and the new architecture on both
   platforms.
2. 150 markers with clustering pan smoothly on a mid-range Android device and an older iPhone.
3. A tap on a basemap POI or building returns its name, category and coordinates.
4. 3D buildings render in Barcelona and Bordeaux.
5. Custom style matching the new design is feasible.
If any item fails, the team returns to the product owner with options before continuing.
## Functional requirements
1. The app shall render the map with Mapbox on iOS and Android.
2. The app shall keep current behaviour: user location puck, re-centre button, marker selection, bottom sheet padding.
3. The app shall show 3D buildings where the style provides them, at zoom levels agreed with design.
4. The app shall expose basemap feature taps (POI, building).
5. Mapbox attribution and logo shall stay visible as required by Mapbox terms.
6. The Google map provider, `useGoogleMapIosPerfFix` and Google Maps SDK keys shall be
  removed from the app once parity is reached.
## Constraints
- Google Maps Platform terms restrict showing Google Places content (photos, details) on a non-Google map. After migration, place photos come from the library (D-01), and "What's here?"
  shall not display Google Places photos next to the Mapbox map unless legal review allows it.
- Tokens: the Mapbox public token goes to app config; any secret or download token goes to EAS secrets, never to the repository.
- Pricing: check current Mapbox mobile pricing (monthly active users) against expected v0 usage.
## Acceptance criteria
- [ ] Spike report with go / no-go on the five items above.
- [ ] Parity checklist of current map features passes on iOS and Android.
- [ ] No Google Maps SDK in the release build.
## Linked issues
https://github.com/time2map/achetut/issues/4 Mapbox migration
# Dev Notes 
[Place for development notes and useful info]
