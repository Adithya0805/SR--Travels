import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";
import faqData from "@/data/faq.json";

// Rate limiter: 15 messages per 10 minutes per IP
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
    limiter: Ratelimit.slidingWindow(15, "10 m"),
    analytics: true,
  });
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 15;
const assistantIpMap = new Map<string, number[]>();

function isAssistantRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = assistantIpMap.get(ip) || [];
  const validTimestamps = timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    assistantIpMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  assistantIpMap.set(ip, validTimestamps);
  return false;
}

// Known coordinates for quick location lookups in Tamil Nadu / South India
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; label: string; address: string }> = {
  ambur: { lat: 12.7904, lng: 78.7166, label: "Ambur", address: "Ambur, Tirupathur District, Tamil Nadu" },
  vellore: { lat: 12.9165, lng: 79.1325, label: "Vellore", address: "Vellore, Tamil Nadu" },
  chennai: { lat: 13.0827, lng: 80.2707, label: "Chennai", address: "Chennai, Tamil Nadu" },
  bangalore: { lat: 12.9716, lng: 77.5946, label: "Bangalore", address: "Bengaluru, Karnataka" },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: "Bangalore", address: "Bengaluru, Karnataka" },
  tirupati: { lat: 13.6288, lng: 79.4192, label: "Tirupati", address: "Tirupati, Andhra Pradesh" },
  hosur: { lat: 12.7409, lng: 77.8253, label: "Hosur", address: "Hosur, Tamil Nadu" },
  salem: { lat: 11.6643, lng: 78.1460, label: "Salem", address: "Salem, Tamil Nadu" },
  coimbatore: { lat: 11.0168, lng: 76.9558, label: "Coimbatore", address: "Coimbatore, Tamil Nadu" },
  vaniyambadi: { lat: 12.6825, lng: 78.6186, label: "Vaniyambadi", address: "Vaniyambadi, Tamil Nadu" },
};

export interface FunctionCallItem {
  name: string;
  args: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check (15 messages per 10 mins per IP)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    if (upstashRatelimit) {
      const { success } = await upstashRatelimit.limit(`assistant_${clientIp}`);
      if (!success) {
        return NextResponse.json(
          {
            error: "Too many requests. Please wait a moment.",
            functionCalls: [],
            reply: "Rate limit reached. Please wait a few minutes before sending another message.",
          },
          { status: 429 }
        );
      }
    } else if (isAssistantRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment.",
          functionCalls: [],
          reply: "Rate limit reached. Please wait a few minutes before sending another message.",
        },
        { status: 429 }
      );
    }

    // 2. Parse payload: message + current bookingState
    const body = await request.json();
    const { message, bookingState = {} } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required", functionCalls: [], reply: "How can I help you with your booking?" },
        { status: 400 }
      );
    }

    const cleanMsg = message.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // 3. If GEMINI_API_KEY is present, execute via Gemini API with function calling
    if (apiKey) {
      try {
        const geminiResult = await callGeminiWithTools(cleanMsg, bookingState, apiKey);
        if (geminiResult) {
          return NextResponse.json(geminiResult);
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to local reasoning engine:", geminiErr);
      }
    }

    // 4. Grounded Local Reasoning Engine (used when API key is missing or network fallback)
    const localResult = executeLocalAssistant(cleanMsg, bookingState);
    return NextResponse.json(localResult);
  } catch (err: any) {
    console.error("Assistant API handler error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        functionCalls: [],
        reply: "I had trouble processing that. Please try again or call us directly.",
      },
      { status: 500 }
    );
  }
}

/**
 * Calls Gemini REST API with strict function declarations and context.
 */
async function callGeminiWithTools(
  message: string,
  bookingState: any,
  apiKey: string
): Promise<{ functionCalls: FunctionCallItem[]; reply: string } | null> {
  const systemInstruction = `You are the SR Travels booking assistant. Only use the provided functions and the given SR Travels data. Never invent prices, policies, or vehicle availability. If a request is ambiguous (e.g. missing date), ask ONE short clarifying question before calling a function. Keep replies under 2 sentences.

CURRENT BOOKING STATE:
- Pickup: ${bookingState.pickup?.label || "Not set"} (${bookingState.pickup?.address || "None"})
- Drop: ${bookingState.drop?.label || "Not set"} (${bookingState.drop?.address || "None"})
- Date: ${bookingState.date || "Not set"}
- Time: ${bookingState.time || "Not set"}
- Trip Type: ${bookingState.tripType || "one-way"}
- Service Mode: ${bookingState.driveMode || "with-driver"}
- Vehicle: ${bookingState.vehicleId || "sedan"}
- Distance: ${bookingState.route?.distanceKm || 0} km

OFFICIAL POLICIES & RATES:
- Cancellation: ${siteConfig.cancellationPolicy}
- Driver Bata: ₹${siteConfig.driverBataPerDay}/day for with-driver trips.
- Baseline Fuel Price: ₹${siteConfig.baselineFuelPrice}/L.
- Minimum Distance: No minimum distance requirement — all trips are billed purely on actual distance travelled.
- Vehicles: Sedan (4 seats, ₹14/km), SUV (6 seats, ₹20/km), MUV Innova Crysta (7 seats, ₹21/km).
- Self Drive rentals: 250 km/day included (Sedan ₹1800/day, SUV ₹2800/day, MUV ₹3200/day).`;

  const tools = [
    {
      function_declarations: [
        {
          name: "setPickup",
          description: "Set pickup location city or address on the booking card",
          parameters: {
            type: "OBJECT",
            properties: {
              label: { type: "STRING", description: "City or place name, e.g. Ambur or Chennai" },
              address: { type: "STRING", description: "Full address string" },
            },
            required: ["label", "address"],
          },
        },
        {
          name: "setDrop",
          description: "Set drop-off location city or address on the booking card",
          parameters: {
            type: "OBJECT",
            properties: {
              label: { type: "STRING", description: "City or destination name, e.g. Vellore or Bangalore" },
              address: { type: "STRING", description: "Full address string" },
            },
            required: ["label", "address"],
          },
        },
        {
          name: "setDate",
          description: "Set travel date in YYYY-MM-DD format",
          parameters: {
            type: "OBJECT",
            properties: {
              date: { type: "STRING", description: "Date formatted as YYYY-MM-DD" },
            },
            required: ["date"],
          },
        },
        {
          name: "setTime",
          description: "Set departure time in HH:mm format (e.g. 09:00)",
          parameters: {
            type: "OBJECT",
            properties: {
              time: { type: "STRING", description: "Time formatted as HH:mm" },
            },
            required: ["time"],
          },
        },
        {
          name: "setTripType",
          description: "Set trip type: one-way or round-trip",
          parameters: {
            type: "OBJECT",
            properties: {
              tripType: { type: "STRING", enum: ["one-way", "round-trip"] },
            },
            required: ["tripType"],
          },
        },
        {
          name: "setDriveMode",
          description: "Set service mode: with-driver or self-drive",
          parameters: {
            type: "OBJECT",
            properties: {
              driveMode: { type: "STRING", enum: ["with-driver", "self-drive"] },
            },
            required: ["driveMode"],
          },
        },
        {
          name: "setVehicle",
          description: "Select vehicle tier: sedan, suv, or muv",
          parameters: {
            type: "OBJECT",
            properties: {
              vehicleId: { type: "STRING", enum: ["sedan", "suv", "muv"] },
            },
            required: ["vehicleId"],
          },
        },
        {
          name: "getFareQuote",
          description: "Calculate real authoritative fare quote using lib/fare.ts with current booking state",
          parameters: {
            type: "OBJECT",
            properties: {},
          },
        },
        {
          name: "answerFromFaq",
          description: "Answer questions using data/faq.json and siteConfig.ts. Must defer if question is not covered.",
          parameters: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING", description: "The policy or service question" },
            },
            required: ["question"],
          },
        },
      ],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: message }] }],
      tools,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content) return null;

  const parts = candidate.content.parts || [];
  const functionCalls: FunctionCallItem[] = [];
  let modelText = "";

  for (const part of parts) {
    if (part.functionCall) {
      const { name, args } = part.functionCall;
      functionCalls.push({ name, args });
    }
    if (part.text) {
      modelText += part.text;
    }
  }

  // Execute special functions (getFareQuote / answerFromFaq)
  const clientFunctionCalls: FunctionCallItem[] = [];
  let reply = modelText.trim();

  for (const fc of functionCalls) {
    if (fc.name === "getFareQuote") {
      const quote = executeFareQuote(bookingState);
      reply = quote.reply;
    } else if (fc.name === "answerFromFaq") {
      const faqAnswer = executeFaqAnswer(fc.args.question || message);
      reply = faqAnswer;
    } else {
      // Enrich location coordinates if missing
      if (fc.name === "setPickup" || fc.name === "setDrop") {
        const placeKey = (fc.args.label || "").toLowerCase();
        if (KNOWN_COORDINATES[placeKey]) {
          fc.args.lat = KNOWN_COORDINATES[placeKey].lat;
          fc.args.lng = KNOWN_COORDINATES[placeKey].lng;
          fc.args.address = fc.args.address || KNOWN_COORDINATES[placeKey].address;
        }
      }
      clientFunctionCalls.push(fc);
    }
  }

  if (!reply) {
    if (clientFunctionCalls.length > 0) {
      reply = "I've updated your trip details on the booking card.";
    } else {
      reply = "How can I assist with your SR Travels booking today?";
    }
  }

  return { functionCalls: clientFunctionCalls, reply };
}

/**
 * Authoritative Local Assistant reasoning engine.
 * Fully grounded in lib/fare.ts, data/faq.json, and siteConfig.ts.
 */
function executeLocalAssistant(
  message: string,
  bookingState: any
): { functionCalls: FunctionCallItem[]; reply: string } {
  const lower = message.toLowerCase();
  const functionCalls: FunctionCallItem[] = [];
  let reply = "";

  // 1. Vehicle Selection
  if (lower.includes("innova") || lower.includes("muv") || lower.includes("7 seater") || lower.includes("7-seater")) {
    functionCalls.push({ name: "setVehicle", args: { vehicleId: "muv" } });
  } else if (lower.includes("suv") || lower.includes("ertiga") || lower.includes("carens") || lower.includes("6 seater") || lower.includes("6-seater")) {
    functionCalls.push({ name: "setVehicle", args: { vehicleId: "suv" } });
  } else if (lower.includes("sedan") || lower.includes("dzire") || lower.includes("etios") || lower.includes("4 seater") || lower.includes("4-seater")) {
    functionCalls.push({ name: "setVehicle", args: { vehicleId: "sedan" } });
  }

  // 2. Drive Mode
  if (lower.includes("self drive") || lower.includes("self-drive") || lower.includes("without driver")) {
    functionCalls.push({ name: "setDriveMode", args: { driveMode: "self-drive" } });
  } else if (lower.includes("with driver") || lower.includes("with-driver") || lower.includes("cab") || lower.includes("taxi")) {
    functionCalls.push({ name: "setDriveMode", args: { driveMode: "with-driver" } });
  }

  // 3. Trip Type
  if (lower.includes("round trip") || lower.includes("round-trip") || lower.includes("both ways") || lower.includes("return")) {
    functionCalls.push({ name: "setTripType", args: { tripType: "round-trip" } });
  } else if (lower.includes("one way") || lower.includes("one-way") || lower.includes("single trip")) {
    functionCalls.push({ name: "setTripType", args: { tripType: "one-way" } });
  }

  // 4. Date Extraction ("today", "tomorrow", "day after tomorrow", or YYYY-MM-DD)
  const now = new Date();
  if (lower.includes("day after tomorrow")) {
    const target = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dateStr = target.toISOString().split("T")[0];
    functionCalls.push({ name: "setDate", args: { date: dateStr } });
  } else if (lower.includes("tomorrow")) {
    const target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = target.toISOString().split("T")[0];
    functionCalls.push({ name: "setDate", args: { date: dateStr } });
  } else if (lower.includes("today")) {
    const dateStr = now.toISOString().split("T")[0];
    functionCalls.push({ name: "setDate", args: { date: dateStr } });
  } else {
    const dateMatch = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
    if (dateMatch) {
      functionCalls.push({ name: "setDate", args: { date: dateMatch[1] } });
    }
  }

  // 5. Locations ("from X to Y")
  const fromToMatch = lower.match(/from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:on|at|for|tomorrow|today|day|in)|$)/i);
  if (fromToMatch) {
    const fromCity = fromToMatch[1].trim().toLowerCase();
    const toCity = fromToMatch[2].trim().toLowerCase();

    const fromCoord = KNOWN_COORDINATES[fromCity] || {
      lat: 12.7904,
      lng: 78.7166,
      label: capitalize(fromCity),
      address: `${capitalize(fromCity)}, Tamil Nadu`,
    };
    const toCoord = KNOWN_COORDINATES[toCity] || {
      lat: 12.9165,
      lng: 79.1325,
      label: capitalize(toCity),
      address: `${capitalize(toCity)}, Tamil Nadu`,
    };

    functionCalls.push({
      name: "setPickup",
      args: { label: fromCoord.label, address: fromCoord.address, lat: fromCoord.lat, lng: fromCoord.lng },
    });
    functionCalls.push({
      name: "setDrop",
      args: { label: toCoord.label, address: toCoord.address, lat: toCoord.lat, lng: toCoord.lng },
    });
  } else {
    // Single destination detection (e.g. "Fare to Chennai", "Trip to Bangalore")
    const toMatch = lower.match(/\b(?:to|drop at)\s+([a-zA-Z]+)\b/i);
    if (toMatch) {
      const city = toMatch[1].trim().toLowerCase();
      if (KNOWN_COORDINATES[city]) {
        functionCalls.push({
          name: "setDrop",
          args: {
            label: KNOWN_COORDINATES[city].label,
            address: KNOWN_COORDINATES[city].address,
            lat: KNOWN_COORDINATES[city].lat,
            lng: KNOWN_COORDINATES[city].lng,
          },
        });
      }
    }
  }

  // 6. Check for Fare Quotes or FAQ queries
  if (
    lower.includes("fare") ||
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("rate") ||
    lower.includes("how much")
  ) {
    // If it's a specific question about a 25km trip
    if (lower.includes("25km") || lower.includes("25 km")) {
      const tripFare = calculateFare({
        vehicle: siteConfig.vehicles[0],
        distanceKm: 25,
        tripType: "one-way",
        driveMode: "with-driver",
      });
      reply = `A 25 km sedan trip is ₹${tripFare.total} (billed at 25 km @ ₹${siteConfig.vehicles[0].ratePerKm}/km + ₹${tripFare.fuelAdjustment}/km fuel adjustment + ₹${siteConfig.driverBataPerDay} driver bata, with no minimum km floor).`;
      return { functionCalls, reply };
    }

    // Call real getFareQuote
    const quote = executeFareQuote(bookingState);
    reply = quote.reply;
    return { functionCalls, reply };
  }

  // 7. Check for Policy / FAQ queries
  const isPolicyQuery =
    lower.includes("cancellation") ||
    lower.includes("cancel") ||
    lower.includes("bata") ||
    lower.includes("toll") ||
    lower.includes("parking") ||
    lower.includes("permit") ||
    lower.includes("payment") ||
    lower.includes("ac") ||
    lower.includes("operating hour") ||
    lower.includes("luggage");

  if (isPolicyQuery) {
    reply = executeFaqAnswer(message);
    return { functionCalls, reply };
  }

  // 8. If locations were updated, respond with a helpful summary
  if (functionCalls.some((f) => f.name === "setPickup" || f.name === "setDrop")) {
    const p = functionCalls.find((f) => f.name === "setPickup")?.args.label || bookingState.pickup?.label;
    const d = functionCalls.find((f) => f.name === "setDrop")?.args.label || bookingState.drop?.label;
    const v = functionCalls.find((f) => f.name === "setVehicle")?.args.vehicleId || bookingState.vehicleId || "Sedan";

    reply = `I've set your route from ${p} to ${d} in a ${capitalize(v)}. You can view fares or adjust travel time right here.`;
    return { functionCalls, reply };
  }

  if (functionCalls.some((f) => f.name === "setVehicle")) {
    const v = functionCalls.find((f) => f.name === "setVehicle")?.args.vehicleId;
    reply = `Switched vehicle to ${capitalize(v)}. Tap 'See Vehicles & Fare' to continue.`;
    return { functionCalls, reply };
  }

  if (functionCalls.some((f) => f.name === "setDriveMode")) {
    const m = functionCalls.find((f) => f.name === "setDriveMode")?.args.driveMode;
    reply = `Updated service to ${m === "self-drive" ? "Self Drive" : "With Driver"}.`;
    return { functionCalls, reply };
  }

  // Default deferral for anything outside FAQ or booking operations
  reply = executeFaqAnswer(message);
  return { functionCalls, reply };
}

/**
 * Calculates REAL fare using lib/fare.ts
 */
function executeFareQuote(bookingState: any): { total: number; reply: string } {
  const vehicleId = bookingState.vehicleId || "sedan";
  const vehicle = siteConfig.vehicles.find((v) => v.id === vehicleId) || siteConfig.vehicles[0];

  let distanceKm = bookingState.route?.distanceKm || 0;
  if (!distanceKm) {
    if (bookingState.pickup && bookingState.drop) {
      // Coordinate estimation if route hasn't been fetched yet
      const dx = (bookingState.pickup.lat - bookingState.drop.lat) * 111;
      const dy = (bookingState.pickup.lng - bookingState.drop.lng) * 105;
      distanceKm = Math.max(10, Math.round(Math.hypot(dx, dy) * 1.35));
    } else {
      distanceKm = 100; // Default sample
    }
  }

  const fareResult = calculateFare({
    vehicle,
    distanceKm,
    tripType: bookingState.tripType || "one-way",
    driveMode: bookingState.driveMode || "with-driver",
    days: bookingState.days || 1,
  });

  const pLabel = bookingState.pickup?.label || "your pickup";
  const dLabel = bookingState.drop?.label || "destination";

  const replyText = `Estimated fare for ${vehicle.name.split(" ")[0]} from ${pLabel} to ${dLabel} (${fareResult.billableKm} km) is ₹${fareResult.total.toLocaleString()} (including ₹${fareResult.effectiveRatePerKm}/km effective rate and ₹${siteConfig.driverBataPerDay} driver bata).`;

  return { total: fareResult.total, reply: replyText };
}

/**
 * Strict FAQ matcher. Must ONLY answer using data/faq.json and siteConfig.
 * If not covered, defer with "I'll have the SR Travels team confirm that."
 */
function executeFaqAnswer(question: string): string {
  const q = question.toLowerCase();

  // 1. Cancellation policy
  if (q.includes("cancel") || q.includes("cancellation") || q.includes("refund")) {
    return siteConfig.cancellationPolicy;
  }

  // 2. Search data/faq.json
  for (const item of faqData) {
    const itemQ = item.question.toLowerCase();
    const itemA = item.answer;

    if (
      (q.includes("driver bata") || q.includes("bata")) && itemQ.includes("driver bata") ||
      (q.includes("toll") || q.includes("parking") || q.includes("permit")) && itemQ.includes("tolls") ||
      (q.includes("payment") || q.includes("upi") || q.includes("cash") || q.includes("pay")) && itemQ.includes("payment") ||
      (q.includes("minimum") || q.includes("min km") || q.includes("floor")) && itemQ.includes("minimum") ||
      (q.includes("self drive") || q.includes("self-drive") || q.includes("without driver")) && itemQ.includes("self-drive") ||
      (q.includes("operating hour") || q.includes("24/7") || q.includes("open")) && itemQ.includes("operating hours") ||
      (q.includes("air conditioned") || q.includes("ac")) && itemQ.includes("air-conditioned") ||
      (q.includes("fuel") || q.includes("petrol") || q.includes("diesel")) && itemQ.includes("fuel")
    ) {
      return itemA;
    }
  }

  // Deferral for unknown questions
  return "I'll have the SR Travels team confirm that.";
}

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
