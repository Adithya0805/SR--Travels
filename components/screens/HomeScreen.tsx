"use client";

import { useState, useEffect, useRef } from "react";
import { useBookingStore, LocationPoint, SavedBookingRecord, getTodayString } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { searchPlaces, reverseGeocode, MapLocation } from "@/lib/maps";
import { prefetchMapChunks } from "@/lib/prefetchMap";
import { suggestMinimumDays } from "@/lib/fare";

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
    route,
    highlightedField,
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
    rebook,
  } = useBookingStore();

  // Input states
  const [pickupInput, setPickupInput] = useState(pickup?.label || pickup?.address || "");
  const [dropInput, setDropInput] = useState(drop?.label || drop?.address || "");
  const [pickupSuggestions, setPickupSuggestions] = useState<MapLocation[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<MapLocation[]>([]);
  const [activeSearch, setActiveSearch] = useState<"pickup" | "drop" | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Recent trips from localStorage
  const [recentTrips, setRecentTrips] = useState<SavedBookingRecord[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sr_travels_bookings");
      if (stored) {
        const parsed: SavedBookingRecord[] = JSON.parse(stored);
        setRecentTrips(parsed.slice(0, 3)); // show max 3 recent trips
      }
    } catch (e) {
      console.error("Failed to load recent trips:", e);
    }
  }, []);

  // Sync inputs when pickup/drop changes in store (e.g. from map picker or popular destination click)
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

  // Debounced search for pickup (300ms)
  useEffect(() => {
    if (activeSearch !== "pickup" || pickupInput.trim().length < 2) {
      setPickupSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(pickupInput);
      setPickupSuggestions(results);
      setIsSearching(false);
      setFocusedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [pickupInput, activeSearch]);

  // Debounced search for drop (300ms)
  useEffect(() => {
    if (activeSearch !== "drop" || dropInput.trim().length < 2) {
      setDropSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(dropInput);
      setDropSuggestions(results);
      setIsSearching(false);
      setFocusedIndex(-1);
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
  };

  // Swap pickup & drop
  const handleSwap = () => {
    const tempPoint = pickup;
    const tempInput = pickupInput;

    setPickup(drop);
    setPickupInput(dropInput);

    setDrop(tempPoint);
    setDropInput(tempInput);
  };

  // "Use my location" - GPS requested ONLY on user tap per SRT-R3
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage({
        text: "GPS location is not supported by your browser.",
        isError: true,
      });
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const addressText = await reverseGeocode(latitude, longitude);
          const point: LocationPoint = {
            label: addressText.split(",")[0] || "My Current Location",
            address: addressText,
            lat: latitude,
            lng: longitude,
          };
          setPickup(point);
          setPickupInput(point.label);
          setGpsMessage({
            text: `Location detected: ${point.label}`,
            isError: false,
          });
        } catch {
          setGpsMessage({
            text: "Could not resolve address for your coordinates.",
            isError: true,
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        let msg = "Could not access location. Please check your GPS settings.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. You can still type your pickup place or pick on map.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please try again or type your place.";
        }
        setGpsMessage({ text: msg, isError: true });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Popular destination chip clicked -> fills Drop
  const handlePopularDestinationClick = (dest: {
    name: string;
    lat: number;
    lng: number;
    state?: string;
  }) => {
    const point: LocationPoint = {
      label: dest.name,
      address: `${dest.name}, ${dest.state || "Tamil Nadu"}`,
      lat: dest.lat,
      lng: dest.lng,
    };
    setDrop(point);
    setDropInput(dest.name);
    setDropSuggestions([]);
    setActiveSearch(null);
  };

  // Keyboard navigation in suggestions list
  const handleKeyDown = (
    e: React.KeyboardEvent,
    type: "pickup" | "drop",
    suggestions: MapLocation[]
  ) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      if (type === "pickup") handleSelectPickup(suggestions[focusedIndex]);
      else handleSelectDrop(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setActiveSearch(null);
    }
  };

  // Form validity: disabled until pickup, drop, date, and time are valid
  const isFormValid =
    (Boolean(pickup) || pickupInput.trim().length >= 2) &&
    (Boolean(drop) || dropInput.trim().length >= 2) &&
    Boolean(date) &&
    Boolean(time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    let currentPickup = pickup;
    let currentDrop = drop;

    // Resolve unselected typed queries
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

    if (!currentPickup || !currentDrop) return;

    const routeResult = await fetchRoute();
    if (routeResult) {
      setScreen("vehicles");
    }
  };

  const todayStr = getTodayString();

  const suggestedMinDays =
    tripType === "round-trip" && route
      ? suggestMinimumDays({
          oneWayDistanceKm: route.distanceKm,
          oneWayDurationMin: route.durationMin,
        })
      : 1;

  return (
    <div className="w-full max-w-lg mx-auto pb-20 space-y-4">
      {/* Title */}
      <div className="px-1">
        <h1 className="text-xl font-black text-white tracking-tight">
          Where are you going?
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Outstation cabs &amp; self-drive cars at transparent fares
        </p>
      </div>

      {/* Main Booking Card */}
      <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        {/* Segmented Toggles */}
        <div className="space-y-2">
          {/* One Way | Round Trip */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setTripType("one-way")}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                tripType === "one-way"
                  ? "bg-white text-slate-900 shadow-sm"
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
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Round Trip
            </button>
          </div>

          {/* With Driver | Self Drive */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setDriveMode("with-driver")}
              className={`py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
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
              className={`py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${
                driveMode === "self-drive"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Self Drive
            </button>
          </div>
        </div>

        {/* Location Fields with Swap Button */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative space-y-2.5">
            {/* Pickup Field */}
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
                  onKeyDown={(e) => handleKeyDown(e, "pickup", pickupSuggestions)}
                  placeholder="Enter pickup city, airport, landmark..."
                  className={`w-full h-12 pl-10 pr-20 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    highlightedField === "pickup"
                      ? "border-emerald-500 ring-4 ring-emerald-500/30 bg-emerald-50/60 scale-[1.01]"
                      : "border-slate-200"
                  }`}
                />

                {/* Pickup Action Icons: "use my location" + "pick on map" */}
                <div className="absolute right-2 flex items-center gap-1">
                  {/* "use my location" icon button */}
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={gpsLoading}
                    title="Use my location"
                    aria-label="Use my location"
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

                  {/* "pick on map" icon button */}
                  <button
                    type="button"
                    onClick={() => onOpenMapPicker("pickup")}
                    onMouseEnter={prefetchMapChunks}
                    onTouchStart={prefetchMapChunks}
                    onFocus={prefetchMapChunks}
                    title="Pick pickup on map"
                    aria-label="Pick pickup on map"
                    className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Pickup Suggestions Dropdown (Max 5, English, bold short name + secondary) */}
              {activeSearch === "pickup" && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                  {isSearching && (
                    <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Searching places...
                    </div>
                  )}
                  {!isSearching && pickupSuggestions.length === 0 && pickupInput.length >= 2 && (
                    <div className="p-3 text-xs text-slate-400">No places found.</div>
                  )}
                  {!isSearching &&
                    pickupSuggestions.map((place, idx) => (
                      <button
                        key={`${place.lat}-${place.lng}-${idx}`}
                        type="button"
                        onClick={() => handleSelectPickup(place)}
                        className={`w-full text-left px-3.5 py-2.5 border-b border-slate-100 last:border-b-0 text-xs flex flex-col transition-colors ${
                          focusedIndex === idx ? "bg-emerald-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-extrabold text-slate-900 truncate">{place.shortName}</span>
                        {place.secondaryAddress && (
                          <span className="text-[10px] text-slate-400 truncate">{place.secondaryAddress}</span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Swap Button Between Pickup and Drop */}
            <div className="flex justify-end pr-3 -my-1">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap Pickup and Drop"
                aria-label="Swap Pickup and Drop locations"
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-emerald-400 text-slate-500 hover:text-emerald-600 shadow-sm flex items-center justify-center active:scale-90 transition-transform z-10 -my-2.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              </button>
            </div>

            {/* Drop Field */}
            <div className="relative">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Drop Destination
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 w-3 h-3 rounded-full bg-slate-700 shrink-0 pointer-events-none ring-4 ring-slate-100" />
                <input
                  type="text"
                  value={dropInput}
                  onChange={(e) => {
                    setDropInput(e.target.value);
                    setActiveSearch("drop");
                    if (drop) setDrop(null);
                  }}
                  onFocus={() => setActiveSearch("drop")}
                  onKeyDown={(e) => handleKeyDown(e, "drop", dropSuggestions)}
                  placeholder="Enter destination city, hotel, address..."
                  className={`w-full h-12 pl-10 pr-12 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    highlightedField === "drop"
                      ? "border-emerald-500 ring-4 ring-emerald-500/30 bg-emerald-50/60 scale-[1.01]"
                      : "border-slate-200"
                  }`}
                />

                {/* "pick on map" icon button for Drop */}
                <div className="absolute right-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => onOpenMapPicker("drop")}
                    onMouseEnter={prefetchMapChunks}
                    onTouchStart={prefetchMapChunks}
                    onFocus={prefetchMapChunks}
                    title="Pick drop on map"
                    aria-label="Pick drop on map"
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drop Suggestions Dropdown (Max 5, English, bold short name + secondary) */}
              {activeSearch === "drop" && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                  {isSearching && (
                    <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Searching places...
                    </div>
                  )}
                  {!isSearching && dropSuggestions.length === 0 && dropInput.length >= 2 && (
                    <div className="p-3 text-xs text-slate-400">No places found.</div>
                  )}
                  {!isSearching &&
                    dropSuggestions.map((place, idx) => (
                      <button
                        key={`${place.lat}-${place.lng}-${idx}`}
                        type="button"
                        onClick={() => handleSelectDrop(place)}
                        className={`w-full text-left px-3.5 py-2.5 border-b border-slate-100 last:border-b-0 text-xs flex flex-col transition-colors ${
                          focusedIndex === idx ? "bg-emerald-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-extrabold text-slate-900 truncate">{place.shortName}</span>
                        {place.secondaryAddress && (
                          <span className="text-[10px] text-slate-400 truncate">{place.secondaryAddress}</span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* GPS Notice / Feedback */}
          {gpsMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
                gpsMessage.isError
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              <span>{gpsMessage.text}</span>
              <button
                type="button"
                onClick={() => setGpsMessage(null)}
                className="font-bold text-sm px-1 ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {/* Date & Time Inputs */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Pickup Date
              </label>
              <input
                type="date"
                min={todayStr}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Pickup Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Days & Passengers counters */}
          <div className="grid grid-cols-2 gap-2.5">
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
              {tripType === "round-trip" && suggestedMinDays > 1 && days < suggestedMinDays && (
                <p className="text-[10px] text-amber-600 font-bold mt-1 leading-tight">
                  Minimum {suggestedMinDays} days suggested for this distance
                </p>
              )}
            </div>

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

          {/* Route error message */}
          {routeError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
              {routeError}
            </div>
          )}

          {/* Primary Action Button: "See Vehicles & Fare" (disabled until valid) */}
          <button
            type="submit"
            disabled={!isFormValid || isRouteLoading}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isRouteLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Checking Route &amp; Rates...</span>
              </>
            ) : (
              <>
                <span>See Vehicles &amp; Fare</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Popular Destination Chips */}
      {siteConfig.popularDestinations && siteConfig.popularDestinations.length > 0 && (
        <div className="space-y-2 px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Popular Destinations
          </span>
          <div className="flex flex-wrap gap-2">
            {siteConfig.popularDestinations.map((dest) => (
              <button
                key={dest.name}
                type="button"
                onClick={() => handlePopularDestinationClick(dest)}
                className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-slate-200 text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{dest.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips List (tap to refill) */}
      {recentTrips.length > 0 && (
        <div className="space-y-2 px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Recent Trips
          </span>
          <div className="space-y-2">
            {recentTrips.map((b) => (
              <button
                key={b.bookingId}
                type="button"
                onClick={() => rebook(b)}
                className="w-full text-left bg-white/80 hover:bg-white border border-slate-200 rounded-2xl p-3 shadow-sm active:scale-98 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                    <span className="truncate">{b.pickup?.label || b.pickup?.address}</span>
                    <span className="text-amber-500 shrink-0">&rarr;</span>
                    <span className="truncate">{b.drop?.label || b.drop?.address}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                    {b.date} &bull; {b.tripType === "round-trip" ? "Round Trip" : "One Way"}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0">
                  Tap to refill
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* One Thin Trust Line Only */}
      <div className="text-center py-2">
        <p className="text-[11px] font-semibold text-slate-400">
          24/7 Outstation &amp; Local Taxi &bull; No Minimum Distance &bull; Zero Cancellation Fee
        </p>
      </div>
    </div>
  );
}
