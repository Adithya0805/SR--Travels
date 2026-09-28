"use client";

import { useState, useEffect } from "react";
import { useBookingStore } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";

export default function BookingSummaryBottomSheet() {
  const {
    pickup,
    drop,
    route,
    tripDetails,
    selectedVehicle,
    saveBookingToSupabase,
    isSubmittingBooking,
    setStep,
  } = useBookingStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const vehicle = selectedVehicle || siteConfig.vehicles[0];
  const distanceKm = route?.distanceKm || 0;

  const fare = calculateFare({
    vehicle,
    distanceKm,
    tripType: tripDetails.tripType,
    driveMode: tripDetails.serviceMode,
    days: tripDetails.days,
  });

  const modeLabel =
    tripDetails.serviceMode === "with-driver" ? "With Driver" : "Self Drive";
  const typeLabel =
    tripDetails.tripType === "one-way" ? "One Way" : "Round Trip";

  // Validate phone number using /^[6-9]\d{9}$/
  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your name.";
    }

    const phoneClean = phone.trim().replace(/\s+/g, "");
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneClean) {
      newErrors.phone = "Please enter your phone number.";
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.phone = "Enter a valid 10-digit mobile number starting with 6-9.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmWhatsApp = async () => {
    if (!validate()) return;

    // 1. Insert into Supabase table via rate-limited API route handler
    const bookingCode = await saveBookingToSupabase(
      name.trim(),
      phone.trim(),
      website,
      formStartTime
    );

    // 2. Construct Google Maps links
    const pickupMapUrl = pickup
      ? `https://www.google.com/maps?q=${pickup.lat},${pickup.lng}`
      : "";
    const dropMapUrl = drop
      ? `https://www.google.com/maps?q=${drop.lat},${drop.lng}`
      : "";

    // 3. Build pre-filled WhatsApp message
    const messageText = `Hello ${siteConfig.businessName}! I would like to confirm my taxi booking:

🆔 Booking ID: ${bookingCode}
👤 Name: ${name.trim()}
📞 Phone: ${phone.trim()}

📍 Pickup: ${pickup?.shortName || pickup?.displayName || "Not specified"}
🔗 Pickup Map: ${pickupMapUrl}

🎯 Drop: ${drop?.shortName || drop?.displayName || "Not specified"}
🔗 Drop Map: ${dropMapUrl}

🚗 Vehicle: ${vehicle.name}
🛠️ Mode: ${modeLabel} (${typeLabel})
📅 Date: ${tripDetails.pickupDate} at ${tripDetails.pickupTime} (${tripDetails.days} day(s))
👥 Passengers: ${tripDetails.passengers}
💰 Total Fare: ₹${fare.total.toLocaleString()} (${distanceKm} km)

Please confirm my booking. Thank you!`;

    const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
      messageText
    )}`;

    // 4. Open WhatsApp in new window
    window.open(whatsappUrl, "_blank");
  };

  const handleCallToBook = async () => {
    if (!validate()) return;
    await saveBookingToSupabase(
      name.trim(),
      phone.trim(),
      website,
      formStartTime
    );
    window.location.href = `tel:${siteConfig.phone}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none max-h-[85vh] overflow-y-auto transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-1" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStep("vehicles")}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"
            aria-label="Back to vehicle selection"
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
              Confirm Booking
            </h2>
            <p className="text-xs text-slate-500">
              Enter details to finalize reservation
            </p>
          </div>
        </div>

        {/* 4-segment progress bar (all complete) */}
        <div className="flex gap-1 items-center w-20 shrink-0" aria-label="Final step">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 bg-emerald-500" />
          ))}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-700">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-bold">
          <span className="text-slate-900 text-sm">{vehicle.name}</span>
          <span className="text-emerald-600 text-base font-black">
            ₹{fare.total.toLocaleString()}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="truncate">
            <span className="font-bold text-slate-400 uppercase mr-1">From:</span>
            <span className="font-semibold text-slate-800">
              {pickup?.shortName || pickup?.displayName}
            </span>
          </div>

          <div className="truncate">
            <span className="font-bold text-slate-400 uppercase mr-1">To:</span>
            <span className="font-semibold text-slate-800">
              {drop?.shortName || drop?.displayName}
            </span>
          </div>

          <div className="flex justify-between text-slate-500 pt-1">
            <span>
              {tripDetails.pickupDate} ({tripDetails.pickupTime})
            </span>
            <span>
              {distanceKm} km &bull; {modeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Contact Fields */}
      <div className="space-y-3 pt-1">
        {/* Honeypot field (hidden from real users to catch bots) */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="opacity-0 absolute -z-10 w-0 h-0 pointer-events-none"
        />

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Your Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. Anand Kumar"
            className={`w-full h-12 px-3.5 bg-slate-50 border rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              errors.name ? "border-red-500 bg-red-50/50" : "border-slate-200"
            }`}
          />
          {errors.name && (
            <p className="text-[10px] text-red-500 mt-1 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            10-Digit Mobile Number
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-slate-400">
              +91
            </span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="9876543210"
              className={`w-full h-12 pl-12 pr-3 bg-slate-50 border rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.phone ? "border-red-500 bg-red-50/50" : "border-slate-200"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="text-[10px] text-red-500 mt-1 font-medium">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleConfirmWhatsApp}
          disabled={isSubmittingBooking}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmittingBooking ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.205 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.107 4.041 4.103-1.092z" />
              </svg>
              Confirm on WhatsApp
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCallToBook}
          disabled={isSubmittingBooking}
          className="w-full h-12 min-h-[44px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-60"
        >
          <svg
            className="w-4 h-4 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          Call to book — {siteConfig.phoneDisplay}
        </button>
      </div>
    </div>
  );
}
