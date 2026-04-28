# trip-json

Open JSON format for AI-curated trip guides, with an interactive map renderer.

Use [Claude Code](https://claude.ai/claude-code) to research a destination and generate a guide. Each place is enriched with Google Places data (ratings, hours, photos). View it locally with the included renderer, or bundle it into a self-contained HTML file you can email, AirDrop, or drop onto any static host.

## Demos

- [Vegas](https://trip-json.vercel.app/trips/renderer.html?trip=vegas) — itinerary mode
- [Bangkok](https://trip-json.vercel.app/trips/renderer.html?trip=bangkok) — category mode

## Quickstart

```bash
git clone https://github.com/chuckakung/trip-json.git
cd trip-json
cp .env.example .env.local        # add your two API keys (see below)
npm run serve                     # http://localhost:8888/renderer.html?trip=bangkok
```

The slash commands (`/research-trip`, `/static-trip`) are picked up automatically from `.claude/commands/` when you run [Claude Code](https://claude.ai/claude-code) inside the cloned repo. Then create a trip:

```
/research-trip Tokyo, staying at Park Hyatt, luxury, foodie
```

> _Plugin install (e.g. `/plugin install trip-json`) coming once this is approved on the [official Claude Code marketplace](https://claude.com/plugins). Until then, clone the repo._

Options: `Style` (budget/mid/luxury/foodie/nightlife/family/adventure), `Dates` (e.g. "May 10–14" — triggers itinerary mode), `Interests` ("street food, jazz bars").

## How it works

1. **Research** — Claude runs web searches and curates 15–25 places with descriptions, tips, price levels, and estimated time.
2. **Enrich** — a generated finder script calls the Google Places API for coordinates, ratings, hours, photos, and reviews. Output: `trips/[city].json`.
3. **Render** — `trips/renderer.html?trip=[city]` shows the interactive Mapbox map with sidebar, click-to-fly markers, popups, optional itinerary mode, accommodation card, and safety section.

## API keys

You provide both keys in `.env.local` (gitignored). There is no shared default.

| Key | Used for | Free tier |
|-----|----------|-----------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Geocoding API + Places API (New) — one-time at trip creation | $200/month credit |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox vector tiles, sprites, fonts — every render | 50k loads/month |

**Google**: [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API key. Enable **Geocoding API** and **Places API (New)** on it. (Not the Maps JavaScript API — we use Mapbox instead.)

**Mapbox**: [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens). Set a **spending cap of $0** above the free tier at [account.mapbox.com/billing](https://account.mapbox.com/billing/) — once exceeded, the map breaks gracefully instead of charging you. **Important:** when you `/static-trip` to bundle a guide, your Mapbox token is baked into the file. Recipients use your quota. The cap protects you.

## Sharing

**Self-contained HTML file** (recommended): `npm run inject-token && node scripts/build-static.js [city]` — or `/static-trip [city]` from Claude Code — produces `trips/[city].html` with the JSON and your Mapbox token inlined. Double-click to open, AirDrop, email, or upload anywhere.

**Hosted (optional, not part of the base skill)**: drop `trips/` onto any static host. The included `vercel.json` runs `inject-token.js` at build time using `NEXT_PUBLIC_MAPBOX_TOKEN` from your project env if you choose Vercel; other hosts need an equivalent wire-up.

## Trip JSON

Required: `meta`, `map`, `theme`, `places`. Each place needs `name`, `coordinates` (`[lng, lat]`), `category`, `emoji`, `description`, `tips`, `priceLevel`, `estimatedTime`. Optional: `accommodation`, `safety`, `route`, `itinerary`, plus per-place Google fields (`googleRating`, `googleMapsUrl`, `website`, `hours`).

See `trips/bangkok.json` (category mode) and `trips/vegas.json` (itinerary mode) for full examples.

## Project structure

```
.claude-plugin/plugin.json     # Claude Code plugin manifest
skills/                         # /research-trip and /static-trip
scripts/google-places.js        # Google Places enrichment helper
scripts/build-static.js         # bundle a trip into one HTML file
scripts/inject-token.js         # generate trips/_token.js from env
trips/renderer.html             # the map renderer
trips/bangkok.json              # sample trip — category mode
trips/vegas.json                # sample trip — itinerary mode
vercel.json                     # Vercel build config
```

## Contributing

PRs welcome. Common shapes:

- **New trip example**: add `trips/<city>.json`, link it in Demos.
- **Renderer feature**: edit `trips/renderer.html`, exercise it in an example trip.

Test changes by cloning your fork — `.claude/commands/` exposes the slash commands automatically when Claude Code runs inside the cloned directory.

## Disclaimer

This project generates travel guides using AI research and the Google Places API. Information may be inaccurate, outdated, or incomplete. Verify operating hours, trail conditions, safety closures, prices, transportation, and visa requirements with official sources before relying on them. The authors and contributors accept no responsibility for any loss, injury, or inconvenience resulting from use of these guides. Hiking, swimming, driving, and other activities carry inherent risk — follow posted signage, ranger guidance, and local laws.

## License

MIT
