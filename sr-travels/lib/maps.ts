export interface MapLocation {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
}

export interface MapRoute {
  distanceKm: number;
  durationMins: number;
  coordinates: [number, number][];
}

export interface MapAdapter {
  searchPlaces(query: string): Promise<MapLocation[]>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
  getRoute(origin: MapLocation, destination: MapLocation): Promise<MapRoute>;
}

// Tamil Nadu Bounding Box (viewbox=76.0,8.0,80.5,13.5)
const TN_VIEWBOX = "76.0,8.0,80.5,13.5";

// In-Memory Caches for Rate-Limit Safety & Performance
const searchCache = new Map<string, MapLocation[]>();
const reverseGeocodeCache = new Map<string, string>();
const routeCache = new Map<string, MapRoute>();

/**
 * Searches places using OpenStreetMap Nominatim API, biased to India & Tamil Nadu viewbox.
 * Utilizes in-memory caching to comply with OSM rate limits.
 */
export async function searchPlaces(query: string): Promise<MapLocation[]> {
  const cleanQuery = query ? query.trim().toLowerCase() : "";
  if (!cleanQuery || cleanQuery.length < 2) return [];

  // Check cache
  if (searchCache.has(cleanQuery)) {
    return searchCache.get(cleanQuery)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=in&viewbox=${TN_VIEWBOX}&bounded=0&limit=6`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "SRTravels/1.0 (https://sr-travels.vercel.app)",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    const results: MapLocation[] = data.map((item: any) => {
      const parts = item.display_name.split(",");
      const title = parts[0]?.trim() || item.display_name;
      const subtitle = parts.slice(1, 3).join(",").trim();
      const shortName = subtitle ? `${title}, ${subtitle}` : title;

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        shortName,
      };
    });

    searchCache.set(cleanQuery, results);
    return results;
  } catch (err) {
    console.error("Error in searchPlaces:", err);
    return [];
  }
}

/**
 * Reverse geocodes lat/lng coordinates to a readable address string.
 * Utilizes in-memory caching to minimize Nominatim API calls.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SRTravels/1.0 (https://sr-travels.vercel.app)",
      },
    });

    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    if (!data.display_name) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const parts = data.display_name.split(",");
    const address = parts.slice(0, 3).join(",").trim();

    reverseGeocodeCache.set(cacheKey, address);
    return address;
  } catch (err) {
    console.error("Error in reverseGeocode:", err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Fetches driving route between origin and destination using OSRM driving profile.
 * Caches routes in-memory to prevent repeated route requests for identical coordinates.
 */
export async function getRoute(
  origin: MapLocation,
  destination: MapLocation
): Promise<MapRoute> {
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMins = Math.round(route.duration / 60);
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const routeResult: MapRoute = {
          distanceKm,
          durationMins,
          coordinates,
        };

        routeCache.set(cacheKey, routeResult);
        return routeResult;
      }
    }
  } catch (err) {
    console.warn("OSRM route fetch fallback:", err);
  }

  return {
    distanceKm: 0,
    durationMins: 0,
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
  };
}

export const mapsAdapter: MapAdapter = {
  searchPlaces,
  reverseGeocode,
  getRoute,
};
