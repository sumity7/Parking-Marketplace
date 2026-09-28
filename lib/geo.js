// Free geocoding via OpenStreetMap's Nominatim — no API key required. Client-side
// calls rely on the browser's own Referer header to satisfy Nominatim's usage
// policy (https://operations.osmfoundation.org/policies/nominatim/); this app only
// makes a handful of debounced, user-initiated lookups, well within its free tier.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export async function geocodeAddress(query, { signal } = {}) {
  if (!query || query.trim().length < 3) return [];
  const url = `${NOMINATIM_BASE}/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Location search failed");
  const results = await res.json();
  return results.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    city:
      r.address?.city || r.address?.town || r.address?.village || r.address?.county || r.address?.state || "",
  }));
}

export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url = `${NOMINATIM_BASE}/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const r = await res.json();
  return {
    label: r.display_name || "",
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || r.address?.state || "",
  };
}

// Great-circle distance between two lat/lng points, in meters.
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters) {
  if (meters == null || !Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}
