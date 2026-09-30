---
status: draft
stage: v0
priority: must-have
platforms: [ios, android, web]
owner: ""
issues: [https://github.com/time2map/achetut/issues/5]
---
# Mobile redesign for v0
## Summary
The current app was designed around live AI search ("Top Spots", "What's here" returning a list of nearby places). v0 changes the product: places come from a pre-built city library (D-01), the map moves to Mapbox with 3D buildings, and "What's here?" becomes a tap on a map object.
The UI must be redesigned for these flows, look good enough to show to clients, and share one visual identity with the web version (ArchMap).
This spec defines **what** the design must cover. Visual decisions are made in Figma or directly in code. 
## Goals
- Browsing a city feels calm and visual: photos first, text second (brief: "browse calmly and pick
  your own").
- One-tap answers in the city: "What's here?" is reachable from the main screen at all times.
- The app has a small but visible advantage over the web: smooth 3D map, native bottom sheet, location-aware "What's here?".
- One identity with the web: shared palette, type, iconography, marker style.
## Current state (what changes)
| Area | Now (code) | v0 |
|------|------------|----|
| Main actions | Bottom buttons "What's here" and "Top" + location button | City picker + "What's here?" + location |
| City search | Free-text search with Photon autocomplete, auto-submit | Picker of library cities (~30), filter by name |
| Results | Sheet with "Top Spots" list from live GPT | Sheet with the city list (F-02), all places, rank order |
| Place card | One hero photo, AI description loaded on open ("Loading place description…") | Photo carousel, architect, description from library, no loading text |
| What's here | Button → up to 5 nearby places list, hint "There was nothing near you. Go ahead." | Tap on map object → card; button → most likely object at current location |
| Map | Google Maps, default style, green/orange pulse markers | Mapbox custom style, 3D buildings, new markers and clusters |
| Admin | Model picker button on the map (admin mode) | Not in production UI |
| Tokens | `src/shared/styles/tokens.ts`: white background, green `#15803d` pin, orange selection, 7–16 px radii, 14/16 px type | Replaced by the new design tokens |
## Information architecture
```
Main screen (map + bottom sheet)
├── City picker (modal / full-height sheet)
├── City list (sheet, collapsed / half / full)
│   └── Place card (sheet, replaces list; back returns to list)
│       └── Photo viewer (full screen)
├── What's here card (sheet; from map tap or button)
└── About / legal (from a small menu): privacy policy, photo credits, feedback, version
System screens: location permission pre-prompt, offline, error
```
## Screens and required content
Each screen lists required elements and the requirements it serves. Design must cover every
listed state.
### Main screen
- Full-screen Mapbox map, city markers and clusters.
- Current city chip / button that opens the city picker.
- "What's here?" primary action.
- Re-centre on my location.
- Mapbox logo and attribution visible, not covered by the sheet.
- Bottom sheet with the city list in collapsed state.
- States: first launch without city; city loading; city loaded; offline with cached city.
### City picker
- List of library cities with a text filter; optional city thumbnail and place count.
- "Near you" entry when the user's location is inside a library city.
- What to show for a city that is not in the library: at least an empty state; ideally a
  "Request this city" action.
### City list (bottom sheet)
- Snap points: collapsed (city name + place count), half, full.
- List item: photo thumbnail or placeholder, name, category, first line of description.
- "Not on the map" marker for places without coordinates.
- Selected item state synced with the map marker.
- Long list: 100–200 items, no "load more" button.
### Place card
- Photo carousel with page indicator; tap opens full-screen viewer.
- Photo credit (author, licence) — small, but readable.
- Name, category, architect and year for buildings.
- Description — long-form reading typography; the block disappears when there is no description.
- "Open in Google Maps" — the main action on the card.
- Placeholder when there are no photos.
- Back to list; swipe down to collapse.
### What's here card
- Object name and category shown immediately; description skeleton while loading.
- Variant: object is a library place → same layout as Place Card.
- Variant: AI description → visually marked as generated.
- Variant: no reliable info → name and category only.
- Switcher to up to 2 alternative candidates when opened from the button.
- "Open in Google Maps".
- States: loading, rate limit / cost cap ("Try again later"), offline.
### Location permission
- Pre-prompt screen or sheet explaining why location is needed before the system dialog.
- Denied state for "What's here?" with a link to system settings.
### About / legal
- Privacy policy, photo credits and sources, feedback link, app version. 
## Map design
- Custom Mapbox style in Mapbox Studio, matching the web identity; light theme.
- 3D buildings from zoom level agreed with dev; decide how markers sit on top of 3D buildings (occlusion, pitch).
- Marker set: default, selected, visited-later (reserved, not used in v0), cluster with count. Consider category icons (building, park, viewpoint, street, artwork).
- User location puck and heading.
- Label density: POI labels must stay tappable for "What's here?" without cluttering the city markers.
## Reserved space for later stages
Design does not need to finish these, but the layout must not block them:
- Walkable areas (polygons) and streets (lines) on the map, with a legend.
- "Touristy" badge on list items and cards.
- "Save" / "Visited" action on the card; selection counter and "Send all to Google Maps".
## Design system
Deliver tokens that replace `src/shared/styles/tokens.ts`:
- Colour: background, surface, text (primary, secondary, muted), accent, marker states, danger, info, overlay. Contrast AA for text.
- Typography: font family (licence must allow app embedding), sizes for title, body, long-form description, caption, credit.
- Spacing scale, radii, elevation / shadows for sheet and buttons.
- Components: primary and secondary buttons, icon button, city chip, list item, card header, carousel, skeleton, toast, empty state, bottom sheet with handle.
- Icon set in SVG (the app renders icons with `react-native-svg`).
## Platform conventions
| Topic | iOS | Android |
|-------|-----|---------|
| Safe areas | Dynamic Island / notch, home indicator | Edge-to-edge, gesture bar |
| Back | Swipe-down on sheets, back chevron | System back closes sheet levels in order |
| Typography | Supports Dynamic Type at least to XL without breaking layout | Supports font scale 1.3 |
| Tablet | — | — |
| Orientation | Portrait only | Portrait only |
## Accessibility
- Tap targets ≥ 44 × 44 pt (iOS) / 48 × 48 dp (Android).
- All icon buttons have labels for screen readers.
## Acceptance criteria
- [ ] Every requirement referenced above maps to a visible UI element or state.
- [ ] The product owner approved the main flow prototype.
## Open questions
| Question | Owner | Answer | Status|
|----------|-------|--------|--------|
| Is there an existing brand (logo, colours, fonts) or is the identity created now? Where are the current mobile Figma mockups? | Product owner / Vadim | | Open |
| Does the web redesign lead and mobile follow, or the other way round? | Product owner | Meeting 29.09: design mobile, then align desktop to it (to confirm) | Closed |
| Reference apps or sites for look and feel | Product owner | | Open |
| Should AI-generated descriptions be visually distinguished from library ones | Product owner | | Open |
## Linked issues
https://github.com/time2map/achetut/issues/5 Design: add new components
# Dev Notes 
[Place for development notes and useful info]
