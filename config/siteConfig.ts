export interface Vehicle {
  id: string;
  name: string;
  seats: number;
  ratePerKm: number;
  /** Fuel efficiency in km/L (sedan 18, suv 12, muv 11) */
  mileageKmpl: number;
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
  /** Primary page title */
  title: string;
  /** Primary meta description */
  description: string;
  /** SEO keywords */
  keywords: string[];
  /** Backward-compatible aliases */
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string[];
  siteUrl: string;
  /** Brand colour tokens sampled from the logo source image */
  brand: {
    navy: string;
    gold: string;
  };
  popularDestinations: {
    name: string;
    lat: number;
    lng: number;
    state?: string;
  }[];
  vehicles: Vehicle[];
  /** Manual fuel price reference in ₹/L (update manually when fuel price changes meaningfully) */
  baselineFuelPrice: number;
  /** Sensitivity factor for fuel adjustments */
  fuelSensitivity: number;
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
  title: "SR Travels - Car Rental & Travels, Tamil Nadu",
  description:
    "Book outstation trips and self-drive cars across Tamil Nadu with transparent fares.",
  keywords: [
    "SR Travels",
    "Car Rental Tamil Nadu",
    "Taxi Service",
    "Outstation Taxi",
    "Self Drive Car",
    "Cab Booking",
    "Tamil Nadu Travels",
  ],
  metaTitle: "SR Travels - Car Rental & Travels, Tamil Nadu",
  metaDescription:
    "Book outstation trips and self-drive cars across Tamil Nadu with transparent fares.",
  seoKeywords: [
    "SR Travels",
    "Car Rental Tamil Nadu",
    "Taxi Service",
    "Outstation Taxi",
    "Self Drive Car",
    "Cab Booking",
    "Tamil Nadu Travels",
  ],
  siteUrl: "https://sr-travels-tau.vercel.app",
  brand: {
    /** Sampled from logo source: dark navy blue */
    navy: "#1c2d4f",
    /** Sampled from logo source: warm amber-gold */
    gold: "#cb950f",
  },
  popularDestinations: [
    { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    { name: "Vellore", lat: 12.9165, lng: 79.1325, state: "Tamil Nadu" },
    { name: "Tirupati", lat: 13.6288, lng: 79.4192, state: "Andhra Pradesh" },
  ],
  vehicles: [
    {
      id: "sedan",
      name: "Sedan (Swift Dzire / Etios)",
      seats: 4,
      ratePerKm: 14,
      mileageKmpl: 18,
      ratePerDay: 1800,
      kmCapPerDay: 250,
      extraKmRate: 14,
    },
    {
      id: "suv",
      name: "Executive SUV (Ertiga / Carens)",
      seats: 6,
      ratePerKm: 20,
      mileageKmpl: 12,
      ratePerDay: 2800,
      kmCapPerDay: 250,
      extraKmRate: 20,
    },
    {
      id: "muv",
      name: "Premium MUV (Innova Crysta)",
      seats: 7,
      ratePerKm: 21,
      mileageKmpl: 11,
      ratePerDay: 3200,
      kmCapPerDay: 250,
      extraKmRate: 21,
    },
  ],
  // update manually when fuel price changes meaningfully
  baselineFuelPrice: 100.75,
  fuelSensitivity: 0.5,
  driverBataPerDay: 400,
  cancellationPolicy: "Free cancellation up to 2 hours before pickup. Cancellations within 2 hours or after driver dispatch incur a ₹300 fee.",
};
