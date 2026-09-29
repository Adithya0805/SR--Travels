import { NextResponse } from "next/server";

interface CachedWeather {
  timestamp: number;
  data: any;
}

// In-memory cache fallback with 3-hour TTL (10,800,000 ms)
const weatherCache = new Map<string, CachedWeather>();
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const date = searchParams.get("date");
    const label = searchParams.get("label") || "destination";

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude required" },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const cacheKey = `${parsedLat.toFixed(3)},${parsedLng.toFixed(3)}`;
    const now = Date.now();

    // Check in-memory cache
    const cached = weatherCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        formatAdvisory(cached.data, date, label)
      );
    }

    // Call Open-Meteo with 3-hour Next.js revalidation
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${parsedLat}&longitude=${parsedLng}&daily=temperature_2m_max,precipitation_probability_max,weather_code&timezone=auto`;

    const res = await fetch(openMeteoUrl, {
      next: { revalidate: 10800 }, // 3 hours
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const forecastData = await res.json();
    weatherCache.set(cacheKey, { timestamp: now, data: forecastData });

    return NextResponse.json(formatAdvisory(forecastData, date, label));
  } catch (err: any) {
    console.error("Weather advisory API error:", err);
    // Silent fallback: no advisory if weather service is unreachable
    return NextResponse.json({
      hasAdvisory: false,
      advisoryType: null,
      message: null,
    });
  }
}

function formatAdvisory(forecast: any, travelDate: string | null, dropLabel: string) {
  const daily = forecast?.daily;
  if (!daily || !daily.time || !daily.time.length) {
    return { hasAdvisory: false, advisoryType: null, message: null };
  }

  // Find index for travelDate or default to day 0 (today)
  let dayIdx = 0;
  if (travelDate && daily.time.includes(travelDate)) {
    dayIdx = daily.time.indexOf(travelDate);
  }

  const rainProb = daily.precipitation_probability_max?.[dayIdx] ?? 0;
  const maxTemp = daily.temperature_2m_max?.[dayIdx] ?? 0;
  const weatherCode = daily.weather_code?.[dayIdx] ?? 0;

  // Criteria:
  // 1. Rain expected if precipitation probability > 50%
  // 2. Heavy heat advisory if max temp > 40°C
  // Otherwise nothing
  if (rainProb > 50 || weatherCode >= 51 && weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82) {
    return {
      hasAdvisory: true,
      advisoryType: "rain" as const,
      message: `Rain expected in ${dropLabel} around your travel time`,
      details: { tempMax: maxTemp, rainProbMax: rainProb, weatherCode },
    };
  }

  if (maxTemp > 40) {
    return {
      hasAdvisory: true,
      advisoryType: "heat" as const,
      message: "Heavy heat advisory, carry water",
      details: { tempMax: maxTemp, rainProbMax: rainProb, weatherCode },
    };
  }

  return {
    hasAdvisory: false,
    advisoryType: null,
    message: null,
    details: { tempMax: maxTemp, rainProbMax: rainProb, weatherCode },
  };
}
