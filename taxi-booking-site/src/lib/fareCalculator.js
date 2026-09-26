import siteConfig from '../data/siteConfig.json';

export function calculateFare({ distanceKm, tripType, ratePerKm, rentalType = 'with-driver', daysCount = 1, ratePerDay = 1800 }) {
  if (rentalType === 'self-drive') {
    const validDays = Math.max(1, Number(daysCount) || 1);
    const fare = validDays * ratePerDay;
    return {
      isSelfDrive: true,
      daysCount: validDays,
      ratePerDay,
      driverBata: 0,
      fare,
      minKmApplied: false,
    };
  }

  const minKm = tripType === 'oneway' ? siteConfig.minKmOneWay : siteConfig.minKmRoundTrip;
  const billableKm = Math.max(distanceKm, minKm);
  const driverBata = siteConfig.driverBata;
  const fare = billableKm * ratePerKm + driverBata;
  return {
    isSelfDrive: false,
    billableKm,
    driverBata,
    fare,
    minKmApplied: distanceKm < minKm,
    minKm,
  };
}
