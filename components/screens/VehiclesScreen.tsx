"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig, Vehicle } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";
import { AnimatedFare } from "@/components/AnimatedFare";
import { useReducedMotion, getCardVariants, EASINGS } from "@/lib/motion";

interface VehiclesScreenProps {
  onOpenRoutePreview?: () => void;
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
  const shouldReduceMotion = useReducedMotion();

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

  const formattedDuration = route?.durationMin
    ? route.durationMin >= 60
      ? `${Math.floor(route.durationMin / 60)}h ${route.durationMin % 60}m`
      : `${route.durationMin} min`
    : "Calculating";

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

      {/* Route Summary Chip - No map here per SRT-R5 */}
      {pickup && drop && (
        <div className="bg-[#1c2d4f] text-white rounded-2xl p-3.5 shadow-lg border border-slate-700/60 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold truncate">
              <span className="truncate">{pickup.label || pickup.address}</span>
              <span className="text-[#cb950f] shrink-0">&rarr;</span>
              <span className="truncate">{drop.label || drop.address}</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1.5">
              <span>{tripType === "round-trip" ? "Round Trip" : "One Way"}</span>
              <span>&bull;</span>
              <span>{driveMode === "with-driver" ? "With Driver" : "Self Drive"}</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-bold">No min km</span>
            </div>
          </div>

          <div className="shrink-0 px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-700 text-xs font-black text-[#cb950f] shadow-inner whitespace-nowrap">
            {distanceKm} km &bull; {formattedDuration}
          </div>
        </div>
      )}

      {/* Fuel Reference Rate Card per Requirement 5 & 8 */}
      <motion.div
        variants={getCardVariants(shouldReduceMotion, 0)}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
            {/* Fuel Pump Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.34 0 .65-.09.93-.24l1.86 1.86V19a1 1 0 01-1 1h-1v-8a2 2 0 00-2-2h-7a2 2 0 00-2 2v9H4a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v2h2V5a3 3 0 00-3-3H4a3 3 0 00-3 3v15a3 3 0 003 3h13a3 3 0 003-3v-7.59l2.77-2.77c.39-.39.39-1.02 0-1.41zM6 10h5v4H6v-4zm12 0a.5.5 0 110-1 .5.5 0 010 1z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-black text-slate-800">
              Fuel Reference Rate: ₹{siteConfig.baselineFuelPrice}/L
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Manually updated
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          TN Reference
        </span>
      </motion.div>

      {/* Vehicle Cards List */}
      <div className="space-y-3">
        {vehiclesWithFare.map((v) => {
          const isSelected = vehicleId === v.id;
          const isBestValue = v.fare.total === lowestFare;
          const isExpanded = expandedId === v.id;

          return (
            <motion.div
              key={v.id}
              onClick={() => setVehicleId(v.id)}
              animate={{
                scale: isSelected && !shouldReduceMotion ? 1.02 : 1,
                borderColor: isSelected ? "#10b981" : "#e2e8f0",
                boxShadow: isSelected
                  ? "0 10px 25px -5px rgba(16, 185, 129, 0.2), 0 8px 10px -6px rgba(16, 185, 129, 0.1)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
              }}
              transition={{
                duration: 0.15,
                ease: EASINGS.standard,
              }}
              className="relative bg-white rounded-3xl p-4 cursor-pointer border"
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
                      ? `₹${v.ratePerKm}/km &bull; ₹${siteConfig.driverBataPerDay} bata/day &bull; Fuel adj +₹${v.fare.fuelAdjustment}/km`
                      : `₹${v.ratePerDay}/day &bull; ${v.kmCapPerDay} km/day included`}
                  </p>
                </div>

                {/* Total Fare & Selection Radio */}
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-emerald-600 flex items-center justify-end">
                    <AnimatedFare value={v.fare.total} prefix="₹" />
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
            </motion.div>
          );
        })}
      </div>

      {/* Primary Continue Button */}
      <button
        type="button"
        onClick={() => setScreen("review")}
        className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span className="flex items-center gap-1">
          <span>Continue with {selectedVehicleObj.name.split(" ")[0]} (</span>
          <AnimatedFare value={selectedVehicleObj.fare.total} prefix="₹" />
          <span>)</span>
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}
