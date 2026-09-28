"use client";

import { useState } from "react";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";

export default function DoneScreen() {
  const {
    bookingId,
    customerName,
    customerPhone,
    pickup,
    drop,
    route,
    tripDetails,
    selectedVehicle,
    resetBooking,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);

  const vehicle = selectedVehicle || siteConfig.vehicles[0];

  const handleCopyBookingId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Booking Confirmed!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your taxi reservation has been logged successfully
          </p>
        </div>

        {/* Booking ID Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1.5 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Booking Reference ID
          </span>
          <div className="text-2xl font-black tracking-wider text-emerald-400">
            {bookingId || "SRT-SUCCESS"}
          </div>

          <button
            type="button"
            onClick={handleCopyBookingId}
            className="text-[11px] font-bold text-slate-300 hover:text-white underline pt-1 inline-flex items-center gap-1"
          >
            {copied ? (
              <span className="text-emerald-400 font-bold">✓ Copied to clipboard!</span>
            ) : (
              <span>Copy Booking ID</span>
            )}
          </button>
        </div>

        {/* Saved Trip Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-left space-y-2">
          <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200/60 pb-2">
            <span>{customerName} ({customerPhone})</span>
            <span className="text-emerald-600">{vehicle.name.split(" ")[0]}</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="truncate">
              <span className="font-bold text-slate-400 mr-1">FROM:</span>
              <span>{pickup?.shortName || pickup?.displayName}</span>
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-400 mr-1">TO:</span>
              <span>{drop?.shortName || drop?.displayName}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Date: {tripDetails.pickupDate} ({tripDetails.pickupTime})</span>
              <span>Dist: {route?.distanceKm} km</span>
            </div>
          </div>
        </div>

        {/* Secondary Action */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={resetBooking}
            className="w-full h-13 min-h-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Book Another Taxi</span>
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
    </div>
  );
}
