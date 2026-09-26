import siteConfig from '../data/siteConfig.json';

export function calculateFare({ distanceKm, tripType, ratePerKm }) {
  const minKm = tripType === 'oneway' ? siteConfig.minKmOneWay : siteConfig.minKmRoundTrip;
  const billableKm = Math.max(distanceKm, minKm);
  const driverBata = siteConfig.driverBata;
  const fare = billableKm * ratePerKm + driverBata;
  return { billableKm, driverBata, fare, minKmApplied: distanceKm < minKm, minKm };
}
