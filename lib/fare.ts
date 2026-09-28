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
}

/**
 * Calculates fare using siteConfig values exclusively.
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

  if (driveMode === "with-driver") {
    const driverBataTotal = siteConfig.driverBataPerDay * numDays;

    if (!isRoundTrip) {
      // With Driver - One Way
      const minKm = siteConfig.minKmOneWay;
      const billableKm = Math.max(roundedDistance, minKm);
      const distanceFare = billableKm * vehicle.ratePerKm;
      const total = distanceFare + driverBataTotal;

      breakdown.push(
        `${billableKm} km @ ₹${vehicle.ratePerKm}/km = ₹${distanceFare}`
      );
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
      };
    } else {
      // With Driver - Round Trip
      const roundTripDistance = roundedDistance * 2;
      const minKm = siteConfig.minKmRoundTrip;
      const kmCapTotal = numDays * vehicle.kmCapPerDay;

      const billableKm = Math.max(roundTripDistance, minKm, kmCapTotal);
      const distanceFare = billableKm * vehicle.ratePerKm;
      const total = distanceFare + driverBataTotal;

      breakdown.push(
        `${billableKm} km @ ₹${vehicle.ratePerKm}/km = ₹${distanceFare}`
      );
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
    };
  }
}
