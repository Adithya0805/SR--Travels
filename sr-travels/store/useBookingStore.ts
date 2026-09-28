import { create } from "zustand";
import { getRoute, MapLocation } from "@/lib/maps";
import { Vehicle, siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";
import { supabase } from "@/lib/supabase";

export type BookingStep =
  | "pickup"
  | "drop"
  | "route"
  | "details"
  | "vehicles"
  | "summary"
  | "done";

export interface RouteData {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
}

export interface TripDetails {
  tripType: "one-way" | "round-trip";
  serviceMode: "with-driver" | "self-drive";
  pickupDate: string;
  pickupTime: string;
  days: number;
  passengers: number;
}

export interface SavedBookingRecord {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  pickup: MapLocation | null;
  drop: MapLocation | null;
  distanceKm: number;
  tripDetails: TripDetails;
  selectedVehicle: Vehicle;
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

interface BookingState {
  step: BookingStep;
  pickup: MapLocation | null;
  drop: MapLocation | null;
  route: RouteData | null;
  isRouteLoading: boolean;
  routeError: string | null;

  // Trip details state
  tripDetails: TripDetails;
  selectedVehicle: Vehicle | null;

  // Customer & Booking state
  bookingId: string | null;
  customerName: string;
  customerPhone: string;
  isSubmittingBooking: boolean;

  setStep: (step: BookingStep) => void;
  setPickup: (location: MapLocation | null) => void;
  setDrop: (location: MapLocation | null) => void;
  setTripDetails: (details: Partial<TripDetails>) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  confirmPickup: (location: MapLocation) => void;
  confirmDrop: (location: MapLocation) => void;
  confirmTripDetails: (details: TripDetails) => void;
  confirmVehicleSelection: (vehicle: Vehicle) => void;
  saveBookingToSupabase: (name: string, phone: string) => Promise<string>;
  rebook: (record: SavedBookingRecord) => void;
  fetchRoute: () => Promise<void>;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  step: "pickup",
  pickup: null,
  drop: null,
  route: null,
  isRouteLoading: false,
  routeError: null,

  tripDetails: {
    tripType: "one-way",
    serviceMode: "with-driver",
    pickupDate: getTodayString(),
    pickupTime: "09:00",
    days: 1,
    passengers: 1,
  },
  selectedVehicle: siteConfig.vehicles[0] || null,

  bookingId: null,
  customerName: "",
  customerPhone: "",
  isSubmittingBooking: false,

  setStep: (step) => set({ step }),
  setPickup: (pickup) => set({ pickup }),
  setDrop: (drop) => set({ drop }),
  setSelectedVehicle: (selectedVehicle) => set({ selectedVehicle }),

  setTripDetails: (details) =>
    set((state) => ({
      tripDetails: { ...state.tripDetails, ...details },
    })),

  confirmPickup: (location) => {
    set({
      pickup: location,
      step: "drop",
      drop: get().drop || {
        lat: location.lat + 0.05,
        lng: location.lng + 0.05,
        displayName: "",
        shortName: "",
      },
    });
  },

  confirmDrop: (location) => {
    set({ drop: location, step: "route" });
    get().fetchRoute();
  },

  confirmTripDetails: (details) => {
    set({
      tripDetails: details,
      step: "vehicles",
    });
  },

  confirmVehicleSelection: (vehicle) => {
    set({
      selectedVehicle: vehicle,
      step: "summary",
    });
  },

  saveBookingToSupabase: async (name: string, phone: string) => {
    set({ isSubmittingBooking: true });
    const { pickup, drop, route, tripDetails, selectedVehicle } = get();
    const vehicle = selectedVehicle || siteConfig.vehicles[0];
    const distanceKm = route?.distanceKm || 0;

    const fare = calculateFare({
      vehicle,
      distanceKm,
      tripType: tripDetails.tripType,
      driveMode: tripDetails.serviceMode,
      days: tripDetails.days,
    });

    const bookingCode = generateBookingCode();
    const travelDateTime = `${tripDetails.pickupDate} ${tripDetails.pickupTime}`;

    // 1. Submit booking via secure rate-limited API route handler
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode,
          name: name.trim(),
          phone: phone.trim(),
          pickup_address: pickup?.shortName || pickup?.displayName || "",
          pickup_lat: pickup?.lat || null,
          pickup_lng: pickup?.lng || null,
          drop_address: drop?.shortName || drop?.displayName || "",
          drop_lat: drop?.lat || null,
          drop_lng: drop?.lng || null,
          distance_km: distanceKm,
          trip_type: tripDetails.tripType,
          drive_mode: tripDetails.serviceMode,
          days: tripDetails.days,
          vehicle_id: vehicle.id,
          fare_total: fare.total,
          travel_datetime: travelDateTime,
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

    // 2. Save local backup to LocalStorage
    const record: SavedBookingRecord = {
      bookingId: bookingCode,
      customerName: name,
      customerPhone: phone,
      pickup,
      drop,
      distanceKm,
      tripDetails,
      selectedVehicle: vehicle,
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
      step: "done",
    });

    return bookingCode;
  },

  rebook: (record: SavedBookingRecord) => {
    set({
      pickup: record.pickup,
      drop: record.drop,
      tripDetails: {
        ...record.tripDetails,
        pickupDate: getTodayString(),
      },
      selectedVehicle: record.selectedVehicle,
      step: "route",
    });
    get().fetchRoute();
  },

  fetchRoute: async () => {
    const { pickup, drop } = get();
    if (!pickup || !drop) return;

    set({ isRouteLoading: true, routeError: null });

    try {
      const routeData = await getRoute(pickup, drop);
      if (!routeData || routeData.distanceKm === 0) {
        throw new Error("Unable to calculate driving route between selected points.");
      }

      set({
        route: {
          distanceKm: routeData.distanceKm,
          durationMin: routeData.durationMins,
          geometry: routeData.coordinates,
        },
        isRouteLoading: false,
        routeError: null,
      });
    } catch (err: any) {
      console.error("Route calculation error:", err);
      set({
        isRouteLoading: false,
        routeError:
          err?.message || "Failed to calculate route. Please check your connection.",
      });
    }
  },

  resetBooking: () =>
    set({
      step: "pickup",
      pickup: null,
      drop: null,
      route: null,
      isRouteLoading: false,
      routeError: null,
      tripDetails: {
        tripType: "one-way",
        serviceMode: "with-driver",
        pickupDate: getTodayString(),
        pickupTime: "09:00",
        days: 1,
        passengers: 1,
      },
      selectedVehicle: siteConfig.vehicles[0] || null,
      bookingId: null,
      customerName: "",
      customerPhone: "",
      isSubmittingBooking: false,
    }),
}));
