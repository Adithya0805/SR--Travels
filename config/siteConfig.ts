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
  /** E.164 format, used for tel: links — e.g. "+919894846070" */
  phone: string;
  /** Human-readable display string — e.g. "+91 98948 46070" */
  phoneDisplay: string;
  /** Digits only, no plus or spaces — for wa.me links */
  whatsapp: string;
  serviceRegion: string;
  seoKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  siteUrl: string;
  /** Brand colour tokens sampled from the logo source image */
  brand: {
    navy: string;
    gold: string;
  };
  vehicles: Vehicle[];
  minKmOneWay: number;
  minKmRoundTrip: number;
  driverBataPerDay: number;
  cancellationPolicy: string;
}

export const siteConfig: SiteConfig = {
  businessName: "SR Travels",
  tagline: "Car Rental & Travels, Tamil Nadu",
  phone: "+919894846070",
  phoneDisplay: "+91 98948 46070",
  whatsapp: "919894846070",
  serviceRegion: "Tamil Nadu",
  seoKeywords: [
    "SR Travels",
    "Car Rental Tamil Nadu",
    "Taxi Service",
    "Outstation Taxi",
    "Self Drive Car",
    "Cab Booking",
  ],
  metaTitle: "SR Travels - Car Rental & Travels, Tamil Nadu",
  metaDescription:
    "SR Travels outstation & local taxi booking service in Tamil Nadu. One-way, round-trip & self-drive cars at transparent rates.",
  siteUrl: "https://sr-travels-tau.vercel.app",
  brand: {
    /** Sampled from logo source: dark navy blue */
    navy: "#1c2d4f",
    /** Sampled from logo source: warm amber-gold */
    gold: "#cb950f",
  },
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
