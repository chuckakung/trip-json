# Static Trip

Build a self-contained HTML file for a trip — no web server needed.

## Arguments

A trip name (e.g. `bangkok`, `vegas`). Must match an existing `trips/[name].json` file.

## Instructions

1. Run: `node scripts/build-static.js [name]`
2. The script writes `trips/[name].html` with the JSON data inlined.
3. Tell the user the file is at `trips/[name].html` and that they can:
   - Double-click it to open in their default browser (works via `file://`)
   - Email/Slack/AirDrop it to anyone — recipient just opens the file
   - Drop it on any static host (S3, GitHub Pages, Dropbox public link, etc.)
4. The file is fully self-contained except for two CDN dependencies that load at runtime: Mapbox GL JS and the default Mapbox tile/font endpoints. The recipient needs internet to see the map, but no server.
