/**
 * Build a self-contained static HTML file for a trip.
 *
 * Reads trips/[name].json + trips/renderer.html, inlines the trip data AND
 * your Mapbox token into a single HTML file at trips/[name].html. The output
 * works by double-clicking (file://) — no server, no env vars needed.
 *
 * IMPORTANT: the token in the static file is YOUR Mapbox token. Anyone who
 * opens the file uses your quota. Set a rate-limit on your token.
 *
 * Usage: node scripts/build-static.js [name]
 */

const fs = require('fs');
const path = require('path');

const name = process.argv[2];
if (!name) {
  console.error('Usage: node scripts/build-static.js [name]');
  process.exit(1);
}

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!token) {
  console.error('❌ NEXT_PUBLIC_MAPBOX_TOKEN is not set in .env.local.');
  console.error('   Get a free token at https://account.mapbox.com/access-tokens/');
  process.exit(1);
}

const tripsDir = path.resolve(__dirname, '..', 'trips');
const jsonPath = path.join(tripsDir, `${name}.json`);
const rendererPath = path.join(tripsDir, 'renderer.html');
const outPath = path.join(tripsDir, `${name}.html`);

if (!fs.existsSync(jsonPath)) {
  console.error(`Trip JSON not found: ${jsonPath}`);
  process.exit(1);
}

const trip = fs.readFileSync(jsonPath, 'utf8');
const renderer = fs.readFileSync(rendererPath, 'utf8');

// Escape closing-script-tag sequences so embedded data can't terminate the host script.
const safeJson = trip.replace(/<\/script/gi, '<\\/script');

const inlineTag =
  `<script>` +
  `window.MAPBOX_TOKEN = ${JSON.stringify(token)};` +
  `window.TRIP_DATA = ${safeJson};` +
  `</script>`;

// Drop the external _token.js include — token is inlined above.
let out = renderer.replace(/\s*<script src="_token\.js"><\/script>\s*/g, '\n  ');

// Insert the inline data right before the main inline script.
const marker = '<script>\n    // Mapbox token';
if (!out.includes(marker)) {
  console.error('Could not find injection marker in renderer.html');
  process.exit(1);
}

out = out.replace(marker, `${inlineTag}\n  ${marker}`);
fs.writeFileSync(outPath, out);

console.log(`✅ Wrote ${path.relative(process.cwd(), outPath)} (${out.length.toLocaleString()} bytes)`);
console.log(`   Open it directly in a browser — no server, no env vars needed.`);
console.log(`   ⚠️  Your Mapbox token is baked in. Recipients use your quota.`);
