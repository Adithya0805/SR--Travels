"use client";

import { useEffect, useState } from "react";
import { useBookingStore, SavedBookingRecord } from "@/store/useBookingStore";

interface TripsViewProps {
  onSelectTripToRefill: () => void;
}

export default function TripsView({ onSelectTripToRefill }: TripsViewProps) {
  const [trips, setTrips] = useState<SavedBookingRecord[]>([]);
  const { rebook } = useBookingStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sr_travels_bookings");
      if (stored) {
        setTrips(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to read bookings from localStorage:", err);
    }
  }, []);

  const handleRefillTrip = (record: SavedBookingRecord) => {
    rebook(record);
    onSelectTripToRefill();
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-10 space-y-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100">
        <h2 className="text-base font-black text-slate-900">Your Trips</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tap any past trip to quickly refill the booking form
        </p>

        {trips.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-600">No past bookings yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Completed reservations will be saved locally on your device for easy 1-tap rebooking.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {trips.map((b) => (
              <div
                key={b.bookingId}
                onClick={() => handleRefillTrip(b)}
                className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all cursor-pointer shadow-sm space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600">{b.bookingId}</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    ₹{b.totalFare?.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                    <span className="truncate">{b.pickup?.label || b.pickup?.address}</span>
                    <span className="text-amber-500 shrink-0">&rarr;</span>
                    <span className="truncate">{b.drop?.label || b.drop?.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      {b.date} ({b.tripType === "round-trip" ? "Round Trip" : "One Way"})
                    </span>
                    <span className="text-emerald-700 font-extrabold group-hover:underline flex items-center gap-1">
                      <span>Refill trip</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
