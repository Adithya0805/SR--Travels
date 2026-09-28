import { describe, it, expect } from "vitest";
import { calculateFare } from "./fare";
import { siteConfig } from "../config/siteConfig";

describe("calculateFare Unit Tests", () => {
  const sedan = siteConfig.vehicles.find((v) => v.id === "sedan")!;
  const suv = siteConfig.vehicles.find((v) => v.id === "suv")!;

  it("should enforce minimum 130 km floor for One Way (With Driver)", () => {
    // 50 km distance < 130 km min floor
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 50,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.billableKm).toBe(130);
    // 130 * 14 = 1820 + 400 bata = 2220
    expect(result.total).toBe(130 * sedan.ratePerKm + siteConfig.driverBataPerDay);
    expect(result.notes).toContain("Minimum 130 km floor applied for one-way trip");
    expect(result.notes).toContain("Tolls and permits extra as per actuals");
  });

  it("should calculate exact distance fare when exceeding minimum floor for One Way (With Driver)", () => {
    // 200 km > 130 km min floor
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 200,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.billableKm).toBe(200);
    // 200 * 14 = 2800 + 400 bata = 3200
    expect(result.total).toBe(200 * sedan.ratePerKm + siteConfig.driverBataPerDay);
    expect(result.notes).not.toContain("Minimum 130 km floor applied for one-way trip");
  });

  it("should enforce minimum 250 km floor for Round Trip (With Driver)", () => {
    // 100 km one-way = 200 km round trip < 250 km min floor
    const result = calculateFare({
      vehicle: suv,
      distanceKm: 100,
      tripType: "round-trip",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.billableKm).toBe(250);
    // 250 * 20 = 5000 + 400 bata = 5400
    expect(result.total).toBe(250 * suv.ratePerKm + siteConfig.driverBataPerDay);
    expect(result.notes.some((n) => n.includes("Minimum 250 km floor applied"))).toBe(true);
  });

  it("should calculate multi-day driver bata correctly for Round Trip", () => {
    // 200 km one-way = 400 km round trip, 3 days
    // 3 days * 250 km/day = 750 km cap > 400 km
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 200,
      tripType: "round-trip",
      driveMode: "with-driver",
      days: 3,
    });

    // 3 days @ 250 km cap = 750 km billable
    expect(result.billableKm).toBe(750);
    const expectedBata = 3 * siteConfig.driverBataPerDay; // 1200
    const expectedTotal = 750 * sedan.ratePerKm + expectedBata;
    expect(result.total).toBe(expectedTotal);
    expect(result.breakdown).toContain(
      `Driver Bata (3 days @ ₹${siteConfig.driverBataPerDay}/day) = ₹${expectedBata}`
    );
  });

  it("should calculate Self Drive fare WITHOUT extra km when under daily cap", () => {
    // 100 km < 250 km cap (1 day)
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 100,
      tripType: "one-way",
      driveMode: "self-drive",
      days: 1,
    });

    expect(result.billableKm).toBe(100);
    expect(result.total).toBe(sedan.ratePerDay * 1); // 1800
    expect(result.breakdown.some((b) => b.includes("Extra Distance"))).toBe(false);
    expect(result.notes).toContain("Tolls and permits extra as per actuals");
  });

  it("should calculate Self Drive fare WITH extra km charges when exceeding daily cap", () => {
    // 300 km > 250 km cap (1 day) -> 50 km extra
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 300,
      tripType: "one-way",
      driveMode: "self-drive",
      days: 1,
    });

    expect(result.billableKm).toBe(300);
    const expectedRental = sedan.ratePerDay * 1; // 1800
    const expectedExtra = 50 * sedan.extraKmRate; // 50 * 14 = 700
    expect(result.total).toBe(expectedRental + expectedExtra); // 2500

    expect(result.breakdown).toContain(
      `Daily Rental (1 day @ ₹${sedan.ratePerDay}/day) = ₹${expectedRental}`
    );
    expect(result.breakdown).toContain(
      `Extra Distance (50 km @ ₹${sedan.extraKmRate}/km) = ₹${expectedExtra}`
    );
  });

  it("should calculate multi-day Self Drive with round trip extra km", () => {
    // 200 km one-way = 400 km round trip, 1 day (cap 250 km) -> 150 km extra
    const result = calculateFare({
      vehicle: suv,
      distanceKm: 200,
      tripType: "round-trip",
      driveMode: "self-drive",
      days: 1,
    });

    expect(result.billableKm).toBe(400); // 200 * 2
    const expectedRental = suv.ratePerDay * 1; // 2800
    const expectedExtra = 150 * suv.extraKmRate; // 150 * 20 = 3000
    expect(result.total).toBe(expectedRental + expectedExtra); // 5800
  });
});
