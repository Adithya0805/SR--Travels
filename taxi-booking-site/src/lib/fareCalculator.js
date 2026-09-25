export function calculateFare({ distanceKm, tripType, ratePerKm }) {
  const minKm = tripType === 'oneway' ? 130 : 250;
  const billableKm = Math.max(distanceKm, minKm);
  const driverBata = 400;
  const fare = billableKm * ratePerKm + driverBata;
  return { billableKm, driverBata, fare, minKmApplied: distanceKm < minKm };
}
