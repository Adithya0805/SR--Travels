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
  pickupLocation?: {
    lat: number;
    lng: number;
  } | null;
  onConfirm: (location: {
    label: string;
    address: string;
    lat: number;
    lng: number;
  }) => void;
  onClose: () => void;
}

// Ambur, Tamil Nadu default coordinates
const AMBUR_DEFAULT = { lat: 12.7904, lng: 78.7166 };

export default function MapPicker({
  target,
  initialLocation,
  pickupLocation,
  onConfirm,
  onClose,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep map position in refs — NEVER in React state during drag
  const currentCenterRef = useRef<{ lat: number; lng: number }>({
    lat: initialLocation?.lat || pickupLocation?.lat || AMBUR_DEFAULT.lat,
    lng: initialLocation?.lng || pickupLocation?.lng || AMBUR_DEFAULT.lng,
  });

  const [address, setAddress] = useState<string>(
    initialLocation?.address || initialLocation?.label || ""
  );
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [tilesLoaded, setTilesLoaded] = useState<boolean>(false);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isPickup = target === "pickup";
  const pinBadge = isPickup ? "P" : "D";
  const pinGradient = isPickup
    ? "linear-gradient(135deg,#10B981,#059669)"
    : "linear-gradient(135deg,#1c2d4f,#131f37)";

  // Initialize Leaflet Map with performance options
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

    const startLat = currentCenterRef.current.lat;
    const startLng = currentCenterRef.current.lng;

    // Optimized Leaflet configuration per SRT-R4
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: false,
      preferCanvas: true,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 1,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    tileLayer.on("load", () => {
      setTilesLoaded(true);
    });

    tileLayer.addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("movestart", () => {
      setIsMoving(true);
      setIsGeocoding(true);
    });

    map.on("moveend", () => {
      setIsMoving(false);
      const c = map.getCenter();
      // Store in ref only — no re-renders on move!
      currentCenterRef.current = { lat: c.lat, lng: c.lng };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce reverse geocoding 500ms
      debounceTimerRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        const resolved = await reverseGeocode(c.lat, c.lng);
        setAddress(resolved);
        setIsGeocoding(false);
      }, 500);
    });

    mapRef.current = map;

    // Initial reverse geocode if no address provided
    if (!address) {
      reverseGeocode(startLat, startLng).then((addr) => {
        setAddress(addr);
      });
    }

    return () => {
      // Destroy map instance cleanly on close
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Debounced search for places (300ms)
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
      setFocusedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (place: MapLocation) => {
    setQuery("");
    setShowDropdown(false);
    const short = place.shortName || place.displayName.split(",")[0];
    setAddress(place.displayName || short);
    currentCenterRef.current = { lat: place.lat, lng: place.lng };
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], 16);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleConfirm = () => {
    const label = address.split(",")[0]?.trim() || (isPickup ? "Pickup Location" : "Drop Location");
    onConfirm({
      label,
      address: address || label,
      lat: currentCenterRef.current.lat,
      lng: currentCenterRef.current.lng,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 select-none animate-in fade-in duration-200">
      {/* Top Floating Bar: Close (X) button & Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
        {/* Close (X) button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close map picker"
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-800 text-lg font-black active:scale-95 transition-all pointer-events-auto shrink-0"
        >
          &times;
        </button>

        {/* Search Bar Container */}
        <div className="relative flex-1 pointer-events-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder={`Search ${isPickup ? "pickup" : "drop"} landmark / city...`}
              className="w-full h-11 pl-9 pr-8 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 text-xs font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="absolute left-3 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

          {/* Autocomplete Dropdown (keyboard and touch supported) */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto z-30">
              {isSearching && (
                <div className="p-3 text-xs text-slate-400 flex items-center gap-2 font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Searching places...
                </div>
              )}
              {!isSearching && suggestions.length === 0 && query.length >= 2 && (
                <div className="p-3 text-xs text-slate-400 font-medium">No places found.</div>
              )}
              {!isSearching &&
                suggestions.map((p, idx) => (
                  <button
                    key={`${p.lat}-${p.lng}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(p)}
                    className={`w-full text-left px-3.5 py-2.5 border-b border-slate-100 last:border-b-0 text-xs flex flex-col transition-colors ${
                      focusedIndex === idx ? "bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 truncate">{p.shortName}</span>
                    {p.secondaryAddress && (
                      <span className="text-[10px] text-slate-400 truncate">{p.secondaryAddress}</span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Skeleton until first tiles load */}
      {!tilesLoaded && (
        <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
          <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wide">Loading Map Tiles...</p>
        </div>
      )}

      {/* Center Fixed Pin */}
      <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
        <div
          className={`transition-transform duration-150 ${
            isMoving ? "-translate-y-2 scale-105" : "translate-y-0 scale-100"
          }`}
        >
          <div
            className="w-10 h-10 rounded-full border-3 border-white shadow-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: pinGradient }}
          >
            {pinBadge}
          </div>
        </div>
        <div
          className={`w-3.5 h-1 bg-slate-900/40 rounded-full blur-[1px] transition-all duration-150 mt-0.5 ${
            isMoving ? "scale-75 opacity-30" : "scale-100 opacity-80"
          }`}
        />
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Address Confirmation Card */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-100 space-y-3 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-sm"
            style={{ background: pinGradient }}
          >
            {pinBadge}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Confirm {isPickup ? "Pickup" : "Drop"} Point
            </span>
            {isGeocoding ? (
              <div className="h-4 bg-slate-200 animate-pulse rounded w-3/4 mt-1" />
            ) : (
              <p className="text-xs font-extrabold text-slate-800 truncate">
                {address || "Pan map to target point"}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !address}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
