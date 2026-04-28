# trip-json

Open JSON format for shareable trip guides with an interactive map renderer.

## How It Works

1. **Research** — `/research-trip` skill curates places via web search
2. **Enrich** — generated finder script calls Google Places API for ratings, hours, photos, reviews via `scripts/google-places.js`
3. **Render** — `trips/renderer.html?trip=[city]` displays the interactive map + sidebar
4. **Share** — bundle into a self-contained HTML file via `/static-trip [name]`, or deploy `trips/` to any static host

## Trip JSON Schema (`trips/[city].json`)

```json
{
  "meta": { "title": "...", "subtitle": "...", "flag": "🇹🇭" },
  "map": { "center": [lng, lat], "zoom": 13 },
  "theme": { "gradientFrom": "#hex", "gradientTo": "#hex", "accentColor": "#hex", "activeBg": "#hex", "sidebarWidth": 400 },
  "accommodation": null | { "name", "coordinates", "address", "emoji", "description", "tips" },
  "safety": null | { "title": "...", "warnings": ["..."] },
  "route": null | { "distance", "duration", "geometry": { "type": "LineString", "coordinates": [...] } },
  "itinerary": null | [{ "day": "...", "slots": [{ "time": "...", "placeNames": ["Place Name"] }] }],
  "places": [{ "name", "coordinates", "category", "emoji", "description", "tips", "priceLevel", "estimatedTime", "safetyNote", "googleRating", "googleRatingCount", "googleMapsUrl", "website", "hours" }]
}
```

### Renderer Modes

- **Category mode** (default): sidebar groups places by `category`
- **Itinerary mode** (when `itinerary` is set): sidebar shows day headers + time slots
- Optional sections render conditionally: accommodation card, safety banner, route line, Google metadata

### Place Fields

Required: `name`, `coordinates` [lng, lat], `category`, `emoji`, `description`, `tips`, `priceLevel`, `estimatedTime`

Optional (auto-populated by `enrichPlace()`): `googleRating`, `googleRatingCount`, `googleMapsUrl`, `website`, `openingHours`, `photos`, `topReview`, `googleTypes`

Optional (manual): `safetyNote`, `hours`

## APIs & Keys

All keys in `.env.local` (do NOT commit). See `.env.example`.

- **Google Maps Platform API key** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — used for Geocoding API + Places API (New) enrichment. NOT the Maps JavaScript API — we use Mapbox for rendering.
- **Mapbox GL JS** — `NEXT_PUBLIC_MAPBOX_TOKEN` — map rendering (default token embedded as fallback)

## Script Utilities (`scripts/google-places.js`)

- `enrichPlace(place)` — Google Places text search + geocoding fallback, returns place with all Google details merged in
- `buildTripJson(config, places)` — wraps enriched places into the full trip JSON schema
- `writeTripJson(name, tripJson)` — writes to `trips/[name].json`

The `/research-trip` skill generates a finder script per city that uses these utilities. Finder scripts are not checked in — they're created on the fly by the skill.

## Generated Files

When you run `/research-trip`, the skill creates:
- `scripts/find-[city]-places.js` — curated places + enrichment calls (generated, not committed)
- `trips/[city].json` — the trip data (commit this to share)

## Static Build (no server needed)

Run `node scripts/build-static.js [city]` (or `/static-trip [city]`) to generate `trips/[city].html` — a single self-contained file with the JSON data inlined via `window.TRIP_DATA`. Recipients can double-click it to open via `file://`, no web server required. Mapbox tiles still need internet at view time, but nothing else.
