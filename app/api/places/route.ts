import { NextRequest, NextResponse } from "next/server";

export interface PlaceResult {
  shortName: string;
  secondaryAddress: string;
  displayName: string;
  lat: number;
  lng: number;
}

// In-memory cache for API requests to avoid redundant provider calls
const placesCache = new Map<string, { timestamp: number; data: PlaceResult[] }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Tamil Nadu Bounding Box (viewbox=76.0,8.0,80.5,13.5)
const TN_VIEWBOX = "76.0,8.0,80.5,13.5";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.data });
  }

  const locationIqKey = process.env.LOCATIONIQ_API_KEY;
  const geoapifyKey = process.env.GEOAPIFY_API_KEY;

  let results: PlaceResult[] = [];

  try {
    if (locationIqKey) {
      // 1. LocationIQ Autocomplete Provider
      const url = `https://api.locationiq.com/v1/autocomplete?key=${locationIqKey}&q=${encodeURIComponent(
        q
      )}&countrycodes=in&viewbox=${TN_VIEWBOX}&bounded=0&limit=5&format=json&accept-language=en`;

      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (res.ok) {
        const data = await res.json();
        results = data.slice(0, 5).map((item: any) => {
          const parts = (item.display_name || "").split(",");
          const shortName = parts[0]?.trim() || item.display_place || item.display_name;
          const secondary = parts.slice(1, 4).join(",").trim();
          return {
            shortName,
            secondaryAddress: secondary,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
      }
    } else if (geoapifyKey) {
      // 2. Geoapify Geocoding / Autocomplete Provider
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        q
      )}&filter=countrycode:in&bias=rect:76.0,8.0,80.5,13.5&lang=en&limit=5&apiKey=${geoapifyKey}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        results = (data.features || []).slice(0, 5).map((feat: any) => {
          const props = feat.properties || {};
          const shortName = props.name || props.formatted?.split(",")[0] || q;
          const secondary = [props.city, props.state, props.country].filter(Boolean).join(", ");
          return {
            shortName,
            secondaryAddress: secondary || props.formatted,
            displayName: props.formatted,
            lat: feat.geometry.coordinates[1],
            lng: feat.geometry.coordinates[0],
          };
        });
      }
    }

    // Fallback: OpenStreetMap Nominatim with Tamil Nadu bias and English results
    if (results.length === 0) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=in&viewbox=${TN_VIEWBOX}&bounded=0&limit=5&accept-language=en`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "SRTravels/1.0 (https://sr-travels.vercel.app)",
          "Accept-Language": "en",
        },
      });

      if (res.ok) {
        const data = await res.json();
        results = data.slice(0, 5).map((item: any) => {
          const parts = (item.display_name || "").split(",");
          const shortName = parts[0]?.trim() || item.display_name;
          const secondary = parts.slice(1, 4).join(",").trim();
          return {
            shortName,
            secondaryAddress: secondary,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
      }
    }

    // Cache results
    placesCache.set(cacheKey, { timestamp: Date.now(), data: results });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Places API error:", err);
    return NextResponse.json({ results: [] });
  }
}
