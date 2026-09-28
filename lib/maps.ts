export interface MapLocation {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
  secondaryAddress?: string;
}

export interface MapRoute {
  distanceKm: number;
  durationMins: number;
  coordinates: [number, number][];
  isApproximate?: boolean;
}

export interface MapAdapter {
  searchPlaces(query: string): Promise<MapLocation[]>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
  getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<MapRoute>;
}

// In-Memory Client Caches
const clientSearchCache = new Map<string, MapLocation[]>();
const clientGeocodeCache = new Map<string, string>();
const clientRouteCache = new Map<string, MapRoute>();

/**
 * Searches places via server API route /api/places (keeps API keys protected).
 * Biased to Tamil Nadu/India, debounced on client, cached in memory.
 */
export async function searchPlaces(query: string): Promise<MapLocation[]> {
  const cleanQuery = query ? query.trim().toLowerCase() : "";
  if (!cleanQuery || cleanQuery.length < 2) return [];

  if (clientSearchCache.has(cleanQuery)) {
    return clientSearchCache.get(cleanQuery)!;
  }

  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(cleanQuery)}`);
    if (!res.ok) return [];

    const data = await res.json();
    const results: MapLocation[] = (data.results || []).map((item: any) => ({
      lat: item.lat,
      lng: item.lng,
      displayName: item.displayName,
      shortName: item.shortName,
      secondaryAddress: item.secondaryAddress,
    }));

    clientSearchCache.set(cleanQuery, results);
    return results;
  } catch (err) {
    console.error("Client searchPlaces error:", err);
    return [];
  }
}

/**
 * Reverse geocodes coordinates to a readable address string.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (clientGeocodeCache.has(cacheKey)) {
    return clientGeocodeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
      {
        headers: {
          "User-Agent": "SRTravels/1.0 (https://sr-travels.vercel.app)",
        },
      }
    );

    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    if (!data.display_name) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const parts = data.display_name.split(",");
    const address = parts.slice(0, 3).join(",").trim();

    clientGeocodeCache.set(cacheKey, address);
    return address;
  } catch (err) {
    console.error("Client reverseGeocode error:", err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Fetches driving route via server API route /api/route.
 * Cached by coordinate key. Falls back to straight-line estimate if router fails.
 */
export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<MapRoute> {
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;

  if (clientRouteCache.has(cacheKey)) {
    return clientRouteCache.get(cacheKey)!;
  }

  try {
    const url = `/api/route?fromLat=${origin.lat}&fromLng=${origin.lng}&toLat=${destination.lat}&toLng=${destination.lng}`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      const result: MapRoute = {
        distanceKm: data.distanceKm,
        durationMins: data.durationMin,
        coordinates: data.geometry,
        isApproximate: data.isApproximate ?? false,
      };

      clientRouteCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn("Client getRoute fallback:", err);
  }

  // Fallback calculation in case of fetch failure
  const dx = (origin.lat - destination.lat) * 111;
  const dy = (origin.lng - destination.lng) * 105;
  const dist = Math.max(10, Math.round(Math.hypot(dx, dy) * 1.35));

  const fallbackResult: MapRoute = {
    distanceKm: dist,
    durationMins: Math.round((dist / 45) * 60),
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    isApproximate: true,
  };

  clientRouteCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

export const mapsAdapter: MapAdapter = {
  searchPlaces,
  reverseGeocode,
  getRoute,
};
