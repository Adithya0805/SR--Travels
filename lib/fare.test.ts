import { describe, it, expect } from "vitest";
import { calculateFare, calculateFuelAdjustment } from "./fare";
import { siteConfig } from "../config/siteConfig";

describe("calculateFuelAdjustment Unit Tests", () => {
  it("should calculate exact fuel adjustment at baseline fuel price (₹100.75/L) for all vehicle tiers", () => {
    // Sedan: 18 km/L -> 100.75 / 18 = 5.597 -> * 0.5 = 2.798 -> rounded to nearest ₹0.50 = ₹3.00
    const sedanAdj = calculateFuelAdjustment({ mileageKmpl: 18, baselineFuelPrice: 100.75 });
    expect(sedanAdj).toBe(3.0);

    // SUV: 12 km/L -> 100.75 / 12 = 8.396 -> * 0.5 = 4.198 -> rounded to nearest ₹0.50 = ₹4.00
    const suvAdj = calculateFuelAdjustment({ mileageKmpl: 12, baselineFuelPrice: 100.75 });
    expect(suvAdj).toBe(4.0);

    // MUV: 11 km/L -> 100.75 / 11 = 9.159 -> * 0.5 = 4.579 -> rounded to nearest ₹0.50 = ₹4.50
    const muvAdj = calculateFuelAdjustment({ mileageKmpl: 11, baselineFuelPrice: 100.75 });
    expect(muvAdj).toBe(4.5);
  });

  it("should default to siteConfig.baselineFuelPrice if not explicitly passed", () => {
    const adj = calculateFuelAdjustment({ mileageKmpl: 18 });
    expect(adj).toBe(3.0);
  });
});

describe("calculateFare Unit Tests", () => {
  const sedan = siteConfig.vehicles.find((v) => v.id === "sedan")!;
  const suv = siteConfig.vehicles.find((v) => v.id === "suv")!;

  // Sedan has ratePerKm = 14, localRatePerKm = 18, mileageKmpl = 18 -> fuelAdj = 3.0
  // Effective ratePerKm = 14 + 3 = 17
  // Effective localRatePerKm = 18 + 3 = 21

  it("should calculate short-distance local trip (<=40km) without driver bata or min-km floor", () => {
    // 25 km distance <= 40 km local tier
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 25,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.isShortDistance).toBe(true);
    expect(result.billableKm).toBe(25);
    // 25 km * (18 local + 3 fuel) = 25 * 21 = 525, NO driver bata (0), NO 130km floor
    expect(result.total).toBe(525);
    expect(result.fuelAdjustment).toBe(3.0);
    expect(result.fuelAdjustmentTotal).toBe(75); // 25 * 3
    expect(result.notes.some((n) => n.includes("Short-distance local trip"))).toBe(true);
    expect(result.notes.some((n) => n.includes("Minimum 130 km floor applied"))).toBe(false);
  });

  it("should calculate short-distance local round trip (<=40km one-way = 40km total)", () => {
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 20,
      tripType: "round-trip",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.isShortDistance).toBe(true);
    expect(result.billableKm).toBe(40); // 20 * 2
    // 40 km * (18 local + 3 fuel) = 40 * 21 = 840, NO driver bata, NO 250km floor
    expect(result.total).toBe(840);
  });

  it("should enforce minimum 130 km floor for One Way (With Driver) for trips > 40km", () => {
    // 50 km distance > 40 km local tier, but < 130 km min floor
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 50,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.isShortDistance).toBe(false);
    expect(result.billableKm).toBe(130);
    // 130 * (14 base + 3 fuel = 17) = 2210 + 400 bata = 2610
    const expectedRate = sedan.ratePerKm + 3.0; // 17
    expect(result.total).toBe(130 * expectedRate + siteConfig.driverBataPerDay);
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
    // 200 * (14 base + 3 fuel = 17) = 3400 + 400 bata = 3800
    const expectedRate = sedan.ratePerKm + 3.0; // 17
    expect(result.total).toBe(200 * expectedRate + siteConfig.driverBataPerDay);
    expect(result.notes).not.toContain("Minimum 130 km floor applied for one-way trip");
  });

  it("should enforce minimum 250 km floor for Round Trip (With Driver) for trips > 40km", () => {
    // 100 km one-way = 200 km round trip < 250 km min floor
    // SUV: ratePerKm = 20, fuelAdj = 4.0 -> effective = 24
    const result = calculateFare({
      vehicle: suv,
      distanceKm: 100,
      tripType: "round-trip",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.billableKm).toBe(250);
    // 250 * (20 + 4 = 24) = 6000 + 400 bata = 6400
    const expectedRate = suv.ratePerKm + 4.0; // 24
    expect(result.total).toBe(250 * expectedRate + siteConfig.driverBataPerDay);
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
    const expectedRate = sedan.ratePerKm + 3.0; // 17
    const expectedBata = 3 * siteConfig.driverBataPerDay; // 1200
    const expectedTotal = 750 * expectedRate + expectedBata;
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
    // 1800 + 50 * 14 = 2500
    expect(result.total).toBe(sedan.ratePerDay * 1 + 50 * sedan.extraKmRate);
    expect(result.breakdown).toContain(
      `Extra Distance (50 km @ ₹${sedan.extraKmRate}/km) = ₹700`
    );
    expect(result.notes).toContain(
      `Exceeded 250 km cap by 50 km (1 day(s) @ 250 km/day)`
    );
  });
});
