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

export interface SuggestMinimumDaysOptions {
  oneWayDistanceKm: number;
  oneWayDurationMin: number;
}

/**
 * Formats a currency amount by rounding to the nearest integer rupee
 * and applying Indian numbering format (e.g. ₹12,972).
 */
export function formatCurrency(amount: number, includeSymbol = true): string {
  const rounded = Math.round(amount);
  return `${includeSymbol ? "₹" : ""}${rounded.toLocaleString("en-IN")}`;
}

/**
 * Realistic bata days suggestion:
 * If one-way drive is over 6 hours (> 360 min) OR over 250 km,
 * suggest minimum 2 days for a round trip to avoid unsafe same-day driver fatigue.
 */
export function suggestMinimumDays({
  oneWayDistanceKm,
  oneWayDurationMin,
}: SuggestMinimumDaysOptions): number {
  if (oneWayDurationMin > 360 || oneWayDistanceKm > 250) {
    return 2;
  }
  return 1;
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
 * - With Driver, One Way: uses ratePerKm
 * - With Driver, Round Trip: uses roundTripRatePerKm (distinct discounted rate)
 * - Intermediate breakdown lines (base fare, fuel adjustment, driver bata) are each Math.round()ed
 *   before summing, guaranteeing that breakdown lines and total add up exactly with zero floating-point artifacts.
 * - Self Drive: ratePerDay * days + max(0, totalKm - kmCapPerDay * days) * extraKmRate
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
    // Round trip uses distinct roundTripRatePerKm; One way uses standard ratePerKm
    const baseRate = isRoundTrip
      ? (vehicle.roundTripRatePerKm ?? vehicle.ratePerKm)
      : vehicle.ratePerKm;
    const effectiveRatePerKm = baseRate + fuelAdjustment;

    // Pure real distance: One Way = distanceKm, Round Trip = distanceKm * 2
    const billableKm = isRoundTrip ? roundedDistance * 2 : roundedDistance;

    // Round each intermediate component to nearest rupee before summing
    const baseFare = Math.round(billableKm * baseRate);
    const fuelAdjustmentTotal = Math.round(billableKm * fuelAdjustment);
    const driverBataTotal = Math.round(siteConfig.driverBataPerDay * numDays);
    const total = baseFare + fuelAdjustmentTotal + driverBataTotal;

    const rateLabel = isRoundTrip
      ? `₹${baseRate}/km (round trip rate)`
      : `₹${baseRate}/km`;

    breakdown.push(
      `${billableKm} km @ ${rateLabel} = ₹${baseFare.toLocaleString("en-IN")}`
    );
    if (fuelAdjustmentTotal > 0) {
      breakdown.push(
        `Fuel adjustment = +₹${fuelAdjustmentTotal.toLocaleString("en-IN")}`
      );
    }
    breakdown.push(
      `Driver Bata (${numDays} day${numDays > 1 ? "s" : ""}) = ₹${driverBataTotal.toLocaleString("en-IN")}`
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
    // Self Drive: ratePerDay * days + max(0, totalKm - kmCapPerDay * days) * extraKmRate
    const effectiveDistance = roundedDistance * (isRoundTrip ? 2 : 1);
    const kmCapTotal = vehicle.kmCapPerDay * numDays;
    const extraKm = Math.max(0, effectiveDistance - kmCapTotal);

    const rentalFare = Math.round(vehicle.ratePerDay * numDays);
    const extraKmFare = Math.round(extraKm * vehicle.extraKmRate);
    const total = rentalFare + extraKmFare;

    breakdown.push(
      `Daily Rental (${numDays} day${numDays > 1 ? "s" : ""} @ ₹${vehicle.ratePerDay}/day) = ₹${rentalFare.toLocaleString("en-IN")}`
    );

    if (extraKm > 0) {
      breakdown.push(
        `Extra Distance (${extraKm} km @ ₹${vehicle.extraKmRate}/km) = ₹${extraKmFare.toLocaleString("en-IN")}`
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
