"use client";

import { useState, useEffect, useRef } from "react";
import { searchPlaces, MapLocation } from "@/lib/maps";

interface PickupBottomSheetProps {
  address: string;
  isGeocoding: boolean;
  gpsErrorNotice: string | null;
  onClearGpsNotice: () => void;
  onSelectSuggestion: (lat: number, lng: number, address: string) => void;
  onConfirmPickup: () => void;
}

export default function PickupBottomSheet({
  address,
  isGeocoding,
  gpsErrorNotice,
  onClearGpsNotice,
  onSelectSuggestion,
  onConfirmPickup,
}: PickupBottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input (400ms)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(searchQuery);
      setSuggestions(results);
      setIsSearching(false);
      setIsDropdownOpen(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = (place: MapLocation) => {
    setSearchQuery("");
    setIsDropdownOpen(false);
    onSelectSuggestion(place.lat, place.lng, place.shortName);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none">
      {/* Drag / Bottom Sheet handle indicator */}
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-1" />

      {/* GPS Notice Banner (if permission denied or error) */}
      {gpsErrorNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-600 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{gpsErrorNotice}</span>
          </div>
          <button
            type="button"
            onClick={onClearGpsNotice}
            className="text-amber-600 hover:text-amber-900 font-bold text-base px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900">
          Set Pickup Location
        </h2>
        <p className="text-xs text-slate-500">
          Drag the map to position pin or search landmark below
        </p>
      </div>

      {/* Search Input for Landmark / Suggestion Autocomplete */}
      <div className="relative w-full" ref={dropdownRef}>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search landmark, city or district..."
            className="w-full h-12 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="absolute right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              &times;
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
            {isSearching && (
              <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Searching places in Tamil Nadu...
              </div>
            )}

            {!isSearching &&
              suggestions.length === 0 &&
              searchQuery.trim().length >= 2 && (
                <div className="px-4 py-3 text-xs text-slate-400">
                  No places found. Try another landmark name.
                </div>
              )}

            {!isSearching &&
              suggestions.map((place, idx) => (
                <button
                  key={`${place.lat}-${place.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left min-h-[44px] px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-2.5"
                >
                  <svg
                    className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {place.shortName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {place.displayName}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Reverse Geocoded Pin Address Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>

        <div className="flex-1 overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Selected Pickup Point
          </span>
          {isGeocoding ? (
            <div className="h-5 bg-slate-200 animate-pulse rounded w-3/4 mt-1" />
          ) : (
            <p className="text-xs font-semibold text-slate-800 truncate">
              {address || "Move map pin to select address"}
            </p>
          )}
        </div>
      </div>

      {/* Confirm Pickup Action Button */}
      <button
        type="button"
        onClick={onConfirmPickup}
        disabled={isGeocoding || !address}
        className="w-full h-13 min-h-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>Confirm Pickup</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
    </div>
  );
}
