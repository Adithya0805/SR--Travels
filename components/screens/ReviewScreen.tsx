"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";

const RoutePreview = dynamic(() => import("@/components/map/RoutePreview"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">
      Loading route preview...
    </div>
  ),
});

interface ReviewScreenProps {
  onOpenRoutePreview: () => void;
}

export default function ReviewScreen({ onOpenRoutePreview }: ReviewScreenProps) {
  const {
    pickup,
    drop,
    route,
    date,
    time,
    tripType,
    driveMode,
    days,
    passengers,
    vehicleId,
    customerName,
    customerPhone,
    isSubmittingBooking,
    isRouteLoading,
    fetchRoute,
    setScreen,
    saveBookingToSupabase,
  } = useBookingStore();

  const [name, setName] = useState(customerName || "");
  const [phone, setPhone] = useState(customerPhone || "");
  const [honeypot, setHoneypot] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formStartTime] = useState<number>(Date.now());

  const vehicle =
    siteConfig.vehicles.find((v) => v.id === vehicleId) ||
    siteConfig.vehicles[0];

  const distanceKm = route?.distanceKm || 0;
  const fare = calculateFare({
    vehicle,
    distanceKm,
    tripType,
    driveMode,
    days,
  });

  const validatePhone = (num: string) => {
    const clean = num.replace(/\D/g, "");
    return clean.length === 10 && /^[6-9]/.test(clean);
  };

  const handleWhatsAppConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage("Please enter your name (at least 2 letters).");
      return;
    }

    if (!validatePhone(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      return;
    }

    try {
      // 1. Save to Supabase API & LocalStorage
      const bookingCode = await saveBookingToSupabase(
        cleanName,
        cleanPhone,
        honeypot,
        formStartTime
      );

      // 2. Format prefilled WhatsApp message
      const pickupText = pickup?.label || pickup?.address || "Pickup";
      const dropText = drop?.label || drop?.address || "Drop";
      const tripTypeText = tripType === "round-trip" ? "Round Trip" : "One Way";
      const driveModeText = driveMode === "with-driver" ? "With Driver" : "Self Drive";

      const message = `*SR Travels Booking Request*
━━━━━━━━━━━━━━━━━━━━
*Booking ID:* ${bookingCode}
*Customer:* ${cleanName}
*Phone:* +91 ${cleanPhone}

*TRIP DETAILS*
*From:* ${pickupText}
*To:* ${dropText}
*Date & Time:* ${date} at ${time}
*Trip Type:* ${tripTypeText} (${days} Day${days > 1 ? "s" : ""})
*Service:* ${driveModeText}
*Vehicle:* ${vehicle.name}
*Passengers:* ${passengers}

*FARE ESTIMATE*
*Est. Distance:* ${distanceKm} km
*Total Fare:* ₹${fare.total.toLocaleString()}
_${fare.notes.join(", ")}_
━━━━━━━━━━━━━━━━━━━━
Please confirm my driver and booking details.`;

      const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMessage("Something went wrong while logging your booking. You can still confirm via WhatsApp or Call.");
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${siteConfig.phone}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4 select-none">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen("vehicles")}
            aria-label="Back to vehicle selection"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-800">Review &amp; Confirm</h2>
            <span className="text-[10px] text-slate-400 font-semibold">Step 3 of 4</span>
          </div>
        </div>

        {/* 4-segment progress bar (3 filled) */}
        <div className="flex gap-1 items-center w-20" aria-label="Step 3 of 4">
          <div className="h-1.5 rounded-full flex-1 bg-emerald-500" />
          <div className="h-1.5 rounded-full flex-1 bg-emerald-500" />
          <div className="h-1.5 rounded-full flex-1 bg-emerald-500" />
          <div className="h-1.5 rounded-full flex-1 bg-slate-200" />
        </div>
      </div>

      {/* Trip & Fare Breakdown Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-4">
        {/* Route Details */}
        <div className="space-y-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-1 ring-4 ring-emerald-100" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pickup</span>
              <p className="text-xs font-bold text-slate-800 truncate">{pickup?.label || pickup?.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-slate-600 shrink-0 mt-1 ring-4 ring-slate-100" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
              <p className="text-xs font-bold text-slate-800 truncate">{drop?.label || drop?.address}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
            <span>{date} at {time}</span>
            <button
              type="button"
              onClick={onOpenRoutePreview}
              className="text-emerald-600 font-extrabold text-[10px] hover:underline"
            >
              View Route ({distanceKm} km) &rarr;
            </button>
          </div>
        </div>

        {/* Vehicle & Options */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle</span>
            <span className="font-extrabold text-slate-800">{vehicle.name.split(" ")[0]} ({vehicle.seats} Seats)</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Type &amp; Service</span>
            <span className="font-extrabold text-slate-800">
              {tripType === "round-trip" ? "Round Trip" : "One Way"} &bull; {driveMode === "with-driver" ? "Driver" : "Self"}
            </span>
          </div>
        </div>

        {/* Fare Summary */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Fare Summary
          </div>
          {fare.breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs text-slate-600">
              <span>{item.split("=")[0]}</span>
              <span className="font-bold text-slate-800">{item.split("=")[1]}</span>
            </div>
          ))}

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 mt-2">
            <span className="text-sm font-extrabold text-slate-900">Total Estimated Fare</span>
            <span className="text-2xl font-black text-emerald-600">₹{fare.total.toLocaleString()}</span>
          </div>

          <div className="text-[10px] text-slate-400 italic pt-1">
            * Tolls, parking and inter-state permit charges as per actuals.
          </div>
        </div>
      </div>

      {/* Route Preview Map (200px non-interactive) per SRT-R5 */}
      {pickup && drop && route && (
        <div className="space-y-2">
          <RoutePreview
            pickup={pickup}
            drop={drop}
            route={route}
            onViewLarger={onOpenRoutePreview}
          />

          {route.isApproximate && (
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  Approximate
                </span>
                <p className="text-[10px] text-amber-800 font-medium">
                  Estimated via straight-line route
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchRoute()}
                disabled={isRouteLoading}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {isRouteLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer Contact Details Card */}
      <form onSubmit={handleWhatsAppConfirm} className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-3.5">
        <div>
          <h3 className="text-xs font-black text-slate-800">Contact Information</h3>
          <p className="text-[10px] text-slate-400">Your driver and trip confirmation will be sent here</p>
        </div>

        {/* Honeypot field for bot protection */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="space-y-2.5">
          {/* Name input */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Phone input */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              WhatsApp Mobile Number *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-extrabold text-slate-500">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full h-11 pl-12 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          {/* Confirm via WhatsApp button */}
          <button
            type="submit"
            disabled={isSubmittingBooking}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmittingBooking ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
                </svg>
                <span>Confirm on WhatsApp</span>
              </>
            )}
          </button>

          {/* Secondary Call to Book button */}
          <button
            type="button"
            onClick={handleCall}
            className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <span>Call to book &mdash; {siteConfig.phoneDisplay}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
