import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yxefcwoirmdlqadqntjm.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZWZjd29pcm1kbHFhZHFudGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NjY4MTIsImV4cCI6MjEwNjE0MjgxMn0.g0ukMCrZpImdamdv1MOMqUeCkkPqcZcA6vd8Dt_mhiQ";

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Upstash Redis Rate Limiter if credentials exist
let upstashRatelimit: Ratelimit | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
  });
}

// Fallback in-memory rate limiter if Upstash env vars are missing
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const ipRequestMap = new Map<string, number[]>();

function isInMemoryRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestMap.get(ip) || [];
  const validTimestamps = timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  ipRequestMap.set(ip, validTimestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Extract client IP from x-forwarded-for header
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    // 2. Upstash Redis / Fallback Rate Limiting (5 requests per 10 mins per IP)
    if (upstashRatelimit) {
      const { success } = await upstashRatelimit.limit(`booking_${clientIp}`);
      if (!success) {
        return NextResponse.json(
          {
            error:
              "Too many booking attempts from your location. Please wait 10 minutes before trying again.",
          },
          { status: 429 }
        );
      }
    } else if (isInMemoryRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error:
            "Too many booking attempts from your location. Please wait 10 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      booking_code,
      name,
      phone,
      pickup_address,
      pickup_lat,
      pickup_lng,
      drop_address,
      drop_lat,
      drop_lng,
      distance_km,
      trip_type,
      drive_mode,
      days,
      vehicle_id,
      fare_total,
      travel_datetime,
      website, // Honeypot field
      form_start_time, // Form render timestamp
    } = body;

    // 3. Honeypot check (reject if honeypot field is populated by bots)
    if (website && typeof website === "string" && website.trim().length > 0) {
      console.warn(`[Security Alert] Honeypot triggered by IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Automated submission detected." },
        { status: 400 }
      );
    }

    // 4. Minimum time on form check (reject if submitted in under 3 seconds)
    if (form_start_time) {
      const elapsedMs = Date.now() - Number(form_start_time);
      if (elapsedMs < 3000) {
        console.warn(
          `[Security Alert] Fast submission (${elapsedMs}ms) by IP: ${clientIp}`
        );
        return NextResponse.json(
          {
            error:
              "Form submitted too quickly. Please review your details before confirming.",
          },
          { status: 400 }
        );
      }
    }

    // 5. Server-Side Input Validation
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 60) {
      return NextResponse.json(
        { error: "Name must be between 2 and 60 characters long." },
        { status: 400 }
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return NextResponse.json(
        { error: "Phone number must be a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    if (
      typeof fare_total !== "number" ||
      isNaN(fare_total) ||
      fare_total <= 0 ||
      fare_total >= 100000
    ) {
      return NextResponse.json(
        { error: "Invalid fare total amount." },
        { status: 400 }
      );
    }

    if (
      typeof distance_km !== "number" ||
      isNaN(distance_km) ||
      distance_km <= 0 ||
      distance_km >= 3000
    ) {
      return NextResponse.json(
        { error: "Invalid trip distance." },
        { status: 400 }
      );
    }

    // Validate travel_datetime is not in the past
    if (travel_datetime) {
      const travelDate = new Date(travel_datetime);
      if (isNaN(travelDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid travel date format." },
          { status: 400 }
        );
      }
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (travelDate < oneHourAgo) {
        return NextResponse.json(
          { error: "Travel date and time cannot be in the past." },
          { status: 400 }
        );
      }
    }

    // 6. Insert booking into Supabase using server-side client (service role)
    const { data, error } = await supabaseServer
      .from("bookings")
      .insert([
        {
          booking_code,
          name: trimmedName,
          phone: trimmedPhone,
          pickup_address: pickup_address || null,
          pickup_lat: pickup_lat || null,
          pickup_lng: pickup_lng || null,
          drop_address: drop_address || null,
          drop_lat: drop_lat || null,
          drop_lng: drop_lng || null,
          distance_km,
          trip_type,
          drive_mode,
          days: days || 1,
          vehicle_id,
          fare_total,
          travel_datetime,
          status: "new",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase API insert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save booking to database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking_code,
      data,
    });
  } catch (err: any) {
    console.error("Booking API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
