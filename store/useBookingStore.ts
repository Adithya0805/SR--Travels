import { create } from "zustand";
import { getRoute } from "@/lib/maps";
import { siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";

export interface LocationPoint {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteData {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
  isApproximate?: boolean;
}

export type ScreenState = "home" | "vehicles" | "review" | "done";
export type TripType = "one-way" | "round-trip";
export type DriveMode = "with-driver" | "self-drive";

export interface SavedBookingRecord {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  pickup: LocationPoint | null;
  drop: LocationPoint | null;
  date: string;
  time: string;
  tripType: TripType;
  driveMode: DriveMode;
  days: number;
  passengers: number;
  vehicleId: string;
  route: RouteData | null;
  totalFare: number;
  createdAt: string;
}

const getTodayString = () => new Date().toISOString().split("T")[0];

const generateBookingCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SRT-${code}`;
};

interface BookingStore {
  // Required core state schema
  pickup: LocationPoint | null;
  drop: LocationPoint | null;
  date: string;
  time: string;
  tripType: TripType;
  driveMode: DriveMode;
  days: number;
  passengers: number;
  vehicleId: string;
  route: RouteData | null;
  screen: ScreenState;

  // Supplementary states for flow & booking
  isRouteLoading: boolean;
  routeError: string | null;
  bookingId: string | null;
  customerName: string;
  customerPhone: string;
  isSubmittingBooking: boolean;
  highlightedField: string | null;

  // Actions
  setPickup: (pickup: LocationPoint | null) => void;
  setDrop: (drop: LocationPoint | null) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setTripType: (tripType: TripType) => void;
  setDriveMode: (driveMode: DriveMode) => void;
  setDays: (days: number) => void;
  setPassengers: (passengers: number) => void;
  setVehicleId: (vehicleId: string) => void;
  setRoute: (route: RouteData | null) => void;
  setScreen: (screen: ScreenState) => void;
  setHighlightedField: (field: string | null) => void;

  fetchRoute: () => Promise<RouteData | null>;
  saveBookingToSupabase: (
    name: string,
    phone: string,
    website?: string,
    formStartTime?: number
  ) => Promise<string>;
  rebook: (record: SavedBookingRecord) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  pickup: null,
  drop: null,
  date: getTodayString(),
  time: "09:00",
  tripType: "one-way",
  driveMode: "with-driver",
  days: 1,
  passengers: 1,
  vehicleId: siteConfig.vehicles[0]?.id || "sedan",
  route: null,
  screen: "home",

  isRouteLoading: false,
  routeError: null,
  bookingId: null,
  customerName: "",
  customerPhone: "",
  isSubmittingBooking: false,
  highlightedField: null,

  setPickup: (pickup) => {
    set({ pickup, route: null, routeError: null });
  },

  setDrop: (drop) => {
    set({ drop, route: null, routeError: null });
  },

  setDate: (date) => set({ date }),
  setTime: (time) => set({ time }),
  setTripType: (tripType) => set({ tripType }),
  setDriveMode: (driveMode) => set({ driveMode }),
  setDays: (days) => set({ days: Math.max(1, days) }),
  setPassengers: (passengers) => set({ passengers: Math.max(1, passengers) }),
  setVehicleId: (vehicleId) => set({ vehicleId }),
  setRoute: (route) => set({ route }),
  setScreen: (screen) => set({ screen }),
  setHighlightedField: (highlightedField) => set({ highlightedField }),

  fetchRoute: async () => {
    const { pickup, drop } = get();
    if (!pickup || !drop) return null;

    set({ isRouteLoading: true, routeError: null });

    try {
      const origin = {
        lat: pickup.lat,
        lng: pickup.lng,
        displayName: pickup.address,
        shortName: pickup.label,
      };
      const destination = {
        lat: drop.lat,
        lng: drop.lng,
        displayName: drop.address,
        shortName: drop.label,
      };

      const routeResult = await getRoute(origin, destination);
      if (!routeResult || routeResult.distanceKm === 0) {
        throw new Error("Unable to calculate driving route between selected points.");
      }

      const routeData: RouteData = {
        distanceKm: routeResult.distanceKm,
        durationMin: routeResult.durationMins,
        geometry: routeResult.coordinates,
        isApproximate: routeResult.isApproximate ?? false,
      };

      set({
        route: routeData,
        isRouteLoading: false,
        routeError: null,
      });

      return routeData;
    } catch (err: any) {
      console.error("Route calculation error:", err);
      const errMsg = err?.message || "Failed to calculate route. Please verify addresses.";
      set({
        isRouteLoading: false,
        routeError: errMsg,
      });
      return null;
    }
  },

  saveBookingToSupabase: async (
    name: string,
    phone: string,
    website?: string,
    formStartTime?: number
  ) => {
    set({ isSubmittingBooking: true });
    const {
      pickup,
      drop,
      route,
      date,
      time,
      tripType,
      driveMode,
      days,
      vehicleId,
    } = get();

    const vehicle =
      siteConfig.vehicles.find((v) => v.id === vehicleId) ||
      siteConfig.vehicles[0];
    const distanceKm = route?.distanceKm || 0;

    const fare = calculateFare({
      vehicle,
      distanceKm,
      tripType,
      driveMode,
      days,
    });

    const bookingCode = generateBookingCode();
    const travelDateTime = `${date} ${time}`;

    // 1. Submit booking via API handler
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode,
          name: name.trim(),
          phone: phone.trim(),
          pickup_address: pickup?.address || pickup?.label || "",
          pickup_lat: pickup?.lat || null,
          pickup_lng: pickup?.lng || null,
          drop_address: drop?.address || drop?.label || "",
          drop_lat: drop?.lat || null,
          drop_lng: drop?.lng || null,
          distance_km: distanceKm,
          trip_type: tripType,
          drive_mode: driveMode,
          days,
          vehicle_id: vehicle.id,
          fare_total: fare.total,
          travel_datetime: travelDateTime,
          website: website || "",
          form_start_time: formStartTime || Date.now(),
        }),
      });

      const responseData = await res.json();
      if (!res.ok) {
        console.warn("Booking API notice:", responseData.error || res.statusText);
      } else {
        console.log("Booking created successfully via API:", bookingCode);
      }
    } catch (err) {
      console.error("Booking submission error:", err);
    }

    // 2. Save local backup to localStorage
    const record: SavedBookingRecord = {
      bookingId: bookingCode,
      customerName: name,
      customerPhone: phone,
      pickup,
      drop,
      date,
      time,
      tripType,
      driveMode,
      days,
      passengers: get().passengers,
      vehicleId,
      route,
      totalFare: fare.total,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingStr = localStorage.getItem("sr_travels_bookings");
      const existing: SavedBookingRecord[] = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(record);
      localStorage.setItem("sr_travels_bookings", JSON.stringify(existing));
      localStorage.setItem("sr_travels_last_booking", JSON.stringify(record));
    } catch (err) {
      console.error("LocalStorage save error:", err);
    }

    set({
      bookingId: bookingCode,
      customerName: name,
      customerPhone: phone,
      isSubmittingBooking: false,
      screen: "done",
    });

    return bookingCode;
  },

  rebook: (record: SavedBookingRecord) => {
    set({
      pickup: record.pickup,
      drop: record.drop,
      date: getTodayString(),
      time: record.time || "09:00",
      tripType: record.tripType,
      driveMode: record.driveMode,
      days: record.days,
      passengers: record.passengers,
      vehicleId: record.vehicleId,
      route: record.route,
      screen: record.route ? "vehicles" : "home",
    });
    if (!record.route && record.pickup && record.drop) {
      get().fetchRoute();
    }
  },

  resetBooking: () => {
    set({
      pickup: null,
      drop: null,
      date: getTodayString(),
      time: "09:00",
      tripType: "one-way",
      driveMode: "with-driver",
      days: 1,
      passengers: 1,
      vehicleId: siteConfig.vehicles[0]?.id || "sedan",
      route: null,
      screen: "home",
      isRouteLoading: false,
      routeError: null,
      bookingId: null,
      customerName: "",
      customerPhone: "",
      isSubmittingBooking: false,
    });
  },
}));
