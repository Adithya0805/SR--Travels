"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { LogoFull } from "@/components/Logo";
import { useReducedMotion, EASINGS } from "@/lib/motion";

export default function DoneScreen() {
  const {
    bookingId,
    customerName,
    customerPhone,
    pickup,
    drop,
    route,
    date,
    time,
    vehicleId,
    resetBooking,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const vehicle =
    siteConfig.vehicles.find((v) => v.id === vehicleId) ||
    siteConfig.vehicles[0];

  const handleCopyBookingId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Animated Success Icon per Requirement 7 */}
        <motion.div
          initial={{ scale: shouldReduceMotion ? 1 : 0.8, opacity: shouldReduceMotion ? 1 : 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: EASINGS.overshootFree }}
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <motion.path
                d="M4.5 12.75l6 6 9-13.5"
                initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  ease: "easeOut",
                  delay: shouldReduceMotion ? 0 : 0.15,
                }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <LogoFull height={48} />
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Booking Confirmed!
          </h2>
          <p className="text-xs text-slate-500">
            Your taxi reservation has been logged successfully
          </p>
        </div>

        {/* Booking ID Box — large ID + copy button per Requirement 7 */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.25,
            delay: shouldReduceMotion ? 0 : 0.55,
            ease: EASINGS.overshootFree,
          }}
          className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-md"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Booking Reference ID
          </span>
          <div className="text-3xl font-black tracking-wider text-emerald-400 break-all">
            {bookingId || "SRT-SUCCESS"}
          </div>

          <button
            type="button"
            onClick={handleCopyBookingId}
            className="mt-1 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Booking ID
              </>
            )}
          </button>
        </motion.div>

        {/* Saved Trip Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-left space-y-2">
          <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200/60 pb-2">
            <span>{customerName} ({customerPhone})</span>
            <span className="text-emerald-600">{vehicle.name.split(" ")[0]}</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="truncate">
              <span className="font-bold text-slate-400 mr-1">FROM:</span>
              <span>{pickup?.label || pickup?.address}</span>
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-400 mr-1">TO:</span>
              <span>{drop?.label || drop?.address}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Date: {date} ({time})</span>
              <span>Dist: {route?.distanceKm} km</span>
            </div>
          </div>
        </div>

        {/* Book Another button per Requirement 7 */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.25,
            delay: shouldReduceMotion ? 0 : 0.85,
            ease: "easeOut",
          }}
          className="space-y-2 pt-1"
        >
          <button
            type="button"
            onClick={resetBooking}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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
        </motion.div>
      </div>
    </div>
  );
}
