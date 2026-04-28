# Research Trip

Research and create a complete trip JSON for a destination, ready for the renderer.

## Arguments

`$ARGUMENTS` — destination, accommodation, and optional modifiers.

Parse the following from the arguments:
- **Destination** (required): city name, e.g. "Tokyo", "Lisbon"
- **Accommodation** (optional): hotel/hostel/airbnb name, e.g. "staying at Park Hyatt"
- **Dates** (optional): travel dates, e.g. "May 10-14" — triggers itinerary mode with day-by-day scheduling
- **Style** (optional): one of "budget", "mid", "luxury", "foodie", "nightlife", "family", "adventure" — defaults to "mid" if not specified
- **Interests** (optional): specific interests like "street food, architecture, jazz bars"

Examples:
- `/research-trip Tokyo, staying at Park Hyatt, luxury, May 10-14`
- `/research-trip Lisbon, budget, foodie`
- `/research-trip Mexico City, staying at Four Seasons, interested in street food and mezcal bars`
- `/research-trip Bali, family, adventure`

## Instructions

### Step 1: Research the destination

Run **at least 6 web searches** to build a well-rounded picture. Tailor searches to the travel style:

**Always search:**
- "[city] best restaurants [current year]" — recent recommendations, not stale listicles
- "[city] top attractions must see"
- "[city] hidden gems locals recommend reddit" — real opinions, not SEO content
- "[city] best neighborhoods to explore"

**Style-specific searches:**

| Style | Additional searches |
|-------|-------------------|
| budget | "[city] cheap eats street food", "[city] free things to do", "[city] budget tips" |
| luxury | "[city] best fine dining michelin", "[city] luxury experiences rooftop bars", "[city] best spa hotel experiences" |
| foodie | "[city] food guide local specialties", "[city] best street food markets", "[city] food tour neighborhoods", "[city] best coffee shops bakeries" |
| nightlife | "[city] best bars cocktail speakeasy", "[city] nightlife guide clubs", "[city] live music jazz" |
| family | "[city] family activities kids", "[city] safe areas family", "[city] parks museums family friendly" |
| adventure | "[city] outdoor activities hiking", "[city] day trips nature", "[city] unique experiences off beaten path" |
| mid (default) | mix of the above — balanced across food, sights, and experiences |

**Also search for:**
- "[city] safety tips tourists" — to decide if a safety section is needed
- "[city] weather [travel month]" if dates provided — note in tips if relevant (rainy season, extreme heat, etc.)
- "[city] local events [travel month]" if dates provided — festivals, markets, seasonal activities

### Step 2: Curate places

Select **15-25 places** following these curation principles:

**Category mix** — aim for roughly:
- 4-6 restaurants/food (scaled by style — more for foodie, fewer for adventure)
- 3-5 landmarks/attractions
- 2-3 bars/nightlife (skip for family)
- 2-3 markets/shopping/neighborhoods
- 2-3 day trips or experiences
- 1-2 cafes/bakeries
- 1-2 culture/museums

**Quality filters:**
- Skip generic tourist traps that every listicle mentions if there's a better local alternative
- Include at least 3-4 places that only locals would know — the kind of place a friend who lives there would take you
- Every restaurant should have a specific dish recommendation in the tips
- Every attraction should have a practical tip (best time to go, what to skip, how to avoid crowds)

**Budget awareness by style:**
| Style | Price mix |
|-------|-----------|
| budget | 60% $ / 30% $$ / 10% $$$ / 0% $$$$ |
| mid | 20% $ / 40% $$ / 30% $$$ / 10% $$$$ |
| luxury | 5% $ / 20% $$ / 35% $$$ / 40% $$$$ |
| foodie | 30% $ / 30% $$ / 25% $$$ / 15% $$$$ |

**Geographic spread:**
- Don't cluster everything in one district — spread across 3-4 neighborhoods
- Group nearby places so a visitor can combine them in one outing
- Note neighborhood names in descriptions so the traveler builds a mental map

### Step 3: Get coordinates and build

**Naming places for accurate geocoding:** Google Places returns a single point per place, and for trails or other long features that point can land mid-trail or at an off-rim spot rather than where a visitor would actually start. To get a useful point:

- For **trails**, query the trailhead explicitly with geographic context — `"<Trail Name> Trailhead, <Side/Rim>"` (e.g. "Bright Angel Trailhead South Rim"). Bare names like "Bright Angel Trail" can return a point along the trail itself.
- For **viewpoints with multiple access points**, include the rim/road name (e.g. "Hopi Point Hermit Road").
- For **landmarks inside larger venues**, include the venue (e.g. "Hopi House Grand Canyon Village").
- After enrichment, sanity-check trail/viewpoint coordinates by eye — if a South Rim trailhead has a latitude north of the rim, it's wrong; re-query with more context.

Check if `.env.local` exists and has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. If `.env.local` is missing, ask the user before falling back to the no-key path — they may have a key handy and the enriched output is much better.

**If Google API key is available** (preferred):

Create `scripts/find-[city]-places.js` using the established pattern:

```javascript
const { enrichPlace, buildTripJson, writeTripJson } = require('./google-places');

async function findPlaces() {
  const curatedPlaces = [
    // ... curated places with name, address, category, emoji, description, tips, priceLevel, estimatedTime
  ];

  const allPlaces = [];
  for (const place of curatedPlaces) {
    console.log(`${place.emoji} ${place.name}`);
    const enriched = await enrichPlace(place);
    if (enriched) {
      allPlaces.push(enriched);
      // ... log details
    }
    await new Promise(resolve => setTimeout(resolve, 300)); // rate limit
  }
  return allPlaces;
}

findPlaces().then(places => {
  const tripJson = buildTripJson({ /* config */ }, places);
  writeTripJson('[city]', tripJson);
});
```

See `trips/bangkok.json` and `trips/vegas.json` for examples of the output format.

Then run: `node scripts/find-[city]-places.js`

**If no API key** (fallback):

Write `trips/[city].json` directly. For each place:
- Search for coordinates using web search: "[place name] [city] coordinates"
- Use coordinates in [longitude, latitude] GeoJSON format
- Set Google metadata fields (googleRating, googleMapsUrl, etc.) to null
- Double-check that coordinates are reasonable (not in the ocean, correct city)

### Step 4: Choose a color theme

Pick colors that evoke the city:

| Vibe | gradientFrom | gradientTo | Example cities |
|------|-------------|------------|----------------|
| Tropical/warm | #f39c12 | #e74c3c | Bangkok, Bali, Cartagena |
| Mediterranean | #3b82f6 | #06b6d4 | Lisbon, Barcelona, Athens |
| Historic/imperial | #667eea | #764ba2 | Istanbul, Rome, Kyoto |
| Nightlife/urban | #1a1a2e | #e94560 | Vegas, Tokyo, Berlin |
| Nature/green | #16a34a | #65a30d | Nairobi, Queenstown, Costa Rica |
| Desert/earth | #d97706 | #dc2626 | Marrakech, Santa Fe, Dubai |
| Elegant/cool | #e74c3c | #c0392b | Hong Kong, Paris, London |
| Latin/vibrant | #ec4899 | #f97316 | Mexico City, Buenos Aires, Havana |

Set `activeBg` to a light tint of the primary color (e.g. #fef9ee for orange, #f0f0ff for purple).

### Step 5: Build the trip JSON config

**meta:**
- `title`: "[Flag] [City] Guide" or "[Flag] [City] Trip [Dates]"
- `subtitle`: "[N] places near [Accommodation]" or "[N] curated spots in [City]" if no accommodation
- `flag`: country flag emoji

**map:**
- `center`: [longitude, latitude] of city center or accommodation
- `zoom`: 12 for spread-out cities, 13 for compact cities, 14 for neighborhood-level

**accommodation** (if provided):
- Include name, coordinates, address, emoji (🏨), description, and practical tips (transport, nearby amenities)

**safety** (only if needed):
- Search results will indicate if safety is a concern
- Include if: petty crime is common, areas to avoid, transport safety, scam warnings
- Format: `{ "title": "⚠️ Safety Tips", "warnings": ["..."] }`
- Cities like Tokyo, Lisbon, etc. don't need this — only add when genuinely useful

**itinerary** (if dates provided):
- Structure by day with time slots
- Morning activity, lunch, afternoon activity, dinner, evening
- Reference places by exact name in `placeNames` arrays
- Group geographically — don't zig-zag across the city
- Build in downtime — don't schedule every hour
- Example: `{ "day": "Saturday, May 10", "slots": [{ "time": "~10 AM - Morning", "placeNames": ["Tsukiji Outer Market"] }] }`

**itinerary** (if no dates):
- Set to `null` — the renderer will use category mode instead

**places:**
- Every place needs: name, coordinates [lng, lat], category, emoji, description, tips, priceLevel, estimatedTime
- Optional: safetyNote (for cities with safety concerns), googleRating, googleMapsUrl, website, hours
- Use specific, practical tips — not generic "make a reservation" but "reserve 2 weeks ahead, ask for terrace seating"
- Description should say what it IS and why it's special, not just the category

### Step 6: Write, run, and verify

1. Write the finder script or JSON directly (depending on API key availability)
2. If script: run `node scripts/find-[city]-places.js`
3. Start a local server in the background: `npm run serve` (runs `inject-token.js` then `npx http-server trips -p 8888 -c-1`). Give the user the URL: `http://localhost:8888/renderer.html?trip=[city]`
4. **Stop and wait for the user to verify in their browser.** HTTP 200 from curl is not the same as a working render. The user needs to confirm: all markers visible, sidebar renders, clicking cards flies to markers, popups show details, theme/copy looks right.
5. Iterate on the JSON if the user wants changes.
6. Stop the local server only after verification is confirmed.

### Step 7: Deploy and share

Only after the user has confirmed the local render looks good:

1. Run `npx vercel --prod --yes` from the project root
2. The renderer is served at `/trips/renderer.html` (not the root) — share `https://[deployment].vercel.app/trips/renderer.html?trip=[city]`
3. Tell the user the shareable URL
