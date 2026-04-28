/**
 * Generate trips/_token.js from NEXT_PUBLIC_MAPBOX_TOKEN.
 *
 * Reads from .env.local (local dev) or process.env (Vercel build).
 * Writes a tiny script that sets window.MAPBOX_TOKEN — included by renderer.html.
 *
 * Usage: node scripts/inject-token.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local without dotenv
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
  console.error('❌ NEXT_PUBLIC_MAPBOX_TOKEN is not set.');
  console.error('   Add it to .env.local (local) or Vercel env vars (deploy).');
  console.error('   Get a free token at https://account.mapbox.com/access-tokens/');
  process.exit(1);
}

const outPath = path.resolve(__dirname, '..', 'trips', '_token.js');
fs.writeFileSync(outPath, `window.MAPBOX_TOKEN = ${JSON.stringify(token)};\n`);
console.log(`✅ Wrote trips/_token.js`);
