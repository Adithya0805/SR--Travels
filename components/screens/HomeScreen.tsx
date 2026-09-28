"use client";

import { useState, useEffect, useRef } from "react";
import { useBookingStore, LocationPoint } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { searchPlaces, reverseGeocode, MapLocation } from "@/lib/maps";
import { prefetchMapChunks } from "@/lib/prefetchMap";

interface HomeScreenProps {
  onOpenMapPicker: (target: "pickup" | "drop") => void;
}

export default function HomeScreen({ onOpenMapPicker }: HomeScreenProps) {
  const {
    pickup,
    drop,
    date,
    time,
    tripType,
    driveMode,
    days,
    passengers,
    isRouteLoading,
    routeError,
    setPickup,
    setDrop,
    setDate,
    setTime,
    setTripType,
    setDriveMode,
    setDays,
    setPassengers,
    fetchRoute,
    setScreen,
  } = useBookingStore();

  // Search input states
  const [pickupInput, setPickupInput] = useState(pickup?.label || pickup?.address || "");
  const [dropInput, setDropInput] = useState(drop?.label || drop?.address || "");
  const [pickupSuggestions, setPickupSuggestions] = useState<MapLocation[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<MapLocation[]>([]);
  const [activeSearch, setActiveSearch] = useState<"pickup" | "drop" | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync inputs when pickup/drop state changes (e.g. from map picker)
  useEffect(() => {
    if (pickup) {
      setPickupInput(pickup.label || pickup.address);
    }
  }, [pickup]);

  useEffect(() => {
    if (drop) {
      setDropInput(drop.label || drop.address);
    }
  }, [drop]);

  // Debounced search for pickup
  useEffect(() => {
    if (activeSearch !== "pickup" || pickupInput.length < 2) {
      setPickupSuggestions([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(pickupInput);
      setPickupSuggestions(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pickupInput, activeSearch]);

  // Debounced search for drop
  useEffect(() => {
    if (activeSearch !== "drop" || dropInput.length < 2) {
      setDropSuggestions([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(dropInput);
      setDropSuggestions(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [dropInput, activeSearch]);

  const handleSelectPickup = (loc: MapLocation) => {
    const point: LocationPoint = {
      label: loc.shortName || loc.displayName.split(",")[0],
      address: loc.displayName,
      lat: loc.lat,
      lng: loc.lng,
    };
    setPickup(point);
    setPickupInput(point.label);
    setPickupSuggestions([]);
    setActiveSearch(null);
    setValidationError(null);
  };

  const handleSelectDrop = (loc: MapLocation) => {
    const point: LocationPoint = {
      label: loc.shortName || loc.displayName.split(",")[0],
      address: loc.displayName,
      lat: loc.lat,
      lng: loc.lng,
    };
    setDrop(point);
    setDropInput(point.label);
    setDropSuggestions([]);
    setActiveSearch(null);
    setValidationError(null);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setValidationError("GPS is not supported on this device/browser.");
      return;
    }

    setGpsLoading(true);
    setValidationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
        const point: LocationPoint = {
          label: "Current Location",
          address: addr || "Current GPS Location",
          lat: latitude,
          lng: longitude,
        };
        setPickup(point);
        setPickupInput("Current Location");
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setValidationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Please allow GPS access or search manually."
            : "Could not retrieve GPS location."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If user typed without picking from autocomplete, try autoselecting first match
    let currentPickup = pickup;
    let currentDrop = drop;

    if (!currentPickup && pickupInput.trim().length >= 2) {
      const places = await searchPlaces(pickupInput);
      if (places.length > 0) {
        currentPickup = {
          label: places[0].shortName || places[0].displayName.split(",")[0],
          address: places[0].displayName,
          lat: places[0].lat,
          lng: places[0].lng,
        };
        setPickup(currentPickup);
      }
    }

    if (!currentDrop && dropInput.trim().length >= 2) {
      const places = await searchPlaces(dropInput);
      if (places.length > 0) {
        currentDrop = {
          label: places[0].shortName || places[0].displayName.split(",")[0],
          address: places[0].displayName,
          lat: places[0].lat,
          lng: places[0].lng,
        };
        setDrop(currentDrop);
      }
    }

    if (!currentPickup) {
      setValidationError("Please specify a pickup location.");
      return;
    }
    if (!currentDrop) {
      setValidationError("Please specify a destination drop location.");
      return;
    }

    const routeResult = await fetchRoute();
    if (routeResult) {
      setScreen("vehicles");
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4">
      {/* Hero Booking Card */}
      <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        {/* Trip Type & Drive Mode Toggles */}
        <div className="space-y-2">
          {/* Trip Type */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTripType("one-way")}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                tripType === "one-way"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              One Way
            </button>
            <button
              type="button"
              onClick={() => setTripType("round-trip")}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                tripType === "round-trip"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Round Trip
            </button>
          </div>

          {/* Drive Mode */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setDriveMode("with-driver")}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                driveMode === "with-driver"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              With Driver
            </button>
            <button
              type="button"
              onClick={() => setDriveMode("self-drive")}
              className={`py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                driveMode === "self-drive"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Self Drive
            </button>
          </div>
        </div>

        {/* Location Inputs Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Pickup Input Container */}
          <div className="relative">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Pickup Point
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 w-3 h-3 rounded-full bg-emerald-500 shrink-0 pointer-events-none ring-4 ring-emerald-100" />
              <input
                type="text"
                value={pickupInput}
                onChange={(e) => {
                  setPickupInput(e.target.value);
                  setActiveSearch("pickup");
                  if (pickup) setPickup(null);
                }}
                onFocus={() => setActiveSearch("pickup")}
                placeholder="Enter pickup city, airport, landmark..."
                className="w-full h-12 pl-10 pr-20 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />

              {/* Action icons right: GPS locate + Pick on map */}
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={gpsLoading}
                  title="Use Current Location"
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center active:scale-95 transition-transform"
                >
                  {gpsLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.364-6.364l-2.121 2.121M6.757 17.243l-2.121 2.121m12.728 0l-2.121-2.121M6.757 6.757L4.636 4.636M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenMapPicker("pickup")}
                  onMouseEnter={prefetchMapChunks}
                  onTouchStart={prefetchMapChunks}
                  onFocus={prefetchMapChunks}
                  title="Pick pickup location on map"
                  className="px-2.5 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1 active:scale-95 transition-transform border border-emerald-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  <span>Map</span>
                </button>
              </div>
            </div>

            {/* Autocomplete Dropdown */}
            {activeSearch === "pickup" && pickupSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                {pickupSuggestions.map((place, idx) => (
                  <button
                    key={`${place.lat}-${place.lng}-${idx}`}
                    type="button"
                    onClick={() => handleSelectPickup(place)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">{place.shortName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drop Input Container */}
          <div className="relative">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Destination / Drop Point
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 w-3 h-3 rounded-full bg-slate-600 shrink-0 pointer-events-none ring-4 ring-slate-200" />
              <input
                type="text"
                value={dropInput}
                onChange={(e) => {
                  setDropInput(e.target.value);
                  setActiveSearch("drop");
                  if (drop) setDrop(null);
                }}
                onFocus={() => setActiveSearch("drop")}
                placeholder="Enter destination city, hotel, address..."
                className="w-full h-12 pl-10 pr-20 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />

              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenMapPicker("drop")}
                  onMouseEnter={prefetchMapChunks}
                  onTouchStart={prefetchMapChunks}
                  onFocus={prefetchMapChunks}
                  title="Pick drop location on map"
                  className="px-2.5 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold flex items-center gap-1 active:scale-95 transition-transform border border-slate-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  <span>Map</span>
                </button>
              </div>
            </div>

            {/* Drop Autocomplete Dropdown */}
            {activeSearch === "drop" && dropSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                {dropSuggestions.map((place, idx) => (
                  <button
                    key={`${place.lat}-${place.lng}-${idx}`}
                    type="button"
                    onClick={() => handleSelectDrop(place)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">{place.shortName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date, Time & Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Date */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Pickup Date
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Pickup Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Days & Passengers counters */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Days Counter (always visible for self-drive or round-trip) */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Duration (Days)
              </label>
              <div className="flex items-center justify-between h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  -
                </button>
                <span className="text-xs font-extrabold text-slate-800">{days} Day{days > 1 ? "s" : ""}</span>
                <button
                  type="button"
                  onClick={() => setDays(days + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Passengers
              </label>
              <div className="flex items-center justify-between h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  -
                </button>
                <span className="text-xs font-extrabold text-slate-800">{passengers} Pax</span>
                <button
                  type="button"
                  onClick={() => setPassengers(Math.min(7, passengers + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Validation & Route Error Notices */}
          {(validationError || routeError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{validationError || routeError}</span>
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isRouteLoading}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isRouteLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calculating Route &amp; Fares...</span>
              </>
            ) : (
              <>
                <span>Estimate Fare &amp; Choose Vehicle</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2.5 text-center border border-slate-200/60 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="text-[10px] font-black text-slate-800 block">Zero Cancel Fee</span>
          <span className="text-[9px] text-slate-400">Flexibility guaranteed</span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2.5 text-center border border-slate-200/60 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-black text-slate-800 block">24/7 Available</span>
          <span className="text-[9px] text-slate-400">Tamil Nadu wide</span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2.5 text-center border border-slate-200/60 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
          </div>
          <span className="text-[10px] font-black text-slate-800 block">Clear Pricing</span>
          <span className="text-[9px] text-slate-400">No hidden fees</span>
        </div>
      </div>

      {/* Tariff Highlights Card */}
      <div className="bg-slate-800/90 text-white rounded-3xl p-4 space-y-2.5 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
            Vehicle Fleet &amp; Starting Rates
          </span>
          <span className="text-[10px] text-slate-400">Outstation Fares</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {siteConfig.vehicles.map((v) => (
            <div key={v.id} className="bg-slate-900/80 rounded-2xl p-2.5 text-center border border-slate-700/60">
              <span className="text-[11px] font-bold text-white block truncate">{v.name.split(" ")[0]}</span>
              <span className="text-[10px] text-amber-400 font-extrabold block">₹{v.ratePerKm}/km</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">{v.seats} Seats</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
