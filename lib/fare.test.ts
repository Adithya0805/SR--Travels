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

describe("Real-Distance Fare Engine Unit Tests (No Minimum Floors)", () => {
  const sedan = siteConfig.vehicles.find((v) => v.id === "sedan")!;
  const suv = siteConfig.vehicles.find((v) => v.id === "suv")!;
  const muv = siteConfig.vehicles.find((v) => v.id === "muv")!;

  // Sedan: ratePerKm = 14, fuelAdj = 3.0 -> effective = 17, bata = 400
  // SUV: ratePerKm = 20, fuelAdj = 4.0 -> effective = 24, bata = 400
  // MUV: ratePerKm = 21, fuelAdj = 4.5 -> effective = 25.5, bata = 400

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
      // 5 km * 17 = 85 + 400 bata = 485
      expect(result.total).toBe(485);
      expect(result.breakdown).toContain("5 km @ ₹14/km = ₹70");
      expect(result.breakdown).toContain("Fuel adjustment = +₹15");
      expect(result.breakdown).toContain("Driver Bata (1 day) = ₹400");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 44.4km one-way trip (Ambur to Vellore scale)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 44.4,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(44.4);
      expect(result.billableKm).not.toBe(130);
      // 44.4 km * 17 = 754.8 + 400 bata = 1154.8
      expect(result.total).toBe(1154.8);
      expect(result.breakdown).toContain("44.4 km @ ₹14/km = ₹621.6");
      expect(result.breakdown).toContain("Fuel adjustment = +₹133.2");
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
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
      // 100 km * 17 = 1700 + 400 bata = 2100
      expect(result.total).toBe(2100);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
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

    it("should calculate exact fare for 600km one-way trip (Chennai to Kanyakumari/South India scale)", () => {
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

  describe("With Driver - Round Trip Trips (Pure Doubled Distance Billing)", () => {
    it("should calculate exact fare for 5km one-way round trip (10km total, no 250km floor)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 5,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(10);
      // 10 km * 17 = 170 + 400 bata = 570
      expect(result.total).toBe(570);
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
      // 88.8 km * 17 = 1509.6 + 400 bata = 1909.6
      expect(result.total).toBe(1909.6);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
    });

    it("should calculate exact fare for 100km one-way round trip (200km total, no 250km floor)", () => {
      const result = calculateFare({
        vehicle: sedan,
        distanceKm: 100,
        tripType: "round-trip",
        driveMode: "with-driver",
        days: 1,
      });

      expect(result.billableKm).toBe(200);
      // 200 km * 17 = 3400 + 400 bata = 3800
      expect(result.total).toBe(3800);
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
      // 600 km * 17 = 10200 + 400 bata = 10600
      expect(result.total).toBe(10600);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
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
      // 1200 km * 17 = 20400 + 400 bata = 20800
      expect(result.total).toBe(20800);
      expect(result.notes.some((n) => n.toLowerCase().includes("floor"))).toBe(false);
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
      // 200 * 17 = 3400 + 3 * 400 bata (1200) = 4600
      expect(result.total).toBe(4600);
      expect(result.breakdown).toContain("Driver Bata (3 days) = ₹1200");
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
      expect(result.breakdown).toContain("Daily Rental (1 day @ ₹1800/day) = ₹1800");
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
      expect(result.breakdown).toContain("Extra Distance (350 km @ ₹14/km) = ₹4900");
    });
  });

  describe("Vehicle Tier Verification (SUV & MUV)", () => {
    it("should calculate SUV fare accurately across real distance", () => {
      // 100 km SUV: 100 * 24 + 400 = 2800
      const result = calculateFare({
        vehicle: suv,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      expect(result.billableKm).toBe(100);
      expect(result.total).toBe(2800);
    });

    it("should calculate MUV Innova Crysta fare accurately across real distance", () => {
      // 100 km MUV: 100 * 25.5 + 400 = 2950
      const result = calculateFare({
        vehicle: muv,
        distanceKm: 100,
        tripType: "one-way",
        driveMode: "with-driver",
        days: 1,
      });
      expect(result.billableKm).toBe(100);
      expect(result.total).toBe(2950);
    });
  });
});
