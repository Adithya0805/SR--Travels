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
  tier?: "local" | "mid-range" | "outstation";
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
 * Calculates fare strictly based on real distance (no minimum distance floor, no separate local rate):
 * - With Driver, One Way: fare = distanceKm * (ratePerKm + fuelAdjustment) + driverBataPerDay * days
 * - With Driver, Round Trip: fare = (distanceKm * 2) * (ratePerKm + fuelAdjustment) + driverBataPerDay * days
 * - Self Drive: ratePerDay * days + max(0, totalKm - kmCapPerDay * days) * extraKmRate
 * billableKm is always simply the real distance travelled.
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
    const baseRate = vehicle.ratePerKm;
    const effectiveRatePerKm = baseRate + fuelAdjustment;
    const driverBataTotal = siteConfig.driverBataPerDay * numDays;

    // Pure real distance: One Way = distanceKm, Round Trip = distanceKm * 2
    const billableKm = isRoundTrip ? roundedDistance * 2 : roundedDistance;
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
      `Driver Bata (${numDays} day${numDays > 1 ? "s" : ""}) = ₹${driverBataTotal}`
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
      effectiveRatePerKm,
    };
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
    };
  }
}
