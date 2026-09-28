"use client";

import { useState, useMemo } from "react";
import { siteConfig, Vehicle } from "@/config/siteConfig";
import { calculateFare, FareResult } from "@/lib/fare";
import { useBookingStore } from "@/store/useBookingStore";

/** Returns an SVG icon per vehicle category */
function VehicleIcon({ vehicleId }: { vehicleId: string }) {
  if (vehicleId === "sedan") {
    return (
      <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.402 9.368C17.034 8.55 16.214 8 15.302 8H8.698C7.786 8 6.966 8.55 6.598 9.368L5 13v7a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-7l-1.598-3.632zM8.698 10h6.604l1.049 2.5H7.649L8.698 10zM19 17H5v-2.5h14V17z" />
      </svg>
    );
  }
  if (vehicleId === "suv") {
    return (
      <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
      </svg>
    );
  }
  // MUV / Innova
  return (
    <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S5.17 15.5 6 15.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

/** 4-segment progress bar component */
function StepProgressBar({ currentStep, total = 4 }: { currentStep: number; total?: number }) {
  return (
    <div className="flex gap-1 items-center" aria-label={`Step ${currentStep} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full flex-1 transition-all duration-300 ${
            i < currentStep ? "bg-emerald-500" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function VehicleSelectionBottomSheet() {
  const {
    route,
    tripDetails,
    selectedVehicle,
    setSelectedVehicle,
    confirmVehicleSelection,
    setStep,
  } = useBookingStore();

  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const distanceKm = route?.distanceKm || 100;

  // Calculate live fares for all vehicles in siteConfig.vehicles
  const vehicleFares = useMemo(() => {
    const map = new Map<string, FareResult>();
    siteConfig.vehicles.forEach((vehicle) => {
      const fare = calculateFare({
        vehicle,
        distanceKm,
        tripType: tripDetails.tripType,
        driveMode: tripDetails.serviceMode,
        days: tripDetails.days,
      });
      map.set(vehicle.id, fare);
    });
    return map;
  }, [distanceKm, tripDetails.tripType, tripDetails.serviceMode, tripDetails.days]);

  // Find best value vehicle (lowest fare total)
  const bestValueId = useMemo(() => {
    let minFare = Infinity;
    let minId = "";
    vehicleFares.forEach((fare, id) => {
      if (fare.total < minFare) {
        minFare = fare.total;
        minId = id;
      }
    });
    return minId;
  }, [vehicleFares]);

  const activeVehicle = selectedVehicle || siteConfig.vehicles[0];

  const toggleExpand = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation();
    setExpandedVehicleId((prev) => (prev === vehicleId ? null : vehicleId));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-[250ms] ease-out">
      {/* Drag handle */}
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"
            aria-label="Back to trip details"
          >
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Choose Vehicle
            </h2>
            <p className="text-xs text-slate-500">
              Live fare based on {distanceKm} km route
            </p>
          </div>
        </div>

        {/* 4-segment progress bar */}
        <div className="w-20 shrink-0">
          <StepProgressBar currentStep={4} />
        </div>
      </div>

      {/* Vertical List of Vehicle Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
        {siteConfig.vehicles.map((vehicle: Vehicle) => {
          const isSelected = activeVehicle.id === vehicle.id;
          const isExpanded = expandedVehicleId === vehicle.id;
          const fare = vehicleFares.get(vehicle.id);
          const isBestValue = vehicle.id === bestValueId;

          return (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer select-none active:scale-[0.98] ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              {/* Best Value Tag */}
              {isBestValue && (
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white text-[10px] font-extrabold uppercase tracking-wider">
                    Best Value
                  </span>
                </div>
              )}

              {/* Card Main Info Row */}
              <div className="p-3.5 flex items-start justify-between gap-3">
                {/* Vehicle icon + info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <VehicleIcon vehicleId={vehicle.id} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900">
                        {vehicle.name}
                      </span>
                      {/* Seats badge in gold */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "#F5B700", color: "#1E293B" }}
                      >
                        {vehicle.seats} Seats
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      {tripDetails.serviceMode === "with-driver"
                        ? `₹${vehicle.ratePerKm}/km + ₹${siteConfig.driverBataPerDay} bata`
                        : `₹${vehicle.ratePerDay}/day (${vehicle.kmCapPerDay} km cap)`}
                    </p>
                  </div>
                </div>

                {/* Total & Info Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-600 block">
                      ₹{fare?.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Estimated Total
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleExpand(e, vehicle.id)}
                    aria-label="Toggle fare breakdown info"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs font-bold border active:scale-95 ${
                      isExpanded
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    i
                  </button>
                </div>
              </div>

              {/* Expanded Breakdown Accordion */}
              {isExpanded && fare && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/80 space-y-2 text-xs text-slate-600 animate-in fade-in duration-150">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Fare Calculation Breakdown
                  </div>

                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-100">
                    {fare.breakdown.map((line, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>{line.split(" = ")[0]}</span>
                        <span className="font-bold text-slate-800">
                          {line.split(" = ")[1]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {fare.notes.length > 0 && (
                    <div className="space-y-1">
                      {fare.notes.map((note, idx) => (
                        <div
                          key={idx}
                          className="text-[10px] text-slate-500 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SINGLE STICKY PRIMARY ACTION BUTTON */}
      <div className="pt-2 shrink-0 border-t border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => confirmVehicleSelection(activeVehicle)}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>Continue with {activeVehicle.name.split(" ")[0]}</span>
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
    </div>
  );
}
