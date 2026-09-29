import { describe, it, expect, beforeEach } from "vitest";
import { POST as assistantHandler } from "../app/api/assistant/route";
import { GET as weatherHandler } from "../app/api/weather/route";
import { calculateFare } from "./fare";
import { siteConfig } from "../config/siteConfig";

describe("AI Trip Assistant API & Verification Tests", () => {
  const sampleBookingState = {
    pickup: { label: "Ambur", address: "Ambur, Tamil Nadu", lat: 12.7904, lng: 78.7166 },
    drop: { label: "Vellore", address: "Vellore, Tamil Nadu", lat: 12.9165, lng: 79.1325 },
    date: "2026-10-01",
    time: "09:00",
    tripType: "one-way" as const,
    driveMode: "with-driver" as const,
    days: 1,
    vehicleId: "sedan",
    route: { distanceKm: 50, durationMin: 60, geometry: [] },
  };

  it("should parse 'book a sedan from Ambur to Vellore day after tomorrow' and set all 4 fields correctly", async () => {
    const req = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.50" },
      body: JSON.stringify({
        message: "book a sedan from Ambur to Vellore day after tomorrow",
        bookingState: {},
      }),
    });

    const res = await assistantHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const calls = data.functionCalls;

    // 1. Vehicle set to sedan
    const vehicleCall = calls.find((c: any) => c.name === "setVehicle");
    expect(vehicleCall).toBeDefined();
    expect(vehicleCall.args.vehicleId).toBe("sedan");

    // 2. Pickup set to Ambur
    const pickupCall = calls.find((c: any) => c.name === "setPickup");
    expect(pickupCall).toBeDefined();
    expect(pickupCall.args.label.toLowerCase()).toContain("ambur");

    // 3. Drop set to Vellore
    const dropCall = calls.find((c: any) => c.name === "setDrop");
    expect(dropCall).toBeDefined();
    expect(dropCall.args.label.toLowerCase()).toContain("vellore");

    // 4. Date set to day after tomorrow (YYYY-MM-DD)
    const dateCall = calls.find((c: any) => c.name === "setDate");
    expect(dateCall).toBeDefined();
    const expectedDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    expect(dateCall.args.date).toBe(expectedDate);

    expect(data.reply).toBeTruthy();
    expect(data.reply.length).toBeGreaterThan(10);
  });

  it("should return the REAL calculateFare() quote for 'what is the fare', never a guessed number", async () => {
    // 50 km distance for Sedan with driver -> outstation 130 km floor @ ₹17/km + ₹400 bata = ₹2,610
    const realFare = calculateFare({
      vehicle: siteConfig.vehicles[0],
      distanceKm: 50,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(realFare.total).toBe(2610);

    const req = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.51" },
      body: JSON.stringify({
        message: "what is the fare?",
        bookingState: sampleBookingState,
      }),
    });

    const res = await assistantHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    // Must contain the exact real fare total ₹2,610
    expect(data.reply).toContain("₹2,610");
    expect(data.reply).toContain("130 km billable");
  });

  it("should accurately calculate and explain a 25km local trip fare", async () => {
    const localFare = calculateFare({
      vehicle: siteConfig.vehicles[0],
      distanceKm: 25,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(localFare.total).toBe(525);

    const req = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.52" },
      body: JSON.stringify({
        message: "Fare for a 25km local trip?",
        bookingState: sampleBookingState,
      }),
    });

    const res = await assistantHandler(req);
    const data = await res.json();
    expect(data.reply).toContain("₹525");
    expect(data.reply).toContain("no driver bata");
  });

  it("should return the exact cancellation policy from siteConfig for cancellation questions", async () => {
    const req = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.53" },
      body: JSON.stringify({
        message: "What is your cancellation policy?",
        bookingState: {},
      }),
    });

    const res = await assistantHandler(req);
    const data = await res.json();
    expect(data.reply).toBe(siteConfig.cancellationPolicy);
  });

  it("should defer questions outside FAQ scope with 'I will have the SR Travels team confirm that' rather than fabricating answers", async () => {
    const req = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.54" },
      body: JSON.stringify({
        message: "Do you offer helicopter charters to Goa with in-flight caviar?",
        bookingState: {},
      }),
    });

    const res = await assistantHandler(req);
    const data = await res.json();
    expect(data.reply).toBe("I'll have the SR Travels team confirm that.");
  });

  it("should enforce rate limiting at 15 messages per 10 minutes per IP", async () => {
    const testIp = `10.99.88.${Math.floor(Math.random() * 250) + 1}`;

    // Send 15 requests (allowed)
    for (let i = 0; i < 15; i++) {
      const req = new Request("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
        body: JSON.stringify({ message: "Hello", bookingState: {} }),
      });
      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
    }

    // 16th request must trigger 429
    const blockedReq = new Request("http://localhost:3000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
      body: JSON.stringify({ message: "Hello again", bookingState: {} }),
    });

    const blockedRes = await assistantHandler(blockedReq);
    expect(blockedRes.status).toBe(429);
    const data = await blockedRes.json();
    expect(data.error).toContain("Too many requests");
  });
});

describe("Weather Advisory API Tests", () => {
  it("should return weather advisory when coordinates are passed", async () => {
    // Chennai coordinates
    const req = new Request("http://localhost:3000/api/weather?lat=13.0827&lng=80.2707&label=Chennai", {
      method: "GET",
    });

    const res = await weatherHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("hasAdvisory");
    expect(typeof data.hasAdvisory).toBe("boolean");

    if (data.hasAdvisory) {
      expect(["rain", "heat"]).toContain(data.advisoryType);
      expect(data.message).toBeTruthy();
    }
  });

  it("should validate missing coordinates with 400", async () => {
    const req = new Request("http://localhost:3000/api/weather", { method: "GET" });
    const res = await weatherHandler(req);
    expect(res.status).toBe(400);
  });
});
