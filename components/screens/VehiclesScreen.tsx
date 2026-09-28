"use client";

import { useState } from "react";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig, Vehicle } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";
import { prefetchMapChunks } from "@/lib/prefetchMap";

interface VehiclesScreenProps {
  onOpenRoutePreview: () => void;
}

// Vehicle SVG icons
function VehicleIcon({ id }: { id: string }) {
  if (id === "sedan") {
    return (
      <svg className="w-8 h-8 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
        <circle cx="7.5" cy="14.5" r="1.5" />
        <circle cx="16.5" cy="14.5" r="1.5" />
      </svg>
    );
  }
  if (id === "suv") {
    return (
      <svg className="w-8 h-8 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 8V6a2 2 0 00-2-2H7a2 2 0 00-2 2v2a3 3 0 00-3 3v6a2 2 0 002 2h1a2 2 0 002-2v-1h8v1a2 2 0 002 2h1a2 2 0 002-2v-6a3 3 0 00-3-3zM7 6h10v2H7V6zm-1 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm12 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 7h-2.58l-1.83-3.66A2 2 0 0013.8 2H10.2a2 2 0 00-1.79 1.34L6.58 7H4a2 2 0 00-2 2v9a2 2 0 002 2h1a2 2 0 002-2v-1h10v1a2 2 0 002 2h1a2 2 0 002-2V9a2 2 0 00-2-2zM9 5h6l1 2H8l1-2zm-2 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  );
}

export default function VehiclesScreen({ onOpenRoutePreview }: VehiclesScreenProps) {
  const {
    pickup,
    drop,
    route,
    tripType,
    driveMode,
    days,
    vehicleId,
    setVehicleId,
    setScreen,
  } = useBookingStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const distanceKm = route?.distanceKm || 0;

  // Calculate fares for all vehicles to identify the lowest fare for "Best value" badge
  const vehiclesWithFare = siteConfig.vehicles.map((v) => {
    const fare = calculateFare({
      vehicle: v,
      distanceKm,
      tripType,
      driveMode,
      days,
    });
    return { ...v, fare };
  });

  const lowestFare = Math.min(...vehiclesWithFare.map((v) => v.fare.total));
  const selectedVehicleObj = vehiclesWithFare.find((v) => v.id === vehicleId) || vehiclesWithFare[0];

  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4 select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen("home")}
            aria-label="Back to home"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-800">Select Vehicle</h2>
            <span className="text-[10px] text-slate-400 font-semibold">Step 2 of 4</span>
          </div>
        </div>

        {/* 4-segment progress bar (2 filled) */}
        <div className="flex gap-1 items-center w-20" aria-label="Step 2 of 4">
          <div className="h-1.5 rounded-full flex-1 bg-emerald-500" />
          <div className="h-1.5 rounded-full flex-1 bg-emerald-500" />
          <div className="h-1.5 rounded-full flex-1 bg-slate-200" />
          <div className="h-1.5 rounded-full flex-1 bg-slate-200" />
        </div>
      </div>

      {/* Route Summary Pill */}
      {pickup && drop && (
        <div className="bg-slate-800 text-white rounded-2xl p-3.5 shadow-lg border border-slate-700 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-1.5 text-xs font-bold truncate">
              <span className="truncate">{pickup.label || pickup.address}</span>
              <span className="text-amber-400 shrink-0">&rarr;</span>
              <span className="truncate">{drop.label || drop.address}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              <span>{distanceKm} km</span>
              {route?.durationMin ? <span> &bull; ~{route.durationMin} mins</span> : null}
              <span> &bull; {tripType === "round-trip" ? "Round Trip" : "One Way"}</span>
              <span> &bull; {driveMode === "with-driver" ? "With Driver" : "Self Drive"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoutePreview}
            onMouseEnter={prefetchMapChunks}
            onTouchStart={prefetchMapChunks}
            className="shrink-0 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-[10px] font-extrabold text-amber-400 border border-slate-600 flex items-center gap-1 active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>View Map</span>
          </button>
        </div>
      )}

      {/* Vehicle Cards List */}
      <div className="space-y-3">
        {vehiclesWithFare.map((v) => {
          const isSelected = vehicleId === v.id;
          const isBestValue = v.fare.total === lowestFare;
          const isExpanded = expandedId === v.id;

          return (
            <div
              key={v.id}
              onClick={() => setVehicleId(v.id)}
              className={`relative bg-white rounded-3xl p-4 transition-all cursor-pointer shadow-md ${
                isSelected
                  ? "ring-2 ring-emerald-500 shadow-emerald-500/10 border-emerald-500"
                  : "border border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Best Value Tag */}
              {isBestValue && (
                <div className="absolute -top-2.5 right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Best Value
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Vehicle Icon Box */}
                <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                  <VehicleIcon id={v.id} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-slate-800 truncate">{v.name}</h3>
                    {/* Seat Badge */}
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-slate-900 shrink-0"
                      style={{ backgroundColor: "#F5B700" }}
                    >
                      {v.seats} Seats
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {driveMode === "with-driver"
                      ? `₹${v.ratePerKm}/km &bull; ₹${siteConfig.driverBataPerDay} bata/day`
                      : `₹${v.ratePerDay}/day &bull; ${v.kmCapPerDay} km/day included`}
                  </p>
                </div>

                {/* Total Fare & Selection Radio */}
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-emerald-600">
                    ₹{v.fare.total.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : v.id);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Fare Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-600 space-y-1 animate-in fade-in">
                  <div className="font-bold text-slate-700">Fare Calculation:</div>
                  {v.fare.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-500">
                      <span>{item}</span>
                    </div>
                  ))}
                  {v.fare.notes.map((note, idx) => (
                    <div key={idx} className="text-slate-400 italic">
                      * {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Primary Continue Button */}
      <button
        type="button"
        onClick={() => setScreen("review")}
        className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span>Continue with {selectedVehicleObj.name.split(" ")[0]} (₹{selectedVehicleObj.fare.total.toLocaleString()})</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}
