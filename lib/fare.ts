import { siteConfig, Vehicle } from "../config/siteConfig";

export type TripType = "one-way" | "round-trip" | "oneway" | "roundtrip";
export type DriveMode = "with-driver" | "self-drive";

export interface CalculateFareOptions {
  vehicle: Vehicle;
  distanceKm: number;
  tripType: TripType;
  driveMode: DriveMode;
  days?: number;
}

export interface FareResult {
  billableKm: number;
  breakdown: string[];
  total: number;
  notes: string[];
  fuelAdjustment: number;
  fuelAdjustmentTotal: number;
  baseRatePerKm: number;
  effectiveRatePerKm: number;
  isShortDistance?: boolean;
}

export interface FuelAdjustmentOptions {
  mileageKmpl: number;
  baselineFuelPrice?: number;
}

/**
 * Calculates fuel price adjustment per km using config values ONLY (no fetch, no cache, no API).
 * fuelCostPerKm = baselineFuelPrice / mileageKmpl
 * adjustment = fuelCostPerKm * fuelSensitivity, rounded to nearest ₹0.50
 * This becomes a fixed per-vehicle addition to ratePerKm until baselineFuelPrice is next edited by hand.
 */
export function calculateFuelAdjustment({
  mileageKmpl,
  baselineFuelPrice = siteConfig.baselineFuelPrice,
}: FuelAdjustmentOptions): number {
  if (!mileageKmpl || mileageKmpl <= 0) return 0;
  const fuelCostPerKm = baselineFuelPrice / mileageKmpl;
  const adjustment = fuelCostPerKm * siteConfig.fuelSensitivity;
  // Round to nearest ₹0.50
  return Math.round(adjustment * 2) / 2;
}

/**
 * Calculates fare with manual fuel adjustment and short-distance tier (<=40km).
 */
export function calculateFare({
  vehicle,
  distanceKm,
  tripType,
  driveMode,
  days = 1,
}: CalculateFareOptions): FareResult {
  const numDays = Math.max(1, Math.round(days));
  const roundedDistance = Math.max(0, distanceKm);
  const isRoundTrip = tripType === "round-trip" || tripType === "roundtrip";

  const breakdown: string[] = [];
  const notes: string[] = [];

  const TOLLS_NOTE = "Tolls and permits extra as per actuals";

  // Calculate per-vehicle fuel adjustment
  const fuelAdjustment = calculateFuelAdjustment({
    mileageKmpl: vehicle.mileageKmpl,
    baselineFuelPrice: siteConfig.baselineFuelPrice,
  });

  if (driveMode === "with-driver") {
    // 3. Short-distance tier: if distanceKm <= 40
    // Use vehicle.localRatePerKm, no driverBata, no min-km floor, fuel adjustment still applied
    if (roundedDistance <= 40) {
      const billableKm = isRoundTrip ? roundedDistance * 2 : roundedDistance;
      const baseRate = vehicle.localRatePerKm;
      const effectiveRate = baseRate + fuelAdjustment;
      const distanceFare = billableKm * effectiveRate;
      const baseFare = billableKm * baseRate;
      const fuelAdjustmentTotal = billableKm * fuelAdjustment;
      const total = distanceFare;

      breakdown.push(
        `${billableKm} km @ ₹${baseRate}/km (Local rate) = ₹${baseFare}`
      );
      if (fuelAdjustment > 0) {
        breakdown.push(
          `Fuel adjustment = +₹${fuelAdjustmentTotal}`
        );
      }
      notes.push(
        "Short-distance local trip (≤40 km) — no driver bata or minimum km floor applied"
      );
      notes.push(TOLLS_NOTE);

      return {
        billableKm,
        breakdown,
        total,
        notes,
        fuelAdjustment,
        fuelAdjustmentTotal,
        baseRatePerKm: baseRate,
        effectiveRatePerKm: effectiveRate,
        isShortDistance: true,
      };
    }

    // Above 40km: With Driver (One Way or Round Trip)
    // Fuel adjustment added to ratePerKm before formula runs
    const baseRate = vehicle.ratePerKm;
    const effectiveRatePerKm = baseRate + fuelAdjustment;
    const driverBataTotal = siteConfig.driverBataPerDay * numDays;

    if (!isRoundTrip) {
      // With Driver - One Way (> 40km)
      const minKm = siteConfig.minKmOneWay;
      const billableKm = Math.max(roundedDistance, minKm);
      const distanceFare = billableKm * effectiveRatePerKm;
      const baseFare = billableKm * baseRate;
      const fuelAdjustmentTotal = billableKm * fuelAdjustment;
      const total = distanceFare + driverBataTotal;

      breakdown.push(
        `${billableKm} km @ ₹${baseRate}/km = ₹${baseFare}`
      );
      if (fuelAdjustment > 0) {
        breakdown.push(
          `Fuel adjustment = +₹${fuelAdjustmentTotal}`
        );
      }
      breakdown.push(
        `Driver Bata (${numDays} day${numDays > 1 ? "s" : ""} @ ₹${siteConfig.driverBataPerDay}/day) = ₹${driverBataTotal}`
      );

      if (roundedDistance < minKm) {
        notes.push(`Minimum ${minKm} km floor applied for one-way trip`);
      }
      notes.push(TOLLS_NOTE);

      return {
        billableKm,
        breakdown,
        total,
        notes,
        fuelAdjustment,
        fuelAdjustmentTotal,
        baseRatePerKm: baseRate,
        effectiveRatePerKm: effectiveRatePerKm,
        isShortDistance: false,
      };
    } else {
      // With Driver - Round Trip (> 40km)
      const roundTripDistance = roundedDistance * 2;
      const minKm = siteConfig.minKmRoundTrip;
      const kmCapTotal = numDays * vehicle.kmCapPerDay;

      const billableKm = Math.max(roundTripDistance, minKm, kmCapTotal);
      const distanceFare = billableKm * effectiveRatePerKm;
      const baseFare = billableKm * baseRate;
      const fuelAdjustmentTotal = billableKm * fuelAdjustment;
      const total = distanceFare + driverBataTotal;

      breakdown.push(
        `${billableKm} km @ ₹${baseRate}/km = ₹${baseFare}`
      );
      if (fuelAdjustment > 0) {
        breakdown.push(
          `Fuel adjustment = +₹${fuelAdjustmentTotal}`
        );
      }
      breakdown.push(
        `Driver Bata (${numDays} day${numDays > 1 ? "s" : ""} @ ₹${siteConfig.driverBataPerDay}/day) = ₹${driverBataTotal}`
      );

      if (billableKm > roundTripDistance) {
        notes.push(
          `Minimum ${billableKm} km floor applied for round-trip (${numDays} day(s))`
        );
      }
      notes.push(TOLLS_NOTE);

      return {
        billableKm,
        breakdown,
        total,
        notes,
        fuelAdjustment,
        fuelAdjustmentTotal,
        baseRatePerKm: baseRate,
        effectiveRatePerKm: effectiveRatePerKm,
        isShortDistance: false,
      };
    }
  } else {
    // Self Drive
    const effectiveDistance = roundedDistance * (isRoundTrip ? 2 : 1);
    const kmCapTotal = vehicle.kmCapPerDay * numDays;
    const extraKm = Math.max(0, effectiveDistance - kmCapTotal);

    const rentalFare = vehicle.ratePerDay * numDays;
    const extraKmFare = extraKm * vehicle.extraKmRate;
    const total = rentalFare + extraKmFare;

    breakdown.push(
      `Daily Rental (${numDays} day${numDays > 1 ? "s" : ""} @ ₹${vehicle.ratePerDay}/day) = ₹${rentalFare}`
    );

    if (extraKm > 0) {
      breakdown.push(
        `Extra Distance (${extraKm} km @ ₹${vehicle.extraKmRate}/km) = ₹${extraKmFare}`
      );
      notes.push(
        `Exceeded ${kmCapTotal} km cap by ${extraKm} km (${numDays} day(s) @ ${vehicle.kmCapPerDay} km/day)`
      );
    }

    notes.push(TOLLS_NOTE);

    return {
      billableKm: effectiveDistance,
      breakdown,
      total,
      notes,
      fuelAdjustment: 0,
      fuelAdjustmentTotal: 0,
      baseRatePerKm: vehicle.extraKmRate,
      effectiveRatePerKm: vehicle.extraKmRate,
      isShortDistance: false,
    };
  }
}
