"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { searchPlaces, reverseGeocode, MapLocation } from "@/lib/maps";

export interface MapPickerProps {
  target: "pickup" | "drop";
  initialLocation?: {
    lat: number;
    lng: number;
    address?: string;
    label?: string;
  } | null;
  onConfirm: (location: {
    label: string;
    address: string;
    lat: number;
    lng: number;
  }) => void;
  onClose: () => void;
}

export default function MapPicker({
  target,
  initialLocation,
  onConfirm,
  onClose,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const defaultLat = initialLocation?.lat || 13.0827; // Chennai default
  const defaultLng = initialLocation?.lng || 80.2707;

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [address, setAddress] = useState<string>(
    initialLocation?.address || initialLocation?.label || ""
  );
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isPickup = target === "pickup";
  const pinBadge = isPickup ? "P" : "D";
  const pinGradient = isPickup
    ? "linear-gradient(135deg,#10B981,#059669)"
    : "linear-gradient(135deg,#64748B,#475569)";

  // Initialize Leaflet Map and inject Leaflet CSS only when opened
  useEffect(() => {
    // Dynamically inject Leaflet stylesheet
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "/leaflet/leaflet.css";
      document.head.appendChild(link);
    }

    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("movestart", () => {
      setIsMoving(true);
      setIsGeocoding(true);
    });

    map.on("moveend", () => {
      setIsMoving(false);
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        const resolved = await reverseGeocode(c.lat, c.lng);
        setAddress(resolved);
        setIsGeocoding(false);
      }, 350);
    });

    mapRef.current = map;

    // Initial reverse geocode if no address provided
    if (!address) {
      reverseGeocode(defaultLat, defaultLng).then((addr) => {
        setAddress(addr);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Search places debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(query);
      setSuggestions(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (place: MapLocation) => {
    setQuery("");
    setShowDropdown(false);
    setAddress(place.shortName || place.displayName);
    setCenter({ lat: place.lat, lng: place.lng });
    if (mapRef.current) {
      mapRef.current.flyTo([place.lat, place.lng], 16, { duration: 1 });
    }
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsNotice("Geolocation not supported by this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 16, { duration: 1 });
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsNotice(
          err.code === err.PERMISSION_DENIED
            ? "GPS permission denied."
            : "Could not retrieve GPS location."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleConfirm = () => {
    const label = address.split(",")[0]?.trim() || (isPickup ? "Pickup Location" : "Drop Location");
    onConfirm({
      label,
      address: address || label,
      lat: center.lat,
      lng: center.lng,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 select-none animate-in fade-in duration-200">
      {/* Top Floating Bar: Back Button & Search Input */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
        {/* Back / Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close map picker"
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all pointer-events-auto shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Search Bar Container */}
        <div className="relative flex-1 pointer-events-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder={`Search ${isPickup ? "pickup" : "drop"} landmark / city...`}
              className="w-full h-11 pl-10 pr-9 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="absolute left-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto z-30">
              {isSearching && (
                <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Searching places...
                </div>
              )}
              {!isSearching && suggestions.length === 0 && query.length >= 2 && (
                <div className="p-3 text-xs text-slate-400">No matching landmarks found.</div>
              )}
              {!isSearching &&
                suggestions.map((p, idx) => (
                  <button
                    key={`${p.lat}-${p.lng}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="truncate font-semibold text-slate-800">{p.shortName}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* GPS Notice Banner */}
      {gpsNotice && (
        <div className="absolute top-18 left-4 right-4 z-20 bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-xs flex items-center justify-between shadow">
          <span>{gpsNotice}</span>
          <button type="button" onClick={() => setGpsNotice(null)} className="font-bold text-sm px-1">
            &times;
          </button>
        </div>
      )}

      {/* Locate Me Floating Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        aria-label="Locate with GPS"
        className="absolute bottom-40 right-4 z-20 w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.364-6.364l-2.121 2.121M6.757 17.243l-2.121 2.121m12.728 0l-2.121-2.121M6.757 6.757L4.636 4.636M12 15a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        )}
      </button>

      {/* Center Fixed Pin */}
      <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
        <div
          className={`transition-transform duration-200 ${
            isMoving ? "-translate-y-3 scale-110" : "translate-y-0 scale-100"
          }`}
        >
          <div
            className="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: pinGradient }}
          >
            {pinBadge}
          </div>
        </div>
        <div
          className={`w-4 h-1.5 bg-slate-900/40 rounded-full blur-[1px] transition-all duration-200 mt-0.5 ${
            isMoving ? "scale-75 opacity-40" : "scale-100 opacity-100"
          }`}
        />
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Confirmation Card */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-100 space-y-3 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm"
            style={{ background: pinGradient }}
          >
            {pinBadge}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Set {isPickup ? "Pickup" : "Drop"} Point
            </span>
            {isGeocoding ? (
              <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4 mt-1" />
            ) : (
              <p className="text-xs font-bold text-slate-800 truncate">
                {address || "Pan map to select point"}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !address}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>Confirm {isPickup ? "Pickup" : "Drop"} Location</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
