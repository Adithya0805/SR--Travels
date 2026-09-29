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

    expect(result.tier).toBe("local");
    expect(result.isShortDistance).toBe(true);
    expect(result.billableKm).toBe(25);
    // 25 km * (18 local + 3 fuel) = 25 * 21 = 525, NO driver bata (0), NO 130km floor
    expect(result.total).toBe(525);
    expect(result.fuelAdjustment).toBe(3.0);
    expect(result.fuelAdjustmentTotal).toBe(75); // 25 * 3
    expect(result.notes).toContain("Local trip rate");
    expect(result.notes.some((n) => n.includes("Minimum 130km floor applied"))).toBe(false);
  });

  it("should calculate short-distance local round trip (<=40km one-way = 40km total)", () => {
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 20,
      tripType: "round-trip",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.tier).toBe("local");
    expect(result.isShortDistance).toBe(true);
    expect(result.billableKm).toBe(40); // 20 * 2
    // 40 km * (18 local + 3 fuel) = 40 * 21 = 840, NO driver bata, NO 250km floor
    expect(result.total).toBe(840);
  });

  it("should calculate mid-range tier (40-130 km) with actual distance and standard per-km rate + driver bata (no 130km floor)", () => {
    // 50 km distance > 40 km local tier, but < 130 km
    const result = calculateFare({
      vehicle: sedan,
      distanceKm: 50,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result.tier).toBe("mid-range");
    expect(result.isShortDistance).toBe(false);
    expect(result.billableKm).toBe(50); // actual distance, no floor!
    // 50 * (14 base + 3 fuel = 17) = 850 + 400 bata = 1250
    const expectedRate = sedan.ratePerKm + 3.0; // 17
    expect(result.total).toBe(50 * expectedRate + siteConfig.driverBataPerDay);
    expect(result.notes).toContain("Standard per-km rate");
    expect(result.notes.some((n) => n.includes("Minimum 130km floor applied"))).toBe(false);
    expect(result.notes).toContain("Tolls and permits extra as per actuals");
  });

  it("should smoothly transition without cliff at 39km, 44km, 45km and match outstation at 130km, 131km", () => {
    const fare39 = calculateFare({
      vehicle: sedan,
      distanceKm: 39,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    const fare44 = calculateFare({
      vehicle: sedan,
      distanceKm: 44,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    const fare45 = calculateFare({
      vehicle: sedan,
      distanceKm: 45,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    const fare130 = calculateFare({
      vehicle: sedan,
      distanceKm: 130,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    const fare131 = calculateFare({
      vehicle: sedan,
      distanceKm: 131,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    // 39 km (Local): 39 * 21 = 819
    expect(fare39.tier).toBe("local");
    expect(fare39.billableKm).toBe(39);
    expect(fare39.total).toBe(819);
    expect(fare39.notes).toContain("Local trip rate");

    // 44 km (Mid-range): 44 * 17 + 400 = 1148
    expect(fare44.tier).toBe("mid-range");
    expect(fare44.billableKm).toBe(44);
    expect(fare44.total).toBe(1148);
    expect(fare44.notes).toContain("Standard per-km rate");

    // 45 km (Mid-range): 45 * 17 + 400 = 1165
    expect(fare45.tier).toBe("mid-range");
    expect(fare45.billableKm).toBe(45);
    expect(fare45.total).toBe(1165);
    expect(fare45.notes).toContain("Standard per-km rate");

    // Strictly increasing without discontinuity
    expect(fare39.total).toBeLessThan(fare44.total);
    expect(fare44.total).toBeLessThan(fare45.total);

    // No jump greater than what one extra km should cost (17 <= 17)
    const oneKmCost = sedan.ratePerKm + 3.0; // 17
    expect(fare45.total - fare44.total).toBe(oneKmCost);
    expect(fare45.total - fare44.total).toBeLessThanOrEqual(oneKmCost);

    // 130 km (Outstation): 130 * 17 + 400 = 2610 (exact match with existing outstation floor)
    expect(fare130.tier).toBe("outstation");
    expect(fare130.billableKm).toBe(130);
    expect(fare130.total).toBe(2610);
    // At 130km, billableKm === distanceKm, so floor note is NOT applied, notes show "Standard per-km rate"
    expect(fare130.notes).toContain("Standard per-km rate");
    expect(fare130.notes.some((n) => n.includes("floor applied"))).toBe(false);

    // 131 km (Outstation): 131 * 17 + 400 = 2627
    expect(fare131.tier).toBe("outstation");
    expect(fare131.billableKm).toBe(131);
    expect(fare131.total).toBe(2627);
    expect(fare131.total - fare130.total).toBe(oneKmCost);
  });

  it("should bill one-way trip at 44.4km with billableKm = 44.4 (NOT 130), and verify 39km, 44.4km, 129km, 130km, 131km", () => {
    // 1. One-way trip at 44.4km (Ambur -> Vellore)
    const result44_4 = calculateFare({
      vehicle: sedan,
      distanceKm: 44.4,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });

    expect(result44_4.billableKm).toBe(44.4);
    expect(result44_4.billableKm).not.toBe(130);
    expect(result44_4.tier).toBe("mid-range");
    // 44.4 * 17 + 400 = 754.8 + 400 = 1154.8
    expect(result44_4.total).toBe(1154.8);
    expect(result44_4.notes).toContain("Standard per-km rate");
    expect(result44_4.notes.some((n) => n.includes("130km floor applied"))).toBe(false);

    // 2. 39km (Local tier)
    const result39 = calculateFare({
      vehicle: sedan,
      distanceKm: 39,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    expect(result39.billableKm).toBe(39);
    expect(result39.tier).toBe("local");
    expect(result39.total).toBe(819);

    // 3. 129km (Mid-range tier, just under 130km floor)
    const result129 = calculateFare({
      vehicle: sedan,
      distanceKm: 129,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    expect(result129.billableKm).toBe(129);
    expect(result129.billableKm).not.toBe(130);
    expect(result129.tier).toBe("mid-range");
    // 129 * 17 + 400 = 2193 + 400 = 2593
    expect(result129.total).toBe(2593);
    expect(result129.notes).toContain("Standard per-km rate");

    // 4. 130km (Outstation boundary)
    const result130 = calculateFare({
      vehicle: sedan,
      distanceKm: 130,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    expect(result130.billableKm).toBe(130);
    expect(result130.tier).toBe("outstation");
    expect(result130.total).toBe(2610);
    expect(result130.notes).toContain("Standard per-km rate");

    // 5. 131km (Outstation above 130km)
    const result131 = calculateFare({
      vehicle: sedan,
      distanceKm: 131,
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
    });
    expect(result131.billableKm).toBe(131);
    expect(result131.tier).toBe("outstation");
    expect(result131.total).toBe(2627);
    expect(result131.total - result130.total).toBe(17);
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

    expect(result.tier).toBe("outstation");
    expect(result.billableKm).toBe(200);
    // 200 * (14 base + 3 fuel = 17) = 3400 + 400 bata = 3800
    const expectedRate = sedan.ratePerKm + 3.0; // 17
    expect(result.total).toBe(200 * expectedRate + siteConfig.driverBataPerDay);
    expect(result.notes).toContain("Standard per-km rate");
    expect(result.notes.some((n) => n.includes("floor applied"))).toBe(false);
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
