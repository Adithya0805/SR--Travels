"use client";

import { useState, useEffect } from "react";
import { siteConfig, Vehicle } from "@/config/siteConfig";
import { useBookingStore, SavedBookingRecord } from "@/store/useBookingStore";

type ActiveTab = "bookings" | "tariff" | "help" | "contact";

export default function SideDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("bookings");
  const [pastBookings, setPastBookings] = useState<SavedBookingRecord[]>([]);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const { rebook } = useBookingStore();

  // Read past bookings from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("sr_travels_bookings");
        if (stored) {
          setPastBookings(JSON.parse(stored));
        } else {
          setPastBookings([]);
        }
      } catch (err) {
        console.error("Failed to read bookings from localStorage:", err);
      }
    }
  }, [isOpen]);

  const handleRebook = (record: SavedBookingRecord) => {
    rebook(record);
    setIsOpen(false);
  };

  const faqItems = [
    {
      q: "How is the taxi fare calculated?",
      a: `For 'With Driver' trips, fare is calculated as Billable KM × Rate per KM + Driver Bata (₹${siteConfig.driverBataPerDay}/day). Minimum floors apply (130 km for one-way, 250 km for round-trip). For 'Self Drive', daily rental rates apply with extra charges beyond the daily KM cap.`,
    },
    {
      q: "Are tolls and state entry permits included?",
      a: "No, toll gate charges, parking fees, and inter-state entry permits are extra and should be paid as per actuals during the trip.",
    },
    {
      q: "What payment options are available?",
      a: "You can pay directly to the driver via Cash or Google Pay / PhonePe / UPI at the end of your trip.",
    },
    {
      q: "What is the cancellation policy?",
      a: siteConfig.cancellationPolicy,
    },
  ];

  return (
    <>
      {/* Top-Left Hamburger Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu drawer"
        className="fixed top-4 left-4 z-20 w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-800 active:scale-95 transition-all select-none"
      >
        <svg
          className="w-5 h-5 text-slate-800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Drawer Overlay & Content */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex select-none animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Slide-Out Drawer Panel */}
          <div className="relative z-50 w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-black tracking-wide text-emerald-400">
                  {siteConfig.businessName}
                </h2>
                <p className="text-[10px] text-slate-400">
                  {siteConfig.serviceRegion} Taxi & Rental
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("bookings")}
                className={`py-3 px-1 text-center transition-colors ${
                  activeTab === "bookings"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-500 font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Bookings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tariff")}
                className={`py-3 px-1 text-center transition-colors ${
                  activeTab === "tariff"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-500 font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Tariff
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("help")}
                className={`py-3 px-1 text-center transition-colors ${
                  activeTab === "help"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-500 font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className={`py-3 px-1 text-center transition-colors ${
                  activeTab === "contact"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-500 font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Contact
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* TAB 1: MY BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    My Past Bookings
                  </h3>

                  {pastBookings.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                      <p className="font-semibold">No bookings found</p>
                      <p className="text-[10px]">Your completed taxi reservations will appear here.</p>
                    </div>
                  ) : (
                    pastBookings.map((b) => {
                      const isExpanded = expandedBookingId === b.bookingId;
                      return (
                        <div
                          key={b.bookingId}
                          onClick={() =>
                            setExpandedBookingId(isExpanded ? null : b.bookingId)
                          }
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 cursor-pointer transition-all hover:border-slate-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-600">
                              {b.bookingId}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ₹{b.totalFare?.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 space-y-0.5 truncate">
                            <div className="font-semibold truncate">
                              {b.pickup?.shortName || b.pickup?.displayName} &rarr;{" "}
                              {b.drop?.shortName || b.drop?.displayName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {b.selectedVehicle?.name} &bull; {b.distanceKm} km
                            </div>
                          </div>

                          {/* Expanded Details & Rebook CTA */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-200/60 space-y-2 text-[10px] text-slate-600 animate-in fade-in">
                              <div className="flex justify-between">
                                <span>Customer: {b.customerName}</span>
                                <span>Phone: {b.customerPhone}</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRebook(b);
                                }}
                                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-transform"
                              >
                                Rebook Trip
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: TARIFF */}
              {activeTab === "tariff" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Vehicle Tariff Card
                  </h3>

                  {siteConfig.vehicles.map((v: Vehicle) => (
                    <div
                      key={v.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>{v.name}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {v.seats} Seats
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>With Driver Rate:</span>
                          <span className="font-bold text-slate-800">₹{v.ratePerKm}/km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Self Drive Daily Rate:</span>
                          <span className="font-bold text-slate-800">₹{v.ratePerDay}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Extra KM Charge:</span>
                          <span className="font-bold text-slate-800">₹{v.extraKmRate}/km</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-[10px] text-emerald-900 space-y-1">
                    <p><strong>Driver Bata:</strong> ₹{siteConfig.driverBataPerDay}/day</p>
                    <p><strong>Min KM:</strong> {siteConfig.minKmOneWay} km (One Way) / {siteConfig.minKmRoundTrip} km (Round Trip)</p>
                  </div>
                </div>
              )}

              {/* TAB 3: HELP / FAQ */}
              {activeTab === "help" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Help & FAQs
                  </h3>

                  <div className="space-y-2">
                    {faqItems.map((item, idx) => {
                      const isFaqExpanded = expandedFaq === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setExpandedFaq(isFaqExpanded ? null : idx)}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-3 cursor-pointer text-xs transition-colors"
                        >
                          <div className="font-bold text-slate-800 flex justify-between items-center">
                            <span>{item.q}</span>
                            <span className="text-slate-400 ml-1">
                              {isFaqExpanded ? "−" : "+"}
                            </span>
                          </div>

                          {isFaqExpanded && (
                            <p className="mt-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 leading-relaxed animate-in fade-in">
                              {item.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACT */}
              {activeTab === "contact" && (
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Contact Customer Support
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Available 24/7 for booking assistance
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <a
                      href={`https://wa.me/${siteConfig.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.205 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.107 4.041 4.103-1.092z" />
                      </svg>
                      Chat on WhatsApp ({siteConfig.whatsapp})
                    </a>

                    <a
                      href={`tel:${siteConfig.phone}`}
                      className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
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
                      Call Customer Support ({siteConfig.phone})
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
