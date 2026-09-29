import { describe, it, expect } from "vitest";
import {
  calculateFare,
  calculateFuelAdjustment,
  formatCurrency,
  suggestMinimumDays,
} from "./fare";
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

describe("formatCurrency Helper Unit Tests", () => {
  it("should round amounts to the nearest rupee integer and format in Indian numbering", () => {
    expect(formatCurrency(12972.6)).toBe("₹12,973");
    expect(formatCurrency(12972.4)).toBe("₹12,972");
    expect(formatCurrency(100)).toBe("₹100");
    expect(formatCurrency(16886)).toBe("₹16,886");
    expect(formatCurrency(1234567)).toBe("₹12,34,567");
  });

  it("should allow omitting the ₹ currency symbol", () => {
    expect(formatCurrency(12972.6, false)).toBe("12,973");
    expect(formatCurrency(500, false)).toBe("500");
  });
});

describe("suggestMinimumDays Helper Unit Tests", () => {
  it("should suggest 1 day for trips under 250km and under 6 hours (360 min)", () => {
    expect(
      suggestMinimumDays({ oneWayDistanceKm: 100, oneWayDurationMin: 120 })
    ).toBe(1);
    expect(
      suggestMinimumDays({ oneWayDistanceKm: 250, oneWayDurationMin: 360 })
    ).toBe(1);
  });

  it("should suggest 2 days if one-way distance exceeds 250km", () => {
    expect(
      suggestMinimumDays({ oneWayDistanceKm: 250.5, oneWayDurationMin: 200 })
    ).toBe(2);
    expect(
      suggestMinimumDays({ oneWayDistanceKm: 518.9, oneWayDurationMin: 300 })
    ).toBe(2);
  });

  it("should suggest 2 days if one-way duration exceeds 360 minutes (6 hours)", () => {
    expect(
      suggestMinimumDays({ oneWayDistanceKm: 180, oneWayDurationMin: 365 })
    ).toBe(2);
  });
});

describe("Real-Distance Fare Engine Unit Tests (No Minimum Floors)", () => {
  const sedan = siteConfig.vehicles.find((v) => v.id === "sedan")!;
  const suv = siteConfig.vehicles.find((v) => v.id === "suv")!;
  const muv = siteConfig.vehicles.find((v) => v.id === "muv")!;

  // Sedan: ratePerKm = 14, roundTripRatePerKm = 12.5, fuelAdj = 3.0 -> effective one-way = 17, round-trip = 15.5, bata = 400
  // SUV: ratePerKm = 20, roundTripRatePerKm = 17.5, fuelAdj = 4.0 -> bata = 400
  // MUV: ratePerKm = 21, roundTripRatePerKm = 18.5, fuelAdj = 4.5 -> bata = 400

  describe("With Driver - One Way Trips (Pure Real Distance Billing)", () => {
    it("should calculate exact fare for 5km one-way trip (pure distance × rate + bata, no floor)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 5,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(5);
      // 5 km * 14 = 70, 5 km * 3 = 15, 400 bata = 485
      expect(result.total).toBe(485);
      expect(result.breakdown).toContain("5 km @ ₹14/km = ₹70");
      expect(result.breakdown).toContain("Fuel adjustment = +₹15");
      expect(result.breakdown).toContain("Driver Bata (1 day) = ₹400");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 44.4km one-way trip (Ambur to Vellore scale) with clean rounding", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 44.4,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(44.4);
      expect(result.billableKm).not.toBe(130);
      // 44.4 km * 14 = 621.6 -> rounded to 622
      // 44.4 km * 3 = 133.2 -> rounded to 133
      // 400 bata
      // Total = 622 + 133 + 400 = 1155 (exact integer)
      expect(result.total).toBe(1155);
      expect(result.breakdown).toContain("44.4 km @ ₹14/km = ₹622");
      expect(result.breakdown).toContain("Fuel adjustment = +₹133");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate smooth progression at 39km, 44km, and 45km (no pricing cliff)", () => {
      const f39 = calculateFare({
        vehicle: sedan,
        distanceKm: 39,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      const f44 = calculateFare({
        vehicle: sedan,
        distanceKm: 44,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      const f45 = calculateFare({
        vehicle: sedan,
        distanceKm: 45,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      // 39km * 17 + 400 = 1063
      // 44km * 17 + 400 = 1148
      // 45km * 17 + 400 = 1165
      expect(f39.total).toBe(1063);
      expect(f44.total).toBe(1148);
      expect(f45.total).toBe(1165);

      // Delta from 44 to 45 km is exactly 17 (1 km * (14 + 3))
      expect(f45.total - f44.total).toBe(17);
    });

    it("should calculate exact fare for 100km one-way trip", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(100);
      // 100 km * 14 = 1400, 100 * 3 = 300, 400 bata -> total = 2100
      expect(result.total).toBe(2100);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 130km and 131km without regression", () => {
      const f130 = calculateFare({
        vehicle: sedan,
        distanceKm: 130,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      const f131 = calculateFare({
        vehicle: sedan,
        distanceKm: 131,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      // 130 * 17 + 400 = 2610
      // 131 * 17 + 400 = 2627
      expect(f130.total).toBe(2610);
      expect(f131.total).toBe(2627);
      expect(f131.total - f130.total).toBe(17);
    });

    it("should calculate exact fare for 300km one-way trip (Chennai to Salem/Trichy scale)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 300,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(300);
      // 300 km * 17 = 5100 + 400 bata = 5500
      expect(result.total).toBe(5500);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 600km one-way trip (Chennai to Kanyakumari scale)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 600,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(600);
      // 600 km * 17 = 10200 + 400 bata = 10600
      expect(result.total).toBe(10600);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });
  });

  describe("With Driver - Round Trip Trips (roundTripRatePerKm Billing)", () => {
    it("should calculate exact fare for 5km one-way round trip (10km total, using roundTripRatePerKm = ₹12.5/km)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 5,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(10);
      // 10 km * 12.5 = 125 base
      // 10 km * 3 = 30 fuel
      // 400 bata
      // Total = 125 + 30 + 400 = 555
      expect(result.total).toBe(555);
      expect(result.breakdown).toContain("10 km @ ₹12.5/km (round trip rate) = ₹125");
      expect(result.breakdown).toContain("Fuel adjustment = +₹30");
      expect(result.breakdown).toContain("Driver Bata (1 day) = ₹400");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 44.4km one-way round trip (88.8km total, no floor)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 44.4,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(88.8);
      // 88.8 km * 12.5 = 1110
      // 88.8 km * 3 = 266.4 -> 266
      // 400 bata
      // Total = 1110 + 266 + 400 = 1776
      expect(result.total).toBe(1776);
      expect(result.breakdown).toContain("88.8 km @ ₹12.5/km (round trip rate) = ₹1,110");
      expect(result.breakdown).toContain("Fuel adjustment = +₹266");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 100km one-way round trip (200km total)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 100,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(200);
      // 200 km * 12.5 = 2500
      // 200 km * 3 = 600
      // 400 bata
      // Total = 2500 + 600 + 400 = 3500
      expect(result.total).toBe(3500);
      expect(result.breakdown).toContain("200 km @ ₹12.5/km (round trip rate) = ₹2,500");
      expect(result.breakdown).toContain("Fuel adjustment = +₹600");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 300km one-way round trip (600km total)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 300,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(600);
      // 600 km * 12.5 = 7500
      // 600 km * 3 = 1800
      // 400 bata
      // Total = 7500 + 1800 + 400 = 9700
      expect(result.total).toBe(9700);
    });

    it("should calculate exact fare for 600km one-way round trip (1200km total)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 600,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(1200);
      // 1200 km * 12.5 = 15000
      // 1200 km * 3 = 3600
      // 400 bata
      // Total = 15000 + 3600 + 400 = 19000
      expect(result.total).toBe(19000);
    });

    it("should calculate multi-day driver bata correctly for Round Trip", () => {
      // 200 km round trip, 3 days
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 100,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 3,
      });

      expect(result.billableKm).toBe(200);
      // 200 * 12.5 = 2500 base + 600 fuel + 3 * 400 bata (1200) = 4300
      expect(result.total).toBe(4300);
      expect(result.breakdown).toContain("Driver Bata (3 days) = ₹1,200");
    });
  });

  describe("Self Drive Rentals (Unchanged Rental + Extra Km Logic)", () => {
    it("should calculate 5km self-drive trip within 250km cap", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 5,
        tripType: "one-way",
        driveMode: "self-drive",
        days: 1,
      });

      expect(result.billableKm).toBe(5);
      expect(result.total).toBe(1800);
      expect(result.breakdown).toContain("Daily Rental (1 day @ ₹1800/day) = ₹1,800");
      expect(result.breakdown.some((b) => b.includes("Extra Distance"))).toBe(false);
    });

    it("should calculate 44.4km self-drive trip within 250km cap", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 44.4,
        tripType: "one-way",
        driveMode: "self-drive",
        days: 1,
      });

      expect(result.billableKm).toBe(44.4);
      expect(result.total).toBe(1800);
    });

    it("should calculate 100km self-drive trip within 250km cap", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "self-drive",
        days: 1,
      });

      expect(result.billableKm).toBe(100);
      expect(result.total).toBe(1800);
    });

    it("should calculate 300km self-drive trip with 50km extra distance charge", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 300,
        tripType: "one-way",
        driveMode: "self-drive",
        days: 1,
      });

      expect(result.billableKm).toBe(300);
      // 1800 + 50 * 14 = 2500
      expect(result.total).toBe(2500);
      expect(result.breakdown).toContain("Extra Distance (50 km @ ₹14/km) = ₹700");
    });

    it("should calculate 600km self-drive trip with 350km extra distance charge", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 600,
        tripType: "one-way",
        driveMode: "self-drive",
        days: 1,
      });

      expect(result.billableKm).toBe(600);
      // 1800 + 350 * 14 = 6700
      expect(result.total).toBe(6700);
      expect(result.breakdown).toContain("Extra Distance (350 km @ ₹14/km) = ₹4,900");
    });
  });

  describe("Vehicle Tier Verification (SUV & MUV)", () => {
    it("should calculate SUV fare accurately across real distance (one-way and round-trip)", () => {
      // SUV One Way: 100 * 20 (base) + 100 * 4 (fuel) + 400 (bata) = 2800
      const oneWay = calculateFare({
        vehicle: suv,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      expect(oneWay.billableKm).toBe(100);
      expect(oneWay.total).toBe(2800);

      // SUV Round Trip: 200 km * 17.5 (roundTripRatePerKm) = 3500 + 200 * 4 (800) + 400 = 4700
      const roundTrip = calculateFare({
        vehicle: suv,
        distanceKm: 100,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });
      expect(roundTrip.billableKm).toBe(200);
      expect(roundTrip.total).toBe(4700);
    });

    it("should calculate MUV Innova Crysta fare accurately across real distance", () => {
      // MUV One Way: 100 * 21 (base) + 100 * 4.5 (fuel) + 400 (bata) = 2950
      const oneWay = calculateFare({
        vehicle: muv,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      expect(oneWay.billableKm).toBe(100);
      expect(oneWay.total).toBe(2950);

      // MUV Round Trip: 200 km * 18.5 (roundTripRatePerKm) = 3700 + 200 * 4.5 (900) + 400 = 5000
      const roundTrip = calculateFare({
        vehicle: muv,
        distanceKm: 100,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });
      expect(roundTrip.billableKm).toBe(200);
      expect(roundTrip.total).toBe(5000);
    });
  });

  describe("Sanity Check: Floating-Point Elimination and Intermediate Line Exact Addition", () => {
    const testDistances = [7.3, 14.8, 39.1, 44.4, 73.6, 127.9, 249.2, 518.9];

    it("should ensure breakdown lines and total add up exactly with zero floating-point artifacts", () => {
      for (const dist of testDistances) {
        for (const trip of ["one-way", "round-trip"] as const) {
          const result = calculateFare({
            vehicle: sedan,
            distanceKm: dist,
            tripType: trip,
            driveMode: "with-driver",
            days: 1,
          });

          // 1. Total must be an exact integer
          expect(Number.isInteger(result.total)).toBe(true);

          // 2. Parse numbers from breakdown lines
          let sumOfLines = 0;
          for (const line of result.breakdown) {
            // Match '= ₹' or '= +₹' followed by integer with optional commas
            const match = line.match(/=\s*\+?₹([0-9,]+)/);
            expect(match).not.toBeNull();
            const val = parseInt(match![1].replace(/,/g, ""), 10);
            expect(Number.isNaN(val)).toBe(false);
            sumOfLines += val;

            // 3. Ensure no floating point artifacts like .1234 or .6 exist in the formatted line amount after '='
            const amountPart = line.includes("=") ? line.split("=")[1] : line;
            expect(amountPart).not.toMatch(/₹\d+\.\d+/);
          }

          // 4. Exact sum equality: breakdown lines MUST sum to result.total
          expect(sumOfLines).toBe(result.total);
        }
      }
    });

    it("should evaluate Chennai -> Coimbatore round trip (518.9 km) sanity check", () => {
      const oneWayKm = 518.9;
      const oneWayMin = 540; // ~9 hours

      // 1. Minimum suggested days must be 2 days
      const suggestedDays = suggestMinimumDays({
        oneWayDistanceKm: oneWayKm,
        oneWayDurationMin: oneWayMin,
      });
      expect(suggestedDays).toBe(2);

      // 2. Fare calculation for Sedan round trip with 2 days
      const fareResult = calculateFare({
        vehicle: sedan,
        distanceKm: oneWayKm,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: suggestedDays,
      });

      // Total distance = 518.9 * 2 = 1037.8 km
      expect(fareResult.billableKm).toBe(1037.8);
      // Base fare: round(1037.8 * 12.5) = 12973
      // Fuel adj: round(1037.8 * 3.0) = 3113
      // Driver bata (2 days): 2 * 400 = 800
      // Total: 12973 + 3113 + 800 = 16886
      expect(fareResult.total).toBe(16886);
      expect(fareResult.breakdown).toContain(
        "1037.8 km @ ₹12.5/km (round trip rate) = ₹12,973"
      );
      expect(fareResult.breakdown).toContain("Fuel adjustment = +₹3,113");
      expect(fareResult.breakdown).toContain("Driver Bata (2 days) = ₹800");

      // Verify exact addition
      expect(12973 + 3113 + 800).toBe(16886);
    });
  });
});
