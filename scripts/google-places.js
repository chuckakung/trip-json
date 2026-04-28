/**
 * Shared Google Places utilities for enriching curated places with real data.
 *
 * Usage:
 *   const { geocodePlace, fetchPlaceDetails, enrichPlace } = require('./google-places');
 *   const enriched = await enrichPlace(place); // geocodes + fetches details in one call
 */

const fs = require('fs');
const path = require('path');

// Load .env.local without requiring dotenv
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocodePlace(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      formatted_address: result.formatted_address,
      coordinates: [result.geometry.location.lng, result.geometry.location.lat],
      place_id: result.place_id
    };
  }
  return null;
}

/**
 * Search for a place by text query using Google Places API (New).
 * Returns the top match with its place ID for detail fetching.
 */
async function searchPlace(query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.regularOpeningHours,places.photos,places.reviews,places.websiteUri,places.googleMapsUri,places.types'
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1
    })
  });
  const data = await response.json();
  if (data.places && data.places.length > 0) {
    return data.places[0];
  }
  return null;
}

/**
 * Fetch place details by place ID using Google Places API (New).
 */
async function fetchPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,currentOpeningHours,regularOpeningHours,photos,reviews,websiteUri,googleMapsUri,types'
    }
  });
  return await response.json();
}

/**
 * Extract the useful bits from a Google Places API response into a clean object.
 */
function extractPlaceDetails(googlePlace) {
  if (!googlePlace) return {};

  const details = {};

  if (googlePlace.rating) details.googleRating = googlePlace.rating;
  if (googlePlace.userRatingCount) details.googleRatingCount = googlePlace.userRatingCount;
  if (googlePlace.googleMapsUri) details.googleMapsUrl = googlePlace.googleMapsUri;
  if (googlePlace.websiteUri) details.website = googlePlace.websiteUri;

  // Price level from Google (PRICE_LEVEL_FREE, PRICE_LEVEL_INEXPENSIVE, etc.)
  if (googlePlace.priceLevel) {
    const priceLevelMap = {
      'PRICE_LEVEL_FREE': 'Free',
      'PRICE_LEVEL_INEXPENSIVE': '$',
      'PRICE_LEVEL_MODERATE': '$$',
      'PRICE_LEVEL_EXPENSIVE': '$$$',
      'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
    };
    details.googlePriceLevel = priceLevelMap[googlePlace.priceLevel] || googlePlace.priceLevel;
  }

  // Opening hours
  if (googlePlace.regularOpeningHours && googlePlace.regularOpeningHours.weekdayDescriptions) {
    details.openingHours = googlePlace.regularOpeningHours.weekdayDescriptions;
  }

  // Photo references (first 3)
  if (googlePlace.photos && googlePlace.photos.length > 0) {
    details.photos = googlePlace.photos.slice(0, 3).map(photo => ({
      name: photo.name,
      widthPx: photo.widthPx,
      heightPx: photo.heightPx,
      // Photo URL: https://places.googleapis.com/v1/{photo.name}/media?maxWidthPx=800&key=API_KEY
      url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`
    }));
  }

  // Top review (first one)
  if (googlePlace.reviews && googlePlace.reviews.length > 0) {
    const topReview = googlePlace.reviews[0];
    details.topReview = {
      rating: topReview.rating,
      text: topReview.text ? topReview.text.text : null,
      author: topReview.authorAttribution ? topReview.authorAttribution.displayName : null,
      relativeTime: topReview.relativePublishTimeDescription
    };
  }

  if (googlePlace.types) details.googleTypes = googlePlace.types;

  return details;
}

/**
 * Enrich a curated place with geocoding + Google Places details.
 * Pass in a place object with at least { name, address }.
 * Returns the place object with coordinates and google details merged in.
 */
async function enrichPlace(place) {
  // Step 1: Search for the place to get rich details
  const searchQuery = `${place.name}, ${place.address}`;
  const googlePlace = await searchPlace(searchQuery);

  let coordinates = null;
  let formatted_address = place.address;
  let details = {};

  if (googlePlace) {
    // Use Google Places location for coordinates (more accurate than geocoding)
    if (googlePlace.location) {
      coordinates = [googlePlace.location.longitude, googlePlace.location.latitude];
    }
    if (googlePlace.formattedAddress) {
      formatted_address = googlePlace.formattedAddress;
    }
    details = extractPlaceDetails(googlePlace);
  }

  // Fallback to geocoding if Places search didn't return coordinates
  if (!coordinates) {
    const geocoded = await geocodePlace(place.address);
    if (geocoded) {
      coordinates = geocoded.coordinates;
      formatted_address = geocoded.formatted_address;
    }
  }

  if (!coordinates) return null;

  return {
    name: place.name,
    address: formatted_address,
    coordinates,
    category: place.category,
    emoji: place.emoji,
    description: place.description,
    tips: place.tips,
    priceLevel: place.priceLevel,
    estimatedTime: place.estimatedTime,
    ...details
  };
}

/**
 * Build a complete trip JSON object ready for trips/renderer.html.
 *
 * @param {Object} config - Trip configuration
 * @param {Object} config.meta - { title, subtitle, flag }
 * @param {Object} config.map - { center: [lng, lat], zoom }
 * @param {Object} config.theme - { gradientFrom, gradientTo, accentColor, activeBg?, sidebarWidth? }
 * @param {Object|null} config.accommodation - { name, coordinates, address, emoji, description?, tips? } or null
 * @param {Object|null} config.safety - { title, warnings: [] } or null
 * @param {Object|null} config.route - { distance, duration, geometry } or null
 * @param {Array|null} config.itinerary - [{ day, slots: [{ time, placeNames }] }] or null
 * @param {Array} places - Array of enriched place objects
 * @returns {Object} Complete trip JSON
 */
function buildTripJson(config, places) {
  return {
    meta: config.meta,
    map: config.map,
    theme: config.theme,
    accommodation: config.accommodation || null,
    safety: config.safety || null,
    route: config.route || null,
    itinerary: config.itinerary || null,
    places
  };
}

/**
 * Write a trip JSON file to trips/[name].json.
 *
 * @param {string} name - City/trip name (e.g. 'bangkok')
 * @param {Object} tripJson - Complete trip JSON from buildTripJson()
 */
function writeTripJson(name, tripJson) {
  const tripsPath = path.resolve(__dirname, '..', 'trips', `${name}.json`);
  fs.writeFileSync(tripsPath, JSON.stringify(tripJson, null, 2));
  console.log(`\n💾 Saved trip to trips/${name}.json`);
  console.log(`🗺️  View at: trips/renderer.html?trip=${name}\n`);
}

module.exports = {
  geocodePlace,
  searchPlace,
  fetchPlaceDetails,
  extractPlaceDetails,
  enrichPlace,
  buildTripJson,
  writeTripJson,
  GOOGLE_API_KEY
};
