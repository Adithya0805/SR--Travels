"use client";

import { useState, useMemo } from "react";
import { siteConfig, Vehicle } from "@/config/siteConfig";
import { calculateFare, FareResult } from "@/lib/fare";
import { useBookingStore } from "@/store/useBookingStore";

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

  const activeVehicle = selectedVehicle || siteConfig.vehicles[0];

  const toggleExpand = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation();
    setExpandedVehicleId((prev) => (prev === vehicleId ? null : vehicleId));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none max-h-[85vh] flex flex-col transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
      {/* Drag handle */}
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-1 shrink-0" />

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

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
          Step 4 of 4
        </span>
      </div>

      {/* Vertical List of Vehicle Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
        {siteConfig.vehicles.map((vehicle: Vehicle) => {
          const isSelected = activeVehicle.id === vehicle.id;
          const isExpanded = expandedVehicleId === vehicle.id;
          const fare = vehicleFares.get(vehicle.id);

          return (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer select-none active:scale-98 ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              {/* Card Main Info Row */}
              <div className="p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {vehicle.name}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {vehicle.seats} Seats
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    {tripDetails.serviceMode === "with-driver"
                      ? `₹${vehicle.ratePerKm}/km + ₹${siteConfig.driverBataPerDay} bata`
                      : `₹${vehicle.ratePerDay}/day (${vehicle.kmCapPerDay} km cap)`}
                  </p>
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
          className="w-full h-13 min-h-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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
