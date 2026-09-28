"use client";

import { useState } from "react";
import { useBookingStore, TripDetails } from "@/store/useBookingStore";

const getTodayString = () => new Date().toISOString().split("T")[0];

export default function TripDetailsBottomSheet() {
  const { tripDetails, confirmTripDetails, setStep } = useBookingStore();

  const [form, setForm] = useState<TripDetails>({ ...tripDetails });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const todayStr = getTodayString();

  const showDaysStepper =
    form.tripType === "round-trip" || form.serviceMode === "self-drive";

  const handleValidation = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.pickupDate) {
      newErrors.pickupDate = "Please select a pickup date.";
    } else if (form.pickupDate < todayStr) {
      newErrors.pickupDate = "Pickup date cannot be in the past.";
    }

    if (!form.pickupTime) {
      newErrors.pickupTime = "Please select a pickup time.";
    }

    if (showDaysStepper && (!form.days || form.days < 1)) {
      newErrors.days = "Number of days must be at least 1.";
    }

    if (!form.passengers || form.passengers < 1 || form.passengers > 7) {
      newErrors.passengers = "Passengers must be between 1 and 7.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      confirmTripDetails(form);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none max-h-[85vh] overflow-y-auto transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
      {/* Drag handle */}
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-1" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStep("route")}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"
            aria-label="Back to route view"
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
              Trip Details
            </h2>
            <p className="text-xs text-slate-500">
              Customize schedule, service mode & passengers
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
          Step 3 of 4
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Toggle 1: One Way | Round Trip */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Trip Type
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tripType: "one-way" }))}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all min-h-[44px] active:scale-98 ${
                form.tripType === "one-way"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              One Way
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tripType: "round-trip" }))}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all min-h-[44px] active:scale-98 ${
                form.tripType === "round-trip"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Round Trip
            </button>
          </div>
        </div>

        {/* Toggle 2: With Driver | Self Drive */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Service Mode
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, serviceMode: "with-driver" }))}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all min-h-[44px] active:scale-98 ${
                form.serviceMode === "with-driver"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              With Driver
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, serviceMode: "self-drive" }))}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all min-h-[44px] active:scale-98 ${
                form.serviceMode === "self-drive"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Self Drive
            </button>
          </div>
        </div>

        {/* Date & Time Pickers */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pickup Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={form.pickupDate}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, pickupDate: e.target.value }));
                if (errors.pickupDate) {
                  setErrors((prev) => ({ ...prev, pickupDate: "" }));
                }
              }}
              className={`w-full h-12 px-3 bg-slate-50 border rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.pickupDate ? "border-red-500 bg-red-50/50" : "border-slate-200"
              }`}
            />
            {errors.pickupDate && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">
                {errors.pickupDate}
              </p>
            )}
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Pickup Time
            </label>
            <input
              type="time"
              value={form.pickupTime}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, pickupTime: e.target.value }));
                if (errors.pickupTime) {
                  setErrors((prev) => ({ ...prev, pickupTime: "" }));
                }
              }}
              className={`w-full h-12 px-3 bg-slate-50 border rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.pickupTime ? "border-red-500 bg-red-50/50" : "border-slate-200"
              }`}
            />
            {errors.pickupTime && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">
                {errors.pickupTime}
              </p>
            )}
          </div>
        </div>

        {/* Conditional Stepper: Number of Days */}
        {showDaysStepper && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Number of Days
              </span>
              <span className="text-[10px] text-slate-400 block">
                {form.serviceMode === "self-drive"
                  ? "Daily rental rate applies"
                  : "Includes driver bata per day"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, days: Math.max(1, prev.days - 1) }))
                }
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center text-lg active:scale-95 transition-transform shadow-sm min-h-[40px]"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-slate-900 w-6 text-center">
                {form.days}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, days: prev.days + 1 }))
                }
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center text-lg active:scale-95 transition-transform shadow-sm min-h-[40px]"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Stepper: Passengers (1 to 7) */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">
                Passengers
              </span>
              {form.passengers > 4 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                  SUV/MUV Recommended
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Select 1 to 7 passengers
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  passengers: Math.max(1, prev.passengers - 1),
                }))
              }
              className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center text-lg active:scale-95 transition-transform shadow-sm min-h-[40px]"
            >
              -
            </button>
            <span className="text-sm font-extrabold text-slate-900 w-6 text-center">
              {form.passengers}
            </span>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  passengers: Math.min(7, prev.passengers + 1),
                }))
              }
              className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center text-lg active:scale-95 transition-transform shadow-sm min-h-[40px]"
            >
              +
            </button>
          </div>
        </div>

        {/* SINGLE PRIMARY ACTION BUTTON */}
        <button
          type="submit"
          className="w-full h-13 min-h-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>See Vehicles</span>
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
      </form>
    </div>
  );
}
