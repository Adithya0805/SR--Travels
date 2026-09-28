import { NextRequest, NextResponse } from "next/server";

export interface RouteResponse {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
  isApproximate: boolean;
}

// In-memory cache by coordinate key
const routeCache = new Map<string, RouteResponse>();

/** Haversine formula to compute great-circle distance in km */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromLat = parseFloat(searchParams.get("fromLat") || "");
  const fromLng = parseFloat(searchParams.get("fromLng") || "");
  const toLat = parseFloat(searchParams.get("toLat") || "");
  const toLng = parseFloat(searchParams.get("toLng") || "");

  if (
    isNaN(fromLat) ||
    isNaN(fromLng) ||
    isNaN(toLat) ||
    isNaN(toLng) ||
    (fromLat === toLat && fromLng === toLng)
  ) {
    return NextResponse.json(
      { error: "Invalid coordinate parameters provided." },
      { status: 400 }
    );
  }

  const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}->${toLat.toFixed(4)},${toLng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return NextResponse.json(routeCache.get(cacheKey)!);
  }

  try {
    // 1. Try OSRM / Keyed Driving Router
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);
        const geometry: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const responseData: RouteResponse = {
          distanceKm,
          durationMin,
          geometry,
          isApproximate: false,
        };

        routeCache.set(cacheKey, responseData);
        return NextResponse.json(responseData);
      }
    }
  } catch (err) {
    console.warn("External route service unavailable, utilizing straight-line road estimate:", err);
  }

  // 2. Fallback: Straight-line estimate with 1.35x road winding factor and 45 km/h average speed
  const straightLineKm = haversineDistance(fromLat, fromLng, toLat, toLng);
  const estimatedDistanceKm = Math.max(10, Math.round(straightLineKm * 1.35));
  const estimatedDurationMin = Math.round((estimatedDistanceKm / 45) * 60);

  const fallbackData: RouteResponse = {
    distanceKm: estimatedDistanceKm,
    durationMin: estimatedDurationMin,
    geometry: [
      [fromLat, fromLng],
      [toLat, toLng],
    ],
    isApproximate: true,
  };

  routeCache.set(cacheKey, fallbackData);
  return NextResponse.json(fallbackData);
}
