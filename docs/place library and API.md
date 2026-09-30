---
status: draft
stage: v0
priority: must-have
platforms: [backend]
issues: [https://github.com/time2map/achetut/issues/6]
---
# Place library and API
## Summary
Places are prepared ahead of time, per city, by the Claude skill (up to ~100 placesper city, with coordinates, photos and descriptions, following the brief's rules). The JSON files already exist for the web prototype (ArchMap). The backend stores them and serves them to the
mobile apps. This replaces the current flow in which the app asks GPT for up to 15 places at request time and geocodes them through Google Places (`src/features/google-ai/store/top.ts`).
## Functional requirements
1. The backend shall import city JSON files from the library source and validate them
  against the schema below; invalid places are rejected with a report, valid ones are published.
2. Photos shall be copied to project storage and served through a CDN in at least two
  sizes (thumbnail ≤ 480 px, card ≤ 1080 px). Hotlinking third-party images is not allowed.
3. `GET /cities` returns all published cities.
4. `GET /cities/{cityId}/places` returns all places of the city ordered by `rank`. Pagination is optional (`?cursor=`); a city of 100 places fits in one response.
5. Responses shall be cacheable so the app can show the last loaded city offline.
6. For each place with coordinates, the backend shall resolve `googlePlaceId` once (Google Places Text Search by name near coordinates, accepted only within 100 m) and store it. Unresolved places keep `googlePlaceId: null`. A manual override field shall exist.
7. `POST /whats-here/describe` accepts `{ name, category, lat, lng, sourceId? }` and returns `{ description | null, architect? }`. Results are cached by
  `sourceId` or by rounded coordinates plus name.
8. All AI calls go through the backend; the app shall hold no AI provider keys.

## Schema (proposed, to align with the actual ArchMap JSON)
```json
{
  "city": {
    "id": "barcelona",
    "name": "Barcelona",
    "country": "Spain",
    "center": { "lat": 41.3874, "lng": 2.1686 },
    "bbox": [2.0524, 41.3170, 2.2280, 41.4695],
    "language": "en",
    "updatedAt": "2026-09-29T00:00:00Z"
  },
  "places": [
    {
      "id": "barcelona-walden-7",
      "rank": 12,
      "name": "Walden 7",
      "category": "residential",
      "architect": "Ricardo Bofill",
      "year": 1975,
      "description": "Engaging story… or null",
      "location": { "lat": 41.3746, "lng": 2.0584 },
      "googlePlaceId": null,
      "photos": [
        {
          "url": "https://…",
          "author": "…",
          "license": "CC BY-SA 4.0",
          "sourceUrl": "https://…"
        }
      ],
      "sources": ["https://…"],
      "isTouristy": null,
      "geometry": null
    }
  ]
}
```
Field rules:
- `rank` — 1 is the strongest place in the city. Unique within a city.
- `category` — `building | residential | public_space | park | viewpoint | street | district |
  artwork | museum | other`.
- `architect` — required when `category` is `building` or `residential` and the architect is known.
- `description` — `null` when there is nothing interesting to say. Never a placeholder.
- `location` — `null` when coordinates are unknown; such places go to the end of the list.
- `isTouristy` — reserved for later versions; ignored by the v0 app.
- `geometry` — reserved for later versions (GeoJSON `LineString` or `Polygon`); ignored by the v0 app.
## Business rules applied at library build time
- BR-01. Touristy places are kept.
- BR-02. Strongest places get the lowest rank; each place appears once.
- BR-03. Residential complexes only if notable contemporary architecture featured in publications;
  more publications → better rank.
- BR-06. No padding: the library stops when good places run out.
## Non-functional requirements
- v0 covers ~30 cities (meeting 29.09). Adding a city requires no app release.
- Photo licences are stored per photo and shown in the app.
## Acceptance criteria - ADD CORRECT INFO 
- [ ] Importing the Barcelona?? JSON publishes all valid places and reports invalid ones.
- [ ] `GET /places` returns places ordered by rank with CDN photo URLs.
- [ ] At least 80 % of Barcelona?? places with coordinates have a resolved `googlePlaceId`.
## Open questions
| Question | Owner | Answer | Status |
----------|-------|--------|--------|
Sources of places, photos, descriptions | Product owner | Pre-built library via Claude skill (29.09) | Answered |
Actual format of the JSON; who publishes new cities and how | Product owner + Dev | | Open, blocs release |
## Linked issues
https://github.com/time2map/achetut/issues/6 Backend: create DB for JSON

# Dev Notes 
[Place for development notes and useful info]
