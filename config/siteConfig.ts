export interface Vehicle {
  id: string;
  name: string;
  seats: number;
  ratePerKm: number;
  ratePerDay: number;
  kmCapPerDay: number;
  extraKmRate: number;
}

export interface SiteConfig {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  serviceRegion: string;
  seoKeywords: string[];
  vehicles: Vehicle[];
  minKmOneWay: number;
  minKmRoundTrip: number;
  driverBataPerDay: number;
  cancellationPolicy: string;
}

export const siteConfig: SiteConfig = {
  businessName: "SR Travels",
  tagline: "Car Rental & Travels, Tamil Nadu",
  phone: "+91XXXXXXXXXX",
  whatsapp: "91XXXXXXXXXX",
  serviceRegion: "Tamil Nadu",
  seoKeywords: [
    "SR Travels",
    "Car Rental Tamil Nadu",
    "Taxi Service",
    "Outstation Taxi",
    "Self Drive Car",
    "Cab Booking",
  ],
  vehicles: [
    {
      id: "sedan",
      name: "Sedan (Swift Dzire / Etios)",
      seats: 4,
      ratePerKm: 14,
      ratePerDay: 1800,
      kmCapPerDay: 250,
      extraKmRate: 14,
    },
    {
      id: "suv",
      name: "Executive SUV (Ertiga / Carens)",
      seats: 6,
      ratePerKm: 20,
      ratePerDay: 2800,
      kmCapPerDay: 250,
      extraKmRate: 20,
    },
    {
      id: "muv",
      name: "Premium MUV (Innova Crysta)",
      seats: 7,
      ratePerKm: 21,
      ratePerDay: 3200,
      kmCapPerDay: 250,
      extraKmRate: 21,
    },
  ],
  minKmOneWay: 130,
  minKmRoundTrip: 250,
  driverBataPerDay: 400,
  cancellationPolicy: "PLACEHOLDER",
};
